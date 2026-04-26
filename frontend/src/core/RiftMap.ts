export type RoomType = "battle" | "elite" | "shop" | "event" | "treasure";

export interface RiftRoom {
  id: string;
  layer: number;
  type: RoomType;
  visited: boolean;
  connections: string[]; // room IDs this room connects TO (next layer)
}

export interface RiftMap {
  rooms: RiftRoom[];
  currentLayer: number;
  currentRoomId: string | null;
}

// Simple seeded PRNG (LCG)
class SeededRandom {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 2147483647);
  }

  next(): number {
    // LCG parameters from Numerical Recipes
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  range(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(items: T[]): T {
    return items[this.range(0, items.length - 1)];
  }
}

const ROOM_TYPE_WEIGHTS: { type: RoomType; weight: number }[] = [
  { type: "battle", weight: 50 },
  { type: "elite", weight: 15 },
  { type: "shop", weight: 10 },
  { type: "event", weight: 15 },
  { type: "treasure", weight: 10 },
];

function pickRoomType(rng: SeededRandom): RoomType {
  const totalWeight = ROOM_TYPE_WEIGHTS.reduce((sum, r) => sum + r.weight, 0);
  let roll = rng.next() * totalWeight;
  for (const { type, weight } of ROOM_TYPE_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return "battle";
}

export function generateRiftMap(seed?: number): RiftMap {
  const rng = new SeededRandom(seed);
  const layerCount = rng.range(5, 10);
  const rooms: RiftRoom[] = [];

  // Generate rooms per layer
  for (let layer = 0; layer < layerCount; layer++) {
    const roomCount = rng.range(2, 3);
    for (let i = 0; i < roomCount; i++) {
      const room: RiftRoom = {
        id: `room-${layer}-${i}`,
        layer,
        type: pickRoomType(rng),
        visited: false,
        connections: [],
      };
      rooms.push(room);
    }
  }

  // Ensure first room is always battle
  const firstRoom = rooms.find((r) => r.layer === 0);
  if (firstRoom) {
    firstRoom.type = "battle";
  }

  // Create connections: each room in layer N connects to at least one room in layer N+1
  for (let layer = 0; layer < layerCount - 1; layer++) {
    const currentLayerRooms = rooms.filter((r) => r.layer === layer);
    const nextLayerRooms = rooms.filter((r) => r.layer === layer + 1);

    for (const room of currentLayerRooms) {
      // Connect to at least one room in next layer
      const targetCount = rng.range(1, nextLayerRooms.length);
      const shuffled = [...nextLayerRooms].sort(() => rng.next() - 0.5);
      const targets = shuffled.slice(0, targetCount);
      for (const target of targets) {
        if (!room.connections.includes(target.id)) {
          room.connections.push(target.id);
        }
      }
    }

    // Ensure every room in next layer has at least one incoming connection
    for (const nextRoom of nextLayerRooms) {
      const hasIncoming = currentLayerRooms.some((r) =>
        r.connections.includes(nextRoom.id)
      );
      if (!hasIncoming) {
        const source = rng.pick(currentLayerRooms);
        source.connections.push(nextRoom.id);
      }
    }
  }

  return {
    rooms,
    currentLayer: 0,
    currentRoomId: firstRoom ? firstRoom.id : null,
  };
}

export function getAvailableRooms(map: RiftMap): RiftRoom[] {
  if (!map.currentRoomId) {
    // If no current room, return all rooms in layer 0
    return map.rooms.filter((r) => r.layer === 0);
  }

  const currentRoom = map.rooms.find((r) => r.id === map.currentRoomId);
  if (!currentRoom) return [];

  return map.rooms.filter((r) => currentRoom.connections.includes(r.id));
}

export function enterRoom(map: RiftMap, roomId: string): RiftMap {
  const room = map.rooms.find((r) => r.id === roomId);
  if (!room) return map;

  const updatedRooms = map.rooms.map((r) =>
    r.id === roomId ? { ...r, visited: true } : r
  );

  return {
    rooms: updatedRooms,
    currentLayer: room.layer,
    currentRoomId: roomId,
  };
}

export function isMapComplete(map: RiftMap): boolean {
  if (!map.currentRoomId) return false;
  const currentRoom = map.rooms.find((r) => r.id === map.currentRoomId);
  if (!currentRoom) return false;

  const maxLayer = Math.max(...map.rooms.map((r) => r.layer));
  return currentRoom.layer >= maxLayer;
}
