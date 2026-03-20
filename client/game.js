// Main game client
class Game {
  constructor() {
    this.socket = null;
    this.canvas = null;
    this.ctx = null;
    this.renderer = null;
    this.loggedIn = false;

    // Game state
    this.state = {
      localPlayer: null,
      map: null,
      players: {},
      npcs: {},
      groundItems: [],
      resourceNodes: [],
      hitSplats: [],
      inventory: new Array(28).fill(null),
      skills: {},
      quests: {},
      bank: []
    };

    // UI state
    this.activePanel = 'inventory'; // inventory, skills, quests, equipment, magic
    this.chatMessages = [];
    this.chatInput = '';
    this.shopOpen = null;
    this.bankOpen = false;
    this.dialogueOpen = null;
    this.rightClickMenu = null;
    this.hoveredTile = null;
    this.selectedNpc = null;

    this.keys = {};
    this.lastFrameTime = 0;
  }

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.renderer = new IsometricRenderer(this.canvas, this.ctx);

    // Show login screen
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('gameUI').style.display = 'none';

    document.getElementById('loginBtn').addEventListener('click', () => this.login());
    document.getElementById('playerName').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.login();
    });

    // Input handlers
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('wheel', (e) => this.handleZoom(e));

    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Start render loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  resizeCanvas() {
    const uiWidth = 250;
    const chatHeight = 180;
    this.canvas.width = window.innerWidth - uiWidth;
    this.canvas.height = window.innerHeight - chatHeight;
  }

  login() {
    const name = document.getElementById('playerName').value.trim() || 'Adventurer';
    this.socket = io();
    this.setupSocket();
    this.socket.emit('login', { name });
  }

  setupSocket() {
    const socket = this.socket;

    socket.on('loginSuccess', (data) => {
      this.loggedIn = true;
      this.state.localPlayer = data.player;
      this.state.map = data.map;
      this.state.npcs = data.npcs;
      this.state.players = data.players;
      this.state.players[data.player.id] = data.player;
      this.state.resourceNodes = data.resourceNodes;
      this.state.inventory = data.player.inventory || new Array(28).fill(null);
      this.state.skills = data.player.skills;

      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('gameUI').style.display = 'flex';
      this.setupUI();
    });

    socket.on('playerJoined', (player) => {
      this.state.players[player.id] = player;
    });

    socket.on('playerLeft', (id) => {
      delete this.state.players[id];
    });

    socket.on('playerMoved', (data) => {
      if (this.state.players[data.id]) {
        // Animate movement
        this.state.players[data.id].targetPath = data.path;
      }
    });

    socket.on('playerUpdate', (data) => {
      this.state.players[data.id] = data;
      if (data.id === this.socket.id) {
        this.state.localPlayer = data;
      }
    });

    socket.on('playerAppearanceUpdate', (data) => {
      if (this.state.players[data.id]) {
        this.state.players[data.id].equipment = data.equipment;
      }
    });

    socket.on('inventoryUpdate', (data) => {
      this.state.inventory = data.inventory;
      this.updateInventoryUI();
    });

    socket.on('skillUpdate', (skills) => {
      this.state.skills = skills;
      this.updateSkillsUI();
    });

    socket.on('questUpdate', (quests) => {
      this.state.quests = quests;
      this.updateQuestsUI();
    });

    socket.on('questProgress', (progress) => {
      Object.assign(this.state.quests, progress);
      this.updateQuestsUI();
    });

    socket.on('combatUpdate', (data) => {
      // Add hit splat
      const targetX = data.targetType === 'npc' ?
        (this.state.npcs[data.targetId]?.x || 0) :
        (this.state.players[data.targetId]?.x || 0);
      const targetY = data.targetType === 'npc' ?
        (this.state.npcs[data.targetId]?.y || 0) :
        (this.state.players[data.targetId]?.y || 0);

      this.state.hitSplats.push({
        x: targetX, y: targetY,
        damage: data.damage,
        time: Date.now()
      });

      // Update NPC HP
      if (data.targetType === 'npc' && this.state.npcs[data.targetId]) {
        this.state.npcs[data.targetId].hp = data.targetHp;
      }

      // Player died
      if (data.targetType === 'player' && data.targetDied) {
        if (data.targetId === this.socket.id) {
          this.addChatMessage('Server', 'Oh dear, you are dead!', 'system');
          this.state.localPlayer.x = data.respawnX;
          this.state.localPlayer.y = data.respawnY;
        }
      }
    });

    socket.on('npcDied', (data) => {
      if (this.state.npcs[data.npcId]) {
        this.state.npcs[data.npcId].alive = false;
      }
    });

    socket.on('npcRespawned', (npc) => {
      this.state.npcs[npc.id] = npc;
    });

    socket.on('npcMoves', (moves) => {
      for (const move of moves) {
        if (this.state.npcs[move.id]) {
          this.state.npcs[move.id].x = move.x;
          this.state.npcs[move.id].y = move.y;
        }
      }
    });

    socket.on('groundItemsUpdate', (items) => {
      this.state.groundItems = items;
    });

    socket.on('chat', (data) => {
      this.addChatMessage(data.sender, data.message, data.type);
    });

    socket.on('dialogue', (data) => {
      this.showDialogue(data);
    });

    socket.on('openShop', (shop) => {
      this.openShop(shop);
    });

    socket.on('openBank', (bank) => {
      this.state.bank = bank;
      this.openBankUI();
    });

    socket.on('bankUpdate', (bank) => {
      this.state.bank = bank;
      if (this.bankOpen) this.updateBankUI();
    });

    socket.on('skillingResult', (data) => {
      if (data.success) {
        const itemName = window.ITEMS?.[data.item]?.name || data.item;
        this.addChatMessage('Server', `You successfully gathered ${itemName}! (+${data.xp} ${data.skill} XP)`, 'skill');
      }
    });
  }

  setupUI() {
    // Tab buttons
    const tabs = ['inventory', 'equipment', 'skills', 'quests', 'magic'];
    const tabBar = document.getElementById('tabBar');
    tabBar.innerHTML = '';
    tabs.forEach(tab => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (tab === this.activePanel ? ' active' : '');
      btn.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
      btn.onclick = () => {
        this.activePanel = tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.updatePanelUI();
      };
      tabBar.appendChild(btn);
    });

    // Chat input
    const chatInputEl = document.getElementById('chatInput');
    chatInputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && chatInputEl.value.trim()) {
        this.socket.emit('chat', { message: chatInputEl.value.trim() });
        chatInputEl.value = '';
      }
    });

    // Combat style buttons
    this.setupCombatStyleUI();

    this.updatePanelUI();
  }

  setupCombatStyleUI() {
    const container = document.getElementById('combatStyle');
    container.innerHTML = '<div class="panel-title">Combat Style</div>';
    ['melee', 'ranged', 'magic'].forEach(style => {
      const btn = document.createElement('button');
      btn.className = 'combat-style-btn' + (this.state.localPlayer?.combatStyle === style ? ' active' : '');
      btn.textContent = style.charAt(0).toUpperCase() + style.slice(1);
      btn.onclick = () => {
        this.socket.emit('setCombatStyle', { style });
        document.querySelectorAll('.combat-style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
      container.appendChild(btn);
    });
  }

  updatePanelUI() {
    const panel = document.getElementById('sidePanel');
    switch (this.activePanel) {
      case 'inventory': this.updateInventoryUI(); break;
      case 'equipment': this.updateEquipmentUI(); break;
      case 'skills': this.updateSkillsUI(); break;
      case 'quests': this.updateQuestsUI(); break;
      case 'magic': this.updateMagicUI(); break;
    }
  }

  updateInventoryUI() {
    if (this.activePanel !== 'inventory') return;
    const panel = document.getElementById('sidePanel');
    let html = '<div class="panel-title">Inventory</div><div class="inventory-grid">';

    for (let i = 0; i < 28; i++) {
      const item = this.state.inventory[i];
      if (item) {
        const itemDef = window.ITEMS?.[item.id] || { name: item.id };
        const qtyText = item.quantity > 1 ? `<span class="item-qty">${item.quantity}</span>` : '';
        html += `<div class="inv-slot filled" data-slot="${i}" title="${itemDef.name}">
          <div class="item-icon">${this.getItemIcon(item.id)}</div>
          ${qtyText}
        </div>`;
      } else {
        html += `<div class="inv-slot empty" data-slot="${i}"></div>`;
      }
    }
    html += '</div>';
    panel.innerHTML = html;

    // Add click handlers
    panel.querySelectorAll('.inv-slot.filled').forEach(slot => {
      slot.addEventListener('click', (e) => this.handleInventoryClick(parseInt(slot.dataset.slot)));
      slot.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showInventoryMenu(parseInt(slot.dataset.slot), e.clientX, e.clientY);
      });
    });
  }

  updateEquipmentUI() {
    if (this.activePanel !== 'equipment') return;
    const panel = document.getElementById('sidePanel');
    const eq = this.state.localPlayer?.equipment || {};
    const slots = ['head', 'body', 'legs', 'weapon', 'shield', 'ammo'];

    let html = '<div class="panel-title">Equipment</div><div class="equipment-panel">';
    slots.forEach(slot => {
      const item = eq[slot];
      const name = item ? (window.ITEMS?.[item.id]?.name || item.id) : 'Empty';
      const icon = item ? this.getItemIcon(item.id) : '—';
      html += `<div class="equip-slot" data-slot="${slot}" title="${name}">
        <div class="equip-label">${slot}</div>
        <div class="equip-item">${icon}</div>
        <div class="equip-name">${name}</div>
      </div>`;
    });
    html += '</div>';

    // Stats
    if (this.state.localPlayer) {
      const p = this.state.localPlayer;
      html += `<div class="stats-panel">
        <div>Combat Level: ${p.combatLevel}</div>
        <div>HP: ${p.hp}/${p.maxHp}</div>
        <div>Quest Points: ${p.questPoints || 0}</div>
      </div>`;
    }

    panel.innerHTML = html;

    panel.querySelectorAll('.equip-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        if (eq[slot.dataset.slot]) {
          this.socket.emit('unequipItem', { slot: slot.dataset.slot });
        }
      });
    });
  }

  updateSkillsUI() {
    if (this.activePanel !== 'skills') return;
    const panel = document.getElementById('sidePanel');
    const skills = this.state.skills;

    let html = '<div class="panel-title">Skills</div><div class="skills-panel">';
    const skillOrder = ['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic', 'prayer', 'mining', 'smithing', 'fishing', 'cooking', 'woodcutting', 'firemaking'];

    const skillIcons = {
      attack: '⚔️', strength: '💪', defence: '🛡️', hitpoints: '❤️',
      ranged: '🏹', magic: '✨', prayer: '🙏', mining: '⛏️',
      smithing: '🔨', fishing: '🎣', cooking: '🍳', woodcutting: '🪓',
      firemaking: '🔥'
    };

    skillOrder.forEach(skill => {
      const s = skills[skill] || { level: 1, xp: 0 };
      const nextLvlXp = this.xpForLevel(s.level + 1);
      const currentLvlXp = this.xpForLevel(s.level);
      const progress = Math.min(100, ((s.xp - currentLvlXp) / (nextLvlXp - currentLvlXp)) * 100);

      html += `<div class="skill-row">
        <span class="skill-icon">${skillIcons[skill] || '📊'}</span>
        <span class="skill-name">${skill}</span>
        <span class="skill-level">${s.level}</span>
        <div class="skill-bar"><div class="skill-bar-fill" style="width:${progress}%"></div></div>
      </div>`;
    });
    html += '</div>';
    panel.innerHTML = html;
  }

  updateQuestsUI() {
    if (this.activePanel !== 'quests') return;
    const panel = document.getElementById('sidePanel');
    const quests = this.state.quests;

    let html = '<div class="panel-title">Quests</div><div class="quests-panel">';

    const questDefs = window.QUESTS || {};
    for (const [questId, quest] of Object.entries(questDefs)) {
      const state = quests[questId];
      const status = state ? state.status : 'not_started';
      const statusColor = status === 'completed' ? '#00cc00' : status === 'in_progress' ? '#cccc00' : '#cc0000';
      const statusText = status === 'completed' ? '✓ Complete' : status === 'in_progress' ? '⟳ In Progress' : '✗ Not Started';

      html += `<div class="quest-entry" data-quest="${questId}">
        <div class="quest-name" style="color:${statusColor}">${quest.name}</div>
        <div class="quest-status">${statusText}</div>`;

      if (status === 'in_progress' && state) {
        html += '<div class="quest-objectives">';
        quest.objectives.forEach((obj, i) => {
          const progress = state.progress[i] || 0;
          const done = progress >= (obj.quantity || 1);
          html += `<div class="quest-obj" style="color:${done ? '#00cc00' : '#ffaa00'}">
            ${done ? '✓' : '○'} ${obj.text} (${progress}/${obj.quantity})
          </div>`;
        });
        html += '</div>';

        // Turn in button if all objectives complete
        const allDone = quest.objectives.every((obj, i) => (state.progress[i] || 0) >= (obj.quantity || 1));
        if (allDone) {
          html += `<button class="quest-turnin-btn" onclick="game.turnInQuest('${questId}')">Turn In Quest</button>`;
        }
      }
      html += '</div>';
    }

    if (Object.keys(questDefs).length === 0) {
      html += '<div style="color:#888;padding:8px">Talk to NPCs to discover quests!</div>';
    }

    html += '</div>';
    panel.innerHTML = html;
  }

  updateMagicUI() {
    if (this.activePanel !== 'magic') return;
    const panel = document.getElementById('sidePanel');
    const spells = window.SPELLS || {};
    const magicLevel = this.state.skills?.magic?.level || 1;

    let html = '<div class="panel-title">Spellbook</div><div class="magic-panel">';

    for (const [spellId, spell] of Object.entries(spells)) {
      const canCast = magicLevel >= spell.level;
      const selected = this.state.localPlayer?.selectedSpell === spellId;
      html += `<div class="spell-entry ${canCast ? 'castable' : 'locked'} ${selected ? 'selected' : ''}"
        data-spell="${spellId}">
        <div class="spell-name">${spell.name}</div>
        <div class="spell-info">Lvl ${spell.level} | Max hit: ${spell.maxHit}</div>
        <div class="spell-runes">${Object.entries(spell.runes).map(([r, q]) => `${q}x ${r.replace('_', ' ')}`).join(', ')}</div>
      </div>`;
    }
    html += '</div>';
    panel.innerHTML = html;

    panel.querySelectorAll('.spell-entry.castable').forEach(el => {
      el.addEventListener('click', () => {
        this.socket.emit('setSpell', { spellId: el.dataset.spell });
        panel.querySelectorAll('.spell-entry').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');
      });
    });
  }

  handleInventoryClick(slotIndex) {
    const item = this.state.inventory[slotIndex];
    if (!item) return;

    const itemDef = window.ITEMS?.[item.id];
    if (!itemDef) return;

    // Default action based on item type
    if (itemDef.type === 'weapon' || itemDef.type === 'armour') {
      this.socket.emit('equipItem', { slotIndex });
    } else if (itemDef.type === 'food') {
      this.socket.emit('eatFood', { slotIndex });
    } else if (itemDef.type === 'bones') {
      this.socket.emit('buryBones', { slotIndex });
    }
  }

  showInventoryMenu(slotIndex, x, y) {
    const item = this.state.inventory[slotIndex];
    if (!item) return;

    const itemDef = window.ITEMS?.[item.id];
    if (!itemDef) return;

    const options = [];
    if (itemDef.type === 'weapon' || itemDef.type === 'armour') {
      options.push({ text: 'Equip', action: () => this.socket.emit('equipItem', { slotIndex }) });
    }
    if (itemDef.type === 'food') {
      options.push({ text: 'Eat', action: () => this.socket.emit('eatFood', { slotIndex }) });
    }
    if (itemDef.type === 'bones') {
      options.push({ text: 'Bury', action: () => this.socket.emit('buryBones', { slotIndex }) });
    }
    options.push({ text: 'Drop', action: () => this.socket.emit('dropItem', { slotIndex }) });
    if (this.shopOpen) {
      options.push({ text: 'Sell', action: () => this.socket.emit('sellItem', { slotIndex }) });
    }
    if (this.bankOpen) {
      options.push({ text: 'Deposit', action: () => this.socket.emit('depositItem', { slotIndex, quantity: item.quantity }) });
    }

    this.showContextMenu(x, y, itemDef.name, options);
  }

  showContextMenu(x, y, title, options) {
    // Remove existing menu
    const existing = document.getElementById('contextMenu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.id = 'contextMenu';
    menu.className = 'context-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    let html = `<div class="ctx-title">${title}</div>`;
    options.forEach((opt, i) => {
      html += `<div class="ctx-option" data-idx="${i}">${opt.text}</div>`;
    });
    menu.innerHTML = html;

    document.body.appendChild(menu);

    menu.querySelectorAll('.ctx-option').forEach(el => {
      el.addEventListener('click', () => {
        options[parseInt(el.dataset.idx)].action();
        menu.remove();
      });
    });

    // Close on click outside
    setTimeout(() => {
      const handler = (e) => {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', handler);
        }
      };
      document.addEventListener('click', handler);
    }, 10);
  }

  handleClick(e) {
    if (!this.loggedIn) return;

    // Close context menu
    const ctx = document.getElementById('contextMenu');
    if (ctx) ctx.remove();

    // Close dialogue
    if (this.dialogueOpen) return;

    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = this.renderer.screenToWorld(sx, sy);

    // Check if clicked an NPC
    for (const [npcId, npc] of Object.entries(this.state.npcs)) {
      if (!npc.alive) continue;
      if (npc.x === world.x && npc.y === world.y) {
        if (npc.friendly) {
          this.socket.emit('talkToNpc', { npcId });
        } else {
          this.socket.emit('attackNpc', { npcId });
        }
        return;
      }
    }

    // Check if clicked another player (for PvP)
    for (const [playerId, player] of Object.entries(this.state.players)) {
      if (playerId === this.socket.id) continue;
      if (player.x === world.x && player.y === world.y) {
        this.socket.emit('attackPlayer', { playerId });
        return;
      }
    }

    // Check resource nodes
    for (let i = 0; i < this.state.resourceNodes.length; i++) {
      const node = this.state.resourceNodes[i];
      if (node.x === world.x && node.y === world.y) {
        this.socket.emit('useSkillOnNode', { nodeIndex: i });
        return;
      }
    }

    // Move to tile
    if (world.x >= 0 && world.x < 80 && world.y >= 0 && world.y < 80) {
      this.socket.emit('move', { x: world.x, y: world.y });
    }
  }

  handleRightClick(e) {
    e.preventDefault();
    if (!this.loggedIn) return;

    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = this.renderer.screenToWorld(sx, sy);

    const options = [];

    // Check NPCs
    for (const [npcId, npc] of Object.entries(this.state.npcs)) {
      if (!npc.alive) continue;
      if (Math.abs(npc.x - world.x) <= 1 && Math.abs(npc.y - world.y) <= 1) {
        if (npc.friendly) {
          options.push({ text: `Talk to ${npc.name}`, action: () => this.socket.emit('talkToNpc', { npcId }) });
        } else {
          options.push({ text: `Attack ${npc.name} (lvl ${npc.level})`, action: () => this.socket.emit('attackNpc', { npcId }) });
        }
      }
    }

    // Check players
    for (const [playerId, player] of Object.entries(this.state.players)) {
      if (playerId === this.socket.id) continue;
      if (player.x === world.x && player.y === world.y) {
        options.push({ text: `Attack ${player.name} (PvP)`, action: () => this.socket.emit('attackPlayer', { playerId }) });
      }
    }

    options.push({ text: 'Walk here', action: () => this.socket.emit('move', { x: world.x, y: world.y }) });

    if (options.length > 0) {
      this.showContextMenu(e.clientX, e.clientY, `Tile (${world.x}, ${world.y})`, options);
    }
  }

  handleMouseMove(e) {
    if (!this.loggedIn || !this.renderer) return;
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    this.hoveredTile = this.renderer.screenToWorld(sx, sy);
  }

  handleZoom(e) {
    e.preventDefault();
    if (!this.renderer) return;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    this.renderer.zoom = Math.max(0.5, Math.min(2, this.renderer.zoom + delta));
  }

  handleKeyDown(e) {
    this.keys[e.key] = true;

    // Chat shortcuts
    if (e.key === 'Enter' && this.loggedIn) {
      const chatInput = document.getElementById('chatInput');
      if (document.activeElement !== chatInput) {
        chatInput.focus();
        e.preventDefault();
      }
    }

    if (e.key === 'Escape') {
      // Close any open UI
      this.shopOpen = null;
      this.bankOpen = false;
      this.dialogueOpen = null;
      const overlay = document.getElementById('overlay');
      if (overlay) overlay.style.display = 'none';
    }

    // Number keys for eating food quickly
    if (e.key >= '1' && e.key <= '9' && document.activeElement.tagName !== 'INPUT') {
      const slot = parseInt(e.key) - 1;
      const item = this.state.inventory[slot];
      if (item) {
        const itemDef = window.ITEMS?.[item.id];
        if (itemDef?.type === 'food') {
          this.socket.emit('eatFood', { slotIndex: slot });
        }
      }
    }
  }

  handleKeyUp(e) {
    this.keys[e.key] = false;
  }

  showDialogue(data) {
    this.dialogueOpen = data;
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';

    let html = `<div class="dialogue-box">
      <div class="dialogue-npc">${data.npcName}</div>
      <div class="dialogue-text">${data.text}</div>
      <div class="dialogue-options">`;

    data.options.forEach((opt, i) => {
      html += `<button class="dialogue-btn" data-idx="${i}">${opt.text}</button>`;
    });

    html += '</div></div>';
    overlay.innerHTML = html;

    overlay.querySelectorAll('.dialogue-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const opt = data.options[parseInt(btn.dataset.idx)];
        this.dialogueOpen = null;
        overlay.style.display = 'none';

        if (opt.action === 'close') return;
        this.socket.emit('dialogueOption', {
          action: opt.action,
          quest: opt.quest
        });
      });
    });
  }

  openShop(shop) {
    this.shopOpen = shop;
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';

    let html = `<div class="shop-panel">
      <div class="shop-title">${shop.name}</div>
      <div class="shop-grid">`;

    shop.stock.forEach((stockItem, i) => {
      const itemDef = window.ITEMS?.[stockItem.item] || { name: stockItem.item };
      html += `<div class="shop-item" data-idx="${i}">
        <div class="shop-item-icon">${this.getItemIcon(stockItem.item)}</div>
        <div class="shop-item-name">${itemDef.name}</div>
        <div class="shop-item-price">${stockItem.price} gp</div>
        <div class="shop-item-qty">Stock: ${stockItem.qty}</div>
        <button class="buy-btn" data-idx="${i}">Buy 1</button>
        <button class="buy-btn buy5" data-idx="${i}" data-qty="5">Buy 5</button>
      </div>`;
    });

    html += `</div><button class="close-btn" id="closeShop">Close</button></div>`;
    overlay.innerHTML = html;

    overlay.querySelectorAll('.buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const qty = parseInt(btn.dataset.qty) || 1;
        this.socket.emit('buyItem', { shopId: shop.id, itemIndex: idx, quantity: qty });
      });
    });

    document.getElementById('closeShop').addEventListener('click', () => {
      this.shopOpen = null;
      overlay.style.display = 'none';
    });
  }

  openBankUI() {
    this.bankOpen = true;
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';
    this.updateBankUI();
  }

  updateBankUI() {
    const overlay = document.getElementById('overlay');
    let html = `<div class="bank-panel">
      <div class="shop-title">Bank</div>
      <div class="bank-grid">`;

    this.state.bank.forEach((item, i) => {
      const itemDef = window.ITEMS?.[item.id] || { name: item.id };
      html += `<div class="bank-item" data-idx="${i}">
        <div class="item-icon">${this.getItemIcon(item.id)}</div>
        <div>${itemDef.name}</div>
        <div>x${item.quantity}</div>
        <button class="withdraw-btn" data-idx="${i}">Take 1</button>
        <button class="withdraw-btn" data-idx="${i}" data-qty="all">Take All</button>
      </div>`;
    });

    if (this.state.bank.length === 0) {
      html += '<div style="color:#888;padding:20px">Your bank is empty</div>';
    }

    html += `</div><button class="close-btn" id="closeBank">Close</button></div>`;
    overlay.innerHTML = html;

    overlay.querySelectorAll('.withdraw-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const qty = btn.dataset.qty === 'all' ? 999999 : 1;
        this.socket.emit('withdrawItem', { bankIndex: idx, quantity: qty });
      });
    });

    document.getElementById('closeBank').addEventListener('click', () => {
      this.bankOpen = false;
      overlay.style.display = 'none';
    });
  }

  turnInQuest(questId) {
    this.socket.emit('turnInQuest', { questId });
  }

  addChatMessage(sender, message, type) {
    const colors = {
      system: '#ffaa00',
      player: '#ffffff',
      quest: '#00ccff',
      skill: '#00ff88'
    };
    this.chatMessages.push({ sender, message, type, color: colors[type] || '#fff' });
    if (this.chatMessages.length > 100) this.chatMessages.shift();
    this.updateChatUI();
  }

  updateChatUI() {
    const chatLog = document.getElementById('chatLog');
    chatLog.innerHTML = this.chatMessages.map(msg =>
      `<div class="chat-msg" style="color:${msg.color}"><b>${msg.sender}:</b> ${msg.message}</div>`
    ).join('');
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  getItemIcon(itemId) {
    const icons = {
      bronze_sword: '🗡️', iron_sword: '🗡️', steel_sword: '🗡️', mithril_sword: '🗡️',
      adamant_sword: '🗡️', rune_sword: '🗡️',
      shortbow: '🏹', longbow: '🏹',
      staff_of_air: '🪄', staff_of_fire: '🪄',
      bronze_helm: '⛑️', iron_helm: '⛑️', steel_helm: '⛑️', rune_helm: '⛑️',
      bronze_plate: '🛡️', iron_plate: '🛡️', steel_plate: '🛡️', rune_plate: '🛡️',
      bronze_legs: '👖', iron_legs: '👖', steel_legs: '👖', rune_legs: '👖',
      bronze_shield: '🛡️', iron_shield: '🛡️', steel_shield: '🛡️', rune_shield: '🛡️',
      bronze_arrows: '➡️', iron_arrows: '➡️',
      air_rune: '💨', fire_rune: '🔥', water_rune: '💧', earth_rune: '🌍',
      mind_rune: '🧠', chaos_rune: '💀',
      shrimp: '🍤', trout: '🐟', salmon: '🐟', lobster: '🦞', swordfish: '🐟',
      raw_shrimp: '🦐', raw_trout: '🐟', raw_salmon: '🐟', raw_lobster: '🦞',
      copper_ore: '🪨', tin_ore: '🪨', iron_ore: '🪨', gold_ore: '🪨',
      bronze_bar: '🧱', iron_bar: '🧱', gold_bar: '🧱',
      bronze_pickaxe: '⛏️', iron_pickaxe: '⛏️', steel_pickaxe: '⛏️',
      bronze_axe: '🪓', iron_axe: '🪓',
      fishing_net: '🥅', fishing_rod: '🎣', tinderbox: '🔥',
      logs: '🪵', oak_logs: '🪵',
      coins: '🪙', bones: '🦴',
      goblin_mail: '📧', mysterious_key: '🔑'
    };
    return icons[itemId] || '📦';
  }

  xpForLevel(level) {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += Math.floor(i + 300 * Math.pow(2, i / 7));
    }
    return Math.floor(total / 4);
  }

  gameLoop(timestamp) {
    const dt = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    if (this.loggedIn) {
      // Clean old hit splats
      this.state.hitSplats = this.state.hitSplats.filter(s => Date.now() - s.time < 1500);

      // Render
      this.renderer.render(this.state);

      // Draw hover indicator
      if (this.hoveredTile) {
        const screen = this.renderer.worldToScreen(this.hoveredTile.x, this.hoveredTile.y);
        const tw = this.renderer.tileWidth * this.renderer.zoom / 2;
        const th = this.renderer.tileHeight * this.renderer.zoom / 2;
        this.ctx.strokeStyle = 'rgba(255,255,0,0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(screen.x, screen.y - th);
        this.ctx.lineTo(screen.x + tw, screen.y);
        this.ctx.lineTo(screen.x, screen.y + th);
        this.ctx.lineTo(screen.x - tw, screen.y);
        this.ctx.closePath();
        this.ctx.stroke();
      }
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Initialize when ready
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
  window.game.init();
});
