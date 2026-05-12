class Rng {
  constructor(seed) {
    this.seed(seed);
  }

  seed(value) {
    const numericSeed = Number(value);
    const resolvedSeed = Number.isNaN(numericSeed) ? Date.now() : numericSeed;
    const normalized = ((resolvedSeed % 2147483647) + 2147483647) % 2147483647;
    this.state = normalized || 123456789;
    this.initialSeed = this.state;
    return this.state;
  }

  next() {
    this.state = (this.state * 16807) % 2147483647;
    return this.state / 2147483647;
  }

  nextInt(min, max) {
    const lower = Math.min(min, max);
    const upper = Math.max(min, max);
    return Math.floor(this.next() * (upper - lower + 1)) + lower;
  }

  chance(percent) {
    if (percent <= 0) {
      return false;
    }

    if (percent >= 100) {
      return true;
    }

    return this.next() < percent / 100;
  }

  sample(collection) {
    if (!Array.isArray(collection) || collection.length === 0) {
      return undefined;
    }

    const index = this.nextInt(0, collection.length - 1);
    return collection[index];
  }

  snapshot() {
    return {
      state: this.state,
      initialSeed: this.initialSeed
    };
  }

  restore(snapshot = {}) {
    if (Number.isFinite(snapshot.state)) {
      this.state = snapshot.state;
    }

    if (Number.isFinite(snapshot.initialSeed)) {
      this.initialSeed = snapshot.initialSeed;
    }

    if (!Number.isFinite(this.state)) {
      this.state = this.initialSeed || 123456789;
    }

    return this.state;
  }
}

module.exports = Rng;
