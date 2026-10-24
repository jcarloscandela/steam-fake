# Proposal

## Why

`steam-fake` is a working in-memory scaffold but cannot be consumed: `package.json` is `private`, git has zero commits and no remote, npm metadata is incomplete, and there is no contributor contract for versioning. The sibling consumer `steam-cards-bot` still hand-rolls Steam mocks because no integration contract exists.

## What Changes

- Make the package public and installable from npm under 0.x (`0.0.1` baseline, semver rules for 0.x documented).
- Complete npm distribution contract: license field, repository/homepage/bugs links, keywords, `publishConfig.access=public`, `prepublishOnly` gate, `files` whitelist review, dual ESM/CJS + dts build verification.
- Add `AGENTS.md` with 0.x versioning policy (minor = breaking-or-feat, patch = fix), per-change version bump rule, quality gates (`pnpm check`), and OpenSpec workflow.
- Define and document the bot-integration contract: library stays neutral/sync/dependency-free; async Steam-shaped adapter lives in `steam-cards-bot` (out of scope to implement here, in scope to specify).
- Initialise git (`main` branch, initial commit, GitHub remote, `v0.0.1` tag convention) and CI publish path with provenance.
- Update `README.md` status section (remove "private scaffold" note, document install + scope limits: trade/inventory only, no login/badges/pricing/polling).

## Capabilities

### New Capabilities

- `npm-distribution`: public installable package contract — metadata, build artefacts, entry points, and release mechanics that let any consumer `pnpm add steam-fake` and import from the barrel.
- `contributor-governance`: contributor rules for versioning in 0.x, per-change bumps, gates, and change workflow owned by `AGENTS.md`.
- `consumer-contract`: guarantees the library makes to integration-test consumers (neutral sync API, deterministic ids, no deep imports, explicit non-goals) so `steam-cards-bot` can build its async adapter against a stable surface.

### Modified Capabilities

- None. `steam-core` and `steam-builder` requirements are unchanged; this change only packages, governs, and documents them.

## Impact

- Affected: `package.json`, `README.md`, new `AGENTS.md`, new `CHANGELOG.md`, `.npmignore`/`files` review, `tsup` build outputs, git/GitHub setup, CI publish workflow, `openspec/specs/*` (new specs only).
- Out of scope: implementing the `steam-cards-bot` async adapter, adding login/badges/market/polling to the fake, renaming the npm package scope.
- Consumers: `steam-cards-bot` integration tests (future `devDependency` on published version).
