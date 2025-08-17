export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic'
export type GearSlot = 'Head' | 'Chest' | 'Greaves' | 'Boots' | 'Amulet' | 'Ring' | 'Sword' | 'Shield'

export type GemType = 'Power' | 'Defense' | 'Vitality' | 'Crit' | 'Stun' | 'Haste' | 'Magic'

export interface Gem {
  id: string
  name: string
  type: GemType
  rarity: Rarity
  icon: string
  value: number
}

export interface Gear {
  id: string
  name: string
  slot: GearSlot
  rarity: Rarity
  base: number
  icon: string
  sockets: Array<{ id: string | null }>
  socketedGems: string[]
  setName?: string
  cursed?: boolean
}

export interface Stats {
  power: number
  defense: number
  vitality: number
  critRate: number
  critDamage: number
  haste: number
  magic: number
  stunChance: number
}

export type ClassName = 'Warrior' | 'Monk' | 'Paladin' | 'Cleric' | 'Ranger' | 'Mage' | 'Wizard' | 'Warlock' | 'Beaver' | 'Bard' | 'Artificer'

export interface Hero {
  id: string
  name: string
  classPrimary: ClassName
  classSecondary: ClassName
  level: number
  experience: number
  stats: Stats
  avatarUrl?: string
  equipment: Partial<Record<GearSlot, string>>
}

export interface LootMaterial {
  id: string
  name: string
  rarity: Rarity
  qty: number
}

export interface Recipe {
  id: string
  name: string
  rarity: Rarity
  inputs: Array<{ materialId: string; qty: number }>
  output: { type: 'gear' | 'gem' | 'potion'; payload: any }
}

export interface BattleEvent {
  id: string
  turn: number
  text: string
}

export interface Monster {
  id: string
  name: string
  level: number
  stats: Stats
  isBoss?: boolean
}

export interface UIState {
  username: string | null
  activePanel: 'tower' | 'party' | 'gear' | 'forge' | 'settings' | 'shop'
  floor: number
  autoPlay: boolean
  gold: number
}

export interface GameState {
  ui: UIState
  heroes: Hero[]
  inventory: { gear: Gear[]; gems: Gem[]; materials: LootMaterial[]; potions: { revive: number } }
  recipes: Recipe[]
  shop: { items: Array<{ id: string; kind: 'gear' | 'gem' | 'potion' | 'material'; price: number; payload: any }> }
  tower: { monsters: Monster[]; battleLog: BattleEvent[]; turn: number; inBattle: boolean }
  initialize: () => void
  setActivePanel: (p: UIState['activePanel']) => void
  setUsername: (name: string) => void
  toggleAutoPlay: () => void
  uploadAvatar: (heroId: string, url: string) => void
  equipGear: (heroId: string, gearId: string) => void
  socketGem: (gearId: string, gemId: string, socketIndex: number) => void
  unsocketGem: (gearId: string, socketIndex: number) => void
  startBattle: () => void
  nextTurn: () => void
  manualAttack: () => void
  generateLoot: (isBoss: boolean) => void
  craftRecipe: (recipeId: string) => void
  rerollShop: () => void
  buyShopItem: (shopItemId: string) => void
}

export const rarityValue: Record<Rarity, number> = {
  Common: 5,
  Rare: 10,
  Epic: 25,
  Legendary: 50,
  Mythic: 100,
}

export const gearSlots: GearSlot[] = ['Head','Chest','Greaves','Boots','Amulet','Ring','Sword','Shield']
