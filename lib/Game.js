const inquirer = require('inquirer');
const Rng = require('./core/Rng');
const Player = require('./domain/player');
const prompts = require('./ui/prompts');
const StorageService = require('./services/storage');
const EncounterService = require('./services/encounter');
const progression = require('./services/progression');
const shop = require('./services/shop');
const {
  createWorldState,
  discoverRegions,
  getRegion,
  summarizeRegion,
} = require('./domain/region');
const { box, compactQuest, progressBar, stackInventory, titleCase } = require('./ui/terminal');
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
    this.worldState = createWorldState();
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
      '- Adventure Mode lets you travel between unlocked regions after battles.',
      '- Gold, equipment, and regional shops now shape your build between fights.',
    ];
    lines.forEach((line) => this.showStatus(line));
  }

  async startNewGame() {
    const { name } = await this.inquirer.prompt(prompts.askName());
    const { className } = await this.inquirer.prompt(prompts.askClass());

    this.player = new Player(name, className, this.rng);
    this.roundNumber = 0;
    this.questState = progression.defaultQuests();
    this.worldState = createWorldState();
    this.currentEncounter = this.encounterService.nextEncounter(
      this.player.level,
      1,
      this.worldState.currentRegion
    );

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
      this.worldState = createWorldState(save.world);
      this.currentEncounter = save.activeEncounter
        ? this.encounterService.hydrateEncounter(save.activeEncounter)
        : this.encounterService.nextEncounter(
            this.player.level,
            this.roundNumber + 1,
            this.worldState.currentRegion
          );

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
      world: this.worldState,
    };
    await this.storage.saveGame(state);
    this.showStatus('Game saved.');
  }

  showStateCard() {
    if (!this.player) {
      return;
    }

    if (this.pacing === 'quick') {
      const enemyName = this.currentEncounter?.enemy?.name
        ? titleCase(this.currentEncounter.enemy.name)
        : 'none';
      const enemyHealth = this.currentEncounter?.enemy
        ? `${this.currentEncounter.enemy.health}/${this.currentEncounter.enemy.maxHealth}`
        : 'n/a';
      const stats = this.player.getStats();
      const region = getRegion(this.worldState.currentRegion);
      this.showStatus(
        `${progressBar(stats.health, this.player.maxHealth, 8)} | ${region.name} | Enemy ${enemyName} ${enemyHealth} | Lvl ${stats.level} XP ${stats.xp}/${stats.xpToNext}`
      );
      this.showQuestSummary(true);
      return;
    }

    const stats = this.player.getStats();
    const region = getRegion(this.worldState.currentRegion);
    const enemyName = this.currentEncounter?.enemy
      ? titleCase(this.currentEncounter.enemy.name)
      : 'None';
    const enemyHealth = this.currentEncounter?.enemy
      ? progressBar(this.currentEncounter.enemy.health, this.currentEncounter.enemy.maxHealth, 10)
      : 'n/a';
    const inventory = this.formatInventorySummary();
    const questLines = this.formatQuestLines();

    box('Jest-Another-RPG Status', [
      `Hero   ${this.player.name} the ${titleCase(stats.className)} | Lvl ${stats.level}`,
      `HP     ${progressBar(stats.health, this.player.maxHealth)} | XP ${progressBar(
        stats.xp,
        stats.xpToNext,
        10
      )}`,
      `Stats  STR ${stats.strength} | AGI ${stats.agility} | Gold ${stats.gold}g`,
      `World  ${region.name} (${region.danger})`,
      `Enemy  ${enemyName} | HP ${enemyHealth}`,
      `Gear   Weapon: ${stats.equipment.weapon} | Armor: ${stats.equipment.armor} | Charm: ${stats.equipment.charm}`,
      `Bag    ${inventory}`,
      ...questLines,
    ]).forEach((line) => this.showStatus(line));

    if (this.currentEncounter && this.currentEncounter.enemy) {
      this.showStatus(`Region detail: ${summarizeRegion(this.worldState.currentRegion)}`);
    }
  }

  formatInventorySummary() {
    const inventory = this.player.getInventory();
    if (!inventory) {
      return 'empty';
    }

    return stackInventory(inventory).join(', ');
  }

  showInventorySummary() {
    this.showStatus(`Inventory: ${this.formatInventorySummary()}`);
  }

  formatQuestLines() {
    const quests = Array.isArray(this.questState) ? this.questState : [];
    const complete = quests.filter((quest) => quest.completed).length;

    if (quests.length === 0) {
      return ['Quests none'];
    }

    return [
      `Quests ${complete}/${quests.length} complete`,
      ...quests
        .filter((quest) => !quest.completed)
        .map((quest) => `- ${quest.title}: ${quest.progress}/${quest.target}`),
    ];
  }

  showQuestSummary(compact = false) {
    const quests = Array.isArray(this.questState) ? this.questState : [];

    if (compact) {
      this.showStatus(compactQuest(quests));
      return;
    }

    this.formatQuestLines().forEach((line) => this.showStatus(line));
  }

  async adventureHub() {
    let choosing = true;

    while (choosing) {
      const region = getRegion(this.worldState.currentRegion);
      box(`Adventure Hub - ${region.name}`, [
        summarizeRegion(region.id),
        `Hero ${this.player.name} | HP ${this.player.health}/${this.player.maxHealth} | Gold ${this.player.gold}g`,
      ]).forEach((line) => this.showStatus(line));
      const { action } = await this.inquirer.prompt(prompts.adventureAction(region.name));

      if (action === 'continue') {
        return true;
      }

      if (action === 'travel') {
        const { regionId } = await this.inquirer.prompt(prompts.chooseRegion(this.worldState));
        this.worldState = createWorldState({ ...this.worldState, currentRegion: regionId });
        this.showStatus(`Travel complete: ${summarizeRegion(regionId)}`);
        const quests = progression.applyQuestProgress(
          this.questState,
          { type: 'region_traveled', regionId },
          this.player
        );
        if (quests.length > 0) {
          this.showStatus(`Quest rewards triggered: ${quests.join(', ')}`);
        }
      }

      if (action === 'rest') {
        const restored = Math.max(1, Math.floor(this.player.maxHealth * 0.2));
        const before = this.player.health;
        this.player.health = Math.min(this.player.maxHealth, this.player.health + restored);
        this.showStatus(`Rested and recovered ${this.player.health - before} HP.`);
      }

      if (action === 'status') {
        this.showStateCard();
      }

      if (action === 'equip') {
        const entries = this.player.getEquippableInventory();
        const { index } = await this.inquirer.prompt(prompts.chooseEquipment(entries));
        const result = this.player.equipItem(index);
        this.showStatus(`Gear: ${result.message}`);
      }

      if (action === 'shop') {
        const { itemId } = await this.inquirer.prompt(
          prompts.chooseShopItem(this.worldState.currentRegion, this.player)
        );
        const result = shop.buyItem(this.player, itemId, this.worldState.currentRegion);
        this.showStatus(`Shop: ${result.message}`);
      }

      if (action === 'help') {
        this.renderHelp();
      }

      if (action === 'save') {
        await this.saveCurrentProgress();
        return false;
      }
    }

    return true;
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
      const inventory = this.player.getConsumableInventory();
      if (inventory.length === 0) {
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
    const gold = this.player.addGold(Math.floor(enemy.goldReward * this.player.getGoldMultiplier()));
    this.showStatus(`Gold gained: ${gold}g`);
    const levelResult = progression.gainXp(this.player, enemy.xpReward, this.rng);
    const quests = progression.applyQuestProgress(
      this.questState,
      {
        type: 'enemy_defeated',
        isBoss: enemy.isBoss,
        regionId: this.currentEncounter.regionId || this.worldState.currentRegion,
      },
      this.player
    );
    if (quests.length > 0) {
      this.showStatus(`Quest rewards triggered: ${quests.join(', ')}`);
    }

    this.roundNumber += 1;
    this.currentEncounter = null;

    const discovery = discoverRegions(this.worldState, this.roundNumber);
    this.worldState = discovery.world;
    discovery.unlocked.forEach((region) => {
      this.showStatus(`New region unlocked: ${region.name} (${region.danger})`);
    });

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

    const continueAdventure = await this.adventureHub();
    if (!continueAdventure) {
      return false;
    }

    this.currentEncounter = this.encounterService.nextEncounter(
      this.player.level,
      this.roundNumber + 1,
      this.worldState.currentRegion
    );
    await this.saveCurrentProgress();
    return true;
  }
}

module.exports = Game;
