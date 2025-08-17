import { useState } from 'react'
import { useGameStore } from '../state/store'

const PERKS = [
  { id: 'loot_boost_10', name: 'Loot Boost +10%', price_sats: 5000, desc: 'Increases drop chance by 10%.' },
  { id: 'vip_title', name: 'VIP Title', price_sats: 2000, desc: 'Show off a VIP tag in party screen.' },
  { id: 'cosmetics_pack', name: 'Cosmetics Pack', price_sats: 3000, desc: 'Unlocks premium frames and backgrounds.' },
]

export function PremiumPanel() {
  const owned = useGameStore(s=>s.premium.ownedPerks)
  const grant = useGameStore(s=>s.grantPerk)
  const [invoice, setInvoice] = useState<string>('')
  const [pending, setPending] = useState<string>('')
  const BRIDGE = (import.meta as any).env?.VITE_BRIDGE_URL || 'http://localhost:8088'

  const buy = async (perkId: string, price_sats: number) => {
    setPending(perkId)
    try {
      const r = await fetch(`${BRIDGE}/ln/invoice`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ value_sat: price_sats, memo: `Perk:${perkId}` }) })
      const d = await r.json(); setInvoice(d.payment_request || '')
      // In a real app, poll for settlement then grant the perk
      setTimeout(() => { grant(perkId); setPending('') }, 2000)
    } catch { setPending('') }
  }

  return (
    <div className="grid" style={{gap:16}}>
      <h2>Premium Store</h2>
      <div className="grid cols-3">
        {PERKS.map(p => (
          <div key={p.id} className="panel">
            <div style={{fontWeight:700}}>{p.name}</div>
            <div style={{opacity:0.8, marginTop:6}}>{p.desc}</div>
            <div className="tag" style={{marginTop:6}}>{p.price_sats} sats</div>
            <div style={{marginTop:8}}>
              {owned.includes(p.id) ? <span className="tag">Owned</span> : <button disabled={pending===p.id} onClick={()=>buy(p.id, p.price_sats)}>Buy with Brixa (LN)</button>}
            </div>
          </div>
        ))}
      </div>
      {invoice && (
        <div className="panel">
          <div style={{fontWeight:700}}>Payment Request</div>
          <div className="tag" style={{maxWidth:600, overflow:'hidden', textOverflow:'ellipsis'}}>{invoice}</div>
        </div>
      )}
    </div>
  )
}

