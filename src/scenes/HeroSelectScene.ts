import { HEROES, HeroDefinition } from '../data/GameData';
import { SaveManager } from '../utils/SaveManager';

export class HeroSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private heroCards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'HeroSelectScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const save = SaveManager.getData();

    this.selectedIndex = HEROES.findIndex(h => h.id === save.selectedHero);
    if (this.selectedIndex < 0) this.selectedIndex = 0;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Title
    this.add.text(width / 2, 50, 'SELECT HERO', {
      fontSize: '28px',
      color: '#ffd54f',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Gold display
    this.add.image(30, 50, 'coin').setScale(1.5);
    this.add.text(48, 50, `${save.gold}`, {
      fontSize: '16px',
      color: '#ffd700',
      fontFamily: 'Arial',
    }).setOrigin(0, 0.5);

    // Hero cards
    this.heroCards = [];
    HEROES.forEach((hero, index) => {
      const card = this.createHeroCard(hero, index, save.unlockedHeroes.includes(hero.id));
      this.heroCards.push(card);
    });

    this.updateSelection();

    // Back button
    this.add.text(30, height - 50, '< Back', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MenuScene'));
  }

  private createHeroCard(hero: HeroDefinition, index: number, unlocked: boolean): Phaser.GameObjects.Container {
    const { width } = this.scale;
    const y = 140 + index * 150;
    const container = this.add.container(width / 2, y);

    const cardW = 340;
    const cardH = 130;

    // Card background
    const bg = this.add.graphics();
    bg.fillStyle(unlocked ? 0x263238 : 0x1c1c1c, 1);
    bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);
    bg.lineStyle(2, unlocked ? hero.color : 0x555555, 0.8);
    bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);
    container.add(bg);

    // Hero icon
    const icon = this.add.image(-cardW / 2 + 45, 0, 'hero')
      .setScale(2)
      .setTint(unlocked ? hero.color : 0x555555);
    container.add(icon);

    // Hero name
    const nameText = this.add.text(-cardW / 2 + 80, -cardH / 2 + 15, hero.name, {
      fontSize: '20px',
      color: unlocked ? '#ffffff' : '#888888',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    });
    container.add(nameText);

    // Description
    container.add(this.add.text(-cardW / 2 + 80, -cardH / 2 + 40, hero.description, {
      fontSize: '13px',
      color: '#aaaaaa',
      fontFamily: 'Arial',
    }));

    // Stats
    container.add(this.add.text(-cardW / 2 + 80, -cardH / 2 + 62, `HP: ${hero.baseHp}  ATK: ${hero.baseAttack}  SPD: ${hero.baseSpeed}`, {
      fontSize: '12px',
      color: '#4ecdc4',
      fontFamily: 'Arial',
    }));

    // Special ability
    container.add(this.add.text(-cardW / 2 + 80, -cardH / 2 + 82, hero.specialAbility, {
      fontSize: '12px',
      color: '#ffd54f',
      fontFamily: 'Arial',
    }));

    // Lock/cost overlay
    if (!unlocked) {
      container.add(this.add.text(-cardW / 2 + 80, -cardH / 2 + 102, `Cost: ${hero.unlockCost} gold`, {
        fontSize: '13px',
        color: '#ff6b6b',
        fontFamily: 'Arial',
      }));
    }

    // Make interactive
    const hitArea = this.add.rectangle(0, 0, cardW, cardH, 0xffffff, 0).setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerdown', () => {
      const save = SaveManager.getData();
      if (unlocked) {
        this.selectedIndex = index;
        SaveManager.selectHero(hero.id);
        this.updateSelection();
      } else if (save.gold >= hero.unlockCost) {
        save.gold -= hero.unlockCost;
        SaveManager.unlockHero(hero.id);
        SaveManager.selectHero(hero.id);
        SaveManager.save();
        this.scene.restart();
      }
    });

    return container;
  }

  private updateSelection(): void {
    this.heroCards.forEach((card, i) => {
      const scale = i === this.selectedIndex ? 1.05 : 1;
      this.tweens.add({
        targets: card,
        scaleX: scale,
        scaleY: scale,
        duration: 200,
        ease: 'Back.easeOut',
      });
    });
  }
}
