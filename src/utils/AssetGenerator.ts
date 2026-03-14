export class AssetGenerator {
  static generate(scene: Phaser.Scene): void {
    this.generateHero(scene);
    this.generateArrow(scene);
    this.generateShuriken(scene);
    this.generateEnemyBullet(scene);
    this.generateParticle(scene);
    this.generateHeartIcon(scene);
    this.generateCoinIcon(scene);
    this.generateXpOrb(scene);
    this.generateWall(scene);
    this.generateFloor(scene);
  }

  private static generateHero(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x4ecdc4, 1);
    g.fillCircle(20, 22, 14);
    g.fillStyle(0x2d8a7e, 1);
    g.fillTriangle(8, 12, 20, 2, 32, 12);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(16, 20, 3);
    g.fillCircle(24, 20, 3);
    g.fillStyle(0x333333, 1);
    g.fillCircle(16, 20, 1.5);
    g.fillCircle(24, 20, 1.5);
    g.generateTexture('hero', 40, 40);
    g.destroy();
  }

  private static generateArrow(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffd54f, 1);
    g.fillRect(2, 5, 14, 2);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(16, 0, 22, 6, 16, 12);
    g.fillStyle(0xff6b6b, 1);
    g.fillTriangle(0, 2, 4, 6, 0, 10);
    g.generateTexture('arrow', 22, 12);
    g.destroy();
  }

  private static generateShuriken(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x90a4ae, 1);
    // Star shape
    g.fillTriangle(6, 0, 8, 4, 4, 4);
    g.fillTriangle(12, 4, 8, 6, 8, 2);
    g.fillTriangle(6, 12, 4, 8, 8, 8);
    g.fillTriangle(0, 6, 4, 4, 4, 8);
    g.fillStyle(0x607d8b, 1);
    g.fillCircle(6, 6, 2);
    g.generateTexture('shuriken', 12, 12);
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
    g.fillStyle(color, 1);
    g.fillCircle(size, size, size);
    g.fillStyle(0xff0000, 1);
    g.fillCircle(size - size * 0.25, size - size * 0.15, size * 0.15);
    g.fillCircle(size + size * 0.25, size - size * 0.15, size * 0.15);
    g.fillStyle(0x330000, 1);
    g.fillCircle(size - size * 0.2, size - size * 0.15, size * 0.08);
    g.fillCircle(size + size * 0.3, size - size * 0.15, size * 0.08);
    g.generateTexture(key, size * 2, size * 2);
    g.destroy();
  }

  static generateBossTexture(scene: Phaser.Scene, key: string, color: number, size: number): void {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(color, 1);
    g.fillCircle(size, size, size);
    g.fillStyle(0xffd700, 1);
    g.fillTriangle(size - size * 0.3, size * 0.3, size, -size * 0.2, size + size * 0.3, size * 0.3);
    g.fillStyle(0xffff00, 1);
    g.fillCircle(size - size * 0.3, size - size * 0.1, size * 0.18);
    g.fillCircle(size + size * 0.3, size - size * 0.1, size * 0.18);
    g.fillStyle(0x000000, 1);
    g.fillCircle(size - size * 0.25, size - size * 0.1, size * 0.09);
    g.fillCircle(size + size * 0.35, size - size * 0.1, size * 0.09);
    g.lineStyle(2, 0x000000, 1);
    g.beginPath();
    g.arc(size, size + size * 0.3, size * 0.3, 0, Math.PI, false);
    g.strokePath();
    g.generateTexture(key, size * 2, size * 2);
    g.destroy();
  }
}
