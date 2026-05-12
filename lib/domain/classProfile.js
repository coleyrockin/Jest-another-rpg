const CLASS_PROFILES = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    description: 'Melee specialist with steady crit potential and high base strength.',
    statBias: {
      strength: 2,
      health: 5,
      agility: 0,
    },
    critChance: 12,
    critMultiplier: 1.35,
    dodgeBonus: 4,
    damageMultiplier: 1.05,
    growth: {
      health: { min: 10, max: 16 },
      strength: { min: 3, max: 6 },
      agility: { min: 1, max: 2 },
    },
    passive: 'Brutal opening strike on critical hits grants +1 bonus damage.',
  },
  rogue: {
    id: 'rogue',
    name: 'Rogue',
    description: 'Agile fighter that avoids attacks and lands punishing counter blows.',
    statBias: {
      strength: 0,
      health: 0,
      agility: 2,
    },
    critChance: 9,
    critMultiplier: 1.2,
    dodgeBonus: 12,
    damageMultiplier: 1.0,
    growth: {
      health: { min: 8, max: 13 },
      strength: { min: 1, max: 3 },
      agility: { min: 3, max: 7 },
    },
    passive: 'Dodge streak gives +5% extra dodge during sustained combat.',
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    description: 'Balanced caster with higher attack scaling and burst moments.',
    statBias: {
      strength: 1,
      health: 2,
      agility: 0,
    },
    critChance: 10,
    critMultiplier: 1.25,
    dodgeBonus: 6,
    magicMultiplier: 1.15,
    damageMultiplier: 1.1,
    growth: {
      health: { min: 7, max: 12 },
      strength: { min: 2, max: 4 },
      agility: { min: 1, max: 3 },
    },
    passive: 'Every second turn, magic attacks gain +8% damage.',
  },
};

function normalizeClassName(inputClass) {
  if (!inputClass) {
    return 'warrior';
  }

  const normalized = String(inputClass).toLowerCase();
  if (CLASS_PROFILES[normalized]) {
    return normalized;
  }

  if (normalized.startsWith('war')) {
    return 'warrior';
  }

  if (normalized.startsWith('rog')) {
    return 'rogue';
  }

  if (normalized.startsWith('mag')) {
    return 'mage';
  }

  return 'warrior';
}

function getClassProfile(className = 'warrior') {
  return CLASS_PROFILES[normalizeClassName(className)];
}

function getClassOptions() {
  return Object.values(CLASS_PROFILES).map((profile) => ({
    value: profile.id,
    name: `${profile.name} - ${profile.description}`,
  }));
}

module.exports = {
  CLASS_PROFILES,
  normalizeClassName,
  getClassProfile,
  getClassOptions,
};
