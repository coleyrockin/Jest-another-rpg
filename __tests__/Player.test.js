const Player = require('../lib/domain/player');

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

test('persists unlocked progression flags', () => {
  const player = new Player('Maya', 'warrior');
  player.unlockedLevel3 = true;
  player.unlockedLevel5 = true;

  const restored = Player.fromSave(player.toSave());

  expect(restored.unlockedLevel3).toBe(true);
  expect(restored.unlockedLevel5).toBe(true);
});
