# Design

## Context

See `proposal.md` for motivation. Current state: three failure queues (send global FIFO, fetch scoped first-match, confirm global FIFO) consumed implicitly by their operations; all results resolve synchronously with no timing data. The consumer adapters are async and can `await` whatever the fake reports.

## Goals / Non-Goals

**Goals:**
- Latency queues shaped exactly like failure queues, so contributors learn one pattern.
- The library never sleeps, never spawns timers, keeps deterministic same-tick behavior.
- The consumer can implement real waits plus vitest fake timers from the reported `latencyMs`.

**Non-Goals:**
- No virtual clock, no auto-expiry, no latency on reads (`getInventory`, `getOffer`) — only on send/fetch/confirm operations.
- No priority between queued latencies; strict FIFO (first match wins for scoped fetch).

## Decisions

- **Three queues (`sendLatencies`, `fetchLatencies` with scope, `confirmLatencies`), consumed implicitly at operation start.** Rationale: mirrors `sendFailures`/`fetchFailures`/`confirmFailures` one-to-one. Alternative (single generic queue keyed by operation) rejected: diverges from the established shape.
- **Failures short-circuit latency.** Rationale: a fired failure returns immediately (fast 429) while latency models slow success; deterministic and independently testable. Alternative (consume both) rejected: couples two independent scripts.
- **`latencyMs: number` (default `0`) on `ok` result variants and optional on `FakeRecordedEvent`.** Rationale: additive fields only, no signature changes; adapters read one number. Alternative (separate `drainLatency` read-back) rejected: splits one observation across two calls and invites ordering bugs.
- **Builder verbs `slowSendOnce` / `slowFetchOnce` / `slowConfirmOnce`.** Rationale: reads as intent ("slow the next X once"), distinct from `fail*Once`/`queue*` families. Alternative (`latencySendOnce`) rejected as noisier.
- **Version `0.2.0`.** Rationale: additive features → minor per `contributor-governance`; no breaking member added.

## Risks / Trade-offs

- [Risk] Tests using latency with real timers get slow/flaky → Mitigation: README + adapter note document the vitest fake-timers pattern (`advanceTimersByTimeAsync`); default latency stays `0`.
- [Risk] Adapter forgets to await reported latency → Mitigation: adapter-side follow-up change; the lib cannot enforce consumer waits.
- [Risk] `latencyMs` on error variants omitted → Mitigation: failures short-circuit latency by design, so error results never carry consumed latency; spec states this explicitly.
