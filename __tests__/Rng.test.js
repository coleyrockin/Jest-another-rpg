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
