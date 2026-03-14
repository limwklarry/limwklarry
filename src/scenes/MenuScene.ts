import { SaveManager } from '../utils/SaveManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../data/GameData';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const save = SaveManager.load();

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Floating particles
    for (let i = 0; i < 30; i++) {
      const particle = this.add.circle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.Between(1, 3),
        0xffffff,
        Phaser.Math.FloatBetween(0.1, 0.3)
      );
      this.tweens.add({
        targets: particle,
        y: particle.y - Phaser.Math.Between(50, 150),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        repeat: -1,
        onRepeat: () => {
          particle.x = Phaser.Math.Between(0, GAME_WIDTH);
          particle.y = GAME_HEIGHT + 10;
          particle.alpha = Phaser.Math.FloatBetween(0.1, 0.3);
        },
      });
    }

    // Title
    this.add.text(GAME_WIDTH / 2, 140, 'ARCHERO', {
      fontSize: '56px',
      color: '#ffd54f',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 200, 'LEGENDS', {
      fontSize: '30px',
      color: '#ff6b6b',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Hero preview
    const heroSprite = this.add.image(GAME_WIDTH / 2, 310, 'hero').setScale(3);
    heroSprite.setTint(0x4ecdc4);
    this.tweens.add({
      targets: heroSprite,
      y: 300,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Stats
    this.add.text(GAME_WIDTH / 2, 370, `Hero Lv ${save.heroLevel} | Best Stage ${save.bestStage}`, {
      fontSize: '14px',
      color: '#aaaaaa',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 395, `Gold: ${save.goldBank}  Essence: ${save.essence}`, {
      fontSize: '14px',
      color: '#ffd700',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Play button
    this.createButton(GAME_WIDTH / 2, 470, 220, 60, 'PLAY', 0x4ecdc4, () => {
      this.scene.start('GameScene');
    });

    // Controls hint
    this.add.text(GAME_WIDTH / 2, 560, 'WASD to move | Mouse to aim | Click to attack | H for help', {
      fontSize: '12px',
      color: '#666666',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Version
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'v2.0.0', {
      fontSize: '11px',
      color: '#444444',
      fontFamily: 'Arial',
    }).setOrigin(0.5);
  }

  private createButton(
    x: number, y: number, w: number, h: number,
    label: string, color: number, callback: () => void
  ): void {
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    bg.lineStyle(2, 0xffffff, 0.3);
    bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);

    this.add.text(x, y, label, {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.rectangle(x, y, w, h, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.tweens.add({
          targets: [bg],
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 80,
          yoyo: true,
          onComplete: callback,
        });
      })
      .on('pointerover', () => {
        bg.clear();
        bg.fillStyle(color, 0.8);
        bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
        bg.lineStyle(2, 0xffffff, 0.5);
        bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
      })
      .on('pointerout', () => {
        bg.clear();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
        bg.lineStyle(2, 0xffffff, 0.3);
        bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
      });
  }
}
