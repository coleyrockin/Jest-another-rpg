const Game = require('../lib/Game');
const Player = require('../lib/domain/player');
const { createItem } = require('../lib/domain/items');
const { createWorldState } = require('../lib/domain/region');

const lines = [];
const game = new Game({ seed: 1300, quiet: true, pacing: 'detailed' });

game.showStatus = (line) => lines.push(line);
game.player = new Player('Ari', 'warrior', game.rng);
game.player.gold = 76;
game.player.addItem(createItem('iron_sword'));
game.player.equipItem(2);
game.worldState = createWorldState({
  currentRegion: 'old-quarry',
  discoveredRegions: ['meadow-road', 'old-quarry'],
});
game.currentEncounter = game.encounterService.nextEncounter(
  game.player.level,
  2,
  game.worldState.currentRegion
);

game.showStateCard();
lines.push('');
lines.push('Adventure Hub - Old Quarry');
lines.push('  Continue to next encounter');
lines.push('  Travel');
lines.push('  Rest');
lines.push('  Equip gear');
lines.push('  Visit shop');
lines.push('');
lines.push('Shop: Bought Health Potion for 12g.');
lines.push('Gear: Equipped Iron Sword.');
lines.push('Campaign clear: You have cleared the campaign!');

console.log(lines.join('\n'));
