export interface TerrainType {
  id: string;
  name: string;
  moveCost: number; // 1=normal, 2=difficult, 0=impassable
  coverValue: number; // 0-100, affects hit rate
  blocksVision: boolean;
  color: string; // hex color for rendering
  icon: string; // emoji or text icon
}

export interface TileData {
  terrain: string; // terrainType id
  elevation: number; // 0-3
  destructible: boolean;
}

export interface SpawnPoint {
  x: number;
  y: number;
  team: 'player' | 'enemy' | 'neutral';
}

export interface Objective {
  type: string;
  target: string;
  description: string;
}

export interface UnlockCondition {
  type: 'story_progress' | 'mission_clear' | 'achievement';
  target: string;
  value?: number;
}

export interface MapLayout {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: TileData[][];
  spawnPoints: SpawnPoint[];
  objectives: Objective[];
  unlockCondition?: UnlockCondition;
}

// ---------------------------------------------------------------------------
// Initial terrain data
// ---------------------------------------------------------------------------

export const TERRAIN_TYPES: TerrainType[] = [
  {
    id: 'plain',
    name: 'Plain',
    moveCost: 1,
    coverValue: 0,
    blocksVision: false,
    color: '#90EE90',
    icon: '⬜',
  },
  {
    id: 'mountain',
    name: 'Mountain',
    moveCost: 2,
    coverValue: 50,
    blocksVision: true,
    color: '#8B7355',
    icon: '⛰️',
  },
  {
    id: 'urban',
    name: 'Urban',
    moveCost: 1,
    coverValue: 70,
    blocksVision: true,
    color: '#708090',
    icon: '🏢',
  },
  {
    id: 'forest',
    name: 'Forest',
    moveCost: 1,
    coverValue: 30,
    blocksVision: false,
    color: '#228B22',
    icon: '🌲',
  },
  {
    id: 'water',
    name: 'Water',
    moveCost: 3,
    coverValue: 0,
    blocksVision: false,
    color: '#4169E1',
    icon: '💧',
  },
];

export function getTerrainType(id: string): TerrainType | undefined {
  return TERRAIN_TYPES.find(t => t.id === id);
}

export function getAllTerrainTypes(): TerrainType[] {
  return TERRAIN_TYPES;
}
