// Game constants shared between client and server
const TILE_SIZE = 64;
const ISO_TILE_WIDTH = 64;
const ISO_TILE_HEIGHT = 32;
const TICK_RATE = 600; // ms per game tick (RuneScape classic style)
const MAP_WIDTH = 80;
const MAP_HEIGHT = 80;

// Tile types
const TILES = {
  GRASS: 0,
  DIRT: 1,
  WATER: 2,
  STONE: 3,
  SAND: 4,
  TREE: 5,
  WALL: 6,
  FLOOR: 7,
  ROAD: 8,
  BRIDGE: 9,
  DOOR: 10,
  ORE_COPPER: 11,
  ORE_IRON: 12,
  ORE_GOLD: 13,
  FURNACE: 14,
  ANVIL: 15,
  BANK: 16,
  ALTAR: 17
};

// Walkable tiles
const WALKABLE = new Set([
  TILES.GRASS, TILES.DIRT, TILES.SAND, TILES.FLOOR,
  TILES.ROAD, TILES.BRIDGE, TILES.DOOR
]);

// Skills
const SKILLS = {
  ATTACK: 'attack',
  STRENGTH: 'strength',
  DEFENCE: 'defence',
  HITPOINTS: 'hitpoints',
  RANGED: 'ranged',
  MAGIC: 'magic',
  PRAYER: 'prayer',
  MINING: 'mining',
  SMITHING: 'smithing',
  FISHING: 'fishing',
  COOKING: 'cooking',
  WOODCUTTING: 'woodcutting',
  FIREMAKING: 'firemaking'
};

// XP table (levels 1-99)
function xpForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += Math.floor(i + 300 * Math.pow(2, i / 7));
  }
  return Math.floor(total / 4);
}

function levelForXp(xp) {
  for (let level = 1; level <= 99; level++) {
    if (xpForLevel(level + 1) > xp) return level;
  }
  return 99;
}

// Combat styles
const COMBAT_STYLES = {
  MELEE: 'melee',
  RANGED: 'ranged',
  MAGIC: 'magic'
};

if (typeof module !== 'undefined') {
  module.exports = {
    TILE_SIZE, ISO_TILE_WIDTH, ISO_TILE_HEIGHT, TICK_RATE,
    MAP_WIDTH, MAP_HEIGHT, TILES, WALKABLE, SKILLS,
    xpForLevel, levelForXp, COMBAT_STYLES
  };
}
