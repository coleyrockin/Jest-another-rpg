# Jest-another-rpg

CLI-first showcase RPG written in Node.js with deterministic gameplay, class progression, combat systems, save/load, and a modular architecture.

## What this repo now includes

- `lib/core`: deterministic RNG and shared foundational utilities.
- `lib/domain`: character model, player/enemy domain entities, and item registry.
- `lib/services`: combat, progression, encounters, and storage services.
- `lib/ui`: prompt layouts for the CLI.
- `lib/Game.js`: orchestration and battle loop only.
- Jest tests for core systems.

## Quick start

```bash
npm install
npm start
```

Optional CLI arguments:

- `--seed=<number>` to force reproducible combat and encounter order.
- `--quiet` to suppress rich console state cards.
- `--pacing=detailed|quick` to pick output style.

## Gameplay loops

1. Start a new game and choose class:
   - Warrior: higher strength and melee crit profile.
   - Rogue: higher agility and dodge profile.
   - Mage: balanced power, damage multiplier and magic passive.
2. Battle flow:
   - Turn order is computed each round from agility + RNG.
   - Player actions: attack, use potion, save, or inspect status.
   - Enemy AI profiles: aggressive, tactical, opportunist.
3. Rewards:
   - XP, loots, quest updates, and potential level-up.
4. Persistence:
   - Save at any point from main menu or battle.
   - Continue from save for exact campaign resume.

## Save format

Saved files are written to `savegame.json` (created in the repo root):

```json
{
  "version": 1,
  "seed": 123456,
  "player": {
    "name": "Name",
    "className": "warrior",
    "level": 2,
    "xp": 40,
    "xpToNext": 190
  },
  "roundNumber": 1,
  "activeEncounter": {
    "encounterId": "orc-2-minion",
    "roundNumber": 2,
    "isBoss": false,
    "enemy": {
      "...": "..."
    }
  }
}
```

This schema is versioned (`version` field) and verified on load.

## Scripts

- `npm start` starts the CLI.
- `npm test` runs Jest.
- `npm run lint` runs ESLint.
- `npm run format` formats with Prettier.
- `npm run check` runs lint and tests together.

## Roadmap

- Add map-level world progression.
- Add shop and durable equipment system.
- Add deterministic replay export from seeds.
- Add narrative quests with branching outcomes.

## Contributing

This project is intentionally modular so new systems can be introduced with minimal coupling:

- Keep state mutation in orchestration (`Game`) and deterministic transformations in services.
- Keep tests focused on `lib/core`, `lib/services`, and `lib/domain` modules.
- Any save format changes must bump `version` in `StorageService` and include migration checks.
