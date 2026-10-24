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

## Hold an offer in escrow

Holding moves items exactly like accepting, but lands in the distinct terminal state `InEscrow` for escrow-completion assertions.

```ts
const escrowed = new FakeSteamBuilder().withBot().withBotSets("730", 1).build();

const stock = escrowed.getInventory("bot");
const offer = escrowed.sendOffer(
  "buyer-1",
  stock.map((card) => ({ assetId: card.assetId, amount: 1 })),
  [],
);

const offerId = offer.ok ? offer.offerId : "";
```

Holding `offerId` now yields `InEscrow` — and no further transition out of it is accepted.

## Seed badges onto a user

```ts
const badged = new FakeSteamBuilder()
  .withBot()
  .withUser("buyer-1", { friend: true })
  .withBadges("buyer-1", [{ appId: "730", level: 2 }])
  .build();
```

`badged.getUser("buyer-1")?.badges` now reports `[{ appId: "730", level: 2 }]`.

## Scope a fetch failure

Fetch failures accept an optional `{ userId?, appId? }` scope — absent fields are wildcards, and the first queued failure in insertion order whose scope matches wins.

```ts
const scoped = new FakeSteamBuilder()
  .withBot()
  .failFetchOnce("RATE_LIMITED", { userId: "buyer-1", appId: "730" })
  .build();
```

Fetching another user or app succeeds and leaves the failure queued; fetching `buyer-1` / `730` reports it.

## Script a slow response

Latency is data, not waiting: queue milliseconds per operation and the result reports them synchronously in `latencyMs` (plus the recorded event). The library never sleeps — the consumer adapter awaits the reported value.

```ts
const slow = new FakeSteamBuilder().withBot().slowFetchOnce(1500).build();
```

The next fetch reports `latencyMs: 1500` and returns immediately; unscripted operations report `0`. Fetch latencies accept the same optional scope as fetch failures.

## API surface

Everything is imported from `"steam-fake"` — deep imports are not supported.

| Area     | Verbs                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------- |
| Seeding  | `withBot`, `withBotSets`, `withUser`, `withUserCards`, `withLevel`, `withBadges`, `withPendingDonation` |
| Failures | `failSendOnce`, `failFetchOnce` (optional scope), `failConfirmOnce` (builder) and `queue*Failure` (live handle) |
| Latency  | `slowSendOnce`, `slowFetchOnce` (optional scope), `slowConfirmOnce` (builder) and `queue*Latency` (live handle); reported as `latencyMs` |
| Runtime  | `sendOffer`, `acceptOffer`, `holdOffer`, `declineOffer`, `cancelOffer`, `confirmOffer`, `expireOffer`, `setUserCards` |
| Reads    | `getUser`, `getInventory`, `getOffer`, `listOffers`, `sendAttempts`, `getEvents`                |

Determinism: asset IDs derive from `(appId, class, sequence)`, so identical seeding order always yields identical inventories. There is no clock — expiry is always manual.

## Status

Public pre-stable line (`v0.2.0`). Install with `pnpm add -D steam-fake@0.2.0`. `1.0.0` is reserved for a stable, bot-integrated API.

## Scope and non-goals

Covers trade offers and inventories only: seeding, offer lifecycle, confirmations, queued failures, deterministic asset IDs.

Explicitly out of scope: login and cookies, badges service, market pricing, gems, polling and recovery, async Steam-shaped types. Consumers such as `steam-cards-bot` implement those in their own async adapter that wraps this sync fake (see `AGENTS.md`).
