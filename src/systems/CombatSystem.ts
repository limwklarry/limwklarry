import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { GAME_WIDTH, GAME_HEIGHT } from '../data/GameData';

export class CombatSystem {
  scene: Phaser.Scene;
  player: Player;
  projectiles!: Phaser.Physics.Arcade.Group;
  private lastAttackTime = 0;

  // Melee arc visual
  private meleeArc: Phaser.GameObjects.Graphics | null = null;

  // Skill VFX
  glacierZone: { x: number; y: number; radius: number; endTime: number } | null = null;
  private glacierGraphics: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.projectiles = scene.physics.add.group({
      defaultKey: 'arrow',
      maxSize: 80,
    });
  }

  update(time: number, enemies: Enemy[], aimAngle: number): void {
    // Auto-attack constantly when enemies exist
    if (enemies.length > 0 && time - this.lastAttackTime >= this.player.getEffectiveAttackSpeed()) {
      // Aim at nearest enemy for auto-attack
      const nearest = this.findNearestEnemy(enemies);
      const attackAngle = nearest
        ? Math.atan2(nearest.sprite.y - this.player.sprite.y, nearest.sprite.x - this.player.sprite.x)
        : aimAngle;
      this.attack(attackAngle, enemies);
      this.lastAttackTime = time;
    }

    // Clean up off-screen projectiles
    this.projectiles.getChildren().forEach((proj) => {
      const p = proj as Phaser.Physics.Arcade.Sprite;
      if (p.active && (p.x < -30 || p.x > GAME_WIDTH + 30 || p.y < -30 || p.y > GAME_HEIGHT + 30)) {
        p.destroy();
      }
    });

    // Update glacier zone
    if (this.glacierZone) {
      if (time > this.glacierZone.endTime) {
        this.glacierZone = null;
        this.glacierGraphics?.destroy();
        this.glacierGraphics = null;
        this.player.glacierBuff = false;
      } else {
        // Check if player inside
        const dist = Phaser.Math.Distance.Between(
          this.player.sprite.x, this.player.sprite.y,
          this.glacierZone.x, this.glacierZone.y,
        );
        this.player.glacierBuff = dist <= this.glacierZone.radius;

        // Draw zone
        if (this.glacierGraphics) {
          this.glacierGraphics.clear();
          this.glacierGraphics.fillStyle(0x40c4ff, 0.12);
          this.glacierGraphics.fillCircle(this.glacierZone.x, this.glacierZone.y, this.glacierZone.radius);
          this.glacierGraphics.lineStyle(2, 0x40c4ff, 0.4);
          this.glacierGraphics.strokeCircle(this.glacierZone.x, this.glacierZone.y, this.glacierZone.radius);
        }
      }
    }
  }

  private attack(angle: number, enemies: Enemy[]): void {
    this.player.facingAngle = angle;

    if (this.player.weapon.type === 'melee') {
      this.meleeAttack(angle, enemies);
    } else {
      this.rangedAttack(angle);
    }
  }

  private meleeAttack(angle: number, enemies: Enemy[]): void {
    const range = this.player.getEffectiveRange();
    const arcHalf = Math.PI / 3; // 60 degree half-arc

    // Visual arc
    if (!this.meleeArc) {
      this.meleeArc = this.scene.add.graphics().setDepth(15);
    }
    this.meleeArc.clear();
    this.meleeArc.fillStyle(0xcccccc, 0.3);
    this.meleeArc.beginPath();
    this.meleeArc.moveTo(this.player.sprite.x, this.player.sprite.y);
    this.meleeArc.arc(
      this.player.sprite.x, this.player.sprite.y,
      range, angle - arcHalf, angle + arcHalf, false,
    );
    this.meleeArc.closePath();
    this.meleeArc.fillPath();

    this.scene.time.delayedCall(150, () => {
      this.meleeArc?.clear();
    });

    // Hit enemies in arc
    for (const enemy of enemies) {
      if (!enemy.sprite.active) continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y,
        enemy.sprite.x, enemy.sprite.y,
      );
      if (dist > range) continue;

      const enemyAngle = Math.atan2(
        enemy.sprite.y - this.player.sprite.y,
        enemy.sprite.x - this.player.sprite.x,
      );
      let angleDiff = enemyAngle - angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      if (Math.abs(angleDiff) <= arcHalf) {
        this.dealDamageToEnemy(enemy);
      }
    }
  }

  private rangedAttack(angle: number): void {
    // Main projectile
    this.fireProjectile(angle);

    // Extra projectiles from upgrades
    const extra = this.player.projectileBonus;
    for (let i = 0; i < extra; i++) {
      const spread = (i + 1) * 0.15;
      this.fireProjectile(angle + spread);
      this.fireProjectile(angle - spread);
    }
  }

  private fireProjectile(angle: number): void {
    const texKey = this.player.weapon.id === 'shuriken' ? 'shuriken' : 'arrow';
    const proj = this.projectiles.create(
      this.player.sprite.x, this.player.sprite.y, texKey,
    ) as Phaser.Physics.Arcade.Sprite;
    if (!proj) return;

    proj.setDepth(8);
    proj.setRotation(angle);
    const speed = this.player.weapon.projectileSpeed || 400;
    proj.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    const canPierce = this.player.weapon.id === 'shuriken' && this.player.projectileBonus > 0;
    proj.setData('piercing', canPierce);
    proj.setData('hitEnemies', []);

    this.scene.time.delayedCall(2000, () => {
      if (proj.active) proj.destroy();
    });
  }

  handleProjectileHit(proj: Phaser.Physics.Arcade.Sprite, enemySprite: Phaser.Physics.Arcade.Sprite): void {
    const enemy: Enemy = enemySprite.getData('enemy');
    if (!enemy) return;

    const hitEnemies: Enemy[] = proj.getData('hitEnemies') || [];
    if (hitEnemies.includes(enemy)) return;

    this.dealDamageToEnemy(enemy);

    hitEnemies.push(enemy);
    proj.setData('hitEnemies', hitEnemies);

    if (proj.getData('piercing')) return;

    proj.destroy();
  }

  private dealDamageToEnemy(enemy: Enemy): void {
    let damage = this.player.getEffectiveAttackDamage();
    const isCrit = Math.random() < this.player.critChance;
    if (isCrit) {
      damage = Math.floor(damage * this.player.critDamage);
    }

    const killed = enemy.takeDamage(damage, isCrit);

    // Lifesteal
    if (this.player.lifesteal > 0) {
      const heal = Math.floor(damage * this.player.lifesteal);
      if (heal > 0) this.player.heal(heal);
    }

    if (killed) {
      (this.scene as any).onEnemyKilled?.(enemy);
    }
  }

  private findNearestEnemy(enemies: Enemy[]): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = Infinity;
    for (const enemy of enemies) {
      if (!enemy.sprite.active) continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y,
        enemy.sprite.x, enemy.sprite.y,
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }
    return nearest;
  }

  // ============================================================
  // Special Skills
  // ============================================================
  useSkill(time: number, enemies: Enemy[]): void {
    if (!this.player.useSkill(time)) return;

    switch (this.player.skill.id) {
      case 'epicenter':
        this.skillEpicenter(enemies);
        break;
      case 'glacier':
        this.skillGlacier(time);
        break;
      case 'volcano':
        this.skillVolcano(enemies, time);
        break;
    }
  }

  private skillEpicenter(enemies: Enemy[]): void {
    const radius = 120;
    const damage = Math.floor(this.player.getEffectiveAttackDamage() * 1.5);

    // VFX: expanding ring
    const ring = this.scene.add.graphics().setDepth(20);
    let r = 10;
    const expand = this.scene.time.addEvent({
      delay: 16,
      repeat: 15,
      callback: () => {
        ring.clear();
        r += 7;
        ring.lineStyle(3, 0x7c4dff, 0.6 - r / 300);
        ring.strokeCircle(this.player.sprite.x, this.player.sprite.y, r);
      },
    });
    this.scene.time.delayedCall(300, () => ring.destroy());

    // Damage + slow nearby enemies
    for (const enemy of enemies) {
      if (!enemy.sprite.active) continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y,
        enemy.sprite.x, enemy.sprite.y,
      );
      if (dist <= radius) {
        const killed = enemy.takeDamage(damage, false);
        enemy.applySlow(3000);
        if (killed) {
          (this.scene as any).onEnemyKilled?.(enemy);
        }
      }
    }
  }

  private skillGlacier(time: number): void {
    const radius = 100;
    const duration = 6000;

    this.glacierZone = {
      x: this.player.sprite.x,
      y: this.player.sprite.y,
      radius,
      endTime: time + duration,
    };

    if (this.glacierGraphics) this.glacierGraphics.destroy();
    this.glacierGraphics = this.scene.add.graphics().setDepth(1);
  }

  private skillVolcano(enemies: Enemy[], time: number): void {
    const meteorCount = 6;
    const radius = 50;
    const damage = Math.floor(this.player.getEffectiveAttackDamage() * 2);

    for (let i = 0; i < meteorCount; i++) {
      const delay = Phaser.Math.Between(200, 1200);
      const mx = this.player.sprite.x + Phaser.Math.Between(-180, 180);
      const my = this.player.sprite.y + Phaser.Math.Between(-140, 140);

      // Warning indicator
      const warning = this.scene.add.graphics().setDepth(2);
      warning.lineStyle(2, 0xff6d00, 0.5);
      warning.strokeCircle(mx, my, radius);

      this.scene.time.delayedCall(delay + 500, () => {
        warning.destroy();
        // Impact VFX
        const impact = this.scene.add.graphics().setDepth(20);
        impact.fillStyle(0xff6d00, 0.4);
        impact.fillCircle(mx, my, radius);
        this.scene.time.delayedCall(200, () => impact.destroy());

        // Damage enemies in radius
        for (const enemy of enemies) {
          if (!enemy.sprite.active) continue;
          const dist = Phaser.Math.Distance.Between(mx, my, enemy.sprite.x, enemy.sprite.y);
          if (dist <= radius) {
            const killed = enemy.takeDamage(damage, false);
            if (killed) {
              (this.scene as any).onEnemyKilled?.(enemy);
            }
          }
        }
      });
    }
  }

  destroy(): void {
    this.projectiles.destroy(true);
    this.meleeArc?.destroy();
    this.glacierGraphics?.destroy();
  }
}
