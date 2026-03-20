const { TILES, WALKABLE, MAP_WIDTH, MAP_HEIGHT, levelForXp } = require('../shared/constants');
const { ITEMS, SPELLS } = require('../shared/items');
const { NPC_TYPES, SHOPS, DIALOGUES } = require('../shared/npcs');
const { QUESTS } = require('../shared/quests');
const { generateMap, NPC_SPAWNS, RESOURCE_NODES } = require('../shared/map');
const Player = require('./player');

class NPC {
  constructor(type, x, y, id) {
    const def = NPC_TYPES[type];
    this.id = id;
    this.type = type;
    this.name = def.name;
    this.x = x;
    this.y = y;
    this.spawnX = x;
    this.spawnY = y;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.level = def.level;
    this.attack = def.attack || 0;
    this.strength = def.strength || 0;
    this.defence = def.defence || 0;
    this.magic = def.magic || 0;
    this.aggressive = def.aggressive || false;
    this.friendly = def.friendly || false;
    this.shop = def.shop || null;
    this.questGiver = def.questGiver || null;
    this.dialogue = def.dialogue || null;
    this.drops = def.drops || [];
    this.respawnTime = def.respawnTime || 15;
    this.alive = true;
    this.respawnTimer = 0;
    this.inCombat = false;
    this.combatTarget = null;
    this.wanderTimer = 0;
  }

  serialize() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      x: this.x,
      y: this.y,
      hp: this.hp,
      maxHp: this.maxHp,
      level: this.level,
      alive: this.alive,
      friendly: this.friendly
    };
  }
}

class GameWorld {
  constructor() {
    this.map = generateMap();
    this.players = new Map();
    this.npcs = new Map();
    this.groundItems = [];
    this.resourceNodes = RESOURCE_NODES;
    this.tickCount = 0;
    this.npcIdCounter = 0;

    this.spawnNpcs();
  }

  spawnNpcs() {
    for (const spawn of NPC_SPAWNS) {
      for (let i = 0; i < spawn.count; i++) {
        const dx = spawn.radius > 0 ? Math.floor(Math.random() * spawn.radius * 2) - spawn.radius : 0;
        const dy = spawn.radius > 0 ? Math.floor(Math.random() * spawn.radius * 2) - spawn.radius : 0;
        let nx = Math.max(0, Math.min(MAP_WIDTH - 1, spawn.x + dx));
        let ny = Math.max(0, Math.min(MAP_HEIGHT - 1, spawn.y + dy));
        const id = `npc_${this.npcIdCounter++}`;
        this.npcs.set(id, new NPC(spawn.type, nx, ny, id));
      }
    }
  }

  addPlayer(socketId, name) {
    const player = new Player(socketId, name);
    this.players.set(socketId, player);
    return player;
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    // Release NPC combat targets
    for (const [, npc] of this.npcs) {
      if (npc.combatTarget === socketId) {
        npc.inCombat = false;
        npc.combatTarget = null;
      }
    }
  }

  serializePlayers() {
    const result = {};
    for (const [id, player] of this.players) {
      result[id] = player.serialize();
    }
    return result;
  }

  serializeNpcs() {
    const result = {};
    for (const [id, npc] of this.npcs) {
      if (npc.alive) {
        result[id] = npc.serialize();
      }
    }
    return result;
  }

  // Simple pathfinding (A* lite)
  findPath(startX, startY, endX, endY, maxDist = 20) {
    if (endX < 0 || endX >= MAP_WIDTH || endY < 0 || endY >= MAP_HEIGHT) return [];
    if (!WALKABLE.has(this.map[endY][endX])) {
      // Find adjacent walkable tile
      const adjacents = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      let best = null;
      let bestDist = Infinity;
      for (const [dx, dy] of adjacents) {
        const nx = endX + dx;
        const ny = endY + dy;
        if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT && WALKABLE.has(this.map[ny][nx])) {
          const d = Math.abs(nx - startX) + Math.abs(ny - startY);
          if (d < bestDist) {
            bestDist = d;
            best = { x: nx, y: ny };
          }
        }
      }
      if (best) {
        endX = best.x;
        endY = best.y;
      } else {
        return [];
      }
    }

    const open = [{ x: startX, y: startY, g: 0, h: 0, f: 0, parent: null }];
    const closed = new Set();
    const key = (x, y) => `${x},${y}`;

    while (open.length > 0) {
      open.sort((a, b) => a.f - b.f);
      const current = open.shift();

      if (current.x === endX && current.y === endY) {
        const path = [];
        let node = current;
        while (node.parent) {
          path.unshift({ x: node.x, y: node.y });
          node = node.parent;
        }
        return path;
      }

      closed.add(key(current.x, current.y));

      if (current.g >= maxDist) continue;

      const neighbors = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (const [dx, dy] of neighbors) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
        if (!WALKABLE.has(this.map[ny][nx])) continue;
        if (closed.has(key(nx, ny))) continue;

        const g = current.g + 1;
        const h = Math.abs(nx - endX) + Math.abs(ny - endY);
        const existing = open.find(n => n.x === nx && n.y === ny);
        if (existing) {
          if (g < existing.g) {
            existing.g = g;
            existing.f = g + h;
            existing.parent = current;
          }
        } else {
          open.push({ x: nx, y: ny, g, h, f: g + h, parent: current });
        }
      }
    }
    return [];
  }

  movePlayer(socketId, targetX, targetY) {
    const player = this.players.get(socketId);
    if (!player) return null;

    // Stop combat and skilling
    player.inCombat = false;
    player.combatTarget = null;
    player.skilling = null;

    const path = this.findPath(player.x, player.y, targetX, targetY);
    if (path.length > 0) {
      player.path = path;
      player.moving = true;
      return { x: targetX, y: targetY, path };
    }
    return null;
  }

  startCombat(socketId, npcId) {
    const player = this.players.get(socketId);
    const npc = this.npcs.get(npcId);
    if (!player || !npc || !npc.alive || npc.friendly) return;

    const dist = Math.abs(player.x - npc.x) + Math.abs(player.y - npc.y);
    if (dist > 1) {
      // Walk to NPC first
      const path = this.findPath(player.x, player.y, npc.x, npc.y);
      if (path.length > 0) {
        player.path = path;
        player.moving = true;
      }
    }

    player.inCombat = true;
    player.combatTarget = npcId;
    player.combatTargetType = 'npc';
    player.skilling = null;
    npc.inCombat = true;
    npc.combatTarget = socketId;
  }

  startPvpCombat(attackerId, targetId) {
    const attacker = this.players.get(attackerId);
    const target = this.players.get(targetId);
    if (!attacker || !target) return;

    attacker.inCombat = true;
    attacker.combatTarget = targetId;
    attacker.combatTargetType = 'player';
    target.inCombat = true;
    target.combatTarget = attackerId;
    target.combatTargetType = 'player';
  }

  processCombat() {
    const updates = [];

    for (const [playerId, player] of this.players) {
      if (!player.inCombat || !player.combatTarget) continue;

      if (player.combatTargetType === 'npc') {
        const npc = this.npcs.get(player.combatTarget);
        if (!npc || !npc.alive) {
          player.inCombat = false;
          player.combatTarget = null;
          continue;
        }

        const dist = Math.abs(player.x - npc.x) + Math.abs(player.y - npc.y);
        const attackRange = player.combatStyle === 'melee' ? 1 :
          player.combatStyle === 'ranged' ? 5 : 4;

        if (dist > attackRange) continue;

        // Player attacks NPC
        if (this.tickCount - player.lastAttackTick >= 4) {
          const hit = this.calculateHit(player, npc);
          npc.hp -= hit.damage;
          player.lastAttackTick = this.tickCount;

          const update = {
            attackerId: playerId,
            attackerType: 'player',
            targetId: npc.id,
            targetType: 'npc',
            damage: hit.damage,
            style: hit.style,
            targetHp: npc.hp,
            targetMaxHp: npc.maxHp,
            targetDied: false
          };

          // Grant XP
          const xpGained = Math.max(1, hit.damage) * 4;
          const playerUpdates = { id: playerId, data: player.serialize() };

          if (player.combatStyle === 'melee') {
            player.addXp('attack', xpGained);
            player.addXp('strength', xpGained);
            player.addXp('defence', Math.floor(xpGained / 3));
          } else if (player.combatStyle === 'ranged') {
            player.addXp('ranged', xpGained);
          } else if (player.combatStyle === 'magic') {
            player.addXp('magic', xpGained);
          }
          player.addXp('hitpoints', Math.floor(xpGained / 3));

          if (npc.hp <= 0) {
            update.targetDied = true;
            npc.alive = false;
            npc.respawnTimer = npc.respawnTime;
            npc.inCombat = false;
            player.inCombat = false;
            player.combatTarget = null;

            // Drop items
            this.processDrops(npc, player);

            // Quest progress
            this.checkKillQuest(player, npc.type);
          }

          playerUpdates.skillUpdate = player.skills;
          updates.push(update);
        }

        // NPC attacks player back
        if (npc.alive && npc.hp > 0) {
          const npcHit = this.calculateNpcHit(npc, player);
          player.hp -= npcHit;
          if (player.hp <= 0) {
            player.hp = player.maxHp;
            player.x = 41;
            player.y = 46;
            player.inCombat = false;
            player.combatTarget = null;
            npc.inCombat = false;
            npc.combatTarget = null;
            updates.push({
              attackerId: npc.id,
              attackerType: 'npc',
              targetId: playerId,
              targetType: 'player',
              damage: npcHit,
              targetHp: 0,
              targetMaxHp: player.maxHp,
              targetDied: true,
              respawnX: 41,
              respawnY: 46
            });
          } else {
            updates.push({
              attackerId: npc.id,
              attackerType: 'npc',
              targetId: playerId,
              targetType: 'player',
              damage: npcHit,
              targetHp: player.hp,
              targetMaxHp: player.maxHp,
              targetDied: false
            });
          }
        }
      }
    }

    return updates;
  }

  calculateHit(player, target) {
    let maxHit, accuracy;
    const style = player.combatStyle;

    if (style === 'melee') {
      const effectiveStr = player.skills.strength.level + Math.floor(player.getStrengthBonus() / 4);
      maxHit = Math.floor(1.3 + effectiveStr / 10 + player.getStrengthBonus() / 80);
      accuracy = player.skills.attack.level + player.getAttackBonus();
    } else if (style === 'ranged') {
      maxHit = Math.floor(1 + player.skills.ranged.level / 10 + 2);
      accuracy = player.skills.ranged.level + player.getAttackBonus();
      // Consume arrow
      if (player.hasItem('bronze_arrows')) {
        player.removeItem('bronze_arrows', 1);
      } else if (player.hasItem('iron_arrows')) {
        player.removeItem('iron_arrows', 1);
        maxHit += 2;
      }
    } else {
      // Magic
      const spell = SPELLS[player.selectedSpell];
      if (spell && player.skills.magic.level >= spell.level) {
        // Check runes
        let hasRunes = true;
        for (const [rune, qty] of Object.entries(spell.runes)) {
          if (!player.hasItem(rune, qty)) { hasRunes = false; break; }
        }
        if (hasRunes) {
          for (const [rune, qty] of Object.entries(spell.runes)) {
            player.removeItem(rune, qty);
          }
          maxHit = spell.maxHit + Math.floor(player.getMagicBonus() / 5);
          accuracy = player.skills.magic.level + player.getMagicBonus();
        } else {
          maxHit = 1;
          accuracy = player.skills.attack.level;
        }
      } else {
        maxHit = 1;
        accuracy = player.skills.attack.level;
      }
    }

    const defence = target.defence || 0;
    const hitChance = Math.min(0.95, Math.max(0.05, (accuracy - defence / 2) / (accuracy + 10)));
    const hit = Math.random() < hitChance;
    const damage = hit ? Math.floor(Math.random() * (maxHit + 1)) : 0;

    return { damage, style };
  }

  calculateNpcHit(npc, player) {
    const maxHit = Math.floor(1 + npc.strength / 10 + npc.level / 15);
    const accuracy = npc.attack;
    const defence = player.skills.defence.level + player.getDefenceBonus();
    const hitChance = Math.min(0.9, Math.max(0.05, (accuracy - defence / 2) / (accuracy + 10)));
    const hit = Math.random() < hitChance;
    return hit ? Math.floor(Math.random() * (maxHit + 1)) : 0;
  }

  processDrops(npc, player) {
    for (const drop of npc.drops) {
      if (Math.random() < drop.chance) {
        const qty = drop.min ? Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min : 1;
        if (!player.addItem(drop.item, qty)) {
          // Drop on ground if inventory full
          this.groundItems.push({
            item: drop.item,
            quantity: qty,
            x: npc.x,
            y: npc.y,
            timer: 100
          });
        }
      }
    }
  }

  checkKillQuest(player, npcType) {
    for (const [questId, questState] of Object.entries(player.quests)) {
      if (questState.status !== 'in_progress') continue;
      const questDef = QUESTS[questId];
      if (!questDef) continue;
      for (let i = 0; i < questDef.objectives.length; i++) {
        const obj = questDef.objectives[i];
        if (obj.type === 'kill' && obj.npc === npcType) {
          if (!questState.progress[i]) questState.progress[i] = 0;
          questState.progress[i]++;
          // Drop quest items if applicable
          if (npcType === 'skeleton' && questId === 'restless_ghost' && Math.random() < 0.3) {
            player.addItem('mysterious_key', 1);
          }
        }
      }
    }
  }

  equipItem(socketId, slotIndex) {
    const player = this.players.get(socketId);
    if (!player || slotIndex < 0 || slotIndex >= 28) return false;

    const invItem = player.inventory[slotIndex];
    if (!invItem) return false;

    const itemDef = ITEMS[invItem.id];
    if (!itemDef || (itemDef.type !== 'weapon' && itemDef.type !== 'armour')) return false;

    // Check requirements
    if (itemDef.reqAttack && player.skills.attack.level < itemDef.reqAttack) return false;
    if (itemDef.reqDefence && player.skills.defence.level < itemDef.reqDefence) return false;
    if (itemDef.reqRanged && player.skills.ranged.level < itemDef.reqRanged) return false;
    if (itemDef.reqMagic && player.skills.magic.level < itemDef.reqMagic) return false;

    const slot = itemDef.slot;
    const current = player.equipment[slot];

    // Swap
    player.inventory[slotIndex] = current;
    player.equipment[slot] = { id: invItem.id, quantity: 1 };

    return true;
  }

  unequipItem(socketId, slot) {
    const player = this.players.get(socketId);
    if (!player || !player.equipment[slot]) return false;

    const emptySlot = player.inventory.findIndex(s => s === null);
    if (emptySlot === -1) return false;

    player.inventory[emptySlot] = player.equipment[slot];
    player.equipment[slot] = null;
    return true;
  }

  eatFood(socketId, slotIndex) {
    const player = this.players.get(socketId);
    if (!player || slotIndex < 0 || slotIndex >= 28) return false;

    const invItem = player.inventory[slotIndex];
    if (!invItem) return false;

    const itemDef = ITEMS[invItem.id];
    if (!itemDef || itemDef.type !== 'food') return false;

    player.hp = Math.min(player.maxHp, player.hp + itemDef.healAmount);
    if (invItem.quantity <= 1) {
      player.inventory[slotIndex] = null;
    } else {
      player.inventory[slotIndex].quantity--;
    }
    return true;
  }

  buryBones(socketId, slotIndex) {
    const player = this.players.get(socketId);
    if (!player || slotIndex < 0 || slotIndex >= 28) return false;

    const invItem = player.inventory[slotIndex];
    if (!invItem) return false;

    const itemDef = ITEMS[invItem.id];
    if (!itemDef || itemDef.type !== 'bones') return false;

    player.addXp('prayer', itemDef.prayerXp);
    if (invItem.quantity <= 1) {
      player.inventory[slotIndex] = null;
    } else {
      player.inventory[slotIndex].quantity--;
    }
    return true;
  }

  dropItem(socketId, slotIndex) {
    const player = this.players.get(socketId);
    if (!player || slotIndex < 0 || slotIndex >= 28) return false;
    const invItem = player.inventory[slotIndex];
    if (!invItem) return false;

    this.groundItems.push({
      item: invItem.id,
      quantity: invItem.quantity,
      x: player.x,
      y: player.y,
      timer: 100
    });
    player.inventory[slotIndex] = null;
    return true;
  }

  talkToNpc(socketId, npcId) {
    const player = this.players.get(socketId);
    const npc = this.npcs.get(npcId);
    if (!player || !npc || !npc.alive || !npc.friendly) return null;

    const dist = Math.abs(player.x - npc.x) + Math.abs(player.y - npc.y);
    if (dist > 2) return null;

    const dialogueKey = npc.dialogue;
    if (!dialogueKey || !DIALOGUES[dialogueKey]) return null;

    const dialogues = DIALOGUES[dialogueKey];

    // Find appropriate dialogue based on quest state
    if (npc.questGiver) {
      const questState = player.quests[npc.questGiver];
      const status = questState ? questState.status : 'not_started';
      const match = dialogues.find(d => d.questState === status);
      if (match) return { npcName: npc.name, ...match };
    }

    return { npcName: npc.name, ...dialogues[0] };
  }

  handleDialogueOption(socketId, action, data) {
    const player = this.players.get(socketId);
    if (!player) return null;

    if (action === 'open_shop') {
      // Find which NPC and shop
      const npc = this.findNearbyFriendlyNpc(player);
      if (npc && npc.shop) {
        return { type: 'shop', shop: { id: npc.shop, ...SHOPS[npc.shop] } };
      }
    } else if (action === 'open_bank') {
      return { type: 'bank' };
    } else if (action === 'accept_quest') {
      const questId = data.quest;
      if (questId && QUESTS[questId] && !player.quests[questId]) {
        // Check requirements
        const quest = QUESTS[questId];
        for (const req of quest.requirements) {
          if (req.quest && (!player.quests[req.quest] || player.quests[req.quest].status !== 'completed')) {
            return null;
          }
        }
        player.quests[questId] = {
          status: 'in_progress',
          progress: new Array(quest.objectives.length).fill(0)
        };
        return { type: 'quest', questName: quest.name };
      }
    }
    return null;
  }

  findNearbyFriendlyNpc(player) {
    for (const [, npc] of this.npcs) {
      if (npc.friendly && npc.alive) {
        const dist = Math.abs(player.x - npc.x) + Math.abs(player.y - npc.y);
        if (dist <= 2) return npc;
      }
    }
    return null;
  }

  buyItem(socketId, shopId, itemIndex, quantity) {
    const player = this.players.get(socketId);
    if (!player) return { success: false, message: 'Player not found' };

    const shop = SHOPS[shopId];
    if (!shop || itemIndex < 0 || itemIndex >= shop.stock.length) {
      return { success: false, message: 'Invalid shop or item' };
    }

    const stockItem = shop.stock[itemIndex];
    const totalCost = stockItem.price * quantity;

    if (player.countItem('coins') < totalCost) {
      return { success: false, message: 'Not enough coins!' };
    }

    if (!player.addItem(stockItem.item, quantity)) {
      return { success: false, message: 'Inventory is full!' };
    }

    player.removeItem('coins', totalCost);
    return { success: true, message: `Bought ${quantity}x ${ITEMS[stockItem.item].name} for ${totalCost} coins.` };
  }

  sellItem(socketId, slotIndex) {
    const player = this.players.get(socketId);
    if (!player || slotIndex < 0 || slotIndex >= 28) return { success: false };

    const invItem = player.inventory[slotIndex];
    if (!invItem) return { success: false };

    const itemDef = ITEMS[invItem.id];
    if (!itemDef || itemDef.type === 'quest') return { success: false, message: "Can't sell quest items!" };

    const sellPrice = Math.floor(itemDef.value * 0.6);
    player.inventory[slotIndex] = null;
    player.addItem('coins', sellPrice * invItem.quantity);

    return { success: true, message: `Sold ${invItem.quantity}x ${itemDef.name} for ${sellPrice * invItem.quantity} coins.` };
  }

  depositItem(socketId, slotIndex, quantity) {
    const player = this.players.get(socketId);
    if (!player || slotIndex < 0 || slotIndex >= 28) return false;

    const invItem = player.inventory[slotIndex];
    if (!invItem) return false;

    const depositQty = Math.min(quantity, invItem.quantity);

    // Add to bank
    const bankItem = player.bank.find(b => b.id === invItem.id);
    if (bankItem) {
      bankItem.quantity += depositQty;
    } else {
      player.bank.push({ id: invItem.id, quantity: depositQty });
    }

    // Remove from inventory
    if (depositQty >= invItem.quantity) {
      player.inventory[slotIndex] = null;
    } else {
      player.inventory[slotIndex].quantity -= depositQty;
    }
    return true;
  }

  withdrawItem(socketId, bankIndex, quantity) {
    const player = this.players.get(socketId);
    if (!player || bankIndex < 0 || bankIndex >= player.bank.length) return false;

    const bankItem = player.bank[bankIndex];
    if (!bankItem) return false;

    const withdrawQty = Math.min(quantity, bankItem.quantity);

    if (!player.addItem(bankItem.id, withdrawQty)) return false;

    bankItem.quantity -= withdrawQty;
    if (bankItem.quantity <= 0) {
      player.bank.splice(bankIndex, 1);
    }
    return true;
  }

  startSkilling(socketId, nodeIndex) {
    const player = this.players.get(socketId);
    if (!player || nodeIndex < 0 || nodeIndex >= this.resourceNodes.length) return;

    const node = this.resourceNodes[nodeIndex];
    const dist = Math.abs(player.x - node.x) + Math.abs(player.y - node.y);

    if (dist > 2) {
      const path = this.findPath(player.x, player.y, node.x, node.y);
      if (path.length > 0) {
        player.path = path;
        player.moving = true;
      }
    }

    player.inCombat = false;
    player.combatTarget = null;

    // Check level
    if (player.skills[node.skill].level < node.level) return;

    // Check tool
    if (node.tool && !player.hasItem(node.tool)) return;

    player.skilling = { nodeIndex, ticksLeft: 4 };
  }

  processSkilling() {
    const updates = [];

    for (const [playerId, player] of this.players) {
      if (!player.skilling) continue;

      const node = this.resourceNodes[player.skilling.nodeIndex];
      if (!node) { player.skilling = null; continue; }

      const dist = Math.abs(player.x - node.x) + Math.abs(player.y - node.y);
      if (dist > 2) { player.skilling = null; continue; }

      player.skilling.ticksLeft--;
      if (player.skilling.ticksLeft <= 0) {
        // Success check
        const skillLevel = player.skills[node.skill].level;
        const successChance = Math.min(0.9, 0.3 + (skillLevel - node.level) * 0.05);

        if (Math.random() < successChance) {
          if (player.addItem(node.item, 1)) {
            player.addXp(node.skill, node.xp);
            updates.push({
              playerId,
              success: true,
              item: node.item,
              skill: node.skill,
              xp: node.xp
            });
          }
        } else {
          updates.push({ playerId, success: false, skill: node.skill });
        }

        // Reset timer for continuous skilling
        player.skilling.ticksLeft = 4;

        // Check quest collection progress
        this.checkCollectQuest(player, node.item);
      }
    }

    return updates;
  }

  checkCollectQuest(player, itemId) {
    for (const [questId, questState] of Object.entries(player.quests)) {
      if (questState.status !== 'in_progress') continue;
      const questDef = QUESTS[questId];
      if (!questDef) continue;
      for (let i = 0; i < questDef.objectives.length; i++) {
        const obj = questDef.objectives[i];
        if (obj.type === 'collect' && obj.item === itemId) {
          questState.progress[i] = player.countItem(itemId);
        }
      }
    }
  }

  turnInQuest(socketId, questId) {
    const player = this.players.get(socketId);
    if (!player) return null;

    const questState = player.quests[questId];
    if (!questState || questState.status !== 'in_progress') return null;

    const questDef = QUESTS[questId];
    if (!questDef) return null;

    // Check all objectives complete
    for (let i = 0; i < questDef.objectives.length; i++) {
      const obj = questDef.objectives[i];
      if (obj.type === 'collect') {
        if (player.countItem(obj.item) < obj.quantity) return null;
      } else if (obj.type === 'kill') {
        if ((questState.progress[i] || 0) < obj.quantity) return null;
      }
    }

    // Remove collected items
    for (const obj of questDef.objectives) {
      if (obj.type === 'collect') {
        player.removeItem(obj.item, obj.quantity);
      }
    }

    // Grant rewards
    if (questDef.rewards.xp) {
      for (const [skill, xp] of Object.entries(questDef.rewards.xp)) {
        player.addXp(skill, xp);
      }
    }
    if (questDef.rewards.items) {
      for (const reward of questDef.rewards.items) {
        player.addItem(reward.item, reward.quantity);
      }
    }
    player.questPoints += questDef.rewards.questPoints || 0;

    questState.status = 'completed';

    return { questName: questDef.name, questPoints: questDef.rewards.questPoints };
  }

  processMovement() {
    for (const [, player] of this.players) {
      if (player.path.length > 0) {
        const next = player.path.shift();
        player.x = next.x;
        player.y = next.y;
        if (player.path.length === 0) {
          player.moving = false;
        }
      }
    }
  }

  processNpcAI() {
    const moves = [];
    for (const [, npc] of this.npcs) {
      if (!npc.alive || npc.friendly) continue;

      // Aggressive NPC logic
      if (npc.aggressive && !npc.inCombat) {
        let closestPlayer = null;
        let closestDist = 5;
        for (const [playerId, player] of this.players) {
          const dist = Math.abs(player.x - npc.x) + Math.abs(player.y - npc.y);
          if (dist < closestDist) {
            closestDist = dist;
            closestPlayer = playerId;
          }
        }
        if (closestPlayer) {
          npc.inCombat = true;
          npc.combatTarget = closestPlayer;
          const player = this.players.get(closestPlayer);
          if (player && !player.inCombat) {
            player.inCombat = true;
            player.combatTarget = npc.id;
            player.combatTargetType = 'npc';
          }
        }
      }

      // Wander
      if (!npc.inCombat) {
        npc.wanderTimer++;
        if (npc.wanderTimer > 5 + Math.floor(Math.random() * 10)) {
          npc.wanderTimer = 0;
          const dx = Math.floor(Math.random() * 3) - 1;
          const dy = Math.floor(Math.random() * 3) - 1;
          const nx = npc.x + dx;
          const ny = npc.y + dy;
          if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT &&
            WALKABLE.has(this.map[ny][nx]) &&
            Math.abs(nx - npc.spawnX) <= 5 && Math.abs(ny - npc.spawnY) <= 5) {
            npc.x = nx;
            npc.y = ny;
            moves.push({ id: npc.id, x: nx, y: ny });
          }
        }
      }
    }
    return moves;
  }

  processRespawns() {
    const respawns = [];
    for (const [, npc] of this.npcs) {
      if (!npc.alive) {
        npc.respawnTimer--;
        if (npc.respawnTimer <= 0) {
          npc.alive = true;
          npc.hp = npc.maxHp;
          npc.x = npc.spawnX;
          npc.y = npc.spawnY;
          npc.inCombat = false;
          npc.combatTarget = null;
          respawns.push(npc.serialize());
        }
      }
    }
    return respawns;
  }

  processGroundItems() {
    // Pick up items players walk over
    for (const [, player] of this.players) {
      for (let i = this.groundItems.length - 1; i >= 0; i--) {
        const gi = this.groundItems[i];
        if (gi.x === player.x && gi.y === player.y) {
          if (player.addItem(gi.item, gi.quantity)) {
            this.groundItems.splice(i, 1);
          }
        }
      }
    }

    // Decay
    for (let i = this.groundItems.length - 1; i >= 0; i--) {
      this.groundItems[i].timer--;
      if (this.groundItems[i].timer <= 0) {
        this.groundItems.splice(i, 1);
      }
    }

    return this.groundItems.map(gi => ({ item: gi.item, quantity: gi.quantity, x: gi.x, y: gi.y }));
  }

  tick() {
    this.tickCount++;

    this.processMovement();
    const combatUpdates = this.processCombat();
    const npcRespawns = this.processRespawns();
    const npcMoves = this.processNpcAI();
    const skillingUpdates = this.processSkilling();
    const groundItems = this.processGroundItems();

    // Update quest collection progress on every tick for all players
    for (const [, player] of this.players) {
      for (const [questId, questState] of Object.entries(player.quests)) {
        if (questState.status !== 'in_progress') continue;
        const questDef = QUESTS[questId];
        if (!questDef) continue;
        for (let i = 0; i < questDef.objectives.length; i++) {
          const obj = questDef.objectives[i];
          if (obj.type === 'collect') {
            questState.progress[i] = player.countItem(obj.item);
          }
        }
      }
    }

    const playerUpdates = [];
    for (const [id, player] of this.players) {
      playerUpdates.push({
        id,
        data: player.serialize(),
        skillUpdate: player.skills,
        inventoryUpdate: player.serializeInventory()
      });
    }

    return {
      combatUpdates,
      npcRespawns,
      npcMoves,
      playerUpdates,
      skillingUpdates,
      groundItems
    };
  }
}

module.exports = GameWorld;
