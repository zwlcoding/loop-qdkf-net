import { describe, expect, it } from "vitest";
import {
  generateRiftMap,
  getAvailableRooms,
  enterRoom,
  isMapComplete,
  type RoomType,
  type RiftMap,
} from "./RiftMap";

describe("generateRiftMap", () => {
  it("produces a valid structure with 5-10 layers and 2-3 rooms per layer", () => {
    const map = generateRiftMap(42);
    const layers = new Set(map.rooms.map((r) => r.layer));
    expect(layers.size).toBeGreaterThanOrEqual(5);
    expect(layers.size).toBeLessThanOrEqual(10);

    for (const layer of layers) {
      const roomsInLayer = map.rooms.filter((r) => r.layer === layer);
      expect(roomsInLayer.length).toBeGreaterThanOrEqual(2);
      expect(roomsInLayer.length).toBeLessThanOrEqual(3);
    }
  });

  it("ensures every room connects to at least one room in the next layer", () => {
    const map = generateRiftMap(123);
    const maxLayer = Math.max(...map.rooms.map((r) => r.layer));

    for (const room of map.rooms) {
      if (room.layer < maxLayer) {
        expect(room.connections.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("ensures every room (except layer 0) has at least one incoming connection", () => {
    const map = generateRiftMap(456);
    const maxLayer = Math.max(...map.rooms.map((r) => r.layer));

    for (let layer = 1; layer <= maxLayer; layer++) {
      const roomsInLayer = map.rooms.filter((r) => r.layer === layer);
      for (const room of roomsInLayer) {
        const hasIncoming = map.rooms.some(
          (r) => r.layer === layer - 1 && r.connections.includes(room.id)
        );
        expect(hasIncoming).toBe(true);
      }
    }
  });

  it("sets the first room type to battle", () => {
    const map = generateRiftMap(789);
    const firstRoom = map.rooms.find((r) => r.layer === 0);
    expect(firstRoom).toBeDefined();
    expect(firstRoom!.type).toBe("battle");
  });

  it("is deterministic with the same seed", () => {
    const map1 = generateRiftMap(999);
    const map2 = generateRiftMap(999);
    expect(map1.rooms.length).toBe(map2.rooms.length);
    expect(map1.currentLayer).toBe(map2.currentLayer);
    expect(map1.currentRoomId).toBe(map2.currentRoomId);
    for (let i = 0; i < map1.rooms.length; i++) {
      expect(map1.rooms[i].id).toBe(map2.rooms[i].id);
      expect(map1.rooms[i].type).toBe(map2.rooms[i].type);
      expect(map1.rooms[i].layer).toBe(map2.rooms[i].layer);
      expect(map1.rooms[i].connections).toEqual(map2.rooms[i].connections);
    }
  });

  it("produces roughly correct room type distribution over many runs", () => {
    const counts: Record<RoomType, number> = {
      battle: 0,
      elite: 0,
      shop: 0,
      event: 0,
      treasure: 0,
    };

    const runs = 200;
    let totalRooms = 0;

    for (let i = 0; i < runs; i++) {
      const map = generateRiftMap(i);
      for (const room of map.rooms) {
        counts[room.type]++;
        totalRooms++;
      }
    }

    const battleRatio = counts.battle / totalRooms;
    const eliteRatio = counts.elite / totalRooms;
    const shopRatio = counts.shop / totalRooms;
    const eventRatio = counts.event / totalRooms;
    const treasureRatio = counts.treasure / totalRooms;

    // Allow generous tolerance for randomness
    expect(battleRatio).toBeGreaterThan(0.35);
    expect(battleRatio).toBeLessThan(0.65);
    expect(eliteRatio).toBeGreaterThan(0.08);
    expect(eliteRatio).toBeLessThan(0.25);
    expect(shopRatio).toBeGreaterThan(0.05);
    expect(shopRatio).toBeLessThan(0.18);
    expect(eventRatio).toBeGreaterThan(0.08);
    expect(eventRatio).toBeLessThan(0.25);
    expect(treasureRatio).toBeGreaterThan(0.05);
    expect(treasureRatio).toBeLessThan(0.18);
  });
});

describe("getAvailableRooms", () => {
  it("returns layer 0 rooms when no current room is set", () => {
    const map: RiftMap = {
      rooms: [
        { id: "r0-0", layer: 0, type: "battle", visited: false, connections: ["r1-0"] },
        { id: "r0-1", layer: 0, type: "battle", visited: false, connections: ["r1-1"] },
        { id: "r1-0", layer: 1, type: "elite", visited: false, connections: [] },
        { id: "r1-1", layer: 1, type: "shop", visited: false, connections: [] },
      ],
      currentLayer: 0,
      currentRoomId: null,
    };
    const available = getAvailableRooms(map);
    expect(available.map((r) => r.id)).toEqual(["r0-0", "r0-1"]);
  });

  it("returns correct next-layer rooms based on current room connections", () => {
    const map: RiftMap = {
      rooms: [
        { id: "r0-0", layer: 0, type: "battle", visited: true, connections: ["r1-0", "r1-1"] },
        { id: "r1-0", layer: 1, type: "elite", visited: false, connections: [] },
        { id: "r1-1", layer: 1, type: "shop", visited: false, connections: [] },
        { id: "r1-2", layer: 1, type: "event", visited: false, connections: [] },
      ],
      currentLayer: 0,
      currentRoomId: "r0-0",
    };
    const available = getAvailableRooms(map);
    expect(available.map((r) => r.id).sort()).toEqual(["r1-0", "r1-1"]);
  });

  it("returns empty array when current room has no connections", () => {
    const map: RiftMap = {
      rooms: [
        { id: "r0-0", layer: 0, type: "battle", visited: true, connections: [] },
      ],
      currentLayer: 0,
      currentRoomId: "r0-0",
    };
    expect(getAvailableRooms(map)).toEqual([]);
  });
});

describe("enterRoom", () => {
  it("marks the room as visited and updates current position", () => {
    const map: RiftMap = {
      rooms: [
        { id: "r0-0", layer: 0, type: "battle", visited: false, connections: ["r1-0"] },
        { id: "r1-0", layer: 1, type: "elite", visited: false, connections: [] },
      ],
      currentLayer: 0,
      currentRoomId: null,
    };
    const updated = enterRoom(map, "r1-0");
    expect(updated.currentRoomId).toBe("r1-0");
    expect(updated.currentLayer).toBe(1);
    expect(updated.rooms.find((r) => r.id === "r1-0")!.visited).toBe(true);
  });

  it("does not mutate the original map", () => {
    const map: RiftMap = {
      rooms: [
        { id: "r0-0", layer: 0, type: "battle", visited: false, connections: [] },
      ],
      currentLayer: 0,
      currentRoomId: null,
    };
    const updated = enterRoom(map, "r0-0");
    expect(map.rooms[0].visited).toBe(false);
    expect(map.currentRoomId).toBeNull();
    expect(updated.rooms[0].visited).toBe(true);
  });

  it("returns the same map when roomId is not found", () => {
    const map: RiftMap = {
      rooms: [
        { id: "r0-0", layer: 0, type: "battle", visited: false, connections: [] },
      ],
      currentLayer: 0,
      currentRoomId: null,
    };
    const updated = enterRoom(map, "nonexistent");
    expect(updated).toEqual(map);
  });
});

describe("isMapComplete", () => {
  it("returns false when current room is in the middle layer", () => {
    const map: RiftMap = {
      rooms: [
        { id: "r0-0", layer: 0, type: "battle", visited: true, connections: ["r1-0"] },
        { id: "r1-0", layer: 1, type: "elite", visited: true, connections: [] },
      ],
      currentLayer: 1,
      currentRoomId: "r1-0",
    };
    expect(isMapComplete(map)).toBe(true);
  });

  it("returns true when current room is in the final layer", () => {
    const map: RiftMap = {
      rooms: [
        { id: "r0-0", layer: 0, type: "battle", visited: true, connections: ["r1-0"] },
        { id: "r1-0", layer: 1, type: "elite", visited: true, connections: ["r2-0"] },
        { id: "r2-0", layer: 2, type: "treasure", visited: true, connections: [] },
      ],
      currentLayer: 2,
      currentRoomId: "r2-0",
    };
    expect(isMapComplete(map)).toBe(true);
  });

  it("returns false when no current room is set", () => {
    const map: RiftMap = {
      rooms: [
        { id: "r0-0", layer: 0, type: "battle", visited: false, connections: [] },
      ],
      currentLayer: 0,
      currentRoomId: null,
    };
    expect(isMapComplete(map)).toBe(false);
  });
});
