import { useGameStore } from '../state/store'

export function ShopPanel() {
  const items = useGameStore(s=>s.shop.items)
  const gold = useGameStore(s=>s.ui.gold)
  const buy = useGameStore(s=>s.buyShopItem)
  const reroll = useGameStore(s=>s.rerollShop)

  return (
    <div className="grid" style={{gap:16}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2>Shop</h2>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <div className="tag pink">Gold {gold}</div>
          <button onClick={reroll}>Reroll</button>
        </div>
      </div>
      <div className="grid cols-3">
        {items.map(i => (
          <div key={i.id} className="item-card">
            <div className="item-icon">{i.kind==='gear'?'🛡️': i.kind==='gem'?'💎': i.kind==='potion'?'🧪':'📦'}</div>
            <div>
              <div style={{fontWeight:700}}>{i.kind.toUpperCase()}</div>
              <div style={{fontSize:12, opacity:0.8}}>${i.price}</div>
            </div>
            <div><button onClick={()=>buy(i.id)}>Buy</button></div>
          </div>
        ))}
      </div>
    </div>
  )
}

