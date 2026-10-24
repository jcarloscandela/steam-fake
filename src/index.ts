// Public entry point. Everything importable lives behind this barrel;
// deep imports are not supported.
export { FakeSteamBuilder } from "./builder/fakeSteamBuilder.js";
export { FakeSteam } from "./fakeSteam.js";
export { FakeSteamCore } from "./core/fakeSteamCore.js";
export type {
  ConfirmOfferResult,
  FakeCard,
  FakeCardRef,
  FakeCardSpec,
  FakeErrorCode,
  FakeOffer,
  FakeOfferState,
  FakeOperation,
  FakeOperationError,
  FakeRecordedEvent,
  FakeUser,
  FetchInventoryResult,
  SendOfferResult,
} from "./core/types.js";
