const Character = require('./character');
const Rng = require('../core/Rng');
const { createRandomItem } = require('./items');

class Enemy extends Character {
  constructor(config = {}) {
    const rng = config.rng instanceof Rng ? config.rng : new Rng(config.seed);
    const baseHealth = config.health || rng.nextInt(90, 115);
    const baseStrength = config.strength || rng.nextInt(7, 13);
    const baseAgility = config.agility || rng.nextInt(6, 11);
    super(config.name || 'enemy', {
      rng,
      health: baseHealth,
      maxHealth: baseHealth,
      strength: baseStrength,
      agility: baseAgility
    });

    this.weapon = config.weapon || 'mace';
    this.aiProfile = config.aiProfile || 'aggressive';
    this.level = config.level || 1;
    this.maxHealth = config.maxHealth || this.health;
    this.attackMultiplier = config.attackMultiplier || 1;
    this.isBoss = config.isBoss || false;
    this.lootTable = config.lootTable || ['health', 'strength', 'agility'];
    this.xpReward =
      config.xpReward ||
      Math.floor((this.isBoss ? 55 : 25) + this.level * 10 + this.strength);
  }

  getDescription() {
    return `A ${this.name} holding a ${this.weapon} has appeared!`;
  }

  getLoot(rng) {
    const drop = this.isBoss
      ? createRandomItem(rng)
      : [createRandomItem(rng), createRandomItem(rng)];

    return Array.isArray(drop) ? drop : [drop];
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
      xpReward: this.xpReward
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
      xpReward: state.xpReward,
      statuses: state.statuses || []
    });
  }
}

module.exports = Enemy;
