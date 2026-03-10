import { SaveManager } from '../utils/SaveManager';
import { HEROES } from '../data/GameData';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const save = SaveManager.load();

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, width, height);

    // Floating particles background
    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
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
          particle.x = Phaser.Math.Between(0, width);
          particle.y = height + 10;
          particle.alpha = Phaser.Math.FloatBetween(0.1, 0.3);
        },
      });
    }

    // Title
    this.add.text(width / 2, 120, 'ARCHERO', {
      fontSize: '52px',
      color: '#ffd54f',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(width / 2, 170, 'LEGENDS', {
      fontSize: '28px',
      color: '#ff6b6b',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Hero preview
    const hero = HEROES.find(h => h.id === save.selectedHero) || HEROES[0];
    const heroSprite = this.add.image(width / 2, 310, 'hero').setScale(3);
    heroSprite.setTint(hero.color);

    this.tweens.add({
      targets: heroSprite,
      y: 300,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.text(width / 2, 370, hero.name, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Stats display
    this.add.text(width / 2, 400, `Chapter ${save.highestChapter + 1} | Kills: ${save.totalKills}`, {
      fontSize: '14px',
      color: '#aaaaaa',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Currency display
    this.add.image(30, 40, 'coin').setScale(1.5);
    this.add.text(48, 40, `${save.gold}`, {
      fontSize: '16px',
      color: '#ffd700',
      fontFamily: 'Arial',
    }).setOrigin(0, 0.5);

    // Play button
    this.createButton(width / 2, 500, 200, 60, 'PLAY', 0x4ecdc4, () => {
      this.scene.start('GameScene');
    });

    // Hero Select button
    this.createButton(width / 2, 580, 200, 50, 'HEROES', 0x45b7d1, () => {
      this.scene.start('HeroSelectScene');
    });

    // Equipment button
    this.createButton(width / 2, 645, 200, 50, 'EQUIPMENT', 0xff6b6b, () => {
      this.scene.start('EquipmentScene');
    });

    // Version text
    this.add.text(width / 2, height - 30, 'v1.0.0', {
      fontSize: '12px',
      color: '#555555',
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

    const text = this.add.text(x, y, label, {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(x, y, w, h, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.tweens.add({
          targets: [bg, text],
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
    hitArea; // reference to prevent unused
  }
}
