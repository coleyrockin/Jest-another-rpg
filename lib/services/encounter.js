const Enemy = require('../domain/enemy');

const NORMAL_ENEMIES = [
  { name: 'goblin', weapon: 'sword', aiProfile: 'aggressive', health: 96, strength: 9, agility: 10 },
  { name: 'orc', weapon: 'baseball bat', aiProfile: 'opportunist', health: 105, strength: 10, agility: 9 },
  { name: 'skeleton', weapon: 'axe', aiProfile: 'tactical', health: 100, strength: 8, agility: 8 },
  { name: 'imp', weapon: 'mace', aiProfile: 'aggressive', health: 88, strength: 8, agility: 12 },
  { name: 'bandit', weapon: 'dagger', aiProfile: 'opportunist', health: 94, strength: 9, agility: 12 }
];

const BOSS_ENEMIES = [
  { name: 'dark knight', weapon: 'greatsword', aiProfile: 'tactical', health: 130, strength: 13, agility: 11, isBoss: true },
  { name: 'warlord', weapon: 'halberd', aiProfile: 'opportunist', health: 125, strength: 14, agility: 10, isBoss: true }
];

class EncounterService {
  constructor(rng) {
    this.rng = rng;
    this.maxEncounters = 6;
  }

  _pickTemplate(roundNumber, isBoss) {
    const pool = isBoss ? BOSS_ENEMIES : NORMAL_ENEMIES;
    const pick = this.rng.nextInt(0, pool.length - 1);
    return { ...pool[pick] };
  }

  nextEncounter(playerLevel, roundNumber) {
    const isBoss = roundNumber > 0 && roundNumber % 3 === 0;
    const template = this._pickTemplate(roundNumber, isBoss);
    const enemyLevel = Math.max(1, playerLevel + Math.floor(roundNumber / 3));
    const enemy = new Enemy({
      ...template,
      level: enemyLevel,
      health: template.health + Math.floor(enemyLevel * 5),
      strength: template.strength + Math.floor(enemyLevel * 0.8),
      agility: template.agility + Math.floor(enemyLevel * 0.4),
      rng: this.rng
    });

    return {
      encounterId: `${template.name}-${roundNumber}-${template.isBoss ? 'boss' : 'minion'}`,
      roundNumber,
      enemy,
      isBoss: template.isBoss || isBoss
    };
  }

  hydrateEncounter(state) {
    if (!state || !state.enemy) {
      return null;
    }

    return {
      encounterId: state.encounterId || `${state.enemy.name}-${state.roundNumber}`,
      roundNumber: state.roundNumber || 0,
      isBoss: state.isBoss || false,
      enemy: Enemy.fromSave(state.enemy, this.rng)
    };
  }

  serializeEncounter(encounter) {
    if (!encounter) {
      return null;
    }

    return {
      encounterId: encounter.encounterId,
      roundNumber: encounter.roundNumber,
      isBoss: encounter.isBoss,
      enemy: encounter.enemy.toSave()
    };
  }
}

module.exports = EncounterService;
