# Tasks

## 1. Latency queues in core

- [x] 1.1 Add `sendLatencies`, scoped `fetchLatencies`, and `confirmLatencies` queues with implicit FIFO consumption (fetch honors scope, first match wins), failures short-circuiting latency, and verify core tests cover slow-fetch reporting, default zero, scoped matching, and failure-leaves-latency
- [x] 1.2 Report consumed `latencyMs` on the `ok` variants of send/fetch/confirm results and on recorded events, and verify `pnpm typecheck` passes with no signature changes

## 2. Public verbs and docs

- [x] 2.1 Expose `queueSendLatency` / `queueFetchLatency` / `queueConfirmLatency` on the handle and `slowSendOnce` / `slowFetchOnce` / `slowConfirmOnce` on the builder plus barrel type exports, and verify builder tests cover one-shot scripting
- [x] 2.2 Add an executable README snippet scripting a slow fetch to `src/readme.test.ts`, document the adapter-side `await sleep(latencyMs)` + vitest fake-timers pattern in `docs/bot-adapter.md`, and verify `pnpm test src/readme.test.ts` passes

## 3. Release to 0.2.0

- [x] 3.1 Bump `package.json` to `0.2.0`, add the `CHANGELOG.md` entry, update `README.md` status, and verify `openspec validate --all --strict` passes
- [x] 3.2 Run the full `pnpm check` plus `pnpm build` and verify ESM + CJS scratch imports report scripted latency without waiting
- [ ] 3.3 Tag `v0.2.0`, publish via the staged flow, and verify registry install in a scratch directory

## Workflow follow-up

- Archive the change after review and confirm specs land under `openspec/specs/`.
- File the bot-side adapter wait (`await sleep(latencyMs)` in `FakeSession`/`FakeTradeManager` plus fake-timer tests) as a `steam-cards-bot` change.
