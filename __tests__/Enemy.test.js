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
