import { HeroDefinition, AbilityEffect, EQUIPMENT, EquipmentDefinition } from '../data/GameData';
import { SaveManager } from '../utils/SaveManager';

export class Player {
  sprite: Phaser.Physics.Arcade.Sprite;
  scene: Phaser.Scene;

  // Base stats (from hero + equipment)
  maxHp: number;
  hp: number;
  baseAttack: number;
  baseSpeed: number;
  baseAttackSpeed: number;

  // Computed stats (after abilities)
  attack: number;
  speed: number;
  attackSpeed: number;
  critChance: number;
  critDamage: number;
  lifeSteal: number;
  shield: number;
  maxShield: number;

  // Ability flags
  piercing = false;
  bouncing = false;
  diagonalArrows = false;
  rearArrow = false;
  multishot = false;
  projectileCount = 0;
  poisonDamage = 0;
  freezeChance = 0;
  fireTrail = false;
  orbitalCount = 0;

  // State
  level = 1;
  xp = 0;
  invincible = false;
  facingAngle = -Math.PI / 2; // Facing up by default
  killCount = 0;
  isMoving = false;

  // Orbitals
  orbitals: Phaser.GameObjects.Sprite[] = [];
  orbitalAngle = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, heroDef: HeroDefinition) {
    this.scene = scene;

    // Create sprite
    this.sprite = scene.physics.add.sprite(x, y, 'hero');
    this.sprite.setScale(1.2);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setTint(heroDef.color);
    this.sprite.setDepth(10);
    this.sprite.body?.setSize(24, 24);

    // Apply base stats
    this.maxHp = heroDef.baseHp;
    this.baseAttack = heroDef.baseAttack;
    this.baseSpeed = heroDef.baseSpeed;
    this.baseAttackSpeed = heroDef.attackSpeed;

    // Apply equipment bonuses
    const save = SaveManager.getData();
    for (const slot of Object.keys(save.equippedItems)) {
      const itemId = save.equippedItems[slot];
      const item = EQUIPMENT.find((e: EquipmentDefinition) => e.id === itemId);
      if (item) {
        this.maxHp += item.hpBonus;
        this.baseAttack += item.attackBonus;
      }
    }

    // Apply hero special
    if (heroDef.id === 'knight') this.maxHp = Math.floor(this.maxHp * 1.3);
    if (heroDef.id === 'archer') this.baseAttackSpeed = Math.floor(this.baseAttackSpeed * 0.9);
    if (heroDef.id === 'ranger') this.piercing = true;

    this.hp = this.maxHp;
    this.attack = this.baseAttack;
    this.speed = this.baseSpeed;
    this.attackSpeed = this.baseAttackSpeed;
    this.critChance = 0.05;
    this.critDamage = 1.5;
    this.lifeSteal = 0;
    this.shield = 0;
    this.maxShield = 0;
  }

  applyAbilities(effects: AbilityEffect[]): void {
    // Reset computed stats
    let attackMult = 1;
    let speedMult = 1;
    let hpMult = 1;
    let asMult = 1;
    this.piercing = false;
    this.bouncing = false;
    this.diagonalArrows = false;
    this.rearArrow = false;
    this.multishot = false;
    this.projectileCount = 0;
    this.poisonDamage = 0;
    this.freezeChance = 0;
    this.fireTrail = false;
    this.orbitalCount = 0;
    this.critChance = 0.05;
    this.critDamage = 1.5;
    this.lifeSteal = 0;
    this.maxShield = 0;

    // Re-check hero specials
    const save = SaveManager.getData();
    const heroDef = (this.scene as any).heroDef;
    if (heroDef?.id === 'ranger') this.piercing = true;

    for (const effect of effects) {
      if (effect.attackBonus) attackMult += effect.attackBonus;
      if (effect.speedBonus) speedMult += effect.speedBonus;
      if (effect.hpBonus) hpMult += effect.hpBonus;
      if (effect.attackSpeedBonus) asMult += effect.attackSpeedBonus;
      if (effect.projectileCount) this.projectileCount += effect.projectileCount;
      if (effect.piercing) this.piercing = true;
      if (effect.bouncing) this.bouncing = true;
      if (effect.diagonalArrows) this.diagonalArrows = true;
      if (effect.rearArrow) this.rearArrow = true;
      if (effect.multishot) this.multishot = true;
      if (effect.critChance) this.critChance += effect.critChance;
      if (effect.critDamage) this.critDamage += effect.critDamage;
      if (effect.lifeSteal) this.lifeSteal += effect.lifeSteal;
      if (effect.shield) this.maxShield += effect.shield;
      if (effect.poisonDamage) this.poisonDamage += effect.poisonDamage;
      if (effect.freezeChance) this.freezeChance += effect.freezeChance;
      if (effect.fireTrail) this.fireTrail = true;
      if (effect.orbitalCount) this.orbitalCount += effect.orbitalCount;
    }

    this.attack = Math.floor(this.baseAttack * attackMult);
    this.speed = Math.floor(this.baseSpeed * speedMult);
    const oldMax = this.maxHp;
    this.maxHp = Math.floor((this.scene as any).heroDef?.baseHp * hpMult) || this.maxHp;
    // Re-add equipment
    for (const slot of Object.keys(save.equippedItems)) {
      const itemId = save.equippedItems[slot];
      const item = EQUIPMENT.find((e: EquipmentDefinition) => e.id === itemId);
      if (item) this.maxHp += item.hpBonus;
    }
    if (heroDef?.id === 'knight') this.maxHp = Math.floor(this.maxHp * 1.3);
    if (this.maxHp > oldMax) {
      this.hp += (this.maxHp - oldMax);
    }
    this.hp = Math.min(this.hp, this.maxHp);
    this.attackSpeed = Math.floor(this.baseAttackSpeed / asMult);
    this.shield = this.maxShield;

    this.updateOrbitals();
  }

  takeDamage(amount: number): boolean {
    if (this.invincible) return false;

    // Shield absorbs damage first
    if (this.shield > 0) {
      if (this.shield >= amount) {
        this.shield -= amount;
        this.showDamageNumber(0, true);
        return false;
      }
      amount -= this.shield;
      this.shield = 0;
    }

    this.hp -= amount;
    this.showDamageNumber(amount, false);

    // Flash effect
    this.invincible = true;
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.sprite.active) {
        this.sprite.clearTint();
        const heroDef = (this.scene as any).heroDef;
        if (heroDef) this.sprite.setTint(heroDef.color);
      }
    });
    this.scene.time.delayedCall(500, () => {
      this.invincible = false;
    });

    return this.hp <= 0;
  }

  heal(amount: number): void {
    this.hp = Math.min(this.hp + amount, this.maxHp);
    this.showHealNumber(amount);
  }

  private showDamageNumber(amount: number, shielded: boolean): void {
    const text = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 30,
      shielded ? 'BLOCKED' : `-${amount}`,
      {
        fontSize: '16px',
        color: shielded ? '#42a5f5' : '#ff4444',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5).setDepth(100);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
    });
  }

  private showHealNumber(amount: number): void {
    const text = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 30,
      `+${amount}`,
      {
        fontSize: '16px',
        color: '#66bb6a',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5).setDepth(100);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
    });
  }

  private updateOrbitals(): void {
    // Remove old orbitals
    this.orbitals.forEach(o => o.destroy());
    this.orbitals = [];

    for (let i = 0; i < this.orbitalCount; i++) {
      const orb = this.scene.add.sprite(0, 0, 'orbital').setDepth(11);
      this.orbitals.push(orb);
    }
  }

  update(): void {
    // Update orbital positions
    if (this.orbitals.length > 0) {
      this.orbitalAngle += 0.03;
      const radius = 45;
      this.orbitals.forEach((orb, i) => {
        const angle = this.orbitalAngle + (i * (Math.PI * 2) / this.orbitals.length);
        orb.x = this.sprite.x + Math.cos(angle) * radius;
        orb.y = this.sprite.y + Math.sin(angle) * radius;
      });
    }
  }

  destroy(): void {
    this.orbitals.forEach(o => o.destroy());
    this.sprite.destroy();
  }
}
