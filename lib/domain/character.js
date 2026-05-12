const Rng = require('../core/Rng');

class Character {
  constructor(name = '', options = {}) {
    const rng = options.rng instanceof Rng ? options.rng : new Rng(options.seed);

    this.rng = rng;
    this.name = name;
    this.health = Number.isFinite(options.health)
      ? options.health
      : rng.nextInt(95, 104);
    this.maxHealth = Number.isFinite(options.maxHealth)
      ? options.maxHealth
      : this.health;
    this.strength = Number.isFinite(options.strength)
      ? options.strength
      : rng.nextInt(7, 11);
    this.agility = Number.isFinite(options.agility)
      ? options.agility
      : rng.nextInt(7, 11);
    this.statuses = Array.isArray(options.statuses)
      ? options.statuses.map((status) => ({ ...status }))
      : [];
    this.attackMultiplier = Number.isFinite(options.attackMultiplier)
      ? options.attackMultiplier
      : 1;
  }

  isAlive() {
    return this.health > 0;
  }

  getHealth() {
    return `${this.name}'s health is now ${this.health}!`;
  }

  getAttackValue(multiplier = 1) {
    const min = Math.max(1, this.strength - 5);
    const max = this.strength + 5;
    return Math.floor(this.rng.nextInt(min, max) * multiplier);
  }

  reduceHealth(health) {
    const amount = Number(health) || 0;
    this.health -= amount;

    if (this.health < 0) {
      this.health = 0;
    }
  }

  heal(amount) {
    const add = Number(amount) || 0;
    this.health = Math.min(this.maxHealth, this.health + add);
  }

  addStatus(name, duration = 1, payload = {}) {
    if (!name || duration <= 0) {
      return;
    }

    const existing = this.statuses.find((status) => status.name === name);
    if (existing) {
      existing.duration = Math.max(existing.duration, duration);
      Object.assign(existing, payload);
      return;
    }

    this.statuses.push({ name, duration, ...payload });
  }

  removeStatus(name) {
    this.statuses = this.statuses.filter((status) => status.name !== name);
  }

  hasStatus(name) {
    return this.statuses.some((status) => status.name === name);
  }

  getStatus(name) {
    return this.statuses.find((status) => status.name === name);
  }

  decrementStatusDurations() {
    const expired = [];
    this.statuses = this.statuses.reduce((next, status) => {
      const remaining = status.duration - 1;
      if (remaining <= 0) {
        expired.push(status.name);
        return next;
      }

      next.push({ ...status, duration: remaining });
      return next;
    }, []);
    return expired;
  }

  applyPoisonTick() {
    const poison = this.getStatus('poisoned');
    if (!poison) {
      return 0;
    }

    const magnitude = poison.intensity || 1;
    const damage = Math.max(1, Math.floor(1.5 * magnitude));
    this.reduceHealth(damage);
    return damage;
  }

  toSave() {
    return {
      name: this.name,
      health: this.health,
      maxHealth: this.maxHealth,
      strength: this.strength,
      agility: this.agility,
      statuses: this.statuses.map((status) => ({ ...status })),
      attackMultiplier: this.attackMultiplier
    };
  }
}

module.exports = Character;
