const { getClassOptions } = require('../domain/classProfile');

const menuChoices = (hasSave = false) => {
  const choices = [
    { name: 'New Game', value: 'new' },
    { name: 'Save Game', value: 'save' },
    { name: 'Delete Save', value: 'delete' },
    { name: 'Tutorial', value: 'help' },
    { name: 'Exit', value: 'exit' }
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
  { name: 'View status', value: 'status' }
];

module.exports = {
  mainMenu: (hasSave = false) => ({
    type: 'list',
    name: 'action',
    message: 'Main menu',
    choices: menuChoices(hasSave)
  }),
  askName: () => ({
    type: 'text',
    name: 'name',
    message: 'What is your name?'
  }),
  askClass: () => ({
    type: 'list',
    name: 'className',
    message: 'Choose a class',
    choices: getClassOptions()
  }),
  battleAction: () => ({
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: battleChoices()
  }),
  choosePotion: (items) => ({
    type: 'list',
    name: 'index',
    message: 'Choose a potion',
    choices: items.map((item, index) => ({
      name: `${item.name} (${item.effect} +${item.value}) x${item.quantity || 1}`,
      value: index
    }))
  }),
  confirmRecoverSave: () => ({
    type: 'confirm',
    name: 'recoverSave',
    message:
      'Save file is corrupted or unreadable. Delete and start fresh instead?',
    default: false
  }),
  confirmDelete: () => ({
    type: 'confirm',
    name: 'confirm',
    message: 'Delete save file permanently?',
    default: false
  })
};
