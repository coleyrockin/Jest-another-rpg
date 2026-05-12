const Game = require('./lib/Game');

function readNumericArg(name, fallback) {
  const token = process.argv.find((entry) => entry.startsWith(`--${name}=`));

  if (!token) {
    return fallback;
  }

  const value = Number(token.split('=')[1]);

  if (Number.isNaN(value)) {
    return fallback;
  }

  return value;
}

const args = process.argv.slice(2);
const requestedPacing = args.find((entry) => entry.startsWith('--pacing='))?.split('=')[1];
const validPacing = new Set(['detailed', 'quick']);
const pacing = validPacing.has(requestedPacing) ? requestedPacing : 'detailed';
const options = {
  seed: readNumericArg('seed'),
  quiet: args.includes('--quiet'),
  pacing
};

const game = new Game(options);
game.initializeGame();
