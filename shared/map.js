// World map generator
const { TILES, MAP_WIDTH, MAP_HEIGHT } = typeof require !== 'undefined'
  ? require('./constants')
  : window.GameConstants || {};

function generateMap() {
  const map = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      map[y][x] = TILES.GRASS;
    }
  }

  // --- LUMBRIDGE (center area ~35-50, 35-50) ---
  // Castle
  for (let y = 38; y <= 44; y++) {
    for (let x = 38; x <= 44; x++) {
      if (y === 38 || y === 44 || x === 38 || x === 44) {
        map[y][x] = TILES.WALL;
      } else {
        map[y][x] = TILES.FLOOR;
      }
    }
  }
  map[44][41] = TILES.DOOR; // Castle entrance

  // Roads from castle
  for (let x = 30; x < 55; x++) { map[46][x] = TILES.ROAD; map[47][x] = TILES.ROAD; }
  for (let y = 30; y < 55; y++) { map[y][41] = TILES.ROAD; map[y][42] = TILES.ROAD; }

  // Lumbridge bank
  for (let y = 35; y <= 37; y++) {
    for (let x = 45; x <= 49; x++) {
      if (y === 35 || y === 37 || x === 45 || x === 49) {
        map[y][x] = TILES.WALL;
      } else {
        map[y][x] = TILES.FLOOR;
      }
    }
  }
  map[37][47] = TILES.DOOR;
  map[36][46] = TILES.BANK;

  // Lumbridge shop
  for (let y = 48; y <= 51; y++) {
    for (let x = 44; x <= 48; x++) {
      if (y === 48 || y === 51 || x === 44 || x === 48) {
        map[y][x] = TILES.WALL;
      } else {
        map[y][x] = TILES.FLOOR;
      }
    }
  }
  map[48][46] = TILES.DOOR;

  // Church/graveyard area (east of castle)
  for (let y = 38; y <= 42; y++) {
    for (let x = 50; x <= 54; x++) {
      map[y][x] = TILES.STONE;
    }
  }
  map[40][52] = TILES.ALTAR;

  // --- RIVER (runs north-south) ---
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const riverX = 30 + Math.floor(Math.sin(y * 0.15) * 2);
    for (let dx = 0; dx < 3; dx++) {
      if (riverX + dx >= 0 && riverX + dx < MAP_WIDTH) {
        map[y][riverX + dx] = TILES.WATER;
      }
    }
  }
  // Bridge over river
  map[46][30] = TILES.BRIDGE; map[46][31] = TILES.BRIDGE; map[46][32] = TILES.BRIDGE;
  map[47][30] = TILES.BRIDGE; map[47][31] = TILES.BRIDGE; map[47][32] = TILES.BRIDGE;

  // --- FOREST (northwest) ---
  for (let y = 5; y < 25; y++) {
    for (let x = 5; x < 25; x++) {
      if (Math.random() < 0.35) {
        map[y][x] = TILES.TREE;
      }
    }
  }

  // --- MINING AREA (southwest) ---
  for (let y = 55; y < 65; y++) {
    for (let x = 10; x < 20; x++) {
      map[y][x] = TILES.STONE;
    }
  }
  map[57][12] = TILES.ORE_COPPER;
  map[58][14] = TILES.ORE_COPPER;
  map[59][13] = TILES.ORE_COPPER;
  map[56][16] = TILES.ORE_IRON;
  map[60][17] = TILES.ORE_IRON;
  map[58][18] = TILES.ORE_GOLD;
  // Furnace and anvil near mine
  map[62][15] = TILES.FURNACE;
  map[62][17] = TILES.ANVIL;

  // --- FISHING SPOTS (southeast coast) ---
  for (let y = 55; y < 70; y++) {
    for (let x = 60; x < MAP_WIDTH; x++) {
      map[y][x] = TILES.WATER;
    }
  }
  // Beach
  for (let y = 55; y < 70; y++) {
    map[y][59] = TILES.SAND;
    map[y][58] = TILES.SAND;
  }

  // --- VARROCK (north area ~35-55, 8-22) ---
  // Varrock walls
  for (let y = 8; y <= 22; y++) {
    map[y][35] = TILES.WALL;
    map[y][55] = TILES.WALL;
  }
  for (let x = 35; x <= 55; x++) {
    map[8][x] = TILES.WALL;
    map[22][x] = TILES.WALL;
  }
  map[22][45] = TILES.DOOR; // Varrock gate

  // Varrock inner roads
  for (let x = 36; x < 55; x++) { map[15][x] = TILES.ROAD; }
  for (let y = 9; y < 22; y++) { map[y][45] = TILES.ROAD; }

  // Varrock buildings (inner floor areas)
  for (let y = 10; y <= 13; y++) {
    for (let x = 37; x <= 42; x++) {
      if (y === 10 || y === 13 || x === 37 || x === 42) {
        map[y][x] = TILES.WALL;
      } else {
        map[y][x] = TILES.FLOOR;
      }
    }
  }
  map[13][40] = TILES.DOOR; // Sword shop

  for (let y = 10; y <= 13; y++) {
    for (let x = 48; x <= 53; x++) {
      if (y === 10 || y === 13 || x === 48 || x === 53) {
        map[y][x] = TILES.WALL;
      } else {
        map[y][x] = TILES.FLOOR;
      }
    }
  }
  map[13][50] = TILES.DOOR; // Varrock bank
  map[11][50] = TILES.BANK;

  // --- WILDERNESS (far north, dangerous) ---
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (map[y][x] === TILES.GRASS) {
        map[y][x] = Math.random() < 0.3 ? TILES.DIRT : TILES.STONE;
      }
    }
  }

  // --- DESERT (far east) ---
  for (let y = 25; y < 50; y++) {
    for (let x = 65; x < MAP_WIDTH; x++) {
      if (map[y][x] === TILES.GRASS) {
        map[y][x] = TILES.SAND;
      }
    }
  }

  return map;
}

// NPC spawn positions
const NPC_SPAWNS = [
  // Lumbridge monsters
  { type: 'chicken', x: 50, y: 50, count: 4, radius: 3 },
  { type: 'cow', x: 55, y: 52, count: 3, radius: 4 },
  { type: 'goblin', x: 25, y: 45, count: 5, radius: 5 },
  { type: 'giant_spider', x: 15, y: 15, count: 3, radius: 4 },

  // Graveyard
  { type: 'skeleton', x: 52, y: 40, count: 4, radius: 3 },
  { type: 'zombie', x: 54, y: 42, count: 3, radius: 3 },

  // Varrock area
  { type: 'dark_wizard', x: 42, y: 28, count: 3, radius: 4 },
  { type: 'goblin', x: 58, y: 18, count: 4, radius: 3 },

  // Wilderness
  { type: 'lesser_demon', x: 40, y: 3, count: 2, radius: 3 },
  { type: 'skeleton', x: 50, y: 4, count: 4, radius: 4 },

  // Friendly NPCs - Lumbridge
  { type: 'shop_keeper', x: 46, y: 49, count: 1, radius: 0 },
  { type: 'banker', x: 47, y: 36, count: 1, radius: 0 },
  { type: 'combat_tutor', x: 43, y: 46, count: 1, radius: 0 },
  { type: 'hans', x: 40, y: 45, count: 1, radius: 0 },
  { type: 'quest_cook', x: 40, y: 41, count: 1, radius: 0 },
  { type: 'quest_duke', x: 41, y: 40, count: 1, radius: 0 }
];

// Fishing spots
const RESOURCE_NODES = [
  { type: 'fishing_spot_net', x: 58, y: 58, skill: 'fishing', level: 1, item: 'raw_shrimp', xp: 10, tool: 'fishing_net' },
  { type: 'fishing_spot_net', x: 58, y: 60, skill: 'fishing', level: 1, item: 'raw_shrimp', xp: 10, tool: 'fishing_net' },
  { type: 'fishing_spot_rod', x: 58, y: 62, skill: 'fishing', level: 20, item: 'raw_trout', xp: 50, tool: 'fishing_rod' },
  { type: 'fishing_spot_rod', x: 58, y: 64, skill: 'fishing', level: 30, item: 'raw_salmon', xp: 70, tool: 'fishing_rod' },
  { type: 'fishing_spot_cage', x: 58, y: 66, skill: 'fishing', level: 40, item: 'raw_lobster', xp: 90, tool: 'fishing_rod' }
];

if (typeof module !== 'undefined') {
  module.exports = { generateMap, NPC_SPAWNS, RESOURCE_NODES };
}
