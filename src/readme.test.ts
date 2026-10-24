import { describe, expect, it } from "vitest";
import { FakeSteamBuilder } from "steam-fake";

/**
 * Mirrors every ```ts snippet in README.md statement-for-statement, so the
 * documented examples cannot drift from the library.
 */
describe("README snippets", () => {
  it("seeds a scenario and trades", () => {
    const steam = new FakeSteamBuilder().withBot().withBotSets("730", 2).withUser("buyer-1", { friend: true }).build();

    const cards = steam.getInventory("bot").slice(0, 5);
    const sent = steam.sendOffer(
      "buyer-1",
      cards.map((card) => ({ assetId: card.assetId, amount: 1 })),
      [],
    );

    expect(sent.ok).toBe(true);
  });

  it("scripts failures with a queue", () => {
    const flaky = new FakeSteamBuilder().withBot().failSendOnce("RATE_LIMITED").build();

    flaky.sendOffer("buyer-1", [], []);
    flaky.sendOffer("buyer-1", [], []);
    flaky.sendOffer("buyer-1", [], []);

    expect(flaky.sendAttempts()).toEqual(["RATE_LIMITED", null, null]);
  });

  it("mutates mid-test", () => {
    const mid = new FakeSteamBuilder().withBot().withBotSets("730", 1).build();

    const listed = mid.getInventory("bot");
    const outgoing = mid.sendOffer(
      "buyer-1",
      listed.map((card) => ({ assetId: card.assetId, amount: 1 })),
      [],
    );

    mid.setUserCards("bot", []);

    const offerId = outgoing.ok ? outgoing.offerId : "";
    expect(mid.acceptOffer(offerId)).toBe("InvalidItems");
  });
});
