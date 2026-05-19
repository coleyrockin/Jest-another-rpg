const Game = require('../lib/Game');
const Player = require('../lib/domain/player');
const Enemy = require('../lib/domain/enemy');
const StorageService = require('../lib/services/storage');
const { createItem } = require('../lib/domain/items');

function createGame({ answers = [], storage, pacing = 'detailed' } = {}) {
  const logs = [];
  const queue = [...answers];
  const game = new Game({
    seed: 100,
    pacing,
    storage:
      storage ||
      new StorageService({
        savePath: `${process.cwd()}/game-behavior-test-save.json`,
      }),
    inquirer: {
      prompt: jest.fn(async () => {
        if (queue.length === 0) {
          throw new Error('No scripted answer available.');
        }

        return queue.shift();
      }),
    },
  });
  game.showStatus = (line) => logs.push(line);
  return { game, logs };
}

test('initializeGame routes help, save without player, delete cancel, and exit', async () => {
  const storage = {
    saveExists: jest.fn(async () => false),
    deleteSave: jest.fn(async () => true),
    saveGame: jest.fn(async () => {}),
  };
  const { game, logs } = createGame({
    storage,
    answers: [
      { action: 'help' },
      { action: 'save' },
      { action: 'delete' },
      { confirm: false },
      { action: 'exit' },
    ],
  });

  await game.initializeGame();

  expect(logs).toContain('Help & mechanics');
  expect(logs).toContain('Start a game before saving.');
  expect(storage.deleteSave).not.toHaveBeenCalled();
});

test('startNewGame creates a player and encounter before entering battle', async () => {
  const { game } = createGame({
    answers: [{ name: 'Nova' }, { className: 'rogue' }],
  });
  game.battleLoop = jest.fn(async () => {});

  await game.startNewGame();

  expect(game.player.name).toBe('Nova');
  expect(game.player.className).toBe('rogue');
  expect(game.currentEncounter.enemy).toBeTruthy();
  expect(game.battleLoop).toHaveBeenCalled();
});

test('continueGame logs warnings and hydrates fallback encounter', async () => {
  const savedPlayer = new Player('Saved', 'mage').toSave();
  const storage = {
    loadGame: jest.fn(async () => ({
      seed: 55,
      player: savedPlayer,
      roundNumber: 1,
      quests: [],
      activeEncounter: null,
      loadWarnings: ['legacy migration applied'],
    })),
  };
  const { game, logs } = createGame({ storage });
  game.battleLoop = jest.fn(async () => {});

  await game.continueGame();

  expect(game.player.name).toBe('Saved');
  expect(game.currentEncounter.enemy).toBeTruthy();
  expect(logs).toContain('Load notice: legacy migration applied');
});

test('continueGame offers recovery for recoverable load failures', async () => {
  const error = new Error('bad save');
  error.recoverable = true;
  const storage = {
    loadGame: jest.fn(async () => {
      throw error;
    }),
    deleteSave: jest.fn(async () => true),
  };
  const { game, logs } = createGame({
    storage,
    answers: [{ recoverSave: true }],
  });

  await game.continueGame();

  expect(storage.deleteSave).toHaveBeenCalled();
  expect(logs).toContain('Corrupt save removed. Start a new game to continue.');
});

test('deleteSave reports deletion and missing-save outcomes', async () => {
  const deleted = createGame({
    storage: { deleteSave: jest.fn(async () => true) },
    answers: [{ confirm: true }],
  });
  await deleted.game.deleteSave();
  expect(deleted.logs).toContain('Save file deleted.');

  const missing = createGame({
    storage: { deleteSave: jest.fn(async () => false) },
    answers: [{ confirm: true }],
  });
  await missing.game.deleteSave();
  expect(missing.logs).toContain('No save file to delete.');
});

test('status cards render detailed, quick, empty inventory, and complete quests', () => {
  const { game, logs } = createGame({ pacing: 'detailed' });
  game.player = new Player('Status', 'warrior', game.rng);
  game.player.inventory = [];
  game.questState = game.questState.map((quest) => ({ ...quest, completed: true }));
  game.currentEncounter = { enemy: new Enemy({ name: 'Training Dummy', rng: game.rng }) };

  game.showStateCard();

  expect(logs.some((line) => line.includes('Bag    empty'))).toBe(true);
  expect(logs.some((line) => line.includes(`Quests ${game.questState.length}/${game.questState.length} complete`))).toBe(true);

  const quick = createGame({ pacing: 'quick' });
  quick.game.player = new Player('Quick', 'mage', quick.game.rng);
  quick.game.currentEncounter = { enemy: new Enemy({ name: 'Scout', rng: quick.game.rng }) };
  quick.game.showStateCard();

  expect(quick.logs.some((line) => line.startsWith('['))).toBe(true);
  expect(quick.logs.some((line) => line.startsWith('Quests '))).toBe(true);
});

test('playerTurn handles status, save, no inventory, potion, and attack actions', async () => {
  const { game } = createGame({
    answers: [
      { action: 'status' },
      { action: 'save' },
      { action: 'potion' },
      { action: 'potion' },
      { index: 0 },
      { action: 'attack' },
    ],
  });
  game.player = new Player('Turn', 'warrior', game.rng);
  game.currentEncounter = { enemy: new Enemy({ name: 'Target', health: 100, rng: game.rng }) };

  expect((await game.playerTurn()).action).toBe('status');
  expect((await game.playerTurn()).action).toBe('save');

  game.player.inventory = [];
  expect((await game.playerTurn()).message).toBe("You don't have any potions!");

  game.player.addItem('health');
  expect((await game.playerTurn()).message).toBe('Used Health Potion.');
  expect((await game.playerTurn()).action).toBe('attack');
});

test('battleLoop handles enemy turns, status ticks, win, and defeat', async () => {
  const winning = createGame();
  winning.game.player = new Player('Winner', 'warrior', winning.game.rng);
  winning.game.currentEncounter = {
    enemy: new Enemy({ name: 'Done', health: 0, rng: winning.game.rng }),
  };
  winning.game.onEncounterWin = jest.fn(async () => false);

  await winning.game.battleLoop();
  expect(winning.game.onEncounterWin).toHaveBeenCalled();

  const defeated = createGame();
  defeated.game.player = new Player('Fallen', 'warrior', defeated.game.rng);
  defeated.game.player.addStatus('stunned', 1);
  defeated.game.currentEncounter = {
    enemy: new Enemy({ name: 'Heavy', health: 100, rng: defeated.game.rng }),
  };
  defeated.game.enemyTurn = () => {
    defeated.game.player.reduceHealth(999);
    return { message: 'heavy hit', target: defeated.game.player.name, damage: 999 };
  };

  await defeated.game.battleLoop();
  expect(defeated.logs).toContain("You've been defeated!");
});

test('onEncounterWin grants loot, advances encounters, and ends campaign', async () => {
  const { game, logs } = createGame({
    answers: [{ action: 'continue' }],
  });
  game.player = new Player('Closer', 'warrior', game.rng);
  game.questState = [];
  game.currentEncounter = game.encounterService.nextEncounter(game.player.level, 1);
  game.currentEncounter.enemy.reduceHealth(999);
  game.saveCurrentProgress = jest.fn(async () => {});

  await expect(game.onEncounterWin()).resolves.toBe(true);
  expect(game.saveCurrentProgress).toHaveBeenCalled();
  expect(logs.some((line) => line.startsWith('Loot gained:'))).toBe(true);

  game.roundNumber = game.encounterService.maxEncounters - 1;
  game.currentEncounter = game.encounterService.nextEncounter(game.player.level, game.roundNumber);
  game.currentEncounter.enemy.reduceHealth(999);
  await expect(game.onEncounterWin()).resolves.toBe(false);
  expect(logs).toContain('You have cleared the campaign!');
});

test('adventureHub travels, rests, equips, shops, saves, and returns safely', async () => {
  const { game, logs } = createGame({
    answers: [
      { action: 'travel' },
      { regionId: 'old-quarry' },
      { action: 'rest' },
      { action: 'equip' },
      { index: 2 },
      { action: 'shop' },
      { itemId: 'health' },
      { action: 'status' },
      { action: 'save' },
    ],
  });
  game.player = new Player('Hub', 'warrior', game.rng);
  game.player.health = game.player.maxHealth - 3;
  game.player.gold = 50;
  game.player.addItem(createItem('iron_sword'));
  game.worldState = {
    currentRegion: 'meadow-road',
    discoveredRegions: ['meadow-road', 'old-quarry'],
  };
  game.saveCurrentProgress = jest.fn(async () => {});

  await expect(game.adventureHub()).resolves.toBe(false);

  expect(game.worldState.currentRegion).toBe('old-quarry');
  expect(game.player.health).toBe(game.player.maxHealth);
  expect(game.player.equipment.weapon.name).toBe('Iron Sword');
  expect(game.player.inventory.some((item) => item.id === 'health')).toBe(true);
  expect(game.saveCurrentProgress).toHaveBeenCalled();
  expect(logs.some((line) => line.startsWith('Travel complete: Old Quarry'))).toBe(true);
});

test('playerTurn excludes gear from potion choices', async () => {
  const { game } = createGame({
    answers: [{ action: 'potion' }, { index: 1 }],
  });
  game.player = new Player('Gearsafe', 'warrior', game.rng);
  game.player.inventory = [createItem('iron_sword'), createItem('health')];
  game.currentEncounter = { enemy: new Enemy({ name: 'Target', health: 100, rng: game.rng }) };

  await expect(game.playerTurn()).resolves.toMatchObject({
    action: 'potion',
    message: 'Used Health Potion.',
  });
  expect(game.player.inventory.some((item) => item.id === 'iron_sword')).toBe(true);
});
