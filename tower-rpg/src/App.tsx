import { useEffect } from 'react'
import './index.css'
import { useGameStore } from './state/store'
import { TowerPanel } from './panels/TowerPanel'
import { PartyPanel } from './panels/PartyPanel'
import { GearPanel } from './panels/GearPanel'
import { ForgePanel } from './panels/ForgePanel'
import { SettingsPanel } from './panels/SettingsPanel'
import { ShopPanel } from './panels/ShopPanel'
import { BrixaPanel } from './panels/BrixaPanel'

function App() {
  const ui = useGameStore(s => s.ui)
  const setActivePanel = useGameStore(s => s.setActivePanel)
  const initialize = useGameStore(s => s.initialize)

  useEffect(() => { initialize() }, [initialize])

  const panels = [
    { key: 'tower', label: 'Tower', node: <TowerPanel /> },
    { key: 'party', label: 'Party', node: <PartyPanel /> },
    { key: 'gear', label: 'Gear', node: <GearPanel /> },
    { key: 'forge', label: 'Forge', node: <ForgePanel /> },
    { key: 'shop', label: 'Shop', node: <ShopPanel /> },
    { key: 'settings', label: 'Settings', node: <SettingsPanel /> },
    { key: 'brixa', label: 'Brixa', node: <BrixaPanel /> },
  ] as const

  if (!ui.username) {
    return <PartyPanel mode="onboarding" />
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">Eternal Tower</div>
        <div className="nav">
          {panels.map(p => (
            <button key={p.key} className={ui.activePanel === p.key ? 'active' : ''} onClick={() => setActivePanel(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span className="tag purple">Floor {ui.floor}</span>
          <span className="tag pink">Gold {ui.gold}</span>
        </div>
      </div>
      <div className="content">
        <div className="sidebar">
          <div className="field">
            <label>Auto-Play</label>
            <button onClick={() => useGameStore.getState().toggleAutoPlay()}>
              {ui.autoPlay ? 'Disable' : 'Enable'} Auto-Play
            </button>
          </div>
          <div className="field">
            <label>Username</label>
            <div className="tag">{ui.username}</div>
          </div>
        </div>
        <div className="panel" style={{minHeight: 520}}>
          {panels.find(p => p.key === ui.activePanel)?.node}
        </div>
      </div>
    </div>
  )
}

export default App
