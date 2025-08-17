import { useEffect, useState } from 'react'

export function BrixaPanel() {
  const [health, setHealth] = useState<string>('checking...')
  const [fee, setFee] = useState<string>('')
  const [rpcResult, setRpcResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const BRIDGE = (import.meta as any).env?.VITE_BRIDGE_URL || 'http://localhost:8088'

  useEffect(() => {
    fetch(`${BRIDGE}/health`).then(r=>r.json()).then(d=>{
      setHealth(JSON.stringify(d))
    }).catch(()=>setHealth('unreachable'))
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
          <h3>LN GetInfo</h3>
          <a className="tag" href={`${BRIDGE}/ln/getinfo`} target="_blank">Open</a>
        </div>
      </div>
      {error && <div className="tag" style={{borderColor:'red'}}>{error}</div>}
    </div>
  )
}

