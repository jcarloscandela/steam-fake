# Changelog

All notable changes to `steam-fake` are documented here. Versioning follows 0.x semver (see `AGENTS.md`): minor `Y` covers features and breaking changes, patch `Z` covers compatible fixes, `1.0.0` is reserved for a stable API.

## [0.1.0] - 2026-10-24

### Added

- **BREAKING**: `FakeOfferState` gains `InEscrow` plus the `holdOffer(id)` verb, which moves items exactly like `acceptOffer` into the terminal escrow state so tests can assert the consumer's `in_escrow` completion path. Consumers with exhaustive matches must handle the new state.
- `FakeUser` gains neutral craft badges (`{ appId, level }[]`) with the `withBadges(userId, badges)` seeding verb, retrievable via `getUser`.
- `queueFetchFailure` / `failFetchOnce` accept an optional `{ userId?, appId? }` scope; the first queued failure in insertion order whose scope matches wins, absent fields are wildcards.

## [0.0.1] - 2026-10-24

Baseline pre-stable release line. Note: `package.json` briefly read `0.1.0` while private and unpublished; it was reset to `0.0.1` as the first public baseline — no published artifact ever carried `0.1.0`.

### Added

- Public npm distribution contract: license, repository links, keywords, dual ESM/CJS build with types, `prepublishOnly` gate.
- `AGENTS.md` contributor guidelines with 0.x versioning policy and quality gates.
- Documented consumer contract for `steam-cards-bot` integration (neutral sync API, adapter boundary, non-goals).
