const DEFAULT_REGION_ID = 'meadow-road';

const REGIONS = [
  {
    id: DEFAULT_REGION_ID,
    name: 'Meadow Road',
    description: 'A safer trade path where new heroes learn the rhythm of battle.',
    unlockRound: 0,
    danger: 'Low',
  },
  {
    id: 'old-quarry',
    name: 'Old Quarry',
    description: 'A broken mine road where raiders and restless bones gather.',
    unlockRound: 2,
    danger: 'Medium',
  },
  {
    id: 'ashen-gate',
    name: 'Ashen Gate',
    description: 'A scorched pass watched by veteran warbands and boss-tier threats.',
    unlockRound: 4,
    danger: 'High',
  },
];

function getRegion(regionId = DEFAULT_REGION_ID) {
  return REGIONS.find((region) => region.id === regionId) || REGIONS[0];
}

function createWorldState(overrides = {}) {
  const discoveredRegions = Array.isArray(overrides.discoveredRegions)
    ? overrides.discoveredRegions.filter((regionId) => REGIONS.some((region) => region.id === regionId))
    : [DEFAULT_REGION_ID];

  if (!discoveredRegions.includes(DEFAULT_REGION_ID)) {
    discoveredRegions.unshift(DEFAULT_REGION_ID);
  }

  const currentRegion = discoveredRegions.includes(overrides.currentRegion)
    ? overrides.currentRegion
    : DEFAULT_REGION_ID;

  return {
    currentRegion,
    discoveredRegions,
  };
}

function discoverRegions(worldState, roundNumber) {
  const world = createWorldState(worldState);
  const unlocked = [];

  REGIONS.forEach((region) => {
    if (roundNumber >= region.unlockRound && !world.discoveredRegions.includes(region.id)) {
      world.discoveredRegions.push(region.id);
      unlocked.push(region);
    }
  });

  return { world, unlocked };
}

function getTravelChoices(worldState) {
  const world = createWorldState(worldState);

  return world.discoveredRegions.map((regionId) => {
    const region = getRegion(regionId);
    const marker = region.id === world.currentRegion ? 'current' : region.danger;

    return {
      name: `${region.name} - ${marker}`,
      value: region.id,
    };
  });
}

function summarizeRegion(regionId) {
  const region = getRegion(regionId);
  return `${region.name} (${region.danger}) - ${region.description}`;
}

module.exports = {
  DEFAULT_REGION_ID,
  REGIONS,
  createWorldState,
  discoverRegions,
  getRegion,
  getTravelChoices,
  summarizeRegion,
};
