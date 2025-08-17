import { useEffect, useMemo, useRef } from 'react'
import { useGameStore } from '../state/store'

export function TowerPanel() {
  const ui = useGameStore(s=>s.ui)
  const heroes = useGameStore(s=>s.heroes)
  const tower = useGameStore(s=>s.tower)
  const startBattle = useGameStore(s=>s.startBattle)
  const nextTurn = useGameStore(s=>s.nextTurn)

  useEffect(() => {
    if (!ui.autoPlay) return
    const id = setInterval(() => {
      const st = useGameStore.getState()
      if (!st.tower.inBattle) st.startBattle(); else st.nextTurn()
    }, 1000)
    return () => clearInterval(id)
  }, [ui.autoPlay])

  const monster = tower.monsters[0]
  const lore = useMemo(() => {
    const themes = ['Shadow', 'Frost', 'Ember', 'Gale', 'Mycelium', 'Aether', 'Obsidian']
    const adjectives = ['Whispering', 'Forgotten', 'Restless', 'Ancient', 'Shifting', 'Hollow', 'Singing']
    const t = themes[(ui.floor*7)%themes.length]
    const a = adjectives[(ui.floor*13)%adjectives.length]
    return `Floor ${ui.floor} echoes with ${a.toLowerCase()} ${t.toLowerCase()} currents.`
  }, [ui.floor])

  const logRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [tower.battleLog.length])

  return (
    <div className="grid cols-2" style={{alignItems:'start'}}>
      <div className="grid" style={{gap:16}}>
        <div>
          <h2>Tower Encounter</h2>
          <div style={{opacity:0.8, marginTop:4}}>{lore}</div>
        </div>
        <div className="item-card" style={{gridTemplateColumns:'72px 1fr auto', alignItems:'center'}}>
          <div className="item-icon rarity-epic" style={{width:64, height:64}}>{monster ? '👾' : '—'}</div>
          <div>
            <div style={{fontWeight:700}}>{monster ? monster.name : 'No enemy'}</div>
            {monster && (
              <div className="statbar" style={{marginTop:6}}><span style={{width: `${Math.max(0, Math.min(100, (monster.stats.vitality/ (monster.level*16))*100))}%`}} /></div>
            )}
          </div>
          <div style={{display:'grid', gap:8}}>
            {!tower.inBattle && <button onClick={startBattle}>Start Battle</button>}
            {tower.inBattle && !ui.autoPlay && <button onClick={nextTurn}>Step Turn</button>}
          </div>
        </div>
        <div>
          <h3>Party</h3>
          <div className="grid cols-2">
            {heroes.map(h => (
              <div key={h.id} className="item-card" style={{alignItems:'center'}}>
                <div className="avatar">{h.avatarUrl ? <img src={h.avatarUrl} alt={h.name} /> : '🛡️'}</div>
                <div>
                  <div style={{fontWeight:700}}>{h.name} <span style={{opacity:0.7, fontWeight:400}}>Lv {h.level}</span></div>
                  <div style={{opacity:0.8, fontSize:12}}>{h.classPrimary} / {h.classSecondary} • {h.row ?? 'Front'}</div>
                  <div className="statbar" style={{marginTop:6}}><span style={{width: `${Math.max(0, Math.min(100, ((h.currentHp ?? h.stats.vitality)/ (h.stats.vitality))*100))}%`}} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid" style={{gap:8}}>
        <h3>Battle Log</h3>
        <div style={{display:'flex', gap:8, marginBottom:6}}>
          <span className="tag">Turns: {tower.analytics?.turnsThisFight ?? 0}</span>
          <span className="tag">DPS avg: {tower.analytics?.dpsAvg ?? 0}</span>
          <span className="tag">Floors cleared: {tower.analytics?.floorsCleared ?? 0}</span>
        </div>
        <div ref={logRef} className="battle-log">
          {tower.battleLog.map(e => (
            <div key={e.id} style={{opacity:0.95}}>{e.text}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

