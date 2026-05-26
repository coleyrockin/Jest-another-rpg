# ROADMAP: CLI RPG MVP to Portfolio-Ready Milestones

**Status:** 1.3.0 is functional and test-covered. This roadmap defines the next quality and growth phases for a future agent.
**Last updated:** 2026-05-26

## 1. Project summary

- `Jest-Another-RPG` is a deterministic, CLI-only RPG with seeded runs, class progression, combat, inventories, quests, Adventure Mode, gold/equipment/shop systems, and schema versioned saves.
- Primary stack is plain Node.js with CommonJS modules and Jest + ESLint for validation.
- The game is local-only with no backend service dependency.

## 2. Current product vision

- Build a portfolio-grade terminal RPG core that is deterministic, readable, and easy to extend.
- Preserve the command-driven experience while improving reliability, flow clarity, and maintainer confidence.
- Keep gameplay scope controlled; prioritize depth in product quality over broad feature breadth.

## 3. Target users

- Recruiters evaluating engineering quality and project ownership.
- Developers using this repo as a small but real Node/Jest sample.
- RPG tinkerers expecting reproducible console gameplay.

## 4. What appears finished

- Core systems are modularized:
  - `lib/core`, `lib/domain`, `lib/services`, `lib/ui`.
- Deterministic randomness via seed and snapshot restore.
- Save/load with schema versioning and migration logic.
- Campaign loop, encounter service, combat service, progression service, storage, shop.
- Terminal polish utilities with status cards and quest summaries.
- CI, tests, smoke checks, and transcript script.

## 5. What appears unfinished

- No API docs or auto-generated contributor onboarding guides.
- No explicit deployment/packaging artifact strategy beyond local CLI use.
- Some UX details are CLI-strong but could be more discoverable for first-time players.
- No production monitoring or changelog automation.
- Roadmap is currently in-progress and not yet the operating plan.

## 6. What appears broken or risky

- `CHANGELOG` and README are reasonably current, but they must stay aligned with every release.
- `node_modules` and `coverage` output are present in the repo root during local runs and must remain ignored consistently.
- The code has compatibility shim files (`lib/Character.js`, `lib/Enemy.js`, `lib/Player.js`, `lib/Potion.js`) that may confuse first-time readers if not documented clearly.
- Several user-facing behaviors remain implicit in tests and comments, which increases onboarding cost.
- No explicit dependency risk review workflow is documented in the operating docs.

## 7. Duplicated/Outdated or maintainability blockers

- Legacy adapter files are intentional for compatibility, but they should be documented as such in docs.
- UI and architecture docs are incomplete; there is no single canonical map of files and flow boundaries.
- Roadmap section in README currently lists a short, mixed list of ideas instead of directing to a structured plan.

## 8. UX issues that impact polish

- Command output is strong for terminal style but can benefit from clearer mode distinctions and first-run onboarding text.
- Some status/action naming still requires source reading (for example `--help` plus menu wording).
- No dedicated "what changed in this run" summary after major actions in docs.

## 9. Recruiter/GitHub presentation issues

- The project is strong visually for terminal output but needs a cleaner narrative in docs to signal maturity.
- Missing explicit roadmap and contribution map lowers confidence in handoff quality.
- No public demo screenshot policy/versioned transcript section policy beyond a static sample in README.

## 10. What should be protected

- Save schema `v2` behavior and migration compatibility.
- Deterministic combat and RNG continuity.
- Existing test gate setup (`npm run ci`).
- CLI entrypoint and argument parsing.
- Inventory/equipment/shop/quest flow expected by current tests.

## 11. Highest-priority fixes

1. Add explicit architecture + handoff docs for all major modules.
2. Add a canonical roadmap file and align README references.
3. Add lightweight dependency health checks to the operating guide.
4. Clarify current game flow in one-page docs for first-time users and maintainers.
5. Document all non-code assumptions and boundaries for future content additions.

## 12. Architecture recommendations

- Keep `lib/domain` pure and state-oriented; keep `lib/services` deterministic and side-effect isolated where possible.
- Keep `lib/ui` as output-only utilities and prompt assembly (no gameplay state mutation).
- Keep `app.js` and `lib/Game.js` as orchestration only; prevent feature logic leaking into prompt definitions.

## 13. Refactor recommendations

- Do not refactor behavior yet. Add comments and docs around compatibility layers to make migration intent explicit.
- Add architecture diagram (ASCII or Mermaid in roadmap) showing request flow:
  - `app -> Game -> services -> domain + storage`.
- Normalize naming in docs to match code (encounter/service/shop/progression terms).

## 14. UI and UX recommendations

- Keep terminal-only design but define clear beginner play loop:
  - Start → battle → win/lose → hub → continue/quit.
- Add docs for `quick` vs `detailed` output differences.
- Add transcript examples for one complete seeded run: battle start, hub travel, shop, campaign clear.

## 15. Performance recommendations

- There are no heavy runtime bottlenecks in current CLI scope.
- Add a short perf note: deterministic sessions must remain snappy and single-file test runs should stay fast.
- Keep seed-driven scripts deterministic and avoid stateful randomness outside `Rng`.

## 16. Security recommendations

- Keep save integrity checks visible in docs.
- Document trusted/local file trust boundaries:
  - `savegame.json` is local only.
  - `.env` files are ignored.
- Add periodic dependency review command in roadmap tasks (`npm audit --omit=dev`).
- Add explicit warning that save files are overwritten by command flow.

## 17. Accessibility recommendations

- Clarify menu structure and action consequences for screen reader and keyboard-only terminal users.
- Ensure prompts use clear verbs and avoid abbreviations in user-facing text.
- Keep text output deterministic and no hidden state.

## 18. SEO recommendations

- Not directly web-facing.
- Improve discoverability by:
  - descriptive README sections,
  - explicit feature summary,
  - release badges and version visibility,
  - clean project metadata in `package.json`.

## 19. Testing strategy

- Keep `npm run lint`, `npm test`, and `npm run ci` as required gates.
- Add a short docs regression check (existing one already validates transcript mention and stale suite-count drift).
- Track edge-case scenarios in issue list (recoverable save corruption, empty inventory, travel flow).
- Before every release:
  - run full tests and smoke flow.
  - run transcript generation to verify deterministic showcase output.

## 20. CI/CD and deployment recommendations

- CI is clean and should remain minimal:
  - Node matrix 18 and 20.
  - install + `npm run ci`.
- Optional next step:
  - attach `npm audit --omit=dev` either in CI or release checklist only.
- Keep deploy story explicit: this is CLI-only and no hosting dependency is required.

## 21. Documentation improvements

1. Add dedicated `ROADMAP.md` as the canonical execution source.
2. Add explicit links from `README`:
   - roadmap,
   - scripts,
   - release checklist,
   - transcript command.
3. Add a "Project status" section that separates shipped vs planned.
4. Update `CHANGELOG` only for release-worthy changes, and avoid feature-only planning details there.

## 22. GitHub presentation improvements

- Add concise project summary lines at top of README for recruiter scan.
- Keep badge row small and accurate.
- Show terminal transcript output with clear context.
- Keep Roadmap section short and point to `ROADMAP.md`.
- Add explicit section for limitations and known work-in-progress.

## 23. Recruiter and portfolio polish

- Explain the engineering choices, not only game features.
- Keep architecture boundaries and test evidence prominent.
- Include a one-paragraph "What I built here" and "What would be next" section so hiring reviewers know intent.

## 24. Future feature ideas

- Quest chain expansion, regional event tables, and save-compatible content growth.
- Seed replay capture improvements and command line snapshot import.
- Optional combat log exporter for transcript artifacts.
- Better shop metadata (dynamic stock/rarity) without changing schema yet.

## 25. Production readiness checklist

- [ ] No app logic changes in roadmap-only tasks.
- [ ] README includes links to roadmap, scripts, and testing commands.
- [ ] `ROADMAP.md` exists and is the single source for future planning.
- [ ] `npm run lint` passes.
- [ ] `npm run test` passes.
- [ ] `npm run ci` passes.
- [ ] `npm run transcript` runs without prompts.
- [ ] `savegame.json` remains in `.gitignore`.
- [ ] Any new feature plan includes migration notes and acceptance criteria.

## 26. Suggested milestone order

### Milestone 1 - Documentation and handoff hardening

- Finalize this `ROADMAP.md`.
- Link roadmap from README.
- Add "current status / next work" section.
- Add small risk notes for save/version compatibility.

### Milestone 2 - Quality posture

- Add dependency review cadence.
- Add release checklist entry for audit pass.
- Add contributor-first architecture walk-through in docs.

### Milestone 3 - UX clarity

- Improve onboarding flow docs for first-time players.
- Add deterministic transcript use case notes and examples.

## 27. Roadmap item playbook

Each item below is executable by a single agent without heavy code churn.

### 1) Publish and stabilize project architecture map
- What needs to be done: Create a one-page module map in docs that links each major file group and runtime path.
- Why it matters: Future contributors can onboard without guessing state ownership.
- Expected impact: faster handoffs and fewer logic regressions.
- Difficulty level: Medium.
- Risk level: Low.
- Dependencies: `README.md`, `ROADMAP.md`, `lib` layout.
- Files/folders: `ROADMAP.md`, `README.md`.
- Suggested order: 1.
- Acceptance criteria:
  - Clear ownership map for CLI entry, game orchestration, combat, storage, shop, and UI output.
- Tests/checks:
  - Visual docs review.
  - `npm test` and `npm run ci` unchanged.

### 2) Preserve compatibility shim intent in contributor docs
- What needs to be done: Document why `lib/Character.js`, `lib/Enemy.js`, `lib/Player.js`, and `lib/Potion.js` exist.
- Why it matters: Avoid accidental removals that break external imports.
- Expected impact: safer refactors and clearer API boundaries.
- Difficulty level: Low.
- Risk level: Low.
- Dependencies: Existing compatibility shims.
- Files/folders: `README.md`, `ROADMAP.md`.
- Suggested order: 1.
- Acceptance criteria:
  - A maintainer can restore context of old imports from docs alone.
- Tests/checks:
  - `npm test`.

### 3) Align roadmap and release documentation
- What needs to be done: Replace mixed, short roadmap bullets in README with a structured link to this file and keep planned vs shipped separated.
- Why it matters: Makes future work explicit and reviewable.
- Expected impact: reduced ambiguity and stronger repo narrative.
- Difficulty level: Low.
- Risk level: Low.
- Dependencies: `README.md`.
- Files/folders: `README.md`.
- Suggested order: 1.
- Acceptance criteria:
  - README links directly to this roadmap.
  - Planned ideas are marked as planned, shipped features marked as shipped.
- Tests/checks:
  - `npm run docs` equivalent check (`__tests__/Docs.test.js`).

### 4) Add a reproducible documentation verification note
- What needs to be done: Keep docs tests for required proof points:
  - transcript command present in README,
  - no stale hard-coded suite count,
  - roadmap link exists.
- Why it matters: avoids doc drift without manual review each push.
- Expected impact: more stable maintenance.
- Difficulty level: Low.
- Risk level: Low.
- Dependencies: `__tests__/Docs.test.js`, `README.md`.
- Files/folders: `__tests__/Docs.test.js`, `README.md`.
- Suggested order: 2.
- Acceptance criteria:
  - Docs assertions pass with minimal maintenance cost.
- Tests/checks:
  - `npm test`.

### 5) Add release-time security hygiene tasking
- What needs to be done: Add explicit command order for `npm audit --omit=dev` in README release checklist.
- Why it matters: dependency risk visibility is part of production readiness.
- Expected impact: clearer release confidence.
- Difficulty level: Low.
- Risk level: Low.
- Dependencies: none.
- Files/folders: `README.md`.
- Suggested order: 2.
- Acceptance criteria:
  - Checklist includes one security pass command with expected output interpretation.
- Tests/checks:
  - `npm run ci`.
  - `npm audit --omit=dev`.

### 6) Define first-time player and reviewer UX entry paths
- What needs to be done: Add a short "Game loop walkthrough" section with exact input order for a seeded mini run.
- Why it matters: faster onboarding and clearer expected behavior.
- Expected impact: stronger demo comprehension.
- Difficulty level: Medium.
- Risk level: Low.
- Dependencies: `scripts/transcript.js`.
- Files/folders: `README.md`.
- Suggested order: 3.
- Acceptance criteria:
  - A reader can start and understand campaign flow from docs alone.
- Tests/checks:
  - `npm run transcript` for narrative sample.

### 7) Add dependency governance notes without new logic changes
- What needs to be done: Document version support and upgrade policy for Node and packages.
- Why it matters: avoids accidental runtime mismatch and environment drift.
- Expected impact: smoother contributor onboarding.
- Difficulty level: Low.
- Risk level: Low.
- Dependencies: `package.json`, `README.md`.
- Files/folders: `README.md`.
- Suggested order: 3.
- Acceptance criteria:
  - Node and package baseline clearly stated.
- Tests/checks:
  - `npm run lint`.

## Current Verification Status

All verification commands are expected to pass after docs-only changes.

| Command | Result | Notes |
| --- | --- | --- |
| `npm run lint` | pass | clean run, zero warnings |
| `npm test` | pass | 19 suites, 77 tests |
| `npm run ci` | pass | lint, tests, coverage, and smoke passed |
| `npm run transcript` | pass | script executed successfully with deterministic showcase output |

## 28. Next Agent Instructions

### First 5 tasks

1. Run the pre-change checks listed above in `Current Verification Status`.
2. Read `ROADMAP.md`, then open `README.md`.
3. Confirm `package.json` scripts and Node support are still aligned.
4. Verify `app.js`, `lib/Game.js`, and `lib/services` flow references in one pass.
5. Execute one complete smoke path with a seeded flow and a fresh transcript run.

### Files likely involved

- `ROADMAP.md`
- `README.md`
- `CHANGELOG.md` (if the next release milestone requires)

### Commands before making logic changes

- `npm run lint`
- `npm test`
- `npm run ci`
- `npm run transcript`

### Commands after changes

- `npm run lint`
- `npm test`
- `npm run ci`
- `git status`

### Tests to verify

- `npm run ci`
- `npm run transcript`
- Relevant scenario scripts in `scripts/smoke.js` if game-flow behavior is touched.

### What not to break

- Do not change save schema semantics without a migration plan.
- Do not remove compatibility shims.
- Do not alter deterministic seed behavior.
- Do not modify battle math or encounter probabilities without explicit acceptance gates.

### When to stop and ask human review

- If a planned documentation or quality task reveals evidence of runtime behavior mismatch.
- If save migration behavior becomes inconsistent with versioned payload expectations.
- If commands that were green before now fail due to non-documentation reasons.

### Recommended first commit message

`docs: add roadmap for next agent`
