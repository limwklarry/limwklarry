interface GameOverData {
  chapter: number;
  room: number;
  gold: number;
  kills: number;
  level: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    const { width, height } = this.scale;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f3460, 0x0f3460, 1);
    bg.fillRect(0, 0, width, height);

    // Death effect particles
    for (let i = 0; i < 15; i++) {
      const p = this.add.circle(
        width / 2 + Phaser.Math.Between(-100, 100),
        height / 2 + Phaser.Math.Between(-100, 100),
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
    this.add.text(width / 2, 120, 'DEFEATED', {
      fontSize: '42px',
      color: '#ff4444',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Stats container
    const statsY = 220;
    const statSpacing = 50;

    this.createStatRow(width / 2, statsY, 'Chapter', `${data.chapter + 1}`);
    this.createStatRow(width / 2, statsY + statSpacing, 'Room', `${data.room + 1}`);
    this.createStatRow(width / 2, statsY + statSpacing * 2, 'Level', `${data.level}`);
    this.createStatRow(width / 2, statsY + statSpacing * 3, 'Kills', `${data.kills}`);

    // Gold earned (highlighted)
    this.add.image(width / 2 - 60, statsY + statSpacing * 4 + 5, 'coin').setScale(2);
    this.add.text(width / 2 - 40, statsY + statSpacing * 4, `+${data.gold} Gold`, {
      fontSize: '24px',
      color: '#ffd700',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Buttons
    const btnY = 580;

    // Retry button
    this.createButton(width / 2, btnY, 200, 55, 'RETRY', 0x4ecdc4, () => {
      this.scene.start('GameScene');
    });

    // Menu button
    this.createButton(width / 2, btnY + 75, 200, 50, 'MENU', 0x455a64, () => {
      this.scene.start('MenuScene');
    });
  }

  private createStatRow(x: number, y: number, label: string, value: string): void {
    this.add.text(x - 80, y, label, {
      fontSize: '18px',
      color: '#aaaaaa',
      fontFamily: 'Arial',
    }).setOrigin(0, 0.5);

    this.add.text(x + 80, y, value, {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
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
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.rectangle(x, y, w, h, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', callback);
  }
}
