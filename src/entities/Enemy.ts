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
  goldValue: number;
  hpBar: Phaser.GameObjects.Graphics;
  frozen = false;
  slowed = false;
  slowTimer?: Phaser.Time.TimerEvent;
  shootTimer?: Phaser.Time.TimerEvent;

  // Charger state
  private chargeTimer = 0;
  private charging = false;
  private chargeTarget = { x: 0, y: 0 };
  private chargeCooldown = 3000;
  private lastChargeTime = 0;

  // Boss state
  private bossPhase2 = false;
  private bossShootTimer = 0;
  private bossDashCooldown = 0;
  private bossDashing = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    def: EnemyDefinition,
    stage: number,
    wave: number,
  ) {
    this.scene = scene;
    this.definition = def;

    this.maxHp = scaleEnemyStat(def.hp, stage, wave);
    this.hp = this.maxHp;
    this.attack = scaleEnemyStat(def.attack, stage, wave);
    this.speed = def.speed;
    this.xpValue = scaleEnemyStat(def.xpValue, stage, wave);
    this.goldValue = scaleEnemyStat(def.goldValue, stage, wave);

    // Generate texture
    const textureKey = `enemy_${def.id}`;
    if (def.behavior === 'boss') {
      AssetGenerator.generateBossTexture(scene, textureKey, def.color, def.size);
    } else {
      AssetGenerator.generateEnemyTexture(scene, textureKey, def.color, def.size);
    }

    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setDepth(5);
    this.sprite.setData('enemy', this);
    this.sprite.setCollideWorldBounds(true);

    const bodySize = def.size * 1.5;
    this.sprite.body?.setSize(bodySize, bodySize);
    this.sprite.body?.setOffset(
      (this.sprite.width - bodySize) / 2,
      (this.sprite.height - bodySize) / 2,
    );

    this.hpBar = scene.add.graphics().setDepth(6);
    this.updateHpBar();

    // Start ranged shooting
    if (def.behavior === 'ranger') {
      this.shootTimer = scene.time.addEvent({
        delay: 2500,
        callback: () => this.shoot(),
        loop: true,
      });
    }
    if (def.behavior === 'boss') {
      this.shootTimer = scene.time.addEvent({
        delay: 1800,
        callback: () => this.bossShoot(),
        loop: true,
      });
    }
  }

  private shoot(): void {
    if (!this.sprite.active || this.frozen) return;
    const gameScene = this.scene as any;
    const player = gameScene.player;
    if (!player?.sprite?.active) return;

    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      player.sprite.x, player.sprite.y,
    );
    this.createBullet(angle);
  }

  private bossShoot(): void {
    if (!this.sprite.active || this.frozen) return;
    const gameScene = this.scene as any;
    const player = gameScene.player;
    if (!player?.sprite?.active) return;

    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      player.sprite.x, player.sprite.y,
    );

    // Aimed shots
    this.createBullet(angle);
    this.createBullet(angle - 0.25);
    this.createBullet(angle + 0.25);

    // Phase 2: radial burst
    if (this.bossPhase2) {
      for (let i = 0; i < 8; i++) {
        this.createBullet((i * Math.PI * 2) / 8);
      }
    }
  }

  private createBullet(angle: number): void {
    const gameScene = this.scene as any;
    if (!gameScene.enemyBullets) return;

    const bullet = gameScene.enemyBullets.create(
      this.sprite.x, this.sprite.y, 'enemy_bullet',
    ) as Phaser.Physics.Arcade.Sprite;
    if (!bullet) return;

    bullet.setDepth(4);
    const speed = 200;
    bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    bullet.setData('damage', this.attack);

    this.scene.time.delayedCall(3000, () => {
      if (bullet.active) bullet.destroy();
    });
  }

  update(playerX: number, playerY: number, time: number): void {
    if (!this.sprite.active) return;
    if (this.frozen) {
      this.sprite.setVelocity(0, 0);
      return;
    }

    this.updateHpBar();
    const effectiveSpeed = this.slowed ? this.speed * 0.5 : this.speed;

    switch (this.definition.behavior) {
      case 'grunt':
        this.behaviorGrunt(playerX, playerY, effectiveSpeed);
        break;
      case 'ranger':
        this.behaviorRanger(playerX, playerY, effectiveSpeed);
        break;
      case 'charger':
        this.behaviorCharger(playerX, playerY, effectiveSpeed, time);
        break;
      case 'boss':
        this.behaviorBoss(playerX, playerY, effectiveSpeed, time);
        break;
    }
  }

  private behaviorGrunt(px: number, py: number, spd: number): void {
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, px, py);
    this.sprite.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
  }

  private behaviorRanger(px: number, py: number, spd: number): void {
    const d = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, px, py);
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, px, py);

    if (d < 120) {
      // Kite: back away
      this.sprite.setVelocity(-Math.cos(angle) * spd * 0.6, -Math.sin(angle) * spd * 0.6);
    } else if (d > 200) {
      this.sprite.setVelocity(Math.cos(angle) * spd * 0.7, Math.sin(angle) * spd * 0.7);
    } else {
      // Strafe
      this.sprite.setVelocity(
        Math.cos(angle + Math.PI / 2) * spd * 0.4,
        Math.sin(angle + Math.PI / 2) * spd * 0.4,
      );
    }
  }

  private behaviorCharger(px: number, py: number, spd: number, time: number): void {
    if (this.charging) {
      // Continue charge dash
      const angle = Phaser.Math.Angle.Between(
        this.sprite.x, this.sprite.y, this.chargeTarget.x, this.chargeTarget.y,
      );
      this.sprite.setVelocity(Math.cos(angle) * spd * 2.5, Math.sin(angle) * spd * 2.5);
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y, this.chargeTarget.x, this.chargeTarget.y,
      );
      if (dist < 20 || time > this.chargeTimer + 800) {
        this.charging = false;
        this.lastChargeTime = time;
      }
      return;
    }

    // Normal chase
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, px, py);
    this.sprite.setVelocity(Math.cos(angle) * spd * 0.6, Math.sin(angle) * spd * 0.6);

    // Initiate charge
    const d = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, px, py);
    if (d < 200 && time - this.lastChargeTime > this.chargeCooldown) {
      this.charging = true;
      this.chargeTimer = time;
      this.chargeTarget = { x: px, y: py };
      // Flash before charging
      this.sprite.setTint(0xffffff);
      this.scene.time.delayedCall(150, () => {
        if (this.sprite.active) this.sprite.clearTint();
      });
    }
  }

  private behaviorBoss(px: number, py: number, spd: number, time: number): void {
    // Phase check
    if (!this.bossPhase2 && this.hp < this.maxHp * 0.5) {
      this.bossPhase2 = true;
      // Visual feedback for phase change
      this.sprite.setTint(0xff4444);
      this.scene.time.delayedCall(300, () => {
        if (this.sprite.active) this.sprite.clearTint();
      });
    }

    // Dash attack
    if (this.bossDashing) {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y, this.chargeTarget.x, this.chargeTarget.y,
      );
      if (dist < 30 || time > this.bossDashCooldown + 1000) {
        this.bossDashing = false;
      }
      return; // Keep current velocity during dash
    }

    // Initiate dash (more frequent in phase 2)
    const dashInterval = this.bossPhase2 ? 4000 : 6000;
    if (time - this.bossDashCooldown > dashInterval) {
      this.bossDashing = true;
      this.bossDashCooldown = time;
      this.chargeTarget = { x: px, y: py };
      const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, px, py);
      this.sprite.setVelocity(Math.cos(angle) * spd * 3, Math.sin(angle) * spd * 3);
      return;
    }

    // Normal chase
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, px, py);
    this.sprite.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
  }

  takeDamage(amount: number, isCrit: boolean): boolean {
    this.hp -= amount;

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

    // Hit flash
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.sprite.active) this.sprite.clearTint();
    });

    this.updateHpBar();
    return this.hp <= 0;
  }

  applySlow(duration: number): void {
    this.slowed = true;
    this.sprite.setTint(0x7c4dff);
    if (this.slowTimer) this.slowTimer.destroy();
    this.slowTimer = this.scene.time.delayedCall(duration, () => {
      this.slowed = false;
      if (this.sprite.active) this.sprite.clearTint();
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

    this.hpBar.fillStyle(0x333333, 1);
    this.hpBar.fillRect(x, y, barW, barH);

    const ratio = Math.max(0, this.hp / this.maxHp);
    const color = ratio > 0.5 ? 0x66bb6a : ratio > 0.25 ? 0xffa726 : 0xff4444;
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(x, y, barW * ratio, barH);
  }

  destroy(): void {
    this.shootTimer?.destroy();
    this.slowTimer?.destroy();
    this.hpBar.destroy();
    this.sprite.destroy();
  }
}
