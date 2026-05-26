# Jest-Another-RPG

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=flat&logo=jest&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![CI](https://github.com/coleyrockin/Jest-another-rpg/actions/workflows/ci.yml/badge.svg)

CLI-first RPG engine built with deterministic gameplay systems, class progression, combat services, inventory, quests, region travel, and resumable save files.

This started as a small Jest practice project. It is now structured like a real product core: domain models stay separate from services, the CLI is orchestration only, and important behavior is covered by deterministic tests.

## Quick Start

Requirements:

- Node.js `>=18`
- npm

```bash
git clone https://github.com/coleyrockin/Jest-another-rpg.git
cd Jest-another-rpg
npm install
npm start
```

Useful CLI flags:

```bash
npm start -- --seed=12345
npm start -- --pacing=quick
npm start -- --quiet
npm start -- --help
```

## Project status

- Current release: `1.3.0`.
- Scope: CLI-only RPG portfolio core with deterministic progression and save support.
- Roadmap state: see [ROADMAP.md](ROADMAP.md) for executable next-agent priorities.

## Tech stack

- Node.js >= 18
- JavaScript (CommonJS)
- Inquirer (CLI prompts)
- Jest (unit/integration testing)
- ESLint / Prettier (lint and formatting)

## Environment Variables

No environment variables are required for local development or gameplay.

Security defaults:

- Local saves are written to `savegame.json`, which is ignored by Git.
- `.env` and `.env.*` files are ignored.
- If environment variables are added later, commit only a safe `.env.example`.

## Current Features

- Deterministic RNG with seed and snapshot restore support.
- Three starter classes: Warrior, Rogue, and Mage.
- Agility-based initiative, dodge checks, critical hits, mitigation, and status effects.
- Enemy profiles for aggressive, tactical, and opportunist behavior.
- Consumable inventory with health, strength, agility, cleanse, and defend effects.
- Encounter progression with boss milestones and guaranteed boss reward drops.
- Adventure Mode with an intermission hub, rest action, region travel, equipment, and shops.
- Three region identities: Meadow Road, Old Quarry, and Ashen Gate.
- Gold rewards, purchasable consumables, and equipment slots for weapon, armor, and charm.
- Quest tracking for enemy defeats, boss clears, and no-damage streaks.
- Versioned `savegame.json` with atomic writes, checksum validation, and schema migration.
- CLI help, input validation, quick/detailed pacing, and recoverable corrupt-save handling.

## Terminal Showcase

This is a terminal application, so the best portfolio screenshots are terminal transcripts.
The example below is generated with `npm run transcript`.

```text
+ Jest-Another-RPG Status --------------------------------+
| Hero   Ari the Warrior | Lvl 1                          |
| HP     [############] 100/100 | XP [..........] 0/55    |
| Stats  STR 15 | AGI 8 | Gold 76g                        |
| World  Old Quarry (Medium)                              |
| Enemy  Orc Miner | HP [##########] 113/113              |
| Gear   Weapon: Iron Sword | Armor: empty | Charm: empty |
| Bag    Health Potion x2                                 |
| Quests 0/4 complete                                     |
| - Defeat 2 random enemies: 0/2                          |
| - Survive a boss encounter: 0/1                         |
| - Avoid taking damage for 3 consecutive rounds: 0/3     |
| - Find the Missing Scout: 0/3                           |
+---------------------------------------------------------+
Region detail: Old Quarry (Medium) - A broken mine road where raiders and restless bones gather.

Adventure Hub - Old Quarry
  Continue to next encounter
  Travel
  Rest
  Equip gear
  Visit shop

Shop: Bought Health Potion for 12g.
Gear: Equipped Iron Sword.
Campaign clear: You have cleared the campaign!
```

Suggested portfolio screenshots:

- Main menu with a saved game available.
- Detailed battle status card with region, gear, inventory, and quests.
- Adventure Hub showing travel, rest, equipment, shop, and save options.
- Shop/equipment transcript after a seeded run.
- Campaign clear message after a seeded run.

## Gameplay Loop

1. Start a new game.
2. Name a character and choose a class.
3. Fight generated encounters.
4. Earn XP, loot, quest progress, and level-ups.
5. Use the Adventure Hub to travel, rest, equip gear, visit shops, review status, or save.
6. Continue later with exact RNG continuity and current region state.

## Class Matrix

| Class   | Strength | Agility | Health | Style                                   |
| ------- | -------: | ------: | -----: | --------------------------------------- |
| Warrior |     High |  Medium |   High | Strong base hits and higher crit payoff |
| Rogue   |   Medium |    High | Medium | Dodge-focused with faster initiative    |
| Mage    |   Medium |  Medium | Medium | Higher attack scaling and burst profile |

## Architecture

```text
app.js                  CLI entrypoint and option parsing
lib/Game.js             Game orchestration and battle loop
lib/core/Rng.js         Seeded RNG with snapshot/restore
lib/domain/*            Character, player, enemy, class, and item models
lib/services/combat.js  Pure combat resolution
lib/services/encounter.js
lib/services/progression.js
lib/services/storage.js
lib/domain/region.js      Adventure regions and world-state helpers
lib/services/shop.js      Regional shop and purchase rules
lib/ui/prompts.js       Inquirer prompt definitions
```

Compatibility shims remain at `lib/Character.js`, `lib/Player.js`, `lib/Enemy.js`, and `lib/Potion.js` for older tests/imports.

## Save Schema

Saves are written to `savegame.json` in the repo root and ignored by Git.

```json
{
  "version": 2,
  "seed": 12345,
  "rngState": {
    "state": 67890,
    "initialSeed": 12345
  },
  "player": {
    "name": "Ari",
    "className": "warrior",
    "level": 2,
    "xp": 12,
    "xpToNext": 203,
    "inventory": [],
    "gold": 42,
    "equipment": {
      "weapon": null,
      "armor": null,
      "charm": null
    }
  },
  "roundNumber": 2,
  "activeEncounter": {},
  "quests": [],
  "world": {
    "currentRegion": "meadow-road",
    "discoveredRegions": ["meadow-road"]
  },
  "updatedAt": "2026-05-12T00:00:00.000Z",
  "timestamp": "2026-05-12T00:00:00.000Z",
  "logHash": "sha256-checksum"
}
```

Storage behavior:

- Writes are atomic (`savegame.json.tmp` then rename).
- `logHash` detects corrupted saves.
- Legacy saves without a version migrate to schema version `2`.
- Version `1` saves migrate into default Adventure Mode world state.
- Future versions are rejected instead of silently downgraded.
- Corrupt saves offer a recoverable delete flow in the CLI.

## Scripts

```bash
npm start        # run the CLI
npm test         # run Jest tests
npm run coverage # run Jest with enforced coverage gates
npm run smoke    # run scripted CLI/product smoke checks
npm run transcript # print deterministic terminal showcase output
npm run lint     # run ESLint
npm run check    # lint + tests
npm run ci       # lint + tests + coverage + smoke
npm run format   # apply Prettier
```

Current quality gate:

- Jest suites cover CLI flow, combat, progression, storage, terminal presentation, shops, regions, and compatibility adapters.
- Deterministic RNG tests.
- Combat, progression, player, enemy, potion, storage, CLI, and integration tests.
- Coverage thresholds: `75%` statements, `75%` lines, `70%` functions, `65%` branches.
- `npm run ci` is the release gate.

## Release Checklist

Run these before tagging a release:

```bash
npm run format
npm run ci
npm start -- --help
npm audit --omit=dev
git status --short --branch
```

Release steps:

1. Confirm version and changelog are updated.
2. Confirm `main` is aligned with `origin/main`.
3. Commit release changes.
4. Tag the release, for example `git tag v1.3.0`.
5. Push `main` and the release tag.

## Deployment Notes

This project is a CLI app, not a hosted web service.

- Run locally with `npm start`.
- Validate releases with `npm run ci`.
- GitHub Actions runs the same CI gate on `main` and pull requests.
- There is no production server, database, or external API dependency.

## Demo and deployment links

- Demo: no hosted deployment (CLI project).
- Deployment: local runtime only.

## Known Limitations

- CLI-only experience; no browser UI is included.
- Campaign content is intentionally compact for a portfolio MVP.
- Save schema is currently version `2`; future schema changes require migrations.
- Screenshots are terminal examples rather than hosted visual pages.

## Security Notes

- `npm audit --omit=dev` is part of the manual release audit.
- Save files include an integrity hash to detect local corruption.
- No credentials, tokens, or environment-specific config are required.
- Runtime state files and environment files are excluded by `.gitignore`.

## Roadmap

- Planned features and execution order are tracked in [ROADMAP.md](ROADMAP.md).

- Shipped major milestones:
  - v1.2.0 CLI quality and CI hardening.
  - v1.3.0 Adventure Mode, region travel, gear/equipment, shop, quests, and schema v2 saves.

## Contribution Rules

- Keep domain state in `lib/domain`.
- Keep deterministic logic in `lib/services`.
- Keep CLI text and validation in `lib/ui/prompts.js`.
- Keep `lib/Game.js` focused on orchestration.
- Any save schema change must bump `CURRENT_SAVE_VERSION`, add migration coverage, and document the new fields.

Built by [Boyd Roberts](https://github.com/coleyrockin).
