const { createItem } = require('../lib/domain/items');

test('creates a named potion item', () => {
  const potion = createItem('health');

  expect(potion.id).toBe('health');
  expect(potion.value).toEqual(expect.any(Number));
});

test('creates a random potion item', () => {
  const { createRandomItem } = require('../lib/domain/items');
  const rng = { nextInt: () => 50 };
  const potion = createRandomItem(rng);
  expect(potion).toHaveProperty('id');
  expect(potion).toHaveProperty('effect');
});
