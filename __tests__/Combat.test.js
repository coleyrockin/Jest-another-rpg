const Rng = require('../lib/core/Rng');
const Player = require('../lib/domain/player');
const Enemy = require('../lib/domain/enemy');
const {
  resolveCombatTurn,
  computeTurnOrder,
  computeEnemyTurn,
  selectEnemyAction,
  applyStatusTick,
} = require('../lib/services/combat');

test('resolves a simple player critical attack', () => {
  const rng = new Rng(77);
  const player = new Player('Ari', 'warrior', rng);
  player.agility = 20;
  const enemy = new Enemy({ name: 'Dummy', health: 80, agility: 5 }, rng);

  const result = resolveCombatTurn({
    actor: player,
    target: enemy,
    actorType: 'player',
    action: 'attack',
    rng,
  });

  expect(result.attacker).toBe('player');
  expect(result.target).toBe(enemy.name);
  expect(enemy.health).toBeLessThan(80);
});

test('enemy turn order uses agility and randomness', () => {
  const rng = new Rng(12);
  const player = new Player('Ari', 'warrior', rng);
  const enemy = new Enemy({ name: 'Orc', agility: 7 }, rng);
  const turn = computeTurnOrder(player, enemy, rng);
  expect(turn === 'player' || turn === 'enemy').toBe(true);
});

test('invalid item effects are recoverable and do not crash combat', () => {
  const rng = new Rng(77);
  const player = new Player('Ari', 'warrior', rng);
  const enemy = new Enemy({ name: 'Dummy', health: 80, agility: 5, rng });
  player.inventory = [
    {
      id: 'broken',
      name: 'Broken Relic',
      type: 'potion',
      effect: 'unknown',
      value: 0,
      quantity: 1,
      stackable: true,
    },
  ];

  const result = resolveCombatTurn({
    actor: player,
    target: enemy,
    actorType: 'player',
    action: 'item',
    itemIndex: 0,
    rng,
  });

  expect(result.hit).toBe(false);
  expect(result.message).toBe('Broken Relic had no effect.');
  expect(player.inventory).toHaveLength(1);
});

test('stunned actors miss their attack action', () => {
  const rng = new Rng(77);
  const player = new Player('Ari', 'warrior', rng);
  const enemy = new Enemy({ name: 'Dummy', health: 80, agility: 5, rng });
  player.addStatus('stunned', 1);

  const result = resolveCombatTurn({
    actor: player,
    target: enemy,
    actorType: 'player',
    action: 'attack',
    rng,
  });

  expect(result.hit).toBe(false);
  expect(result.message).toContain('is stunned');
});

test('dodges, critical hits, focus, and mitigation resolve through combat service', () => {
  const attackerRng = { nextInt: () => 10 };
  const player = new Player('Ari', 'warrior', attackerRng);
  const enemy = new Enemy({ name: 'Dummy', health: 80, agility: 5, rng: new Rng(1) });

  const dodgeResult = resolveCombatTurn({
    actor: player,
    target: enemy,
    actorType: 'player',
    action: 'attack',
    rng: { chance: () => true },
  });
  expect(dodgeResult.hit).toBe(false);

  const critRng = {
    outcomes: [false, true],
    chance(percent) {
      return percent > 0 ? this.outcomes.shift() : false;
    },
  };
  const critResult = resolveCombatTurn({
    actor: player,
    target: enemy,
    actorType: 'player',
    action: 'attack',
    rng: critRng,
  });
  expect(critResult.crit).toBe(true);

  const focusResult = resolveCombatTurn({
    actor: enemy,
    target: player,
    actorType: 'enemy',
    action: 'focus',
    rng: new Rng(3),
  });
  expect(focusResult.statusApplied).toEqual(['defending']);
  expect(enemy.hasStatus('defending')).toBe(true);

  const healthBefore = enemy.health;
  resolveCombatTurn({
    actor: player,
    target: enemy,
    actorType: 'player',
    action: 'attack',
    rng: { chance: () => false },
  });
  expect(enemy.health).toBeLessThan(healthBefore);
});

test('enemy AI can focus tactically or fall back to attack', () => {
  const player = new Player('Ari', 'warrior', new Rng(1));
  const tactical = new Enemy({
    name: 'Tactician',
    health: 10,
    maxHealth: 100,
    aiProfile: 'tactical',
    rng: new Rng(2),
  });

  expect(selectEnemyAction(tactical, player, { chance: () => true })).toEqual({
    type: 'focus',
  });
  expect(computeEnemyTurn(tactical, player, { chance: () => true }).action).toBe('focus');

  const unknown = new Enemy({ name: 'Unknown', aiProfile: 'unknown', rng: new Rng(3) });
  expect(selectEnemyAction(unknown, player, new Rng(4))).toEqual({ type: 'attack' });
});

test('status ticks apply poison and expiration logs', () => {
  const player = new Player('Ari', 'warrior', new Rng(1));
  player.addStatus('poisoned', 1, { intensity: 2 });
  player.addStatus('defending', 1);
  player.addStatus('stunned', 1);

  const result = applyStatusTick(player);

  expect(result.poisonDamage).toBeGreaterThan(0);
  expect(result.expired).toEqual(expect.arrayContaining(['poisoned', 'defending', 'stunned']));
  expect(result.logs).toEqual(expect.arrayContaining(["Ari's guard ended."]));
});
