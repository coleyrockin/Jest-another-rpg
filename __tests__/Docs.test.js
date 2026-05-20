const fs = require('fs');
const path = require('path');

test('README points to transcript generation and avoids stale exact suite counts', () => {
  const readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');

  expect(readme).toContain('npm run transcript');
  expect(readme).not.toMatch(/\d+ Jest suites/);
});
