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

  it("holds an offer in escrow", () => {
    const escrowed = new FakeSteamBuilder().withBot().withBotSets("730", 1).build();

    const stock = escrowed.getInventory("bot");
    const offer = escrowed.sendOffer(
      "buyer-1",
      stock.map((card) => ({ assetId: card.assetId, amount: 1 })),
      [],
    );

    const offerId = offer.ok ? offer.offerId : "";
    expect(escrowed.holdOffer(offerId)).toBe("InEscrow");
  });

  it("seeds badges onto a user", () => {
    const badged = new FakeSteamBuilder()
      .withBot()
      .withUser("buyer-1", { friend: true })
      .withBadges("buyer-1", [{ appId: "730", level: 2 }])
      .build();

    expect(badged.getUser("buyer-1")?.badges).toEqual([{ appId: "730", level: 2 }]);
  });

  it("scripts a scoped fetch failure", () => {
    const scoped = new FakeSteamBuilder()
      .withBot()
      .failFetchOnce("RATE_LIMITED", { userId: "buyer-1", appId: "730" })
      .build();

    expect(scoped.fetchInventory("buyer-2", "730").ok).toBe(true);
    const hit = scoped.fetchInventory("buyer-1", "730");
    expect(hit.ok).toBe(false);
  });
});
