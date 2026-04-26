import { describe, it, expect } from "vitest";
import missionsData from "../data/missions.json";
import { ProgressManager } from "../core/ProgressManager";

describe("MissionSelectScene data & helpers", () => {
  it("loads missions data correctly", () => {
    expect(missionsData).toBeDefined();
    expect(Array.isArray(missionsData.missions)).toBe(true);
    expect(missionsData.missions.length).toBeGreaterThan(0);

    const first = missionsData.missions[0];
    expect(typeof first.id).toBe("string");
    expect(typeof first.name).toBe("string");
    expect(typeof first.difficulty).toBe("string");
    expect(Array.isArray(first.rewards)).toBe(true);
  });

  it("defines difficulty colors", () => {
    const DIFFICULTY_COLORS: Record<string, number> = {
      easy: 0x22c55e,
      normal: 0xeab308,
      hard: 0xef4444,
    };

    expect(DIFFICULTY_COLORS.easy).toBe(0x22c55e);
    expect(DIFFICULTY_COLORS.normal).toBe(0xeab308);
    expect(DIFFICULTY_COLORS.hard).toBe(0xef4444);
  });

  it("can instantiate ProgressManager", () => {
    const manager = new ProgressManager();
    expect(manager).toBeInstanceOf(ProgressManager);
  });
});
