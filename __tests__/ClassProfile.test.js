const {
  CLASS_PROFILES,
  getClassOptions,
  getClassProfile,
  normalizeClassName,
} = require('../lib/domain/classProfile');

test('normalizes class names and aliases', () => {
  expect(normalizeClassName()).toBe('warrior');
  expect(normalizeClassName('war')).toBe('warrior');
  expect(normalizeClassName('rog')).toBe('rogue');
  expect(normalizeClassName('mag')).toBe('mage');
  expect(normalizeClassName('unknown')).toBe('warrior');
});

test('returns class profiles and prompt options', () => {
  expect(getClassProfile('rogue')).toBe(CLASS_PROFILES.rogue);
  expect(getClassOptions()).toHaveLength(3);
  expect(getClassOptions().map((option) => option.value)).toEqual(['warrior', 'rogue', 'mage']);
});
