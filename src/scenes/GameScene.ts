import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, COLORS,
  WeaponDef, SkillDef, PlayerStats, EnemyDef, BossDef,
  WEAPONS, SKILLS, CHAPTERS, BOSSES, UPGRADES, SHOP_ITEMS,
  defaultPlayerStats, loadSave, saveSave, heroXpForLevel,
  UpgradeDef, ShopItemDef, SaveData,
} from '../constants';

const ARENA_PAD = 24;
const PICKUP_ATTRACT = 80;

interface EnemySprite extends Phaser.Physics.Arcade.Sprite {
  enemyData: {
    def: EnemyDef | BossDef;
    hp: number;
    maxHp: number;
    damage: number;
    speed: number;
    isBoss: boolean;
    lastAttack: number;
    hpBar: Phaser.GameObjects.Graphics;
    chargeCD: number;
    isCharging: boolean;
    chargeDuration: number;
    slowUntil: number;
    phase2: boolean;
  };
}

interface Projectile extends Phaser.Physics.Arcade.Sprite {
  projData: {
    damage: number;
    piercing: boolean;
    owner: 'player' | 'enemy';
    range: number;
    startX: number;
    startY: number;
    hitSet: Set<number>;
  };
}

interface Pickup extends Phaser.Physics.Arcade.Sprite {
  pickupData: { type: 'gold' | 'essence' | 'hp'; value: number };
}

export class GameScene extends Phaser.Scene {
  // Core
  private player!: Phaser.Physics.Arcade.Sprite;
  private stats!: PlayerStats;
  private weapon!: WeaponDef;
  private weaponKey!: string;
  private skill!: SkillDef;
  private skillKey!: string;
  private lastAttackTime = 0;
  private lastSkillTime = 0;
  private skillCDStart = 0;

  // Groups
  private enemies!: Phaser.Physics.Arcade.Group;
  private playerProjectiles!: Phaser.Physics.Arcade.Group;
  private enemyProjectiles!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;

  // VFX
  private vfxLayer!: Phaser.GameObjects.Container;
  private damageNumbers: { text: Phaser.GameObjects.Text; vy: number; life: number }[] = [];
  private activeGlacier: { x: number; y: number; radius: number; until: number; gfx: Phaser.GameObjects.Sprite } | null = null;

  // Wave state
  private stage = 0;
  private wave = 0;
  private waveEnemiesLeft = 0;
  private waveActive = false;
  private gold = 0;
  private essence = 0;
  private kills = 0;
  private xp = 0;
  private heroXp = 0;

  // Buffs
  private dmgBuffUntil = 0;
  private dmgBuffValue = 0;
  private armorBuffUntil = 0;
  private armorBuffValue = 0;
  private upgradeStacks: Record<string, number> = {};

  // UI state
  private uiContainer!: Phaser.GameObjects.Container;
  private hpBar!: Phaser.GameObjects.Graphics;
  private mpBar!: Phaser.GameObjects.Graphics;
  private skillCdBar!: Phaser.GameObjects.Graphics;
  private xpBar!: Phaser.GameObjects.Graphics;
  private stageText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private centerMsg!: Phaser.GameObjects.Text;
  private centerMsgTimer?: Phaser.Time.TimerEvent;

  // Overlay panels
  private overlayBg!: Phaser.GameObjects.Rectangle;
  private overlayContainer!: Phaser.GameObjects.Container;
  private overlayActive = false;
  private currentPanel = '';

  // Pause
  private paused = false;
  private pauseOverlay!: Phaser.GameObjects.Container;

  // Loadout selection
  private loadoutActive = true;

  // Shop/Upgrade
  private shopActive = false;
  private upgradeActive = false;

  // Dead
  private isDead = false;

  // Keys
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  // Save
  private saveData!: SaveData;

  // Regen accumulators
  private hpRegenAccum = 0;
  private mpRegenAccum = 0;

  constructor() { super({ key: 'GameScene' }); }

  create() {
    this.saveData = loadSave();
    this.heroXp = this.saveData.heroXp;
    this.stage = 0;
    this.wave = 0;
    this.gold = 0;
    this.essence = 0;
    this.kills = 0;
    this.xp = 0;
    this.isDead = false;
    this.paused = false;
    this.loadoutActive = true;
    this.shopActive = false;
    this.upgradeActive = false;
    this.overlayActive = false;
    this.currentPanel = '';
    this.lastAttackTime = 0;
    this.lastSkillTime = 0;
    this.skillCDStart = 0;
    this.dmgBuffUntil = 0;
    this.armorBuffUntil = 0;
    this.upgradeStacks = {};
    this.damageNumbers = [];
    this.activeGlacier = null;
    this.hpRegenAccum = 0;
    this.mpRegenAccum = 0;
    this.stats = defaultPlayerStats();

    this.createArena();
    this.createPlayer();
    this.createGroups();
    this.createUI();
    this.createKeys();
    this.createPauseOverlay();

    // Show loadout selection
    this.showLoadoutSelection();

    // Collisions
    this.physics.add.overlap(this.playerProjectiles, this.enemies, this.onPlayerProjHitEnemy, undefined, this);
    this.physics.add.overlap(this.enemyProjectiles, this.player, this.onEnemyProjHitPlayer, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerTouchEnemy, undefined, this);
    this.physics.add.overlap(this.player, this.pickups, this.onPlayerPickup, undefined, this);

    // Right click for skill
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) this.useSkill();
    });

    // Disable context menu
    this.game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private createArena() {
    // Floor tiles
    for (let x = ARENA_PAD; x < GAME_WIDTH - ARENA_PAD; x += 32) {
      for (let y = ARENA_PAD; y < GAME_HEIGHT - ARENA_PAD; y += 32) {
        this.add.image(x + 16, y + 16, 'floor_tile');
      }
    }
    // Walls
    const wallColor = COLORS.wall;
    const g = this.add.graphics();
    g.fillStyle(wallColor, 1);
    g.fillRect(0, 0, GAME_WIDTH, ARENA_PAD); // top
    g.fillRect(0, GAME_HEIGHT - ARENA_PAD, GAME_WIDTH, ARENA_PAD); // bottom
    g.fillRect(0, 0, ARENA_PAD, GAME_HEIGHT); // left
    g.fillRect(GAME_WIDTH - ARENA_PAD, 0, ARENA_PAD, GAME_HEIGHT); // right
    g.lineStyle(2, 0x444466, 0.5);
    g.strokeRect(ARENA_PAD, ARENA_PAD, GAME_WIDTH - ARENA_PAD * 2, GAME_HEIGHT - ARENA_PAD * 2);

    this.physics.world.setBounds(ARENA_PAD, ARENA_PAD, GAME_WIDTH - ARENA_PAD * 2, GAME_HEIGHT - ARENA_PAD * 2);
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    (this.player.body as Phaser.Physics.Arcade.Body).setCircle(14);
  }

  private createGroups() {
    this.enemies = this.physics.add.group({ runChildUpdate: false });
    this.playerProjectiles = this.physics.add.group({ runChildUpdate: false });
    this.enemyProjectiles = this.physics.add.group({ runChildUpdate: false });
    this.pickups = this.physics.add.group({ runChildUpdate: false });
    this.vfxLayer = this.add.container(0, 0).setDepth(20);
  }

  private createKeys() {
    this.keys = {
      W: this.input.keyboard!.addKey('W'),
      A: this.input.keyboard!.addKey('A'),
      S: this.input.keyboard!.addKey('S'),
      D: this.input.keyboard!.addKey('D'),
      I: this.input.keyboard!.addKey('I'),
      P: this.input.keyboard!.addKey('P'),
      O: this.input.keyboard!.addKey('O'),
      H: this.input.keyboard!.addKey('H'),
      R: this.input.keyboard!.addKey('R'),
      ESC: this.input.keyboard!.addKey('ESC'),
    };
  }

  // ───── LOADOUT ─────
  private showLoadoutSelection() {
    this.loadoutActive = true;
    const cont = this.add.container(0, 0).setDepth(100);
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85);
    cont.add(bg);

    cont.add(this.add.text(GAME_WIDTH / 2, 40, 'CHOOSE YOUR LOADOUT', {
      fontSize: '24px', color: '#4ecdc4', fontFamily: 'monospace',
    }).setOrigin(0.5));

    // Weapons
    cont.add(this.add.text(GAME_WIDTH / 2, 80, 'Weapon:', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5));

    const weaponKeys = Object.keys(WEAPONS);
    let selectedWeapon = 0;
    const weaponBtns: Phaser.GameObjects.Rectangle[] = [];
    const weaponTexts: Phaser.GameObjects.Text[] = [];

    weaponKeys.forEach((key, i) => {
      const w = WEAPONS[key];
      const x = GAME_WIDTH / 2 + (i - 1) * 200;
      const y = 150;
      const btn = this.add.rectangle(x, y, 180, 80, 0x333355, 1).setInteractive({ useHandCursor: true });
      const txt = this.add.text(x, y - 15, w.name, { fontSize: '14px', color: '#ffffff', fontFamily: 'monospace' }).setOrigin(0.5);
      const desc = this.add.text(x, y + 10, `${w.damage} dmg | ${w.cooldown}ms`, { fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace' }).setOrigin(0.5);
      const desc2 = this.add.text(x, y + 25, w.type === 'melee' ? `${w.range}px ${w.arc}° arc` : `${w.range}px ${w.speed} spd`, { fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace' }).setOrigin(0.5);
      cont.add([btn, txt, desc, desc2]);
      weaponBtns.push(btn);
      weaponTexts.push(txt);

      btn.on('pointerdown', () => {
        selectedWeapon = i;
        weaponBtns.forEach((b, j) => b.setFillStyle(j === i ? COLORS.player : 0x333355, 1));
      });
    });
    weaponBtns[0].setFillStyle(COLORS.player, 1);

    // Skills
    cont.add(this.add.text(GAME_WIDTH / 2, 230, 'Skill (Right-Click):', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5));

    const skillKeys = Object.keys(SKILLS);
    let selectedSkill = 0;
    const skillBtns: Phaser.GameObjects.Rectangle[] = [];

    skillKeys.forEach((key, i) => {
      const s = SKILLS[key];
      const x = GAME_WIDTH / 2 + (i - 1) * 200;
      const y = 310;
      const btn = this.add.rectangle(x, y, 180, 80, 0x333355, 1).setInteractive({ useHandCursor: true });
      const txt = this.add.text(x, y - 15, s.name, { fontSize: '14px', color: '#ffffff', fontFamily: 'monospace' }).setOrigin(0.5);
      const desc = this.add.text(x, y + 10, `${s.mpCost} MP | ${s.cooldown / 1000}s CD`, { fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace' }).setOrigin(0.5);
      const desc2 = this.add.text(x, y + 25, `${s.radius}px radius`, { fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace' }).setOrigin(0.5);
      cont.add([btn, txt, desc, desc2]);
      skillBtns.push(btn);

      btn.on('pointerdown', () => {
        selectedSkill = i;
        skillBtns.forEach((b, j) => b.setFillStyle(j === i ? COLORS.player : 0x333355, 1));
      });
    });
    skillBtns[0].setFillStyle(COLORS.player, 1);

    // Start button
    const startBtn = this.add.rectangle(GAME_WIDTH / 2, 450, 200, 50, COLORS.player, 0.9)
      .setInteractive({ useHandCursor: true });
    cont.add(startBtn);
    cont.add(this.add.text(GAME_WIDTH / 2, 450, 'START RUN', {
      fontSize: '20px', color: '#1a1a2e', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));

    startBtn.on('pointerdown', () => {
      this.weaponKey = weaponKeys[selectedWeapon];
      this.weapon = { ...WEAPONS[this.weaponKey] };
      this.skillKey = skillKeys[selectedSkill];
      this.skill = { ...SKILLS[this.skillKey] };
      cont.destroy();
      this.loadoutActive = false;
      this.startWave();
    });
  }

  // ───── WAVE SYSTEM ─────
  private startWave() {
    this.wave++;
    const isBossWave = this.wave % 3 === 0;
    this.showCenterMessage(isBossWave ? `BOSS WAVE ${this.wave}!` : `Wave ${this.wave}`, 2000);

    this.time.delayedCall(1500, () => {
      if (isBossWave) {
        this.spawnBoss();
      } else {
        this.spawnWaveEnemies();
      }
      this.waveActive = true;
    });
  }

  private spawnWaveEnemies() {
    const count = Math.min(3 + Math.floor(this.wave / 3) + this.stage, 10);
    this.waveEnemiesLeft = count;
    const chapter = CHAPTERS[this.stage] || CHAPTERS[CHAPTERS.length - 1];

    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * 300, () => {
        const def = Phaser.Utils.Array.GetRandom(chapter.enemies) as EnemyDef;
        this.spawnEnemy(def, false);
      });
    }
  }

  private scaleEnemyStat(base: number): number {
    return Math.floor(base * (1 + this.stage * 0.5 + this.wave * 0.02));
  }

  private spawnEnemy(def: EnemyDef, isBoss: false): EnemySprite;
  private spawnEnemy(def: BossDef, isBoss: true): EnemySprite;
  private spawnEnemy(def: EnemyDef | BossDef, isBoss: boolean): EnemySprite {
    const pad = 60;
    let x: number, y: number;
    const side = Phaser.Math.Between(0, 3);
    switch (side) {
      case 0: x = Phaser.Math.Between(ARENA_PAD + pad, GAME_WIDTH - ARENA_PAD - pad); y = ARENA_PAD + pad; break;
      case 1: x = GAME_WIDTH - ARENA_PAD - pad; y = Phaser.Math.Between(ARENA_PAD + pad, GAME_HEIGHT - ARENA_PAD - pad); break;
      case 2: x = Phaser.Math.Between(ARENA_PAD + pad, GAME_WIDTH - ARENA_PAD - pad); y = GAME_HEIGHT - ARENA_PAD - pad; break;
      default: x = ARENA_PAD + pad; y = Phaser.Math.Between(ARENA_PAD + pad, GAME_HEIGHT - ARENA_PAD - pad);
    }

    const texKey = isBoss
      ? `boss_${def.name.replace(/\s+/g, '_').toLowerCase()}`
      : `enemy_${def.name.replace(/\s+/g, '_').toLowerCase()}`;
    const sprite = this.physics.add.sprite(x, y, texKey) as EnemySprite;
    sprite.setCollideWorldBounds(true);
    sprite.setDepth(8);
    (sprite.body as Phaser.Physics.Arcade.Body).setCircle(def.size);

    const scaledHp = isBoss ? this.scaleEnemyStat(def.hp) : this.scaleEnemyStat(def.hp);
    const scaledDmg = this.scaleEnemyStat(def.damage);
    const scaledSpd = isBoss ? def.speed : this.scaleEnemyStat(def.speed);

    const hpBar = this.add.graphics().setDepth(9);

    sprite.enemyData = {
      def,
      hp: scaledHp,
      maxHp: scaledHp,
      damage: scaledDmg,
      speed: Math.min(scaledSpd, isBoss ? 120 : 200),
      isBoss,
      lastAttack: 0,
      hpBar,
      chargeCD: 0,
      isCharging: false,
      chargeDuration: 0,
      slowUntil: 0,
      phase2: false,
    };

    this.enemies.add(sprite);
    return sprite;
  }

  private spawnBoss() {
    const bossDef = BOSSES[this.stage] || BOSSES[BOSSES.length - 1];
    this.waveEnemiesLeft = 1;
    this.spawnEnemy(bossDef, true);
  }

  private onWaveComplete() {
    this.waveActive = false;
    const isBossWave = this.wave % 3 === 0;
    const goldReward = 10 + this.wave * 2 + (isBossWave ? 30 : 0);
    const essenceReward = isBossWave ? 5 : 1;
    this.gold += goldReward;
    this.essence += essenceReward;

    this.showCenterMessage('WAVE CLEAR!', 1500);

    if (isBossWave) {
      // Show shop then upgrade
      this.time.delayedCall(2000, () => this.showShop());
    } else if (this.wave >= 30) {
      this.completeStage();
    } else {
      this.time.delayedCall(2000, () => this.startWave());
    }
  }

  private completeStage() {
    this.stage++;
    this.wave = 0;
    this.showCenterMessage(`STAGE ${this.stage} COMPLETE!`, 3000);
    if (this.stage >= 3) {
      // Game victory
      this.time.delayedCall(3000, () => this.gameOver(true));
    } else {
      this.time.delayedCall(3000, () => this.startWave());
    }
  }

  // ───── SHOP ─────
  private showShop() {
    this.shopActive = true;
    const cont = this.add.container(0, 0).setDepth(100);
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85);
    cont.add(bg);
    cont.add(this.add.text(GAME_WIDTH / 2, 40, 'SHOP', { fontSize: '24px', color: '#ffd700', fontFamily: 'monospace' }).setOrigin(0.5));
    cont.add(this.add.text(GAME_WIDTH / 2, 70, `Gold: ${this.gold}`, { fontSize: '16px', color: '#ffd700', fontFamily: 'monospace' }).setOrigin(0.5));

    // Pick 4 random items
    const items = Phaser.Utils.Array.Shuffle([...SHOP_ITEMS]).slice(0, 4);
    const goldRef = { value: this.gold };

    items.forEach((item, i) => {
      const x = GAME_WIDTH / 2 + (i - 1.5) * 170;
      const y = 200;
      const btn = this.add.rectangle(x, y, 150, 140, 0x333355, 1).setInteractive({ useHandCursor: true });
      cont.add(btn);
      cont.add(this.add.text(x, y - 45, item.name, { fontSize: '12px', color: '#ffffff', fontFamily: 'monospace', wordWrap: { width: 140 } }).setOrigin(0.5));
      cont.add(this.add.text(x, y, this.getShopItemDesc(item), { fontSize: '10px', color: '#aaaaaa', fontFamily: 'monospace', wordWrap: { width: 130 } }).setOrigin(0.5));
      cont.add(this.add.text(x, y + 45, `${item.cost}g`, { fontSize: '14px', color: '#ffd700', fontFamily: 'monospace' }).setOrigin(0.5));

      btn.on('pointerdown', () => {
        if (goldRef.value >= item.cost) {
          goldRef.value -= item.cost;
          this.gold = goldRef.value;
          this.applyShopItem(item);
          btn.setFillStyle(0x224422, 1);
          btn.removeInteractive();
          // Update gold display
          (cont.getAt(2) as Phaser.GameObjects.Text).setText(`Gold: ${this.gold}`);
        }
      });
    });

    const doneBtn = this.add.rectangle(GAME_WIDTH / 2, 400, 160, 40, COLORS.player, 0.9)
      .setInteractive({ useHandCursor: true });
    cont.add(doneBtn);
    cont.add(this.add.text(GAME_WIDTH / 2, 400, 'DONE', { fontSize: '16px', color: '#1a1a2e', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5));
    doneBtn.on('pointerdown', () => {
      cont.destroy();
      this.shopActive = false;
      this.showUpgradeDraft();
    });
  }

  private getShopItemDesc(item: ShopItemDef): string {
    switch (item.effect) {
      case 'heal': return `Heal ${item.value} HP`;
      case 'mana': return `Restore ${item.value} MP`;
      case 'dmgBuff': return `+${item.value * 100}% dmg 60s`;
      case 'armorBuff': return `+${item.value} armor 60s`;
      case 'weaponDmg': return `Weapon +${item.value} dmg`;
      case 'weaponSpeed': return `Weapon +${item.value * 100}% spd`;
      case 'weaponRange': return `Weapon +${item.value * 100}% range`;
      default: return '';
    }
  }

  private applyShopItem(item: ShopItemDef) {
    const now = this.time.now;
    switch (item.effect) {
      case 'heal':
        this.stats.hp = Math.min(this.stats.hp + item.value, this.stats.maxHp);
        break;
      case 'mana':
        this.stats.mp = Math.min(this.stats.mp + item.value, this.stats.maxMp);
        break;
      case 'dmgBuff':
        this.dmgBuffUntil = now + 60000;
        this.dmgBuffValue = item.value;
        break;
      case 'armorBuff':
        this.armorBuffUntil = now + 60000;
        this.armorBuffValue = item.value;
        break;
      case 'weaponDmg':
        this.weapon.damage += item.value;
        break;
      case 'weaponSpeed':
        this.weapon.cooldown = Math.max(100, this.weapon.cooldown * (1 - item.value));
        break;
      case 'weaponRange':
        this.weapon.range *= (1 + item.value);
        break;
    }
  }

  // ───── UPGRADE DRAFT ─────
  private showUpgradeDraft() {
    this.upgradeActive = true;
    const cont = this.add.container(0, 0).setDepth(100);
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85);
    cont.add(bg);
    cont.add(this.add.text(GAME_WIDTH / 2, 60, 'CHOOSE AN UPGRADE', { fontSize: '22px', color: '#aa44ff', fontFamily: 'monospace' }).setOrigin(0.5));

    // Pick 3 random upgrades (weighted)
    const available = UPGRADES.filter(u => (this.upgradeStacks[u.name] || 0) < u.maxStacks);
    const weighted: UpgradeDef[] = [];
    for (const u of available) {
      const w = u.rarity === 'common' ? 4 : 1;
      for (let i = 0; i < w; i++) weighted.push(u);
    }
    Phaser.Utils.Array.Shuffle(weighted);
    const seen = new Set<string>();
    const picks: UpgradeDef[] = [];
    for (const u of weighted) {
      if (!seen.has(u.name)) {
        seen.add(u.name);
        picks.push(u);
        if (picks.length >= 3) break;
      }
    }

    picks.forEach((upg, i) => {
      const x = GAME_WIDTH / 2 + (i - 1) * 220;
      const y = 230;
      const rColor = upg.rarity === 'rare' ? 0x9944ff : 0x44aaff;
      const btn = this.add.rectangle(x, y, 190, 120, 0x333355, 1)
        .setStrokeStyle(2, rColor)
        .setInteractive({ useHandCursor: true });
      cont.add(btn);
      cont.add(this.add.text(x, y - 30, upg.name, { fontSize: '14px', color: '#ffffff', fontFamily: 'monospace' }).setOrigin(0.5));
      cont.add(this.add.text(x, y, upg.description, { fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace' }).setOrigin(0.5));
      const stacks = this.upgradeStacks[upg.name] || 0;
      cont.add(this.add.text(x, y + 25, `[${stacks}/${upg.maxStacks}]`, { fontSize: '11px', color: '#666666', fontFamily: 'monospace' }).setOrigin(0.5));
      cont.add(this.add.text(x, y + 42, upg.rarity.toUpperCase(), { fontSize: '10px', color: `#${rColor.toString(16)}`, fontFamily: 'monospace' }).setOrigin(0.5));

      btn.on('pointerdown', () => {
        this.applyUpgrade(upg);
        cont.destroy();
        this.upgradeActive = false;
        if (this.wave >= 30) {
          this.completeStage();
        } else {
          this.time.delayedCall(500, () => this.startWave());
        }
      });
    });

    if (picks.length === 0) {
      cont.add(this.add.text(GAME_WIDTH / 2, 230, 'All upgrades maxed!', { fontSize: '16px', color: '#aaaaaa', fontFamily: 'monospace' }).setOrigin(0.5));
      const skipBtn = this.add.rectangle(GAME_WIDTH / 2, 350, 160, 40, COLORS.player, 0.9)
        .setInteractive({ useHandCursor: true });
      cont.add(skipBtn);
      cont.add(this.add.text(GAME_WIDTH / 2, 350, 'CONTINUE', { fontSize: '16px', color: '#1a1a2e', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5));
      skipBtn.on('pointerdown', () => {
        cont.destroy();
        this.upgradeActive = false;
        if (this.wave >= 30) this.completeStage();
        else this.time.delayedCall(500, () => this.startWave());
      });
    }
  }

  private applyUpgrade(upg: UpgradeDef) {
    this.upgradeStacks[upg.name] = (this.upgradeStacks[upg.name] || 0) + 1;
    const s = this.stats;
    switch (upg.stat) {
      case 'extraProjectiles': s.extraProjectiles += upg.value; break;
      case 'atkSpeedMult': s.atkSpeedMult += upg.value; break;
      case 'dmgMult': s.dmgMult += upg.value; break;
      case 'speed': s.speed += upg.value; break;
      case 'lifesteal': s.lifesteal += upg.value; break;
      case 'armor': s.armor += upg.value; break;
      case 'hpRegen': s.hpRegen += upg.value; break;
      case 'maxHp': s.maxHp += upg.value; s.hp = Math.min(s.hp + upg.value, s.maxHp); break;
      case 'mpRegen': s.mpRegen += upg.value; break;
      case 'maxMp': s.maxMp += upg.value; s.mp = Math.min(s.mp + upg.value, s.maxMp); break;
      case 'critMult': s.critMult += upg.value; break;
      case 'critChance': s.critChance += upg.value; break;
    }
  }

  // ───── COMBAT ─────
  private autoAttack(time: number) {
    const effectiveCooldown = this.weapon.cooldown / this.stats.atkSpeedMult;
    if (time - this.lastAttackTime < effectiveCooldown) return;

    // Find nearest enemy
    let nearest: EnemySprite | null = null;
    let nearestDist = Infinity;
    const effectiveRange = this.weapon.range * this.stats.rangeMult;

    this.enemies.getChildren().forEach((e) => {
      const enemy = e as EnemySprite;
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    });

    if (!nearest) return;

    // Glacier buff
    let bonusDmg = 0;
    let bonusAtkSpeed = 0;
    let bonusRange = 0;
    if (this.activeGlacier && this.time.now < this.activeGlacier.until) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.activeGlacier.x, this.activeGlacier.y);
      if (dist < this.activeGlacier.radius) {
        bonusDmg = this.skill.extras?.dmgBonus || 0;
        bonusAtkSpeed = this.skill.extras?.atkSpeedBonus || 0;
        bonusRange = this.skill.extras?.rangeBonus || 0;
      }
    }

    const totalRange = effectiveRange * (1 + bonusRange);

    if (this.weapon.type === 'melee') {
      if (nearestDist <= totalRange + 20) {
        this.lastAttackTime = time;
        this.meleeAttack(nearest, bonusDmg);
      }
    } else {
      if (nearestDist <= totalRange + 50) {
        this.lastAttackTime = time;
        this.rangedAttack(nearest, bonusDmg);
      }
    }
  }

  private calcDamage(baseDmg: number, bonusDmg: number): { damage: number; crit: boolean } {
    let dmg = baseDmg * this.stats.dmgMult * (1 + bonusDmg);
    if (this.time.now < this.dmgBuffUntil) dmg *= (1 + this.dmgBuffValue);
    const crit = Math.random() < this.stats.critChance;
    if (crit) dmg *= this.stats.critMult;
    return { damage: Math.floor(dmg), crit };
  }

  private meleeAttack(target: EnemySprite, bonusDmg: number) {
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
    const arcRad = Phaser.Math.DegToRad(this.weapon.arc || 60);

    // VFX
    const arc = this.add.sprite(this.player.x, this.player.y, 'sword_arc')
      .setRotation(angle)
      .setAlpha(0.6)
      .setTint(COLORS.player)
      .setDepth(15);
    this.tweens.add({ targets: arc, alpha: 0, scaleX: 1.3, scaleY: 1.3, duration: 200, onComplete: () => arc.destroy() });

    // Hit enemies in arc
    const totalProjectiles = 1 + this.stats.extraProjectiles;
    this.enemies.getChildren().forEach((e) => {
      const enemy = e as EnemySprite;
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      const eAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(eAngle - angle));
      const effectiveRange = this.weapon.range * this.stats.rangeMult;
      if (dist <= effectiveRange + enemy.enemyData.def.size && angleDiff <= arcRad / 2) {
        for (let p = 0; p < totalProjectiles; p++) {
          const { damage, crit } = this.calcDamage(this.weapon.damage, bonusDmg);
          this.damageEnemy(enemy, damage, crit);
        }
      }
    });
  }

  private rangedAttack(target: EnemySprite, bonusDmg: number) {
    const totalProjectiles = 1 + this.stats.extraProjectiles;
    const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
    const spread = Phaser.Math.DegToRad(10);

    for (let i = 0; i < totalProjectiles; i++) {
      const angle = totalProjectiles === 1 ? baseAngle : baseAngle + (i - (totalProjectiles - 1) / 2) * spread;
      const { damage, crit } = this.calcDamage(this.weapon.damage, bonusDmg);
      this.fireProjectile(
        this.player.x, this.player.y, angle,
        this.weapon.speed || 350, damage, crit,
        this.weapon.piercing || false, 'player',
        this.weapon.range * this.stats.rangeMult,
        this.weaponKey === 'shuriken' ? 'shuriken' : 'arrow'
      );
    }
  }

  private fireProjectile(
    x: number, y: number, angle: number, speed: number,
    damage: number, _crit: boolean, piercing: boolean,
    owner: 'player' | 'enemy', range: number, texKey: string
  ) {
    const proj = this.physics.add.sprite(x, y, texKey) as Projectile;
    proj.setDepth(12);
    proj.projData = { damage, piercing, owner, range, startX: x, startY: y, hitSet: new Set() };
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    proj.setVelocity(vx, vy);
    proj.setRotation(angle);

    if (owner === 'player') this.playerProjectiles.add(proj);
    else this.enemyProjectiles.add(proj);
  }

  private damageEnemy(enemy: EnemySprite, damage: number, crit: boolean) {
    enemy.enemyData.hp -= damage;
    this.spawnDamageNumber(enemy.x, enemy.y - enemy.enemyData.def.size, damage, crit);

    // Hit flash
    enemy.setTint(0xffffff);
    this.time.delayedCall(80, () => { if (enemy.active) enemy.clearTint(); });

    // Lifesteal
    if (this.stats.lifesteal > 0) {
      const heal = Math.floor(damage * this.stats.lifesteal);
      if (heal > 0) this.stats.hp = Math.min(this.stats.hp + heal, this.stats.maxHp);
    }

    if (enemy.enemyData.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  private killEnemy(enemy: EnemySprite) {
    // Drop pickups
    const goldVal = enemy.enemyData.isBoss ? 20 : Phaser.Math.Between(1, 5);
    this.spawnPickup(enemy.x, enemy.y, 'gold', goldVal);
    if (Math.random() < 0.15) this.spawnPickup(enemy.x + 10, enemy.y, 'hp', 10);

    // XP
    const xpVal = enemy.enemyData.isBoss ? 50 : 10;
    this.xp += xpVal;
    this.heroXp += xpVal;

    // Check hero level up
    while (this.heroXp >= heroXpForLevel(this.saveData.heroLevel)) {
      this.heroXp -= heroXpForLevel(this.saveData.heroLevel);
      this.saveData.heroLevel++;
      this.showCenterMessage('HERO LEVEL UP!', 2000);
    }
    this.saveData.heroXp = this.heroXp;

    enemy.enemyData.hpBar.destroy();
    enemy.destroy();
    this.kills++;
    this.waveEnemiesLeft--;

    if (this.waveEnemiesLeft <= 0 && this.waveActive) {
      this.onWaveComplete();
    }
  }

  private spawnPickup(x: number, y: number, type: 'gold' | 'essence' | 'hp', value: number) {
    const texKey = `pickup_${type}`;
    const p = this.physics.add.sprite(x, y, texKey) as Pickup;
    p.pickupData = { type, value };
    p.setDepth(5);
    this.pickups.add(p);
    // Little bounce
    this.tweens.add({
      targets: p,
      y: y - 15,
      duration: 200,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  private spawnDamageNumber(x: number, y: number, damage: number, crit: boolean) {
    const color = crit ? '#ffff00' : '#ffffff';
    const size = crit ? '16px' : '12px';
    const text = this.add.text(x, y, `${damage}`, {
      fontSize: size, color, fontFamily: 'monospace', fontStyle: crit ? 'bold' : 'normal',
    }).setOrigin(0.5).setDepth(30);
    this.damageNumbers.push({ text, vy: -60, life: 800 });
  }

  // ───── SKILL ─────
  private useSkill() {
    if (this.isDead || this.paused || this.loadoutActive || this.shopActive || this.upgradeActive || this.overlayActive) return;
    const now = this.time.now;
    if (now - this.lastSkillTime < this.skill.cooldown) return;
    if (this.stats.mp < this.skill.mpCost) return;

    this.stats.mp -= this.skill.mpCost;
    this.lastSkillTime = now;
    this.skillCDStart = now;

    switch (this.skill.type) {
      case 'aoe_burst': this.useEpicenter(); break;
      case 'buff_zone': this.useGlacier(); break;
      case 'meteor': this.useVolcano(); break;
    }
  }

  private useEpicenter() {
    const radius = this.skill.radius;
    const ring = this.add.sprite(this.player.x, this.player.y, 'epicenter_ring')
      .setScale(0.1).setAlpha(0.8).setDepth(15).setTint(COLORS.epicenter);
    this.tweens.add({
      targets: ring, scaleX: 1, scaleY: 1, alpha: 0,
      duration: 400, onComplete: () => ring.destroy(),
    });

    this.enemies.getChildren().forEach((e) => {
      const enemy = e as EnemySprite;
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist <= radius) {
        const { damage, crit } = this.calcDamage(this.weapon.damage * this.skill.dmgMult, 0);
        this.damageEnemy(enemy, damage, crit);
        // Slow
        enemy.enemyData.slowUntil = this.time.now + (this.skill.extras?.slowDuration || 3000);
      }
    });
  }

  private useGlacier() {
    if (this.activeGlacier) {
      this.activeGlacier.gfx.destroy();
    }
    const gfx = this.add.sprite(this.player.x, this.player.y, 'glacier_zone')
      .setAlpha(0.4).setDepth(3).setTint(COLORS.glacier);
    this.activeGlacier = {
      x: this.player.x, y: this.player.y,
      radius: this.skill.radius,
      until: this.time.now + (this.skill.duration || 6000),
      gfx,
    };
  }

  private useVolcano() {
    const strikes = this.skill.extras?.strikes || 6;
    for (let i = 0; i < strikes; i++) {
      this.time.delayedCall(i * 250, () => {
        const x = Phaser.Math.Between(ARENA_PAD + 50, GAME_WIDTH - ARENA_PAD - 50);
        const y = Phaser.Math.Between(ARENA_PAD + 50, GAME_HEIGHT - ARENA_PAD - 50);

        // Warning indicator
        const warn = this.add.circle(x, y, this.skill.radius, COLORS.volcano, 0.2).setDepth(14);
        this.time.delayedCall(400, () => {
          warn.destroy();
          // Meteor impact
          const meteor = this.add.sprite(x, y, 'meteor').setScale(0.5).setAlpha(0.9).setDepth(15).setTint(COLORS.volcano);
          this.tweens.add({
            targets: meteor, scaleX: 2, scaleY: 2, alpha: 0,
            duration: 300, onComplete: () => meteor.destroy(),
          });

          this.enemies.getChildren().forEach((e) => {
            const enemy = e as EnemySprite;
            if (!enemy.active) return;
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist <= this.skill.radius) {
              const { damage, crit } = this.calcDamage(this.weapon.damage * this.skill.dmgMult, 0);
              this.damageEnemy(enemy, damage, crit);
            }
          });
        });
      });
    }
  }

  // ───── ENEMY AI ─────
  private updateEnemyAI(enemy: EnemySprite, time: number, dt: number) {
    if (!enemy.active) return;
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    const def = enemy.enemyData.def;
    let speed = enemy.enemyData.speed;

    // Slow effect
    if (time < enemy.enemyData.slowUntil) {
      speed *= 0.5;
    }

    const dx = this.player.x - enemy.x;
    const dy = this.player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (enemy.enemyData.isBoss) {
      this.updateBossAI(enemy, time, dist, dx, dy, speed);
      return;
    }

    const behavior = (def as EnemyDef).behavior;
    switch (behavior) {
      case 'grunt':
        body.setVelocity((dx / dist) * speed, (dy / dist) * speed);
        break;

      case 'ranger': {
        const eDef = def as EnemyDef;
        if (dist < 120) {
          // Back away
          body.setVelocity((-dx / dist) * speed, (-dy / dist) * speed);
        } else if (dist < 200) {
          // Strafe
          body.setVelocity((-dy / dist) * speed * 0.7, (dx / dist) * speed * 0.7);
        } else {
          // Approach
          body.setVelocity((dx / dist) * speed, (dy / dist) * speed);
        }
        // Shoot
        if (time - enemy.enemyData.lastAttack > (eDef.attackCooldown || 1500) && dist < (eDef.range || 250)) {
          enemy.enemyData.lastAttack = time;
          const angle = Math.atan2(dy, dx);
          this.fireProjectile(enemy.x, enemy.y, angle, eDef.projectileSpeed || 200, enemy.enemyData.damage, false, false, 'enemy', 400, 'projectile_enemy');
        }
        break;
      }

      case 'charger': {
        if (enemy.enemyData.isCharging) {
          enemy.enemyData.chargeDuration -= dt;
          if (enemy.enemyData.chargeDuration <= 0) {
            enemy.enemyData.isCharging = false;
          }
          // Already moving fast from charge start
        } else if (dist < 200 && time - enemy.enemyData.chargeCD > 3000) {
          // Start charge
          enemy.enemyData.isCharging = true;
          enemy.enemyData.chargeDuration = 800;
          enemy.enemyData.chargeCD = time;
          const chargeSpeed = speed * 2.5 / 0.6;
          body.setVelocity((dx / dist) * chargeSpeed, (dy / dist) * chargeSpeed);
          enemy.setTint(0xff8800);
          this.time.delayedCall(800, () => { if (enemy.active) enemy.clearTint(); });
        } else {
          body.setVelocity((dx / dist) * speed * 0.6, (dy / dist) * speed * 0.6);
        }
        break;
      }
    }
  }

  private updateBossAI(enemy: EnemySprite, time: number, dist: number, dx: number, dy: number, speed: number) {
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    const bossDef = enemy.enemyData.def as BossDef;

    // Phase 2 check
    if (!enemy.enemyData.phase2 && enemy.enemyData.hp <= enemy.enemyData.maxHp * 0.5) {
      enemy.enemyData.phase2 = true;
      this.showCenterMessage('BOSS ENRAGED!', 1500);
      enemy.setTint(0xff4444);
    }

    // Movement: approach/back off
    if (dist > 200) {
      body.setVelocity((dx / dist) * speed, (dy / dist) * speed);
    } else if (dist < 100) {
      body.setVelocity((-dx / dist) * speed * 0.8, (-dy / dist) * speed * 0.8);
    } else {
      body.setVelocity((-dy / dist) * speed * 0.5, (dx / dist) * speed * 0.5);
    }

    // Aimed projectiles
    if (time - enemy.enemyData.lastAttack > 2000) {
      enemy.enemyData.lastAttack = time;
      const angle = Math.atan2(dy, dx);
      for (let i = 0; i < bossDef.projectileCount; i++) {
        const spread = Phaser.Math.DegToRad(15) * (i - (bossDef.projectileCount - 1) / 2);
        this.fireProjectile(enemy.x, enemy.y, angle + spread, 220, enemy.enemyData.damage, false, false, 'enemy', 500, 'projectile_enemy');
      }

      // Phase 2: radial burst
      if (enemy.enemyData.phase2) {
        this.time.delayedCall(500, () => {
          if (!enemy.active) return;
          for (let i = 0; i < bossDef.burstCount; i++) {
            const a = (Math.PI * 2 / bossDef.burstCount) * i;
            this.fireProjectile(enemy.x, enemy.y, a, 180, enemy.enemyData.damage * 0.7, false, false, 'enemy', 400, 'projectile_enemy');
          }
        });
      }
    }

    // Dash attack occasionally
    if (dist < 250 && dist > 80 && time - enemy.enemyData.chargeCD > 5000) {
      enemy.enemyData.chargeCD = time;
      const dashSpeed = speed * 3;
      body.setVelocity((dx / dist) * dashSpeed, (dy / dist) * dashSpeed);
      this.time.delayedCall(600, () => { if (enemy.active) body.setVelocity(0, 0); });
    }
  }

  // ───── COLLISIONS ─────
  private onPlayerProjHitEnemy(_projGO: Phaser.GameObjects.GameObject, _enemyGO: Phaser.GameObjects.GameObject) {
    const proj = _projGO as Projectile;
    const enemy = _enemyGO as EnemySprite;
    if (!proj.active || !enemy.active) return;
    if (proj.projData.hitSet.has(enemy.body!.gameObject.scene.sys.settings.key === 'GameScene' ? enemy.y * 10000 + enemy.x : 0)) return;

    // Use a unique ID based on position (simple approach)
    const enemyId = enemy.x * 10000 + enemy.y;
    if (proj.projData.hitSet.has(enemyId)) return;
    proj.projData.hitSet.add(enemyId);

    this.damageEnemy(enemy, proj.projData.damage, false);
    if (!proj.projData.piercing) {
      proj.destroy();
    }
  }

  private onEnemyProjHitPlayer(_playerGO: Phaser.GameObjects.GameObject, _projGO: Phaser.GameObjects.GameObject) {
    const proj = _projGO as Projectile;
    if (!proj.active) return;
    this.damagePlayer(proj.projData.damage);
    proj.destroy();
  }

  private onPlayerTouchEnemy(_playerGO: Phaser.GameObjects.GameObject, _enemyGO: Phaser.GameObjects.GameObject) {
    const enemy = _enemyGO as EnemySprite;
    if (!enemy.active) return;
    // Contact damage with cooldown (use lastAttack for contact too)
    const now = this.time.now;
    if (now - (enemy.enemyData as any).lastContactDmg > 500) {
      (enemy.enemyData as any).lastContactDmg = now;
      this.damagePlayer(enemy.enemyData.damage);
    }
  }

  private onPlayerPickup(_playerGO: Phaser.GameObjects.GameObject, _pickupGO: Phaser.GameObjects.GameObject) {
    const pickup = _pickupGO as Pickup;
    if (!pickup.active) return;
    switch (pickup.pickupData.type) {
      case 'gold': this.gold += pickup.pickupData.value; break;
      case 'essence': this.essence += pickup.pickupData.value; break;
      case 'hp':
        this.stats.hp = Math.min(this.stats.hp + pickup.pickupData.value, this.stats.maxHp);
        break;
    }
    pickup.destroy();
  }

  private damagePlayer(rawDmg: number) {
    let armor = this.stats.armor;
    if (this.time.now < this.armorBuffUntil) armor += this.armorBuffValue;
    const dmg = Math.max(1, rawDmg - armor);
    this.stats.hp -= dmg;
    this.spawnDamageNumber(this.player.x, this.player.y - 20, dmg, false);
    this.player.setTint(0xff4444);
    this.time.delayedCall(100, () => { if (this.player.active) this.player.setTint(COLORS.player); });

    if (this.stats.hp <= 0) {
      this.stats.hp = 0;
      this.gameOver(false);
    }
  }

  // ───── GAME OVER ─────
  private gameOver(victory: boolean) {
    if (this.isDead) return;
    this.isDead = true;
    this.waveActive = false;

    // Bank gold/essence
    this.saveData.goldBank += this.gold;
    this.saveData.essenceBank += this.essence;
    if (this.stage > this.saveData.bestStage || (this.stage === this.saveData.bestStage && this.wave > 0)) {
      this.saveData.bestStage = this.stage;
    }
    this.saveData.heroXp = this.heroXp;
    saveSave(this.saveData);

    this.scene.start('GameOverScene', {
      victory, stage: this.stage, wave: this.wave,
      gold: this.gold, essence: this.essence, kills: this.kills,
    });
  }

  // ───── UI ─────
  private createUI() {
    this.uiContainer = this.add.container(0, 0).setDepth(50).setScrollFactor(0);

    // HP bar
    this.hpBar = this.add.graphics().setDepth(51);
    this.mpBar = this.add.graphics().setDepth(51);
    this.skillCdBar = this.add.graphics().setDepth(51);
    this.xpBar = this.add.graphics().setDepth(51);

    // Stage/wave text
    this.stageText = this.add.text(GAME_WIDTH - 10, 10, '', {
      fontSize: '13px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(52);

    this.goldText = this.add.text(GAME_WIDTH - 10, 30, '', {
      fontSize: '12px', color: '#ffd700', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(52);

    // Center message
    this.centerMsg = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, '', {
      fontSize: '24px', color: '#4ecdc4', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(60).setAlpha(0);

    // Overlay
    this.overlayBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setDepth(80).setVisible(false);
    this.overlayContainer = this.add.container(0, 0).setDepth(81).setVisible(false);

    // Pause overlay
    this.pauseOverlay = this.add.container(0, 0).setDepth(90).setVisible(false);
  }

  private createPauseOverlay() {
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'PAUSED\n\nESC to resume', {
      fontSize: '28px', color: '#4ecdc4', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5);
    this.pauseOverlay.add([bg, txt]);
  }

  private updateUI() {
    const s = this.stats;

    // HP bar
    this.hpBar.clear();
    const hpPct = s.hp / s.maxHp;
    const hpColor = hpPct > 0.5 ? COLORS.hpGreen : hpPct > 0.25 ? COLORS.hpOrange : COLORS.hpRed;
    this.hpBar.fillStyle(0x333333, 0.8);
    this.hpBar.fillRect(10, 10, 150, 14);
    this.hpBar.fillStyle(hpColor, 1);
    this.hpBar.fillRect(10, 10, 150 * hpPct, 14);
    this.hpBar.lineStyle(1, 0x666666, 1);
    this.hpBar.strokeRect(10, 10, 150, 14);

    // MP bar
    this.mpBar.clear();
    const mpPct = s.mp / s.maxMp;
    this.mpBar.fillStyle(0x333333, 0.8);
    this.mpBar.fillRect(10, 28, 150, 10);
    this.mpBar.fillStyle(COLORS.mpBlue, 1);
    this.mpBar.fillRect(10, 28, 150 * mpPct, 10);
    this.mpBar.lineStyle(1, 0x666666, 1);
    this.mpBar.strokeRect(10, 28, 150, 10);

    // Skill CD bar
    this.skillCdBar.clear();
    if (this.skill) {
      const cdElapsed = this.time.now - this.skillCDStart;
      const cdPct = Math.min(1, cdElapsed / this.skill.cooldown);
      this.skillCdBar.fillStyle(0x333333, 0.8);
      this.skillCdBar.fillRect(10, 42, 100, 8);
      this.skillCdBar.fillStyle(COLORS.epicenter, 1);
      this.skillCdBar.fillRect(10, 42, 100 * cdPct, 8);
    }

    // XP bar (bottom)
    this.xpBar.clear();
    const xpNeeded = heroXpForLevel(this.saveData.heroLevel);
    const xpPct = Math.min(1, this.heroXp / xpNeeded);
    this.xpBar.fillStyle(0x222222, 0.8);
    this.xpBar.fillRect(0, GAME_HEIGHT - 6, GAME_WIDTH, 6);
    this.xpBar.fillStyle(COLORS.xpPurple, 1);
    this.xpBar.fillRect(0, GAME_HEIGHT - 6, GAME_WIDTH * xpPct, 6);

    // Texts
    this.stageText.setText(`Stage ${this.stage + 1} | Wave ${this.wave}/30`);
    this.goldText.setText(`Gold: ${this.gold} | Essence: ${this.essence}`);
  }

  private showCenterMessage(msg: string, duration: number) {
    this.centerMsg.setText(msg).setAlpha(1);
    if (this.centerMsgTimer) this.centerMsgTimer.destroy();
    this.centerMsgTimer = this.time.delayedCall(duration, () => {
      this.tweens.add({ targets: this.centerMsg, alpha: 0, duration: 300 });
    });
  }

  // ───── PANELS ─────
  private togglePanel(panel: string) {
    if (this.overlayActive && this.currentPanel === panel) {
      this.closePanel();
      return;
    }
    this.closePanel();
    this.overlayActive = true;
    this.currentPanel = panel;
    this.overlayBg.setVisible(true);
    this.overlayContainer.setVisible(true);
    this.overlayContainer.removeAll(true);

    const style = { fontSize: '14px', color: '#ffffff', fontFamily: 'monospace' };
    const header = { fontSize: '20px', color: '#4ecdc4', fontFamily: 'monospace' };

    switch (panel) {
      case 'inventory': {
        this.overlayContainer.add(this.add.text(GAME_WIDTH / 2, 40, 'INVENTORY', header).setOrigin(0.5));
        this.overlayContainer.add(this.add.text(GAME_WIDTH / 2, 80, `Weapon: ${this.weapon?.name || 'None'}`, style).setOrigin(0.5));
        this.overlayContainer.add(this.add.text(GAME_WIDTH / 2, 100, `Skill: ${this.skill?.name || 'None'}`, style).setOrigin(0.5));
        this.overlayContainer.add(this.add.text(GAME_WIDTH / 2, 130, `Gold: ${this.gold}  |  Essence: ${this.essence}`, style).setOrigin(0.5));
        break;
      }
      case 'powerups': {
        this.overlayContainer.add(this.add.text(GAME_WIDTH / 2, 40, 'POWERUPS', header).setOrigin(0.5));
        let y = 80;
        for (const [name, stacks] of Object.entries(this.upgradeStacks)) {
          this.overlayContainer.add(this.add.text(GAME_WIDTH / 2, y, `${name}: x${stacks}`, style).setOrigin(0.5));
          y += 22;
        }
        if (Object.keys(this.upgradeStacks).length === 0) {
          this.overlayContainer.add(this.add.text(GAME_WIDTH / 2, y, 'No upgrades yet', style).setOrigin(0.5));
        }
        break;
      }
      case 'settings': {
        this.overlayContainer.add(this.add.text(GAME_WIDTH / 2, 40, 'SETTINGS', header).setOrigin(0.5));
        this.overlayContainer.add(this.add.text(GAME_WIDTH / 2, 100, 'Press O to close', style).setOrigin(0.5));
        break;
      }
      case 'help': {
        this.overlayContainer.add(this.add.text(GAME_WIDTH / 2, 40, 'HELP', header).setOrigin(0.5));
        const lines = [
          'WASD: Move', 'Auto-attack nearest enemy', 'Right-Click: Use skill',
          'ESC: Pause/Resume', 'I: Inventory', 'P: Powerups',
          'O: Settings', 'H: Help', 'R: Restart (when dead)',
        ];
        lines.forEach((l, i) => {
          this.overlayContainer.add(this.add.text(GAME_WIDTH / 2, 80 + i * 22, l, style).setOrigin(0.5));
        });
        break;
      }
    }
  }

  private closePanel() {
    this.overlayActive = false;
    this.currentPanel = '';
    this.overlayBg.setVisible(false);
    this.overlayContainer.setVisible(false);
    this.overlayContainer.removeAll(true);
  }

  // ───── UPDATE ─────
  update(time: number, delta: number) {
    if (this.loadoutActive || this.shopActive || this.upgradeActive) return;

    // Key handling (panels, pause)
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      if (this.overlayActive) {
        this.closePanel();
      } else {
        this.paused = !this.paused;
        this.pauseOverlay.setVisible(this.paused);
        this.physics.world.isPaused = this.paused;
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.I)) this.togglePanel('inventory');
    if (Phaser.Input.Keyboard.JustDown(this.keys.P)) this.togglePanel('powerups');
    if (Phaser.Input.Keyboard.JustDown(this.keys.O)) this.togglePanel('settings');
    if (Phaser.Input.Keyboard.JustDown(this.keys.H)) this.togglePanel('help');
    if (Phaser.Input.Keyboard.JustDown(this.keys.R) && this.isDead) {
      this.scene.restart();
    }

    if (this.paused || this.isDead || this.overlayActive) {
      this.updateUI();
      return;
    }

    const dt = delta / 1000;

    // Movement
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    let vx = 0, vy = 0;
    if (this.keys.A.isDown) vx -= 1;
    if (this.keys.D.isDown) vx += 1;
    if (this.keys.W.isDown) vy -= 1;
    if (this.keys.S.isDown) vy += 1;
    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      vx /= len; vy /= len;
    }
    body.setVelocity(vx * this.stats.speed, vy * this.stats.speed);

    // Regen
    this.hpRegenAccum += this.stats.hpRegen * dt;
    if (this.hpRegenAccum >= 1) {
      const heal = Math.floor(this.hpRegenAccum);
      this.stats.hp = Math.min(this.stats.hp + heal, this.stats.maxHp);
      this.hpRegenAccum -= heal;
    }
    this.mpRegenAccum += this.stats.mpRegen * dt;
    if (this.mpRegenAccum >= 1) {
      const restore = Math.floor(this.mpRegenAccum);
      this.stats.mp = Math.min(this.stats.mp + restore, this.stats.maxMp);
      this.mpRegenAccum -= restore;
    }

    // Auto attack
    if (this.weapon && this.waveActive) {
      this.autoAttack(time);
    }

    // Enemy AI
    this.enemies.getChildren().forEach((e) => {
      this.updateEnemyAI(e as EnemySprite, time, delta);
    });

    // Update enemy HP bars
    this.enemies.getChildren().forEach((e) => {
      const enemy = e as EnemySprite;
      if (!enemy.active) return;
      const bar = enemy.enemyData.hpBar;
      bar.clear();
      const w = enemy.enemyData.def.size * 2;
      const pct = enemy.enemyData.hp / enemy.enemyData.maxHp;
      bar.fillStyle(0x333333, 0.8);
      bar.fillRect(enemy.x - w / 2, enemy.y - enemy.enemyData.def.size - 8, w, 4);
      bar.fillStyle(enemy.enemyData.isBoss ? COLORS.boss : COLORS.enemy, 1);
      bar.fillRect(enemy.x - w / 2, enemy.y - enemy.enemyData.def.size - 8, w * pct, 4);
    });

    // Update projectiles (range check + out of bounds)
    const destroyList: Phaser.GameObjects.GameObject[] = [];
    [this.playerProjectiles, this.enemyProjectiles].forEach((group) => {
      group.getChildren().forEach((p) => {
        const proj = p as Projectile;
        if (!proj.active) return;
        const dist = Phaser.Math.Distance.Between(proj.projData.startX, proj.projData.startY, proj.x, proj.y);
        if (dist > proj.projData.range + 50 ||
          proj.x < ARENA_PAD || proj.x > GAME_WIDTH - ARENA_PAD ||
          proj.y < ARENA_PAD || proj.y > GAME_HEIGHT - ARENA_PAD) {
          destroyList.push(proj);
        }
      });
    });
    destroyList.forEach(p => p.destroy());

    // Pickup attraction
    this.pickups.getChildren().forEach((p) => {
      const pickup = p as Pickup;
      if (!pickup.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, pickup.x, pickup.y);
      if (dist < PICKUP_ATTRACT) {
        const angle = Phaser.Math.Angle.Between(pickup.x, pickup.y, this.player.x, this.player.y);
        const speed = 200;
        (pickup.body as Phaser.Physics.Arcade.Body).setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      }
    });

    // Glacier cleanup
    if (this.activeGlacier && time > this.activeGlacier.until) {
      this.activeGlacier.gfx.destroy();
      this.activeGlacier = null;
    }

    // Damage numbers
    this.damageNumbers = this.damageNumbers.filter((dn) => {
      dn.life -= delta;
      dn.text.y += dn.vy * dt;
      dn.text.setAlpha(Math.max(0, dn.life / 800));
      if (dn.life <= 0) { dn.text.destroy(); return false; }
      return true;
    });

    this.updateUI();
  }
}
