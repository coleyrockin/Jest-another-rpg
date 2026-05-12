const prompts = require('../lib/ui/prompts');

test('main menu includes continue only when a save exists', () => {
  const withoutSave = prompts.mainMenu(false);
  const withSave = prompts.mainMenu(true);

  expect(withoutSave.choices.map((choice) => choice.value)).not.toContain('continue');
  expect(withSave.choices.map((choice) => choice.value)[0]).toBe('continue');
});

test('name prompt validates and trims names', () => {
  const prompt = prompts.askName();

  expect(prompt.validate('   ')).toBe('Enter a character name.');
  expect(prompt.validate('Ari')).toBe(true);
  expect(prompt.filter('  Ari  ')).toBe('Ari');
});

test('class, battle, potion, recovery, and delete prompts expose stable values', () => {
  expect(prompts.askClass().choices.map((choice) => choice.value)).toEqual([
    'warrior',
    'rogue',
    'mage',
  ]);
  expect(prompts.battleAction().choices.map((choice) => choice.value)).toEqual([
    'attack',
    'potion',
    'save',
    'status',
  ]);
  expect(
    prompts.choosePotion([{ name: 'Health Potion', effect: 'health', value: 30 }]).choices[0]
  ).toMatchObject({ value: 0 });
  expect(prompts.confirmRecoverSave()).toMatchObject({ name: 'recoverSave', default: false });
  expect(prompts.confirmDelete()).toMatchObject({ name: 'confirm', default: false });
});
