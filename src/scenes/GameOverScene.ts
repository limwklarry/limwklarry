import { GAME_WIDTH, GAME_HEIGHT } from '../data/GameData';

interface GameOverData {
  stage: number;
  wave: number;
  gold: number;
  essence: number;
  kills: number;
  level: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f3460, 0x0f3460, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Death particles
    for (let i = 0; i < 15; i++) {
      const p = this.add.circle(
        GAME_WIDTH / 2 + Phaser.Math.Between(-150, 150),
        GAME_HEIGHT / 2 + Phaser.Math.Between(-100, 100),
        Phaser.Math.Between(2, 5),
        0xff4444,
        Phaser.Math.FloatBetween(0.3, 0.8),
      );
      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(100, 300),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 1000),
      });
    }

    // Title
    this.add.text(GAME_WIDTH / 2, 100, 'DEFEATED', {
      fontSize: '42px',
      color: '#ff4444',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Stats
    const statsY = 180;
    const sp = 45;
    this.createStatRow(GAME_WIDTH / 2, statsY, 'Stage', `${data.stage}`);
    this.createStatRow(GAME_WIDTH / 2, statsY + sp, 'Wave', `${data.wave}`);
    this.createStatRow(GAME_WIDTH / 2, statsY + sp * 2, 'Level', `${data.level}`);
    this.createStatRow(GAME_WIDTH / 2, statsY + sp * 3, 'Kills', `${data.kills}`);

    // Gold earned
    this.add.text(GAME_WIDTH / 2, statsY + sp * 4 + 10, `+${data.gold} Gold  +${data.essence} Essence`, {
      fontSize: '20px',
      color: '#ffd700',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Buttons
    this.createButton(GAME_WIDTH / 2, 480, 200, 55, 'RETRY (R)', 0x4ecdc4, () => {
      this.scene.start('GameScene');
    });

    this.createButton(GAME_WIDTH / 2, 550, 200, 50, 'MENU', 0x455a64, () => {
      this.scene.start('MenuScene');
    });

    // Listen for R key
    this.input.keyboard?.on('keydown-R', () => {
      this.scene.start('GameScene');
    });
  }

  private createStatRow(x: number, y: number, label: string, value: string): void {
    this.add.text(x - 80, y, label, {
      fontSize: '18px', color: '#aaaaaa', fontFamily: 'Arial',
    }).setOrigin(0, 0.5);
    this.add.text(x + 80, y, value, {
      fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(1, 0.5);
  }

  private createButton(
    x: number, y: number, w: number, h: number,
    label: string, color: number, callback: () => void,
  ): void {
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);

    this.add.text(x, y, label, {
      fontSize: '20px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.rectangle(x, y, w, h, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', callback);
  }
}
