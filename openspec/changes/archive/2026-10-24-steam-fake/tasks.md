# Tasks

## 1. Package scaffold

- [x] 1.1 Create `package.json` (placeholder name, `type: module`, `sideEffects: false`, `files` allowlist, `engines`), `tsconfig` strict, `tsup` dual ESM+CJS+DTS config, `vitest` config, lint/format configs, `.gitignore`/`.npmignore`, `LICENSE`, and verify `pnpm install` plus an empty `vitest run` pass
- [x] 1.2 Add unified gate script (`typecheck` + `test` + `lint` + `format:check`) and verify it passes on the empty scaffold

## 2. Neutral core (`steam-core` spec)

- [x] 2.1 Implement seeded identities (register/retrieve/absent) with co-located tests verifying the register-retrieve and unknown-user scenarios
- [x] 2.2 Implement per-app inventories with set-shorthand expansion (N sets = 5N cards) with tests verifying the two-sets and per-app-independence scenarios
- [x] 2.3 Implement the sent-offer lifecycle (`Active` → `Accepted`/`Declined`/`InvalidItems`/`Cancelled`) with real item movement on accept, and verify the accept-moves, decline-unchanged, and missing-items scenarios pass
- [x] 2.4 Implement pending confirmations with stale-on-double-confirm, and verify the confirm-resolves and double-confirm-stale scenarios pass
- [x] 2.5 Implement FIFO failure queues per operation (send/fetch/confirm) with machine-readable codes, and verify the two-failures-then-success and per-operation-isolation scenarios pass
- [x] 2.6 Implement deterministic asset IDs from `(appId, class, sequence)` plus manual `expire`, and verify the same-seed-reproduces and expire-pending scenarios pass

## 3. Imperative builder (`steam-builder` spec)

- [x] 3.1 Implement chainable seeding verbs (bot/user identity, `withBotSets`, `withUserCards`, level, pending donation) returning a ready handle, and verify the chain-builds and shorthand-expands scenarios pass
- [x] 3.2 Implement failure-queue verbs (`failSendOnce`, `failFetch`, stale confirm) and verify the queued-order and scriptable-confirm scenarios pass
- [x] 3.3 Implement runtime mutation verbs (`setUserCards`, force `confirm`, `expire`) on the live handle and verify the replace-mid-test and expire-mid-test scenarios pass
- [x] 3.4 Implement read-back verbs (send attempts in order, offers with states, inventories per user, recorded events) and verify the attempts-order and final-states scenarios pass

## 4. Public surface and release readiness

- [x] 4.1 Restrict the public surface to `src/index.ts` (barrel only; add a test importing only the barrel) and verify no test or example imports a deep path
- [x] 4.2 Document the builder with runnable README examples (seed, failure queue, mid-test mutation) and verify every documented snippet runs as written
- [x] 4.3 Run the full gate plus a pack dry-run (`files` allowlist, ESM+CJS+DTS outputs present) and verify both pass without publishing
