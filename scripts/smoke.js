const path = require('path');
const Game = require('../lib/Game');
const Player = require('../lib/domain/player');
const StorageService = require('../lib/services/storage');
const { printHelp } = require('../app');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function scriptedInquirer(answers) {
  return {
    prompt: async () => {
      if (answers.length === 0) {
        throw new Error('Smoke script ran out of prompt answers.');
      }

      return answers.shift();
    },
  };
}

async function smokeHelp() {
  const lines = [];
  printHelp((line) => lines.push(line));
  assert(lines.join('\n').includes('--seed=<number>'), 'CLI help did not include seed flag.');
}

async function smokeSaveContinueDelete() {
  const savePath = path.join(process.cwd(), 'smoke-save.json');
  const storage = new StorageService({ savePath });
  await storage.deleteSave();

  const starter = new Game({
    seed: 123,
    storage,
    quiet: true,
    inquirer: scriptedInquirer([{ name: 'Smoke' }, { className: 'warrior' }]),
  });
  starter.battleLoop = async function battleLoopSmokeSave() {
    await this.saveCurrentProgress();
  };
  await starter.startNewGame();
  assert(await storage.saveExists(), 'Smoke save was not created.');

  const resumed = new Game({
    seed: 999,
    storage,
    quiet: true,
    inquirer: scriptedInquirer([]),
  });
  let continued = false;
  resumed.battleLoop = async () => {
    continued = true;
  };
  await resumed.continueGame();
  assert(continued, 'Smoke save did not continue into battle loop.');

  const deleting = new Game({
    storage,
    quiet: true,
    inquirer: scriptedInquirer([{ confirm: true }]),
  });
  await deleting.deleteSave();
  assert(!(await storage.saveExists()), 'Smoke save was not deleted.');
}

async function smokeCampaignClear() {
  const storage = new StorageService({
    savePath: path.join(process.cwd(), 'smoke-campaign-save.json'),
  });
  await storage.deleteSave();

  const game = new Game({
    seed: 321,
    storage,
    quiet: true,
    inquirer: scriptedInquirer([]),
  });
  game.player = new Player('Closer', 'mage', game.rng);
  game.questState = [];
  game.currentEncounter = game.encounterService.nextEncounter(game.player.level, 1);

  let running = true;
  while (running) {
    game.currentEncounter.enemy.reduceHealth(9999);
    running = await game.onEncounterWin();
  }

  assert(game.roundNumber === game.encounterService.maxEncounters, 'Campaign did not clear.');
  await storage.deleteSave();
}

(async () => {
  await smokeHelp();
  await smokeSaveContinueDelete();
  await smokeCampaignClear();
  console.log('smoke ok');
})().catch((error) => {
  console.error(`smoke failed: ${error.message}`);
  process.exitCode = 1;
});
