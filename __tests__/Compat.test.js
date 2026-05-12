test('legacy compatibility exports point at current domain modules', () => {
  expect(require('../lib/Character')).toBe(require('../lib/domain/character'));
  expect(require('../lib/Player')).toBe(require('../lib/domain/player'));
  expect(require('../lib/Enemy')).toBe(require('../lib/domain/enemy'));
});

test('legacy Potion adapter creates item-shaped values', () => {
  const Potion = require('../lib/Potion');
  const potion = new Potion('strength');

  expect(potion.name).toBe('strength');
  expect(potion.value).toBe(3);
});
