function normalizeItemName(name) {
  if (!name) {
    return 'health';
  }

  const normalized = String(name).toLowerCase();
  if (ITEM_CATALOG[normalized]) {
    return normalized;
  }

  if (normalized.startsWith('str')) {
    return 'strength';
  }

  if (normalized.startsWith('agi')) {
    return 'agility';
  }

  if (normalized.startsWith('clean') || normalized.startsWith('cura')) {
    return 'cleanse';
  }

  return 'health';
}

const ITEM_CATALOG = {
  health: {
    id: 'health',
    name: 'Health Potion',
    type: 'potion',
    category: 'consumable',
    effect: 'health',
    value: 30,
    price: 12,
    quantity: 1,
    stackable: true,
    description: 'Restore health by 30 points',
  },
  strength: {
    id: 'strength',
    name: 'Strength Brew',
    type: 'potion',
    category: 'consumable',
    effect: 'strength',
    value: 3,
    price: 38,
    quantity: 1,
    stackable: true,
    description: 'Permanently increase strength by 3',
  },
  agility: {
    id: 'agility',
    name: 'Agility Brew',
    type: 'potion',
    category: 'consumable',
    effect: 'agility',
    value: 3,
    price: 38,
    quantity: 1,
    stackable: true,
    description: 'Permanently increase agility by 3',
  },
  cleanse: {
    id: 'cleanse',
    name: 'Purifying Tonic',
    type: 'potion',
    category: 'consumable',
    effect: 'cleanse',
    value: 0,
    price: 20,
    quantity: 1,
    stackable: true,
    description: 'Clear poison and stun effects',
  },
  defender: {
    id: 'defender',
    name: 'Defender Draught',
    type: 'potion',
    category: 'consumable',
    effect: 'defend',
    value: 2,
    price: 24,
    duration: 1,
    quantity: 1,
    stackable: true,
    description: 'Apply guarding stance for one enemy action',
  },
  iron_sword: {
    id: 'iron_sword',
    name: 'Iron Sword',
    type: 'equipment',
    category: 'equipment',
    slot: 'weapon',
    price: 45,
    modifiers: { strength: 2 },
    description: '+2 strength',
  },
  ember_staff: {
    id: 'ember_staff',
    name: 'Ember Staff',
    type: 'equipment',
    category: 'equipment',
    slot: 'weapon',
    price: 72,
    modifiers: { strength: 1, agility: 1 },
    description: '+1 strength, +1 agility',
  },
  traveler_cloak: {
    id: 'traveler_cloak',
    name: 'Traveler Cloak',
    type: 'equipment',
    category: 'equipment',
    slot: 'armor',
    price: 40,
    modifiers: { maxHealth: 8 },
    description: '+8 max HP',
  },
  quarry_plate: {
    id: 'quarry_plate',
    name: 'Quarry Plate',
    type: 'equipment',
    category: 'equipment',
    slot: 'armor',
    price: 68,
    modifiers: { maxHealth: 14, defense: 1 },
    description: '+14 max HP, -1 incoming damage',
  },
  lucky_charm: {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    type: 'equipment',
    category: 'equipment',
    slot: 'charm',
    price: 55,
    modifiers: { goldMultiplier: 0.15 },
    description: '+15% gold rewards',
  },
  scout_charm: {
    id: 'scout_charm',
    name: 'Scout Charm',
    type: 'equipment',
    category: 'equipment',
    slot: 'charm',
    price: 80,
    modifiers: { agility: 2, goldMultiplier: 0.1 },
    description: '+2 agility, +10% gold rewards',
  },
};

const LOOT_ROLLS = [
  { item: 'health', weight: 55 },
  { item: 'strength', weight: 20 },
  { item: 'agility', weight: 16 },
  { item: 'cleanse', weight: 7 },
  { item: 'defender', weight: 2 },
  { item: 'iron_sword', weight: 3 },
  { item: 'traveler_cloak', weight: 2 },
  { item: 'lucky_charm', weight: 1 },
];

function createItem(name = 'health') {
  const key = normalizeItemName(name);
  const base = ITEM_CATALOG[key];
  return { ...base };
}

function createRandomItem(rng) {
  const totalWeight = LOOT_ROLLS.reduce((total, entry) => total + entry.weight, 0);
  const roll = rng.nextInt(1, totalWeight);
  let cumulative = 0;

  for (const entry of LOOT_ROLLS) {
    cumulative += entry.weight;
    if (roll <= cumulative) {
      return createItem(entry.item);
    }
  }

  return createItem('health');
}

function applyItem(item, target) {
  if (!item || !target) {
    return { changed: false };
  }

  if (item.effect === 'health') {
    target.heal(item.value);
    return { changed: true, effect: 'health', value: item.value };
  }

  if (item.effect === 'strength') {
    target.strength += item.value;
    return { changed: true, effect: 'strength', value: item.value };
  }

  if (item.effect === 'agility') {
    target.agility += item.value;
    return { changed: true, effect: 'agility', value: item.value };
  }

  if (item.effect === 'cleanse') {
    target.removeStatus('poisoned');
    target.removeStatus('stunned');
    return { changed: true, effect: 'cleanse', value: 0 };
  }

  if (item.effect === 'defend') {
    target.addStatus('defending', item.duration || 1, {
      amount: item.value || 2,
    });
    return {
      changed: true,
      effect: 'defend',
      value: item.value || 2,
    };
  }

  return { changed: false };
}

module.exports = {
  ITEM_CATALOG,
  createItem,
  createRandomItem,
  applyItem,
};
