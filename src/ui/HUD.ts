import {
  GAME_WIDTH, GAME_HEIGHT, WEAPONS, SKILLS, UPGRADES,
  SHOP_ITEMS, ShopItemDefinition, UpgradeDefinition,
  WeaponDefinition, SkillDefinition,
} from '../data/GameData';
import { SaveManager } from '../utils/SaveManager';

// ============================================================
// HUD: Always-visible bars and info
// ============================================================
export class HUD {
  scene: Phaser.Scene;
  private hpBar: Phaser.GameObjects.Graphics;
  private hpText: Phaser.GameObjects.Text;
  private mpBar: Phaser.GameObjects.Graphics;
  private mpText: Phaser.GameObjects.Text;
  private skillBar: Phaser.GameObjects.Graphics;
  private skillText: Phaser.GameObjects.Text;
  private infoText: Phaser.GameObjects.Text;
  private xpBar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // HP bar
    this.hpBar = scene.add.graphics().setDepth(50).setScrollFactor(0);
    this.hpText = scene.add.text(16, 10, '', {
      fontSize: '13px', color: '#ffffff', fontFamily: 'Arial',
    }).setDepth(50).setScrollFactor(0);

    // MP bar
    this.mpBar = scene.add.graphics().setDepth(50).setScrollFactor(0);
    this.mpText = scene.add.text(16, 30, '', {
      fontSize: '13px', color: '#ffffff', fontFamily: 'Arial',
    }).setDepth(50).setScrollFactor(0);

    // Skill cooldown bar
    this.skillBar = scene.add.graphics().setDepth(50).setScrollFactor(0);
    this.skillText = scene.add.text(16, 50, '', {
      fontSize: '12px', color: '#cccccc', fontFamily: 'Arial',
    }).setDepth(50).setScrollFactor(0);

    // Info text (stage, room, wave, gold, essence)
    this.infoText = scene.add.text(GAME_WIDTH - 16, 10, '', {
      fontSize: '13px', color: '#aaaaaa', fontFamily: 'Arial', align: 'right',
    }).setOrigin(1, 0).setDepth(50).setScrollFactor(0);

    // XP bar at bottom
    this.xpBar = scene.add.graphics().setDepth(50).setScrollFactor(0);
  }

  update(): void {
    const gs = this.scene as any;
    const player = gs.player;
    if (!player) return;

    const time = this.scene.time.now;

    // HP bar
    this.hpBar.clear();
    const hpW = 180, hpH = 12, hpX = 14, hpY = 12;
    this.hpBar.fillStyle(0x333333, 1);
    this.hpBar.fillRoundedRect(hpX, hpY, hpW, hpH, 4);
    const hpR = Math.max(0, player.hp / player.maxHp);
    const hpC = hpR > 0.5 ? 0x66bb6a : hpR > 0.25 ? 0xffa726 : 0xff4444;
    this.hpBar.fillStyle(hpC, 1);
    this.hpBar.fillRoundedRect(hpX, hpY, hpW * hpR, hpH, 4);
    this.hpText.setText(`HP ${Math.ceil(player.hp)}/${player.maxHp}`);
    this.hpText.setPosition(hpX + 4, hpY - 2);

    // MP bar
    this.mpBar.clear();
    const mpY = hpY + hpH + 6;
    this.mpBar.fillStyle(0x333333, 1);
    this.mpBar.fillRoundedRect(hpX, mpY, hpW, hpH, 4);
    const mpR = Math.max(0, player.mp / player.maxMp);
    this.mpBar.fillStyle(0x42a5f5, 1);
    this.mpBar.fillRoundedRect(hpX, mpY, hpW * mpR, hpH, 4);
    this.mpText.setText(`MP ${Math.ceil(player.mp)}/${player.maxMp}`);
    this.mpText.setPosition(hpX + 4, mpY - 2);

    // Skill cooldown bar
    this.skillBar.clear();
    const skY = mpY + hpH + 6;
    const skW = 120;
    this.skillBar.fillStyle(0x333333, 1);
    this.skillBar.fillRoundedRect(hpX, skY, skW, 8, 3);
    const skR = player.getSkillCooldownPercent(time);
    const skColor = player.skill ? player.skill.color : 0x7c4dff;
    this.skillBar.fillStyle(skColor, 1);
    this.skillBar.fillRoundedRect(hpX, skY, skW * skR, 8, 3);
    const skLabel = player.skill ? player.skill.name : 'Skill';
    const skStatus = skR >= 1
      ? (player.mp >= (player.skill?.mpCost || 0) ? 'READY' : 'No MP')
      : `${Math.ceil((player.skillCooldownEnd - time) / 1000)}s`;
    this.skillText.setText(`${skLabel}: ${skStatus}`);
    this.skillText.setPosition(hpX, skY + 10);

    // Info
    const stage = gs.stage ?? 1;
    const wave = (gs.wave ?? 0) + 1;
    const totalWaves = 30;
    const gold = gs.runGold ?? 0;
    const essence = gs.runEssence ?? 0;
    this.infoText.setText(
      `Stage ${stage}  Wave ${wave}/${totalWaves}\nGold: ${gold}  Essence: ${essence}`
    );

    // XP bar
    this.xpBar.clear();
    const xpY = GAME_HEIGHT - 6;
    const xpW = GAME_WIDTH;
    this.xpBar.fillStyle(0x333333, 0.5);
    this.xpBar.fillRect(0, xpY, xpW, 6);
    if (player.level > 0) {
      const { getXpForLevel } = require('../data/GameData');
      const needed = getXpForLevel(player.level);
      const xpR = Math.min(1, player.xp / needed);
      this.xpBar.fillStyle(0x00e5ff, 1);
      this.xpBar.fillRect(0, xpY, xpW * xpR, 6);
    }
  }

  destroy(): void {
    this.hpBar.destroy();
    this.hpText.destroy();
    this.mpBar.destroy();
    this.mpText.destroy();
    this.skillBar.destroy();
    this.skillText.destroy();
    this.infoText.destroy();
    this.xpBar.destroy();
  }
}

// ============================================================
// Loadout Overlay — weapon + skill selection before run
// ============================================================
export class LoadoutOverlay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private selectedWeapon: string | null = null;
  private selectedSkill: string | null = null;
  private startBtn!: Phaser.GameObjects.Text;
  private startBg!: Phaser.GameObjects.Graphics;
  private onComplete: (weaponId: string, skillId: string) => void;

  constructor(scene: Phaser.Scene, onComplete: (w: string, s: string) => void) {
    this.scene = scene;
    this.onComplete = onComplete;

    this.container = scene.add.container(0, 0).setDepth(200);

    // Dim background
    const bg = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85);
    this.container.add(bg);

    // Title
    const title = scene.add.text(GAME_WIDTH / 2, 30, 'CHOOSE YOUR LOADOUT', {
      fontSize: '28px', color: '#ffd54f', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(title);

    // Weapon section
    const wLabel = scene.add.text(GAME_WIDTH / 2, 70, 'Select Weapon', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5);
    this.container.add(wLabel);

    const cardSpacing = 280;
    WEAPONS.forEach((w, i) => {
      this.createWeaponCard(w, (i - 1) * cardSpacing + GAME_WIDTH / 2, 150);
    });

    // Skill section
    const sLabel = scene.add.text(GAME_WIDTH / 2, 260, 'Select Special Skill', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5);
    this.container.add(sLabel);

    SKILLS.forEach((s, i) => {
      this.createSkillCard(s, (i - 1) * cardSpacing + GAME_WIDTH / 2, 350);
    });

    // Start button (disabled initially)
    this.startBg = scene.add.graphics();
    this.startBg.fillStyle(0x455a64, 0.5);
    this.startBg.fillRoundedRect(GAME_WIDTH / 2 - 80, 470, 160, 50, 10);
    this.container.add(this.startBg);

    this.startBtn = scene.add.text(GAME_WIDTH / 2, 495, 'START', {
      fontSize: '22px', color: '#666666', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(this.startBtn);

    const startHit = scene.add.rectangle(GAME_WIDTH / 2, 495, 160, 50, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.selectedWeapon && this.selectedSkill) {
          this.container.destroy();
          this.onComplete(this.selectedWeapon, this.selectedSkill);
        }
      });
    this.container.add(startHit);
  }

  private createWeaponCard(w: WeaponDefinition, x: number, y: number): void {
    const cw = 230, ch = 100;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1e1e1e, 0.9);
    bg.fillRoundedRect(x - cw / 2, y - ch / 2, cw, ch, 8);
    bg.lineStyle(2, 0x555555, 1);
    bg.strokeRoundedRect(x - cw / 2, y - ch / 2, cw, ch, 8);
    this.container.add(bg);

    const name = this.scene.add.text(x, y - 30, w.name, {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(name);

    const stats = `DMG: ${w.baseDamage}  SPD: ${(1000 / w.attackSpeed).toFixed(1)}/s  RNG: ${w.range}`;
    const statText = this.scene.add.text(x, y, stats, {
      fontSize: '11px', color: '#aaaaaa', fontFamily: 'Arial',
    }).setOrigin(0.5);
    this.container.add(statText);

    const desc = this.scene.add.text(x, y + 20, w.description, {
      fontSize: '10px', color: '#888888', fontFamily: 'Arial',
      wordWrap: { width: cw - 20 }, align: 'center',
    }).setOrigin(0.5);
    this.container.add(desc);

    const hit = this.scene.add.rectangle(x, y, cw, ch, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.selectedWeapon = w.id;
        this.updateSelection();
      });
    this.container.add(hit);
    hit.setData('bg', bg);
    hit.setData('type', 'weapon');
    hit.setData('id', w.id);
  }

  private createSkillCard(s: SkillDefinition, x: number, y: number): void {
    const cw = 230, ch = 100;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1e1e1e, 0.9);
    bg.fillRoundedRect(x - cw / 2, y - ch / 2, cw, ch, 8);
    bg.lineStyle(2, 0x555555, 1);
    bg.strokeRoundedRect(x - cw / 2, y - ch / 2, cw, ch, 8);
    this.container.add(bg);

    const name = this.scene.add.text(x, y - 30, s.name, {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(name);

    const stats = `MP: ${s.mpCost}  CD: ${(s.cooldown / 1000).toFixed(0)}s`;
    const statText = this.scene.add.text(x, y, stats, {
      fontSize: '11px', color: '#aaaaaa', fontFamily: 'Arial',
    }).setOrigin(0.5);
    this.container.add(statText);

    const desc = this.scene.add.text(x, y + 20, s.description, {
      fontSize: '10px', color: '#888888', fontFamily: 'Arial',
      wordWrap: { width: cw - 20 }, align: 'center',
    }).setOrigin(0.5);
    this.container.add(desc);

    const hit = this.scene.add.rectangle(x, y, cw, ch, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.selectedSkill = s.id;
        this.updateSelection();
      });
    this.container.add(hit);
    hit.setData('bg', bg);
    hit.setData('type', 'skill');
    hit.setData('id', s.id);
  }

  private updateSelection(): void {
    // Redraw all card borders
    this.container.getAll().forEach((obj: any) => {
      if (obj.getData && obj.getData('bg')) {
        const bg = obj.getData('bg') as Phaser.GameObjects.Graphics;
        const type = obj.getData('type');
        const id = obj.getData('id');
        const selected = (type === 'weapon' && id === this.selectedWeapon) ||
                        (type === 'skill' && id === this.selectedSkill);

        const r = obj as Phaser.GameObjects.Rectangle;
        const x = r.x, y = r.y, cw = 230, ch = 100;
        bg.clear();
        bg.fillStyle(selected ? 0x2a3a2a : 0x1e1e1e, 0.9);
        bg.fillRoundedRect(x - cw / 2, y - ch / 2, cw, ch, 8);
        bg.lineStyle(2, selected ? 0x4ecdc4 : 0x555555, 1);
        bg.strokeRoundedRect(x - cw / 2, y - ch / 2, cw, ch, 8);
      }
    });

    // Update start button
    const canStart = this.selectedWeapon && this.selectedSkill;
    this.startBg.clear();
    this.startBg.fillStyle(canStart ? 0x4ecdc4 : 0x455a64, canStart ? 1 : 0.5);
    this.startBg.fillRoundedRect(GAME_WIDTH / 2 - 80, 470, 160, 50, 10);
    this.startBtn.setColor(canStart ? '#ffffff' : '#666666');
  }
}

// ============================================================
// Upgrade Draft Overlay (3 choices, pick 1)
// ============================================================
export class UpgradeDraftOverlay {
  private container: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    currentUpgrades: Record<string, number>,
    onChoice: (upgradeId: string) => void,
  ) {
    this.container = scene.add.container(0, 0).setDepth(200);

    const bg = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);
    this.container.add(bg);

    const title = scene.add.text(GAME_WIDTH / 2, 80, 'CHOOSE AN UPGRADE', {
      fontSize: '28px', color: '#ffd54f', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(title);

    // Pick 3 random upgrades
    const choices = this.pickChoices(currentUpgrades);

    choices.forEach((upg, i) => {
      const x = GAME_WIDTH / 2 + (i - 1) * 260;
      const y = GAME_HEIGHT / 2;
      this.createCard(scene, upg, currentUpgrades[upg.id] || 0, x, y, () => {
        this.container.destroy();
        onChoice(upg.id);
      });
    });
  }

  private pickChoices(current: Record<string, number>): UpgradeDefinition[] {
    const available = UPGRADES.filter(u => (current[u.id] || 0) < u.maxStacks);
    // Weight: common upgrades get 4 weight, rare get 1
    const weighted: UpgradeDefinition[] = [];
    for (const u of available) {
      const w = u.rarity === 'rare' ? 1 : 4;
      for (let i = 0; i < w; i++) weighted.push(u);
    }

    const shuffled = Phaser.Utils.Array.Shuffle([...weighted]);
    const picked: UpgradeDefinition[] = [];
    for (const u of shuffled) {
      if (picked.length >= 3) break;
      if (!picked.find(p => p.id === u.id)) picked.push(u);
    }

    // Fill if needed
    while (picked.length < 3 && available.length > picked.length) {
      const remaining = available.filter(a => !picked.find(p => p.id === a.id));
      if (remaining.length > 0) picked.push(remaining[0]);
      else break;
    }

    return picked;
  }

  private createCard(
    scene: Phaser.Scene, upg: UpgradeDefinition, currentStacks: number,
    x: number, y: number, onClick: () => void,
  ): void {
    const cw = 220, ch = 160;

    const isRare = upg.rarity === 'rare';
    const borderColor = isRare ? 0x1565c0 : 0x555555;

    const bg = scene.add.graphics();
    bg.fillStyle(0x1e1e1e, 0.95);
    bg.fillRoundedRect(x - cw / 2, y - ch / 2, cw, ch, 10);
    bg.lineStyle(2, borderColor, 1);
    bg.strokeRoundedRect(x - cw / 2, y - ch / 2, cw, ch, 10);
    this.container.add(bg);

    if (isRare) {
      const rLabel = scene.add.text(x, y - ch / 2 + 14, 'RARE', {
        fontSize: '10px', color: '#42a5f5', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.container.add(rLabel);
    }

    const name = scene.add.text(x, y - 30, upg.name, {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(name);

    const desc = scene.add.text(x, y + 5, upg.description, {
      fontSize: '12px', color: '#cccccc', fontFamily: 'Arial',
      wordWrap: { width: cw - 30 }, align: 'center',
    }).setOrigin(0.5);
    this.container.add(desc);

    const stackText = scene.add.text(x, y + 45, `${currentStacks}/${upg.maxStacks}`, {
      fontSize: '12px', color: '#aaaaaa', fontFamily: 'Arial',
    }).setOrigin(0.5);
    this.container.add(stackText);

    const hit = scene.add.rectangle(x, y, cw, ch, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x2a2a2a, 0.95);
        bg.fillRoundedRect(x - cw / 2, y - ch / 2, cw, ch, 10);
        bg.lineStyle(3, 0x4ecdc4, 1);
        bg.strokeRoundedRect(x - cw / 2, y - ch / 2, cw, ch, 10);
      })
      .on('pointerout', () => {
        bg.clear();
        bg.fillStyle(0x1e1e1e, 0.95);
        bg.fillRoundedRect(x - cw / 2, y - ch / 2, cw, ch, 10);
        bg.lineStyle(2, borderColor, 1);
        bg.strokeRoundedRect(x - cw / 2, y - ch / 2, cw, ch, 10);
      })
      .on('pointerdown', onClick);
    this.container.add(hit);
  }
}

// ============================================================
// Shop Overlay
// ============================================================
export class ShopOverlay {
  private container: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    playerGold: number,
    onBuy: (itemId: string, cost: number) => boolean,
    onContinue: () => void,
  ) {
    this.container = scene.add.container(0, 0).setDepth(200);

    const bg = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85);
    this.container.add(bg);

    const title = scene.add.text(GAME_WIDTH / 2, 50, 'SHOP', {
      fontSize: '28px', color: '#ffd700', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(title);

    const goldText = scene.add.text(GAME_WIDTH / 2, 80, `Gold: ${playerGold}`, {
      fontSize: '16px', color: '#ffd700', fontFamily: 'Arial',
    }).setOrigin(0.5);
    this.container.add(goldText);

    // Pick 4 random items
    const shuffled = Phaser.Utils.Array.Shuffle([...SHOP_ITEMS]);
    const items = shuffled.slice(0, 4);
    const boughtSet = new Set<string>();

    items.forEach((item, i) => {
      const x = GAME_WIDTH / 2 + ((i % 2) - 0.5) * 240;
      const y = 180 + Math.floor(i / 2) * 140;
      this.createShopCard(scene, item, x, y, playerGold, boughtSet, goldText, onBuy);
    });

    // Continue button
    const cBg = scene.add.graphics();
    cBg.fillStyle(0x4ecdc4, 1);
    cBg.fillRoundedRect(GAME_WIDTH / 2 - 80, GAME_HEIGHT - 90, 160, 45, 10);
    this.container.add(cBg);

    const cBtn = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 68, 'CONTINUE', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(cBtn);

    const cHit = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 68, 160, 45, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.container.destroy();
        onContinue();
      });
    this.container.add(cHit);
  }

  private createShopCard(
    scene: Phaser.Scene, item: ShopItemDefinition,
    x: number, y: number, gold: number,
    boughtSet: Set<string>,
    goldText: Phaser.GameObjects.Text,
    onBuy: (id: string, cost: number) => boolean,
  ): void {
    const cw = 200, ch = 110;

    const bg = scene.add.graphics();
    bg.fillStyle(0x1e1e1e, 0.9);
    bg.fillRoundedRect(x - cw / 2, y - ch / 2, cw, ch, 8);
    bg.lineStyle(1, 0x555555, 1);
    bg.strokeRoundedRect(x - cw / 2, y - ch / 2, cw, ch, 8);
    this.container.add(bg);

    const name = scene.add.text(x, y - 28, item.name, {
      fontSize: '14px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(name);

    const desc = scene.add.text(x, y - 5, item.description, {
      fontSize: '11px', color: '#aaaaaa', fontFamily: 'Arial',
      wordWrap: { width: cw - 20 }, align: 'center',
    }).setOrigin(0.5);
    this.container.add(desc);

    const costLabel = scene.add.text(x, y + 25, `${item.cost} gold`, {
      fontSize: '13px', color: '#ffd700', fontFamily: 'Arial',
    }).setOrigin(0.5);
    this.container.add(costLabel);

    const hit = scene.add.rectangle(x, y, cw, ch, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (boughtSet.has(item.id)) return;
        const success = onBuy(item.id, item.cost);
        if (success) {
          boughtSet.add(item.id);
          bg.clear();
          bg.fillStyle(0x2a3a2a, 0.9);
          bg.fillRoundedRect(x - cw / 2, y - ch / 2, cw, ch, 8);
          costLabel.setText('SOLD');
          costLabel.setColor('#66bb6a');
          // Update gold display
          const gs = scene as any;
          goldText.setText(`Gold: ${gs.runGold ?? 0}`);
        }
      });
    this.container.add(hit);
  }
}

// ============================================================
// Panel Overlays (Inventory, Powerups, Settings, Help)
// ============================================================
export class PanelOverlay {
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, type: 'inventory' | 'powerups' | 'settings' | 'help', data?: any) {
    this.container = scene.add.container(0, 0).setDepth(200);

    const bg = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 500, 400, 0x000000, 0.9)
      .setStrokeStyle(2, 0x555555);
    this.container.add(bg);

    const titles: Record<string, string> = {
      inventory: 'INVENTORY',
      powerups: 'RUN POWERUPS',
      settings: 'SETTINGS',
      help: 'CONTROLS',
    };

    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 170, titles[type], {
      fontSize: '22px', color: '#ffd54f', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(title);

    switch (type) {
      case 'inventory':
        this.buildInventory(scene, data);
        break;
      case 'powerups':
        this.buildPowerups(scene, data);
        break;
      case 'settings':
        this.buildSettings(scene, data);
        break;
      case 'help':
        this.buildHelp(scene);
        break;
    }

    // Close button
    const closeBtn = scene.add.text(GAME_WIDTH / 2 + 220, GAME_HEIGHT / 2 - 180, 'X', {
      fontSize: '20px', color: '#ff4444', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.destroy());
    this.container.add(closeBtn);
  }

  private buildInventory(scene: Phaser.Scene, data: any): void {
    const gs = data as any;
    const player = gs?.player;
    if (!player) return;

    const lines = [
      `Weapon: ${player.weapon?.name || 'None'}`,
      `Skill: ${player.skill?.name || 'None'}`,
      '',
      `Max HP: ${player.maxHp}   Max MP: ${player.maxMp}`,
      `Armor: ${player.getEffectiveArmor()}   Lifesteal: ${(player.lifesteal * 100).toFixed(0)}%`,
      `Crit: ${(player.critChance * 100).toFixed(0)}%   Crit DMG: ${(player.critDamage * 100).toFixed(0)}%`,
      `Damage Mult: ${(player.damageMult * 100).toFixed(0)}%`,
      `Attack Speed: ${(player.attackSpeedMult * 100).toFixed(0)}%`,
      `Move Speed: ${(player.moveSpeedMult * 100).toFixed(0)}%`,
      `Extra Projectiles: ${player.projectileBonus}`,
    ];

    const text = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, lines.join('\n'), {
      fontSize: '14px', color: '#cccccc', fontFamily: 'Arial',
      lineSpacing: 6,
    }).setOrigin(0.5, 0);
    this.container.add(text);
  }

  private buildPowerups(scene: Phaser.Scene, data: any): void {
    const upgrades = data?.upgradeLevels as Record<string, number> || {};
    const entries = Object.entries(upgrades).filter(([, v]) => v > 0);

    if (entries.length === 0) {
      const text = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'No powerups yet.', {
        fontSize: '14px', color: '#aaaaaa', fontFamily: 'Arial',
      }).setOrigin(0.5);
      this.container.add(text);
      return;
    }

    const lines = entries.map(([id, count]) => {
      const upg = UPGRADES.find(u => u.id === id);
      return `${upg?.name || id}: x${count}`;
    });

    const text = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, lines.join('\n'), {
      fontSize: '14px', color: '#cccccc', fontFamily: 'Arial',
      lineSpacing: 8,
    }).setOrigin(0.5, 0);
    this.container.add(text);
  }

  private buildSettings(scene: Phaser.Scene, data: any): void {
    const save = SaveManager.getData();
    const lines = [
      `Screen Shake: ${save.settings.screenShake ? 'ON' : 'OFF'}`,
      `Volume: ${Math.round(save.settings.volume * 100)}%`,
      '',
      '(Settings are saved automatically)',
    ];
    const text = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, lines.join('\n'), {
      fontSize: '14px', color: '#cccccc', fontFamily: 'Arial', lineSpacing: 8,
    }).setOrigin(0.5, 0);
    this.container.add(text);
  }

  private buildHelp(scene: Phaser.Scene): void {
    const lines = [
      'W A S D  —  Move',
      'Mouse    —  Aim',
      'Left Click  —  Attack',
      'Right Click —  Special Skill',
      '',
      'I  —  Inventory',
      'P  —  Run Powerups',
      'O  —  Settings',
      'H  —  Toggle Help',
      'Esc — Pause',
      'R  —  Restart (after death)',
    ];
    const text = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, lines.join('\n'), {
      fontSize: '14px', color: '#cccccc', fontFamily: 'Arial', lineSpacing: 6,
    }).setOrigin(0.5, 0);
    this.container.add(text);
  }

  isActive(): boolean {
    return this.container && this.container.active;
  }

  destroy(): void {
    this.container.destroy();
  }
}

// ============================================================
// Center Message (wave clear, pause, etc.)
// ============================================================
export class CenterMessage {
  static show(scene: Phaser.Scene, text: string, color: string = '#ffd54f', duration: number = 2000): void {
    const msg = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, text, {
      fontSize: '28px',
      color,
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(150);

    scene.tweens.add({
      targets: msg,
      alpha: 0,
      y: msg.y - 30,
      duration,
      delay: 500,
      onComplete: () => msg.destroy(),
    });
  }
}

// ============================================================
// Pause Banner
// ============================================================
export class PauseBanner {
  container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0).setDepth(250);
    const bg = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    this.container.add(bg);
    const text = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'PAUSED', {
      fontSize: '36px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(text);
    const sub = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 'Press ESC to resume', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial',
    }).setOrigin(0.5);
    this.container.add(sub);
  }

  destroy(): void {
    this.container.destroy();
  }
}
