const Enemy = require('../domain/enemy');
const { DEFAULT_REGION_ID, getRegion } = require('../domain/region');

const REGION_ENEMIES = {
  [DEFAULT_REGION_ID]: [
    {
      name: 'goblin scout',
      weapon: 'short sword',
      aiProfile: 'aggressive',
      health: 92,
      strength: 8,
      agility: 11,
    },
    {
      name: 'road bandit',
      weapon: 'dagger',
      aiProfile: 'opportunist',
      health: 94,
      strength: 9,
      agility: 12,
    },
    { name: 'imp', weapon: 'mace', aiProfile: 'aggressive', health: 88, strength: 8, agility: 12 },
  ],
  'old-quarry': [
    {
      name: 'orc miner',
      weapon: 'baseball bat',
      aiProfile: 'opportunist',
      health: 108,
      strength: 11,
      agility: 8,
    },
    {
      name: 'quarry skeleton',
      weapon: 'axe',
      aiProfile: 'tactical',
      health: 103,
      strength: 9,
      agility: 8,
    },
    {
      name: 'stoneback brute',
      weapon: 'hammer',
      aiProfile: 'aggressive',
      health: 114,
      strength: 12,
      agility: 7,
    },
  ],
  'ashen-gate': [
    {
      name: 'ash raider',
      weapon: 'curved blade',
      aiProfile: 'opportunist',
      health: 116,
      strength: 12,
      agility: 12,
    },
    {
      name: 'gate sentinel',
      weapon: 'halberd',
      aiProfile: 'tactical',
      health: 120,
      strength: 12,
      agility: 10,
    },
    {
      name: 'ember fiend',
      weapon: 'burning claws',
      aiProfile: 'aggressive',
      health: 110,
      strength: 13,
      agility: 12,
    },
  ],
};

const REGION_BOSSES = {
  [DEFAULT_REGION_ID]: [
    {
      name: 'goblin outrider',
      weapon: 'hooked spear',
      aiProfile: 'opportunist',
      health: 124,
      strength: 12,
      agility: 13,
      isBoss: true,
    },
  ],
  'old-quarry': [
    {
      name: 'dark knight',
      weapon: 'greatsword',
      aiProfile: 'tactical',
      health: 136,
      strength: 14,
      agility: 10,
      isBoss: true,
    },
  ],
  'ashen-gate': [
    {
      name: 'ashen warlord',
      weapon: 'halberd',
      aiProfile: 'opportunist',
      health: 145,
      strength: 15,
      agility: 11,
      isBoss: true,
    },
  ],
};

class EncounterService {
  constructor(rng) {
    this.rng = rng;
    this.maxEncounters = 6;
  }

  _pickTemplate(roundNumber, isBoss, regionId) {
    const region = getRegion(regionId);
    const table = isBoss ? REGION_BOSSES : REGION_ENEMIES;
    const pool = table[region.id] || table[DEFAULT_REGION_ID];
    const pick = this.rng.nextInt(0, pool.length - 1);
    return { ...pool[pick] };
  }

  nextEncounter(playerLevel, roundNumber, regionId = DEFAULT_REGION_ID) {
    const isBoss = roundNumber > 0 && roundNumber % 3 === 0;
    const region = getRegion(regionId);
    const template = this._pickTemplate(roundNumber, isBoss, region.id);
    const enemyLevel = Math.max(1, playerLevel + Math.floor(roundNumber / 3));
    const enemy = new Enemy({
      ...template,
      level: enemyLevel,
      health: template.health + Math.floor(enemyLevel * 5),
      strength: template.strength + Math.floor(enemyLevel * 0.8),
      agility: template.agility + Math.floor(enemyLevel * 0.4),
      rng: this.rng,
    });

    return {
      encounterId: `${region.id}-${template.name}-${roundNumber}-${
        template.isBoss ? 'boss' : 'minion'
      }`,
      roundNumber,
      regionId: region.id,
      regionName: region.name,
      enemy,
      isBoss: template.isBoss || isBoss,
    };
  }

  hydrateEncounter(state) {
    if (!state || !state.enemy) {
      return null;
    }

    return {
      encounterId: state.encounterId || `${state.enemy.name}-${state.roundNumber}`,
      roundNumber: state.roundNumber || 0,
      regionId: state.regionId || DEFAULT_REGION_ID,
      regionName: state.regionName || getRegion(state.regionId).name,
      isBoss: state.isBoss || false,
      enemy: Enemy.fromSave(state.enemy, this.rng),
    };
  }

  serializeEncounter(encounter) {
    if (!encounter) {
      return null;
    }

    return {
      encounterId: encounter.encounterId,
      roundNumber: encounter.roundNumber,
      regionId: encounter.regionId || DEFAULT_REGION_ID,
      regionName: encounter.regionName || getRegion(encounter.regionId).name,
      isBoss: encounter.isBoss,
      enemy: encounter.enemy.toSave(),
    };
  }
}

module.exports = EncounterService;
