# Changelog

## 1.3.0

- Started Adventure Mode with a between-battle hub for travel, rest, status review, help, and save-and-return.
- Added three regions with unlock progression and region-specific encounter pools.
- Added gold rewards, persistent equipment slots, regional shops, and gear-safe potion selection.
- Added the first authored regional quest chain: `Find the Missing Scout`.
- Bumped save schema to version `2` with v1 migration into persisted world state.
- Extended status output with current region context.

## 1.2.1

- Refreshed lockfile dependencies with `npm audit fix`.
- Verified runtime dependency audit reports zero vulnerabilities.
- Expanded README sections for screenshots, environment variables, deployment notes, known limitations, and security notes.
- Added `.env` ignore coverage while allowing a safe `.env.example` if one is introduced later.

## 1.2.0

- Added GitHub Actions CI for Node 18 and Node 20.
- Added enforced Jest coverage gates for statements, lines, functions, and branches.
- Added scripted smoke checks for CLI help, save, continue, delete, and campaign clear flows.
- Expanded test coverage across game orchestration, combat, prompts, progression, storage, encounters, and compatibility adapters.
- Bumped runtime support to Node `>=18`.
- Added release checklist documentation for the portfolio-grade CLI release flow.

## 1.1.1

- Added CLI `--help` output and testable option parsing.
- Improved save migration by rejecting future schema versions, including numeric strings.
- Preserved saved enemy status effects and player unlock flags across resume.
- Made invalid item effects recoverable instead of crash-prone.
- Added guaranteed boss defender reward drops and clearer loot/status output.
- Expanded tests for CLI parsing, combat item safety, storage versioning, enemy hydration, and progression persistence.

## 1.1.0

- Refactored to modular domain/service architecture.
- Added deterministic RNG with seed support.
- Added classes (Warrior, Rogue, Mage), XP/leveling, and class growth.
- Added richer combat model with dodge, crit, status effects, and enemy AI profiles.
- Added consumable inventory with typed item effects.
- Added encounter generation and progression with boss milestones.
- Added save/load/delete support with versioned schema and atomic write.
- Added quest progression skeleton (kill, boss, no-hit streak).
- Added release quality tooling (`npm run lint`, `npm run check`) and extended README.
