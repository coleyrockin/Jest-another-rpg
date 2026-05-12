const Player = require('../lib/domain/player');
const { createItem, applyItem } = require('../lib/domain/items');

test('creates a named potion item', () => {
  const potion = createItem('health');

  expect(potion.id).toBe('health');
  expect(potion.value).toEqual(expect.any(Number));
});

test('normalizes aliases and unknown items safely', () => {
  expect(createItem().id).toBe('health');
  expect(createItem('str boost').id).toBe('strength');
  expect(createItem('agi boost').id).toBe('agility');
  expect(createItem('cleanse poison').id).toBe('cleanse');
  expect(createItem('mystery').id).toBe('health');
});

test('creates a random potion item', () => {
  const { createRandomItem } = require('../lib/domain/items');
  const rng = { nextInt: () => 50 };
  const potion = createRandomItem(rng);
  expect(potion).toHaveProperty('id');
  expect(potion).toHaveProperty('effect');
});

test('applies all item effects and rejects invalid input', () => {
  const player = new Player('Item User', 'warrior');
  player.reduceHealth(10);
  player.addStatus('poisoned', 1);
  player.addStatus('stunned', 1);

  expect(applyItem(null, player).changed).toBe(false);
  expect(applyItem(createItem('health'), player)).toMatchObject({
    changed: true,
    effect: 'health',
  });
  expect(applyItem(createItem('strength'), player)).toMatchObject({
    changed: true,
    effect: 'strength',
  });
  expect(applyItem(createItem('agility'), player)).toMatchObject({
    changed: true,
    effect: 'agility',
  });
  expect(applyItem(createItem('cleanse'), player)).toMatchObject({
    changed: true,
    effect: 'cleanse',
  });
  expect(player.hasStatus('poisoned')).toBe(false);
  expect(player.hasStatus('stunned')).toBe(false);
  expect(applyItem(createItem('defender'), player)).toMatchObject({
    changed: true,
    effect: 'defend',
  });
  expect(player.hasStatus('defending')).toBe(true);
  expect(applyItem({ effect: 'unknown' }, player).changed).toBe(false);
});
