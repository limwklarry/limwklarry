import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { CombatSystem } from '../systems/CombatSystem';
import { InputSystem } from '../systems/JoystickSystem';
import {
  WEAPONS, SKILLS, UPGRADES, SHOP_ITEMS,
  ENEMIES_BY_CHAPTER, BOSSES,
  WAVES_PER_STAGE, BOSS_WAVE_INTERVAL,
  getXpForLevel, getEnemyCountForWave,
  GAME_WIDTH, GAME_HEIGHT, UpgradeEffect,
} from '../data/GameData';
import { SaveManager } from '../utils/SaveManager';
import {
  HUD, LoadoutOverlay, UpgradeDraftOverlay,
  ShopOverlay, PanelOverlay, CenterMessage, PauseBanner,
} from '../ui/HUD';

type GamePhase = 'loadout' | 'playing' | 'shop' | 'upgrade' | 'paused' | 'dead' | 'panel';

export class GameScene extends Phaser.Scene {
  player!: Player;
  enemies: Enemy[] = [];
  combat!: CombatSystem;
  input_sys!: InputSystem;
  hud!: HUD;
  enemyBullets!: Phaser.Physics.Arcade.Group;

  // Groups
  xpOrbs!: Phaser.Physics.Arcade.Group;
  coins!: Phaser.Physics.Arcade.Group;

  // Run state
  stage = 1;
  wave = 0;
  runGold = 0;
  runEssence = 0;
  phase: GamePhase = 'loadout';
  private prevPhase: GamePhase = 'playing';

  // Upgrade state
  upgradeLevels: Record<string, number> = {};

  // Panel references
  private currentPanel: PanelOverlay | null = null;
  private pauseBanner: PauseBanner | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Reset state
    this.stage = SaveManager.getData().stageCheckpoint || 1;
    this.wave = 0;
    this.runGold = 0;
    this.runEssence = 0;
    this.upgradeLevels = {};
    this.enemies = [];
    this.phase = 'loadout';

    // Create floor
    this.createFloor();
    this.createWalls();

    // Player (placed at center, will be set after loadout)
    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT / 2);

    // Input system
    this.input_sys = new InputSystem(this);

    // Combat system
    this.combat = new CombatSystem(this, this.player);

    // Enemy bullets
    this.enemyBullets = this.physics.add.group({
      defaultKey: 'enemy_bullet',
      maxSize: 100,
    });

    // Pickups
    this.xpOrbs = this.physics.add.group({ defaultKey: 'xp_orb', maxSize: 50 });
    this.coins = this.physics.add.group({ defaultKey: 'coin', maxSize: 50 });

    // HUD
    this.hud = new HUD(this);

    // Collisions
    this.setupCollisions();

    // Show loadout overlay
    new LoadoutOverlay(this, (weaponId, skillId) => {
      const weapon = WEAPONS.find(w => w.id === weaponId)!;
      const skill = SKILLS.find(s => s.id === skillId)!;
      this.player.setLoadout(weapon, skill);
      this.phase = 'playing';
      this.time.delayedCall(500, () => this.spawnWave());
    });
  }

  private createFloor(): void {
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      for (let y = 0; y < GAME_HEIGHT; y += 40) {
        this.add.image(x + 20, y + 20, 'floor').setDepth(0);
      }
    }
  }

  private createWalls(): void {
    const wallGroup = this.physics.add.staticGroup();
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      wallGroup.create(x + 20, 10, 'wall').setDepth(1).refreshBody();
      wallGroup.create(x + 20, GAME_HEIGHT - 10, 'wall').setDepth(1).refreshBody();
    }
    for (let y = 20; y < GAME_HEIGHT - 20; y += 40) {
      wallGroup.create(10, y + 20, 'wall').setDepth(1).refreshBody();
      wallGroup.create(GAME_WIDTH - 10, y + 20, 'wall').setDepth(1).refreshBody();
    }
  }

  private setupCollisions(): void {
    // Enemy bullet hits player
    this.physics.add.overlap(
      this.player.sprite,
      this.enemyBullets,
      (_player, bullet) => {
        const b = bullet as Phaser.Physics.Arcade.Sprite;
        const damage = b.getData('damage') || 10;
        const dead = this.player.takeDamage(damage);
        b.destroy();
        if (dead) this.onDeath();
      },
      undefined,
      this,
    );

    // Collect XP orbs
    this.physics.add.overlap(
      this.player.sprite,
      this.xpOrbs,
      (_player, orb) => {
        const xpOrb = orb as Phaser.Physics.Arcade.Sprite;
        this.addXp(xpOrb.getData('xp') || 10);
        xpOrb.destroy();
      },
      undefined,
      this,
    );

    // Collect coins
    this.physics.add.overlap(
      this.player.sprite,
      this.coins,
      (_player, coin) => {
        const c = coin as Phaser.Physics.Arcade.Sprite;
        this.runGold += c.getData('gold') || 5;
        c.destroy();
      },
      undefined,
      this,
    );
  }

  update(time: number, delta: number): void {
    this.input_sys.update();

    // Handle panel toggle keys regardless of phase
    if (this.phase === 'playing' || this.phase === 'panel' || this.phase === 'paused') {
      this.handlePanelKeys();
    }

    // Pause toggle
    if (this.input_sys.consumeKey('ESC')) {
      if (this.phase === 'paused') {
        this.phase = this.prevPhase;
        this.pauseBanner?.destroy();
        this.pauseBanner = null;
      } else if (this.phase === 'playing') {
        this.prevPhase = this.phase;
        this.phase = 'paused';
        this.pauseBanner = new PauseBanner(this);
      }
    }

    // Restart after death
    if (this.phase === 'dead' && this.input_sys.consumeKey('R')) {
      this.scene.restart();
      return;
    }

    if (this.phase !== 'playing') {
      this.hud.update();
      return;
    }

    // Player movement
    this.player.sprite.setVelocity(
      this.input_sys.direction.x * this.player.speed,
      this.input_sys.direction.y * this.player.speed,
    );

    // Aim
    this.input_sys.updateAimAngle(this.player.sprite.x, this.player.sprite.y);
    this.player.facingAngle = this.input_sys.aimAngle;

    // Player update (regen, buffs)
    this.player.update(delta, time);

    // Combat (auto-attack nearest enemy constantly)
    const activeEnemies = this.enemies.filter(e => e.sprite.active);
    this.combat.update(time, activeEnemies, this.input_sys.aimAngle);

    // Right click: special skill
    if (this.input_sys.consumeRightClick()) {
      this.combat.useSkill(time, activeEnemies);
    }

    // Check projectile-enemy collisions
    this.combat.projectiles.getChildren().forEach(proj => {
      const arrow = proj as Phaser.Physics.Arcade.Sprite;
      if (!arrow.active) return;
      for (const enemy of activeEnemies) {
        if (!enemy.sprite.active) continue;
        const dist = Phaser.Math.Distance.Between(
          arrow.x, arrow.y, enemy.sprite.x, enemy.sprite.y,
        );
        if (dist < enemy.definition.size + 8) {
          this.combat.handleProjectileHit(arrow, enemy.sprite);
          if (!arrow.active) break;
        }
      }
    });

    // Contact damage
    for (const enemy of activeEnemies) {
      if (!enemy.sprite.active) continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y,
        enemy.sprite.x, enemy.sprite.y,
      );
      if (dist < enemy.definition.size + 12) {
        const dead = this.player.takeDamage(Math.floor(enemy.attack * 0.5));
        if (dead) {
          this.onDeath();
          return;
        }
      }
    }

    // Update enemies
    activeEnemies.forEach(e => e.update(this.player.sprite.x, this.player.sprite.y, time));

    // Attract pickups
    this.attractPickups(this.xpOrbs);
    this.attractPickups(this.coins);

    // HUD
    this.hud.update();
  }

  private handlePanelKeys(): void {
    const togglePanel = (type: 'inventory' | 'powerups' | 'settings' | 'help') => {
      if (this.currentPanel) {
        this.currentPanel.destroy();
        this.currentPanel = null;
        this.phase = 'playing';
      } else if (this.phase === 'playing') {
        const data = type === 'powerups'
          ? { upgradeLevels: this.upgradeLevels }
          : this;
        this.currentPanel = new PanelOverlay(this, type, data);
        this.phase = 'panel';
      }
    };

    if (this.input_sys.consumeKey('I')) togglePanel('inventory');
    if (this.input_sys.consumeKey('P')) togglePanel('powerups');
    if (this.input_sys.consumeKey('O')) togglePanel('settings');
    if (this.input_sys.consumeKey('H')) togglePanel('help');
  }

  private attractPickups(group: Phaser.Physics.Arcade.Group): void {
    group.getChildren().forEach(obj => {
      const o = obj as Phaser.Physics.Arcade.Sprite;
      if (!o.active) return;
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y, o.x, o.y,
      );
      if (dist < 80) {
        const angle = Phaser.Math.Angle.Between(o.x, o.y, this.player.sprite.x, this.player.sprite.y);
        o.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
      }
    });
  }

  // ============================================================
  // Wave Spawning
  // ============================================================
  private spawnWave(): void {
    if (this.phase !== 'playing') return;

    const isBossWave = (this.wave + 1) % BOSS_WAVE_INTERVAL === 0;
    const chapterIndex = Math.min(this.stage - 1, ENEMIES_BY_CHAPTER.length - 1);

    if (isBossWave) {
      const bossIndex = Math.min(this.stage - 1, BOSSES.length - 1);
      const bossDef = BOSSES[bossIndex];
      const boss = new Enemy(this, GAME_WIDTH / 2, 120, bossDef, this.stage - 1, this.wave);
      this.enemies.push(boss);
    } else {
      const enemyDefs = ENEMIES_BY_CHAPTER[chapterIndex] || ENEMIES_BY_CHAPTER[0];
      const count = getEnemyCountForWave(this.wave, this.stage - 1);

      for (let i = 0; i < count; i++) {
        const def = Phaser.Utils.Array.GetRandom(enemyDefs);
        const x = Phaser.Math.Between(60, GAME_WIDTH - 60);
        const y = Phaser.Math.Between(60, GAME_HEIGHT / 2);
        const enemy = new Enemy(this, x, y, def, this.stage - 1, this.wave);
        this.enemies.push(enemy);
      }
    }

    CenterMessage.show(this, `Wave ${this.wave + 1}`, '#ffffff', 1000);
  }

  onEnemyKilled(enemy: Enemy): void {
    this.player.killCount++;

    // Spawn XP orb
    const xpOrb = this.xpOrbs.create(enemy.sprite.x, enemy.sprite.y, 'xp_orb') as Phaser.Physics.Arcade.Sprite;
    if (xpOrb) {
      xpOrb.setData('xp', enemy.xpValue);
      xpOrb.setDepth(3);
      xpOrb.setVelocity(Phaser.Math.Between(-30, 30), Phaser.Math.Between(-30, 30));
      xpOrb.setDrag(50);
    }

    // Drop coin
    if (Math.random() < 0.5) {
      const coin = this.coins.create(enemy.sprite.x, enemy.sprite.y, 'coin') as Phaser.Physics.Arcade.Sprite;
      if (coin) {
        coin.setData('gold', enemy.goldValue);
        coin.setDepth(3);
        coin.setVelocity(Phaser.Math.Between(-20, 20), Phaser.Math.Between(-20, 20));
        coin.setDrag(80);
      }
    }

    // Remove enemy
    enemy.destroy();
    this.enemies = this.enemies.filter(e => e !== enemy);

    // Check wave clear
    const alive = this.enemies.filter(e => e.sprite.active);
    if (alive.length === 0) {
      this.onWaveClear();
    }
  }

  private onWaveClear(): void {
    const wasBossWave = (this.wave + 1) % BOSS_WAVE_INTERVAL === 0;

    // Reward gold + essence
    const goldReward = 10 + this.wave * 2 + (wasBossWave ? 30 : 0);
    const essenceReward = wasBossWave ? 5 : 1;
    this.runGold += goldReward;
    this.runEssence += essenceReward;

    CenterMessage.show(this, 'WAVE CLEARED!', '#ffd54f', 1500);

    this.wave++;

    // Check stage complete (wave 30)
    if (this.wave >= WAVES_PER_STAGE) {
      this.onStageComplete();
      return;
    }

    if (wasBossWave) {
      // After boss: shop → upgrade draft → next wave
      this.time.delayedCall(1500, () => {
        this.phase = 'shop';
        new ShopOverlay(
          this,
          this.runGold,
          (itemId, cost) => this.handleShopBuy(itemId, cost),
          () => {
            // After shop, show upgrade draft
            this.phase = 'upgrade';
            new UpgradeDraftOverlay(this, this.upgradeLevels, (upgradeId) => {
              this.applyUpgrade(upgradeId);
              this.phase = 'playing';
              this.time.delayedCall(500, () => this.spawnWave());
            });
          },
        );
      });
    } else {
      // Non-boss: directly next wave
      this.time.delayedCall(1500, () => this.spawnWave());
    }
  }

  private onStageComplete(): void {
    // Save checkpoint
    const save = SaveManager.getData();
    this.stage++;
    if (this.stage > save.bestStage) {
      save.bestStage = this.stage;
    }
    save.stageCheckpoint = this.stage;
    SaveManager.save();

    CenterMessage.show(this, `STAGE ${this.stage - 1} COMPLETE!`, '#4ecdc4', 2000);

    // Reset wave, continue
    this.wave = 0;
    this.time.delayedCall(2500, () => {
      // Clean up
      this.enemies.forEach(e => e.destroy());
      this.enemies = [];
      this.enemyBullets.clear(true, true);
      this.xpOrbs.clear(true, true);
      this.coins.clear(true, true);
      this.player.sprite.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2);
      this.spawnWave();
    });
  }

  private handleShopBuy(itemId: string, cost: number): boolean {
    if (this.runGold < cost) return false;

    this.runGold -= cost;
    const item = SHOP_ITEMS.find(s => s.id === itemId);
    if (!item) return false;

    const time = this.time.now;
    switch (item.effect) {
      case 'heal_40':
        this.player.heal(40);
        break;
      case 'mana_30':
        this.player.restoreMana(30);
        break;
      case 'damage_buff':
        this.player.damageBuff = 1;
        this.player.damageBuff_timer = time + 60000;
        break;
      case 'defense_buff':
        this.player.defenseBuff = 1;
        this.player.defenseBuff_timer = time + 60000;
        break;
      case 'weapon_damage_5':
        this.player.weaponDamageBonus += 5;
        break;
      case 'weapon_speed_10':
        this.player.weaponSpeedBonus += 0.1;
        break;
      case 'weapon_range_15':
        this.player.weaponRangeBonus += 0.15;
        break;
    }

    return true;
  }

  private applyUpgrade(upgradeId: string): void {
    if (!this.upgradeLevels[upgradeId]) this.upgradeLevels[upgradeId] = 0;
    this.upgradeLevels[upgradeId]++;

    // Recompute effects
    const effects: UpgradeEffect[] = [];
    for (const [id, count] of Object.entries(this.upgradeLevels)) {
      const upg = UPGRADES.find(u => u.id === id);
      if (upg) effects.push(upg.apply(count));
    }
    this.player.applyUpgrades(effects);
  }

  private addXp(amount: number): void {
    this.player.xp += amount;
    const needed = getXpForLevel(this.player.level);
    if (this.player.xp >= needed) {
      this.player.xp -= needed;
      this.player.level++;
      CenterMessage.show(this, `LEVEL UP! (Lv ${this.player.level})`, '#00e5ff', 1500);
    }
  }

  private onDeath(): void {
    this.phase = 'dead';

    // Bank resources
    const save = SaveManager.getData();
    save.goldBank += this.runGold;
    save.essence += this.runEssence;
    save.heroXp += this.player.killCount;
    // Level up check
    const xpNeeded = 50 + save.heroLevel * 20;
    if (save.heroXp >= xpNeeded) {
      save.heroXp -= xpNeeded;
      save.heroLevel++;
    }
    SaveManager.save();

    this.scene.start('GameOverScene', {
      stage: this.stage,
      wave: this.wave,
      gold: this.runGold,
      essence: this.runEssence,
      kills: this.player.killCount,
      level: this.player.level,
    });
  }

  shutdown(): void {
    this.player?.destroy();
    this.enemies.forEach(e => e.destroy());
    this.combat?.destroy();
    this.input_sys?.destroy();
    this.hud?.destroy();
  }
}
