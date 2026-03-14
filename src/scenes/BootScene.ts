import { AssetGenerator } from '../utils/AssetGenerator';
import { GAME_WIDTH, GAME_HEIGHT } from '../data/GameData';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    AssetGenerator.generate(this);

    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Loading...', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

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
