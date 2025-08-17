Brixa (BRXA) Dev Stack

This scaffold integrates a Bitcoin Core regtest node, Lightning (LND), an AI service, and a bridge API.

Quick start
- Requires Docker + Docker Compose.
- From this folder: `docker compose up -d`
- Bridge API: http://localhost:8088
- AI service: http://localhost:8090
- LND REST: http://localhost:8080 (dev only)
- bitcoind RPC: http://localhost:18443 (user:pass)

Bridge endpoints
- POST /rpc { method, params } -> forwards to bitcoind JSON-RPC.
- GET /ai/fee?target_blocks=3 -> AI fee advice.
- GET /ai/route?dest_pubkey=... -> AI route score.
- GET /ln/getinfo -> LND info (no auth in dev; secure in prod).

Notes
- This uses regtest and standard images; rebranding to Brixa Core with custom magic bytes and binaries happens in a separate fork (see plan in README root).
- The AI subscribes to RPCs and can be expanded to stream ZMQ for live learning.
