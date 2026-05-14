const {
  createWorldState,
  discoverRegions,
  getTravelChoices,
  summarizeRegion,
} = require('../lib/domain/region');

test('world state defaults and discovers regions by round progress', () => {
  const initial = createWorldState();

  expect(initial).toEqual({
    currentRegion: 'meadow-road',
    discoveredRegions: ['meadow-road'],
  });

  const quarry = discoverRegions(initial, 2);
  expect(quarry.unlocked.map((region) => region.id)).toEqual(['old-quarry']);
  expect(quarry.world.discoveredRegions).toEqual(['meadow-road', 'old-quarry']);

  const gate = discoverRegions(quarry.world, 4);
  expect(gate.unlocked.map((region) => region.id)).toEqual(['ashen-gate']);
  expect(getTravelChoices(gate.world).map((choice) => choice.value)).toEqual([
    'meadow-road',
    'old-quarry',
    'ashen-gate',
  ]);
  expect(summarizeRegion('old-quarry')).toContain('Old Quarry');
});
