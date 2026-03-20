const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const GameWorld = require('./world');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use('/shared', express.static(path.join(__dirname, '..', 'shared')));

const world = new GameWorld();

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('login', (data) => {
    const playerName = (data.name || 'Adventurer').substring(0, 16).replace(/[^a-zA-Z0-9_ ]/g, '');
    const player = world.addPlayer(socket.id, playerName);
    socket.emit('loginSuccess', {
      player: player.serialize(),
      map: world.map,
      npcs: world.serializeNpcs(),
      players: world.serializePlayers(),
      resourceNodes: world.resourceNodes
    });
    socket.broadcast.emit('playerJoined', player.serialize());
    io.emit('chat', { sender: 'Server', message: `${playerName} has logged in.`, type: 'system' });
  });

  socket.on('move', (data) => {
    const result = world.movePlayer(socket.id, data.x, data.y);
    if (result) {
      io.emit('playerMoved', { id: socket.id, x: result.x, y: result.y, path: result.path });
    }
  });

  socket.on('attackNpc', (data) => {
    world.startCombat(socket.id, data.npcId);
  });

  socket.on('attackPlayer', (data) => {
    // PvP only in wilderness (y < 6)
    const attacker = world.players.get(socket.id);
    const target = world.players.get(data.playerId);
    if (attacker && target && target.y < 6 && attacker.y < 6) {
      world.startPvpCombat(socket.id, data.playerId);
    } else {
      socket.emit('chat', { sender: 'Server', message: 'You can only attack other players in the Wilderness!', type: 'system' });
    }
  });

  socket.on('equipItem', (data) => {
    const result = world.equipItem(socket.id, data.slotIndex);
    if (result) {
      socket.emit('inventoryUpdate', world.players.get(socket.id).serializeInventory());
      io.emit('playerAppearanceUpdate', { id: socket.id, equipment: world.players.get(socket.id).equipment });
    }
  });

  socket.on('unequipItem', (data) => {
    const result = world.unequipItem(socket.id, data.slot);
    if (result) {
      socket.emit('inventoryUpdate', world.players.get(socket.id).serializeInventory());
      io.emit('playerAppearanceUpdate', { id: socket.id, equipment: world.players.get(socket.id).equipment });
    }
  });

  socket.on('eatFood', (data) => {
    const result = world.eatFood(socket.id, data.slotIndex);
    if (result) {
      socket.emit('inventoryUpdate', world.players.get(socket.id).serializeInventory());
      socket.emit('playerUpdate', world.players.get(socket.id).serialize());
    }
  });

  socket.on('buryBones', (data) => {
    const result = world.buryBones(socket.id, data.slotIndex);
    if (result) {
      socket.emit('inventoryUpdate', world.players.get(socket.id).serializeInventory());
      socket.emit('skillUpdate', world.players.get(socket.id).skills);
    }
  });

  socket.on('talkToNpc', (data) => {
    const dialogue = world.talkToNpc(socket.id, data.npcId);
    if (dialogue) {
      socket.emit('dialogue', dialogue);
    }
  });

  socket.on('dialogueOption', (data) => {
    const result = world.handleDialogueOption(socket.id, data.action, data);
    if (result) {
      if (result.type === 'shop') {
        socket.emit('openShop', result.shop);
      } else if (result.type === 'bank') {
        socket.emit('openBank', world.players.get(socket.id).bank);
      } else if (result.type === 'quest') {
        socket.emit('questUpdate', world.players.get(socket.id).quests);
        socket.emit('chat', { sender: 'Server', message: `Quest started: ${result.questName}`, type: 'quest' });
      }
    }
  });

  socket.on('buyItem', (data) => {
    const result = world.buyItem(socket.id, data.shopId, data.itemIndex, data.quantity || 1);
    if (result.success) {
      socket.emit('inventoryUpdate', world.players.get(socket.id).serializeInventory());
      socket.emit('chat', { sender: 'Server', message: result.message, type: 'system' });
    } else {
      socket.emit('chat', { sender: 'Server', message: result.message, type: 'system' });
    }
  });

  socket.on('sellItem', (data) => {
    const result = world.sellItem(socket.id, data.slotIndex);
    if (result.success) {
      socket.emit('inventoryUpdate', world.players.get(socket.id).serializeInventory());
      socket.emit('chat', { sender: 'Server', message: result.message, type: 'system' });
    }
  });

  socket.on('depositItem', (data) => {
    const result = world.depositItem(socket.id, data.slotIndex, data.quantity || 1);
    if (result) {
      socket.emit('inventoryUpdate', world.players.get(socket.id).serializeInventory());
      socket.emit('bankUpdate', world.players.get(socket.id).bank);
    }
  });

  socket.on('withdrawItem', (data) => {
    const result = world.withdrawItem(socket.id, data.bankIndex, data.quantity || 1);
    if (result) {
      socket.emit('inventoryUpdate', world.players.get(socket.id).serializeInventory());
      socket.emit('bankUpdate', world.players.get(socket.id).bank);
    }
  });

  socket.on('useSkillOnNode', (data) => {
    world.startSkilling(socket.id, data.nodeIndex);
  });

  socket.on('dropItem', (data) => {
    const result = world.dropItem(socket.id, data.slotIndex);
    if (result) {
      socket.emit('inventoryUpdate', world.players.get(socket.id).serializeInventory());
    }
  });

  socket.on('setCombatStyle', (data) => {
    const player = world.players.get(socket.id);
    if (player && ['melee', 'ranged', 'magic'].includes(data.style)) {
      player.combatStyle = data.style;
    }
  });

  socket.on('setSpell', (data) => {
    const player = world.players.get(socket.id);
    if (player) {
      player.selectedSpell = data.spellId;
    }
  });

  socket.on('chat', (data) => {
    const player = world.players.get(socket.id);
    if (player) {
      const message = (data.message || '').substring(0, 200);
      io.emit('chat', { sender: player.name, message, type: 'player' });
    }
  });

  socket.on('turnInQuest', (data) => {
    const result = world.turnInQuest(socket.id, data.questId);
    if (result) {
      const player = world.players.get(socket.id);
      socket.emit('inventoryUpdate', player.serializeInventory());
      socket.emit('skillUpdate', player.skills);
      socket.emit('questUpdate', player.quests);
      socket.emit('chat', { sender: 'Server', message: `Quest complete: ${result.questName}! +${result.questPoints} Quest Points`, type: 'quest' });
    }
  });

  socket.on('disconnect', () => {
    const player = world.players.get(socket.id);
    if (player) {
      io.emit('chat', { sender: 'Server', message: `${player.name} has logged out.`, type: 'system' });
    }
    world.removePlayer(socket.id);
    io.emit('playerLeft', socket.id);
    console.log(`Player disconnected: ${socket.id}`);
  });
});

// Game loop
setInterval(() => {
  const updates = world.tick();

  if (updates.combatUpdates.length > 0) {
    updates.combatUpdates.forEach(u => {
      io.emit('combatUpdate', u);
      if (u.targetDied) {
        if (u.targetType === 'npc') {
          io.emit('npcDied', { npcId: u.targetId });
        }
      }
    });
  }

  if (updates.npcRespawns.length > 0) {
    updates.npcRespawns.forEach(n => {
      io.emit('npcRespawned', n);
    });
  }

  if (updates.playerUpdates.length > 0) {
    updates.playerUpdates.forEach(u => {
      const sock = io.sockets.sockets.get(u.id);
      if (sock) {
        sock.emit('playerUpdate', u.data);
        if (u.skillUpdate) sock.emit('skillUpdate', u.skillUpdate);
        if (u.inventoryUpdate) sock.emit('inventoryUpdate', u.inventoryUpdate);
        if (u.questProgress) sock.emit('questProgress', u.questProgress);
      }
    });
  }

  if (updates.npcMoves.length > 0) {
    io.emit('npcMoves', updates.npcMoves);
  }

  if (updates.skillingUpdates.length > 0) {
    updates.skillingUpdates.forEach(u => {
      const sock = io.sockets.sockets.get(u.playerId);
      if (sock) {
        sock.emit('skillingResult', u);
        sock.emit('inventoryUpdate', world.players.get(u.playerId).serializeInventory());
        sock.emit('skillUpdate', world.players.get(u.playerId).skills);
      }
    });
  }

  if (updates.groundItems.length > 0) {
    io.emit('groundItemsUpdate', updates.groundItems);
  }
}, 600); // 600ms game tick

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`RuneScape Classic RPG server running on port ${PORT}`);
});
