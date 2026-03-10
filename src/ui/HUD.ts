import { getXpForLevel } from '../data/GameData';

export class HUD {
  scene: Phaser.Scene;
  private hpBar: Phaser.GameObjects.Graphics;
  private hpText: Phaser.GameObjects.Text;
  private xpBar: Phaser.GameObjects.Graphics;
  private levelText: Phaser.GameObjects.Text;
  private roomText: Phaser.GameObjects.Text;
  private goldText: Phaser.GameObjects.Text;
  private shieldBar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width } = scene.scale;

    // HP Bar
    this.hpBar = scene.add.graphics().setDepth(50);
    scene.add.image(25, 55, 'heart').setScale(0.9).setDepth(50);
    this.hpText = scene.add.text(45, 55, '', {
      fontSize: '13px',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0, 0.5).setDepth(50);

    // Shield bar
    this.shieldBar = scene.add.graphics().setDepth(50);

    // XP Bar
    this.xpBar = scene.add.graphics().setDepth(50);

    // Level
    this.levelText = scene.add.text(width / 2, 55, '', {
      fontSize: '14px',
      color: '#ffd54f',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(50);

    // Room info
    this.roomText = scene.add.text(width / 2, 75, '', {
      fontSize: '12px',
      color: '#aaaaaa',
      fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(50);

    // Gold
    scene.add.image(width - 70, 55, 'coin').setScale(0.9).setDepth(50);
    this.goldText = scene.add.text(width - 55, 55, '0', {
      fontSize: '13px',
      color: '#ffd700',
      fontFamily: 'Arial',
    }).setOrigin(0, 0.5).setDepth(50);
  }

  update(): void {
    const gameScene = this.scene as any;
    const player = gameScene.player;
    if (!player) return;

    const { width } = this.scene.scale;

    // HP Bar
    this.hpBar.clear();
    const hpBarW = 140;
    const hpBarH = 10;
    const hpBarX = 15;
    const hpBarY = 68;

    // Background
    this.hpBar.fillStyle(0x333333, 1);
    this.hpBar.fillRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 4);

    // Fill
    const hpRatio = Math.max(0, player.hp / player.maxHp);
    const hpColor = hpRatio > 0.5 ? 0x66bb6a : hpRatio > 0.25 ? 0xffa726 : 0xff4444;
    this.hpBar.fillStyle(hpColor, 1);
    this.hpBar.fillRoundedRect(hpBarX, hpBarY, hpBarW * hpRatio, hpBarH, 4);

    this.hpText.setText(`${player.hp}/${player.maxHp}`);

    // Shield bar
    this.shieldBar.clear();
    if (player.maxShield > 0) {
      const shieldRatio = player.shield / player.maxShield;
      this.shieldBar.fillStyle(0x42a5f5, 0.5);
      this.shieldBar.fillRoundedRect(hpBarX, hpBarY + hpBarH + 2, hpBarW * shieldRatio, 4, 2);
    }

    // XP Bar
    this.xpBar.clear();
    const xpBarW = width - 30;
    const xpBarH = 6;
    const xpBarX = 15;
    const xpBarY = 90;
    const xpNeeded = getXpForLevel(player.level);
    const xpRatio = Math.min(1, player.xp / xpNeeded);

    this.xpBar.fillStyle(0x333333, 1);
    this.xpBar.fillRoundedRect(xpBarX, xpBarY, xpBarW, xpBarH, 3);
    this.xpBar.fillStyle(0x00e5ff, 1);
    this.xpBar.fillRoundedRect(xpBarX, xpBarY, xpBarW * xpRatio, xpBarH, 3);

    // Level
    this.levelText.setText(`Lv ${player.level}`);

    // Room
    this.roomText.setText(`Chapter ${gameScene.chapter + 1} - Room ${gameScene.room + 1}`);

    // Gold
    this.goldText.setText(`${gameScene.goldEarned}`);
  }

  destroy(): void {
    this.hpBar.destroy();
    this.hpText.destroy();
    this.xpBar.destroy();
    this.levelText.destroy();
    this.roomText.destroy();
    this.goldText.destroy();
    this.shieldBar.destroy();
  }
}
