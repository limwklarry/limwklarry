// NPC definitions
const NPC_TYPES = {
  // Monsters
  chicken: { id: 'chicken', name: 'Chicken', level: 1, hp: 3, attack: 1, strength: 1, defence: 1, aggressive: false, respawnTime: 10, drops: [{ item: 'bones', chance: 1.0 }, { item: 'coins', chance: 0.5, min: 1, max: 5 }] },
  cow: { id: 'cow', name: 'Cow', level: 2, hp: 8, attack: 1, strength: 1, defence: 1, aggressive: false, respawnTime: 10, drops: [{ item: 'bones', chance: 1.0 }, { item: 'coins', chance: 0.3, min: 1, max: 3 }] },
  goblin: { id: 'goblin', name: 'Goblin', level: 5, hp: 15, attack: 4, strength: 4, defence: 4, aggressive: false, respawnTime: 15, drops: [{ item: 'bones', chance: 1.0 }, { item: 'coins', chance: 0.6, min: 2, max: 15 }, { item: 'bronze_sword', chance: 0.05 }, { item: 'goblin_mail', chance: 0.1 }] },
  skeleton: { id: 'skeleton', name: 'Skeleton', level: 15, hp: 30, attack: 12, strength: 13, defence: 12, aggressive: true, respawnTime: 20, drops: [{ item: 'bones', chance: 1.0 }, { item: 'coins', chance: 0.5, min: 5, max: 40 }, { item: 'iron_sword', chance: 0.08 }] },
  zombie: { id: 'zombie', name: 'Zombie', level: 18, hp: 35, attack: 15, strength: 14, defence: 13, aggressive: true, respawnTime: 20, drops: [{ item: 'bones', chance: 1.0 }, { item: 'coins', chance: 0.4, min: 5, max: 50 }] },
  giant_spider: { id: 'giant_spider', name: 'Giant Spider', level: 10, hp: 22, attack: 8, strength: 7, defence: 6, aggressive: true, respawnTime: 15, drops: [{ item: 'coins', chance: 0.3, min: 1, max: 20 }] },
  dark_wizard: { id: 'dark_wizard', name: 'Dark Wizard', level: 25, hp: 45, attack: 20, strength: 18, defence: 15, aggressive: true, magic: 25, respawnTime: 25, drops: [{ item: 'bones', chance: 1.0 }, { item: 'coins', chance: 0.7, min: 10, max: 80 }, { item: 'air_rune', chance: 0.3, min: 2, max: 8 }, { item: 'chaos_rune', chance: 0.1, min: 1, max: 3 }] },
  lesser_demon: { id: 'lesser_demon', name: 'Lesser Demon', level: 50, hp: 80, attack: 40, strength: 38, defence: 35, aggressive: true, respawnTime: 30, drops: [{ item: 'bones', chance: 1.0 }, { item: 'coins', chance: 0.8, min: 30, max: 200 }, { item: 'rune_helm', chance: 0.01 }, { item: 'steel_sword', chance: 0.05 }] },

  // Friendly NPCs
  shop_keeper: { id: 'shop_keeper', name: 'Shop Keeper', level: 0, hp: 999, friendly: true, dialogue: 'shopkeeper', shop: 'general_store' },
  banker: { id: 'banker', name: 'Banker', level: 0, hp: 999, friendly: true, dialogue: 'banker' },
  combat_tutor: { id: 'combat_tutor', name: 'Combat Tutor', level: 0, hp: 999, friendly: true, dialogue: 'combat_tutor' },
  hans: { id: 'hans', name: 'Hans', level: 0, hp: 999, friendly: true, dialogue: 'hans' },
  quest_cook: { id: 'quest_cook', name: 'Cook', level: 0, hp: 999, friendly: true, dialogue: 'cook', questGiver: 'cooks_assistant' },
  quest_duke: { id: 'quest_duke', name: 'Duke Horacio', level: 0, hp: 999, friendly: true, dialogue: 'duke', questGiver: 'restless_ghost' }
};

// Shops
const SHOPS = {
  general_store: {
    name: 'Lumbridge General Store',
    stock: [
      { item: 'bronze_sword', qty: 5, price: 25 },
      { item: 'bronze_shield', qty: 5, price: 30 },
      { item: 'bronze_helm', qty: 5, price: 20 },
      { item: 'bronze_plate', qty: 3, price: 60 },
      { item: 'bronze_legs', qty: 3, price: 40 },
      { item: 'bronze_pickaxe', qty: 3, price: 20 },
      { item: 'bronze_axe', qty: 3, price: 20 },
      { item: 'fishing_net', qty: 5, price: 8 },
      { item: 'fishing_rod', qty: 5, price: 15 },
      { item: 'tinderbox', qty: 5, price: 8 },
      { item: 'shortbow', qty: 3, price: 60 },
      { item: 'bronze_arrows', qty: 100, price: 3 },
      { item: 'air_rune', qty: 50, price: 8 },
      { item: 'mind_rune', qty: 50, price: 15 },
      { item: 'water_rune', qty: 50, price: 8 },
      { item: 'earth_rune', qty: 50, price: 8 },
      { item: 'fire_rune', qty: 50, price: 8 },
      { item: 'staff_of_air', qty: 2, price: 250 },
      { item: 'shrimp', qty: 20, price: 8 },
      { item: 'lobster', qty: 10, price: 120 }
    ]
  },
  sword_shop: {
    name: 'Varrock Sword Shop',
    stock: [
      { item: 'bronze_sword', qty: 10, price: 25 },
      { item: 'iron_sword', qty: 5, price: 100 },
      { item: 'steel_sword', qty: 3, price: 400 },
      { item: 'mithril_sword', qty: 2, price: 1200 },
      { item: 'adamant_sword', qty: 1, price: 5000 }
    ]
  }
};

// NPC Dialogues
const DIALOGUES = {
  shopkeeper: [
    { text: 'Welcome to my shop! Would you like to trade?', options: [{ text: 'Yes, show me your wares.', action: 'open_shop' }, { text: 'No thanks.', action: 'close' }] }
  ],
  banker: [
    { text: 'Welcome to the bank. How can I help you?', options: [{ text: 'I\'d like to access my bank.', action: 'open_bank' }, { text: 'Nevermind.', action: 'close' }] }
  ],
  combat_tutor: [
    { text: 'Greetings, adventurer! I can teach you about combat. Click on a monster to attack it. Eat food to restore your health.', options: [{ text: 'Thanks for the tip!', action: 'close' }] }
  ],
  hans: [
    { text: 'Hello there! Welcome to Lumbridge. This is where all new adventurers begin their journey.', options: [{ text: 'Thanks, Hans!', action: 'close' }] }
  ],
  cook: [
    { npc: 'quest_cook', questState: 'not_started', text: 'Oh dear, oh dear! I need to cook a feast for the Duke, but I\'ve run out of ingredients! Can you help me?', options: [{ text: 'Sure, what do you need?', action: 'accept_quest', quest: 'cooks_assistant' }, { text: 'Not right now.', action: 'close' }] },
    { npc: 'quest_cook', questState: 'in_progress', text: 'I still need those ingredients! Please bring me a Raw Shrimp, a Copper Ore, and some Logs.', options: [{ text: 'I\'ll get right on it.', action: 'close' }] },
    { npc: 'quest_cook', questState: 'completed', text: 'Thank you so much for your help! The feast was a success!', options: [{ text: 'Glad I could help!', action: 'close' }] }
  ],
  duke: [
    { npc: 'quest_duke', questState: 'not_started', text: 'Greetings, adventurer. A ghost in the church graveyard has been disturbing the peace. Can you investigate?', options: [{ text: 'I\'ll look into it.', action: 'accept_quest', quest: 'restless_ghost' }, { text: 'Maybe later.', action: 'close' }] },
    { npc: 'quest_duke', questState: 'in_progress', text: 'Have you dealt with the ghost yet? Find the Mysterious Key to put it to rest.', options: [{ text: 'I\'m working on it.', action: 'close' }] },
    { npc: 'quest_duke', questState: 'completed', text: 'Thank you for putting that ghost to rest. Lumbridge is safer thanks to you!', options: [{ text: 'It was my pleasure, Duke.', action: 'close' }] }
  ]
};

if (typeof module !== 'undefined') {
  module.exports = { NPC_TYPES, SHOPS, DIALOGUES };
}
