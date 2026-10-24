# AGENTS.md — steam-fake Contributor Guidelines

This is the AI-contributor entry point. Follow these rules when implementing changes.

## Project Shape

Dependency-free, neutral, synchronous in-memory fake of Steam trading behavior for integration tests. No network, no clock, no accounts.

- `src/core/` — state model (`FakeSteamCore`, types). No I/O, no singletons; per-instance state only.
- `src/builder/` — fluent seeding API (`FakeSteamBuilder`). Chain verbs, then `build()`.
- `src/fakeSteam.ts` — live handle. Read verbs for assertions, mutation verbs to steer mid-test.
- `src/index.ts` — barrel. Everything public is exported here; deep imports are unsupported.
- `src/*.test.ts` — co-located tests; `src/readme.test.ts` executes every README snippet verbatim.

## Versioning (0.x semver)

We are pre-`1.0.0`. Current line is `0.Y.Z`:

- Minor `Y` = feature OR breaking change (for example `0.1.0` to `0.2.0`). In `0.x` the minor carries the major's role.
- Patch `Z` = compatible fix only (for example `0.2.0` to `0.2.1`).
- `1.0.0` is reserved for a stable, bot-integrated API. Do not jump to `1.0.0` for a pre-stable breaking change.
- Every change that alters runtime behavior or the public surface MUST bump `package.json` version and add a `CHANGELOG.md` entry in the same change. A change touching `src/` without a version + changelog entry is incomplete.
- Pure tooling/docs changes (no `src/` behavior change) do not bump the version.

## Quality Gates

- Unified gate: `pnpm check` (runs `typecheck` + `format:check` + `lint` + `test`). All must pass before commit and before publish.
- During work run targeted suites (`pnpm test <file>`); run full `pnpm check` at the end.
- Formatting via oxfmt (`pnpm format` to fix; `pnpm format:check` fails the gate).
- `prepublishOnly` runs `pnpm check && pnpm build`. Never publish with `--no-verify` equivalent bypasses.
- README snippets are tests: every ```ts block must run verbatim in `src/readme.test.ts`. If docs and code diverge, fix both in the same change.

## Public Surface Rules

- Export new API only through `src/index.ts`. Never require consumers to deep-import.
- Keep the fake synchronous and dependency-free. Async Steam-shaped adapters (`ISteamSessionService`, `ITradeOfferManagerService`, `SteamInventoryItem`, `EResult`) live in the consumer (`steam-cards-bot`), never here.
- Asset IDs stay deterministic (`asset-<appId>-<classId>-<sequence>`). Do not introduce randomness or wall-clock expiry; expiry is always manual via `expireOffer`.
- Non-goals (do not add): login/cookies, badges service, market pricing, gems, polling/recovery.

## OpenSpec Workflow

1. **Propose** (`/opsx-propose <name>`) — proposal, specs, design, tasks.
2. **Implement** (`/opsx-apply`) — work through tasks, marking each complete.
3. **Archive** (`/opsx-archive`) — finalize and sync specs.

Significant changes go through this cycle. Typos and config tweaks may bypass it.

## Maintenance

- Update `README.md` when the public API, seeding verbs, or non-goals change.
- Update this `AGENTS.md` when versioning, gates, or workflow conventions change, in the same change.
- Keep both files concise; remove stale guidance when behavior changes.
