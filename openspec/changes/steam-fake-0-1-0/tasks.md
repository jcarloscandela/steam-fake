# Tasks

## 1. Escrow state and hold verb

- [x] 1.1 Add `InEscrow` to `FakeOfferState`, implement `holdOffer` on core and handle sharing the accept item-movement path with terminal state, and verify new core tests cover hold-moves-items and escrow-is-terminal scenarios
- [x] 1.2 Expose `holdOffer` on the `FakeSteam` handle and barrel if needed, and verify `pnpm typecheck` passes with no other source changes

## 2. User badges

- [x] 2.1 Add `badges: { appId, level }[]` to `FakeUser` with `[]` default, implement `withBadges` builder verb with defensive copies on register and read, and verify builder tests cover seeding plus retrieval
- [x] 2.2 Add a README snippet seeding badges and asserting via `getUser` to `src/readme.test.ts`, and verify `pnpm test src/readme.test.ts` passes

## 3. Scoped fetch failure queues

- [x] 3.1 Add optional `{ userId?, appId? }` scope to queued fetch failures in core, builder (`failFetchOnce`), and handle (`queueFetchFailure`), applying first-match-in-insertion-order with absent fields as wildcards, and verify core tests cover scoped-hit, scoped-miss-leaves-queue, and unscoped-backwards-compatibility
- [x] 3.2 Add a README snippet scripting a scoped fetch failure to `src/readme.test.ts`, and verify `pnpm test src/readme.test.ts` passes

## 4. Release to 0.1.0

- [x] 4.1 Bump `package.json` to `0.1.0`, add the `CHANGELOG.md` entry calling out the **BREAKING** union addition, update `README.md` status and `docs/bot-adapter.md` mapping rows for escrow/badges/scoped-fetch, and verify `openspec validate --all --strict` passes
- [x] 4.2 Run the full `pnpm check` plus `pnpm build` and verify ESM + CJS scratch imports of `holdOffer`, badges, and scoped failures behave as specified
- [ ] 4.3 Tag `v0.1.0`, publish via the staged flow, and verify registry install in a scratch directory

## Workflow follow-up

- Archive the change after review and confirm specs land under `openspec/specs/`.
- File the bot-side adapter update (exhaustive `FakeOfferState` handling) as a `steam-cards-bot` change.
