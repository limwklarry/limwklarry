// ============================================================
// Game Constants & Data Definitions
// ============================================================

export interface HeroDefinition {
  id: string;
  name: string;
  description: string;
  baseHp: number;
  baseAttack: number;
  baseSpeed: number;
  attackSpeed: number;
  color: number;
  unlockCost: number;
  specialAbility: string;
}

export interface AbilityDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  apply: (level: number) => AbilityEffect;
}

export interface AbilityEffect {
  attackBonus?: number;
  attackSpeedBonus?: number;
  hpBonus?: number;
  speedBonus?: number;
  projectileCount?: number;
  piercing?: boolean;
  bouncing?: boolean;
  diagonalArrows?: boolean;
  rearArrow?: boolean;
  multishot?: boolean;
  critChance?: number;
  critDamage?: number;
  lifeSteal?: number;
  shield?: number;
  poisonDamage?: number;
  freezeChance?: number;
  fireTrail?: boolean;
  orbitalCount?: number;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  hp: number;
  attack: number;
  speed: number;
  color: number;
  size: number;
  behavior: 'chase' | 'ranged' | 'burst' | 'circle' | 'boss';
  projectileColor?: number;
  xpValue: number;
}

export interface EquipmentDefinition {
  id: string;
  name: string;
  slot: 'weapon' | 'armor' | 'ring' | 'pendant';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  attackBonus: number;
  hpBonus: number;
  specialEffect?: string;
  color: number;
}

// ============================================================
// Heroes
// ============================================================
export const HEROES: HeroDefinition[] = [
  {
    id: 'archer',
    name: 'Atreus',
    description: 'A skilled archer with balanced stats',
    baseHp: 100,
    baseAttack: 10,
    baseSpeed: 200,
    attackSpeed: 600,
    color: 0x4ecdc4,
    unlockCost: 0,
    specialAbility: '+10% Attack Speed',
  },
  {
    id: 'ranger',
    name: 'Sylvan',
    description: 'Swift ranger with piercing arrows',
    baseHp: 80,
    baseAttack: 12,
    baseSpeed: 240,
    attackSpeed: 500,
    color: 0x45b7d1,
    unlockCost: 500,
    specialAbility: 'Arrows pierce 1 enemy',
  },
  {
    id: 'knight',
    name: 'Cedric',
    description: 'Tanky knight with high HP',
    baseHp: 150,
    baseAttack: 8,
    baseSpeed: 160,
    attackSpeed: 800,
    color: 0xff6b6b,
    unlockCost: 800,
    specialAbility: '+30% Max HP',
  },
  {
    id: 'mage',
    name: 'Elara',
    description: 'Powerful mage with area damage',
    baseHp: 70,
    baseAttack: 15,
    baseSpeed: 180,
    attackSpeed: 900,
    color: 0xc44dff,
    unlockCost: 1200,
    specialAbility: 'Projectiles explode on hit',
  },
];

// ============================================================
// Abilities (Level-Up Choices)
// ============================================================
export const ABILITIES: AbilityDefinition[] = [
  {
    id: 'attack_boost',
    name: 'Attack Boost',
    description: 'Increase attack damage by {value}%',
    icon: 'sword',
    maxLevel: 5,
    rarity: 'common',
    apply: (level) => ({ attackBonus: level * 0.15 }),
  },
  {
    id: 'speed_boost',
    name: 'Swift Feet',
    description: 'Increase movement speed by {value}%',
    icon: 'boot',
    maxLevel: 5,
    rarity: 'common',
    apply: (level) => ({ speedBonus: level * 0.1 }),
  },
  {
    id: 'hp_boost',
    name: 'Vitality',
    description: 'Increase max HP by {value}%',
    icon: 'heart',
    maxLevel: 5,
    rarity: 'common',
    apply: (level) => ({ hpBonus: level * 0.15 }),
  },
  {
    id: 'multishot',
    name: 'Multishot',
    description: 'Fire {value} additional arrows',
    icon: 'arrows',
    maxLevel: 3,
    rarity: 'rare',
    apply: (level) => ({ projectileCount: level, multishot: true }),
  },
  {
    id: 'diagonal',
    name: 'Diagonal Arrows',
    description: 'Fire arrows diagonally',
    icon: 'diagonal',
    maxLevel: 1,
    rarity: 'rare',
    apply: () => ({ diagonalArrows: true }),
  },
  {
    id: 'rear_arrow',
    name: 'Rear Arrow',
    description: 'Fire an arrow behind you',
    icon: 'back',
    maxLevel: 1,
    rarity: 'rare',
    apply: () => ({ rearArrow: true }),
  },
  {
    id: 'piercing',
    name: 'Piercing Shot',
    description: 'Arrows pierce through enemies',
    icon: 'pierce',
    maxLevel: 1,
    rarity: 'epic',
    apply: () => ({ piercing: true }),
  },
  {
    id: 'bouncing',
    name: 'Ricochet',
    description: 'Arrows bounce to nearby enemies',
    icon: 'bounce',
    maxLevel: 1,
    rarity: 'epic',
    apply: () => ({ bouncing: true }),
  },
  {
    id: 'crit_chance',
    name: 'Eagle Eye',
    description: 'Increase crit chance by {value}%',
    icon: 'eye',
    maxLevel: 5,
    rarity: 'rare',
    apply: (level) => ({ critChance: level * 0.08 }),
  },
  {
    id: 'crit_damage',
    name: 'Deadly Strike',
    description: 'Increase crit damage by {value}%',
    icon: 'skull',
    maxLevel: 3,
    rarity: 'rare',
    apply: (level) => ({ critDamage: level * 0.25 }),
  },
  {
    id: 'life_steal',
    name: 'Vampiric Arrows',
    description: 'Heal {value}% of damage dealt',
    icon: 'vampire',
    maxLevel: 3,
    rarity: 'epic',
    apply: (level) => ({ lifeSteal: level * 0.05 }),
  },
  {
    id: 'shield',
    name: 'Arcane Shield',
    description: 'Absorb {value} damage',
    icon: 'shield',
    maxLevel: 3,
    rarity: 'epic',
    apply: (level) => ({ shield: level * 15 }),
  },
  {
    id: 'attack_speed',
    name: 'Rapid Fire',
    description: 'Increase attack speed by {value}%',
    icon: 'fast',
    maxLevel: 5,
    rarity: 'common',
    apply: (level) => ({ attackSpeedBonus: level * 0.12 }),
  },
  {
    id: 'poison',
    name: 'Poison Touch',
    description: 'Arrows deal poison damage over time',
    icon: 'poison',
    maxLevel: 3,
    rarity: 'rare',
    apply: (level) => ({ poisonDamage: level * 3 }),
  },
  {
    id: 'freeze',
    name: 'Frost Arrows',
    description: 'Chance to freeze enemies',
    icon: 'ice',
    maxLevel: 3,
    rarity: 'rare',
    apply: (level) => ({ freezeChance: level * 0.12 }),
  },
  {
    id: 'orbitals',
    name: 'Orbital Strike',
    description: 'Orbiting projectiles deal damage',
    icon: 'orbit',
    maxLevel: 3,
    rarity: 'legendary',
    apply: (level) => ({ orbitalCount: level }),
  },
];

// ============================================================
// Enemies by Dungeon Chapter
// ============================================================
export const ENEMIES_BY_CHAPTER: EnemyDefinition[][] = [
  // Chapter 1: Forest
  [
    { id: 'slime', name: 'Slime', hp: 20, attack: 5, speed: 60, color: 0x66bb6a, size: 18, behavior: 'chase', xpValue: 10 },
    { id: 'bat', name: 'Bat', hp: 15, attack: 7, speed: 100, color: 0x8e24aa, size: 14, behavior: 'circle', xpValue: 12 },
    { id: 'goblin', name: 'Goblin', hp: 30, attack: 8, speed: 70, color: 0x4caf50, size: 20, behavior: 'chase', xpValue: 15 },
    { id: 'goblin_archer', name: 'Goblin Archer', hp: 20, attack: 10, speed: 50, color: 0x388e3c, size: 20, behavior: 'ranged', projectileColor: 0x8bc34a, xpValue: 18 },
  ],
  // Chapter 2: Cave
  [
    { id: 'skeleton', name: 'Skeleton', hp: 35, attack: 10, speed: 65, color: 0xeeeeee, size: 20, behavior: 'chase', xpValue: 20 },
    { id: 'ghost', name: 'Ghost', hp: 25, attack: 12, speed: 90, color: 0xb0bec5, size: 18, behavior: 'circle', xpValue: 22 },
    { id: 'mummy', name: 'Mummy', hp: 50, attack: 8, speed: 40, color: 0xd7ccc8, size: 22, behavior: 'chase', xpValue: 25 },
    { id: 'necromancer', name: 'Necromancer', hp: 30, attack: 15, speed: 45, color: 0x7b1fa2, size: 22, behavior: 'ranged', projectileColor: 0xce93d8, xpValue: 30 },
  ],
  // Chapter 3: Lava
  [
    { id: 'fire_imp', name: 'Fire Imp', hp: 40, attack: 14, speed: 80, color: 0xff5722, size: 16, behavior: 'burst', xpValue: 30 },
    { id: 'lava_golem', name: 'Lava Golem', hp: 80, attack: 12, speed: 35, color: 0xbf360c, size: 28, behavior: 'chase', xpValue: 35 },
    { id: 'fire_mage', name: 'Fire Mage', hp: 35, attack: 18, speed: 50, color: 0xff9800, size: 20, behavior: 'ranged', projectileColor: 0xffeb3b, xpValue: 35 },
    { id: 'phoenix', name: 'Phoenix', hp: 45, attack: 16, speed: 95, color: 0xffc107, size: 22, behavior: 'circle', xpValue: 40 },
  ],
];

export const BOSSES: EnemyDefinition[] = [
  { id: 'treant', name: 'Ancient Treant', hp: 300, attack: 20, speed: 40, color: 0x2e7d32, size: 45, behavior: 'boss', xpValue: 200 },
  { id: 'lich', name: 'Lich King', hp: 500, attack: 25, speed: 50, color: 0x4a148c, size: 40, behavior: 'boss', projectileColor: 0xba68c8, xpValue: 350 },
  { id: 'dragon', name: 'Fire Dragon', hp: 800, attack: 35, speed: 55, color: 0xd50000, size: 50, behavior: 'boss', projectileColor: 0xff6f00, xpValue: 500 },
];

// ============================================================
// Equipment
// ============================================================
export const EQUIPMENT: EquipmentDefinition[] = [
  { id: 'wooden_bow', name: 'Wooden Bow', slot: 'weapon', rarity: 'common', attackBonus: 5, hpBonus: 0, color: 0x8d6e63 },
  { id: 'iron_bow', name: 'Iron Bow', slot: 'weapon', rarity: 'rare', attackBonus: 12, hpBonus: 0, color: 0x78909c },
  { id: 'golden_bow', name: 'Golden Bow', slot: 'weapon', rarity: 'epic', attackBonus: 20, hpBonus: 0, specialEffect: '+15% Crit Chance', color: 0xffd54f },
  { id: 'dragon_bow', name: 'Dragon Bow', slot: 'weapon', rarity: 'legendary', attackBonus: 35, hpBonus: 0, specialEffect: 'Fire damage', color: 0xff5722 },
  { id: 'leather_armor', name: 'Leather Armor', slot: 'armor', rarity: 'common', attackBonus: 0, hpBonus: 20, color: 0x8d6e63 },
  { id: 'chain_mail', name: 'Chain Mail', slot: 'armor', rarity: 'rare', attackBonus: 0, hpBonus: 40, color: 0x78909c },
  { id: 'plate_armor', name: 'Plate Armor', slot: 'armor', rarity: 'epic', attackBonus: 0, hpBonus: 70, specialEffect: '+10% Damage Reduction', color: 0xffd54f },
  { id: 'dragon_scale', name: 'Dragon Scale', slot: 'armor', rarity: 'legendary', attackBonus: 10, hpBonus: 100, specialEffect: 'Fire resistance', color: 0xff5722 },
  { id: 'copper_ring', name: 'Copper Ring', slot: 'ring', rarity: 'common', attackBonus: 3, hpBonus: 5, color: 0xbf8040 },
  { id: 'silver_ring', name: 'Silver Ring', slot: 'ring', rarity: 'rare', attackBonus: 6, hpBonus: 10, color: 0xc0c0c0 },
  { id: 'gold_ring', name: 'Gold Ring', slot: 'ring', rarity: 'epic', attackBonus: 10, hpBonus: 15, specialEffect: '+5% Life Steal', color: 0xffd700 },
  { id: 'emerald_pendant', name: 'Emerald Pendant', slot: 'pendant', rarity: 'rare', attackBonus: 4, hpBonus: 15, color: 0x4caf50 },
  { id: 'ruby_pendant', name: 'Ruby Pendant', slot: 'pendant', rarity: 'epic', attackBonus: 8, hpBonus: 20, specialEffect: '+10% Attack Speed', color: 0xf44336 },
  { id: 'diamond_pendant', name: 'Diamond Pendant', slot: 'pendant', rarity: 'legendary', attackBonus: 15, hpBonus: 30, specialEffect: 'Revive once per run', color: 0x81d4fa },
];

// ============================================================
// Room/Chapter Configuration
// ============================================================
export const ROOMS_PER_CHAPTER = 10;
export const BOSS_ROOM_INTERVAL = 5; // Boss every 5 rooms
export const WAVES_PER_ROOM = 3;
export const XP_PER_LEVEL = 50; // XP needed to level up (scales)

export function getXpForLevel(level: number): number {
  return Math.floor(XP_PER_LEVEL * (1 + (level - 1) * 0.3));
}

export function getEnemyCountForWave(room: number, wave: number): number {
  return Math.min(3 + Math.floor(room / 2) + wave, 12);
}

export function scaleEnemyStat(baseStat: number, chapter: number, room: number): number {
  const scale = 1 + (chapter * 0.5) + (room * 0.05);
  return Math.floor(baseStat * scale);
}

// ============================================================
// Save Data Structure
// ============================================================
export interface SaveData {
  gold: number;
  gems: number;
  highestChapter: number;
  highestRoom: number;
  unlockedHeroes: string[];
  selectedHero: string;
  equippedItems: Record<string, string>;
  ownedItems: string[];
  totalRuns: number;
  totalKills: number;
}

export function getDefaultSaveData(): SaveData {
  return {
    gold: 0,
    gems: 0,
    highestChapter: 0,
    highestRoom: 0,
    unlockedHeroes: ['archer'],
    selectedHero: 'archer',
    equippedItems: {},
    ownedItems: ['wooden_bow', 'leather_armor'],
    totalRuns: 0,
    totalKills: 0,
  };
}
