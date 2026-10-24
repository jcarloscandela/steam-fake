# Proposal

## Why

Integration tests for Steam trading bots need a fake Steam that is deterministic, fast, and scriptable for both happy paths and errors — without a real Steam account or network. `steam-cards-bot` explored this and converged on an external, neutral, in-memory TypeScript library (Option B) incubated as `src/fake-steam/`-shaped code but living in its own repo so it can be published to npm and reused. This change scaffolds that standalone library now, while the folder is still empty.

## What Changes

- Scaffold a standalone, publishable TypeScript library in this repo (`package.json`, `tsconfig`, build to ESM+CJS+`.d.ts`, `vitest`, lint/format, `README.md`, `LICENSE`, `.gitignore`/`.npmignore`).
- Introduce an in-memory neutral Steam core: users/identities, per-app inventories, trade-offer lifecycle (`Active` → `Accepted`/`Declined`/`InvalidItems`/`Cancelled`), confirmations, manual transitions — zero I/O, zero dependency on any bot app.
- Introduce an imperative builder API as the single public seeding surface: `withBotSets`/`withUserCards`/`withLevel`/`withPendingDonation`, failure queues (`failSendOnce`, `failFetch`), and mid-test runtime mutation (`setUserCards`, `confirm`, `expire`).
- Public surface limited to `src/index.ts`; no deep imports. Deterministic asset IDs by default.
- Non-goals (this change): adapters for `steam-cards-bot` ports (stay in the bot repo), real network/HTTP emulation, SQLite ownership, timers/clocks, CI publishing with provenance (follow-up).

## Capabilities

### New Capabilities

- `steam-core`: neutral in-memory Steam behavior model — identities, inventories, offer state machine, confirmations, deterministic IDs, manual transitions, error taxonomy. Owns all simulation behavior as the library evolves.
- `steam-builder`: imperative public builder and runtime-mutation API — seeding verbs, failure queues, mid-test mutation verbs, and read-back helpers for assertions.

### Modified Capabilities

(none — greenfield repo, no existing specs)

## Impact

- Affects only this repo (`steam-fake`): new `src/`, build/test/lint config, `README.md`, packaging metadata.
- No effect on `steam-cards-bot` in this change; the bot will consume the published package later via a thin adapter (out of scope here).
- Dependencies: TypeScript + vitest + a builder (`tsup` or `tsc`); no runtime dependency on `steam-user`/`steamcommunity`/`tradeoffer-manager` by design.
