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
    quantity: 1,
    stackable: true,
    description: 'Restore health by 30 points'
  },
  strength: {
    id: 'strength',
    name: 'Strength Brew',
    type: 'potion',
    category: 'consumable',
    effect: 'strength',
    value: 3,
    quantity: 1,
    stackable: true,
    description: 'Permanently increase strength by 3'
  },
  agility: {
    id: 'agility',
    name: 'Agility Brew',
    type: 'potion',
    category: 'consumable',
    effect: 'agility',
    value: 3,
    quantity: 1,
    stackable: true,
    description: 'Permanently increase agility by 3'
  },
  cleanse: {
    id: 'cleanse',
    name: 'Purifying Tonic',
    type: 'potion',
    category: 'consumable',
    effect: 'cleanse',
    value: 0,
    quantity: 1,
    stackable: true,
    description: 'Clear poison and stun effects'
  },
  defender: {
    id: 'defender',
    name: 'Defender Draught',
    type: 'potion',
    category: 'consumable',
    effect: 'defend',
    value: 2,
    duration: 1,
    quantity: 1,
    stackable: true,
    description: 'Apply guarding stance for one enemy action'
  }
};

const LOOT_ROLLS = [
  { item: 'health', weight: 55 },
  { item: 'strength', weight: 20 },
  { item: 'agility', weight: 16 },
  { item: 'cleanse', weight: 7 },
  { item: 'defender', weight: 2 }
];

function createItem(name = 'health') {
  const key = normalizeItemName(name);
  const base = ITEM_CATALOG[key];
  return { ...base };
}

function createRandomItem(rng) {
  const roll = rng.nextInt(1, 100);
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
      amount: item.value || 2
    });
    return {
      changed: true,
      effect: 'defend',
      value: item.value || 2
    };
  }

  return { changed: false };
}

module.exports = {
  ITEM_CATALOG,
  createItem,
  createRandomItem,
  applyItem
};
