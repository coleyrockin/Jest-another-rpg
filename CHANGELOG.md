# Changelog

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
