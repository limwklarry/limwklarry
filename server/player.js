const { SKILLS, xpForLevel, levelForXp } = require('../shared/constants');
const { ITEMS } = require('../shared/items');

class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.x = 41;
    this.y = 46;
    this.hp = 10;
    this.maxHp = 10;
    this.combatStyle = 'melee';
    this.selectedSpell = 'wind_strike';

    // Skills
    this.skills = {};
    for (const skill of Object.values(SKILLS)) {
      this.skills[skill] = { xp: 0, level: 1 };
    }
    this.skills.hitpoints = { xp: xpForLevel(10), level: 10 };

    // Inventory (28 slots like RS)
    this.inventory = new Array(28).fill(null);
    // Give starter items
    this.addItem('bronze_sword', 1);
    this.addItem('bronze_shield', 1);
    this.addItem('shrimp', 5);
    this.addItem('coins', 50);

    // Equipment slots
    this.equipment = {
      head: null,
      body: null,
      legs: null,
      weapon: null,
      shield: null,
      ammo: null
    };

    // Bank (much larger storage)
    this.bank = [];

    // Quests
    this.quests = {};
    this.questPoints = 0;

    // Combat state
    this.inCombat = false;
    this.combatTarget = null;
    this.combatTargetType = null;
    this.lastAttackTick = 0;

    // Skilling state
    this.skilling = null;

    // Movement
    this.path = [];
    this.moving = false;
  }

  addItem(itemId, quantity = 1) {
    const itemDef = ITEMS[itemId];
    if (!itemDef) return false;

    if (itemDef.stackable) {
      // Find existing stack
      const existingIdx = this.inventory.findIndex(
        slot => slot && slot.id === itemId
      );
      if (existingIdx >= 0) {
        this.inventory[existingIdx].quantity += quantity;
        return true;
      }
    }

    // Find empty slot
    for (let i = 0; i < 28; i++) {
      if (this.inventory[i] === null) {
        this.inventory[i] = { id: itemId, quantity };
        return true;
      }
    }
    return false; // Inventory full
  }

  removeItem(itemId, quantity = 1) {
    for (let i = 0; i < 28; i++) {
      if (this.inventory[i] && this.inventory[i].id === itemId) {
        if (this.inventory[i].quantity <= quantity) {
          this.inventory[i] = null;
        } else {
          this.inventory[i].quantity -= quantity;
        }
        return true;
      }
    }
    return false;
  }

  hasItem(itemId, quantity = 1) {
    let count = 0;
    for (let i = 0; i < 28; i++) {
      if (this.inventory[i] && this.inventory[i].id === itemId) {
        count += this.inventory[i].quantity;
      }
    }
    return count >= quantity;
  }

  countItem(itemId) {
    let count = 0;
    for (let i = 0; i < 28; i++) {
      if (this.inventory[i] && this.inventory[i].id === itemId) {
        count += this.inventory[i].quantity;
      }
    }
    return count;
  }

  addXp(skill, amount) {
    if (!this.skills[skill]) return null;
    const oldLevel = this.skills[skill].level;
    this.skills[skill].xp += amount;
    this.skills[skill].level = levelForXp(this.skills[skill].xp);
    const newLevel = this.skills[skill].level;

    if (skill === 'hitpoints' && newLevel > oldLevel) {
      this.maxHp = newLevel;
      this.hp = Math.min(this.hp + (newLevel - oldLevel), this.maxHp);
    }

    if (newLevel > oldLevel) {
      return { skill, oldLevel, newLevel };
    }
    return null;
  }

  getCombatLevel() {
    const base = 0.25 * (this.skills.defence.level + this.skills.hitpoints.level + Math.floor(this.skills.prayer.level / 2));
    const melee = 0.325 * (this.skills.attack.level + this.skills.strength.level);
    const ranged = 0.325 * Math.floor(this.skills.ranged.level * 1.5);
    const magic = 0.325 * Math.floor(this.skills.magic.level * 1.5);
    return Math.floor(base + Math.max(melee, ranged, magic));
  }

  getAttackBonus() {
    let bonus = 0;
    for (const slot of Object.values(this.equipment)) {
      if (slot) {
        const item = ITEMS[slot.id];
        if (item && item.attackBonus) bonus += item.attackBonus;
      }
    }
    return bonus;
  }

  getStrengthBonus() {
    let bonus = 0;
    for (const slot of Object.values(this.equipment)) {
      if (slot) {
        const item = ITEMS[slot.id];
        if (item && item.strengthBonus) bonus += item.strengthBonus;
      }
    }
    return bonus;
  }

  getDefenceBonus() {
    let bonus = 0;
    for (const slot of Object.values(this.equipment)) {
      if (slot) {
        const item = ITEMS[slot.id];
        if (item && item.defenceBonus) bonus += item.defenceBonus;
      }
    }
    return bonus;
  }

  getMagicBonus() {
    let bonus = 0;
    for (const slot of Object.values(this.equipment)) {
      if (slot) {
        const item = ITEMS[slot.id];
        if (item && item.magicBonus) bonus += item.magicBonus;
      }
    }
    return bonus;
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      x: this.x,
      y: this.y,
      hp: this.hp,
      maxHp: this.maxHp,
      combatLevel: this.getCombatLevel(),
      skills: this.skills,
      equipment: this.equipment,
      combatStyle: this.combatStyle,
      questPoints: this.questPoints
    };
  }

  serializeInventory() {
    return {
      inventory: this.inventory,
      coins: this.countItem('coins')
    };
  }
}

module.exports = Player;
