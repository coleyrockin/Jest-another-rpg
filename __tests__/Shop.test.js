const Player = require('../lib/domain/player');
const shop = require('../lib/services/shop');

test('shop blocks invalid and unaffordable purchases', () => {
  const player = new Player('Buyer', 'mage');

  expect(shop.buyItem(player, 'unknown', 'meadow-road')).toMatchObject({
    purchased: false,
    message: 'That item is not sold here.',
  });
  expect(shop.buyItem(player, 'iron_sword', 'meadow-road')).toMatchObject({
    purchased: false,
    message: 'Not enough gold for Iron Sword.',
  });
});

test('shop purchases add inventory and spend gold', () => {
  const player = new Player('Buyer', 'mage');
  player.addGold(100);

  const result = shop.buyItem(player, 'iron_sword', 'meadow-road');

  expect(result.purchased).toBe(true);
  expect(player.gold).toBe(55);
  expect(player.inventory.some((item) => item.id === 'iron_sword')).toBe(true);
  expect(shop.getShopChoices('meadow-road', player).some((choice) => choice.value === 'leave')).toBe(
    true
  );
});
