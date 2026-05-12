const { main, parseOptions, printHelp } = require('../app');

test('parses CLI options without starting the game', () => {
  const options = parseOptions(['--seed=42', '--pacing=quick', '--quiet']);

  expect(options).toEqual({
    help: false,
    seed: 42,
    quiet: true,
    pacing: 'quick',
  });
});

test('falls back to detailed pacing for unsupported pacing values', () => {
  const options = parseOptions(['--pacing=fast']);

  expect(options.pacing).toBe('detailed');
});

test('falls back when seed is missing or invalid', () => {
  expect(parseOptions([]).seed).toBeUndefined();
  expect(parseOptions(['--seed=not-a-number']).seed).toBeUndefined();
});

test('prints CLI help text', () => {
  const lines = [];
  printHelp((line) => lines.push(line));

  expect(lines.join('\n')).toContain('--seed=<number>');
  expect(lines.join('\n')).toContain('--pacing=detailed|quick');
});

test('main exits early for help', async () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});

  await main(['--help']);

  expect(spy).toHaveBeenCalledWith('Jest-Another-RPG');
  spy.mockRestore();
});
