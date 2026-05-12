const inquirer = require('inquirer');
const Rng = require('./core/Rng');
const Player = require('./domain/player');
const prompts = require('./ui/prompts');
const StorageService = require('./services/storage');
const EncounterService = require('./services/encounter');
const progression = require('./services/progression');
const {
  computeTurnOrder,
  resolveCombatTurn,
  computeEnemyTurn,
  applyStatusTick,
} = require('./services/combat');

class Game {
  constructor(options = {}) {
    const seed = options.seed === undefined || options.seed === null ? Date.now() : options.seed;

    this.rng = new Rng(seed);
    this.inquirer = options.inquirer || inquirer;
    this.storage = options.storage || new StorageService();
    this.encounterService = options.encounterService || new EncounterService(this.rng);
    this.showStatus = options.quiet ? () => {} : console.log;
    this.pacing = options.pacing || 'detailed';
    this.player = null;
    this.currentEncounter = null;
    this.roundNumber = 0;
    this.questState = progression.defaultQuests();
  }

  async initializeGame() {
    this.showStatus('Welcome to Jest-Another-RPG');
    let running = true;

    while (running) {
      const hasSave = await this.storage.saveExists();
      const { action } = await this.inquirer.prompt(prompts.mainMenu(hasSave));

      if (action === 'new') {
        await this.startNewGame();
      }

      if (action === 'continue') {
        await this.continueGame();
      }

      if (action === 'save') {
        await this.saveCurrentProgress();
      }

      if (action === 'delete') {
        await this.deleteSave();
      }

      if (action === 'help') {
        this.renderHelp();
      }

      if (action === 'exit') {
        running = false;
      }
    }
  }

  renderHelp() {
    const lines = [
      'Help & mechanics',
      '- Choose a class to set your stat profile and critical profile.',
      '- Attacks can miss, crit, and apply status effects.',
      '- Potions are now consumables with typed effects.',
      '- Use Save & continue to pause and resume from disk.',
      '- XP and level-ups scale with class growth curves.',
      '- Boss encounters guarantee a defensive reward and extra loot.',
    ];
    lines.forEach((line) => this.showStatus(line));
  }

  async startNewGame() {
    const { name } = await this.inquirer.prompt(prompts.askName());
    const { className } = await this.inquirer.prompt(prompts.askClass());

    this.player = new Player(name, className, this.rng);
    this.roundNumber = 0;
    this.questState = progression.defaultQuests();
    this.currentEncounter = this.encounterService.nextEncounter(this.player.level, 1);

    this.showStateCard();
    await this.battleLoop();
  }

  async continueGame() {
    try {
      const save = await this.storage.loadGame();
      if (save.rngState) {
        this.rng.restore(save.rngState);
      } else {
        this.rng.seed(save.seed);
      }

      this.player = Player.fromSave(save.player, this.rng);
      this.roundNumber = save.roundNumber || 0;
      this.questState = save.quests || progression.defaultQuests();
      this.currentEncounter = save.activeEncounter
        ? this.encounterService.hydrateEncounter(save.activeEncounter)
        : this.encounterService.nextEncounter(this.player.level, this.roundNumber + 1);

      if (Array.isArray(save.loadWarnings) && save.loadWarnings.length > 0) {
        save.loadWarnings.forEach((line) => this.showStatus(`Load notice: ${line}`));
      }

      await this.battleLoop();
    } catch (err) {
      this.showStatus(`Unable to load save: ${err.message}`);

      if (err.recoverable) {
        const { recoverSave } = await this.inquirer.prompt(prompts.confirmRecoverSave());
        if (recoverSave) {
          await this.storage.deleteSave();
          this.showStatus('Corrupt save removed. Start a new game to continue.');
        }
      }
    }
  }

  async deleteSave() {
    const { confirm } = await this.inquirer.prompt(prompts.confirmDelete());
    if (!confirm) {
      return;
    }

    const didDelete = await this.storage.deleteSave();
    this.showStatus(didDelete ? 'Save file deleted.' : 'No save file to delete.');
  }

  async saveCurrentProgress() {
    if (!this.player) {
      this.showStatus('Start a game before saving.');
      return;
    }

    const state = {
      seed: this.rng.initialSeed,
      rngState: this.rng.snapshot(),
      player: this.player ? this.player.toSave() : null,
      roundNumber: this.roundNumber,
      activeEncounter: this.currentEncounter
        ? this.encounterService.serializeEncounter(this.currentEncounter)
        : null,
      quests: this.questState,
    };
    await this.storage.saveGame(state);
    this.showStatus('Game saved.');
  }

  showStateCard() {
    if (!this.player) {
      return;
    }

    if (this.pacing === 'quick') {
      const enemyName = this.currentEncounter?.enemy?.name || 'none';
      const enemyHealth = this.currentEncounter?.enemy
        ? `${this.currentEncounter.enemy.health}/${this.currentEncounter.enemy.maxHealth}`
        : 'n/a';
      const stats = this.player.getStats();
      this.showStatus(
        `HP ${stats.health}/${this.player.maxHealth} | Enemy ${enemyName} ${enemyHealth} | Lvl ${stats.level} XP ${stats.xp}/${stats.xpToNext}`
      );
      this.showQuestSummary(true);
      return;
    }

    this.showStatus('--- STATUS ---');
    const stats = this.player.getStats();
    this.showStatus(
      `Class: ${stats.className} | Lvl: ${stats.level} | XP: ${stats.xp}/${stats.xpToNext}`
    );
    this.showStatus(
      `HP: ${stats.health}/${this.player.maxHealth} | STR: ${stats.strength} | AGI: ${stats.agility}`
    );
    if (this.currentEncounter && this.currentEncounter.enemy) {
      this.showStatus(`Enemy: ${this.currentEncounter.enemy.name}`);
    }
    this.showInventorySummary();
    this.showQuestSummary();
    this.showStatus('-------------');
  }

  showInventorySummary() {
    const inventory = this.player.getInventory();
    if (!inventory) {
      this.showStatus('Inventory: empty');
      return;
    }

    const summary = inventory
      .map((item) => `${item.name || item.id} x${item.quantity || 1}`)
      .join(', ');
    this.showStatus(`Inventory: ${summary}`);
  }

  showQuestSummary(compact = false) {
    const quests = Array.isArray(this.questState) ? this.questState : [];
    const active = quests.filter((quest) => !quest.completed);
    const completed = quests.length - active.length;

    if (compact) {
      this.showStatus(`Quests ${completed}/${quests.length} complete`);
      return;
    }

    if (active.length === 0) {
      this.showStatus(`Quests: ${completed}/${quests.length} complete`);
      return;
    }

    const summary = active
      .map((quest) => `${quest.title}: ${quest.progress}/${quest.target}`)
      .join(' | ');
    this.showStatus(`Quests: ${summary}`);
  }

  async battleLoop() {
    if (!this.player || !this.currentEncounter) {
      return;
    }

    let inBattle = true;
    while (inBattle) {
      this.showStateCard();
      if (!this.currentEncounter.enemy.isAlive()) {
        inBattle = await this.onEncounterWin();
        if (!inBattle) {
          return;
        }
        continue;
      }

      const { enemy } = this.currentEncounter;
      if (this.pacing === 'detailed') {
        this.showStatus(enemy.getDescription());
        this.showStatus(enemy.getHealth());
      } else {
        this.showStatus(`${enemy.name} HP: ${enemy.health}/${enemy.maxHealth}`);
      }

      const actor = computeTurnOrder(this.player, enemy, this.rng);
      if (actor === 'player') {
        const result = await this.playerTurn();
        this.showStatus(result.message);
        if (!this.player.isAlive()) {
          this.showStatus("You've been defeated!");
          return;
        }

        if (result.action === 'save') {
          await this.saveCurrentProgress();
        }
      } else {
        const result = this.enemyTurn();
        this.showStatus(result.message);
        if (!this.player.isAlive()) {
          this.showStatus("You've been defeated!");
          return;
        }

        if (result.target === this.player.name && result.damage > 0) {
          progression.applyQuestProgress(
            this.questState,
            { type: 'damaged_by_enemy' },
            this.player
          );
        } else {
          progression.applyQuestProgress(this.questState, { type: 'no_damage_round' }, this.player);
        }
      }

      const statusResult = this.applyEndOfRoundStatuses();
      statusResult.forEach((line) => this.showStatus(line));

      if (!enemy.isAlive()) {
        inBattle = await this.onEncounterWin();
        if (!inBattle) {
          return;
        }
      }
    }
  }

  applyEndOfRoundStatuses() {
    if (!this.player || !this.currentEncounter) {
      return [];
    }

    const logs = [];
    const playerTick = applyStatusTick(this.player, this.rng);
    const enemyTick = applyStatusTick(this.currentEncounter.enemy, this.rng);
    logs.push(...playerTick.logs);
    logs.push(...enemyTick.logs);
    return logs;
  }

  async playerTurn() {
    const { action } = await this.inquirer.prompt(prompts.battleAction());

    if (action === 'status') {
      this.showStateCard();
      return { action: 'status', message: 'Status reviewed.', target: this.player.name, damage: 0 };
    }

    if (action === 'save') {
      return { action: 'save', message: 'Saving game...', target: this.player.name, damage: 0 };
    }

    if (action === 'potion') {
      const inventory = this.player.getInventory();
      if (!inventory) {
        return {
          action: 'potion',
          message: "You don't have any potions!",
          target: this.player.name,
          damage: 0,
        };
      }

      const { index } = await this.inquirer.prompt(prompts.choosePotion(inventory));
      const useResult = resolveCombatTurn({
        actor: this.player,
        target: this.currentEncounter.enemy,
        actorType: 'player',
        action: 'item',
        itemIndex: index,
        rng: this.rng,
      });

      if (useResult.message) {
        return {
          action: 'potion',
          message: useResult.message,
          target: this.player.name,
          damage: 0,
        };
      }

      return useResult;
    }

    const result = resolveCombatTurn({
      actor: this.player,
      target: this.currentEncounter.enemy,
      actorType: 'player',
      action: 'attack',
      rng: this.rng,
    });

    return { ...result, action: 'attack' };
  }

  enemyTurn() {
    return computeEnemyTurn(this.currentEncounter.enemy, this.player, this.rng);
  }

  async onEncounterWin() {
    const enemy = this.currentEncounter.enemy;
    this.showStatus(`You've defeated the ${enemy.name}!`);

    const drops = enemy.getLoot(this.rng);
    drops.forEach((item) => this.player.addItem(item));
    if (drops.length > 0) {
      this.showStatus(`Loot gained: ${drops.map((item) => item.name).join(', ')}`);
    }
    const levelResult = progression.gainXp(this.player, enemy.xpReward, this.rng);
    const quests = progression.applyQuestProgress(
      this.questState,
      { type: 'enemy_defeated', isBoss: enemy.isBoss },
      this.player
    );
    if (quests.length > 0) {
      this.showStatus(`Quest rewards triggered: ${quests.join(', ')}`);
    }

    this.roundNumber += 1;

    if (levelResult.leveledUp) {
      this.showStatus(
        `Level up! Now level ${this.player.level} (+${levelResult.statDelta.health} HP, +${levelResult.statDelta.strength} STR, +${levelResult.statDelta.agility} AGI)`
      );
    }

    const hasMoreEncounters = this.roundNumber < this.encounterService.maxEncounters;
    if (!hasMoreEncounters) {
      this.showStatus('You have cleared the campaign!');
      this.showStatus('Thank you for playing this showcase cycle.');
      return false;
    }

    this.currentEncounter = this.encounterService.nextEncounter(
      this.player.level,
      this.roundNumber + 1
    );
    await this.saveCurrentProgress();
    return true;
  }
}

module.exports = Game;
