# steam-fake

Neutral in-memory fake of Steam trading behavior for integration tests. No network, no accounts, deterministic by default.

```sh
pnpm add -D steam-fake
```

All snippets below are runnable test code — every block is executed verbatim by `src/readme.test.ts`, so the docs cannot drift from the library.

## Seed a scenario and trade

```ts
import { FakeSteamBuilder } from "steam-fake";

const steam = new FakeSteamBuilder()
  .withBot()
  .withBotSets("730", 2)
  .withUser("buyer-1", { friend: true })
  .build();

const cards = steam.getInventory("bot").slice(0, 5);
const sent = steam.sendOffer(
  "buyer-1",
  cards.map((card) => ({ assetId: card.assetId, amount: 1 })),
  [],
);
```

## Script failures with a queue

Failures are first-in-first-out per operation. When the queue is empty, the operation succeeds.

```ts
const flaky = new FakeSteamBuilder().withBot().failSendOnce("RATE_LIMITED").build();

flaky.sendOffer("buyer-1", [], []);
flaky.sendOffer("buyer-1", [], []);
flaky.sendOffer("buyer-1", [], []);
```

The read-back reports `["RATE_LIMITED", null, null]` — the failure first, then successes (`null`).

## Mutate mid-test

Steer the scenario after it is built: replace inventories, force confirmations, expire offers.

```ts
const mid = new FakeSteamBuilder().withBot().withBotSets("730", 1).build();

const listed = mid.getInventory("bot");
const outgoing = mid.sendOffer(
  "buyer-1",
  listed.map((card) => ({ assetId: card.assetId, amount: 1 })),
  [],
);

mid.setUserCards("bot", []);
```

Accepting `outgoing` now yields `InvalidItems` — the cards disappeared before acceptance.

## API surface

Everything is imported from `"steam-fake"` — deep imports are not supported.

| Area     | Verbs                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------- |
| Seeding  | `withBot`, `withBotSets`, `withUser`, `withUserCards`, `withLevel`, `withPendingDonation`       |
| Failures | `failSendOnce`, `failFetchOnce`, `failConfirmOnce` (builder) and `queue*Failure` (live handle)  |
| Runtime  | `sendOffer`, `acceptOffer`, `declineOffer`, `cancelOffer`, `confirmOffer`, `expireOffer`, `setUserCards` |
| Reads    | `getUser`, `getInventory`, `getOffer`, `listOffers`, `sendAttempts`, `getEvents`                |

Determinism: asset IDs derive from `(appId, class, sequence)`, so identical seeding order always yields identical inventories. There is no clock — expiry is always manual.

## Status

Public pre-stable line (`v0.0.1`). Install with `pnpm add -D steam-fake@0.0.1`. `1.0.0` is reserved for a stable, bot-integrated API.

## Scope and non-goals

Covers trade offers and inventories only: seeding, offer lifecycle, confirmations, queued failures, deterministic asset IDs.

Explicitly out of scope: login and cookies, badges service, market pricing, gems, polling and recovery, async Steam-shaped types. Consumers such as `steam-cards-bot` implement those in their own async adapter that wraps this sync fake (see `AGENTS.md`).
