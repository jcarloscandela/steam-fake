# Design

## Context

See proposal.md (Why) for motivation. Current state: `steam-fake/` is an empty folder with a fresh OpenSpec root and no code. The consumer (`steam-cards-bot`) already converged on Option B — a neutral in-memory core plus an imperative builder — with its SQLite, `ChatRouter`, and port adapters staying in the bot repo. Constraints shaping this design: the library must have zero imports from any bot app, zero I/O, deterministic behavior by default, and a public surface that survives extraction (this repo IS the future package, so the boundary is drawn now, not later).

## Goals / Non-Goals

**Goals:**

- Standalone package scaffold that builds to ESM + CJS + `.d.ts` and runs its own test suite with no app present.
- Neutral core (`steam-core`) with zero bot imports and behavior covered by the spec scenarios.
- Single-entry imperative builder (`steam-builder`) as the only supported seeding/mutation surface.
- Deterministic-by-default IDs and FIFO failure queues.

**Non-Goals:**

- No bot-port adapters (`ISteamSessionService` etc.) — those live in the consumer repo forever.
- No network emulation, no SQLite ownership, no timers/clocks, no CI publish pipeline in this change.
- No domain presets (`botConStock`); consumers compose those from neutral verbs.

## Decisions

**Decision: Own neutral types, duplicated from bot models, mapped at the adapter.**
Why: bot models (`SteamInventoryItem`, `TradeOfferAsset`) live in the consumer and import nothing, but depending on them would couple every consumer to one repo's paths. Duplicating ~20 lines of shapes (`FakeCard`, `FakeOffer`, `FakeErrorCode`) keeps this package dependency-free; the thin consumer adapter maps both directions in one place.
Alternative considered: shared `@org/steam-models` package — rejected, extra package and versioning for a handful of interfaces.

**Decision: Single public entry (`src/index.ts`), no deep imports.**
Why: makes semver meaningful (everything exported is public API) and keeps a future `exports` map trivial. Internal modules (`core/`, `builder/`, `scenarios/`) are reachable only through the barrel.
Alternative considered: deep imports per module — rejected, doubles the supported surface and breaks extraction refactors.

**Decision: Imperative builder with FIFO failure queues + live runtime handle.**
Why: sequences ("fail twice, then succeed") and mid-test mutation ("partner loses cards after the offer is sent") are first-class in integration tests; queues consume in order and success is implicit when empty. Builder methods return the builder for chaining; `build()` returns a live handle exposing both mutation verbs and read-back verbs.
Alternative considered: declarative `givenSteam({...})` object — rejected per user decision; kept only as internal normalized scenario shape, not public API.

**Decision: Deterministic asset IDs derived from `(appId, class, sequence)`.**
Why: identical seeds reproduce identical inventories, so ledger/stock assertions never flake; chaos must be opt-in. No `Math.random`/`Date.now` in the core.
Alternative considered: UUIDs — rejected, unassertable.

**Decision: Error taxonomy aligned 1:1 with consumer classifier categories.**
Why: the consumer maps fake codes to `RateLimited`/`Auth`/`Transient`/`StaleConfirmation` mechanically in its adapter; new codes are additive (minor), never renames.
Alternative considered: free-form messages — rejected, unmappable.

**Decision: `tsup` for build (ESM + CJS + DTS), `vitest` for tests, `tsc --noEmit` + lint + format as the gate.**
Why: one dev dependency produces dual format plus declarations without maintaining two `tsconfig`s; vitest matches the consumer's suite so contributors context-switch less.
Alternative considered: `tsc`-only dual build — rejected, two-config maintenance for no benefit at this size.

## Risks / Trade-offs

- [Risk] Over-modeling Steam (escrow, trade holds, confirmations nuances) → Mitigation: model only what the specs require; every new behavior needs a spec scenario first.
- [Risk] Public API ossifies too early (builder verbs are semver surface) → Mitigation: additive-only rule in v0.x; renames require a major and a migration note.
- [Risk] Name/scope undecided for npm (`steam-fake` may collide) → Mitigation: package name stays a placeholder until publish; code never imports its own package name so renaming is one line.
- [Risk] Dual-package (ESM+CJS) hazards (`instanceof`, dual state) → Mitigation: core holds no singletons; all state lives in the built handle, `sideEffects: false`.

## Migration Plan

Greenfield repo: no migration, no rollback. Publish to npm is an explicit follow-up (name reservation, provenance, `files` allowlist verification via pack dry-run). Nothing in this change publishes anything.

## Open Questions

- Package scope/name for npm: `@<org>/steam-fake` vs unscoped `steam-fake` (check registry at publish time).
- Node engine baseline: mirror consumer (`>=22`/`>=20`?) or lower for reuse — deferrable, one line in `package.json`.
