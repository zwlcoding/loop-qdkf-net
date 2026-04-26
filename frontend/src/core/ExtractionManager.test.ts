import { describe, it, expect, beforeEach, vi } from "vitest";
import { ExtractionManager } from "./ExtractionManager";
import type { Mission, Reward } from "../data/MissionTypes";
import { Unit } from "../entities/Unit";

function makeMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: "mission-1",
    name: "Test Mission",
    description: "A test mission",
    difficulty: "normal",
    rewards: [
      { type: "resource", itemId: "gold", amount: 100 },
      { type: "experience", itemId: "xp", amount: 50 },
    ],
    extractionTurn: 3,
    mapId: "map-1",
    ...overrides,
  };
}

function makeUnit(id: string): Unit {
  const mockScene = {
    add: {
      image: vi.fn(() => ({
        setDisplaySize: vi.fn(),
        setTint: vi.fn(),
        setPosition: vi.fn(),
        setAlpha: vi.fn(),
        destroy: vi.fn(),
      })),
    },
    registry: {
      get: vi.fn(() => null),
    },
  } as unknown as Parameters<typeof Unit>[0];

  return new Unit(mockScene, 0, 0, "vanguard", 0, id);
}

describe("ExtractionManager", () => {
  describe("turn tracking", () => {
    it("starts at turn 0", () => {
      const manager = new ExtractionManager(makeMission());
      expect(manager.getCurrentTurn()).toBe(0);
    });

    it("increments turn", () => {
      const manager = new ExtractionManager(makeMission());
      manager.incrementTurn();
      expect(manager.getCurrentTurn()).toBe(1);
    });

    it("extraction is not available before extractionTurn", () => {
      const manager = new ExtractionManager(makeMission({ extractionTurn: 3 }));
      manager.incrementTurn();
      manager.incrementTurn();
      expect(manager.isExtractionAvailable()).toBe(false);
    });

    it("extraction is available at extractionTurn", () => {
      const manager = new ExtractionManager(makeMission({ extractionTurn: 3 }));
      manager.incrementTurn();
      manager.incrementTurn();
      manager.incrementTurn();
      expect(manager.isExtractionAvailable()).toBe(true);
    });

    it("extraction is available after extractionTurn", () => {
      const manager = new ExtractionManager(makeMission({ extractionTurn: 3 }));
      manager.incrementTurn();
      manager.incrementTurn();
      manager.incrementTurn();
      manager.incrementTurn();
      expect(manager.isExtractionAvailable()).toBe(true);
    });
  });

  describe("evaluateExtraction", () => {
    it("fails when no units survive", () => {
      const manager = new ExtractionManager(makeMission());
      const result = manager.evaluateExtraction([]);
      expect(result.success).toBe(false);
      expect(result.rewards).toEqual([]);
      expect(result.reason).toContain("No surviving units");
    });

    it("succeeds when at least one unit survives", () => {
      const manager = new ExtractionManager(makeMission());
      const unit = makeUnit("unit-1");
      const result = manager.evaluateExtraction([unit]);
      expect(result.success).toBe(true);
      expect(result.rewards.length).toBeGreaterThan(0);
      expect(result.reason).toContain("extracted successfully");
    });

    it("succeeds with multiple surviving units", () => {
      const manager = new ExtractionManager(makeMission());
      const units = [makeUnit("unit-1"), makeUnit("unit-2")];
      const result = manager.evaluateExtraction(units);
      expect(result.success).toBe(true);
      expect(result.reason).toContain("2 unit(s)");
    });
  });

  describe("calculateRewards", () => {
    it("returns base rewards scaled by difficulty easy (1.0)", () => {
      const manager = new ExtractionManager(
        makeMission({ difficulty: "easy", rewards: [{ type: "resource", itemId: "gold", amount: 100 }] })
      );
      const unit = makeUnit("unit-1");
      // 1/1 survival ratio -> 0.5 bonus -> total 1.5
      const rewards = manager.calculateRewards([unit], 1);
      expect(rewards[0].amount).toBe(150);
    });

    it("returns base rewards scaled by difficulty normal (1.5)", () => {
      const manager = new ExtractionManager(
        makeMission({ difficulty: "normal", rewards: [{ type: "resource", itemId: "gold", amount: 100 }] })
      );
      const unit = makeUnit("unit-1");
      // 1/1 survival ratio -> 0.5 bonus -> total 2.0
      const rewards = manager.calculateRewards([unit], 1);
      expect(rewards[0].amount).toBe(200);
    });

    it("returns base rewards scaled by difficulty hard (2.0)", () => {
      const manager = new ExtractionManager(
        makeMission({ difficulty: "hard", rewards: [{ type: "resource", itemId: "gold", amount: 100 }] })
      );
      const unit = makeUnit("unit-1");
      // 1/1 survival ratio -> 0.5 bonus -> total 2.5
      const rewards = manager.calculateRewards([unit], 1);
      expect(rewards[0].amount).toBe(250);
    });

    it("applies survival bonus based on ratio", () => {
      const manager = new ExtractionManager(
        makeMission({ difficulty: "easy", rewards: [{ type: "resource", itemId: "gold", amount: 100 }] })
      );
      const units = [makeUnit("unit-1"), makeUnit("unit-2")];
      // 2/4 = 0.5 survival ratio -> 0.25 bonus -> total 1.25
      const rewards = manager.calculateRewards(units, 4);
      expect(rewards[0].amount).toBe(125);
    });

    it("applies full survival bonus when all units survive", () => {
      const manager = new ExtractionManager(
        makeMission({ difficulty: "easy", rewards: [{ type: "resource", itemId: "gold", amount: 100 }] })
      );
      const units = [makeUnit("unit-1"), makeUnit("unit-2")];
      // 2/2 = 1.0 survival ratio -> 0.5 bonus -> total 1.5
      const rewards = manager.calculateRewards(units, 2);
      expect(rewards[0].amount).toBe(150);
    });

    it("combines difficulty multiplier and survival bonus", () => {
      const manager = new ExtractionManager(
        makeMission({ difficulty: "normal", rewards: [{ type: "resource", itemId: "gold", amount: 100 }] })
      );
      const units = [makeUnit("unit-1"), makeUnit("unit-2")];
      // normal 1.5 + (2/4 * 0.5) = 1.5 + 0.25 = 1.75 -> 175
      const rewards = manager.calculateRewards(units, 4);
      expect(rewards[0].amount).toBe(175);
    });

    it("scales all rewards in the array", () => {
      const baseRewards: Reward[] = [
        { type: "resource", itemId: "gold", amount: 100 },
        { type: "experience", itemId: "xp", amount: 50 },
      ];
      const manager = new ExtractionManager(
        makeMission({ difficulty: "hard", rewards: baseRewards })
      );
      const unit = makeUnit("unit-1");
      // 1/1 survival ratio -> 0.5 bonus -> total 2.5
      const rewards = manager.calculateRewards([unit], 1);
      expect(rewards).toHaveLength(2);
      expect(rewards[0].amount).toBe(250);
      expect(rewards[1].amount).toBe(125);
    });

    it("handles zero totalUnits gracefully", () => {
      const manager = new ExtractionManager(
        makeMission({ difficulty: "easy", rewards: [{ type: "resource", itemId: "gold", amount: 100 }] })
      );
      const rewards = manager.calculateRewards([], 0);
      expect(rewards[0].amount).toBe(100);
    });

    it("preserves unlock rewards without scaling", () => {
      const manager = new ExtractionManager(
        makeMission({
          difficulty: "hard",
          rewards: [
            { type: "resource", itemId: "gold", amount: 100 },
            { type: "unlock", itemId: "chassis_heavy", amount: 1 },
          ],
        })
      );
      const unit = makeUnit("unit-1");
      const rewards = manager.calculateRewards([unit], 1);
      expect(rewards).toHaveLength(2);
      expect(rewards[0].type).toBe("resource");
      expect(rewards[0].amount).toBe(250); // scaled
      expect(rewards[1].type).toBe("unlock");
      expect(rewards[1].itemId).toBe("chassis_heavy");
      expect(rewards[1].amount).toBe(1); // not scaled
    });

    it("includes unlock rewards in evaluateExtraction result", () => {
      const manager = new ExtractionManager(
        makeMission({
          rewards: [
            { type: "unlock", itemId: "mod_laser_rifle", amount: 1 },
          ],
        })
      );
      const unit = makeUnit("unit-1");
      const result = manager.evaluateExtraction([unit]);
      expect(result.success).toBe(true);
      expect(result.rewards).toHaveLength(1);
      expect(result.rewards[0].type).toBe("unlock");
      expect(result.rewards[0].itemId).toBe("mod_laser_rifle");
    });
  });
});
