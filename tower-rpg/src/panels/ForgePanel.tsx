import { useGameStore } from '../state/store'

export function ForgePanel() {
  const recipes = useGameStore(s=>s.recipes)
  const materials = useGameStore(s=>s.inventory.materials)
  const craft = useGameStore(s=>s.craftRecipe)

  return (
    <div className="grid" style={{gap:16}}>
      <h2>Forge</h2>
      <div className="grid cols-3">
        {recipes.slice(0,30).map(r => (
          <div key={r.id} className="item-card">
            <div className={`item-icon rarity-${r.rarity.toLowerCase()}`}>⚒️</div>
            <div>
              <div style={{fontWeight:700}}>{r.name}</div>
              <div style={{fontSize:12, opacity:0.8}}>Inputs: {r.inputs.map(i=>`${i.qty}x ${materials.find(m=>m.id===i.materialId)?.name ?? i.materialId}`).join(', ')}</div>
            </div>
            <div><button onClick={()=>craft(r.id)}>Craft</button></div>
          </div>
        ))}
      </div>
    </div>
  )
}

