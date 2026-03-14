import {
  WeaponDefinition,
  SkillDefinition,
  BASE_PLAYER_STATS,
  UpgradeEffect,
  GAME_WIDTH,
  GAME_HEIGHT,
} from '../data/GameData';

export class Player {
  sprite: Phaser.Physics.Arcade.Sprite;
  scene: Phaser.Scene;

  // Equipped loadout
  weapon!: WeaponDefinition;
  skill!: SkillDefinition;

  // Base stats
  maxHp: number;
  hp: number;
  maxMp: number;
  mp: number;
  hpRegen: number;
  mpRegen: number;
  armor: number;
  lifesteal: number;
  critChance: number;
  critDamage: number;
  damageMult: number;
  attackSpeedMult: number;
  moveSpeedMult: number;
  rangeMult: number;
  projectileBonus: number;
  baseSpeed: number;

  // Computed
  speed: number;

  // Weapon upgrade bonuses (from shop)
  weaponDamageBonus = 0;
  weaponSpeedBonus = 0;
  weaponRangeBonus = 0;

  // Temp buffs
  damageBuff = 0;
  damageBuff_timer = 0;
  defenseBuff = 0;
  defenseBuff_timer = 0;

  // Glacier buff
  glacierBuff = false;

  // State
  level = 1;
  xp = 0;
  invincible = false;
  facingAngle = 0;
  killCount = 0;

  // Skill cooldown state
  skillCooldownEnd = 0;
  skillReady = true;

  // Regen accumulator
  private regenAccum = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    this.sprite = scene.physics.add.sprite(x, y, 'hero');
    this.sprite.setScale(1.2);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(10);
    this.sprite.body?.setSize(24, 24);

    // Initialize base stats
    this.maxHp = BASE_PLAYER_STATS.maxHp;
    this.hp = this.maxHp;
    this.maxMp = BASE_PLAYER_STATS.maxMp;
    this.mp = this.maxMp;
    this.hpRegen = BASE_PLAYER_STATS.hpRegen;
    this.mpRegen = BASE_PLAYER_STATS.mpRegen;
    this.armor = BASE_PLAYER_STATS.armor;
    this.lifesteal = BASE_PLAYER_STATS.lifesteal;
    this.critChance = BASE_PLAYER_STATS.critChance;
    this.critDamage = BASE_PLAYER_STATS.critDamage;
    this.damageMult = BASE_PLAYER_STATS.damageMult;
    this.attackSpeedMult = BASE_PLAYER_STATS.attackSpeedMult;
    this.moveSpeedMult = BASE_PLAYER_STATS.moveSpeedMult;
    this.rangeMult = BASE_PLAYER_STATS.rangeMult;
    this.projectileBonus = BASE_PLAYER_STATS.projectileBonus;
    this.baseSpeed = BASE_PLAYER_STATS.baseSpeed;
    this.speed = this.baseSpeed;
  }

  setLoadout(weapon: WeaponDefinition, skill: SkillDefinition): void {
    this.weapon = weapon;
    this.skill = skill;
  }

  getEffectiveAttackDamage(): number {
    const base = this.weapon.baseDamage + this.weaponDamageBonus;
    let mult = this.damageMult;
    if (this.damageBuff > 0) mult += 0.2;
    if (this.glacierBuff) mult += 0.25;
    return Math.floor(base * mult);
  }

  getEffectiveAttackSpeed(): number {
    let mult = this.attackSpeedMult + this.weaponSpeedBonus;
    if (this.glacierBuff) mult += 0.3;
    return Math.floor(this.weapon.attackSpeed / mult);
  }

  getEffectiveRange(): number {
    let mult = this.rangeMult + this.weaponRangeBonus;
    if (this.glacierBuff) mult += 0.2;
    return Math.floor(this.weapon.range * mult);
  }

  getEffectiveArmor(): number {
    return this.armor + (this.defenseBuff > 0 ? 5 : 0);
  }

  canUseSkill(time: number): boolean {
    return this.mp >= this.skill.mpCost && time >= this.skillCooldownEnd;
  }

  useSkill(time: number): boolean {
    if (!this.canUseSkill(time)) return false;
    this.mp -= this.skill.mpCost;
    this.skillCooldownEnd = time + this.skill.cooldown;
    this.skillReady = false;
    return true;
  }

  getSkillCooldownPercent(time: number): number {
    if (time >= this.skillCooldownEnd) return 1;
    const elapsed = this.skill.cooldown - (this.skillCooldownEnd - time);
    return Math.max(0, elapsed / this.skill.cooldown);
  }

  applyUpgrades(effects: UpgradeEffect[]): void {
    // Reset to base
    this.damageMult = BASE_PLAYER_STATS.damageMult;
    this.attackSpeedMult = BASE_PLAYER_STATS.attackSpeedMult;
    this.moveSpeedMult = BASE_PLAYER_STATS.moveSpeedMult;
    this.rangeMult = BASE_PLAYER_STATS.rangeMult;
    this.projectileBonus = BASE_PLAYER_STATS.projectileBonus;
    this.lifesteal = BASE_PLAYER_STATS.lifesteal;
    this.armor = BASE_PLAYER_STATS.armor;
    this.hpRegen = BASE_PLAYER_STATS.hpRegen;
    this.critChance = BASE_PLAYER_STATS.critChance;
    this.critDamage = BASE_PLAYER_STATS.critDamage;
    this.mpRegen = BASE_PLAYER_STATS.mpRegen;

    let maxHpBonus = 0;
    let maxMpBonus = 0;

    for (const eff of effects) {
      if (eff.damageMult) this.damageMult = eff.damageMult;
      if (eff.attackSpeedMult) this.attackSpeedMult = eff.attackSpeedMult;
      if (eff.speedMult) this.moveSpeedMult = eff.speedMult;
      if (eff.projectileBonus) this.projectileBonus += eff.projectileBonus;
      if (eff.lifestealPercent) this.lifesteal += eff.lifestealPercent;
      if (eff.armorBonus) this.armor += eff.armorBonus;
      if (eff.hpRegenBonus) this.hpRegen += eff.hpRegenBonus;
      if (eff.maxHpBonus) maxHpBonus += eff.maxHpBonus;
      if (eff.mpRegenBonus) this.mpRegen += eff.mpRegenBonus;
      if (eff.maxMpBonus) maxMpBonus += eff.maxMpBonus;
      if (eff.critDamageBonus) this.critDamage += eff.critDamageBonus;
      if (eff.critChanceBonus) this.critChance += eff.critChanceBonus;
    }

    const oldMaxHp = this.maxHp;
    this.maxHp = BASE_PLAYER_STATS.maxHp + maxHpBonus;
    if (this.maxHp > oldMaxHp) this.hp += (this.maxHp - oldMaxHp);
    this.hp = Math.min(this.hp, this.maxHp);

    const oldMaxMp = this.maxMp;
    this.maxMp = BASE_PLAYER_STATS.maxMp + maxMpBonus;
    if (this.maxMp > oldMaxMp) this.mp += (this.maxMp - oldMaxMp);
    this.mp = Math.min(this.mp, this.maxMp);

    this.speed = Math.floor(this.baseSpeed * this.moveSpeedMult);
  }

  takeDamage(amount: number): boolean {
    if (this.invincible) return false;

    const reduced = Math.max(1, amount - this.getEffectiveArmor());
    this.hp -= reduced;
    this.showFloatingText(`-${reduced}`, '#ff4444');

    // Flash + invincibility
    this.invincible = true;
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.sprite.active) this.sprite.setTint(0x4ecdc4);
    });
    this.scene.time.delayedCall(400, () => {
      this.invincible = false;
    });

    return this.hp <= 0;
  }

  heal(amount: number): void {
    const actual = Math.min(amount, this.maxHp - this.hp);
    if (actual <= 0) return;
    this.hp += actual;
    this.showFloatingText(`+${actual}`, '#66bb6a');
  }

  restoreMana(amount: number): void {
    this.mp = Math.min(this.mp + amount, this.maxMp);
  }

  update(delta: number, time: number): void {
    // Regen HP and MP
    this.regenAccum += delta / 1000;
    if (this.regenAccum >= 1) {
      this.regenAccum -= 1;
      if (this.hp < this.maxHp) {
        this.hp = Math.min(this.hp + this.hpRegen, this.maxHp);
      }
      if (this.mp < this.maxMp) {
        this.mp = Math.min(this.mp + this.mpRegen, this.maxMp);
      }
    }

    // Update skill readiness
    if (!this.skillReady && time >= this.skillCooldownEnd) {
      this.skillReady = true;
    }

    // Expire buffs
    if (this.damageBuff > 0 && time > this.damageBuff_timer) {
      this.damageBuff = 0;
    }
    if (this.defenseBuff > 0 && time > this.defenseBuff_timer) {
      this.defenseBuff = 0;
    }
  }

  showFloatingText(text: string, color: string): void {
    const ft = this.scene.add.text(
      this.sprite.x + Phaser.Math.Between(-10, 10),
      this.sprite.y - 30,
      text,
      {
        fontSize: '16px',
        color,
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5).setDepth(100);

    this.scene.tweens.add({
      targets: ft,
      y: ft.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => ft.destroy(),
    });
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
