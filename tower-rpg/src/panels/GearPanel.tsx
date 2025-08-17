import { useMemo, useState } from 'react'
import { useGameStore, rarityClass } from '../state/store'
import type { Gem } from '../state/types'

export function GearPanel() {
  const heroes = useGameStore(s=>s.heroes)
  const inv = useGameStore(s=>s.inventory)
  const equipGear = useGameStore(s=>s.equipGear)
  const socketGem = useGameStore(s=>s.socketGem)
  const unsocketGem = useGameStore(s=>s.unsocketGem)
  const [selectedHero, setSelectedHero] = useState<string | null>(heroes[0]?.id ?? null)
  const hero = useMemo(()=>heroes.find(h=>h.id===selectedHero) ?? heroes[0], [selectedHero, heroes])

  // slot filtering can be added later

  return (
    <div className="grid" style={{gap:16}}>
      <div className="grid cols-4" style={{alignItems:'center'}}>
        <div className="field">
          <label>Hero</label>
          <select value={hero?.id} onChange={e=>setSelectedHero(e.target.value)}>
            {heroes.map(h=> <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
        <div className="tag">Click to equip items; socket gems by clicking socket slots</div>
      </div>

      <div className="grid cols-2">
        <div className="panel">
          <h3>Equipped</h3>
          <div className="grid cols-2" style={{marginTop:8}}>
            {Object.entries(hero?.equipment ?? {}).map(([slot, id]) => {
              const g = inv.gear.find(x=>x.id===id)
              if (!g) return null
              return (
                <div key={slot} className="item-card">
                  <div className={`item-icon ${rarityClass(g.rarity)}`}>🗡️</div>
                  <div>
                    <div style={{fontWeight:700}}>{g.name}</div>
                    <div style={{fontSize:12, opacity:0.8}}>{slot}</div>
                    <div style={{display:'flex', gap:6, marginTop:6, flexWrap:'wrap'}}>
                      {g.sockets.length===0 && <span className="tag">No sockets</span>}
                      {g.sockets.map((s, idx) => (
                        <button key={idx} onClick={() => s.id ? unsocketGem(g.id, idx) : undefined} className="tag pink" title={s.id? 'Click to unsocket' : 'Empty socket'}>
                          {s.id ? '💎' : '○'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div><button onClick={()=>equipGear(hero!.id, g.id)}>Equip</button></div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="panel">
          <h3>Inventory</h3>
          <div className="grid cols-2" style={{marginTop:8}}>
            {inv.gear.map(g => (
              <div key={g.id} className="item-card" title={`${g.name} • ${g.slot} • ${g.rarity}`}>
                <div className={`item-icon ${rarityClass(g.rarity)}`}>🛡️</div>
                <div>
                  <div style={{fontWeight:700}}>{g.name}</div>
                  <div style={{fontSize:12, opacity:0.8}}>{g.slot}</div>
                  <div style={{display:'flex', gap:6, marginTop:6, flexWrap:'wrap'}}>
                    {g.sockets.length===0 && <span className="tag">No sockets</span>}
                    {g.sockets.map((s, idx) => (
                      <span key={idx} className="tag" title={s.id ? 'Filled' : 'Empty'}>{s.id ? '💎' : '○'}</span>
                    ))}
                  </div>
                </div>
                <div><button onClick={()=>equipGear(hero!.id, g.id)}>Equip</button></div>
              </div>
            ))}
          </div>

          <h3 style={{marginTop:16}}>Gems</h3>
          <div className="grid cols-3" style={{marginTop:8}}>
            {inv.gems.map((gem: Gem) => (
              <div key={gem.id} className="item-card" title={`${gem.name} • ${gem.type} +${gem.value}`}>
                <div className={`item-icon ${rarityClass(gem.rarity)}`}>💎</div>
                <div>
                  <div style={{fontWeight:700}}>{gem.name}</div>
                  <div style={{fontSize:12, opacity:0.8}}>{gem.type} +{gem.value}</div>
                </div>
                <div>
                  {/* Simple socketing: apply to first item with empty socket */}
                  <button onClick={()=>{
                    const target = inv.gear.find(x=>x.sockets.some(s=>s.id==null))
                    if (target) {
                      const idx = target.sockets.findIndex(s=>s.id==null)
                      socketGem(target.id, gem.id, idx)
                    }
                  }}>Socket</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

