// Procedural asset generation using Phaser Graphics
// Creates all game sprites at runtime (no external assets needed)

export class AssetGenerator {
  static generate(scene: Phaser.Scene): void {
    this.generateHero(scene);
    this.generateArrow(scene);
    this.generateEnemyBullet(scene);
    this.generateParticle(scene);
    this.generateJoystickBase(scene);
    this.generateJoystickThumb(scene);
    this.generateHeartIcon(scene);
    this.generateCoinIcon(scene);
    this.generateXpOrb(scene);
    this.generateChest(scene);
    this.generateShield(scene);
    this.generateOrbital(scene);
    this.generateDoor(scene);
    this.generateWall(scene);
    this.generateFloor(scene);
  }

  private static generateHero(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    // Body
    g.fillStyle(0x4ecdc4, 1);
    g.fillCircle(20, 22, 14);
    // Hood/cape
    g.fillStyle(0x2d8a7e, 1);
    g.fillTriangle(8, 12, 20, 2, 32, 12);
    // Eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(16, 20, 3);
    g.fillCircle(24, 20, 3);
    g.fillStyle(0x333333, 1);
    g.fillCircle(16, 20, 1.5);
    g.fillCircle(24, 20, 1.5);
    // Bow
    g.lineStyle(2, 0x8d6e63, 1);
    g.beginPath();
    g.arc(34, 22, 10, -1.2, 1.2, false);
    g.strokePath();
    g.lineStyle(1, 0xffd54f, 1);
    g.lineBetween(34, 12, 34, 32);
    g.generateTexture('hero', 40, 40);
    g.destroy();
  }

  private static generateArrow(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    // Arrow shaft
    g.fillStyle(0xffd54f, 1);
    g.fillRect(2, 5, 14, 2);
    // Arrow head
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(16, 0, 22, 6, 16, 12);
    // Fletching
    g.fillStyle(0xff6b6b, 1);
    g.fillTriangle(0, 2, 4, 6, 0, 10);
    g.generateTexture('arrow', 22, 12);
    g.destroy();
  }

  private static generateEnemyBullet(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xff4444, 1);
    g.fillCircle(6, 6, 5);
    g.fillStyle(0xff8888, 0.6);
    g.fillCircle(4, 4, 2);
    g.generateTexture('enemy_bullet', 12, 12);
    g.destroy();
  }

  private static generateParticle(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle', 8, 8);
    g.destroy();
  }

  private static generateJoystickBase(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 0.15);
    g.fillCircle(60, 60, 60);
    g.lineStyle(2, 0xffffff, 0.3);
    g.strokeCircle(60, 60, 60);
    g.generateTexture('joystick_base', 120, 120);
    g.destroy();
  }

  private static generateJoystickThumb(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(25, 25, 25);
    g.lineStyle(2, 0xffffff, 0.6);
    g.strokeCircle(25, 25, 25);
    g.generateTexture('joystick_thumb', 50, 50);
    g.destroy();
  }

  private static generateHeartIcon(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xff4444, 1);
    g.fillCircle(6, 5, 5);
    g.fillCircle(14, 5, 5);
    g.fillTriangle(1, 7, 19, 7, 10, 18);
    g.generateTexture('heart', 20, 20);
    g.destroy();
  }

  private static generateCoinIcon(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffd700, 1);
    g.fillCircle(8, 8, 8);
    g.fillStyle(0xffaa00, 1);
    g.fillCircle(8, 8, 5);
    g.fillStyle(0xffd700, 1);
    g.fillCircle(8, 8, 3);
    g.generateTexture('coin', 16, 16);
    g.destroy();
  }

  private static generateXpOrb(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x00e5ff, 0.8);
    g.fillCircle(6, 6, 6);
    g.fillStyle(0x80ffff, 0.5);
    g.fillCircle(4, 4, 3);
    g.generateTexture('xp_orb', 12, 12);
    g.destroy();
  }

  private static generateChest(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x8d6e63, 1);
    g.fillRoundedRect(2, 8, 28, 18, 3);
    g.fillStyle(0xa1887f, 1);
    g.fillRoundedRect(2, 4, 28, 10, 3);
    g.fillStyle(0xffd700, 1);
    g.fillRect(14, 12, 4, 6);
    g.fillCircle(16, 12, 3);
    g.generateTexture('chest', 32, 28);
    g.destroy();
  }

  private static generateShield(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.lineStyle(2, 0x42a5f5, 0.6);
    g.strokeCircle(20, 20, 18);
    g.generateTexture('shield_effect', 40, 40);
    g.destroy();
  }

  private static generateOrbital(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xff9800, 1);
    g.fillCircle(6, 6, 5);
    g.fillStyle(0xffcc02, 0.7);
    g.fillCircle(4, 4, 2);
    g.generateTexture('orbital', 12, 12);
    g.destroy();
  }

  private static generateDoor(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x5d4037, 1);
    g.fillRoundedRect(0, 0, 60, 80, { tl: 20, tr: 20, bl: 0, br: 0 });
    g.fillStyle(0x8d6e63, 1);
    g.fillRoundedRect(5, 5, 50, 70, { tl: 18, tr: 18, bl: 0, br: 0 });
    g.fillStyle(0xffd700, 1);
    g.fillCircle(40, 45, 4);
    g.generateTexture('door', 60, 80);
    g.destroy();
  }

  private static generateWall(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x37474f, 1);
    g.fillRect(0, 0, 40, 40);
    g.fillStyle(0x455a64, 1);
    g.fillRect(1, 1, 18, 18);
    g.fillRect(21, 1, 18, 18);
    g.fillRect(10, 21, 18, 18);
    g.generateTexture('wall', 40, 40);
    g.destroy();
  }

  private static generateFloor(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x263238, 1);
    g.fillRect(0, 0, 40, 40);
    g.fillStyle(0x2c3940, 1);
    g.fillRect(0, 0, 20, 20);
    g.fillRect(20, 20, 20, 20);
    g.generateTexture('floor', 40, 40);
    g.destroy();
  }

  static generateEnemyTexture(scene: Phaser.Scene, key: string, color: number, size: number): void {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 });
    // Body
    g.fillStyle(color, 1);
    g.fillCircle(size, size, size);
    // Eyes
    g.fillStyle(0xff0000, 1);
    g.fillCircle(size - size * 0.25, size - size * 0.15, size * 0.15);
    g.fillCircle(size + size * 0.25, size - size * 0.15, size * 0.15);
    // Dark pupils
    g.fillStyle(0x330000, 1);
    g.fillCircle(size - size * 0.2, size - size * 0.15, size * 0.08);
    g.fillCircle(size + size * 0.3, size - size * 0.15, size * 0.08);
    g.generateTexture(key, size * 2, size * 2);
    g.destroy();
  }

  static generateBossTexture(scene: Phaser.Scene, key: string, color: number, size: number): void {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 });
    // Body
    g.fillStyle(color, 1);
    g.fillCircle(size, size, size);
    // Crown/horns
    g.fillStyle(0xffd700, 1);
    g.fillTriangle(size - size * 0.3, size * 0.3, size, -size * 0.2, size + size * 0.3, size * 0.3);
    // Eyes
    g.fillStyle(0xffff00, 1);
    g.fillCircle(size - size * 0.3, size - size * 0.1, size * 0.18);
    g.fillCircle(size + size * 0.3, size - size * 0.1, size * 0.18);
    g.fillStyle(0x000000, 1);
    g.fillCircle(size - size * 0.25, size - size * 0.1, size * 0.09);
    g.fillCircle(size + size * 0.35, size - size * 0.1, size * 0.09);
    // Mouth
    g.lineStyle(2, 0x000000, 1);
    g.beginPath();
    g.arc(size, size + size * 0.3, size * 0.3, 0, Math.PI, false);
    g.strokePath();
    g.generateTexture(key, size * 2, size * 2);
    g.destroy();
  }
}
