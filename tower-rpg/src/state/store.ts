import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { produce } from 'immer'
import { v4 as uuid } from 'uuid'
import type { BattleEvent, ClassName, GameState, Gear, Gem, Monster, Rarity, Recipe, Stats, UIState } from './types'
import { rarityValue as rarityToValue } from './types'

const baseStatsByClass: Record<ClassName, Stats> = {
  Warrior: { power: 10, defense: 10, vitality: 12, critRate: 5, critDamage: 50, haste: 5, magic: 0, stunChance: 5 },
  Monk: { power: 9, defense: 8, vitality: 10, critRate: 10, critDamage: 75, haste: 12, magic: 0, stunChance: 8 },
  Paladin: { power: 9, defense: 12, vitality: 12, critRate: 5, critDamage: 50, haste: 4, magic: 2, stunChance: 6 },
  Cleric: { power: 5, defense: 7, vitality: 9, critRate: 5, critDamage: 50, haste: 6, magic: 12, stunChance: 2 },
  Ranger: { power: 11, defense: 8, vitality: 9, critRate: 10, critDamage: 75, haste: 10, magic: 0, stunChance: 5 },
  Mage: { power: 6, defense: 6, vitality: 8, critRate: 8, critDamage: 75, haste: 6, magic: 14, stunChance: 3 },
  Wizard: { power: 6, defense: 6, vitality: 8, critRate: 8, critDamage: 75, haste: 6, magic: 14, stunChance: 3 },
  Warlock: { power: 7, defense: 7, vitality: 9, critRate: 7, critDamage: 70, haste: 6, magic: 13, stunChance: 5 },
  Beaver: { power: 8, defense: 9, vitality: 12, critRate: 6, critDamage: 60, haste: 7, magic: 1, stunChance: 6 },
  Bard: { power: 6, defense: 7, vitality: 9, critRate: 8, critDamage: 70, haste: 10, magic: 6, stunChance: 4 },
  Artificer: { power: 8, defense: 8, vitality: 10, critRate: 7, critDamage: 70, haste: 8, magic: 8, stunChance: 6 },
}

const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj))

function baseStats(primary: ClassName, secondary: ClassName): Stats {
  const a = baseStatsByClass[primary]
  const b = baseStatsByClass[secondary]
  return {
    power: Math.round((a.power + b.power) * 0.55),
    defense: Math.round((a.defense + b.defense) * 0.55),
    vitality: Math.round((a.vitality + b.vitality) * 0.55),
    critRate: Math.round((a.critRate + b.critRate) * 0.55),
    critDamage: Math.round((a.critDamage + b.critDamage) * 0.55),
    haste: Math.round((a.haste + b.haste) * 0.55),
    magic: Math.round((a.magic + b.magic) * 0.55),
    stunChance: Math.round((a.stunChance + b.stunChance) * 0.55),
  }
}

function socketsForRarity(rarity: Rarity): number {
  switch (rarity) {
    case 'Common': return 0
    case 'Rare': return 1
    case 'Epic': return 2
    case 'Legendary': return 3
    case 'Mythic': return 4
  }
}

function statFromGem(type: Gem['type'], base: number): Partial<Stats> {
  switch (type) {
    case 'Power': return { power: base }
    case 'Defense': return { defense: base }
    case 'Vitality': return { vitality: base }
    case 'Crit': return { critRate: base / 2, critDamage: base * 2 }
    case 'Stun': return { stunChance: Math.min(50, base / 2) }
    case 'Haste': return { haste: base }
    case 'Magic': return { magic: base }
  }
}

function sumStats(a: Stats, b: Partial<Stats>): Stats {
  return {
    power: a.power + (b.power ?? 0),
    defense: a.defense + (b.defense ?? 0),
    vitality: a.vitality + (b.vitality ?? 0),
    critRate: a.critRate + (b.critRate ?? 0),
    critDamage: a.critDamage + (b.critDamage ?? 0),
    haste: a.haste + (b.haste ?? 0),
    magic: a.magic + (b.magic ?? 0),
    stunChance: a.stunChance + (b.stunChance ?? 0),
  }
}

function computeHeroStats(hero: GameState['heroes'][number], state: GameState): Stats {
  let s = deepClone(hero.stats)
  const equippedGear = Object.values(hero.equipment).map(id => state.inventory.gear.find(g => g.id === id)).filter(Boolean) as Gear[]
  for (const gear of equippedGear) {
    const baseVal = rarityToValue[gear.rarity]
    s = sumStats(s, { power: gear.slot === 'Sword' ? baseVal : 0, defense: gear.slot !== 'Sword' ? baseVal : 0 })
    for (const gemId of gear.socketedGems) {
      const gem = state.inventory.gems.find(g => g.id === gemId)
      if (gem) s = sumStats(s, statFromGem(gem.type, gem.value))
    }
  }
  // Luna special item
  if (state.ui.username === 'Luna' && hero === state.heroes[0]) {
    s.critDamage += 100
    s.critRate += 100
  }
  return s
}

function randomMonster(floor: number, isBoss: boolean): Monster {
  const level = floor + (isBoss ? 3 : 0)
  const statBase = 8 + Math.floor(floor / 10)
  const stats: Stats = {
    power: statBase + (isBoss ? 8 : 0),
    defense: statBase,
    vitality: statBase * 2,
    critRate: 5 + Math.floor(floor / 50),
    critDamage: 50 + Math.floor(floor / 25) * 5,
    haste: 5 + Math.floor(floor / 30),
    magic: statBase,
    stunChance: isBoss ? 8 : 4,
  }
  const species = ['Goblin','Skeleton','Orc','Slime','Wraith','Spider','Wolf','Construct','Cultist','Elemental']
  const name = `${isBoss ? 'Boss ' : ''}${species[Math.floor(Math.random()*species.length)]}`
  return { id: uuid(), name, level, stats, isBoss }
}

function generateInitialRecipes(): Recipe[] {
  const rarities: Rarity[] = ['Common','Rare','Epic','Legendary','Mythic']
  const results: Recipe[] = []
  for (let i=0;i<30;i++) {
    const rarity = i === 0 ? 'Mythic' : rarities[Math.min(rarities.length-1, Math.floor(Math.random()*4)+1)]
    const outType: 'gear' | 'gem' = Math.random()<0.5 ? 'gear' : 'gem'
    const id = uuid()
    const matId = `mat-${(i%10)+1}`
    const inputs = [{ materialId: matId, qty: 2 + (rarities.indexOf(rarity)) }]
    const output = outType === 'gear' ? { type: 'gear' as const, payload: { slot: ['Sword','Head','Chest','Greaves','Boots','Amulet','Ring','Shield'][i%8], rarity } } : { type: 'gem' as const, payload: { type: ['Power','Defense','Vitality','Crit','Stun','Haste','Magic'][i%7], rarity } }
    results.push({ id, name: `${rarity} ${outType==='gear'?'Gear':'Gem'} Recipe ${i+1}`, rarity, inputs, output })
  }
  return results
}

//

export const useGameStore = create<GameState>()(devtools((set, get) => ({
  ui: { username: null, activePanel: 'party', floor: 1, autoPlay: true, gold: 0 } as UIState,
  heroes: [],
  inventory: { gear: [], gems: [], materials: [], potions: { revive: 0 } },
  recipes: [],
  shop: { items: [] },
  tower: { monsters: [], battleLog: [], turn: 1, inBattle: false },

  initialize: () => set(produce<GameState>(state => {
    if (state.recipes.length === 0) state.recipes = generateInitialRecipes()
    if (state.inventory.materials.length === 0) {
      for (let i=1;i<=12;i++) state.inventory.materials.push({ id: `mat-${i}`, name: `Material ${i}`, rarity: i%5===0?'Legendary': i%7===0?'Epic':'Common', qty: 10 })
    }
    if (!state.ui.username) {
      // default onboarding party
      state.heroes = new Array(4).fill(0).map((_,i) => {
        const stats = baseStats(i===0?'Mage':'Warrior', i===0?'Artificer':'Ranger')
        return { id: uuid(), name: i===0?'Luna':'Hero '+(i+1), classPrimary: i===0?'Mage':'Warrior', classSecondary: i===0?'Artificer':'Ranger', level: 1, experience: 0, stats, currentHp: stats.vitality, equipment: {} }
      })
      // Luna's Moonstone Amulet pre-equipped via virtual bonus handled in computeHeroStats
    }
    // seed some starter gear and gems with sockets
    for (const slot of ['Sword','Head','Chest','Greaves','Boots','Amulet','Ring','Shield'] as const) {
      const rarity: Rarity = slot==='Sword' ? 'Rare' : 'Common'
      const gear: Gear = { id: uuid(), name: `${rarity} ${slot}`, slot, rarity, base: rarityToValue[rarity], icon: `/placeholder/gear-${slot.toLowerCase()}.svg`, sockets: new Array(socketsForRarity(rarity)).fill(0).map(()=>({id:null})), socketedGems: [] }
      state.inventory.gear.push(gear)
    }
    const starterGems: Array<Pick<Gem,'name'|'type'|'rarity'|'value'|'icon'>> = [
      { name: 'Power Shard', type: 'Power', rarity: 'Rare', value: rarityToValue['Rare'], icon: '/placeholder/gem-power.svg' },
      { name: 'Crit Crystal', type: 'Crit', rarity: 'Rare', value: rarityToValue['Rare'], icon: '/placeholder/gem-crit.svg' },
      { name: 'Stun Prism', type: 'Stun', rarity: 'Rare', value: rarityToValue['Rare'], icon: '/placeholder/gem-stun.svg' },
    ]
    for (const g of starterGems) state.inventory.gems.push({ id: uuid(), ...g })
    // initial shop
    get().rerollShop()
  })),

  setActivePanel: (p) => set(produce<GameState>(state => { state.ui.activePanel = p })),
  setUsername: (name) => set(produce<GameState>(state => { state.ui.username = name })),
  toggleAutoPlay: () => set(produce<GameState>(state => { state.ui.autoPlay = !state.ui.autoPlay })),
  uploadAvatar: (heroId, url) => set(produce<GameState>(state => { const h=state.heroes.find(h=>h.id===heroId); if (h) h.avatarUrl=url })),

  equipGear: (heroId, gearId) => set(produce<GameState>(state => {
    const hero = state.heroes.find(h=>h.id===heroId); const gear = state.inventory.gear.find(g=>g.id===gearId)
    if (!hero || !gear) return
    // unequip current in that slot back to inventory
    const currentId = hero.equipment[gear.slot]
    if (currentId && currentId !== gearId) {
      // already in inventory list so nothing to do
    }
    hero.equipment[gear.slot] = gearId
  })),

  socketGem: (gearId, gemId, socketIndex) => set(produce<GameState>(state => {
    const gear = state.inventory.gear.find(g=>g.id===gearId); const gem = state.inventory.gems.find(g=>g.id===gemId)
    if (!gear || !gem) return
    if (gear.sockets[socketIndex] && gear.sockets[socketIndex].id==null) {
      gear.sockets[socketIndex].id = gemId
      gear.socketedGems.push(gemId)
      // remove gem from inventory list to avoid double use
      state.inventory.gems = state.inventory.gems.filter(g=>g.id!==gemId)
    }
  })),

  unsocketGem: (gearId, socketIndex) => set(produce<GameState>(state => {
    const gear = state.inventory.gear.find(g=>g.id===gearId)
    if (!gear) return
    const gemId = gear.sockets[socketIndex]?.id
    if (gemId) {
      gear.sockets[socketIndex].id = null
      gear.socketedGems = gear.socketedGems.filter(id=>id!==gemId)
      const rarity: Rarity = 'Rare'
      state.inventory.gems.push({ id: gemId, name: 'Recovered Gem', type: 'Power', rarity, value: rarityToValue[rarity], icon: '/placeholder/gem-generic.png' })
    }
  })),

  startBattle: () => set(produce<GameState>(state => {
    if (state.tower.inBattle) return
    const isBoss = state.ui.floor % 10 === 0
    state.tower.monsters = [randomMonster(state.ui.floor, isBoss)]
    state.tower.battleLog = []
    state.tower.turn = 1
    state.tower.inBattle = true
  })),

  nextTurn: () => set(produce<GameState>(state => {
    if (!state.tower.inBattle) return
    const turn = state.tower.turn
    const monster = state.tower.monsters[0]
    const events: BattleEvent[] = []
    // party attacks
    let totalPartyDamage = 0
    for (const hero of state.heroes) {
      if ((hero.currentHp ?? hero.stats.vitality) <= 0) { continue }
      const s = computeHeroStats(hero, state)
      let dmg = Math.max(1, s.power + Math.floor(s.magic/2) - Math.floor(monster.stats.defense/3))
      const crit = Math.random()*100 < s.critRate
      if (crit) dmg = Math.floor(dmg * (1 + s.critDamage/100))
      const stun = Math.random()*100 < s.stunChance
      totalPartyDamage += dmg
      events.push({ id: uuid(), turn, text: `${hero.name} hits ${monster.name} for ${dmg}${crit?' (CRIT)':''}${stun?' and stuns!':''}` })
      if (stun) {
        events.push({ id: uuid(), turn, text: `${monster.name} is stunned and misses its turn!` })
      }
    }
    monster.stats.vitality -= totalPartyDamage
    if (monster.stats.vitality <= 0) {
      events.push({ id: uuid(), turn, text: `${monster.name} defeated!` })
      state.tower.inBattle = false
      state.ui.floor += 1
      const isBoss = state.ui.floor % 10 === 1
      get().generateLoot(isBoss)
    } else {
      // monster turn (if not stunned by any hero this turn)
      const stunned = events.some(e=>e.text.includes('stuns'))
      if (!stunned) {
        const alive = state.heroes.filter(h => (h.currentHp ?? h.stats.vitality) > 0)
        if (alive.length > 0) {
          const target = alive[Math.floor(Math.random()*alive.length)]
          const dmg = Math.max(1, monster.stats.power - 5)
          target.currentHp = Math.max(0, (target.currentHp ?? target.stats.vitality) - dmg)
          events.push({ id: uuid(), turn, text: `${monster.name} strikes ${target.name} for ${dmg}` })
          if ((target.currentHp ?? 0) <= 0) {
            if (state.inventory.potions.revive > 0) {
              state.inventory.potions.revive -= 1
              target.currentHp = target.stats.vitality
              events.push({ id: uuid(), turn, text: `A Revive Potion is consumed! ${target.name} returns to full health!` })
            } else {
              events.push({ id: uuid(), turn, text: `${target.name} is down!` })
            }
          }
        }
      }
      // Check party wipe
      const anyAlive = state.heroes.some(h => (h.currentHp ?? h.stats.vitality) > 0)
      if (!anyAlive) {
        events.push({ id: uuid(), turn, text: `The party is wiped out... They retreat to Floor 1 with all gear.` })
        state.tower.inBattle = false
        state.ui.floor = 1
        for (const h of state.heroes) h.currentHp = h.stats.vitality
      } else {
        state.tower.turn += 1
      }
    }
    state.tower.battleLog.push(...events)
  })),

  manualAttack: () => { const s = get(); if (!s.tower.inBattle) s.startBattle(); else s.nextTurn() },

  generateLoot: (isBoss) => set(produce<GameState>(state => {
    const gold = 10 + Math.floor(Math.random()*15) + (isBoss?50:0)
    state.ui.gold += gold
    const dropChanceBoost = 0 // will be affected by world events later
    if (Math.random() < 0.7 + dropChanceBoost) {
      const rarityRoll = Math.random()
      const rarity: Rarity = rarityRoll>0.98?'Mythic':rarityRoll>0.9?'Legendary':rarityRoll>0.7?'Epic':rarityRoll>0.4?'Rare':'Common'
      // gear or gem
      if (Math.random()<0.5) {
        const slot = ['Sword','Head','Chest','Greaves','Boots','Amulet','Ring','Shield'][Math.floor(Math.random()*8)] as Gear['slot']
        state.inventory.gear.push({ id: uuid(), name: `${rarity} ${slot}`, slot, rarity, base: rarityToValue[rarity], icon: `/placeholder/gear-${slot.toLowerCase()}.svg`, sockets: new Array(Math.min(4, Math.max(0, Math.floor(rarityToValue[rarity]/25)))).fill(0).map(()=>({id:null})), socketedGems: [] })
      } else {
        const types: Gem['type'][] = ['Power','Defense','Vitality','Crit','Stun','Haste','Magic']
        const type = types[Math.floor(Math.random()*types.length)]
        state.inventory.gems.push({ id: uuid(), name: `${rarity} ${type} Gem`, type, rarity, value: rarityToValue[rarity], icon: `/placeholder/gem-${type.toLowerCase()}.svg` })
      }
    }
  })),

  craftRecipe: (recipeId) => set(produce<GameState>(state => {
    const recipe = state.recipes.find(r=>r.id===recipeId); if (!recipe) return
    for (const inp of recipe.inputs) {
      const mat = state.inventory.materials.find(m=>m.id===inp.materialId)
      if (!mat || mat.qty < inp.qty) return
    }
    for (const inp of recipe.inputs) {
      const mat = state.inventory.materials.find(m=>m.id===inp.materialId)!; mat.qty -= inp.qty
    }
    if (recipe.output.type==='gear') {
      const slot = recipe.output.payload.slot
      const rarity = recipe.output.payload.rarity as Rarity
      state.inventory.gear.push({ id: uuid(), name: `${rarity} ${slot}`, slot, rarity, base: rarityToValue[rarity], icon: `/placeholder/gear-${slot.toLowerCase()}.svg`, sockets: new Array(Math.min(4, Math.max(0, Math.floor(rarityToValue[rarity]/25)))).fill(0).map(()=>({id:null})), socketedGems: [] })
    } else if (recipe.output.type==='gem') {
      const type = recipe.output.payload.type as Gem['type']
      const rarity = recipe.output.payload.rarity as Rarity
      state.inventory.gems.push({ id: uuid(), name: `${rarity} ${type} Gem`, type, rarity, value: rarityToValue[rarity], icon: `/placeholder/gem-${type.toLowerCase()}.svg` })
    } else if (recipe.output.type==='potion') {
      state.inventory.potions.revive += 1
    }
  })),

  rerollShop: () => set(produce<GameState>(state => {
    const items: GameState['shop']['items'] = []
    for (let i=0;i<50;i++) {
      const roll = Math.random()
      const kind: 'gear' | 'gem' | 'potion' | 'material' = roll<0.4?'gear': roll<0.7?'gem': roll<0.9?'material':'potion'
      if (kind==='gear') {
        const rarity: Rarity = roll>0.98?'Mythic':roll>0.92?'Legendary':roll>0.78?'Epic':roll>0.55?'Rare':'Common'
        const slot = ['Sword','Head','Chest','Greaves','Boots','Amulet','Ring','Shield'][Math.floor(Math.random()*8)]
        const payload = { id: uuid(), name: `${rarity} ${slot}`, slot, rarity, base: rarityToValue[rarity], icon: `/placeholder/gear-${slot.toLowerCase()}.svg`, sockets: new Array(Math.min(4, Math.max(0, Math.floor(rarityToValue[rarity]/25)))).fill(0).map(()=>({id:null})), socketedGems: [] }
        items.push({ id: uuid(), kind, price: 20 + rarityToValue[rarity]*3, payload })
      } else if (kind==='gem') {
        const types: Gem['type'][] = ['Power','Defense','Vitality','Crit','Stun','Haste','Magic']
        const type = types[Math.floor(Math.random()*types.length)]
        const rarity: Rarity = roll>0.95?'Legendary':roll>0.8?'Epic':roll>0.5?'Rare':'Common'
        const payload = { id: uuid(), name: `${rarity} ${type} Gem`, type, rarity, value: rarityToValue[rarity], icon: `/placeholder/gem-${type.toLowerCase()}.svg` }
        items.push({ id: uuid(), kind, price: 10 + rarityToValue[rarity]*2, payload })
      } else if (kind==='material') {
        const id = `mat-${1+Math.floor(Math.random()*12)}`
        const qty = 1 + Math.floor(Math.random()*5)
        items.push({ id: uuid(), kind, price: 5*qty, payload: { id, name: `Material ${id.split('-')[1]}`, rarity: 'Common', qty } })
      } else {
        items.push({ id: uuid(), kind, price: 30, payload: { type: 'revive' } })
      }
    }
    state.shop.items = items
  })),

  buyShopItem: (shopItemId) => set(produce<GameState>(state => {
    const item = state.shop.items.find(i=>i.id===shopItemId); if (!item) return
    if (state.ui.gold < item.price) return
    state.ui.gold -= item.price
    if (item.kind==='gear') state.inventory.gear.push(item.payload)
    else if (item.kind==='gem') state.inventory.gems.push(item.payload)
    else if (item.kind==='material') {
      const mat = state.inventory.materials.find(m=>m.id===item.payload.id)
      if (mat) mat.qty += item.payload.qty; else state.inventory.materials.push(item.payload)
    } else if (item.kind==='potion') state.inventory.potions.revive += 1
    state.shop.items = state.shop.items.filter(i=>i.id!==shopItemId)
  })),
})))

// Expose helpers for UI
export const rarityClass = (rarity: Rarity) => rarity ? `rarity-${rarity.toLowerCase()}` : ''
