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
    agility: player.agility,
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

test('supports multi-level unlock progression', () => {
  const rng = new Rng(222);
  const player = new Player('Riley', 'mage', rng);

  const outcome = progression.gainXp(player, 1000, rng);

  expect(outcome.levelDelta).toBeGreaterThan(1);
  expect(outcome.unlocked).toEqual(expect.arrayContaining(['combat_rush']));
  expect(player.unlockedLevel3).toBe(true);
});

test('quest progress grants rewards and resets no-hit streaks', () => {
  const rng = new Rng(333);
  const player = new Player('Questor', 'rogue', rng);
  const quests = progression.defaultQuests();

  expect(
    progression.applyQuestProgress(quests, { type: 'enemy_defeated', isBoss: false }, player)
  ).toEqual([]);
  expect(
    progression.applyQuestProgress(quests, { type: 'enemy_defeated', isBoss: false }, player)
  ).toEqual(['defeat-two']);
  expect(quests.find((quest) => quest.id === 'defeat-two').completed).toBe(true);

  progression.applyQuestProgress(quests, { type: 'no_damage_round' }, player);
  progression.applyQuestProgress(quests, { type: 'no_damage_round' }, player);
  progression.applyQuestProgress(quests, { type: 'damaged_by_enemy' }, player);
  expect(quests.find((quest) => quest.id === 'no-hit-streak').progress).toBe(0);

  progression.applyQuestProgress(quests, { type: 'no_damage_round' }, player);
  progression.applyQuestProgress(quests, { type: 'no_damage_round' }, player);
  const streakReward = progression.applyQuestProgress(quests, { type: 'no_damage_round' }, player);
  expect(streakReward).toEqual(['no-hit-streak']);
  expect(player.inventory.some((item) => item.id === 'strength')).toBe(true);

  expect(
    progression.applyQuestProgress(quests, { type: 'enemy_defeated', isBoss: true }, player)
  ).toEqual(['boss-tier']);
});

test('missing scout quest advances through regional objectives and grants reward', () => {
  const player = new Player('Scout', 'rogue', new Rng(444));
  const quests = progression.defaultQuests();
  const scout = quests.find((quest) => quest.id === 'missing-scout');

  expect(
    progression.applyQuestProgress(
      quests,
      { type: 'region_traveled', regionId: 'old-quarry' },
      player
    )
  ).toEqual([]);
  expect(scout.progress).toBe(1);

  progression.applyQuestProgress(
    quests,
    { type: 'enemy_defeated', regionId: 'old-quarry', isBoss: false },
    player
  );
  expect(scout.progress).toBe(2);

  expect(
    progression.applyQuestProgress(
      quests,
      { type: 'enemy_defeated', regionId: 'ashen-gate', isBoss: true },
      player
    )
  ).toEqual(expect.arrayContaining(['missing-scout']));
  expect(scout.completed).toBe(true);
  expect(player.gold).toBeGreaterThanOrEqual(45);
  expect(player.inventory.some((item) => item.id === 'scout_charm')).toBe(true);
});
