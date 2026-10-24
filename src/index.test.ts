import { describe, expect, it } from "vitest";
import { FakeSteam, FakeSteamBuilder, FakeSteamCore } from "./index.js";

describe("public surface", () => {
  it("exposes the builder, handle, and core through the barrel only", () => {
    expect(typeof FakeSteamBuilder).toBe("function");
    expect(typeof FakeSteam).toBe("function");
    expect(typeof FakeSteamCore).toBe("function");
    const steam = new FakeSteamBuilder().withBot().withBotSets("730", 1).build();
    expect(steam).toBeInstanceOf(FakeSteam);
    expect(steam.getInventory("bot")).toHaveLength(5);
  });
});
