# Proposal

## Why

`steam-fake@0.0.1` unblocks happy-path integration tests, but the consumer (`steam-cards-bot`) treats escrowed trades as completed, seeds per-user badges, and throttles inventory reads per (user, app) — none of which the fake can emulate today. This change closes those three proven gaps.

## What Changes

- **BREAKING**: `FakeOfferState` gains `InEscrow`; consumers with exhaustive matches must handle it. New `holdOffer(id)` verb moves an `Active` offer to terminal `InEscrow`, moving items exactly like `acceptOffer`.
- `FakeUser` gains `badges: { appId, level }[]`; new `withBadges(userId, badges)` builder verb and level-style retrieval via `getUser`.
- `queueFetchFailure` / `failFetchOnce` accept an optional `{ userId?, appId? }` scope; on `fetchInventory`, the first queued failure in insertion order whose scope matches wins, unscoped entries match everything.
- Version bump `0.0.1` to `0.1.0` (minor: features, per `contributor-governance`), `CHANGELOG.md` entry, README executable snippets for each feature, new rows in `docs/bot-adapter.md`.

## Capabilities

### New Capabilities

- None. All behavior extends existing capabilities.

### Modified Capabilities

- `steam-core`: offer lifecycle gains `InEscrow` + `holdOffer` item movement; identities gain badges; fetch failure queues gain optional scope matching.
- `steam-builder`: seeding verbs gain `withBadges`; failure verbs gain optional fetch scope.

## Impact

- Affected: `src/core/{types,fakeSteamCore}.ts`, `src/fakeSteam.ts`, `src/builder/fakeSteamBuilder.ts`, co-located tests, `src/readme.test.ts`, `README.md`, `docs/bot-adapter.md`, `CHANGELOG.md`, `package.json` version.
- Out of scope: bot-side adapter, login/badges service, pricing, polling, `1.0.0`.
- Consumers: `steam-cards-bot` harness can emulate `in_escrow` completions, badge-dependent commands, and per-scope throttled reads.
