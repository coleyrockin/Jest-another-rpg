const Enemy = require('../lib/domain/enemy');

test('creates an enemy object', () => {
  const enemy = new Enemy({ name: 'goblin', weapon: 'sword' });
  expect(enemy.name).toBe('goblin');
  expect(enemy.weapon).toBe('sword');
  expect(enemy.health).toEqual(expect.any(Number));
  expect(enemy.strength).toEqual(expect.any(Number));
  expect(enemy.agility).toEqual(expect.any(Number));
  expect(enemy.isAlive()).toBe(true);
});

test('health reduction clamps at zero', () => {
  const enemy = new Enemy({ name: 'goblin', weapon: 'sword' });
  enemy.reduceHealth(99999);
  expect(enemy.health).toBe(0);
});

test('restores saved status effects', () => {
  const enemy = Enemy.fromSave({
    name: 'captain',
    health: 40,
    maxHealth: 100,
    strength: 12,
    agility: 8,
    weapon: 'sword',
    aiProfile: 'tactical',
    level: 2,
    statuses: [{ name: 'poisoned', duration: 2, intensity: 1 }],
  });

  expect(enemy.hasStatus('poisoned')).toBe(true);
  expect(enemy.getStatus('poisoned').duration).toBe(2);
});

test('boss loot includes a guaranteed defender reward', () => {
  const enemy = new Enemy({ name: 'captain', isBoss: true });
  const drops = enemy.getLoot({ nextInt: () => 1 });

  expect(drops.map((item) => item.id)).toContain('defender');
  expect(drops).toHaveLength(2);
});

test('enemy save and restore preserves combat metadata', () => {
  const enemy = new Enemy({
    name: 'captain',
    weapon: 'spear',
    aiProfile: 'opportunist',
    level: 3,
    attackMultiplier: 1.2,
    xpReward: 99,
    lootTable: ['health'],
  });

  const restored = Enemy.fromSave(enemy.toSave());

  expect(restored.toSave()).toMatchObject({
    name: 'captain',
    weapon: 'spear',
    aiProfile: 'opportunist',
    level: 3,
    xpReward: 99,
  });
});
