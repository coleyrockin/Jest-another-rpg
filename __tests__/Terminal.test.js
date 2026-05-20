const {
  box,
  compactQuest,
  progressBar,
  stackInventory,
  titleCase,
} = require('../lib/ui/terminal');

test('titleCase formats enemy and class labels without destroying separators', () => {
  expect(titleCase('orc miner')).toBe('Orc Miner');
  expect(titleCase('ash-raider scout')).toBe('Ash-Raider Scout');
  expect(titleCase(null)).toBe('');
});

test('progressBar clamps invalid and overflowing values', () => {
  expect(progressBar(5, 10, 10)).toBe('[#####.....] 5/10');
  expect(progressBar(20, 10, 10)).toBe('[##########] 10/10');
  expect(progressBar(-4, 0, 4)).toBe('[....] 0/1');
});

test('stackInventory collapses duplicate consumables and ignores empty slots', () => {
  const summary = stackInventory([
    { id: 'health', name: 'Health Potion', quantity: 1 },
    null,
    { id: 'health', name: 'Health Potion', quantity: 2 },
    { id: 'iron_sword', name: 'Iron Sword' },
  ]);

  expect(summary).toEqual(['Health Potion x3', 'Iron Sword x1']);
});

test('box creates rectangular ASCII cards with title and body rows', () => {
  const rendered = box('Card', ['Short', 'A longer line']);
  const widths = rendered.map((line) => line.length);

  expect(new Set(widths).size).toBe(1);
  expect(rendered[0]).toContain(' Card ');
  expect(rendered[1]).toContain('Short');
  expect(rendered[2]).toContain('A longer line');
});

test('compactQuest reports completion and active tracking target', () => {
  const quests = [
    { title: 'Done', progress: 1, target: 1, completed: true },
    { title: 'Find the Missing Scout', progress: 1, target: 3, completed: false },
  ];

  expect(compactQuest(quests)).toBe(
    'Quests 1/2 complete | Track: Find the Missing Scout 1/3'
  );
  expect(compactQuest(quests.map((quest) => ({ ...quest, completed: true })))).toBe(
    'Quests 2/2 complete'
  );
});
