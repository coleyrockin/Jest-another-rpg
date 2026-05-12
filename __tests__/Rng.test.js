const Rng = require('../lib/core/Rng');

test('produces deterministic output from a seeded stream', () => {
  const a = new Rng(9001);
  const b = new Rng(9001);

  expect(a.next()).toBe(b.next());
  expect(a.nextInt(1, 20)).toBe(b.nextInt(1, 20));
  expect(a.next()).toBe(b.next());
});

test('supports inclusive integer roll boundaries', () => {
  const rng = new Rng(1);
  const value = rng.nextInt(5, 5);
  expect(value).toBe(5);
});

test('restores deterministic state from a snapshot', () => {
  const source = new Rng(111);
  source.next();
  const snapshot = source.snapshot();
  const nextBeforeRestore = source.next();

  const resumed = new Rng(5);
  resumed.restore(snapshot);
  expect(resumed.next()).toBe(nextBeforeRestore);
});

test('handles chance boundaries, sampling, invalid seeds, and bad restore payloads', () => {
  const rng = new Rng('not-a-number');

  expect(rng.chance(0)).toBe(false);
  expect(rng.chance(100)).toBe(true);
  expect(rng.sample([])).toBeUndefined();
  expect(rng.sample('bad')).toBeUndefined();
  expect(['a', 'b']).toContain(rng.sample(['a', 'b']));

  rng.restore({ state: Number.NaN, initialSeed: Number.NaN });
  expect(Number.isFinite(rng.state)).toBe(true);
});
