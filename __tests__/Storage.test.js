const fs = require('fs');
const path = require('path');
const StorageService = require('../lib/services/storage');
const Rng = require('../lib/core/Rng');

test('saves and loads versioned payloads', async () => {
  const file = path.join(__dirname, 'tmp-save.json');
  const storage = new StorageService({ savePath: file });
  await storage.saveGame({
    seed: 77,
    player: { name: 'Test' },
    roundNumber: 1,
    activeEncounter: null,
    quests: []
  });

  const loaded = await storage.loadGame();
  expect(loaded.version).toBe(1);
  expect(loaded.player.name).toBe('Test');
  await storage.deleteSave();
  expect(fs.existsSync(file)).toBe(false);
});

test('persists rng snapshot for deterministic resume', async () => {
  const file = path.join(__dirname, 'tmp-save-rng.json');
  const storage = new StorageService({ savePath: file });
  const rng = new Rng(9001);
  const rngState = rng.snapshot();

  await storage.saveGame({
    seed: 9001,
    rngState,
    player: { name: 'Test' },
    roundNumber: 4,
    activeEncounter: null,
    quests: []
  });

  const loaded = await storage.loadGame();
  expect(loaded.rngState).toEqual(rngState);

  await storage.deleteSave();
});

test('migrates legacy saves without a schema version', async () => {
  const file = path.join(__dirname, 'tmp-save-legacy.json');
  const storage = new StorageService({ savePath: file });
  const legacy = {
    seed: 77,
    player: { name: 'Old Hero', health: 90, maxHealth: 90, strength: 12, agility: 10 },
    roundNumber: 2,
    activeEncounter: null,
    quests: ['legacy-quest'],
    updatedAt: new Date().toISOString()
  };

  await fs.promises.writeFile(file, JSON.stringify(legacy, null, 2), 'utf8');
  const loaded = await storage.loadGame();

  expect(loaded.version).toBe(1);
  expect(loaded.seed).toBe(77);
  expect(loaded.loadWarnings).toEqual(expect.arrayContaining(['Migrated legacy save (no version) to current schema.']));
  expect(loaded.quests).toEqual(['legacy-quest']);

  await storage.deleteSave();
});

test('throws recoverable error for corrupted JSON', async () => {
  const file = path.join(__dirname, 'tmp-save-corrupt.json');
  const storage = new StorageService({ savePath: file });
  await fs.promises.writeFile(file, '{ invalid-json', 'utf8');

  await expect(storage.loadGame()).rejects.toMatchObject({
    message: 'Save file is corrupted: invalid JSON.',
    recoverable: true
  });

  await storage.deleteSave();
});
