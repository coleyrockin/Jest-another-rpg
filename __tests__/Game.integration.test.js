const fs = require('fs');
const path = require('path');
const Game = require('../lib/Game');
const StorageService = require('../lib/services/storage');
const Player = require('../lib/domain/player');

test('can continue a saved game from a persisted game state', async () => {
  const file = path.join(__dirname, 'tmp-game-save.json');
  const storage = new StorageService({ savePath: file });
  const starterInquirer = { prompt: jest.fn().mockResolvedValue({}) };

  const source = new Game({
    seed: 123,
    storage,
    inquirer: starterInquirer,
    quiet: true,
  });
  source.player = new Player('Sora', 'warrior', source.rng);
  source.currentEncounter = source.encounterService.nextEncounter(1, 1);
  source.roundNumber = 2;
  source.questState = [];
  await source.saveCurrentProgress();

  const nextInquirer = { prompt: jest.fn().mockResolvedValue({}) };
  const resumed = new Game({
    seed: 999,
    storage,
    inquirer: nextInquirer,
    quiet: true,
  });
  resumed.battleLoop = jest.fn(async () => {});
  await resumed.continueGame();

  expect(resumed.player.name).toBe('Sora');
  expect(resumed.roundNumber).toBe(2);
  expect(resumed.currentEncounter).toBeTruthy();
  expect(resumed.currentEncounter.enemy).toBeTruthy();
  expect(resumed.currentEncounter.enemy.name).toBe(source.currentEncounter.enemy.name);

  await storage.deleteSave();
});

test('can recover from corrupted save after user confirmation', async () => {
  const file = path.join(__dirname, 'tmp-game-corrupt.json');
  const storage = new StorageService({ savePath: file });

  const game = new Game({
    storage,
    seed: 321,
    inquirer: { prompt: jest.fn().mockResolvedValue({}) },
    quiet: true,
  });
  game.player = new Player('Recover', 'mage', game.rng);
  game.currentEncounter = game.encounterService.nextEncounter(1, 1);
  await game.saveCurrentProgress();

  const loaded = await fs.promises.readFile(file, 'utf8');
  const parsed = JSON.parse(loaded);
  parsed.logHash = 'not-real';
  await fs.promises.writeFile(file, JSON.stringify(parsed, null, 2), 'utf8');

  const confirmInquirer = {
    prompt: jest.fn().mockResolvedValue({ recoverSave: true }),
  };
  const recoveringGame = new Game({
    storage,
    seed: 999,
    inquirer: confirmInquirer,
    quiet: true,
  });
  recoveringGame.battleLoop = jest.fn(async () => {});
  await recoveringGame.continueGame();

  expect(confirmInquirer.prompt).toHaveBeenCalledTimes(1);
  await expect(storage.saveExists()).resolves.toBe(false);
});
