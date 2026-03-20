// Item definitions
const ITEMS = {
  // Weapons - Melee
  bronze_sword: { id: 'bronze_sword', name: 'Bronze Sword', type: 'weapon', slot: 'weapon', style: 'melee', attackBonus: 4, strengthBonus: 3, value: 20, reqAttack: 1 },
  iron_sword: { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', slot: 'weapon', style: 'melee', attackBonus: 8, strengthBonus: 7, value: 80, reqAttack: 5 },
  steel_sword: { id: 'steel_sword', name: 'Steel Sword', type: 'weapon', slot: 'weapon', style: 'melee', attackBonus: 16, strengthBonus: 14, value: 300, reqAttack: 10 },
  mithril_sword: { id: 'mithril_sword', name: 'Mithril Sword', type: 'weapon', slot: 'weapon', style: 'melee', attackBonus: 24, strengthBonus: 22, value: 1000, reqAttack: 20 },
  adamant_sword: { id: 'adamant_sword', name: 'Adamant Sword', type: 'weapon', slot: 'weapon', style: 'melee', attackBonus: 32, strengthBonus: 30, value: 4000, reqAttack: 30 },
  rune_sword: { id: 'rune_sword', name: 'Rune Sword', type: 'weapon', slot: 'weapon', style: 'melee', attackBonus: 48, strengthBonus: 44, value: 20000, reqAttack: 40 },

  // Weapons - Ranged
  shortbow: { id: 'shortbow', name: 'Shortbow', type: 'weapon', slot: 'weapon', style: 'ranged', attackBonus: 6, strengthBonus: 0, value: 50, reqRanged: 1, range: 4 },
  longbow: { id: 'longbow', name: 'Longbow', type: 'weapon', slot: 'weapon', style: 'ranged', attackBonus: 10, strengthBonus: 0, value: 150, reqRanged: 5, range: 6 },

  // Weapons - Magic
  staff_of_air: { id: 'staff_of_air', name: 'Staff of Air', type: 'weapon', slot: 'weapon', style: 'magic', attackBonus: 3, magicBonus: 10, value: 200, reqMagic: 1 },
  staff_of_fire: { id: 'staff_of_fire', name: 'Staff of Fire', type: 'weapon', slot: 'weapon', style: 'magic', attackBonus: 3, magicBonus: 15, value: 500, reqMagic: 10 },

  // Armour - Helmets
  bronze_helm: { id: 'bronze_helm', name: 'Bronze Helm', type: 'armour', slot: 'head', defenceBonus: 3, value: 15, reqDefence: 1 },
  iron_helm: { id: 'iron_helm', name: 'Iron Helm', type: 'armour', slot: 'head', defenceBonus: 6, value: 60, reqDefence: 5 },
  steel_helm: { id: 'steel_helm', name: 'Steel Helm', type: 'armour', slot: 'head', defenceBonus: 12, value: 250, reqDefence: 10 },
  rune_helm: { id: 'rune_helm', name: 'Rune Helm', type: 'armour', slot: 'head', defenceBonus: 30, value: 15000, reqDefence: 40 },

  // Armour - Bodies
  bronze_plate: { id: 'bronze_plate', name: 'Bronze Platebody', type: 'armour', slot: 'body', defenceBonus: 8, value: 50, reqDefence: 1 },
  iron_plate: { id: 'iron_plate', name: 'Iron Platebody', type: 'armour', slot: 'body', defenceBonus: 16, value: 200, reqDefence: 5 },
  steel_plate: { id: 'steel_plate', name: 'Steel Platebody', type: 'armour', slot: 'body', defenceBonus: 30, value: 800, reqDefence: 10 },
  rune_plate: { id: 'rune_plate', name: 'Rune Platebody', type: 'armour', slot: 'body', defenceBonus: 65, value: 50000, reqDefence: 40 },

  // Armour - Legs
  bronze_legs: { id: 'bronze_legs', name: 'Bronze Platelegs', type: 'armour', slot: 'legs', defenceBonus: 5, value: 30, reqDefence: 1 },
  iron_legs: { id: 'iron_legs', name: 'Iron Platelegs', type: 'armour', slot: 'legs', defenceBonus: 10, value: 120, reqDefence: 5 },
  steel_legs: { id: 'steel_legs', name: 'Steel Platelegs', type: 'armour', slot: 'legs', defenceBonus: 20, value: 500, reqDefence: 10 },
  rune_legs: { id: 'rune_legs', name: 'Rune Platelegs', type: 'armour', slot: 'legs', defenceBonus: 45, value: 35000, reqDefence: 40 },

  // Armour - Shields
  bronze_shield: { id: 'bronze_shield', name: 'Bronze Shield', type: 'armour', slot: 'shield', defenceBonus: 4, value: 25, reqDefence: 1 },
  iron_shield: { id: 'iron_shield', name: 'Iron Shield', type: 'armour', slot: 'shield', defenceBonus: 8, value: 100, reqDefence: 5 },
  steel_shield: { id: 'steel_shield', name: 'Steel Shield', type: 'armour', slot: 'shield', defenceBonus: 16, value: 400, reqDefence: 10 },
  rune_shield: { id: 'rune_shield', name: 'Rune Shield', type: 'armour', slot: 'shield', defenceBonus: 40, value: 25000, reqDefence: 40 },

  // Arrows
  bronze_arrows: { id: 'bronze_arrows', name: 'Bronze Arrows', type: 'ammo', rangedStrength: 3, value: 2, stackable: true },
  iron_arrows: { id: 'iron_arrows', name: 'Iron Arrows', type: 'ammo', rangedStrength: 6, value: 8, stackable: true },

  // Runes
  air_rune: { id: 'air_rune', name: 'Air Rune', type: 'rune', value: 5, stackable: true },
  fire_rune: { id: 'fire_rune', name: 'Fire Rune', type: 'rune', value: 5, stackable: true },
  water_rune: { id: 'water_rune', name: 'Water Rune', type: 'rune', value: 5, stackable: true },
  earth_rune: { id: 'earth_rune', name: 'Earth Rune', type: 'rune', value: 5, stackable: true },
  mind_rune: { id: 'mind_rune', name: 'Mind Rune', type: 'rune', value: 10, stackable: true },
  chaos_rune: { id: 'chaos_rune', name: 'Chaos Rune', type: 'rune', value: 50, stackable: true },

  // Food
  shrimp: { id: 'shrimp', name: 'Shrimp', type: 'food', healAmount: 3, value: 5 },
  trout: { id: 'trout', name: 'Trout', type: 'food', healAmount: 7, value: 20 },
  salmon: { id: 'salmon', name: 'Salmon', type: 'food', healAmount: 9, value: 40 },
  lobster: { id: 'lobster', name: 'Lobster', type: 'food', healAmount: 12, value: 100 },
  swordfish: { id: 'swordfish', name: 'Swordfish', type: 'food', healAmount: 14, value: 200 },

  // Raw fish
  raw_shrimp: { id: 'raw_shrimp', name: 'Raw Shrimp', type: 'raw_food', cooksInto: 'shrimp', cookLevel: 1, value: 2 },
  raw_trout: { id: 'raw_trout', name: 'Raw Trout', type: 'raw_food', cooksInto: 'trout', cookLevel: 15, value: 10 },
  raw_salmon: { id: 'raw_salmon', name: 'Raw Salmon', type: 'raw_food', cooksInto: 'salmon', cookLevel: 25, value: 20 },
  raw_lobster: { id: 'raw_lobster', name: 'Raw Lobster', type: 'raw_food', cooksInto: 'lobster', cookLevel: 40, value: 50 },

  // Ores and bars
  copper_ore: { id: 'copper_ore', name: 'Copper Ore', type: 'ore', value: 5 },
  tin_ore: { id: 'tin_ore', name: 'Tin Ore', type: 'ore', value: 5 },
  iron_ore: { id: 'iron_ore', name: 'Iron Ore', type: 'ore', value: 20 },
  gold_ore: { id: 'gold_ore', name: 'Gold Ore', type: 'ore', value: 150 },
  bronze_bar: { id: 'bronze_bar', name: 'Bronze Bar', type: 'bar', value: 15 },
  iron_bar: { id: 'iron_bar', name: 'Iron Bar', type: 'bar', value: 50 },
  gold_bar: { id: 'gold_bar', name: 'Gold Bar', type: 'bar', value: 300 },

  // Tools
  bronze_pickaxe: { id: 'bronze_pickaxe', name: 'Bronze Pickaxe', type: 'tool', toolType: 'pickaxe', miningBonus: 1, value: 15 },
  iron_pickaxe: { id: 'iron_pickaxe', name: 'Iron Pickaxe', type: 'tool', toolType: 'pickaxe', miningBonus: 2, value: 60 },
  steel_pickaxe: { id: 'steel_pickaxe', name: 'Steel Pickaxe', type: 'tool', toolType: 'pickaxe', miningBonus: 3, value: 250 },
  bronze_axe: { id: 'bronze_axe', name: 'Bronze Axe', type: 'tool', toolType: 'axe', wcBonus: 1, value: 15 },
  iron_axe: { id: 'iron_axe', name: 'Iron Axe', type: 'tool', toolType: 'axe', wcBonus: 2, value: 60 },
  fishing_net: { id: 'fishing_net', name: 'Fishing Net', type: 'tool', toolType: 'fishing_net', value: 5 },
  fishing_rod: { id: 'fishing_rod', name: 'Fishing Rod', type: 'tool', toolType: 'fishing_rod', value: 10 },
  tinderbox: { id: 'tinderbox', name: 'Tinderbox', type: 'tool', toolType: 'tinderbox', value: 5 },

  // Logs
  logs: { id: 'logs', name: 'Logs', type: 'log', value: 5 },
  oak_logs: { id: 'oak_logs', name: 'Oak Logs', type: 'log', value: 20 },

  // Quest items
  goblin_mail: { id: 'goblin_mail', name: 'Goblin Mail', type: 'quest', value: 0, questItem: true },
  mysterious_key: { id: 'mysterious_key', name: 'Mysterious Key', type: 'quest', value: 0, questItem: true },

  // Misc
  coins: { id: 'coins', name: 'Coins', type: 'currency', value: 1, stackable: true },
  bones: { id: 'bones', name: 'Bones', type: 'bones', prayerXp: 5, value: 1 }
};

// Spells
const SPELLS = {
  wind_strike: { id: 'wind_strike', name: 'Wind Strike', level: 1, maxHit: 2, runes: { air_rune: 1, mind_rune: 1 }, xp: 6 },
  water_strike: { id: 'water_strike', name: 'Water Strike', level: 5, maxHit: 4, runes: { water_rune: 1, air_rune: 1, mind_rune: 1 }, xp: 8 },
  earth_strike: { id: 'earth_strike', name: 'Earth Strike', level: 9, maxHit: 6, runes: { earth_rune: 2, air_rune: 1, mind_rune: 1 }, xp: 10 },
  fire_strike: { id: 'fire_strike', name: 'Fire Strike', level: 13, maxHit: 8, runes: { fire_rune: 3, air_rune: 2, mind_rune: 1 }, xp: 12 },
  wind_bolt: { id: 'wind_bolt', name: 'Wind Bolt', level: 17, maxHit: 9, runes: { air_rune: 2, chaos_rune: 1 }, xp: 14 },
  fire_bolt: { id: 'fire_bolt', name: 'Fire Bolt', level: 35, maxHit: 12, runes: { fire_rune: 4, air_rune: 3, chaos_rune: 1 }, xp: 22 }
};

if (typeof module !== 'undefined') {
  module.exports = { ITEMS, SPELLS };
}
