import { ABILITIES, AbilityDefinition } from '../data/GameData';

interface LevelUpData {
  abilityLevels: Record<string, number>;
  playerLevel: number;
}

export class LevelUpScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelUpScene' });
  }

  create(data: LevelUpData): void {
    const { width, height } = this.scale;

    // Semi-transparent overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75).setDepth(0);

    // Title
    this.add.text(width / 2, 120, 'LEVEL UP!', {
      fontSize: '36px',
      color: '#ffd54f',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(1);

    this.add.text(width / 2, 160, `Level ${data.playerLevel}`, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(1);

    // Select 3 random abilities
    const choices = this.getAbilityChoices(data.abilityLevels);

    choices.forEach((ability, index) => {
      const currentLevel = data.abilityLevels[ability.id] || 0;
      this.createAbilityCard(ability, currentLevel, index, width, 230 + index * 170);
    });
  }

  private getAbilityChoices(currentLevels: Record<string, number>): AbilityDefinition[] {
    // Filter abilities that haven't reached max level
    const available = ABILITIES.filter(a => {
      const level = currentLevels[a.id] || 0;
      return level < a.maxLevel;
    });

    // Weighted random selection based on rarity
    const rarityWeights: Record<string, number> = {
      common: 4,
      rare: 3,
      epic: 2,
      legendary: 1,
    };

    const weighted = available.flatMap(a => {
      const weight = rarityWeights[a.rarity] || 1;
      return Array(weight).fill(a);
    });

    // Pick 3 unique abilities
    const choices: AbilityDefinition[] = [];
    const shuffled = Phaser.Utils.Array.Shuffle([...weighted]);

    for (const ability of shuffled) {
      if (choices.length >= 3) break;
      if (!choices.find(c => c.id === ability.id)) {
        choices.push(ability);
      }
    }

    // If not enough abilities available, fill with commons
    while (choices.length < 3 && available.length > choices.length) {
      const remaining = available.filter(a => !choices.find(c => c.id === a.id));
      if (remaining.length > 0) {
        choices.push(remaining[0]);
      } else break;
    }

    return choices;
  }

  private createAbilityCard(
    ability: AbilityDefinition,
    currentLevel: number,
    _index: number,
    centerX: number,
    y: number,
  ): void {
    const cardW = 320;
    const cardH = 140;

    const rarityColors: Record<string, number> = {
      common: 0x455a64,
      rare: 0x1565c0,
      epic: 0x6a1b9a,
      legendary: 0xff6f00,
    };

    const rarityTextColors: Record<string, string> = {
      common: '#90a4ae',
      rare: '#42a5f5',
      epic: '#ce93d8',
      legendary: '#ffb74d',
    };

    // Card background
    const bg = this.add.graphics().setDepth(1);
    bg.fillStyle(0x1e1e1e, 0.95);
    bg.fillRoundedRect(centerX - cardW / 2, y - cardH / 2, cardW, cardH, 12);
    bg.lineStyle(2, rarityColors[ability.rarity], 1);
    bg.strokeRoundedRect(centerX - cardW / 2, y - cardH / 2, cardW, cardH, 12);

    // Rarity label
    this.add.text(centerX - cardW / 2 + 15, y - cardH / 2 + 10, ability.rarity.toUpperCase(), {
      fontSize: '11px',
      color: rarityTextColors[ability.rarity],
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setDepth(2);

    // Ability name
    this.add.text(centerX - cardW / 2 + 15, y - cardH / 2 + 30, ability.name, {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setDepth(2);

    // Level indicator
    const nextLevel = currentLevel + 1;
    this.add.text(centerX + cardW / 2 - 15, y - cardH / 2 + 30, `Lv ${nextLevel}/${ability.maxLevel}`, {
      fontSize: '14px',
      color: '#aaaaaa',
      fontFamily: 'Arial',
    }).setOrigin(1, 0).setDepth(2);

    // Description
    const desc = ability.description.replace('{value}', `${nextLevel * 10}`);
    this.add.text(centerX - cardW / 2 + 15, y - cardH / 2 + 60, desc, {
      fontSize: '14px',
      color: '#cccccc',
      fontFamily: 'Arial',
      wordWrap: { width: cardW - 30 },
    }).setDepth(2);

    // Level pips
    for (let i = 0; i < ability.maxLevel; i++) {
      const pipX = centerX - cardW / 2 + 15 + i * 16;
      const pipY = y + cardH / 2 - 20;
      const pipColor = i < currentLevel ? 0x4ecdc4 : (i === currentLevel ? 0xffd54f : 0x555555);
      this.add.circle(pipX + 5, pipY, 5, pipColor).setDepth(2);
    }

    // Interactive area
    const hitArea = this.add.rectangle(centerX, y, cardW, cardH, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(3);

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2a2a2a, 0.95);
      bg.fillRoundedRect(centerX - cardW / 2, y - cardH / 2, cardW, cardH, 12);
      bg.lineStyle(3, rarityColors[ability.rarity], 1);
      bg.strokeRoundedRect(centerX - cardW / 2, y - cardH / 2, cardW, cardH, 12);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1e1e1e, 0.95);
      bg.fillRoundedRect(centerX - cardW / 2, y - cardH / 2, cardW, cardH, 12);
      bg.lineStyle(2, rarityColors[ability.rarity], 1);
      bg.strokeRoundedRect(centerX - cardW / 2, y - cardH / 2, cardW, cardH, 12);
    });

    hitArea.on('pointerdown', () => {
      // Apply ability and return to game
      const gameScene = this.scene.get('GameScene') as any;
      gameScene.applyAbilityChoice(ability.id);
      this.scene.stop();
    });
  }
}
