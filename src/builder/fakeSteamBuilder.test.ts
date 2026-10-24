import { describe, expect, it } from "vitest";
import { FakeSteamBuilder } from "../index.js";

describe("FakeSteamBuilder seeding", () => {
  it("chains bot, sets, user, and level into a ready instance", () => {
    const steam = new FakeSteamBuilder()
      .withBot("bot-1")
      .withBotSets("730", 2)
      .withUser("buyer-1", { friend: true })
      .withLevel("buyer-1", 10, 150)
      .build();

    expect(steam.getInventory("bot-1")).toHaveLength(10);
    expect(steam.getUser("buyer-1")).toEqual({
      id: "buyer-1",
      admin: false,
      friend: true,
      level: 10,
      xp: 150,
      badges: [],
    });
    expect(steam.listOffers()).toHaveLength(0);
  });

  it("seeds badges onto a user", () => {
    const steam = new FakeSteamBuilder()
      .withBot()
      .withUser("buyer-1", { friend: true })
      .withBadges("buyer-1", [{ appId: "730", level: 2 }])
      .build();

    expect(steam.getUser("buyer-1")?.badges).toEqual([{ appId: "730", level: 2 }]);
  });

  it("expands shorthand sets into complete sets", () => {
    const steam = new FakeSteamBuilder().withBot().withBotSets("730", 2).build();
    const inventory = steam.getInventory("bot");
    expect(inventory).toHaveLength(10);
    expect(new Set(inventory.map((card) => card.classId)).size).toBe(5);
  });

  it("seeds a pending donation as an active incoming offer", () => {
    const steam = new FakeSteamBuilder()
      .withBot()
      .withPendingDonation("donor-1", [{ appId: "730", classId: "730-c1" }])
      .build();
    const offers = steam.listOffers();
    expect(offers).toHaveLength(1);
    expect(offers[0].state).toBe("Active");
    expect(offers[0].give).toHaveLength(0);
    expect(offers[0].receive).toHaveLength(1);
  });
});

describe("FakeSteamBuilder failure verbs", () => {
  it("queues two send failures, then succeeds", () => {
    const steam = new FakeSteamBuilder().withBot().failSendOnce("RATE_LIMITED").failSendOnce("NOT_LOGGED_IN").build();
    const first = steam.sendOffer("buyer-1", [], []);
    const second = steam.sendOffer("buyer-1", [], []);
    const third = steam.sendOffer("buyer-1", [], []);
    expect(first.ok).toBe(false);
    expect(second.ok).toBe(false);
    if (!first.ok) expect(first.error.code).toBe("RATE_LIMITED");
    if (!second.ok) expect(second.error.code).toBe("NOT_LOGGED_IN");
    expect(third.ok).toBe(true);
  });

  it("reports stale for the queued confirm, then resolves", () => {
    const steam = new FakeSteamBuilder().withBot().failConfirmOnce("STALE_CONFIRMATION").build();
    const sent = steam.sendOffer("buyer-1", [], [], { needsConfirmation: true });
    const offerId = sent.ok ? sent.offerId : "";
    expect(steam.confirmOffer(offerId)).toEqual({ status: "stale", latencyMs: 0 });
    expect(steam.confirmOffer(offerId)).toEqual({ status: "confirmed", latencyMs: 0 });
  });

  it("slows the next fetch once, then reports zero", () => {
    const steam = new FakeSteamBuilder().withBot().slowFetchOnce(1500).build();
    const first = steam.fetchInventory("bot", "730");
    expect(first.ok).toBe(true);
    if (first.ok) expect(first.latencyMs).toBe(1500);
    const second = steam.fetchInventory("bot", "730");
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.latencyMs).toBe(0);
  });
});

describe("FakeSteam runtime mutation", () => {
  it("replacing inventory mid-test yields missing items on accept", () => {
    const steam = new FakeSteamBuilder().withBot().withBotSets("730", 1).build();
    const cards = steam.getInventory("bot");
    const sent = steam.sendOffer(
      "buyer-1",
      cards.map((card) => ({ assetId: card.assetId, amount: 1 })),
      [],
    );
    const offerId = sent.ok ? sent.offerId : "";
    steam.setUserCards("bot", []);
    expect(steam.acceptOffer(offerId)).toBe("InvalidItems");
    expect(steam.getInventory("buyer-1")).toHaveLength(0);
  });

  it("expires an offer mid-test without moving items", () => {
    const steam = new FakeSteamBuilder().withBot().withBotSets("730", 1).build();
    const cards = steam.getInventory("bot");
    const sent = steam.sendOffer(
      "buyer-1",
      cards.map((card) => ({ assetId: card.assetId, amount: 1 })),
      [],
    );
    const offerId = sent.ok ? sent.offerId : "";
    expect(steam.expireOffer(offerId)).toBe("Expired");
    expect(steam.getInventory("bot")).toHaveLength(5);
    expect(steam.getInventory("buyer-1")).toHaveLength(0);
  });
});

describe("FakeSteam read-backs", () => {
  it("reports send attempts in order with the failure first", () => {
    const steam = new FakeSteamBuilder().withBot().failSendOnce("RATE_LIMITED").build();
    steam.sendOffer("buyer-1", [], []);
    steam.sendOffer("buyer-1", [], []);
    steam.sendOffer("buyer-1", [], []);
    expect(steam.sendAttempts()).toEqual(["RATE_LIMITED", null, null]);
  });

  it("reports final offer states after accept and expire", () => {
    const steam = new FakeSteamBuilder().withBot().withBotSets("730", 2).build();
    const cards = steam.getInventory("bot");
    const first = steam.sendOffer(
      "buyer-1",
      cards.slice(0, 5).map((card) => ({ assetId: card.assetId, amount: 1 })),
      [],
    );
    const second = steam.sendOffer(
      "buyer-1",
      cards.slice(5).map((card) => ({ assetId: card.assetId, amount: 1 })),
      [],
    );
    const firstId = first.ok ? first.offerId : "";
    const secondId = second.ok ? second.offerId : "";
    steam.acceptOffer(firstId);
    steam.expireOffer(secondId);
    const states = new Map(steam.listOffers().map((offer) => [offer.id, offer.state]));
    expect(states.get(firstId)).toBe("Accepted");
    expect(states.get(secondId)).toBe("Expired");
  });
});
