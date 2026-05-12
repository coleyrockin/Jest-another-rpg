const Rng = require('../lib/core/Rng');
const Player = require('../lib/domain/player');
const Enemy = require('../lib/domain/enemy');
const { resolveCombatTurn, computeTurnOrder } = require('../lib/services/combat');

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
