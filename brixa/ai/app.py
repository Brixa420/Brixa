from fastapi import FastAPI
from pydantic import BaseModel
import os
import httpx

BITCOIN_RPC_URL = os.getenv("BITCOIN_RPC_URL", "http://user:pass@localhost:18443")
LND_REST_URL = os.getenv("LND_REST_URL", "http://localhost:8080")

app = FastAPI(title="Brixa AI Service")

class FeeAdvice(BaseModel):
    target_blocks: int
    sats_per_vb: float
    rationale: str

class RouteAdvice(BaseModel):
    dest_pubkey: str
    score: float
    rationale: str

@app.get("/health")
async def health():
    ok = True
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            await client.get(f"{LND_REST_URL}/v1/getinfo")
    except Exception:
        pass
    return {"ok": ok}

@app.get("/ai/fee", response_model=FeeAdvice)
async def fee_advice(target_blocks: int = 3):
    sats_per_vb = 15.0
    rationale = "Default heuristic; swap to learned model later."
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            payload = {"jsonrpc":"1.0","id":"ai","method":"estimatesmartfee","params":[target_blocks]}
            resp = await client.post(BITCOIN_RPC_URL, json=payload)
            if resp.status_code == 200:
                est = resp.json().get("result", {}).get("feerate")
                if est:
                    sats_per_vb = max(1.0, est * 100_000_000 / 1000)
                    rationale = "bitcoind estimatesmartfee"
    except Exception:
        pass
    return FeeAdvice(target_blocks=target_blocks, sats_per_vb=sats_per_vb, rationale=rationale)

@app.get("/ai/route", response_model=RouteAdvice)
async def route_advice(dest_pubkey: str):
    return RouteAdvice(dest_pubkey=dest_pubkey, score=0.5, rationale="Baseline score; integrate topology + history.")
