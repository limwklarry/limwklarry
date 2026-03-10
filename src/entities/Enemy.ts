import { EnemyDefinition, scaleEnemyStat } from '../data/GameData';
import { AssetGenerator } from '../utils/AssetGenerator';

export class Enemy {
  sprite: Phaser.Physics.Arcade.Sprite;
  scene: Phaser.Scene;
  definition: EnemyDefinition;
  hp: number;
  maxHp: number;
  attack: number;
  speed: number;
  xpValue: number;
  hpBar: Phaser.GameObjects.Graphics;
  frozen = false;
  poisoned = false;
  poisonTimer?: Phaser.Time.TimerEvent;
  shootTimer?: Phaser.Time.TimerEvent;
  behaviorTimer?: Phaser.Time.TimerEvent;
  circleAngle = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    def: EnemyDefinition,
    chapter: number,
    room: number,
  ) {
    this.scene = scene;
    this.definition = def;

    // Scale stats
    this.maxHp = scaleEnemyStat(def.hp, chapter, room);
    this.hp = this.maxHp;
    this.attack = scaleEnemyStat(def.attack, chapter, room);
    this.speed = def.speed;
    this.xpValue = scaleEnemyStat(def.xpValue, chapter, room);

    // Generate texture
    const textureKey = `enemy_${def.id}`;
    if (def.behavior === 'boss') {
      AssetGenerator.generateBossTexture(scene, textureKey, def.color, def.size);
    } else {
      AssetGenerator.generateEnemyTexture(scene, textureKey, def.color, def.size);
    }

    // Create sprite
    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setDepth(5);
    this.sprite.setData('enemy', this);

    const bodySize = def.size * 1.5;
    this.sprite.body?.setSize(bodySize, bodySize);
    this.sprite.body?.setOffset(
      (this.sprite.width - bodySize) / 2,
      (this.sprite.height - bodySize) / 2,
    );

    // HP bar
    this.hpBar = scene.add.graphics().setDepth(6);
    this.updateHpBar();

    // Start behavior
    this.startBehavior();
  }

  private startBehavior(): void {
    const gameScene = this.scene as any;

    if (this.definition.behavior === 'ranged' || this.definition.behavior === 'boss') {
      this.shootTimer = this.scene.time.addEvent({
        delay: this.definition.behavior === 'boss' ? 1500 : 2500,
        callback: () => this.shoot(gameScene),
        loop: true,
      });
    }

    if (this.definition.behavior === 'burst') {
      this.behaviorTimer = this.scene.time.addEvent({
        delay: 3000,
        callback: () => this.burstAttack(gameScene),
        loop: true,
      });
    }
  }

  private shoot(gameScene: any): void {
    if (!this.sprite.active || !gameScene.player?.sprite?.active) return;

    const player = gameScene.player.sprite;
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      player.x, player.y,
    );

    this.createBullet(angle, gameScene);

    // Boss shoots additional bullets
    if (this.definition.behavior === 'boss') {
      this.createBullet(angle - 0.3, gameScene);
      this.createBullet(angle + 0.3, gameScene);
    }
  }

  private burstAttack(gameScene: any): void {
    if (!this.sprite.active) return;

    // Fire in 8 directions
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      this.createBullet(angle, gameScene);
    }
  }

  private createBullet(angle: number, gameScene: any): void {
    if (!gameScene.enemyBullets) return;

    const bullet = gameScene.enemyBullets.create(
      this.sprite.x,
      this.sprite.y,
      'enemy_bullet',
    ) as Phaser.Physics.Arcade.Sprite;

    if (!bullet) return;

    bullet.setDepth(4);
    const speed = 180;
    bullet.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
    );
    bullet.setData('damage', this.attack);

    // Auto-destroy after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      if (bullet.active) bullet.destroy();
    });
  }

  update(playerX: number, playerY: number): void {
    if (!this.sprite.active || this.frozen) {
      if (this.frozen) {
        this.sprite.setVelocity(0, 0);
      }
      return;
    }

    this.updateHpBar();

    switch (this.definition.behavior) {
      case 'chase':
      case 'boss':
        this.chasePlayer(playerX, playerY);
        break;
      case 'ranged':
        this.keepDistance(playerX, playerY, 150);
        break;
      case 'circle':
        this.circlePlayer(playerX, playerY);
        break;
      case 'burst':
        this.keepDistance(playerX, playerY, 120);
        break;
    }
  }

  private chasePlayer(px: number, py: number): void {
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y, px, py,
    );
    this.sprite.setVelocity(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed,
    );
  }

  private keepDistance(px: number, py: number, dist: number): void {
    const d = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, px, py);
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, px, py);

    if (d < dist - 30) {
      // Too close, back away
      this.sprite.setVelocity(
        -Math.cos(angle) * this.speed * 0.5,
        -Math.sin(angle) * this.speed * 0.5,
      );
    } else if (d > dist + 30) {
      // Too far, approach
      this.sprite.setVelocity(
        Math.cos(angle) * this.speed * 0.7,
        Math.sin(angle) * this.speed * 0.7,
      );
    } else {
      // Strafe
      this.sprite.setVelocity(
        Math.cos(angle + Math.PI / 2) * this.speed * 0.4,
        Math.sin(angle + Math.PI / 2) * this.speed * 0.4,
      );
    }
  }

  private circlePlayer(px: number, py: number): void {
    this.circleAngle += 0.02;
    const radius = 100;
    const targetX = px + Math.cos(this.circleAngle) * radius;
    const targetY = py + Math.sin(this.circleAngle) * radius;

    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y, targetX, targetY,
    );
    this.sprite.setVelocity(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed,
    );
  }

  takeDamage(amount: number, isCrit: boolean): boolean {
    this.hp -= amount;

    // Damage number
    const color = isCrit ? '#ffd54f' : '#ffffff';
    const text = this.scene.add.text(
      this.sprite.x + Phaser.Math.Between(-10, 10),
      this.sprite.y - 20,
      `${isCrit ? 'CRIT ' : ''}${amount}`,
      {
        fontSize: isCrit ? '18px' : '14px',
        color,
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      },
    ).setOrigin(0.5).setDepth(100);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 600,
      onComplete: () => text.destroy(),
    });

    // Flash white
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.sprite.active) this.sprite.clearTint();
    });

    this.updateHpBar();
    return this.hp <= 0;
  }

  applyPoison(damage: number): void {
    if (this.poisoned) return;
    this.poisoned = true;
    this.sprite.setTint(0x66bb6a);

    let ticks = 0;
    this.poisonTimer = this.scene.time.addEvent({
      delay: 500,
      repeat: 5,
      callback: () => {
        if (!this.sprite.active) return;
        this.hp -= damage;
        ticks++;
        if (ticks >= 5) {
          this.poisoned = false;
          if (this.sprite.active) this.sprite.clearTint();
        }
        this.updateHpBar();
        if (this.hp <= 0) {
          (this.scene as any).onEnemyKilled?.(this);
        }
      },
    });
  }

  applyFreeze(duration: number): void {
    this.frozen = true;
    this.sprite.setTint(0x80d8ff);
    this.scene.time.delayedCall(duration, () => {
      this.frozen = false;
      if (this.sprite.active) this.sprite.clearTint();
    });
  }

  private updateHpBar(): void {
    this.hpBar.clear();
    if (this.hp >= this.maxHp) return;

    const barW = 30;
    const barH = 4;
    const x = this.sprite.x - barW / 2;
    const y = this.sprite.y - this.definition.size - 8;

    // Background
    this.hpBar.fillStyle(0x333333, 1);
    this.hpBar.fillRect(x, y, barW, barH);

    // HP fill
    const ratio = Math.max(0, this.hp / this.maxHp);
    const color = ratio > 0.5 ? 0x66bb6a : ratio > 0.25 ? 0xffa726 : 0xff4444;
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(x, y, barW * ratio, barH);
  }

  destroy(): void {
    this.shootTimer?.destroy();
    this.behaviorTimer?.destroy();
    this.poisonTimer?.destroy();
    this.hpBar.destroy();
    this.sprite.destroy();
  }
}
