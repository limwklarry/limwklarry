import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, loadSave, heroXpForLevel } from '../constants';

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const cx = GAME_WIDTH / 2;
    const save = loadSave();

    this.add.text(cx, 80, 'ARCHERO', {
      fontSize: '48px', color: '#4ecdc4', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 130, 'ROGUELIKE', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Hero stats preview
    const statsY = 200;
    const statsStyle = { fontSize: '14px', color: '#aaaaaa', fontFamily: 'monospace' };
    this.add.text(cx, statsY, `Hero Level: ${save.heroLevel}`, statsStyle).setOrigin(0.5);
    this.add.text(cx, statsY + 22, `XP: ${save.heroXp} / ${heroXpForLevel(save.heroLevel)}`, statsStyle).setOrigin(0.5);
    this.add.text(cx, statsY + 44, `Gold Bank: ${save.goldBank}  |  Essence: ${save.essenceBank}`, statsStyle).setOrigin(0.5);
    this.add.text(cx, statsY + 66, `Best Stage: ${save.bestStage}`, statsStyle).setOrigin(0.5);

    // Player preview
    if (this.textures.exists('player')) {
      this.add.image(cx, statsY + 120, 'player').setScale(2);
    }

    // Play button
    const btnY = 440;
    const btn = this.add.rectangle(cx, btnY, 200, 50, COLORS.player, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, btnY, 'PLAY', {
      fontSize: '22px', color: '#1a1a2e', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(COLORS.player, 1));
    btn.on('pointerout', () => btn.setFillStyle(COLORS.player, 0.9));
    btn.on('pointerdown', () => this.scene.start('GameScene'));

    // Controls info
    this.add.text(cx, 530, 'WASD: Move  |  Auto-Attack  |  Right-Click: Skill', {
      fontSize: '12px', color: '#666666', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(cx, 555, 'ESC: Pause  |  I/P/O/H: Panels  |  R: Restart (dead)', {
      fontSize: '12px', color: '#666666', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }
}
