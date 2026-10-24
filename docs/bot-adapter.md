# Bot Adapter Note (consumer-side, docs only)

This note specifies the adapter that `steam-cards-bot` SHOULD implement in its own `src/test-utils/` to consume `steam-fake`. It is not implemented here: the library stays neutral, synchronous, and dependency-free per the `consumer-contract` spec.

## Mapping table

| Fake (`steam-fake`, sync) | Bot (`steam-cards-bot`, async) | Adapter rule | Traces to |
|---|---|---|---|
| `fetchInventory(userId, appId: string): FetchInventoryResult` | `ISteamSessionService.fetchInventory(steamId64, appId: number, contextId: string): Promise<SteamInventoryItem[]>` | Parse `appId` to number, wrap result in `Promise`, map `FakeCard {appId, classId, assetId, amount}` to `SteamInventoryItem {appid, classid, assetid, contextid, amount}`; map queued `FakeErrorCode` to rejected promise | Neutral synchronous deterministic behaviour |
| `sendOffer(partnerId, give, receive): SendOfferResult` | `ITradeOfferManagerService.sendTradeOffer(partner, myAssets: TradeOfferAsset[], theirAssets: TradeOfferAsset[]): Promise<TradeOfferSendResult>` | Map `FakeCardRef {assetId, amount}` to `TradeOfferAsset {assetid, appid, contextid, amount}`; map `{ok:false, error.code}` to bot `EResult` categories | Neutral synchronous deterministic behaviour |
| `confirmOffer(id): {confirmed \| stale}` | `ISteamSessionService.confirmTradeOffer(id): Promise<void>` | `confirmed` resolves; `stale` resolves without effect (or rejects with stale marker per bot convention) | Barrel-only public surface (no new verb needed) |
| `acceptOffer / declineOffer / cancelOffer / expireOffer(id): FakeOfferState` | `acceptReceivedOffer / cancelSentOffer` | Translate terminal states (`Accepted`, `Declined`, `Cancelled`, `Expired`, `InvalidItems`) to `AcceptOfferOutcome` / `CancelOfferOutcome` | Neutral synchronous deterministic behaviour |
| `getUser(id): {admin, friend, level?, xp?}` | Friend/level services, `getSteamLevel`, `getBadges` | Stub at adapter level; library does not serve badges, market, or login | Non-goals are explicit |
| `sendAttempts() / getEvents()` | Trade-completed handlers, throttle recorder | Adapter forwards events to bot handlers in tests; no polling in the fake | Non-goals are explicit |
| Barrel `steam-fake` only | No deep imports in bot tests | Bot imports only from `"steam-fake"`; adapter hides core paths | Barrel-only public surface |

## Non-goals reminder

Login/cookies, badges service, market pricing, gems, polling/recovery, and async Steam types are never added to this library. Every row above keeps that boundary: the left side never grows Steam shapes, the right side never leaks into the fake.
