const { getClassOptions } = require('../domain/classProfile');
const { getTravelChoices } = require('../domain/region');
const shop = require('../services/shop');

const menuChoices = (hasSave = false) => {
  const choices = [
    { name: 'New Game', value: 'new' },
    { name: 'Save Game', value: 'save' },
    { name: 'Delete Save', value: 'delete' },
    { name: 'Tutorial', value: 'help' },
    { name: 'Exit', value: 'exit' },
  ];

  if (hasSave) {
    choices.unshift({ name: 'Continue', value: 'continue' });
  }

  return choices;
};

const battleChoices = () => [
  { name: 'Attack', value: 'attack' },
  { name: 'Use potion', value: 'potion' },
  { name: 'Save and continue later', value: 'save' },
  { name: 'View status', value: 'status' },
];

const adventureChoices = () => [
  { name: 'Continue to next encounter', value: 'continue' },
  { name: 'Travel', value: 'travel' },
  { name: 'Rest', value: 'rest' },
  { name: 'Equip gear', value: 'equip' },
  { name: 'Visit shop', value: 'shop' },
  { name: 'View hero and quests', value: 'status' },
  { name: 'Tutorial', value: 'help' },
  { name: 'Save and return to main menu', value: 'save' },
];

module.exports = {
  mainMenu: (hasSave = false) => ({
    type: 'list',
    name: 'action',
    message: 'Main menu',
    choices: menuChoices(hasSave),
  }),
  askName: () => ({
    type: 'text',
    name: 'name',
    message: 'What is your name?',
    validate: (value) => {
      if (!String(value || '').trim()) {
        return 'Enter a character name.';
      }

      return true;
    },
    filter: (value) => String(value || '').trim(),
  }),
  askClass: () => ({
    type: 'list',
    name: 'className',
    message: 'Choose a class',
    choices: getClassOptions(),
  }),
  battleAction: () => ({
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: battleChoices(),
  }),
  adventureAction: () => ({
    type: 'list',
    name: 'action',
    message: 'Adventure hub',
    choices: adventureChoices(),
  }),
  chooseRegion: (worldState) => ({
    type: 'list',
    name: 'regionId',
    message: 'Travel where?',
    choices: getTravelChoices(worldState),
  }),
  chooseEquipment: (entries) => ({
    type: 'list',
    name: 'index',
    message: 'Equip what?',
    choices: entries.length
      ? entries.map(({ item, index }) => ({
          name: `${item.name} (${item.slot}) - ${item.description}`,
          value: index,
        }))
      : [{ name: 'No equippable items', value: -1 }],
  }),
  chooseShopItem: (regionId, player) => ({
    type: 'list',
    name: 'itemId',
    message: `Shop inventory (${player.gold}g)`,
    choices: shop.getShopChoices(regionId, player),
  }),
  choosePotion: (items) => ({
    type: 'list',
    name: 'index',
    message: 'Choose a potion',
    choices: items.map((entry, index) => {
      const item = entry.item || entry;
      return {
        name: `${item.name} (${item.effect} +${item.value}) x${item.quantity || 1}`,
        value: Number.isFinite(entry.index) ? entry.index : index,
      };
    }),
  }),
  confirmRecoverSave: () => ({
    type: 'confirm',
    name: 'recoverSave',
    message: 'Save file is corrupted or unreadable. Delete and start fresh instead?',
    default: false,
  }),
  confirmDelete: () => ({
    type: 'confirm',
    name: 'confirm',
    message: 'Delete save file permanently?',
    default: false,
  }),
};
