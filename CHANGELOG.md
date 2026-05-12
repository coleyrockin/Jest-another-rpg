# Changelog

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
