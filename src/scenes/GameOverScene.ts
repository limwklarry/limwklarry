import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, loadSave } from '../constants';

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  create(data: { victory: boolean; stage: number; wave: number; gold: number; essence: number; kills: number }) {
    const cx = GAME_WIDTH / 2;
    const save = loadSave();

    const title = data.victory ? 'VICTORY!' : 'GAME OVER';
    const titleColor = data.victory ? '#44ff44' : '#ff4444';

    this.add.text(cx, 60, title, {
      fontSize: '36px', color: titleColor, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Run summary
    const style = { fontSize: '15px', color: '#cccccc', fontFamily: 'monospace' };
    const lines = [
      `Stage: ${data.stage + 1}`,
      `Wave: ${data.wave}/30`,
      `Gold Earned: ${data.gold}`,
      `Essence Earned: ${data.essence}`,
      `Kills: ${data.kills}`,
      '',
      `Gold Bank: ${save.goldBank}`,
      `Essence Bank: ${save.essenceBank}`,
      `Hero Level: ${save.heroLevel}`,
      `Best Stage: ${save.bestStage + 1}`,
    ];

    lines.forEach((line, i) => {
      this.add.text(cx, 130 + i * 26, line, style).setOrigin(0.5);
    });

    // Retry button
    const retryBtn = this.add.rectangle(cx - 100, 450, 160, 45, COLORS.player, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx - 100, 450, 'RETRY', {
      fontSize: '18px', color: '#1a1a2e', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    retryBtn.on('pointerdown', () => this.scene.start('GameScene'));

    // Menu button
    const menuBtn = this.add.rectangle(cx + 100, 450, 160, 45, 0x555577, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx + 100, 450, 'MENU', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
