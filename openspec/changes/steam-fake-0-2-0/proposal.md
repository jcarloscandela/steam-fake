# Proposal

## Why

Every `steam-fake` response resolves instantly, so consumer tests cannot exercise timeouts, retries, or concurrency orderings — the bot's 15s fetch timeout, `runExclusive` chaining, and recovery-poller overlap are untestable against the fake. Scripted latency closes that gap without giving the library a clock.

## What Changes

- Latency queues mirroring the failure queues: `queueSendLatency(ms)`, `queueFetchLatency(ms, scope?)`, `queueConfirmLatency(ms)` on core/handle, consumed FIFO per operation (fetch honors `{ userId?, appId? }` scope with wildcard-absent fields, first match in insertion order wins).
- Consumed latency is reported, never slept: `latencyMs` (default `0`) joins the `ok` variants of `SendOfferResult`/`FetchInventoryResult`/`ConfirmOfferResult` and `FakeRecordedEvent` as an optional field. The async wait lives in the consumer adapter.
- Builder verbs `slowSendOnce(ms)` / `slowFetchOnce(ms, scope?)` / `slowConfirmOnce(ms)`.
- Version bump `0.1.0` to `0.2.0` (minor: additive features), `CHANGELOG.md` entry, executable README snippet, new `docs/bot-adapter.md` row documenting the adapter-side `await sleep(latencyMs)` + fake-timers pattern.

## Capabilities

### New Capabilities

- None. All behavior extends existing capabilities.

### Modified Capabilities

- `steam-core`: operations gain scripted per-operation latency queues with implicit consumption; results and recorded events report the consumed `latencyMs`.
- `steam-builder`: scripting verbs gain one-shot latency counterparts mirroring the failure verbs.

## Impact

- Affected: `src/core/{types,fakeSteamCore}.ts`, `src/fakeSteam.ts`, `src/builder/fakeSteamBuilder.ts`, co-located tests, `src/readme.test.ts`, `README.md`, `docs/bot-adapter.md`, `CHANGELOG.md`, `package.json` version.
- Out of scope: real sleeping inside the library, the bot-side adapter wait, transition events, input validation, `clearQueues()`, `1.0.0`.
- Consumers: `steam-cards-bot` harness can script slow fetches/sends/confirms and test timeout, retry, and ordering paths with vitest fake timers.
