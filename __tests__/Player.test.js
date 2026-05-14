const Player = require('../lib/domain/player');
const { createItem } = require('../lib/domain/items');

test('creates a player with class and base inventory', () => {
  const player = new Player('Dave', 'rogue');
  expect(player.name).toBe('Dave');
  expect(player.className).toBe('rogue');
  expect(player.getInventory()).toEqual(expect.any(Array));
  expect(player.getStats()).toHaveProperty('level', 1);
});

test('uses a potion from inventory and reduces count safely', () => {
  const player = new Player('Dave', 'mage');
  const before = player.inventory.length;

  const result = player.usePotion(0);
  expect(result).toHaveProperty('item');
  expect(player.inventory.length).toBeLessThanOrEqual(before);
});

test('supports stack-aware quantity behavior', () => {
  const player = new Player('Maya', 'warrior');
  player.inventory = [{ ...player.inventory[0], quantity: 2 }];

  player.usePotion(0);
  expect(player.inventory).toHaveLength(1);
  expect(player.inventory[0].quantity).toBe(1);
});

test('stacks added consumables and rejects invalid potion slots', () => {
  const player = new Player('Maya', 'warrior');
  player.inventory = [];

  expect(player.getInventory()).toBe(false);
  expect(player.usePotion(99)).toBeNull();

  player.addItem('health');
  player.addItem('health');
  expect(player.inventory).toHaveLength(1);
  expect(player.inventory[0].quantity).toBe(2);

  player.addPotion('agility');
  expect(player.inventory.some((item) => item.id === 'agility')).toBe(true);
  expect(player.getClassPower()).toBe(player.classStats);
});

test('persists unlocked progression flags', () => {
  const player = new Player('Maya', 'warrior');
  player.unlockedLevel3 = true;
  player.unlockedLevel5 = true;

  const restored = Player.fromSave(player.toSave());

  expect(restored.unlockedLevel3).toBe(true);
  expect(restored.unlockedLevel5).toBe(true);
});

test('supports gold, equipment modifiers, swaps, and save restore without double applying gear', () => {
  const player = new Player('Maya', 'warrior');
  player.inventory = [createItem('iron_sword'), createItem('ember_staff'), createItem('quarry_plate')];
  const baseStrength = player.strength;
  const baseHealth = player.maxHealth;

  expect(player.addGold(30)).toBe(30);
  expect(player.spendGold(12)).toBe(true);
  expect(player.spendGold(999)).toBe(false);
  expect(player.gold).toBe(18);

  expect(player.equipItem(0).equipped).toBe(true);
  expect(player.strength).toBe(baseStrength + 2);
  expect(player.equipment.weapon.name).toBe('Iron Sword');

  expect(player.equipItem(0).equipped).toBe(true);
  expect(player.equipment.weapon.name).toBe('Ember Staff');
  expect(player.inventory.some((item) => item.id === 'iron_sword')).toBe(true);
  expect(player.strength).toBe(baseStrength + 1);

  const armorIndex = player.inventory.findIndex((item) => item.id === 'quarry_plate');
  expect(player.equipItem(armorIndex).equipped).toBe(true);
  expect(player.maxHealth).toBe(baseHealth + 14);
  expect(player.getEquipmentDefense()).toBe(1);

  const restored = Player.fromSave(player.toSave());
  expect(restored.strength).toBe(player.strength);
  expect(restored.maxHealth).toBe(player.maxHealth);
  expect(restored.equipment.weapon.name).toBe('Ember Staff');
  expect(restored.equipment.armor.name).toBe('Quarry Plate');
});
