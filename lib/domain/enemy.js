const Character = require('./character');
const Rng = require('../core/Rng');
const { createItem, createRandomItem } = require('./items');

class Enemy extends Character {
  constructor(config = {}) {
    const rng = config.rng instanceof Rng ? config.rng : new Rng(config.seed);
    const baseHealth = Number.isFinite(config.health) ? config.health : rng.nextInt(90, 115);
    const baseStrength = Number.isFinite(config.strength) ? config.strength : rng.nextInt(7, 13);
    const baseAgility = Number.isFinite(config.agility) ? config.agility : rng.nextInt(6, 11);
    super(config.name || 'enemy', {
      rng,
      health: baseHealth,
      maxHealth: Number.isFinite(config.maxHealth) ? config.maxHealth : baseHealth,
      strength: baseStrength,
      agility: baseAgility,
      statuses: config.statuses || [],
      attackMultiplier: config.attackMultiplier,
    });

    this.weapon = config.weapon || 'mace';
    this.aiProfile = config.aiProfile || 'aggressive';
    this.level = config.level || 1;
    this.isBoss = config.isBoss || false;
    this.lootTable = config.lootTable || ['health', 'strength', 'agility'];
    this.goldReward = Number.isFinite(config.goldReward)
      ? config.goldReward
      : Math.floor((this.isBoss ? 35 : 14) + this.level * 5 + this.strength);
    this.xpReward =
      config.xpReward || Math.floor((this.isBoss ? 55 : 25) + this.level * 10 + this.strength);
  }

  getDescription() {
    return `A ${this.name} holding a ${this.weapon} has appeared!`;
  }

  getLoot(rng) {
    if (this.isBoss) {
      return [createItem('defender'), createRandomItem(rng)];
    }

    return [createRandomItem(rng), createRandomItem(rng)];
  }

  toSave() {
    return {
      ...super.toSave(),
      name: this.name,
      weapon: this.weapon,
      aiProfile: this.aiProfile,
      level: this.level,
      isBoss: this.isBoss,
      lootTable: this.lootTable,
      goldReward: this.goldReward,
      xpReward: this.xpReward,
    };
  }

  static fromSave(state, rng) {
    return new Enemy({
      name: state.name,
      rng: rng,
      health: state.health,
      maxHealth: state.maxHealth,
      strength: state.strength,
      agility: state.agility,
      weapon: state.weapon,
      aiProfile: state.aiProfile,
      level: state.level,
      isBoss: state.isBoss,
      lootTable: state.lootTable,
      goldReward: state.goldReward,
      xpReward: state.xpReward,
      statuses: state.statuses || [],
    });
  }
}

module.exports = Enemy;
