import { useGameStore } from '../state/store'

export function SettingsPanel() {
  const ui = useGameStore(s=>s.ui)
  const toggle = useGameStore(s=>s.toggleAutoPlay)
  return (
    <div className="grid" style={{gap:16}}>
      <h2>Settings</h2>
      <div className="field">
        <label>Auto-Play Mode</label>
        <button onClick={toggle}>{ui.autoPlay ? 'Disable' : 'Enable'} Auto-Play</button>
      </div>
      <div className="field">
        <label>Theme</label>
        <div className="tag purple">Black / Purple / Pink</div>
      </div>
    </div>
  )
}

