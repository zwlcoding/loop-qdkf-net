import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadMetaProgress,
  saveMetaProgress,
  addShards,
  purchaseUpgrade,
  getAvailableUpgrades,
  type MetaProgressData,
} from "./MetaProgression";

describe("MetaProgression", () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
    });
  });

  describe("loadMetaProgress", () => {
    it("returns defaults when localStorage is empty", () => {
      const data = loadMetaProgress();
      expect(data.shards).toBe(0);
      expect(data.totalRuns).toBe(0);
      expect(data.bestLayer).toBe(0);
      expect(data.unlockedModules).toEqual([]);
      expect(data.unlockedChassis).toEqual([]);
      expect(data.upgrades).toHaveLength(6);
      expect(data.upgrades.every((u) => !u.purchased)).toBe(true);
    });

    it("returns parsed data when localStorage has valid data", () => {
      const saved: MetaProgressData = {
        shards: 100,
        totalRuns: 5,
        bestLayer: 3,
        unlockedModules: ["mod_a"],
        unlockedChassis: ["chassis_b"],
        upgrades: getAvailableUpgrades().map((u) => ({
          ...u,
          purchased: u.id === "extra_hp",
        })),
      };
      saveMetaProgress(saved);
      const data = loadMetaProgress();
      expect(data.shards).toBe(100);
      expect(data.totalRuns).toBe(5);
      expect(data.bestLayer).toBe(3);
      expect(data.unlockedModules).toEqual(["mod_a"]);
      expect(data.unlockedChassis).toEqual(["chassis_b"]);
      expect(data.upgrades.find((u) => u.id === "extra_hp")?.purchased).toBe(true);
      expect(data.upgrades.find((u) => u.id === "extra_gold")?.purchased).toBe(false);
    });

    it("returns defaults when localStorage has invalid JSON", () => {
      store["rift-meta-progress"] = "not-json";
      const data = loadMetaProgress();
      expect(data.shards).toBe(0);
      expect(data.upgrades).toHaveLength(6);
    });
  });

  describe("saveMetaProgress", () => {
    it("writes data to localStorage", () => {
      const data = loadMetaProgress();
      const next = addShards(data, 50);
      saveMetaProgress(next);
      expect(store["rift-meta-progress"]).toContain("50");
    });
  });

  describe("addShards", () => {
    it("increases shards by the given amount", () => {
      const data = loadMetaProgress();
      const next = addShards(data, 42);
      expect(next.shards).toBe(42);
      expect(next.totalRuns).toBe(data.totalRuns);
    });
  });

  describe("purchaseUpgrade", () => {
    it("deducts cost and marks upgrade purchased when sufficient shards", () => {
      let data = loadMetaProgress();
      data = addShards(data, 100);
      const next = purchaseUpgrade(data, "extra_hp");
      expect(next).not.toBeNull();
      expect(next!.shards).toBe(50);
      expect(next!.upgrades.find((u) => u.id === "extra_hp")?.purchased).toBe(true);
    });

    it("returns null when insufficient shards", () => {
      const data = loadMetaProgress();
      const next = purchaseUpgrade(data, "stat_boost");
      expect(next).toBeNull();
    });

    it("returns null when upgrade is already purchased", () => {
      let data = loadMetaProgress();
      data = addShards(data, 200);
      data = purchaseUpgrade(data, "extra_hp")!;
      const next = purchaseUpgrade(data, "extra_hp");
      expect(next).toBeNull();
    });

    it("returns null for unknown upgrade id", () => {
      const data = loadMetaProgress();
      const next = purchaseUpgrade(data, "unknown");
      expect(next).toBeNull();
    });
  });

  describe("getAvailableUpgrades", () => {
    it("returns all default upgrades without purchased field", () => {
      const ups = getAvailableUpgrades();
      expect(ups).toHaveLength(6);
      expect(ups.some((u) => "purchased" in u)).toBe(false);
      expect(ups.find((u) => u.id === "extra_hp")?.cost).toBe(50);
      expect(ups.find((u) => u.id === "stat_boost")?.cost).toBe(200);
    });
  });
});
