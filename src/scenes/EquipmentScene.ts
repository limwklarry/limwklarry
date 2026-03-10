import { EQUIPMENT, EquipmentDefinition } from '../data/GameData';
import { SaveManager } from '../utils/SaveManager';

export class EquipmentScene extends Phaser.Scene {
  private selectedSlot: string | null = null;

  constructor() {
    super({ key: 'EquipmentScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const save = SaveManager.getData();

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Title
    this.add.text(width / 2, 50, 'EQUIPMENT', {
      fontSize: '28px',
      color: '#ffd54f',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Equipment slots
    const slots = ['weapon', 'armor', 'ring', 'pendant'];
    const slotNames = ['Weapon', 'Armor', 'Ring', 'Pendant'];
    const slotColors = [0xff6b6b, 0x4ecdc4, 0xffd54f, 0xce93d8];

    slots.forEach((slot, index) => {
      const y = 120 + index * 160;
      const equippedId = save.equippedItems[slot];
      const equipped = equippedId ? EQUIPMENT.find(e => e.id === equippedId) : null;

      // Slot header
      this.add.text(30, y, slotNames[index], {
        fontSize: '18px',
        color: '#aaaaaa',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      });

      // Equipped item
      if (equipped) {
        this.createEquipmentCard(equipped, 30, y + 30, width - 60, 50, true);
      } else {
        this.add.text(30, y + 30, 'None equipped', {
          fontSize: '14px',
          color: '#555555',
          fontFamily: 'Arial',
        });
      }

      // Available items for this slot
      const available = EQUIPMENT.filter(
        e => e.slot === slot && save.ownedItems.includes(e.id) && e.id !== equippedId,
      );

      available.forEach((item, itemIndex) => {
        this.createEquipmentCard(item, 30, y + 65 + itemIndex * 40, width - 60, 35, false);
      });
    });

    // Shop: random equipment for sale
    this.add.text(width / 2, height - 200, '── SHOP ──', {
      fontSize: '16px',
      color: '#ffd54f',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    const unowned = EQUIPMENT.filter(e => !save.ownedItems.includes(e.id));
    const shopItems = Phaser.Utils.Array.Shuffle([...unowned]).slice(0, 2);

    shopItems.forEach((item, i) => {
      const y = height - 160 + i * 55;
      const cost = this.getItemCost(item);

      const bg = this.add.graphics();
      bg.fillStyle(0x263238, 1);
      bg.fillRoundedRect(25, y - 20, width - 50, 45, 8);
      bg.lineStyle(1, item.color, 0.5);
      bg.strokeRoundedRect(25, y - 20, width - 50, 45, 8);

      this.add.text(35, y - 5, `${item.name} (${item.rarity})`, {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'Arial',
      });

      const buyBtn = this.add.text(width - 45, y - 5, `${cost}g`, {
        fontSize: '14px',
        color: save.gold >= cost ? '#ffd700' : '#ff4444',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

      buyBtn.on('pointerdown', () => {
        if (save.gold >= cost) {
          save.gold -= cost;
          SaveManager.addItem(item.id);
          SaveManager.save();
          this.scene.restart();
        }
      });
    });

    // Back button
    this.add.text(30, height - 50, '< Back', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MenuScene'));
  }

  private createEquipmentCard(
    item: EquipmentDefinition,
    x: number, y: number,
    w: number, h: number,
    isEquipped: boolean,
  ): void {
    const bg = this.add.graphics();
    bg.fillStyle(isEquipped ? 0x37474f : 0x263238, 1);
    bg.fillRoundedRect(x, y - h / 2, w, h, 6);

    if (isEquipped) {
      bg.lineStyle(1, item.color, 0.8);
      bg.strokeRoundedRect(x, y - h / 2, w, h, 6);
    }

    // Color dot
    this.add.circle(x + 15, y, 6, item.color);

    // Name
    this.add.text(x + 30, y - 8, item.name, {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial',
    });

    // Stats
    const stats = [];
    if (item.attackBonus > 0) stats.push(`+${item.attackBonus} ATK`);
    if (item.hpBonus > 0) stats.push(`+${item.hpBonus} HP`);
    if (item.specialEffect) stats.push(item.specialEffect);

    this.add.text(x + 30, y + 6, stats.join(' | '), {
      fontSize: '11px',
      color: '#aaaaaa',
      fontFamily: 'Arial',
    });

    // Make equippable if not currently equipped
    if (!isEquipped) {
      const hitArea = this.add.rectangle(x + w / 2, y, w, h, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });

      hitArea.on('pointerdown', () => {
        SaveManager.equipItem(item.id, item.slot);
        this.scene.restart();
      });
    }
  }

  private getItemCost(item: EquipmentDefinition): number {
    const rarityMultiplier: Record<string, number> = {
      common: 1,
      rare: 3,
      epic: 8,
      legendary: 20,
    };
    return (item.attackBonus + item.hpBonus + 10) * (rarityMultiplier[item.rarity] || 1);
  }
}
