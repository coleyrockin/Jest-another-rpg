const EncounterService = require('../lib/services/encounter');
const Rng = require('../lib/core/Rng');

test('generates normal and boss encounters deterministically', () => {
  const service = new EncounterService(new Rng(123));

  const normal = service.nextEncounter(1, 1);
  const boss = service.nextEncounter(2, 3);

  expect(normal.isBoss).toBe(false);
  expect(normal.enemy.level).toBeGreaterThanOrEqual(1);
  expect(boss.isBoss).toBe(true);
  expect(boss.encounterId).toContain('boss');
});

test('hydrates and serializes encounters safely', () => {
  const service = new EncounterService(new Rng(456));
  const encounter = service.nextEncounter(1, 1);
  const serialized = service.serializeEncounter(encounter);
  const hydrated = service.hydrateEncounter(serialized);

  expect(hydrated.enemy.name).toBe(encounter.enemy.name);
  expect(service.hydrateEncounter(null)).toBeNull();
  expect(service.serializeEncounter(null)).toBeNull();
});

test('generates region-specific encounter metadata', () => {
  const service = new EncounterService(new Rng(789));
  const encounter = service.nextEncounter(1, 2, 'old-quarry');

  expect(encounter.regionId).toBe('old-quarry');
  expect(encounter.regionName).toBe('Old Quarry');
  expect(encounter.encounterId).toContain('old-quarry');
});
