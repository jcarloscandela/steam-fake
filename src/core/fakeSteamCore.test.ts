import { describe, expect, it } from "vitest";
import { FakeSteamCore } from "../index.js";

describe("FakeSteamCore identities", () => {
  it("registers and retrieves a user with exact flags", () => {
    const core = new FakeSteamCore();
    core.registerUser({ id: "buyer-1", admin: false, friend: true });
    expect(core.getUser("buyer-1")).toEqual({ id: "buyer-1", admin: false, friend: true, badges: [] });
  });

  it("returns undefined for an unknown user without throwing", () => {
    const core = new FakeSteamCore();
    expect(() => core.getUser("ghost")).not.toThrow();
    expect(core.getUser("ghost")).toBeUndefined();
  });

  it("stores and retrieves seeded badges with defensive copies", () => {
    const core = new FakeSteamCore();
    core.registerUser({ id: "buyer-1", admin: false, friend: true });
    const seeded = [{ appId: "730", level: 3 }];
    core.setUserBadges("buyer-1", seeded);
    seeded.length = 0;
    expect(core.getUser("buyer-1")?.badges).toEqual([{ appId: "730", level: 3 }]);
    core.getUser("buyer-1")?.badges?.push({ appId: "440", level: 1 });
    expect(core.getUser("buyer-1")?.badges).toEqual([{ appId: "730", level: 3 }]);
  });
});

describe("FakeSteamCore inventories", () => {
  it("seeds two complete sets of one app", () => {
    const core = new FakeSteamCore();
    core.seedSets("bot", "730", 2);
    const inventory = core.getInventory("bot");
    expect(inventory).toHaveLength(10);
    const byClass = new Map<string, number>();
    for (const card of inventory) {
      byClass.set(card.classId, (byClass.get(card.classId) ?? 0) + card.amount);
    }
    expect(byClass.size).toBe(5);
    for (const count of byClass.values()) {
      expect(count).toBe(2);
    }
  });

  it("keeps per-app sets independent", () => {
    const core = new FakeSteamCore();
    core.seedSets("bot", "730", 1);
    core.seedSets("bot", "440", 1);
    const inventory = core.getInventory("bot");
    expect(inventory).toHaveLength(10);
    const perApp = new Map<string, Set<string>>();
    for (const card of inventory) {
      const classes = perApp.get(card.appId) ?? new Set<string>();
      classes.add(card.classId);
      perApp.set(card.appId, classes);
    }
    expect(perApp.get("730")?.size).toBe(5);
    expect(perApp.get("440")?.size).toBe(5);
  });
});

describe("FakeSteamCore offer lifecycle", () => {
  it("moves items on accept", () => {
    const core = new FakeSteamCore();
    const cards = core.seedSets("bot", "730", 1);
    const result = core.sendOffer(
      "buyer-1",
      cards.map((card) => ({ assetId: card.assetId, amount: 1 })),
      [],
    );
    expect(result.ok).toBe(true);
    const offerId = result.ok ? result.offerId : "";
    expect(core.acceptOffer(offerId)).toBe("Accepted");
    expect(core.getInventory("bot")).toHaveLength(0);
    expect(core.getInventory("buyer-1")).toHaveLength(5);
    expect(core.getOffer(offerId)?.state).toBe("Accepted");
  });

  it("leaves inventories unchanged on decline", () => {
    const core = new FakeSteamCore();
    const cards = core.seedSets("bot", "730", 1);
    const result = core.sendOffer(
      "buyer-1",
      cards.map((card) => ({ assetId: card.assetId, amount: 1 })),
      [],
    );
    const offerId = result.ok ? result.offerId : "";
    expect(core.declineOffer(offerId)).toBe("Declined");
    expect(core.getInventory("bot")).toHaveLength(5);
    expect(core.getInventory("buyer-1")).toHaveLength(0);
  });

  it("yields InvalidItems when items disappeared before accept", () => {
    const core = new FakeSteamCore();
    const cards = core.seedSets("bot", "730", 1);
    const result = core.sendOffer(
      "buyer-1",
      cards.map((card) => ({ assetId: card.assetId, amount: 1 })),
      [],
    );
    const offerId = result.ok ? result.offerId : "";
    core.setInventory("bot", []);
    expect(core.acceptOffer(offerId)).toBe("InvalidItems");
    expect(core.getInventory("buyer-1")).toHaveLength(0);
  });

  it("moves items on hold exactly like accept, into InEscrow", () => {
    const core = new FakeSteamCore();
    const cards = core.seedSets("bot", "730", 1);
    const result = core.sendOffer(
      "buyer-1",
      cards.map((card) => ({ assetId: card.assetId, amount: 1 })),
      [],
    );
    const offerId = result.ok ? result.offerId : "";
    expect(core.holdOffer(offerId)).toBe("InEscrow");
    expect(core.getInventory("bot")).toHaveLength(0);
    expect(core.getInventory("buyer-1")).toHaveLength(5);
    expect(core.getOffer(offerId)?.state).toBe("InEscrow");
  });

  it("rejects every transition out of InEscrow", () => {
    const core = new FakeSteamCore();
    const cards = core.seedSets("bot", "730", 1);
    const result = core.sendOffer(
      "buyer-1",
      cards.map((card) => ({ assetId: card.assetId, amount: 1 })),
      [],
    );
    const offerId = result.ok ? result.offerId : "";
    core.holdOffer(offerId);
    expect(() => core.acceptOffer(offerId)).toThrow();
    expect(() => core.holdOffer(offerId)).toThrow();
    expect(() => core.declineOffer(offerId)).toThrow();
    expect(() => core.cancelOffer(offerId)).toThrow();
    expect(() => core.expireOffer(offerId)).toThrow();
    expect(core.getOffer(offerId)?.state).toBe("InEscrow");
  });
});

describe("FakeSteamCore confirmations", () => {
  it("resolves a pending confirmation exactly once", () => {
    const core = new FakeSteamCore();
    core.seedSets("bot", "730", 1);
    const result = core.sendOffer("buyer-1", [], [], { needsConfirmation: true });
    const offerId = result.ok ? result.offerId : "";
    expect(core.isPendingConfirmation(offerId)).toBe(true);
    expect(core.confirmOffer(offerId)).toEqual({ status: "confirmed", latencyMs: 0 });
    expect(core.isPendingConfirmation(offerId)).toBe(false);
  });

  it("reports stale on double confirm without changing state", () => {
    const core = new FakeSteamCore();
    core.seedSets("bot", "730", 1);
    const result = core.sendOffer("buyer-1", [], [], { needsConfirmation: true });
    const offerId = result.ok ? result.offerId : "";
    core.confirmOffer(offerId);
    expect(core.confirmOffer(offerId)).toEqual({ status: "stale", latencyMs: 0 });
    expect(core.isPendingConfirmation(offerId)).toBe(false);
    expect(core.getOffer(offerId)?.state).toBe("Active");
  });
});

describe("FakeSteamCore failure queues", () => {
  it("consumes queued send failures in order, then succeeds", () => {
    const core = new FakeSteamCore();
    core.queueSendFailure("RATE_LIMITED");
    core.queueSendFailure("NOT_LOGGED_IN");
    const first = core.sendOffer("buyer-1", [], []);
    const second = core.sendOffer("buyer-1", [], []);
    const third = core.sendOffer("buyer-1", [], []);
    expect(first.ok).toBe(false);
    expect(second.ok).toBe(false);
    if (!first.ok) expect(first.error.code).toBe("RATE_LIMITED");
    if (!second.ok) expect(second.error.code).toBe("NOT_LOGGED_IN");
    expect(third.ok).toBe(true);
  });

  it("keeps failure queues isolated per operation", () => {
    const core = new FakeSteamCore();
    core.seedSets("bot", "730", 1);
    core.queueFetchFailure("RATE_LIMITED");
    const fetched = core.fetchInventory("bot", "730");
    expect(fetched.ok).toBe(false);
    expect(core.sendOffer("buyer-1", [], []).ok).toBe(true);
    const refetched = core.fetchInventory("bot", "730");
    expect(refetched.ok).toBe(true);
    if (refetched.ok) expect(refetched.cards).toHaveLength(5);
  });

  it("consumes a scoped fetch failure only on matching fetches", () => {
    const core = new FakeSteamCore();
    core.queueFetchFailure("RATE_LIMITED", { userId: "buyer-1", appId: "730" });
    const otherUser = core.fetchInventory("buyer-2", "730");
    expect(otherUser.ok).toBe(true);
    const otherApp = core.fetchInventory("buyer-1", "440");
    expect(otherApp.ok).toBe(true);
    const hit = core.fetchInventory("buyer-1", "730");
    expect(hit.ok).toBe(false);
    if (!hit.ok) expect(hit.error.code).toBe("RATE_LIMITED");
  });

  it("leaves a scoped fetch failure queued after misses", () => {
    const core = new FakeSteamCore();
    core.queueFetchFailure("TIMEOUT", { appId: "730" });
    expect(core.fetchInventory("bot", "440").ok).toBe(true);
    const hit = core.fetchInventory("bot", "730");
    expect(hit.ok).toBe(false);
    if (!hit.ok) expect(hit.error.code).toBe("TIMEOUT");
    expect(core.fetchInventory("bot", "730").ok).toBe(true);
  });

  it("matches unscoped fetch failures against every fetch in order", () => {
    const core = new FakeSteamCore();
    core.queueFetchFailure("RATE_LIMITED");
    core.queueFetchFailure("TIMEOUT", { userId: "buyer-1", appId: "730" });
    const first = core.fetchInventory("buyer-2", "440");
    expect(first.ok).toBe(false);
    if (!first.ok) expect(first.error.code).toBe("RATE_LIMITED");
    const second = core.fetchInventory("buyer-1", "730");
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error.code).toBe("TIMEOUT");
  });
});

describe("FakeSteamCore scripted latency", () => {
  it("reports a slow fetch without waiting", () => {
    const core = new FakeSteamCore();
    core.seedSets("bot", "730", 1);
    core.queueFetchLatency(1500);
    const fetched = core.fetchInventory("bot", "730");
    expect(fetched.ok).toBe(true);
    if (fetched.ok) {
      expect(fetched.latencyMs).toBe(1500);
      expect(fetched.cards).toHaveLength(5);
    }
    expect(core.getEvents()).toEqual([{ operation: "fetch", code: null, latencyMs: 1500 }]);
  });

  it("reports zero latency by default", () => {
    const core = new FakeSteamCore();
    const sent = core.sendOffer("buyer-1", [], []);
    expect(sent.ok).toBe(true);
    if (sent.ok) expect(sent.latencyMs).toBe(0);
  });

  it("consumes scoped fetch latency only on matching fetches", () => {
    const core = new FakeSteamCore();
    core.queueFetchLatency(500, { userId: "buyer-1", appId: "730" });
    const miss = core.fetchInventory("buyer-2", "730");
    expect(miss.ok).toBe(true);
    if (miss.ok) expect(miss.latencyMs).toBe(0);
    const hit = core.fetchInventory("buyer-1", "730");
    expect(hit.ok).toBe(true);
    if (hit.ok) expect(hit.latencyMs).toBe(500);
  });

  it("leaves latency queued when a failure fires", () => {
    const core = new FakeSteamCore();
    core.queueFetchFailure("RATE_LIMITED");
    core.queueFetchLatency(750);
    const failed = core.fetchInventory("bot", "730");
    expect(failed.ok).toBe(false);
    const slow = core.fetchInventory("bot", "730");
    expect(slow.ok).toBe(true);
    if (slow.ok) expect(slow.latencyMs).toBe(750);
  });
});

describe("FakeSteamCore determinism and expiry", () => {
  it("reproduces identical inventories from identical seeds", () => {
    const first = new FakeSteamCore();
    const second = new FakeSteamCore();
    first.seedSets("bot", "730", 2);
    second.seedSets("bot", "730", 2);
    expect(second.getInventory("bot")).toEqual(first.getInventory("bot"));
  });

  it("expires a pending offer without moving items", () => {
    const core = new FakeSteamCore();
    const cards = core.seedSets("bot", "730", 1);
    const result = core.sendOffer(
      "buyer-1",
      cards.map((card) => ({ assetId: card.assetId, amount: 1 })),
      [],
    );
    const offerId = result.ok ? result.offerId : "";
    expect(core.expireOffer(offerId)).toBe("Expired");
    expect(core.getOffer(offerId)?.state).toBe("Expired");
    expect(core.getInventory("bot")).toHaveLength(5);
    expect(core.getInventory("buyer-1")).toHaveLength(0);
  });
});
