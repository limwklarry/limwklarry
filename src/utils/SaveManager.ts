import { SaveData, getDefaultSaveData } from '../data/GameData';

const SAVE_KEY = 'archero_save_v2';

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
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      } catch {
        // Storage full or unavailable
      }
    }
  }

  static getData(): SaveData {
    return this.load();
  }

  static addGold(amount: number): void {
    this.load().goldBank += amount;
    this.save();
  }

  static addEssence(amount: number): void {
    this.load().essence += amount;
    this.save();
  }

  static reset(): void {
    this.data = getDefaultSaveData();
    this.save();
  }
}
