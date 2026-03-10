import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { CombatSystem } from '../systems/CombatSystem';
import { JoystickSystem } from '../systems/JoystickSystem';
import {
  HEROES,
  ABILITIES,
  ENEMIES_BY_CHAPTER,
  BOSSES,
  ROOMS_PER_CHAPTER,
  BOSS_ROOM_INTERVAL,
  WAVES_PER_ROOM,
  getXpForLevel,
  getEnemyCountForWave,
  AbilityEffect,
} from '../data/GameData';
import { SaveManager } from '../utils/SaveManager';
import { HUD } from '../ui/HUD';

export class GameScene extends Phaser.Scene {
  player!: Player;
  heroDef!: any;
  enemies: Enemy[] = [];
  combat!: CombatSystem;
  joystick!: JoystickSystem;
  hud!: HUD;
  enemyBullets!: Phaser.Physics.Arcade.Group;

  // Dungeon state
  chapter = 0;
  room = 0;
  wave = 0;
  goldEarned = 0;
  roomCleared = false;
  transitioning = false;

  // Ability state
  abilityLevels: Record<string, number> = {};
  abilityEffects: AbilityEffect[] = [];

  // XP orbs
  xpOrbs!: Phaser.Physics.Arcade.Group;
  // Coins
  coins!: Phaser.Physics.Arcade.Group;

  // Door
  door: Phaser.GameObjects.Image | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Reset state
    this.chapter = 0;
    this.room = 0;
    this.wave = 0;
    this.goldEarned = 0;
    this.roomCleared = false;
    this.transitioning = false;
    this.abilityLevels = {};
    this.abilityEffects = [];
    this.enemies = [];
    this.door = null;

    // Create floor background
    this.createFloor();

    // Create walls
    this.createWalls();

    // Setup hero
    const save = SaveManager.getData();
    this.heroDef = HEROES.find(h => h.id === save.selectedHero) || HEROES[0];

    // Create player
    this.player = new Player(this, width / 2, height / 2, this.heroDef);

    // Joystick
    this.joystick = new JoystickSystem(this);

    // Combat system
    this.combat = new CombatSystem(this, this.player);

    // Enemy bullets group
    this.enemyBullets = this.physics.add.group({
      defaultKey: 'enemy_bullet',
      maxSize: 100,
    });

    // XP orbs group
    this.xpOrbs = this.physics.add.group({
      defaultKey: 'xp_orb',
      maxSize: 50,
    });

    // Coins group
    this.coins = this.physics.add.group({
      defaultKey: 'coin',
      maxSize: 30,
    });

    // HUD
    this.hud = new HUD(this);

    // Setup collisions
    this.setupCollisions();

    // Start first wave
    this.time.delayedCall(500, () => this.spawnWave());

    // Pause button
    this.add.text(width - 40, 45, '||', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(50).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.pause();
        // Simple pause overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setDepth(200);
        const pauseText = this.add.text(width / 2, height / 2 - 40, 'PAUSED', {
          fontSize: '36px',
          color: '#ffffff',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(201);
        const resumeBtn = this.add.text(width / 2, height / 2 + 30, 'Tap to Resume', {
          fontSize: '20px',
          color: '#4ecdc4',
          fontFamily: 'Arial',
        }).setOrigin(0.5).setDepth(201);

        this.input.once('pointerdown', () => {
          overlay.destroy();
          pauseText.destroy();
          resumeBtn.destroy();
          this.scene.resume();
        });
      });
  }

  private createFloor(): void {
    const { width, height } = this.scale;
    for (let x = 0; x < width; x += 40) {
      for (let y = 0; y < height; y += 40) {
        this.add.image(x + 20, y + 20, 'floor').setDepth(0);
      }
    }
  }

  private createWalls(): void {
    // Visual walls around the play area
    const { width, height } = this.scale;
    const wallGroup = this.physics.add.staticGroup();

    // Top and bottom walls
    for (let x = 0; x < width; x += 40) {
      wallGroup.create(x + 20, 30, 'wall').setDepth(1).refreshBody();
      wallGroup.create(x + 20, height - 10, 'wall').setDepth(1).refreshBody();
    }
    // Left and right walls
    for (let y = 40; y < height - 20; y += 40) {
      wallGroup.create(10, y + 20, 'wall').setDepth(1).refreshBody();
      wallGroup.create(width - 10, y + 20, 'wall').setDepth(1).refreshBody();
    }
  }

  private setupCollisions(): void {
    // Arrow hits enemy
    this.physics.add.overlap(
      this.combat.projectiles,
      this.physics.add.group(), // Placeholder, we check manually
      undefined,
      undefined,
      this,
    );

    // Enemy bullet hits player
    this.physics.add.overlap(
      this.player.sprite,
      this.enemyBullets,
      (_player, bullet) => {
        const b = bullet as Phaser.Physics.Arcade.Sprite;
        const damage = b.getData('damage') || 10;
        const dead = this.player.takeDamage(damage);
        b.destroy();
        if (dead) this.gameOver();
      },
      undefined,
      this,
    );

    // Player collects XP orbs
    this.physics.add.overlap(
      this.player.sprite,
      this.xpOrbs,
      (_player, orb) => {
        const xpOrb = orb as Phaser.Physics.Arcade.Sprite;
        const xpAmount = xpOrb.getData('xp') || 10;
        this.addXp(xpAmount);
        xpOrb.destroy();
      },
      undefined,
      this,
    );

    // Player collects coins
    this.physics.add.overlap(
      this.player.sprite,
      this.coins,
      (_player, coin) => {
        const c = coin as Phaser.Physics.Arcade.Sprite;
        const goldAmount = c.getData('gold') || 5;
        this.goldEarned += goldAmount;
        c.destroy();
      },
      undefined,
      this,
    );
  }

  update(time: number): void {
    if (this.transitioning) return;

    // Player movement via joystick
    if (this.joystick.isActive) {
      this.player.sprite.setVelocity(
        this.joystick.direction.x * this.player.speed,
        this.joystick.direction.y * this.player.speed,
      );
      this.player.isMoving = true;
      this.player.facingAngle = Math.atan2(this.joystick.direction.y, this.joystick.direction.x);
    } else {
      this.player.sprite.setVelocity(0, 0);
      this.player.isMoving = false;
    }

    // Update player
    this.player.update();

    // Update enemies
    const activeEnemies = this.enemies.filter(e => e.sprite.active);
    activeEnemies.forEach(enemy => {
      enemy.update(this.player.sprite.x, this.player.sprite.y);
    });

    // Check arrow-enemy collisions manually
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
          break;
        }
      }
    });

    // Check contact damage (enemy touching player)
    for (const enemy of activeEnemies) {
      if (!enemy.sprite.active) continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y,
        enemy.sprite.x, enemy.sprite.y,
      );
      if (dist < enemy.definition.size + 12) {
        const dead = this.player.takeDamage(Math.floor(enemy.attack * 0.5));
        if (dead) {
          this.gameOver();
          return;
        }
      }
    }

    // Update combat (auto-attack)
    this.combat.update(time, activeEnemies);

    // Update HUD
    this.hud.update();

    // Attract XP orbs toward player
    this.xpOrbs.getChildren().forEach(orb => {
      const o = orb as Phaser.Physics.Arcade.Sprite;
      if (!o.active) return;
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y, o.x, o.y,
      );
      if (dist < 80) {
        const angle = Phaser.Math.Angle.Between(o.x, o.y, this.player.sprite.x, this.player.sprite.y);
        o.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
      }
    });

    // Check if door can be entered
    if (this.door && this.roomCleared) {
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y,
        this.door.x, this.door.y,
      );
      if (dist < 50) {
        this.nextRoom();
      }
    }
  }

  private spawnWave(): void {
    if (this.transitioning) return;

    const isBossRoom = (this.room + 1) % BOSS_ROOM_INTERVAL === 0;
    const chapterIndex = Math.min(this.chapter, ENEMIES_BY_CHAPTER.length - 1);

    if (isBossRoom && this.wave === 0) {
      // Boss fight
      const bossIndex = Math.min(this.chapter, BOSSES.length - 1);
      const bossDef = BOSSES[bossIndex];
      const boss = new Enemy(this, 195, 200, bossDef, this.chapter, this.room);
      this.enemies.push(boss);
      this.wave = WAVES_PER_ROOM; // No more waves after boss
    } else if (!isBossRoom) {
      const enemyDefs = ENEMIES_BY_CHAPTER[chapterIndex];
      const count = getEnemyCountForWave(this.room, this.wave);

      for (let i = 0; i < count; i++) {
        const def = Phaser.Utils.Array.GetRandom(enemyDefs);
        const x = Phaser.Math.Between(60, 330);
        const y = Phaser.Math.Between(80, 350);
        const enemy = new Enemy(this, x, y, def, this.chapter, this.room);
        this.enemies.push(enemy);
      }

      this.wave++;
    }
  }

  onEnemyKilled(enemy: Enemy): void {
    this.player.killCount++;

    // Spawn XP orb
    const xpOrb = this.xpOrbs.create(enemy.sprite.x, enemy.sprite.y, 'xp_orb') as Phaser.Physics.Arcade.Sprite;
    if (xpOrb) {
      xpOrb.setData('xp', enemy.xpValue);
      xpOrb.setDepth(3);
      // Small random velocity
      xpOrb.setVelocity(
        Phaser.Math.Between(-30, 30),
        Phaser.Math.Between(-30, 30),
      );
      xpOrb.setDrag(50);
    }

    // Chance to drop coin
    if (Math.random() < 0.4) {
      const coin = this.coins.create(enemy.sprite.x, enemy.sprite.y, 'coin') as Phaser.Physics.Arcade.Sprite;
      if (coin) {
        coin.setData('gold', Phaser.Math.Between(3, 8 + this.chapter * 2));
        coin.setDepth(3);
        coin.setVelocity(Phaser.Math.Between(-20, 20), Phaser.Math.Between(-20, 20));
        coin.setDrag(80);
      }
    }

    // Remove from active enemies
    enemy.destroy();
    this.enemies = this.enemies.filter(e => e !== enemy);

    // Check if wave/room cleared
    const alive = this.enemies.filter(e => e.sprite.active);
    if (alive.length === 0) {
      if (this.wave < WAVES_PER_ROOM && (this.room + 1) % BOSS_ROOM_INTERVAL !== 0) {
        // Next wave
        this.time.delayedCall(1000, () => this.spawnWave());
      } else {
        // Room cleared!
        this.roomCleared = true;
        this.showRoomClearMessage();
      }
    }
  }

  private showRoomClearMessage(): void {
    const { width, height } = this.scale;

    const clearText = this.add.text(width / 2, height / 2 - 60, 'ROOM CLEARED!', {
      fontSize: '28px',
      color: '#ffd54f',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: clearText,
      alpha: 0,
      duration: 2000,
      delay: 1000,
      onComplete: () => clearText.destroy(),
    });

    // Spawn door
    this.door = this.add.image(width / 2, 80, 'door').setDepth(9);
    this.tweens.add({
      targets: this.door,
      scaleX: { from: 0, to: 1 },
      scaleY: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Arrow pointing to door
    const arrowText = this.add.text(width / 2, 140, '▲', {
      fontSize: '24px',
      color: '#ffd54f',
      fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: arrowText,
      y: 130,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  private nextRoom(): void {
    if (this.transitioning) return;
    this.transitioning = true;

    const { width, height } = this.scale;

    // Clean up
    if (this.door) {
      this.door.destroy();
      this.door = null;
    }

    // Transition effect
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setDepth(200);

    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        // Advance room
        this.room++;
        this.wave = 0;
        this.roomCleared = false;

        // Check chapter advance
        if (this.room >= ROOMS_PER_CHAPTER) {
          this.chapter++;
          this.room = 0;
        }

        // Clean up old enemies
        this.enemies.forEach(e => e.destroy());
        this.enemies = [];

        // Clean up bullets
        this.enemyBullets.clear(true, true);
        this.xpOrbs.clear(true, true);
        this.coins.clear(true, true);

        // Reset player position
        this.player.sprite.setPosition(width / 2, height - 200);

        // Update HUD
        this.hud.update();

        // Fade back in
        this.tweens.add({
          targets: overlay,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            overlay.destroy();
            this.transitioning = false;
            this.time.delayedCall(500, () => this.spawnWave());
          },
        });
      },
    });
  }

  private addXp(amount: number): void {
    this.player.xp += amount;
    const xpNeeded = getXpForLevel(this.player.level);

    if (this.player.xp >= xpNeeded) {
      this.player.xp -= xpNeeded;
      this.player.level++;

      // Trigger level-up scene
      this.scene.pause();
      this.scene.launch('LevelUpScene', {
        abilityLevels: this.abilityLevels,
        playerLevel: this.player.level,
      });
    }
  }

  applyAbilityChoice(abilityId: string): void {
    if (!this.abilityLevels[abilityId]) {
      this.abilityLevels[abilityId] = 0;
    }
    this.abilityLevels[abilityId]++;

    // Recompute all effects
    this.abilityEffects = [];
    for (const [id, level] of Object.entries(this.abilityLevels)) {
      const ability = ABILITIES.find(a => a.id === id);
      if (ability) {
        this.abilityEffects.push(ability.apply(level as number));
      }
    }

    this.player.applyAbilities(this.abilityEffects);
    this.scene.resume();
  }

  private gameOver(): void {
    // Save progress
    SaveManager.addGold(this.goldEarned);
    SaveManager.addKills(this.player.killCount);
    SaveManager.updateProgress(this.chapter, this.room);

    this.scene.start('GameOverScene', {
      chapter: this.chapter,
      room: this.room,
      gold: this.goldEarned,
      kills: this.player.killCount,
      level: this.player.level,
    });
  }

  shutdown(): void {
    this.player?.destroy();
    this.enemies.forEach(e => e.destroy());
    this.combat?.destroy();
    this.joystick?.destroy();
    this.hud?.destroy();
  }
}
