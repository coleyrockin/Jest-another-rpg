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
    quests: [],
  });

  const loaded = await storage.loadGame();
  expect(loaded.version).toBe(2);
  expect(loaded.player.name).toBe('Test');
  expect(loaded.world).toEqual({
    currentRegion: 'meadow-road',
    discoveredRegions: ['meadow-road'],
  });
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
    quests: [],
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
    updatedAt: new Date().toISOString(),
  };

  await fs.promises.writeFile(file, JSON.stringify(legacy, null, 2), 'utf8');
  const loaded = await storage.loadGame();

  expect(loaded.version).toBe(2);
  expect(loaded.seed).toBe(77);
  expect(loaded.loadWarnings).toEqual(
    expect.arrayContaining(['Migrated legacy save (no version) to current schema.'])
  );
  expect(loaded.quests).toEqual(['legacy-quest']);
  expect(loaded.world).toEqual({
    currentRegion: 'meadow-road',
    discoveredRegions: ['meadow-road'],
  });

  await storage.deleteSave();
});

test('throws recoverable error for corrupted JSON', async () => {
  const file = path.join(__dirname, 'tmp-save-corrupt.json');
  const storage = new StorageService({ savePath: file });
  await fs.promises.writeFile(file, '{ invalid-json', 'utf8');

  await expect(storage.loadGame()).rejects.toMatchObject({
    message: 'Save file is corrupted: invalid JSON.',
    recoverable: true,
  });

  await storage.deleteSave();
});

test('throws clear errors for missing save, invalid payload, checksum mismatch, and missing player', async () => {
  const missingFile = path.join(__dirname, 'tmp-save-missing.json');
  const missing = new StorageService({ savePath: missingFile });
  await expect(missing.loadGame()).rejects.toMatchObject({
    message: 'No save file found.',
    recoverable: false,
  });

  const invalidFile = path.join(__dirname, 'tmp-save-invalid.json');
  const invalid = new StorageService({ savePath: invalidFile });
  await fs.promises.writeFile(invalidFile, 'null', 'utf8');
  await expect(invalid.loadGame()).rejects.toMatchObject({
    message: 'Invalid save file',
    recoverable: true,
  });
  await invalid.deleteSave();

  const noPlayerFile = path.join(__dirname, 'tmp-save-no-player.json');
  const noPlayer = new StorageService({ savePath: noPlayerFile });
  await fs.promises.writeFile(noPlayerFile, JSON.stringify({ version: 1, seed: 1 }), 'utf8');
  await expect(noPlayer.loadGame()).rejects.toMatchObject({
    message: 'Save file is missing player data',
    recoverable: false,
  });
  await noPlayer.deleteSave();

  const checksumFile = path.join(__dirname, 'tmp-save-checksum.json');
  const checksum = new StorageService({ savePath: checksumFile });
  await checksum.saveGame({
    seed: 77,
    player: { name: 'Checksum' },
    roundNumber: 0,
    activeEncounter: null,
    quests: [],
  });
  const payload = JSON.parse(await fs.promises.readFile(checksumFile, 'utf8'));
  payload.player.name = 'Tampered';
  await fs.promises.writeFile(checksumFile, JSON.stringify(payload, null, 2), 'utf8');
  await expect(checksum.loadGame()).rejects.toMatchObject({
    message: 'Save file appears to be corrupted',
    recoverable: true,
  });
  await checksum.deleteSave();
});

test('migrates version zero saves with defaults', async () => {
  const file = path.join(__dirname, 'tmp-save-v0.json');
  const storage = new StorageService({ savePath: file });
  await fs.promises.writeFile(
    file,
    JSON.stringify({
      version: 0,
      seed: 'not-a-number',
      player: { name: 'Zero Hero' },
    }),
    'utf8'
  );

  const loaded = await storage.loadGame();

  expect(loaded.version).toBe(2);
  expect(Number.isFinite(loaded.seed)).toBe(true);
  expect(loaded.loadWarnings).toEqual(
    expect.arrayContaining(['Migrated version 0 save data to current schema.'])
  );
  await storage.deleteSave();
});

test('rejects future save schema versions, including numeric strings', async () => {
  const file = path.join(__dirname, 'tmp-save-future.json');
  const storage = new StorageService({ savePath: file });
  await fs.promises.writeFile(
    file,
    JSON.stringify({
      version: '999',
      seed: 77,
      player: { name: 'Future Hero' },
    }),
    'utf8'
  );

  await expect(storage.loadGame()).rejects.toMatchObject({
    message: 'Unsupported save file version',
    recoverable: false,
  });

  await storage.deleteSave();
});
