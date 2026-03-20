// Quest definitions
const QUESTS = {
  cooks_assistant: {
    id: 'cooks_assistant',
    name: "Cook's Assistant",
    description: 'Help the Lumbridge Cook gather ingredients for a feast.',
    requirements: [],
    objectives: [
      { type: 'collect', item: 'raw_shrimp', quantity: 1, text: 'Collect a Raw Shrimp' },
      { type: 'collect', item: 'copper_ore', quantity: 1, text: 'Collect a Copper Ore' },
      { type: 'collect', item: 'logs', quantity: 1, text: 'Collect some Logs' }
    ],
    turnInNpc: 'quest_cook',
    rewards: {
      xp: { cooking: 300, mining: 100, woodcutting: 100 },
      items: [{ item: 'coins', quantity: 100 }],
      questPoints: 1
    }
  },
  restless_ghost: {
    id: 'restless_ghost',
    name: 'The Restless Ghost',
    description: 'A ghost haunts the Lumbridge graveyard. Find a way to put it to rest.',
    requirements: [],
    objectives: [
      { type: 'kill', npc: 'skeleton', quantity: 3, text: 'Defeat 3 Skeletons in the graveyard' },
      { type: 'collect', item: 'mysterious_key', quantity: 1, text: 'Find the Mysterious Key' }
    ],
    turnInNpc: 'quest_duke',
    rewards: {
      xp: { prayer: 500, attack: 200 },
      items: [{ item: 'coins', quantity: 250 }, { item: 'iron_sword', quantity: 1 }],
      questPoints: 1
    }
  },
  goblin_diplomacy: {
    id: 'goblin_diplomacy',
    name: 'Goblin Diplomacy',
    description: 'The goblins are arguing again. Help settle their dispute by finding Goblin Mail.',
    requirements: [{ quest: 'cooks_assistant' }],
    objectives: [
      { type: 'collect', item: 'goblin_mail', quantity: 3, text: 'Collect 3 Goblin Mail from goblins' }
    ],
    turnInNpc: 'hans',
    rewards: {
      xp: { defence: 400, strength: 200 },
      items: [{ item: 'coins', quantity: 500 }, { item: 'steel_shield', quantity: 1 }],
      questPoints: 2
    }
  }
};

if (typeof module !== 'undefined') {
  module.exports = { QUESTS };
}
