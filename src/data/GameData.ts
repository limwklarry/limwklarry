// ============================================================
// Game Constants & Data Definitions
// ============================================================

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;
export const ARENA_PADDING = 40;

// ============================================================
// Weapon Definitions
// ============================================================
export interface WeaponDefinition {
  id: string;
  name: string;
  description: string;
  baseDamage: number;
  attackSpeed: number; // ms between attacks
  range: number; // pixels
  type: 'melee' | 'projectile';
  projectileSpeed?: number;
  pierce?: boolean;
  color: number;
}

export const WEAPONS: WeaponDefinition[] = [
  {
    id: 'sword',
    name: 'Sword Slash',
    description: 'Shortest range, slowest speed, highest damage. Melee arc attack.',
    baseDamage: 25,
    attackSpeed: 900,
    range: 70,
    type: 'melee',
    color: 0xcccccc,
  },
  {
    id: 'shuriken',
    name: 'Shuriken',
    description: 'Medium range, medium speed, medium damage. Can pierce.',
    baseDamage: 15,
    attackSpeed: 600,
    range: 300,
    type: 'projectile',
    projectileSpeed: 350,
    pierce: false,
    color: 0x90a4ae,
  },
  {
    id: 'bow',
    name: 'Bow & Arrow',
    description: 'Longest range, medium speed, lowest damage. Fast projectile.',
    baseDamage: 10,
    attackSpeed: 650,
    range: 500,
    type: 'projectile',
    projectileSpeed: 550,
    color: 0x8d6e63,
  },
];

// ============================================================
// Special Skill Definitions
// ============================================================
export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  cooldown: number; // ms
  color: number;
}

export const SKILLS: SkillDefinition[] = [
  {
    id: 'epicenter',
    name: 'Epicenter',
    description: 'AoE burst centered on player. Damages and slows nearby enemies.',
    mpCost: 30,
    cooldown: 8000,
    color: 0x7c4dff,
  },
  {
    id: 'glacier',
    name: 'Glacier',
    description: 'Creates a zone. While inside: +attack speed, +range, +damage.',
    mpCost: 25,
    cooldown: 12000,
    color: 0x40c4ff,
  },
  {
    id: 'volcano',
    name: 'Volcano',
    description: 'Spawns random meteor strikes that damage enemies in radius.',
    mpCost: 35,
    cooldown: 10000,
    color: 0xff6d00,
  },
];

// ============================================================
// Upgrade Definitions (run powerups)
// ============================================================
export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare';
  maxStacks: number;
  apply: (stacks: number) => UpgradeEffect;
}

export interface UpgradeEffect {
  projectileBonus?: number;
  attackSpeedMult?: number;
  damageMult?: number;
  speedMult?: number;
  lifestealPercent?: number;
  armorBonus?: number;
  hpRegenBonus?: number;
  maxHpBonus?: number;
  mpRegenBonus?: number;
  maxMpBonus?: number;
  critDamageBonus?: number;
  critChanceBonus?: number;
}

export const UPGRADES: UpgradeDefinition[] = [
  {
    id: 'projectile',
    name: '+1 Projectile',
    description: '+1 extra projectile per attack',
    rarity: 'rare',
    maxStacks: 3,
    apply: (n) => ({ projectileBonus: n }),
  },
  {
    id: 'attack_speed',
    name: '+Attack Speed',
    description: '+12% attack speed',
    rarity: 'common',
    maxStacks: 5,
    apply: (n) => ({ attackSpeedMult: 1 + n * 0.12 }),
  },
  {
    id: 'damage',
    name: '+Damage',
    description: '+15% damage',
    rarity: 'common',
    maxStacks: 5,
    apply: (n) => ({ damageMult: 1 + n * 0.15 }),
  },
  {
    id: 'move_speed',
    name: '+Movement Speed',
    description: '+10% movement speed',
    rarity: 'common',
    maxStacks: 5,
    apply: (n) => ({ speedMult: 1 + n * 0.10 }),
  },
  {
    id: 'lifesteal',
    name: '+1% Lifesteal',
    description: 'Heal 1% of damage dealt per stack',
    rarity: 'common',
    maxStacks: 5,
    apply: (n) => ({ lifestealPercent: n * 0.01 }),
  },
  {
    id: 'armour',
    name: '+Armour',
    description: '+3 armour (flat damage reduction)',
    rarity: 'common',
    maxStacks: 5,
    apply: (n) => ({ armorBonus: n * 3 }),
  },
  {
    id: 'hp_regen',
    name: '+HP Regen',
    description: '+1 HP/s regen',
    rarity: 'common',
    maxStacks: 5,
    apply: (n) => ({ hpRegenBonus: n * 1 }),
  },
  {
    id: 'max_hp',
    name: '+Max HP',
    description: '+15 max HP',
    rarity: 'common',
    maxStacks: 5,
    apply: (n) => ({ maxHpBonus: n * 15 }),
  },
  {
    id: 'mp_regen',
    name: '+MP Regen',
    description: '+1 MP/s regen',
    rarity: 'common',
    maxStacks: 5,
    apply: (n) => ({ mpRegenBonus: n * 1 }),
  },
  {
    id: 'max_mp',
    name: '+Max MP',
    description: '+10 max MP',
    rarity: 'common',
    maxStacks: 5,
    apply: (n) => ({ maxMpBonus: n * 10 }),
  },
  {
    id: 'crit_damage',
    name: '+Critical Damage',
    description: '+20% critical damage multiplier',
    rarity: 'common',
    maxStacks: 5,
    apply: (n) => ({ critDamageBonus: n * 0.20 }),
  },
  {
    id: 'crit_chance',
    name: '+Critical Hit Rate',
    description: '+5% critical hit chance',
    rarity: 'common',
    maxStacks: 5,
    apply: (n) => ({ critChanceBonus: n * 0.05 }),
  },
];

// ============================================================
// Shop Item Definitions
// ============================================================
export interface ShopItemDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'consumable' | 'weapon_upgrade';
  effect: string;
}

export const SHOP_ITEMS: ShopItemDefinition[] = [
  { id: 'potion', name: 'Potion', description: 'Restore 40 HP', cost: 30, type: 'consumable', effect: 'heal_40' },
  { id: 'damage_potion', name: 'Damage Potion', description: '+20% damage for 60s', cost: 50, type: 'consumable', effect: 'damage_buff' },
  { id: 'defense_potion', name: 'Defense Potion', description: '+5 armor for 60s', cost: 40, type: 'consumable', effect: 'defense_buff' },
  { id: 'weapon_damage', name: 'Weapon Upgrade: Damage', description: '+5 base weapon damage', cost: 60, type: 'weapon_upgrade', effect: 'weapon_damage_5' },
  { id: 'weapon_speed', name: 'Weapon Upgrade: Attack Speed', description: '+10% attack speed', cost: 55, type: 'weapon_upgrade', effect: 'weapon_speed_10' },
  { id: 'weapon_range', name: 'Weapon Upgrade: Range', description: '+15% weapon range', cost: 50, type: 'weapon_upgrade', effect: 'weapon_range_15' },
  { id: 'mana_potion', name: 'Mana Potion', description: 'Restore 30 MP', cost: 25, type: 'consumable', effect: 'mana_30' },
];

// ============================================================
// Enemy Definitions
// ============================================================
export interface EnemyDefinition {
  id: string;
  name: string;
  hp: number;
  attack: number;
  speed: number;
  color: number;
  size: number;
  behavior: 'grunt' | 'ranger' | 'charger' | 'boss';
  projectileColor?: number;
  xpValue: number;
  goldValue: number;
}

export const ENEMIES_BY_CHAPTER: EnemyDefinition[][] = [
  // Chapter 1: Forest
  [
    { id: 'slime', name: 'Slime', hp: 30, attack: 6, speed: 55, color: 0x66bb6a, size: 18, behavior: 'grunt', xpValue: 10, goldValue: 3 },
    { id: 'goblin', name: 'Goblin', hp: 40, attack: 8, speed: 65, color: 0x4caf50, size: 20, behavior: 'grunt', xpValue: 14, goldValue: 4 },
    { id: 'goblin_archer', name: 'Goblin Archer', hp: 25, attack: 10, speed: 45, color: 0x388e3c, size: 20, behavior: 'ranger', projectileColor: 0x8bc34a, xpValue: 18, goldValue: 5 },
    { id: 'wolf', name: 'Wolf', hp: 35, attack: 12, speed: 90, color: 0x8d6e63, size: 16, behavior: 'charger', xpValue: 16, goldValue: 4 },
  ],
  // Chapter 2: Cave
  [
    { id: 'skeleton', name: 'Skeleton', hp: 45, attack: 11, speed: 60, color: 0xeeeeee, size: 20, behavior: 'grunt', xpValue: 20, goldValue: 5 },
    { id: 'ghost', name: 'Ghost', hp: 30, attack: 14, speed: 50, color: 0xb0bec5, size: 18, behavior: 'ranger', projectileColor: 0x80cbc4, xpValue: 24, goldValue: 6 },
    { id: 'mummy', name: 'Mummy', hp: 60, attack: 9, speed: 40, color: 0xd7ccc8, size: 22, behavior: 'grunt', xpValue: 22, goldValue: 5 },
    { id: 'bat_swarm', name: 'Bat Swarm', hp: 25, attack: 15, speed: 100, color: 0x7b1fa2, size: 14, behavior: 'charger', xpValue: 18, goldValue: 4 },
  ],
  // Chapter 3: Lava
  [
    { id: 'fire_imp', name: 'Fire Imp', hp: 50, attack: 16, speed: 70, color: 0xff5722, size: 16, behavior: 'ranger', projectileColor: 0xffeb3b, xpValue: 30, goldValue: 7 },
    { id: 'lava_golem', name: 'Lava Golem', hp: 90, attack: 14, speed: 35, color: 0xbf360c, size: 28, behavior: 'grunt', xpValue: 35, goldValue: 8 },
    { id: 'flame_hound', name: 'Flame Hound', hp: 40, attack: 20, speed: 110, color: 0xff9800, size: 18, behavior: 'charger', xpValue: 28, goldValue: 7 },
    { id: 'fire_mage', name: 'Fire Mage', hp: 35, attack: 22, speed: 45, color: 0xffc107, size: 20, behavior: 'ranger', projectileColor: 0xff6f00, xpValue: 35, goldValue: 8 },
  ],
];

export const BOSSES: EnemyDefinition[] = [
  { id: 'treant', name: 'Ancient Treant', hp: 400, attack: 22, speed: 40, color: 0x2e7d32, size: 45, behavior: 'boss', xpValue: 200, goldValue: 50 },
  { id: 'lich', name: 'Lich King', hp: 600, attack: 28, speed: 50, color: 0x4a148c, size: 40, behavior: 'boss', projectileColor: 0xba68c8, xpValue: 350, goldValue: 80 },
  { id: 'dragon', name: 'Fire Dragon', hp: 900, attack: 38, speed: 55, color: 0xd50000, size: 50, behavior: 'boss', projectileColor: 0xff6f00, xpValue: 500, goldValue: 120 },
];

// ============================================================
// Progression Config
// ============================================================
export const WAVES_PER_STAGE = 30;
export const BOSS_WAVE_INTERVAL = 3; // boss every 3rd wave
export const XP_PER_LEVEL = 50;

export function getXpForLevel(level: number): number {
  return Math.floor(XP_PER_LEVEL * (1 + (level - 1) * 0.3));
}

export function getEnemyCountForWave(wave: number, stage: number): number {
  return Math.min(3 + Math.floor(wave / 3) + stage, 10);
}

export function scaleEnemyStat(baseStat: number, stage: number, wave: number): number {
  return Math.floor(baseStat * (1 + stage * 0.5 + wave * 0.02));
}

// ============================================================
// Player Base Stats
// ============================================================
export const BASE_PLAYER_STATS = {
  maxHp: 100,
  maxMp: 80,
  hpRegen: 0.5,  // per second
  mpRegen: 2,    // per second
  armor: 0,
  lifesteal: 0,
  critChance: 0.05,
  critDamage: 1.5,
  damageMult: 1,
  attackSpeedMult: 1,
  moveSpeedMult: 1,
  rangeMult: 1,
  projectileBonus: 0,
  baseSpeed: 180,
};

// ============================================================
// Save Data Structure
// ============================================================
export interface SaveData {
  goldBank: number;
  essence: number;
  heroLevel: number;
  heroXp: number;
  bestStage: number;
  stageCheckpoint: number;
  settings: {
    screenShake: boolean;
    volume: number;
  };
}

export function getDefaultSaveData(): SaveData {
  return {
    goldBank: 0,
    essence: 0,
    heroLevel: 1,
    heroXp: 0,
    bestStage: 1,
    stageCheckpoint: 1,
    settings: {
      screenShake: true,
      volume: 0.7,
    },
  };
}
