import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MapManager } from "./MapManager";
import { ProgressManager } from "./ProgressManager";

describe("MapManager", () => {
  let progressManager: ProgressManager;
  let mapManager: MapManager;
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
      clear: vi.fn(() => {
        storage = {};
      }),
    } as unknown as Storage;
    progressManager = new ProgressManager();
    mapManager = new MapManager(progressManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getTerrainType
  // ---------------------------------------------------------------------------

  it("returns terrain type for known id", () => {
    const terrain = mapManager.getTerrainType("plain");
    expect(terrain).not.toBeNull();
    expect(terrain!.id).toBe("plain");
    expect(terrain!.name).toBe("Plain");
    expect(terrain!.moveCost).toBe(1);
  });

  it("returns null for unknown terrain id", () => {
    expect(mapManager.getTerrainType("nonexistent")).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // getAllTerrainTypes
  // ---------------------------------------------------------------------------

  it("returns all terrain types", () => {
    const terrains = mapManager.getAllTerrainTypes();
    expect(terrains.length).toBeGreaterThanOrEqual(5);
    const ids = terrains.map((t) => t.id);
    expect(ids).toContain("plain");
    expect(ids).toContain("mountain");
    expect(ids).toContain("urban");
    expect(ids).toContain("forest");
    expect(ids).toContain("water");
  });

  // ---------------------------------------------------------------------------
  // getMapLayout
  // ---------------------------------------------------------------------------

  it("returns map layout for known map id", () => {
    const layout = mapManager.getMapLayout("grassland-patrol");
    expect(layout).not.toBeNull();
    expect(layout!.id).toBe("grassland-patrol");
    expect(layout!.width).toBe(10);
    expect(layout!.height).toBe(10);
  });

  it("returns null for unknown map id", () => {
    expect(mapManager.getMapLayout("nonexistent")).toBeNull();
  });

  it("mountain-pass has correct dimensions", () => {
    const layout = mapManager.getMapLayout("mountain-pass");
    expect(layout).not.toBeNull();
    expect(layout!.width).toBe(12);
    expect(layout!.height).toBe(12);
  });

  it("urban-combat has correct dimensions", () => {
    const layout = mapManager.getMapLayout("urban-combat");
    expect(layout).not.toBeNull();
    expect(layout!.width).toBe(10);
    expect(layout!.height).toBe(10);
  });

  // ---------------------------------------------------------------------------
  // getAvailableMaps
  // ---------------------------------------------------------------------------

  it("returns only unlocked maps when none are unlocked", () => {
    const available = mapManager.getAvailableMaps();
    // grassland-patrol has unlockCondition, so it should be filtered out
    // unless maps without unlockCondition exist (none in our data)
    const ids = available.map((m) => m.id);
    expect(ids).not.toContain("grassland-patrol");
    expect(ids).not.toContain("mountain-pass");
    expect(ids).not.toContain("urban-combat");
  });

  it("returns unlocked maps after unlocking", () => {
    mapManager.unlockMap("grassland-patrol");
    const available = mapManager.getAvailableMaps();
    const ids = available.map((m) => m.id);
    expect(ids).toContain("grassland-patrol");
    expect(ids).not.toContain("mountain-pass");
    expect(ids).not.toContain("urban-combat");
  });

  it("returns multiple unlocked maps", () => {
    mapManager.unlockMap("grassland-patrol");
    mapManager.unlockMap("mountain-pass");
    const available = mapManager.getAvailableMaps();
    const ids = available.map((m) => m.id);
    expect(ids).toContain("grassland-patrol");
    expect(ids).toContain("mountain-pass");
    expect(ids).not.toContain("urban-combat");
  });

  // ---------------------------------------------------------------------------
  // unlockMap
  // ---------------------------------------------------------------------------

  it("persists unlocked maps across instances", () => {
    mapManager.unlockMap("grassland-patrol");

    const newManager = new MapManager(new ProgressManager());
    const available = newManager.getAvailableMaps();
    const ids = available.map((m) => m.id);
    expect(ids).toContain("grassland-patrol");
  });

  it("does not duplicate unlocked maps", () => {
    mapManager.unlockMap("grassland-patrol");
    mapManager.unlockMap("grassland-patrol");

    const newManager = new MapManager(new ProgressManager());
    const available = newManager.getAvailableMaps();
    const grasslandCount = available.filter(
      (m) => m.id === "grassland-patrol"
    ).length;
    expect(grasslandCount).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Spawn point counts
  // ---------------------------------------------------------------------------

  it("grassland-patrol has 2 player spawns and 3 enemy spawns", () => {
    const layout = mapManager.getMapLayout("grassland-patrol")!;
    const playerSpawns = layout.spawnPoints.filter((s) => s.team === "player");
    const enemySpawns = layout.spawnPoints.filter((s) => s.team === "enemy");
    expect(playerSpawns.length).toBe(2);
    expect(enemySpawns.length).toBe(3);
  });

  it("mountain-pass has 2 player spawns and 4 enemy spawns", () => {
    const layout = mapManager.getMapLayout("mountain-pass")!;
    const playerSpawns = layout.spawnPoints.filter((s) => s.team === "player");
    const enemySpawns = layout.spawnPoints.filter((s) => s.team === "enemy");
    expect(playerSpawns.length).toBe(2);
    expect(enemySpawns.length).toBe(4);
  });

  it("urban-combat has 2 player spawns and 5 enemy spawns", () => {
    const layout = mapManager.getMapLayout("urban-combat")!;
    const playerSpawns = layout.spawnPoints.filter((s) => s.team === "player");
    const enemySpawns = layout.spawnPoints.filter((s) => s.team === "enemy");
    expect(playerSpawns.length).toBe(2);
    expect(enemySpawns.length).toBe(5);
  });
});
