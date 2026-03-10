import { SaveData, getDefaultSaveData } from '../data/GameData';

const SAVE_KEY = 'archero_save';

export class SaveManager {
  private static data: SaveData | null = null;

  static load(): SaveData {
    if (this.data) return this.data;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        this.data = { ...getDefaultSaveData(), ...JSON.parse(raw) };
      } else {
        this.data = getDefaultSaveData();
      }
    } catch {
      this.data = getDefaultSaveData();
    }
    return this.data!;
  }

  static save(): void {
    if (this.data) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    }
  }

  static getData(): SaveData {
    return this.load();
  }

  static addGold(amount: number): void {
    this.load().gold += amount;
    this.save();
  }

  static addGems(amount: number): void {
    this.load().gems += amount;
    this.save();
  }

  static unlockHero(heroId: string): boolean {
    const data = this.load();
    if (data.unlockedHeroes.includes(heroId)) return false;
    data.unlockedHeroes.push(heroId);
    this.save();
    return true;
  }

  static selectHero(heroId: string): void {
    this.load().selectedHero = heroId;
    this.save();
  }

  static equipItem(itemId: string, slot: string): void {
    this.load().equippedItems[slot] = itemId;
    this.save();
  }

  static addItem(itemId: string): void {
    const data = this.load();
    if (!data.ownedItems.includes(itemId)) {
      data.ownedItems.push(itemId);
      this.save();
    }
  }

  static updateProgress(chapter: number, room: number): void {
    const data = this.load();
    if (chapter > data.highestChapter || (chapter === data.highestChapter && room > data.highestRoom)) {
      data.highestChapter = chapter;
      data.highestRoom = room;
    }
    data.totalRuns++;
    this.save();
  }

  static addKills(count: number): void {
    this.load().totalKills += count;
    this.save();
  }

  static reset(): void {
    this.data = getDefaultSaveData();
    this.save();
  }
}
