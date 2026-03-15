import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, CHAPTERS, BOSSES } from '../constants';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    // Loading bar
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    const barW = 300, barH = 20;
    const barX = (w - barW) / 2, barY = h / 2 + 40;
    const bg = this.add.rectangle(barX + barW / 2, barY + barH / 2, barW, barH, 0x333333);
    const fill = this.add.rectangle(barX + 2, barY + 2, 0, barH - 4, COLORS.player);
    fill.setOrigin(0, 0);
    this.add.text(w / 2, h / 2 - 20, 'ARCHERO ROGUELIKE', { fontSize: '28px', color: '#4ecdc4', fontFamily: 'monospace' }).setOrigin(0.5);
    this.add.text(w / 2, h / 2 + 10, 'Loading...', { fontSize: '14px', color: '#ffffff', fontFamily: 'monospace' }).setOrigin(0.5);

    this.load.on('progress', (v: number) => { fill.width = (barW - 4) * v; });
  }

  create() {
    this.generateTextures();
    this.scene.start('MenuScene');
  }

  private generateTextures() {
    // Player
    this.makeCircleTexture('player', 14, COLORS.player);
    // Enemies (will generate per-type at runtime, but we need generic ones)
    this.makeCircleTexture('enemy', 12, COLORS.enemy);
    this.makeCircleTexture('boss', 28, COLORS.boss);
    // Projectiles
    this.makeCircleTexture('projectile_player', 5, COLORS.player);
    this.makeCircleTexture('projectile_enemy', 4, COLORS.enemy);
    this.makeCircleTexture('shuriken', 6, 0xcccccc);
    this.makeCircleTexture('arrow', 5, 0xddaa44);
    // Pickups
    this.makeCircleTexture('pickup_gold', 6, COLORS.gold);
    this.makeCircleTexture('pickup_essence', 6, COLORS.essence);
    this.makeCircleTexture('pickup_hp', 6, COLORS.hpGreen);
    // Skill VFX
    this.makeCircleTexture('epicenter_ring', 120, COLORS.epicenter, true);
    this.makeCircleTexture('glacier_zone', 100, COLORS.glacier, true);
    this.makeCircleTexture('meteor', 20, COLORS.volcano);
    // Sword slash arc
    this.makeSwordArc();
    // Wall tile
    this.makeRectTexture('wall_tile', 32, 32, COLORS.wall);
    // Floor tile
    this.makeRectTexture('floor_tile', 32, 32, COLORS.floor);
    // Generate enemy textures for all chapters
    this.generateEnemyTextures();
    // Boss textures
    this.generateBossTextures();
    // Particle
    this.makeCircleTexture('particle', 3, COLORS.white);
  }

  private makeCircleTexture(key: string, radius: number, color: number, ring = false) {
    const g = this.make.graphics({ x: 0, y: 0 });
    if (ring) {
      g.lineStyle(3, color, 0.6);
      g.strokeCircle(radius, radius, radius - 2);
      g.fillStyle(color, 0.15);
      g.fillCircle(radius, radius, radius - 2);
    } else {
      g.fillStyle(color, 1);
      g.fillCircle(radius, radius, radius);
    }
    g.generateTexture(key, radius * 2, radius * 2);
    g.destroy();
  }

  private makeRectTexture(key: string, w: number, h: number, color: number) {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(color, 1);
    g.fillRect(0, 0, w, h);
    g.lineStyle(1, 0x333344, 0.3);
    g.strokeRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private makeSwordArc() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 0.7);
    g.slice(40, 40, 35, Phaser.Math.DegToRad(-30), Phaser.Math.DegToRad(30), false);
    g.fillPath();
    g.generateTexture('sword_arc', 80, 80);
    g.destroy();
  }

  private generateEnemyTextures() {
    for (const chapter of CHAPTERS) {
      for (const enemy of chapter.enemies) {
        const key = `enemy_${enemy.name.replace(/\s+/g, '_').toLowerCase()}`;
        this.makeCircleTexture(key, enemy.size, enemy.color);
      }
    }
  }

  private generateBossTextures() {
    for (const boss of BOSSES) {
      const key = `boss_${boss.name.replace(/\s+/g, '_').toLowerCase()}`;
      this.makeCircleTexture(key, boss.size, boss.color);
    }
  }
}
