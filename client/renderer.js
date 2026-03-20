// Isometric 2D renderer for the game world
class IsometricRenderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.tileWidth = 64;
    this.tileHeight = 32;
    this.cameraX = 0;
    this.cameraY = 0;
    this.zoom = 1;

    // Tile colors
    this.tileColors = {
      0: ['#4a8c3f', '#3d7534', '#448c38'], // GRASS variations
      1: ['#8B7355', '#7a6349', '#8a7050'], // DIRT
      2: ['#3366aa', '#2855a0', '#3060a8'], // WATER
      3: ['#808080', '#707070', '#888888'], // STONE
      4: ['#d4b96a', '#c8ad60', '#d0b565'], // SAND
      5: ['#2d5a1e', '#234a16', '#2a5219'], // TREE (trunk base)
      6: ['#6b5b4f', '#5e4e42', '#6a5848'], // WALL
      7: ['#a08060', '#957555', '#9b7b5c'], // FLOOR
      8: ['#8B7355', '#7a6349', '#8a7050'], // ROAD
      9: ['#8B6914', '#7a5c0f', '#876512'], // BRIDGE
      10: ['#5a3a1a', '#4e3015', '#553518'], // DOOR
      11: ['#b87333', '#a86828', '#b56f30'], // ORE_COPPER
      12: ['#a0a0a0', '#909090', '#989898'], // ORE_IRON
      13: ['#ffd700', '#e8c400', '#f0cc00'], // ORE_GOLD
      14: ['#8b0000', '#780000', '#850000'], // FURNACE
      15: ['#555555', '#484848', '#525252'], // ANVIL
      16: ['#c0a060', '#b09555', '#ba9c5c'], // BANK
      17: ['#e0e0e0', '#d0d0d0', '#d8d8d8']  // ALTAR
    };
  }

  // Convert world coords to screen (isometric)
  worldToScreen(x, y) {
    const sx = (x - y) * (this.tileWidth / 2) * this.zoom + this.cameraX;
    const sy = (x + y) * (this.tileHeight / 2) * this.zoom + this.cameraY;
    return { x: sx, y: sy };
  }

  // Convert screen coords to world
  screenToWorld(sx, sy) {
    const cx = sx - this.cameraX;
    const cy = sy - this.cameraY;
    const tw = (this.tileWidth / 2) * this.zoom;
    const th = (this.tileHeight / 2) * this.zoom;
    const x = Math.floor((cx / tw + cy / th) / 2);
    const y = Math.floor((cy / th - cx / tw) / 2);
    return { x, y };
  }

  centerOn(worldX, worldY) {
    const screen = this.worldToScreen(worldX, worldY);
    this.cameraX += this.canvas.width / 2 - screen.x;
    this.cameraY += this.canvas.height / 2 - screen.y;
  }

  drawTile(x, y, tileType) {
    const screen = this.worldToScreen(x, y);
    const tw = this.tileWidth * this.zoom / 2;
    const th = this.tileHeight * this.zoom / 2;
    const ctx = this.ctx;

    // Check if on screen
    if (screen.x < -tw * 2 || screen.x > this.canvas.width + tw * 2 ||
        screen.y < -th * 4 || screen.y > this.canvas.height + th * 4) {
      return;
    }

    const colors = this.tileColors[tileType] || this.tileColors[0];
    // Use tile position for deterministic variation
    const colorIdx = (x * 7 + y * 13) % 3;

    // Draw diamond tile
    ctx.beginPath();
    ctx.moveTo(screen.x, screen.y - th);
    ctx.lineTo(screen.x + tw, screen.y);
    ctx.lineTo(screen.x, screen.y + th);
    ctx.lineTo(screen.x - tw, screen.y);
    ctx.closePath();

    ctx.fillStyle = colors[colorIdx];
    ctx.fill();

    // Tile outline
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Water animation
    if (tileType === 2) {
      const wave = Math.sin(Date.now() / 500 + x + y) * 2;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y + wave, tw * 0.3, th * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawTree(x, y) {
    const screen = this.worldToScreen(x, y);
    const z = this.zoom;
    const ctx = this.ctx;

    // Trunk
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(screen.x - 3 * z, screen.y - 20 * z, 6 * z, 20 * z);

    // Canopy layers
    const canopyColors = ['#1a4d0a', '#2d6b1a', '#1f5c0f'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = canopyColors[i];
      ctx.beginPath();
      ctx.ellipse(
        screen.x + (i - 1) * 4 * z,
        screen.y - (25 + i * 6) * z,
        (14 - i * 2) * z,
        (10 - i * 1.5) * z,
        0, 0, Math.PI * 2
      );
      ctx.fill();
    }
  }

  drawWallBlock(x, y) {
    const screen = this.worldToScreen(x, y);
    const z = this.zoom;
    const ctx = this.ctx;
    const tw = this.tileWidth * z / 2;
    const th = this.tileHeight * z / 2;
    const height = 24 * z;

    // Wall front faces
    ctx.fillStyle = '#6b5b4f';
    ctx.beginPath();
    ctx.moveTo(screen.x - tw, screen.y);
    ctx.lineTo(screen.x, screen.y + th);
    ctx.lineTo(screen.x, screen.y + th - height);
    ctx.lineTo(screen.x - tw, screen.y - height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#5e4e42';
    ctx.beginPath();
    ctx.moveTo(screen.x, screen.y + th);
    ctx.lineTo(screen.x + tw, screen.y);
    ctx.lineTo(screen.x + tw, screen.y - height);
    ctx.lineTo(screen.x, screen.y + th - height);
    ctx.closePath();
    ctx.fill();

    // Top
    ctx.fillStyle = '#7a6a5e';
    ctx.beginPath();
    ctx.moveTo(screen.x, screen.y - th - height);
    ctx.lineTo(screen.x + tw, screen.y - height);
    ctx.lineTo(screen.x, screen.y + th - height);
    ctx.lineTo(screen.x - tw, screen.y - height);
    ctx.closePath();
    ctx.fill();
  }

  drawOre(x, y, tileType) {
    const screen = this.worldToScreen(x, y);
    const z = this.zoom;
    const ctx = this.ctx;

    // Rock base
    ctx.fillStyle = '#707070';
    ctx.beginPath();
    ctx.ellipse(screen.x, screen.y - 5 * z, 14 * z, 10 * z, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ore color spots
    const colors = { 11: '#b87333', 12: '#c0c0c0', 13: '#ffd700' };
    ctx.fillStyle = colors[tileType] || '#888';
    for (let i = 0; i < 4; i++) {
      const ox = (Math.sin(i * 2.3 + x) * 8) * z;
      const oy = (Math.cos(i * 1.7 + y) * 5 - 5) * z;
      ctx.beginPath();
      ctx.ellipse(screen.x + ox, screen.y + oy, 3 * z, 2 * z, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawSpecialTile(x, y, tileType) {
    const screen = this.worldToScreen(x, y);
    const z = this.zoom;
    const ctx = this.ctx;

    if (tileType === 14) { // Furnace
      ctx.fillStyle = '#555';
      ctx.fillRect(screen.x - 10 * z, screen.y - 20 * z, 20 * z, 20 * z);
      ctx.fillStyle = '#ff4400';
      ctx.fillRect(screen.x - 6 * z, screen.y - 10 * z, 12 * z, 8 * z);
      // Glow
      ctx.fillStyle = 'rgba(255,100,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y - 5 * z, 15 * z, 10 * z, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (tileType === 15) { // Anvil
      ctx.fillStyle = '#444';
      ctx.fillRect(screen.x - 8 * z, screen.y - 8 * z, 16 * z, 4 * z);
      ctx.fillRect(screen.x - 4 * z, screen.y - 4 * z, 8 * z, 8 * z);
      ctx.fillStyle = '#555';
      ctx.fillRect(screen.x - 10 * z, screen.y - 12 * z, 20 * z, 4 * z);
    } else if (tileType === 16) { // Bank booth
      ctx.fillStyle = '#c0a060';
      ctx.fillRect(screen.x - 12 * z, screen.y - 18 * z, 24 * z, 18 * z);
      ctx.fillStyle = '#ffd700';
      ctx.font = `bold ${10 * z}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText('$', screen.x, screen.y - 6 * z);
    } else if (tileType === 17) { // Altar
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(screen.x - 10 * z, screen.y - 6 * z, 20 * z, 6 * z);
      ctx.fillStyle = '#d0d0d0';
      ctx.fillRect(screen.x - 6 * z, screen.y - 12 * z, 12 * z, 6 * z);
      // Glow
      ctx.fillStyle = 'rgba(200,200,255,0.3)';
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y - 10 * z, 14 * z, 8 * z, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPlayer(player, isLocal) {
    const screen = this.worldToScreen(player.x, player.y);
    const z = this.zoom;
    const ctx = this.ctx;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(screen.x, screen.y + 2 * z, 10 * z, 5 * z, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const bodyColor = isLocal ? '#0066cc' : '#cc3333';
    ctx.fillStyle = bodyColor;
    ctx.fillRect(screen.x - 6 * z, screen.y - 24 * z, 12 * z, 16 * z);

    // Equipment rendering
    if (player.equipment) {
      // Body armour
      if (player.equipment.body) {
        const armourColors = {
          bronze_plate: '#b87333', iron_plate: '#c0c0c0',
          steel_plate: '#a8a8a8', rune_plate: '#00a0b0'
        };
        ctx.fillStyle = armourColors[player.equipment.body.id] || '#888';
        ctx.fillRect(screen.x - 7 * z, screen.y - 22 * z, 14 * z, 12 * z);
      }
      // Helmet
      if (player.equipment.head) {
        const helmColors = {
          bronze_helm: '#b87333', iron_helm: '#c0c0c0',
          steel_helm: '#a8a8a8', rune_helm: '#00a0b0'
        };
        ctx.fillStyle = helmColors[player.equipment.head.id] || '#888';
        ctx.beginPath();
        ctx.arc(screen.x, screen.y - 30 * z, 7 * z, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Head (no helmet)
        ctx.fillStyle = '#ffcc99';
        ctx.beginPath();
        ctx.arc(screen.x, screen.y - 30 * z, 6 * z, 0, Math.PI * 2);
        ctx.fill();
      }
      // Legs
      const legColor = player.equipment.legs ?
        ({ bronze_legs: '#b87333', iron_legs: '#c0c0c0', steel_legs: '#a8a8a8', rune_legs: '#00a0b0' }[player.equipment.legs.id] || '#888') :
        '#333366';
      ctx.fillStyle = legColor;
      ctx.fillRect(screen.x - 5 * z, screen.y - 8 * z, 4 * z, 10 * z);
      ctx.fillRect(screen.x + 1 * z, screen.y - 8 * z, 4 * z, 10 * z);

      // Weapon
      if (player.equipment.weapon) {
        ctx.fillStyle = '#888';
        ctx.save();
        ctx.translate(screen.x + 8 * z, screen.y - 18 * z);
        ctx.rotate(0.3);
        ctx.fillRect(-1.5 * z, -12 * z, 3 * z, 18 * z);
        ctx.restore();
      }
      // Shield
      if (player.equipment.shield) {
        const shieldColors = {
          bronze_shield: '#b87333', iron_shield: '#c0c0c0',
          steel_shield: '#a8a8a8', rune_shield: '#00a0b0'
        };
        ctx.fillStyle = shieldColors[player.equipment.shield.id] || '#888';
        ctx.beginPath();
        ctx.ellipse(screen.x - 10 * z, screen.y - 16 * z, 5 * z, 7 * z, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Default head
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath();
      ctx.arc(screen.x, screen.y - 30 * z, 6 * z, 0, Math.PI * 2);
      ctx.fill();
      // Default legs
      ctx.fillStyle = '#333366';
      ctx.fillRect(screen.x - 5 * z, screen.y - 8 * z, 4 * z, 10 * z);
      ctx.fillRect(screen.x + 1 * z, screen.y - 8 * z, 4 * z, 10 * z);
    }

    // HP bar
    const hpPct = player.hp / player.maxHp;
    const barWidth = 24 * z;
    ctx.fillStyle = '#333';
    ctx.fillRect(screen.x - barWidth / 2, screen.y - 40 * z, barWidth, 4 * z);
    ctx.fillStyle = hpPct > 0.5 ? '#00cc00' : hpPct > 0.25 ? '#cccc00' : '#cc0000';
    ctx.fillRect(screen.x - barWidth / 2, screen.y - 40 * z, barWidth * hpPct, 4 * z);

    // Name and combat level
    ctx.fillStyle = isLocal ? '#00ffff' : '#ffffff';
    ctx.font = `bold ${10 * z}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText(`${player.name} (${player.combatLevel})`, screen.x, screen.y - 44 * z);
    ctx.fillText(`${player.name} (${player.combatLevel})`, screen.x, screen.y - 44 * z);

    // Local player highlight
    if (isLocal) {
      ctx.strokeStyle = 'rgba(0,200,255,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const tw = this.tileWidth * z / 2;
      const th = this.tileHeight * z / 2;
      ctx.moveTo(screen.x, screen.y - th);
      ctx.lineTo(screen.x + tw, screen.y);
      ctx.lineTo(screen.x, screen.y + th);
      ctx.lineTo(screen.x - tw, screen.y);
      ctx.closePath();
      ctx.stroke();
    }
  }

  drawNPC(npc) {
    if (!npc.alive) return;

    const screen = this.worldToScreen(npc.x, npc.y);
    const z = this.zoom;
    const ctx = this.ctx;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(screen.x, screen.y + 2 * z, 8 * z, 4 * z, 0, 0, Math.PI * 2);
    ctx.fill();

    if (npc.friendly) {
      // Friendly NPC - blue/white
      ctx.fillStyle = '#4488ff';
      ctx.fillRect(screen.x - 5 * z, screen.y - 20 * z, 10 * z, 14 * z);
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath();
      ctx.arc(screen.x, screen.y - 24 * z, 5 * z, 0, Math.PI * 2);
      ctx.fill();
      // Legs
      ctx.fillStyle = '#333';
      ctx.fillRect(screen.x - 4 * z, screen.y - 6 * z, 3 * z, 8 * z);
      ctx.fillRect(screen.x + 1 * z, screen.y - 6 * z, 3 * z, 8 * z);

      // Name in yellow
      ctx.fillStyle = '#ffff00';
      ctx.font = `bold ${9 * z}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeText(npc.name, screen.x, screen.y - 32 * z);
      ctx.fillText(npc.name, screen.x, screen.y - 32 * z);
    } else {
      // Monster appearance by type
      const monsterColors = {
        chicken: { body: '#ffffff', size: 0.6 },
        cow: { body: '#8B4513', size: 0.9 },
        goblin: { body: '#4a7a2a', size: 0.8 },
        skeleton: { body: '#e0d8c0', size: 0.85 },
        zombie: { body: '#5a7a5a', size: 0.9 },
        giant_spider: { body: '#2a1a1a', size: 0.7 },
        dark_wizard: { body: '#2a0a3a', size: 0.9 },
        lesser_demon: { body: '#8b0000', size: 1.1 }
      };

      const appearance = monsterColors[npc.type] || { body: '#aa3333', size: 0.8 };
      const s = appearance.size;

      // Body
      ctx.fillStyle = appearance.body;
      ctx.fillRect(screen.x - 5 * s * z, screen.y - 20 * s * z, 10 * s * z, 14 * s * z);

      // Head
      ctx.fillStyle = appearance.body;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y - 24 * s * z, 5 * s * z, 0, Math.PI * 2);
      ctx.fill();

      if (npc.type === 'skeleton') {
        // Skeleton eyes
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(screen.x - 2 * z, screen.y - 25 * s * z, 1.5 * z, 0, Math.PI * 2);
        ctx.arc(screen.x + 2 * z, screen.y - 25 * s * z, 1.5 * z, 0, Math.PI * 2);
        ctx.fill();
      }

      if (npc.type === 'dark_wizard') {
        // Wizard hat
        ctx.fillStyle = '#1a0a2a';
        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y - 42 * z);
        ctx.lineTo(screen.x - 8 * z, screen.y - 24 * z);
        ctx.lineTo(screen.x + 8 * z, screen.y - 24 * z);
        ctx.closePath();
        ctx.fill();
      }

      if (npc.type === 'lesser_demon') {
        // Demon horns
        ctx.fillStyle = '#5a0000';
        ctx.beginPath();
        ctx.moveTo(screen.x - 4 * z, screen.y - 28 * z);
        ctx.lineTo(screen.x - 8 * z, screen.y - 38 * z);
        ctx.lineTo(screen.x - 1 * z, screen.y - 28 * z);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(screen.x + 4 * z, screen.y - 28 * z);
        ctx.lineTo(screen.x + 8 * z, screen.y - 38 * z);
        ctx.lineTo(screen.x + 1 * z, screen.y - 28 * z);
        ctx.closePath();
        ctx.fill();
      }

      // Legs
      ctx.fillStyle = appearance.body;
      ctx.fillRect(screen.x - 4 * s * z, screen.y - 6 * s * z, 3 * s * z, 8 * s * z);
      ctx.fillRect(screen.x + 1 * s * z, screen.y - 6 * s * z, 3 * s * z, 8 * s * z);

      // HP bar
      const hpPct = npc.hp / npc.maxHp;
      if (hpPct < 1) {
        const barWidth = 20 * z;
        ctx.fillStyle = '#333';
        ctx.fillRect(screen.x - barWidth / 2, screen.y - 34 * z, barWidth, 3 * z);
        ctx.fillStyle = hpPct > 0.5 ? '#00cc00' : hpPct > 0.25 ? '#cccc00' : '#cc0000';
        ctx.fillRect(screen.x - barWidth / 2, screen.y - 34 * z, barWidth * hpPct, 3 * z);
      }

      // Name and level
      ctx.fillStyle = npc.level > 30 ? '#ff4444' : npc.level > 15 ? '#ffaa00' : '#ffff00';
      ctx.font = `bold ${9 * z}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeText(`${npc.name} (lvl ${npc.level})`, screen.x, screen.y - 38 * z);
      ctx.fillText(`${npc.name} (lvl ${npc.level})`, screen.x, screen.y - 38 * z);
    }
  }

  drawGroundItem(item, x, y) {
    const screen = this.worldToScreen(x, y);
    const z = this.zoom;
    const ctx = this.ctx;

    // Small item on ground
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(screen.x - 4 * z, screen.y - 4 * z, 8 * z, 8 * z);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(screen.x - 4 * z, screen.y - 4 * z, 8 * z, 8 * z);
  }

  drawResourceNode(node, index) {
    const screen = this.worldToScreen(node.x, node.y);
    const z = this.zoom;
    const ctx = this.ctx;

    // Fishing spot (animated)
    if (node.type.startsWith('fishing_spot')) {
      const wave = Math.sin(Date.now() / 400 + index) * 3;
      ctx.fillStyle = 'rgba(100,200,255,0.6)';
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y + wave, 8 * z, 4 * z, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `${8 * z}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🐟', screen.x, screen.y - 5 * z);
    }
  }

  drawHitSplat(x, y, damage, tick) {
    const screen = this.worldToScreen(x, y);
    const z = this.zoom;
    const ctx = this.ctx;
    const age = Date.now() - tick;
    if (age > 1500) return;

    const alpha = Math.max(0, 1 - age / 1500);
    const yOffset = -age / 40;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = damage > 0 ? '#cc0000' : '#0066cc';
    ctx.beginPath();
    ctx.arc(screen.x, screen.y - 20 * z + yOffset, 10 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${10 * z}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(damage.toString(), screen.x, screen.y - 20 * z + yOffset);
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic';
  }

  drawMinimap(map, player, npcs, players, mapWidth, mapHeight) {
    const ctx = this.ctx;
    const mmSize = 150;
    const mmX = this.canvas.width - mmSize - 10;
    const mmY = 10;
    const scale = mmSize / mapWidth;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(mmX - 2, mmY - 2, mmSize + 4, mmSize + 4);

    // Draw tiles (simplified)
    const mmColors = {
      0: '#4a8c3f', 1: '#8B7355', 2: '#3366aa', 3: '#808080',
      4: '#d4b96a', 5: '#1a4d0a', 6: '#6b5b4f', 7: '#a08060',
      8: '#8B7355', 9: '#8B6914', 10: '#5a3a1a', 16: '#ffd700'
    };

    // Only draw area around player
    const viewR = 20;
    const px = player.x;
    const py = player.y;
    for (let y = Math.max(0, py - viewR); y < Math.min(mapHeight, py + viewR); y++) {
      for (let x = Math.max(0, px - viewR); x < Math.min(mapWidth, px + viewR); x++) {
        const color = mmColors[map[y][x]] || '#4a8c3f';
        ctx.fillStyle = color;
        ctx.fillRect(mmX + x * scale, mmY + y * scale, Math.ceil(scale), Math.ceil(scale));
      }
    }

    // Draw NPCs
    for (const npc of Object.values(npcs)) {
      if (!npc.alive) continue;
      ctx.fillStyle = npc.friendly ? '#00ff00' : '#ff0000';
      ctx.fillRect(mmX + npc.x * scale - 1, mmY + npc.y * scale - 1, 2, 2);
    }

    // Draw other players
    for (const p of Object.values(players)) {
      if (p.id === player.id) continue;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mmX + p.x * scale - 1, mmY + p.y * scale - 1, 3, 3);
    }

    // Draw local player
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(mmX + px * scale - 2, mmY + py * scale - 2, 4, 4);

    // Border
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(mmX - 2, mmY - 2, mmSize + 4, mmSize + 4);
  }

  render(gameState) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!gameState.map || !gameState.localPlayer) return;

    // Center camera on local player
    this.centerOn(gameState.localPlayer.x, gameState.localPlayer.y);

    const map = gameState.map;

    // Collect all entities for depth sorting
    const entities = [];

    // Draw tiles and collect elevated tiles
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        const tile = map[y][x];
        this.drawTile(x, y, tile);

        if (tile === 5) entities.push({ type: 'tree', x, y, depth: x + y });
        else if (tile === 6) entities.push({ type: 'wall', x, y, depth: x + y });
        else if (tile >= 11 && tile <= 13) entities.push({ type: 'ore', x, y, tileType: tile, depth: x + y });
        else if (tile >= 14 && tile <= 17) entities.push({ type: 'special', x, y, tileType: tile, depth: x + y });
      }
    }

    // Add resource nodes
    gameState.resourceNodes.forEach((node, idx) => {
      entities.push({ type: 'resource', node, index: idx, x: node.x, y: node.y, depth: node.x + node.y });
    });

    // Add ground items
    gameState.groundItems.forEach(gi => {
      entities.push({ type: 'groundItem', item: gi.item, x: gi.x, y: gi.y, depth: gi.x + gi.y });
    });

    // Add NPCs
    for (const npc of Object.values(gameState.npcs)) {
      entities.push({ type: 'npc', npc, x: npc.x, y: npc.y, depth: npc.x + npc.y });
    }

    // Add players
    for (const player of Object.values(gameState.players)) {
      entities.push({
        type: 'player',
        player,
        isLocal: player.id === gameState.localPlayer.id,
        x: player.x,
        y: player.y,
        depth: player.x + player.y
      });
    }

    // Sort by depth (back to front)
    entities.sort((a, b) => a.depth - b.depth);

    // Draw all entities
    for (const entity of entities) {
      switch (entity.type) {
        case 'tree': this.drawTree(entity.x, entity.y); break;
        case 'wall': this.drawWallBlock(entity.x, entity.y); break;
        case 'ore': this.drawOre(entity.x, entity.y, entity.tileType); break;
        case 'special': this.drawSpecialTile(entity.x, entity.y, entity.tileType); break;
        case 'resource': this.drawResourceNode(entity.node, entity.index); break;
        case 'groundItem': this.drawGroundItem(entity.item, entity.x, entity.y); break;
        case 'npc': this.drawNPC(entity.npc); break;
        case 'player': this.drawPlayer(entity.player, entity.isLocal); break;
      }
    }

    // Draw hit splats
    for (const splat of gameState.hitSplats) {
      this.drawHitSplat(splat.x, splat.y, splat.damage, splat.time);
    }

    // Minimap
    this.drawMinimap(
      gameState.map,
      gameState.localPlayer,
      gameState.npcs,
      gameState.players,
      map[0].length,
      map.length
    );
  }
}
