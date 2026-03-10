import { AssetGenerator } from '../utils/AssetGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Generate all procedural textures
    AssetGenerator.generate(this);

    // Loading text
    const text = this.add.text(195, 400, 'Loading...', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Animate loading
    this.tweens.add({
      targets: text,
      alpha: { from: 1, to: 0.3 },
      duration: 500,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.scene.start('MenuScene');
      },
    });
  }
}
