const Character = require('../lib/domain/character');
const Rng = require('../lib/core/Rng');

test('character defaults, attack rolls, health, healing, and save shape are stable', () => {
  const character = new Character('Base', { rng: new Rng(10) });

  expect(character.getHealth()).toContain("Base's health is now");
  expect(character.getAttackValue()).toBeGreaterThan(0);

  character.reduceHealth(9999);
  expect(character.isAlive()).toBe(false);
  expect(character.health).toBe(0);

  character.heal(1000);
  expect(character.health).toBe(character.maxHealth);
  expect(character.toSave()).toMatchObject({
    name: 'Base',
    health: character.health,
    maxHealth: character.maxHealth,
  });
});

test('status helpers add, update, remove, expire, and apply poison', () => {
  const character = new Character('Status', {
    health: 20,
    maxHealth: 20,
    strength: 10,
    agility: 10,
  });

  character.addStatus('', 1);
  character.addStatus('defending', 1, { amount: 2 });
  character.addStatus('defending', 3, { amount: 4 });
  expect(character.getStatus('defending')).toMatchObject({ duration: 3, amount: 4 });

  character.addStatus('poisoned', 1, { intensity: 2 });
  expect(character.applyPoisonTick()).toBe(3);

  character.removeStatus('poisoned');
  expect(character.hasStatus('poisoned')).toBe(false);

  const expired = character.decrementStatusDurations();
  expect(expired).toEqual([]);
  character.decrementStatusDurations();
  expect(character.decrementStatusDurations()).toEqual(['defending']);
});
