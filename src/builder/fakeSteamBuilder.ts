import { FakeSteamCore } from "../core/fakeSteamCore.js";
import type { FakeCardSpec, FakeErrorCode } from "../core/types.js";
import { FakeSteam } from "../fakeSteam.js";

/**
 * Imperative scenario builder. Chain seeding verbs, then `build()` a live
 * `FakeSteam` handle. Verbs that send offers (pending donations) consume
 * queued failures in chain order, exactly as runtime calls would.
 */
export class FakeSteamBuilder {
  private readonly core = new FakeSteamCore();

  withBot(id = "bot"): this {
    this.core.setBotId(id);
    this.core.registerUser({ id, admin: false, friend: false });
    return this;
  }

  withBotSets(appId: string, sets: number): this {
    this.core.seedSets(this.core.getBotId(), appId, sets);
    return this;
  }

  withUser(id: string, flags: { admin?: boolean; friend?: boolean } = {}): this {
    this.core.registerUser({ id, admin: flags.admin ?? false, friend: flags.friend ?? false });
    return this;
  }

  withUserCards(userId: string, specs: FakeCardSpec[]): this {
    this.core.addCards(userId, specs);
    return this;
  }

  withLevel(userId: string, level: number, xp = 0): this {
    this.core.setUserLevel(userId, level, xp);
    return this;
  }

  /** Seeds a pre-existing incoming donation: donor gives, bot gives nothing. */
  withPendingDonation(donorId: string, specs: FakeCardSpec[]): this {
    if (this.core.getUser(donorId) === undefined) {
      this.core.registerUser({ id: donorId, admin: false, friend: true });
    }
    const cards = this.core.addCards(donorId, specs);
    const sent = this.core.sendOffer(
      donorId,
      [],
      cards.map((card) => ({ assetId: card.assetId, amount: card.amount })),
    );
    if (!sent.ok) {
      throw new Error(`Failed to seed pending donation: ${sent.error.code}`);
    }
    return this;
  }

  failSendOnce(code: FakeErrorCode): this {
    this.core.queueSendFailure(code);
    return this;
  }

  failFetchOnce(code: FakeErrorCode): this {
    this.core.queueFetchFailure(code);
    return this;
  }

  failConfirmOnce(code: FakeErrorCode): this {
    this.core.queueConfirmFailure(code);
    return this;
  }

  build(): FakeSteam {
    return new FakeSteam(this.core);
  }
}
