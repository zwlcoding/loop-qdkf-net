import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ProgressManager } from "./ProgressManager";
import type { RunProgress } from "../data/MissionTypes";

function makeProgress(overrides: Partial<RunProgress> = {}): RunProgress {
  return {
    missionId: "mission-1",
    currentTurn: 3,
    extractionAvailable: true,
    squadStates: [
      {
        unitId: "unit-a",
        chassisId: "chassis-1",
        currentHp: 80,
        maxHp: 100,
        modules: ["mod-1"],
      },
    ],
    collectedRewards: [
      { type: "resource", itemId: "gold", amount: 100 },
    ],
    chassisUnlocked: ["chassis-1"],
    modulesUnlocked: ["mod-1"],
    version: 1,
    ...overrides,
  };
}

describe("ProgressManager", () => {
  let manager: ProgressManager;
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    globalThis.localStorage = {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
    } as unknown as Storage;
    manager = new ProgressManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("saves progress to localStorage", () => {
    const progress = makeProgress();
    manager.save(progress);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "loop-qdkf-run-progress",
      JSON.stringify(progress)
    );
    expect(storage["loop-qdkf-run-progress"]).toBe(JSON.stringify(progress));
  });

  it("loads progress from localStorage", () => {
    const progress = makeProgress();
    manager.save(progress);
    const loaded = manager.load();
    expect(loaded).toEqual(progress);
  });

  it("returns null when no progress is saved", () => {
    expect(manager.load()).toBeNull();
  });

  it("returns null when saved data is invalid JSON", () => {
    storage["loop-qdkf-run-progress"] = "not-json";
    expect(manager.load()).toBeNull();
  });

  it("returns null when saved data is missing required fields", () => {
    storage["loop-qdkf-run-progress"] = JSON.stringify({ missionId: "x" });
    expect(manager.load()).toBeNull();
  });

  it("clears progress from localStorage", () => {
    manager.save(makeProgress());
    manager.clear();
    expect(localStorage.removeItem).toHaveBeenCalledWith("loop-qdkf-run-progress");
    expect(manager.load()).toBeNull();
  });

  it("hasUnfinishedRun returns true when progress exists", () => {
    manager.save(makeProgress());
    expect(manager.hasUnfinishedRun()).toBe(true);
  });

  it("hasUnfinishedRun returns false when no progress exists", () => {
    expect(manager.hasUnfinishedRun()).toBe(false);
  });

  it("getVersion returns saved version", () => {
    manager.save(makeProgress({ version: 2 }));
    expect(manager.getVersion()).toBe(2);
  });

  it("getVersion returns 0 when no progress exists", () => {
    expect(manager.getVersion()).toBe(0);
  });

  it("setVersion updates version in saved progress", () => {
    manager.save(makeProgress({ version: 1 }));
    manager.setVersion(3);
    expect(manager.getVersion()).toBe(3);
    const loaded = manager.load();
    expect(loaded?.version).toBe(3);
  });

  it("setVersion does nothing when no progress exists", () => {
    manager.setVersion(5);
    expect(manager.load()).toBeNull();
  });

  it("handles localStorage serialization errors gracefully", () => {
    vi.spyOn(JSON, "stringify").mockImplementation(() => {
      throw new Error("Serialization error");
    });
    expect(() => manager.save(makeProgress())).not.toThrow();
  });

  describe("unlock tracking", () => {
    it("returns empty unlock lists by default", () => {
      expect(manager.getUnlockedChassis()).toEqual([]);
      expect(manager.getUnlockedModules()).toEqual([]);
    });

    it("tracks unlocked chassis", () => {
      manager.unlockChassis("heavy");
      expect(manager.getUnlockedChassis()).toContain("heavy");
      expect(manager.isChassisUnlocked("heavy")).toBe(true);
      expect(manager.isChassisUnlocked("light")).toBe(false);
    });

    it("tracks unlocked modules", () => {
      manager.unlockModule("mod_laser_rifle");
      expect(manager.getUnlockedModules()).toContain("mod_laser_rifle");
      expect(manager.isModuleUnlocked("mod_laser_rifle")).toBe(true);
      expect(manager.isModuleUnlocked("mod_shield")).toBe(false);
    });

    it("does not duplicate unlocks", () => {
      manager.unlockChassis("heavy");
      manager.unlockChassis("heavy");
      expect(manager.getUnlockedChassis()).toEqual(["heavy"]);
    });

    it("applies unlock rewards from extraction", () => {
      const rewards = [
        { type: "unlock" as const, itemId: "chassis_heavy", amount: 1 },
        { type: "unlock" as const, itemId: "mod_shield", amount: 1 },
        { type: "resource" as const, itemId: "gold", amount: 100 },
      ];
      manager.applyUnlockRewards(rewards);
      expect(manager.isChassisUnlocked("chassis_heavy")).toBe(true);
      expect(manager.isModuleUnlocked("mod_shield")).toBe(true);
    });

    it("persists unlocks across manager instances", () => {
      manager.unlockChassis("balanced");
      manager.unlockModule("mod_rocket");
      const newManager = new ProgressManager();
      expect(newManager.isChassisUnlocked("balanced")).toBe(true);
      expect(newManager.isModuleUnlocked("mod_rocket")).toBe(true);
    });
  });
});
