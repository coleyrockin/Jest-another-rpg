const Game = require('./lib/Game');

const VALID_PACING = new Set(['detailed', 'quick']);

function readNumericArg(argv, name, fallback) {
  const token = argv.find((entry) => entry.startsWith(`--${name}=`));

  if (!token) {
    return fallback;
  }

  const value = Number(token.split('=')[1]);

  if (Number.isNaN(value)) {
    return fallback;
  }

  return value;
}

function parseOptions(argv = process.argv.slice(2)) {
  const requestedPacing = argv.find((entry) => entry.startsWith('--pacing='))?.split('=')[1];

  return {
    help: argv.includes('--help') || argv.includes('-h'),
    seed: readNumericArg(argv, 'seed'),
    quiet: argv.includes('--quiet'),
    pacing: VALID_PACING.has(requestedPacing) ? requestedPacing : 'detailed',
  };
}

function printHelp(output = console.log) {
  [
    'Jest-Another-RPG',
    '',
    'Usage:',
    '  npm start -- [--seed=<number>] [--pacing=detailed|quick] [--quiet]',
    '',
    'Options:',
    '  --seed=<number>          Reproduce encounter and combat RNG.',
    '  --pacing=detailed|quick  Choose narration depth.',
    '  --quiet                  Suppress console narration.',
    '  --help, -h               Show this help.',
  ].forEach((line) => output(line));
}

async function main(argv = process.argv.slice(2)) {
  const options = parseOptions(argv);
  if (options.help) {
    printHelp();
    return;
  }

  const game = new Game(options);
  await game.initializeGame();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  main,
  parseOptions,
  printHelp,
};
