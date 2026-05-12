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
    this.inventory = [createItem('health'), createItem('health')];
    this.passive = profile.passive || '';
    this.classStats = {
      critChance: profile.critChance,
      dodgeBonus: profile.dodgeBonus,
      critMultiplier: profile.critMultiplier,
      attackMultiplier: profile.damageMultiplier || profile.magicMultiplier || 1
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
      level: this.level,
      xp: this.xp,
      xpToNext: this.xpToNext
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
      (slot) =>
        slot.id === normalized.id &&
        slot.type === 'potion' &&
        Boolean(slot.stackable)
    );

    if (existing) {
      existing.quantity += normalized.quantity || 1;
      return;
    }

    this.inventory.push(normalized);
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

  toSave() {
    return {
      ...super.toSave(),
      className: this.className,
      level: this.level,
      xp: this.xp,
      xpToNext: this.xpToNext,
      inventory: this.inventory.map((item) => ({ ...item })),
      classStats: { ...this.classStats },
      passive: this.passive
    };
  }

  static fromSave(state, rng) {
    const player = new Player(
      state.name,
      state.className || 'warrior',
      rng || new Rng()
    );

    player.health = state.health;
    player.maxHealth = state.maxHealth;
    player.strength = state.strength;
    player.agility = state.agility;
    player.level = state.level;
    player.xp = state.xp;
    player.xpToNext = state.xpToNext || player.xpToNext;
    player.className = state.className || player.className;
    player.classStats = state.classStats || player.classStats;
    player.passive = state.passive || player.passive;
    player.inventory = (state.inventory || []).map((item) => ({ ...item }));
    player.statuses = (state.statuses || []).map((status) => ({ ...status }));

    return player;
  }
}

module.exports = Player;
