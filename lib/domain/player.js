const Character = require('./character');
const Rng = require('../core/Rng');
const { getClassProfile } = require('./classProfile');
const { createItem, applyItem } = require('./items');

class Player extends Character {
  constructor(name = '', className = 'warrior', rng = new Rng()) {
    const profile = getClassProfile(className);
    super(name, { rng });

    this.className = profile.id;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 55;
    this.gold = 0;
    this.unlockedLevel3 = false;
    this.unlockedLevel5 = false;
    this.inventory = [createItem('health'), createItem('health')];
    this.equipment = {
      weapon: null,
      armor: null,
      charm: null,
    };
    this.passive = profile.passive || '';
    this.classStats = {
      critChance: profile.critChance,
      dodgeBonus: profile.dodgeBonus,
      critMultiplier: profile.critMultiplier,
      attackMultiplier: profile.damageMultiplier || profile.magicMultiplier || 1,
    };

    this.maxHealth += profile.statBias.health;
    this.health = this.maxHealth;
    this.strength += profile.statBias.strength;
    this.agility += profile.statBias.agility;
  }

  getStats() {
    return {
      className: this.className,
      potions: this.inventory.length,
      health: this.health,
      strength: this.strength,
      agility: this.agility,
      gold: this.gold,
      equipment: this.getEquipmentSummary(),
      level: this.level,
      xp: this.xp,
      xpToNext: this.xpToNext,
    };
  }

  getInventory() {
    if (this.inventory.length === 0) {
      return false;
    }

    return this.inventory;
  }

  addItem(item) {
    const normalized = typeof item === 'string' ? createItem(item) : { ...item };
    const existing = this.inventory.find(
      (slot) => slot.id === normalized.id && slot.type === 'potion' && Boolean(slot.stackable)
    );

    if (existing) {
      existing.quantity += normalized.quantity || 1;
      return;
    }

    this.inventory.push(normalized);
  }

  addGold(amount) {
    const value = Math.max(0, Math.floor(Number(amount) || 0));
    this.gold += value;
    return value;
  }

  spendGold(amount) {
    const value = Math.max(0, Math.floor(Number(amount) || 0));
    if (this.gold < value) {
      return false;
    }

    this.gold -= value;
    return true;
  }

  addPotion(potion) {
    this.addItem(potion);
  }

  usePotion(index) {
    const item = this.inventory[index];
    if (!item) {
      return null;
    }

    const result = applyItem(item, this);
    if (!result.changed) {
      return { item, result: null };
    }

    if (item.stackable && item.quantity > 1) {
      item.quantity -= 1;
    } else {
      this.inventory.splice(index, 1);
    }

    return { item, result };
  }

  getClassPower() {
    return this.classStats;
  }

  getEquipmentSummary() {
    return Object.fromEntries(
      Object.entries(this.equipment).map(([slot, item]) => [slot, item ? item.name : 'empty'])
    );
  }

  getEquipmentDefense() {
    return Object.values(this.equipment).reduce((total, item) => {
      if (!item || !item.modifiers) {
        return total;
      }

      return total + (item.modifiers.defense || 0);
    }, 0);
  }

  getGoldMultiplier() {
    return Object.values(this.equipment).reduce((total, item) => {
      if (!item || !item.modifiers) {
        return total;
      }

      return total + (item.modifiers.goldMultiplier || 0);
    }, 1);
  }

  getEquippableInventory() {
    return this.inventory
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item && item.type === 'equipment');
  }

  getConsumableInventory() {
    return this.inventory
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item && item.category === 'consumable');
  }

  equipItem(index) {
    const item = this.inventory[index];
    if (!item || item.type !== 'equipment' || !item.slot) {
      return { equipped: false, message: 'No equipment available for that slot.' };
    }

    this.inventory.splice(index, 1);
    const previous = this.equipment[item.slot];

    if (previous) {
      this._applyEquipmentModifiers(previous, -1);
      this.inventory.push(previous);
    }

    this.equipment[item.slot] = item;
    this._applyEquipmentModifiers(item, 1);

    return {
      equipped: true,
      item,
      previous,
      message: previous
        ? `Equipped ${item.name}; ${previous.name} returned to inventory.`
        : `Equipped ${item.name}.`,
    };
  }

  _applyEquipmentModifiers(item, direction) {
    const modifiers = item.modifiers || {};
    this.strength += (modifiers.strength || 0) * direction;
    this.agility += (modifiers.agility || 0) * direction;
    this.maxHealth += (modifiers.maxHealth || 0) * direction;
    this.health = Math.min(this.maxHealth, this.health + Math.max(0, (modifiers.maxHealth || 0) * direction));

    if (this.health < 1) {
      this.health = 1;
    }
  }

  toSave() {
    return {
      ...super.toSave(),
      className: this.className,
      level: this.level,
      xp: this.xp,
      xpToNext: this.xpToNext,
      gold: this.gold,
      inventory: this.inventory.map((item) => ({ ...item })),
      equipment: Object.fromEntries(
        Object.entries(this.equipment).map(([slot, item]) => [slot, item ? { ...item } : null])
      ),
      classStats: { ...this.classStats },
      passive: this.passive,
      unlockedLevel3: this.unlockedLevel3,
      unlockedLevel5: this.unlockedLevel5,
    };
  }

  static fromSave(state, rng) {
    const player = new Player(state.name, state.className || 'warrior', rng || new Rng());

    player.health = state.health;
    player.maxHealth = state.maxHealth;
    player.strength = state.strength;
    player.agility = state.agility;
    player.level = state.level;
    player.xp = state.xp;
    player.gold = Number.isFinite(state.gold) ? state.gold : 0;
    player.xpToNext = state.xpToNext || player.xpToNext;
    player.className = state.className || player.className;
    player.classStats = state.classStats || player.classStats;
    player.passive = state.passive || player.passive;
    player.unlockedLevel3 = Boolean(state.unlockedLevel3);
    player.unlockedLevel5 = Boolean(state.unlockedLevel5);
    player.inventory = (state.inventory || []).map((item) => ({ ...item }));
    player.equipment = {
      weapon: state.equipment?.weapon || null,
      armor: state.equipment?.armor || null,
      charm: state.equipment?.charm || null,
    };
    player.statuses = (state.statuses || []).map((status) => ({ ...status }));

    return player;
  }
}

module.exports = Player;
