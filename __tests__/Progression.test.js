const Rng = require('../lib/core/Rng');
const Player = require('../lib/domain/player');
const progression = require('../lib/services/progression');

test('levels up and applies class growth', () => {
  const rng = new Rng(1234);
  const player = new Player('Riley', 'warrior', rng);
  const initial = {
    level: player.level,
    health: player.health,
    strength: player.strength,
    agility: player.agility
  };

  const outcome = progression.gainXp(player, player.xpToNext + 1, rng);
  expect(outcome.leveledUp).toBe(true);
  expect(player.level).toBe(initial.level + 1);
  expect(player.health).toBeGreaterThanOrEqual(initial.health);
  expect(player.strength).toBeGreaterThanOrEqual(initial.strength);
  expect(player.agility).toBeGreaterThanOrEqual(initial.agility);
});

test('returns active quest templates', () => {
  const quests = progression.defaultQuests();
  expect(Array.isArray(quests)).toBe(true);
  expect(quests.length).toBeGreaterThan(0);
});
