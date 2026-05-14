const { createItem, ITEM_CATALOG } = require('../domain/items');
const { DEFAULT_REGION_ID, getRegion } = require('../domain/region');

const SHOP_STOCK = {
  [DEFAULT_REGION_ID]: ['health', 'defender', 'iron_sword', 'traveler_cloak'],
  'old-quarry': ['health', 'strength', 'quarry_plate', 'lucky_charm'],
  'ashen-gate': ['health', 'agility', 'ember_staff', 'scout_charm'],
};

function getStock(regionId = DEFAULT_REGION_ID) {
  const region = getRegion(regionId);
  return SHOP_STOCK[region.id] || SHOP_STOCK[DEFAULT_REGION_ID];
}

function getShopChoices(regionId, player) {
  const gold = player && Number.isFinite(player.gold) ? player.gold : 0;
  const choices = getStock(regionId).map((itemId) => {
    const item = ITEM_CATALOG[itemId];
    const price = item.price || 0;
    const affordable = gold >= price ? 'buy' : 'need gold';

    return {
      name: `${item.name} - ${price}g (${affordable})`,
      value: itemId,
    };
  });

  choices.push({ name: 'Leave shop', value: 'leave' });
  return choices;
}

function buyItem(player, itemId, regionId) {
  if (itemId === 'leave') {
    return { purchased: false, message: 'Left the shop.' };
  }

  if (!getStock(regionId).includes(itemId)) {
    return { purchased: false, message: 'That item is not sold here.' };
  }

  const item = createItem(itemId);
  const price = item.price || 0;

  if (!player.spendGold(price)) {
    return { purchased: false, message: `Not enough gold for ${item.name}.` };
  }

  player.addItem(item);
  return { purchased: true, item, message: `Bought ${item.name} for ${price}g.` };
}

module.exports = {
  SHOP_STOCK,
  buyItem,
  getShopChoices,
  getStock,
};
