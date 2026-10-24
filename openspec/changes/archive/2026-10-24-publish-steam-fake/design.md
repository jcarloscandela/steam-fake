# Design

## Context

See `proposal.md` for motivation. Current state (verified 2026-10-24): `package.json` is `private:true` at `version 0.1.0` with dual ESM/CJS `exports` via `tsup`; git has no commits and no remote; `README.md` still marks the package private; `steam-cards-bot` consumes Steam via async `ISteamSessionService`/`ITradeOfferManagerService` while `steam-fake` is sync and neutral. No code behaviour changes in this change.

## Goals / Non-Goals

**Goals:**
- Public 0.x release line starting at `0.0.1` with provenance-backed publish.
- Minimal `AGENTS.md` + `CHANGELOG.md` governance consumable by humans and AI contributors.
- Documented adapter boundary so `steam-cards-bot` can later depend on the fake without coupling the library to Steam types.

**Non-Goals:**
- No new fake behaviour (no login, badges service, pricing, polling).
- No implementation of the bot-side adapter (specified only).
- No npm scope rename unless availability check forces it.

## Decisions

- **Baseline `0.0.1`, not `0.1.0`.** Rationale: user intent is pre-stable iteration from `0.0.1`; current `0.1.0` in `package.json` is accidental drift. Alternative (keep `0.1.0`) rejected because it skips the agreed baseline and confuses the changelog.
- **Keep `tsup` dual build, add `prepublishOnly` gate.** Rationale: build already correct (esm+cjs+dts+sourcemap+clean); only missing enforcement. Alternative (switch to `tsc` publish) rejected: loses dual-format simplicity.
- **Whitelist `files`, drop most of `.npmignore`.** Rationale: with `files: [dist, README, LICENSE]` the ignore file is redundant and a second source of truth. Keep or trim to tooling files only.
- **`AGENTS.md` mirrors `steam-cards-bot` structure but smaller.** Rationale: contributors already know that format (layering, gates, OpenSpec workflow); reuse reduces learning curve. Alternative (copy verbatim) rejected: bot-specific layers do not apply to a dependency-free lib.
- **Adapter lives in consumer.** Rationale: keeps library dependency-free and sync; bot's async Steam shapes (`SteamInventoryItem`, `TradeOfferAsset`, `EResult`) stay out. Alternative (ship adapter in lib) rejected: would pull `steam-user` types into a test fake.
- **Provenance publish via GitHub Actions OIDC.** Rationale: verifiable supply chain with zero long-lived npm tokens.

## Risks / Trade-offs

- [Risk] `steam-fake` name taken on npm → Mitigation: check registry first; fallback to `@<scope>/steam-fake` with `publishConfig.access=public`.
- [Risk] `0.0.1` reset confuses anyone who saw `0.1.0` → Mitigation: single `CHANGELOG.md` entry explaining baseline reset; only one unpublished version existed.
- [Risk] Sync-vs-async mismatch tempts contributors to promisify the fake → Mitigation: `consumer-contract` spec + README non-goals section explicitly forbid it.
- [Risk] `paths` alias `steam-fake -> src/index.ts` leaks into published types → Mitigation: verify `dist/*.d.ts` contains no alias; alias is test-only via `vitest.config.ts`.

## Migration Plan

1. Land metadata + `AGENTS.md` + `CHANGELOG.md` + README updates on `main`.
2. `git init`-equivalent already done: create initial commit, `branch -M main`, `gh repo create`, push, tag `v0.0.1`.
3. Manual `pnpm publish --provenance --access public` once; subsequent releases via version-bump changes + tag + GitHub Release.
4. Rollback: `npm unpublish` only within 72h window; otherwise publish a patch. No runtime migration (no behaviour change).

## Open Questions

- None blocking. Registry name availability to confirm at apply time via `npm view`.
