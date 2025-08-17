import { useEffect, useState } from 'react'

export function BrixaPanel() {
  const [health, setHealth] = useState<string>('checking...')
  const [fee, setFee] = useState<string>('')
  const [rpcResult, setRpcResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [balance, setBalance] = useState<string>('')
  const [address, setAddress] = useState<string>('')
  const [sendTo, setSendTo] = useState<string>('')
  const [sendAmt, setSendAmt] = useState<string>('0.0001')
  const [txid, setTxid] = useState<string>('')
  const [inv, setInv] = useState<{ payment_request?: string; r_hash?: string } | null>(null)
  const [invAmt, setInvAmt] = useState<string>('1000')

  const BRIDGE = (import.meta as any).env?.VITE_BRIDGE_URL || 'http://localhost:8088'

  useEffect(() => {
    fetch(`${BRIDGE}/health`).then(r=>r.json()).then(d=>{
      setHealth(JSON.stringify(d))
    }).catch(()=>setHealth('unreachable'))
    fetch(`${BRIDGE}/wallet/balance`).then(r=>r.json()).then(d=>setBalance(String(d.balance ?? ''))).catch(()=>{})
  }, [])

  const checkFee = async () => {
    try {
      const r = await fetch(`${BRIDGE}/ai/fee?target_blocks=3`)
      const d = await r.json()
      setFee(`${d.sats_per_vb} sat/vB (${d.rationale})`)
    } catch (e:any) { setError(String(e)) }
  }

  const getBlockchainInfo = async () => {
    setError('')
    try {
      const r = await fetch(`${BRIDGE}/rpc`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ method: 'getblockchaininfo', params: [] }) })
      const d = await r.json()
      setRpcResult(d)
    } catch (e:any) { setError(String(e)) }
  }
  const genAddress = async () => {
    setError('')
    try {
      const r = await fetch(`${BRIDGE}/wallet/address`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'bech32' }) })
      const d = await r.json(); setAddress(d.address)
    } catch (e:any) { setError(String(e)) }
  }
  const send = async () => {
    setError('')
    try {
      const r = await fetch(`${BRIDGE}/wallet/send`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ address: sendTo, amount: Number(sendAmt) }) })
      const d = await r.json(); setTxid(d.txid || '')
    } catch (e:any) { setError(String(e)) }
  }
  const createInvoice = async () => {
    setError('')
    try {
      const r = await fetch(`${BRIDGE}/ln/invoice`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ value_sat: Number(invAmt), memo: 'Eternal Tower' }) })
      const d = await r.json(); setInv(d)
    } catch (e:any) { setError(String(e)) }
  }

  return (
    <div className="grid" style={{gap:16}}>
      <h2>Brixa Chain & Lightning</h2>
      <div className="panel">
        <div>Bridge: <span className="tag">{BRIDGE}</span></div>
        <div style={{marginTop:8}}>Health: <span className="tag pink">{health}</span></div>
      </div>
      <div className="grid cols-3">
        <div className="panel">
          <h3>AI Fee Advice</h3>
          <button onClick={checkFee}>Estimate Fee</button>
          {fee && <div style={{marginTop:8}}>{fee}</div>}
        </div>
        <div className="panel">
          <h3>Blockchain Info</h3>
          <button onClick={getBlockchainInfo}>getblockchaininfo</button>
          {rpcResult && <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(rpcResult, null, 2)}</pre>}
        </div>
        <div className="panel">
          <h3>Wallet</h3>
          <div>Balance: <span className="tag">{balance}</span> BRXA</div>
          <div style={{marginTop:8}}>
            <button onClick={genAddress}>New Address</button> {address && <span className="tag">{address}</span>}
          </div>
          <div className="grid" style={{marginTop:8}}>
            <label>Send</label>
            <input className="input" placeholder="address" value={sendTo} onChange={e=>setSendTo(e.target.value)} />
            <input className="input" placeholder="amount (BRXA)" value={sendAmt} onChange={e=>setSendAmt(e.target.value)} />
            <button onClick={send}>Send BRXA</button>
            {txid && <div className="tag">TXID: {txid}</div>}
          </div>
        </div>
      </div>
      <div className="panel">
        <h3>Lightning Invoice</h3>
        <div className="grid cols-3" style={{alignItems:'end'}}>
          <div className="field">
            <label>Amount (sats)</label>
            <input className="input" value={invAmt} onChange={e=>setInvAmt(e.target.value)} />
          </div>
          <div><button onClick={createInvoice}>Create Invoice</button></div>
          {inv?.payment_request && <div className="field"><label>Invoice</label><div className="tag" style={{maxWidth:320, overflow:'hidden', textOverflow:'ellipsis'}}>{inv.payment_request}</div></div>}
        </div>
      </div>
      {error && <div className="tag" style={{borderColor:'red'}}>{error}</div>}
    </div>
  )
}

