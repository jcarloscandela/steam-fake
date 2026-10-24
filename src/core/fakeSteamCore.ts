import type {
  ConfirmOfferResult,
  FakeCard,
  FakeCardRef,
  FakeCardSpec,
  FakeErrorCode,
  FakeOffer,
  FakeOfferState,
  FakeOperation,
  FakeRecordedEvent,
  FakeUser,
  FetchInventoryResult,
  SendOfferResult,
} from "./types.js";

export const BOT_USER_ID = "bot";

const CARDS_PER_SET = 5;

/**
 * In-memory neutral model of Steam trading behavior. Zero I/O, zero
 * dependencies on any bot app. All state lives in the instance; there are
 * no singletons, so parallel tests never share state.
 *
 * Asset IDs are deterministic: derived from (appId, class, sequence) with
 * per-instance counters, so identical seeding order always yields identical
 * inventories.
 */
export class FakeSteamCore {
  private readonly users = new Map<string, FakeUser>();
  private readonly inventories = new Map<string, FakeCard[]>();
  private readonly assetSequences = new Map<string, number>();
  private readonly offers = new Map<string, FakeOffer>();
  private offerSequence = 0;
  private botUserId = BOT_USER_ID;
  private readonly sendFailures: FakeErrorCode[] = [];
  private readonly fetchFailures: FakeErrorCode[] = [];
  private readonly confirmFailures: FakeErrorCode[] = [];
  private readonly events: FakeRecordedEvent[] = [];

  /** Designates which user id owns the bot side of sent offers. */
  setBotId(id: string): void {
    this.botUserId = id;
  }

  getBotId(): string {
    return this.botUserId;
  }

  setUserLevel(id: string, level: number, xp = 0): void {
    const user = this.users.get(id);
    if (user === undefined) {
      throw new Error(`User ${id} is not registered`);
    }
    user.level = level;
    user.xp = xp;
  }

  registerUser(user: FakeUser): void {
    this.users.set(user.id, { ...user });
  }

  getUser(id: string): FakeUser | undefined {
    const found = this.users.get(id);
    return found === undefined ? undefined : { ...found };
  }

  /**
   * Appends N complete 5-card sets of one app to a user's inventory and
   * returns the created cards.
   */
  seedSets(userId: string, appId: string, sets: number): FakeCard[] {
    const created: FakeCard[] = [];
    for (let set = 0; set < sets; set++) {
      for (let card = 1; card <= CARDS_PER_SET; card++) {
        created.push(this.makeCard(appId, `${appId}-c${card}`));
      }
    }
    this.inventories.set(userId, [...this.getInventory(userId), ...created]);
    return created.map((card) => ({ ...card }));
  }

  setInventory(userId: string, cards: FakeCard[]): void {
    this.inventories.set(
      userId,
      cards.map((card) => ({ ...card })),
    );
  }

  /**
   * Creates individual cards from specs (asset IDs derived deterministically)
   * and appends them to a user's inventory.
   */
  addCards(userId: string, specs: FakeCardSpec[]): FakeCard[] {
    const created = specs.map((spec) => ({ ...this.makeCard(spec.appId, spec.classId), amount: spec.amount ?? 1 }));
    this.inventories.set(userId, [...this.getInventory(userId), ...created]);
    return created.map((card) => ({ ...card }));
  }

  getInventory(userId: string): FakeCard[] {
    return (this.inventories.get(userId) ?? []).map((card) => ({ ...card }));
  }

  /**
   * Reads one app slice of a user's inventory. Consumes one queued fetch
   * failure (first-in-first-out) before succeeding.
   */
  fetchInventory(userId: string, appId: string): FetchInventoryResult {
    const queued = this.fetchFailures.shift();
    if (queued !== undefined) {
      return { ok: false, error: this.recordFailure("fetch", queued) };
    }
    this.events.push({ operation: "fetch", code: null });
    return { ok: true, cards: this.getInventory(userId).filter((card) => card.appId === appId) };
  }

  queueSendFailure(code: FakeErrorCode): void {
    this.sendFailures.push(code);
  }

  queueFetchFailure(code: FakeErrorCode): void {
    this.fetchFailures.push(code);
  }

  queueConfirmFailure(code: FakeErrorCode): void {
    this.confirmFailures.push(code);
  }

  /** Consumed failures and confirm outcomes, in order, for assertions. */
  getEvents(): FakeRecordedEvent[] {
    return this.events.map((event) => ({ ...event }));
  }

  /**
   * Creates a sent offer in `Active` state. Availability is intentionally
   * NOT checked here: items may disappear before acceptance, which is
   * exactly what the `InvalidItems` path exercises.
   */
  sendOffer(
    partnerId: string,
    give: FakeCardRef[],
    receive: FakeCardRef[],
    options: { needsConfirmation?: boolean } = {},
  ): SendOfferResult {
    const queued = this.sendFailures.shift();
    if (queued !== undefined) {
      return { ok: false, error: this.recordFailure("send", queued) };
    }
    this.events.push({ operation: "send", code: null });
    this.offerSequence += 1;
    const id = `offer-${this.offerSequence}`;
    this.offers.set(id, {
      id,
      partnerId,
      give: give.map((ref) => ({ ...ref })),
      receive: receive.map((ref) => ({ ...ref })),
      state: "Active",
      needsConfirmation: options.needsConfirmation ?? false,
      confirmed: false,
    });
    return { ok: true, offerId: id };
  }

  getOffer(id: string): FakeOffer | undefined {
    const found = this.offers.get(id);
    if (found === undefined) return undefined;
    return { ...found, give: found.give.map((ref) => ({ ...ref })), receive: found.receive.map((ref) => ({ ...ref })) };
  }

  /** All sent offers in creation order. */
  listOffers(): FakeOffer[] {
    return [...this.offers.values()].map((offer) => ({
      ...offer,
      give: offer.give.map((ref) => ({ ...ref })),
      receive: offer.receive.map((ref) => ({ ...ref })),
    }));
  }

  /**
   * Accepts an `Active` offer, moving items between bot and partner.
   * Returns the resulting state. When either side no longer holds the
   * referenced items, no inventory moves and the state becomes
   * `InvalidItems`.
   */
  acceptOffer(id: string): FakeOfferState {
    const offer = this.requireActiveOffer(id);
    if (!this.holdsAll(this.botUserId, offer.give) || !this.holdsAll(offer.partnerId, offer.receive)) {
      offer.state = "InvalidItems";
      return offer.state;
    }
    this.moveAll(this.botUserId, offer.partnerId, offer.give);
    this.moveAll(offer.partnerId, this.botUserId, offer.receive);
    offer.state = "Accepted";
    return offer.state;
  }

  declineOffer(id: string): FakeOfferState {
    const offer = this.requireActiveOffer(id);
    offer.state = "Declined";
    return offer.state;
  }

  cancelOffer(id: string): FakeOfferState {
    const offer = this.requireActiveOffer(id);
    offer.state = "Cancelled";
    return offer.state;
  }

  /**
   * Manually expires a pending `Active` offer. Terminal, moves no items.
   * There is no automatic clock: tests drive expiry explicitly.
   */
  expireOffer(id: string): FakeOfferState {
    const offer = this.requireActiveOffer(id);
    offer.state = "Expired";
    return offer.state;
  }

  /**
   * Resolves a pending confirmation. The first confirm of an offer that
   * needs it reports `confirmed`; any further confirm — or a confirm of
   * an offer that never needed one — reports `stale` and changes nothing.
   */
  confirmOffer(id: string): ConfirmOfferResult {
    const offer = this.offers.get(id);
    if (offer === undefined) {
      throw new Error(`Offer ${id} does not exist`);
    }
    const queued = this.confirmFailures.shift();
    if (queued !== undefined) {
      this.recordFailure("confirm", queued);
      return { status: "stale" };
    }
    if (!offer.needsConfirmation || offer.confirmed) {
      this.events.push({ operation: "confirm", code: "STALE_CONFIRMATION" });
      return { status: "stale" };
    }
    offer.confirmed = true;
    this.events.push({ operation: "confirm", code: null });
    return { status: "confirmed" };
  }

  isPendingConfirmation(id: string): boolean {
    const offer = this.offers.get(id);
    return offer !== undefined && offer.needsConfirmation && !offer.confirmed;
  }

  private recordFailure(operation: FakeOperation, code: FakeErrorCode) {
    this.events.push({ operation, code });
    return { code, message: `Fake ${operation} failure: ${code}` };
  }

  private requireActiveOffer(id: string): FakeOffer {
    const offer = this.offers.get(id);
    if (offer === undefined || offer.state !== "Active") {
      throw new Error(`Offer ${id} is not active`);
    }
    return offer;
  }

  private holdsAll(userId: string, refs: FakeCardRef[]): boolean {
    const inventory = this.inventories.get(userId) ?? [];
    return refs.every((ref) => {
      const entry = inventory.find((card) => card.assetId === ref.assetId);
      return entry !== undefined && entry.amount >= ref.amount;
    });
  }

  private moveAll(fromUserId: string, toUserId: string, refs: FakeCardRef[]): void {
    const from = this.inventories.get(fromUserId) ?? [];
    const moved: FakeCard[] = [];
    for (const ref of refs) {
      const index = from.findIndex((card) => card.assetId === ref.assetId);
      const entry = from[index];
      entry.amount -= ref.amount;
      if (entry.amount <= 0) {
        from.splice(index, 1);
      }
      moved.push({ ...entry, amount: ref.amount });
    }
    this.inventories.set(fromUserId, from);
    this.inventories.set(toUserId, [...(this.inventories.get(toUserId) ?? []), ...moved]);
  }

  private makeCard(appId: string, classId: string): FakeCard {
    const key = `${appId}:${classId}`;
    const sequence = (this.assetSequences.get(key) ?? 0) + 1;
    this.assetSequences.set(key, sequence);
    return { appId, classId, assetId: `asset-${appId}-${classId}-${sequence}`, amount: 1 };
  }
}
