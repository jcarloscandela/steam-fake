# Design

## Context

See `proposal.md` for motivation. Current state: `FakeOfferState` has six states with `Accepted` as the only item-moving terminal state; `FakeUser` carries `level?`/`xp?` but no badges; `fetchFailures` is one global FIFO queue. The consumer fires its trade-completed path on both `Accepted` and `InEscrow`, so escrow must be observable as a distinct terminal state with identical inventory effects.

## Goals / Non-Goals

**Goals:**
- `holdOffer` reuses the `acceptOffer` item-movement path so escrow and accept can never diverge in inventory effects.
- Badges stay neutral (`{ appId, level }`), leaving Steam-shaped mapping to the consumer adapter.
- Scoped fetch failures keep deterministic FIFO semantics with a documented match rule.

**Non-Goals:**
- No escrow release/expiry transitions; `InEscrow` is terminal.
- No badge levels beyond seeded data (no crafting simulation).
- No priority or expiry on queued failures.

## Decisions

- **`holdOffer` shares `moveAll` with `acceptOffer`, then sets `InEscrow`.** Rationale: one code path for item movement; the states differ only in the recorded outcome. Alternative (separate movement logic) rejected: duplication risk.
- **`InEscrow` is terminal; `requireActiveOffer` rejects it.** Rationale: mirrors `Accepted`; the bot never transitions out of a completed trade. Alternative (allow expire after hold) rejected: no consumer need proven.
- **Badges as `FakeBadge { appId: string; level: number }[]` on `FakeUser`, defaulting to `[]`.** Rationale: minimal neutral shape covering `!missing`/`!check`; `getUser` copies them like other fields. Alternative (full SteamBadge mirror) rejected: couples the lib to consumer types.
- **Scope match: first queued failure in insertion order whose scope matches wins; absent scope fields are wildcards.** Rationale: preserves existing FIFO behavior exactly when no scopes are used (unscoped entries match everything, as today). Alternative (separate queue per scope key) rejected: complicates ordering guarantees.
- **Version `0.1.0`, not `0.0.2`.** Rationale: `contributor-governance` requires minor for features; the new union member is additionally breaking for exhaustive consumers.

## Risks / Trade-offs

- [Risk] Exhaustive `switch` on `FakeOfferState` in consumers fails to compile → Mitigation: call it out as **BREAKING** in proposal and CHANGELOG; the bot adapter is updated in its own change.
- [Risk] Scoped + unscoped failures interleaved confusingly → Mitigation: single documented rule (first match in insertion order) plus a dedicated test matrix.
- [Risk] README snippets drift → Mitigation: every new snippet runs verbatim in `readme.test.ts` per `consumer-contract`.
