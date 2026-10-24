import type { FakeSteamCore } from "./core/fakeSteamCore.js";
import type {
  ConfirmOfferResult,
  FakeCard,
  FakeCardRef,
  FakeCardSpec,
  FakeErrorCode,
  FakeOffer,
  FakeOfferState,
  FakeRecordedEvent,
  FakeUser,
  FetchInventoryResult,
  SendOfferResult,
} from "./core/types.js";

/**
 * Live handle to a built fake-Steam scenario. Read verbs expose seeded
 * state for assertions; mutation verbs (queueing, driving offers) let tests
 * steer the scenario mid-test without rebuilding.
 */
export class FakeSteam {
  constructor(private readonly core: FakeSteamCore) {}

  getUser(id: string): FakeUser | undefined {
    return this.core.getUser(id);
  }

  getInventory(userId: string): FakeCard[] {
    return this.core.getInventory(userId);
  }

  getOffer(id: string): FakeOffer | undefined {
    return this.core.getOffer(id);
  }

  listOffers(): FakeOffer[] {
    return this.core.listOffers();
  }

  getEvents(): FakeRecordedEvent[] {
    return this.core.getEvents();
  }

  /** Send attempt outcomes in order; null entries are successes. */
  sendAttempts(): Array<FakeErrorCode | null> {
    return this.core
      .getEvents()
      .filter((event) => event.operation === "send")
      .map((event) => event.code);
  }

  sendOffer(
    partnerId: string,
    give: FakeCardRef[],
    receive: FakeCardRef[],
    options: { needsConfirmation?: boolean } = {},
  ): SendOfferResult {
    return this.core.sendOffer(partnerId, give, receive, options);
  }

  fetchInventory(userId: string, appId: string): FetchInventoryResult {
    return this.core.fetchInventory(userId, appId);
  }

  confirmOffer(id: string): ConfirmOfferResult {
    return this.core.confirmOffer(id);
  }

  acceptOffer(id: string): FakeOfferState {
    return this.core.acceptOffer(id);
  }

  declineOffer(id: string): FakeOfferState {
    return this.core.declineOffer(id);
  }

  cancelOffer(id: string): FakeOfferState {
    return this.core.cancelOffer(id);
  }

  expireOffer(id: string): FakeOfferState {
    return this.core.expireOffer(id);
  }

  /** Replaces a user inventory mid-test from card specs. */
  setUserCards(userId: string, specs: FakeCardSpec[]): void {
    this.core.setInventory(userId, []);
    this.core.addCards(userId, specs);
  }

  queueSendFailure(code: FakeErrorCode): void {
    this.core.queueSendFailure(code);
  }

  queueFetchFailure(code: FakeErrorCode): void {
    this.core.queueFetchFailure(code);
  }

  queueConfirmFailure(code: FakeErrorCode): void {
    this.core.queueConfirmFailure(code);
  }
}
