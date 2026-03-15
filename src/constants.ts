export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

export const COLORS = {
  background: 0x1a1a2e,
  player: 0x4ecdc4,
  floor: 0x16213e,
  wall: 0x555555,
  hpGreen: 0x44ff44,
  hpOrange: 0xff8844,
  hpRed: 0xff4444,
  mpBlue: 0x4488ff,
  xpPurple: 0xaa44ff,
  gold: 0xffd700,
  essence: 0xff44ff,
  critYellow: 0xffff00,
  white: 0xffffff,
  black: 0x000000,
  epicenter: 0x9944ff,
  glacier: 0x44ccff,
  volcano: 0xff6622,
  enemy: 0xff4444,
  boss: 0xff2222,
  projectile: 0xffaa00,
  pickup: 0x44ff88,
};

export interface WeaponDef {
  name: string;
  type: 'melee' | 'ranged';
  damage: number;
  cooldown: number;
  range: number;
  arc?: number;
  speed?: number;
  piercing?: boolean;
}

export const WEAPONS: Record<string, WeaponDef> = {
  sword: { name: 'Sword Slash', type: 'melee', damage: 25, cooldown: 900, range: 70, arc: 60 },
  shuriken: { name: 'Shuriken', type: 'ranged', damage: 15, cooldown: 600, range: 300, speed: 350, piercing: true },
  bow: { name: 'Bow & Arrow', type: 'ranged', damage: 10, cooldown: 650, range: 500, speed: 550 },
};

export interface SkillDef {
  name: string;
  type: string;
  mpCost: number;
  cooldown: number;
  radius: number;
  dmgMult: number;
  duration?: number;
  extras?: Record<string, number>;
}

export const SKILLS: Record<string, SkillDef> = {
  epicenter: {
    name: 'Epicenter', type: 'aoe_burst', mpCost: 30, cooldown: 8000, radius: 120, dmgMult: 1.5,
    extras: { slowPct: 0.5, slowDuration: 3000 },
  },
  glacier: {
    name: 'Glacier', type: 'buff_zone', mpCost: 25, cooldown: 12000, radius: 100, dmgMult: 0,
    duration: 6000,
    extras: { dmgBonus: 0.25, atkSpeedBonus: 0.3, rangeBonus: 0.2 },
  },
  volcano: {
    name: 'Volcano', type: 'meteor', mpCost: 35, cooldown: 10000, radius: 50, dmgMult: 2,
    extras: { strikes: 6 },
  },
};

export interface PlayerStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  speed: number;
  hpRegen: number;
  mpRegen: number;
  critChance: number;
  critMult: number;
  lifesteal: number;
  armor: number;
  dmgMult: number;
  atkSpeedMult: number;
  rangeMult: number;
  extraProjectiles: number;
}

export function defaultPlayerStats(): PlayerStats {
  return {
    hp: 100, maxHp: 100, mp: 80, maxMp: 80,
    speed: 180, hpRegen: 0.5, mpRegen: 2,
    critChance: 0.05, critMult: 1.5, lifesteal: 0, armor: 0,
    dmgMult: 1, atkSpeedMult: 1, rangeMult: 1, extraProjectiles: 0,
  };
}

export interface EnemyDef {
  name: string;
  behavior: 'grunt' | 'ranger' | 'charger';
  hp: number;
  speed: number;
  damage: number;
  color: number;
  size: number;
  range?: number;
  projectileSpeed?: number;
  attackCooldown?: number;
}

export const CHAPTERS: { name: string; bgColor: number; enemies: EnemyDef[] }[] = [
  {
    name: 'Forest', bgColor: 0x1a2e1a,
    enemies: [
      { name: 'Slime', behavior: 'grunt', hp: 30, speed: 60, damage: 8, color: 0x44cc44, size: 12 },
      { name: 'Goblin', behavior: 'grunt', hp: 40, speed: 80, damage: 10, color: 0x88aa22, size: 10 },
      { name: 'Goblin Archer', behavior: 'ranger', hp: 25, speed: 70, damage: 7, color: 0x668822, size: 10, range: 250, projectileSpeed: 200, attackCooldown: 1500 },
      { name: 'Wolf', behavior: 'charger', hp: 35, speed: 90, damage: 12, color: 0x888888, size: 11 },
    ],
  },
  {
    name: 'Cave', bgColor: 0x1a1a2e,
    enemies: [
      { name: 'Skeleton', behavior: 'grunt', hp: 45, speed: 65, damage: 12, color: 0xcccccc, size: 11 },
      { name: 'Ghost', behavior: 'ranger', hp: 30, speed: 75, damage: 10, color: 0x8888ff, size: 12, range: 280, projectileSpeed: 220, attackCooldown: 1400 },
      { name: 'Mummy', behavior: 'grunt', hp: 60, speed: 50, damage: 15, color: 0xccaa66, size: 13 },
      { name: 'Bat Swarm', behavior: 'charger', hp: 25, speed: 100, damage: 10, color: 0x553355, size: 9 },
    ],
  },
  {
    name: 'Lava', bgColor: 0x2e1a1a,
    enemies: [
      { name: 'Fire Imp', behavior: 'ranger', hp: 35, speed: 80, damage: 12, color: 0xff6644, size: 9, range: 260, projectileSpeed: 240, attackCooldown: 1300 },
      { name: 'Lava Golem', behavior: 'grunt', hp: 80, speed: 45, damage: 20, color: 0xcc4400, size: 16 },
      { name: 'Flame Hound', behavior: 'charger', hp: 40, speed: 110, damage: 14, color: 0xff4400, size: 11 },
      { name: 'Fire Mage', behavior: 'ranger', hp: 30, speed: 60, damage: 15, color: 0xff2200, size: 10, range: 300, projectileSpeed: 260, attackCooldown: 1200 },
    ],
  },
];

export interface BossDef {
  name: string;
  hp: number;
  speed: number;
  damage: number;
  color: number;
  size: number;
  projectileCount: number;
  burstCount: number;
}

export const BOSSES: BossDef[] = [
  { name: 'Ancient Treant', hp: 400, speed: 50, damage: 20, color: 0x228822, size: 28, projectileCount: 3, burstCount: 8 },
  { name: 'Lich King', hp: 600, speed: 60, damage: 25, color: 0x6622cc, size: 30, projectileCount: 3, burstCount: 8 },
  { name: 'Fire Dragon', hp: 900, speed: 55, damage: 35, color: 0xff2200, size: 34, projectileCount: 3, burstCount: 8 },
];

export interface UpgradeDef {
  name: string;
  rarity: 'common' | 'rare';
  maxStacks: number;
  description: string;
  stat: string;
  value: number;
}

export const UPGRADES: UpgradeDef[] = [
  { name: '+1 Projectile', rarity: 'rare', maxStacks: 3, description: '+1 extra projectile', stat: 'extraProjectiles', value: 1 },
  { name: '+12% Atk Speed', rarity: 'common', maxStacks: 5, description: '+12% attack speed', stat: 'atkSpeedMult', value: 0.12 },
  { name: '+15% Damage', rarity: 'common', maxStacks: 5, description: '+15% damage', stat: 'dmgMult', value: 0.15 },
  { name: '+10% Move Speed', rarity: 'common', maxStacks: 5, description: '+10% movement speed', stat: 'speed', value: 18 },
  { name: '+1% Lifesteal', rarity: 'common', maxStacks: 5, description: '+1% lifesteal', stat: 'lifesteal', value: 0.01 },
  { name: '+3 Armor', rarity: 'common', maxStacks: 5, description: '+3 armor', stat: 'armor', value: 3 },
  { name: '+1 HP/s Regen', rarity: 'common', maxStacks: 5, description: '+1 HP/s regen', stat: 'hpRegen', value: 1 },
  { name: '+15 Max HP', rarity: 'common', maxStacks: 5, description: '+15 max HP', stat: 'maxHp', value: 15 },
  { name: '+1 MP/s Regen', rarity: 'common', maxStacks: 5, description: '+1 MP/s regen', stat: 'mpRegen', value: 1 },
  { name: '+10 Max MP', rarity: 'common', maxStacks: 5, description: '+10 max MP', stat: 'maxMp', value: 10 },
  { name: '+20% Crit Damage', rarity: 'common', maxStacks: 5, description: '+20% crit damage', stat: 'critMult', value: 0.2 },
  { name: '+5% Crit Chance', rarity: 'common', maxStacks: 5, description: '+5% crit chance', stat: 'critChance', value: 0.05 },
];

export interface ShopItemDef {
  name: string;
  cost: number;
  type: 'consumable' | 'weapon_upgrade';
  effect: string;
  value: number;
}

export const SHOP_ITEMS: ShopItemDef[] = [
  { name: 'Potion', cost: 30, type: 'consumable', effect: 'heal', value: 40 },
  { name: 'Mana Potion', cost: 25, type: 'consumable', effect: 'mana', value: 30 },
  { name: 'Damage Potion', cost: 50, type: 'consumable', effect: 'dmgBuff', value: 0.2 },
  { name: 'Defense Potion', cost: 40, type: 'consumable', effect: 'armorBuff', value: 5 },
  { name: 'Weapon +5 Dmg', cost: 60, type: 'weapon_upgrade', effect: 'weaponDmg', value: 5 },
  { name: 'Weapon +10% Speed', cost: 55, type: 'weapon_upgrade', effect: 'weaponSpeed', value: 0.1 },
  { name: 'Weapon +15% Range', cost: 50, type: 'weapon_upgrade', effect: 'weaponRange', value: 0.15 },
];

export interface SaveData {
  goldBank: number;
  essenceBank: number;
  heroLevel: number;
  heroXp: number;
  bestStage: number;
  stageCheckpoint: number;
  settings: { sfx: boolean; music: boolean };
}

export function defaultSaveData(): SaveData {
  return {
    goldBank: 0, essenceBank: 0, heroLevel: 1, heroXp: 0,
    bestStage: 0, stageCheckpoint: 0,
    settings: { sfx: true, music: true },
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem('archero_save');
    if (raw) return { ...defaultSaveData(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultSaveData();
}

export function saveSave(data: SaveData) {
  localStorage.setItem('archero_save', JSON.stringify(data));
}

export function heroXpForLevel(level: number): number {
  return 50 + level * 20;
}
