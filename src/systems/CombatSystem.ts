import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';

export class CombatSystem {
  scene: Phaser.Scene;
  player: Player;
  projectiles!: Phaser.Physics.Arcade.Group;
  private lastAttackTime = 0;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.projectiles = scene.physics.add.group({
      defaultKey: 'arrow',
      maxSize: 50,
    });
  }

  update(time: number, enemies: Enemy[]): void {
    // Auto-attack when not moving
    if (!this.player.isMoving && enemies.length > 0) {
      if (time - this.lastAttackTime >= this.player.attackSpeed) {
        this.attack(enemies);
        this.lastAttackTime = time;
      }
    }

    // Clean up projectiles that go off-screen
    this.projectiles.getChildren().forEach((proj) => {
      const p = proj as Phaser.Physics.Arcade.Sprite;
      if (p.active) {
        if (p.x < -20 || p.x > 410 || p.y < -20 || p.y > 864) {
          p.destroy();
        }
      }
    });

    // Check orbital collisions
    if (this.player.orbitals.length > 0) {
      this.checkOrbitalHits(enemies);
    }
  }

  private attack(enemies: Enemy[]): void {
    // Find nearest enemy
    const nearest = this.findNearestEnemy(enemies);
    if (!nearest) return;

    const baseAngle = Phaser.Math.Angle.Between(
      this.player.sprite.x, this.player.sprite.y,
      nearest.sprite.x, nearest.sprite.y,
    );

    this.player.facingAngle = baseAngle;

    // Fire main arrow
    this.fireArrow(baseAngle);

    // Multishot: additional arrows with slight spread
    if (this.player.multishot) {
      for (let i = 0; i < this.player.projectileCount; i++) {
        const spread = (i + 1) * 0.15;
        this.fireArrow(baseAngle + spread);
        this.fireArrow(baseAngle - spread);
      }
    }

    // Diagonal arrows
    if (this.player.diagonalArrows) {
      this.fireArrow(baseAngle + Math.PI / 4);
      this.fireArrow(baseAngle - Math.PI / 4);
    }

    // Rear arrow
    if (this.player.rearArrow) {
      this.fireArrow(baseAngle + Math.PI);
    }
  }

  private fireArrow(angle: number): void {
    const arrow = this.projectiles.create(
      this.player.sprite.x,
      this.player.sprite.y,
      'arrow',
    ) as Phaser.Physics.Arcade.Sprite;

    if (!arrow) return;

    arrow.setDepth(8);
    arrow.setRotation(angle);

    const speed = 400;
    arrow.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
    );

    // Store piercing/bouncing data
    arrow.setData('piercing', this.player.piercing);
    arrow.setData('bouncing', this.player.bouncing);
    arrow.setData('hitEnemies', []);

    // Auto-destroy after 2 seconds
    this.scene.time.delayedCall(2000, () => {
      if (arrow.active) arrow.destroy();
    });
  }

  handleProjectileHit(arrow: Phaser.Physics.Arcade.Sprite, enemySprite: Phaser.Physics.Arcade.Sprite): void {
    const enemy: Enemy = enemySprite.getData('enemy');
    if (!enemy) return;

    const hitEnemies: Enemy[] = arrow.getData('hitEnemies') || [];
    if (hitEnemies.includes(enemy)) return;

    // Calculate damage
    let damage = this.player.attack;
    const isCrit = Math.random() < this.player.critChance;
    if (isCrit) {
      damage = Math.floor(damage * this.player.critDamage);
    }

    const killed = enemy.takeDamage(damage, isCrit);

    // Life steal
    if (this.player.lifeSteal > 0) {
      const healAmount = Math.floor(damage * this.player.lifeSteal);
      if (healAmount > 0) this.player.heal(healAmount);
    }

    // Poison
    if (this.player.poisonDamage > 0) {
      enemy.applyPoison(this.player.poisonDamage);
    }

    // Freeze
    if (this.player.freezeChance > 0 && Math.random() < this.player.freezeChance) {
      enemy.applyFreeze(1500);
    }

    // Handle kill
    if (killed) {
      (this.scene as any).onEnemyKilled?.(enemy);
    }

    // Arrow behavior after hit
    hitEnemies.push(enemy);
    arrow.setData('hitEnemies', hitEnemies);

    if (arrow.getData('piercing')) {
      // Arrow continues through
      return;
    }

    if (arrow.getData('bouncing')) {
      // Bounce to nearest unhit enemy
      const nearestUnhit = this.findNearestEnemyExcluding(
        arrow.x, arrow.y,
        (this.scene as any).enemies || [],
        hitEnemies,
      );
      if (nearestUnhit) {
        const angle = Phaser.Math.Angle.Between(
          arrow.x, arrow.y,
          nearestUnhit.sprite.x, nearestUnhit.sprite.y,
        );
        arrow.setRotation(angle);
        arrow.setVelocity(
          Math.cos(angle) * 400,
          Math.sin(angle) * 400,
        );
        return;
      }
    }

    // Default: destroy arrow
    arrow.destroy();
  }

  private checkOrbitalHits(enemies: Enemy[]): void {
    for (const orb of this.player.orbitals) {
      for (const enemy of enemies) {
        if (!enemy.sprite.active) continue;
        const dist = Phaser.Math.Distance.Between(
          orb.x, orb.y,
          enemy.sprite.x, enemy.sprite.y,
        );
        if (dist < enemy.definition.size + 8) {
          const damage = Math.floor(this.player.attack * 0.5);
          const killed = enemy.takeDamage(damage, false);
          if (killed) {
            (this.scene as any).onEnemyKilled?.(enemy);
          }
        }
      }
    }
  }

  findNearestEnemy(enemies: Enemy[]): Enemy | null {
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

  private findNearestEnemyExcluding(
    x: number, y: number,
    enemies: Enemy[],
    exclude: Enemy[],
  ): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.sprite.active || exclude.includes(enemy)) continue;
      const dist = Phaser.Math.Distance.Between(x, y, enemy.sprite.x, enemy.sprite.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }
    return nearest;
  }

  destroy(): void {
    this.projectiles.destroy(true);
  }
}
