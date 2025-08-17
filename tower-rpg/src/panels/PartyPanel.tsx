import { useState } from 'react'
import { useGameStore } from '../state/store'
import type { ClassName } from '../state/types'

const allClasses: ClassName[] = ['Warrior','Monk','Paladin','Cleric','Ranger','Mage','Wizard','Warlock','Beaver','Bard','Artificer']

export function PartyPanel({ mode }: { mode?: 'onboarding' }) {
  const ui = useGameStore(s=>s.ui)
  const heroes = useGameStore(s=>s.heroes)
  const setUsername = useGameStore(s=>s.setUsername)
  const uploadAvatar = useGameStore(s=>s.uploadAvatar)

  const [draftName, setDraftName] = useState(ui.username ?? '')

  const updateClass = (heroId: string, primary: boolean, cls: ClassName) => {
    const s = useGameStore.getState()
    const h = s.heroes.find(h=>h.id===heroId); if (!h) return
    if (primary) h.classPrimary = cls; else h.classSecondary = cls
    h.stats = { ...h.stats } // trigger
    useGameStore.setState({ heroes: [...s.heroes] })
  }

  const updateName = (heroId: string, name: string) => {
    const s = useGameStore.getState(); const h = s.heroes.find(h=>h.id===heroId); if (!h) return
    h.name = name; useGameStore.setState({ heroes: [...s.heroes] })
  }

  const onChooseUser = () => { if (draftName.trim()) setUsername(draftName.trim()) }

  return (
    <div className="grid" style={{gap:16}}>
      {mode==='onboarding' && (
        <div className="panel" style={{padding:16}}>
          <h2>Welcome to Eternal Tower</h2>
          <div className="grid cols-3" style={{marginTop:12, alignItems:'end'}}>
            <div className="field">
              <label>Pick a username</label>
              <input className="input" placeholder="Your unique name" value={draftName} onChange={e=>setDraftName(e.target.value)} />
            </div>
            <div className="field">
              <label>Auto-Play</label>
              <div className="tag">Runs 24/7; you can disable anytime</div>
            </div>
            <div><button onClick={onChooseUser} disabled={!draftName.trim()}>Continue</button></div>
          </div>
        </div>
      )}
      <h2>Party Setup</h2>
      <div className="grid cols-2">
        {heroes.map(h => (
          <div key={h.id} className="panel">
            <div className="grid cols-3" style={{alignItems:'center'}}>
              <div className="avatar">{h.avatarUrl ? <img src={h.avatarUrl} alt={h.name} /> : '🙂'}</div>
              <div className="field">
                <label>Name</label>
                <input className="input" value={h.name} onChange={e=>updateName(h.id, e.target.value)} />
              </div>
              <div className="field">
                <label>Upload Portrait</label>
                <input type="file" accept="image/*" onChange={(e)=>{
                  const f = e.target.files?.[0]; if (!f) return
                  const url = URL.createObjectURL(f)
                  uploadAvatar(h.id, url)
                }} />
              </div>
            </div>
            <div className="grid cols-2" style={{marginTop:12}}>
              <div className="field">
                <label>Primary Class</label>
                <select value={h.classPrimary} onChange={e=>updateClass(h.id, true, e.target.value as ClassName)}>
                  {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Secondary Class</label>
                <select value={h.classSecondary} onChange={e=>updateClass(h.id, false, e.target.value as ClassName)}>
                  {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid cols-2" style={{marginTop:12}}>
              <div className="field">
                <label>Formation Row</label>
                <select value={h.row ?? 'Front'} onChange={e=>useGameStore.getState().setRow?.(h.id, e.target.value as any)}>
                  <option>Front</option>
                  <option>Back</option>
                </select>
              </div>
              <div className="field">
                <label>Bonuses</label>
                <div className="tag">Front: +10% Power, -5% Defense</div>
                <div className="tag" style={{marginTop:6}}>Back: +10% Magic, -5% Power</div>
              </div>
            </div>
            <div style={{marginTop:8, fontSize:12, opacity:0.9}}>
              Power {h.stats.power} • Defense {h.stats.defense} • Vitality {h.stats.vitality}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}