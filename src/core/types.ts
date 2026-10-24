/** Neutral identity of a fake Steam user. No dependency on any bot app. */
export interface FakeUser {
  id: string;
  admin: boolean;
  friend: boolean;
  level?: number;
  xp?: number;
}

/** A single fake inventory card. Asset IDs are derived deterministically. */
export interface FakeCard {
  appId: string;
  classId: string;
  assetId: string;
  amount: number;
}

export type FakeOfferState = "Active" | "Accepted" | "Declined" | "InvalidItems" | "Cancelled" | "Expired";

/** A fake trade offer between the bot inventory and a partner inventory. */
export interface FakeOffer {
  id: string;
  partnerId: string;
  /** Refs to items the bot gives away (resolved against live inventories). */
  give: FakeCardRef[];
  /** Refs to items the bot receives (resolved against live inventories). */
  receive: FakeCardRef[];
  state: FakeOfferState;
  needsConfirmation: boolean;
  confirmed: boolean;
}

/** Reference to a card by identity; resolved against live inventories. */
export interface FakeCardRef {
  assetId: string;
  amount: number;
}

/** Input for creating individual cards; asset IDs are derived by the core. */
export interface FakeCardSpec {
  appId: string;
  classId: string;
  amount?: number;
}

/** Machine-readable failure codes, aligned with consumer error categories. */
export type FakeErrorCode =
  | "NOT_LOGGED_IN"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "STALE_CONFIRMATION"
  | "TRADE_BANNED"
  | "INVALID_ITEMS"
  | "OFFER_NOT_ACTIVE"
  | "TRANSIENT";

export interface FakeOperationError {
  code: FakeErrorCode;
  message: string;
}

export type SendOfferResult = { ok: true; offerId: string } | { ok: false; error: FakeOperationError };

export type ConfirmOfferResult = { status: "confirmed" } | { status: "stale" };

export type FetchInventoryResult = { ok: true; cards: FakeCard[] } | { ok: false; error: FakeOperationError };

export type FakeOperation = "send" | "fetch" | "confirm";

export interface FakeRecordedEvent {
  operation: FakeOperation;
  /** Machine-readable outcome; null means the operation succeeded. */
  code: FakeErrorCode | null;
}
