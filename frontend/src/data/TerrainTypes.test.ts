import { describe, expect, it } from 'vitest';
import {
  TERRAIN_TYPES,
  getTerrainType,
  getAllTerrainTypes,
  type TerrainType,
  type TileData,
  type SpawnPoint,
  type Objective,
  type MapLayout,
  type UnlockCondition,
} from './TerrainTypes';

describe('TerrainType data models', () => {
  it('exports TERRAIN_TYPES with exactly 5 entries', () => {
    expect(TERRAIN_TYPES).toHaveLength(5);
  });

  it('has all expected terrain IDs', () => {
    const ids = TERRAIN_TYPES.map(t => t.id);
    expect(ids).toContain('plain');
    expect(ids).toContain('mountain');
    expect(ids).toContain('urban');
    expect(ids).toContain('forest');
    expect(ids).toContain('water');
  });

  it('validates TerrainType interface fields for all entries', () => {
    for (const t of TERRAIN_TYPES) {
      expect(typeof t.id).toBe('string');
      expect(typeof t.name).toBe('string');
      expect(typeof t.moveCost).toBe('number');
      expect(typeof t.coverValue).toBe('number');
      expect(typeof t.blocksVision).toBe('boolean');
      expect(typeof t.color).toBe('string');
      expect(typeof t.icon).toBe('string');
    }
  });

  it('plain has moveCost 1, cover 0, no vision block, color #90EE90', () => {
    const plain = getTerrainType('plain')!;
    expect(plain.moveCost).toBe(1);
    expect(plain.coverValue).toBe(0);
    expect(plain.blocksVision).toBe(false);
    expect(plain.color).toBe('#90EE90');
  });

  it('mountain has moveCost 2, cover 50, blocks vision, color #8B7355', () => {
    const mountain = getTerrainType('mountain')!;
    expect(mountain.moveCost).toBe(2);
    expect(mountain.coverValue).toBe(50);
    expect(mountain.blocksVision).toBe(true);
    expect(mountain.color).toBe('#8B7355');
  });

  it('urban has moveCost 1, cover 70, blocks vision, color #708090', () => {
    const urban = getTerrainType('urban')!;
    expect(urban.moveCost).toBe(1);
    expect(urban.coverValue).toBe(70);
    expect(urban.blocksVision).toBe(true);
    expect(urban.color).toBe('#708090');
  });

  it('forest has moveCost 1, cover 30, partial vision block, color #228B22', () => {
    const forest = getTerrainType('forest')!;
    expect(forest.moveCost).toBe(1);
    expect(forest.coverValue).toBe(30);
    expect(forest.blocksVision).toBe(false);
    expect(forest.color).toBe('#228B22');
  });

  it('water has moveCost 3, cover 0, no vision block, color #4169E1', () => {
    const water = getTerrainType('water')!;
    expect(water.moveCost).toBe(3);
    expect(water.coverValue).toBe(0);
    expect(water.blocksVision).toBe(false);
    expect(water.color).toBe('#4169E1');
  });

  it('getTerrainType returns undefined for unknown id', () => {
    expect(getTerrainType('unknown')).toBeUndefined();
  });

  it('getAllTerrainTypes returns all terrain types', () => {
    expect(getAllTerrainTypes()).toEqual(TERRAIN_TYPES);
  });

  it('validates TileData interface shape', () => {
    const tile: TileData = {
      terrain: 'plain',
      elevation: 1,
      destructible: false,
    };
    expect(typeof tile.terrain).toBe('string');
    expect(typeof tile.elevation).toBe('number');
    expect(typeof tile.destructible).toBe('boolean');
  });

  it('validates SpawnPoint interface shape', () => {
    const spawn: SpawnPoint = {
      x: 2,
      y: 3,
      team: 'player',
    };
    expect(typeof spawn.x).toBe('number');
    expect(typeof spawn.y).toBe('number');
    expect(['player', 'enemy', 'neutral']).toContain(spawn.team);
  });

  it('validates Objective interface shape', () => {
    const objective: Objective = {
      type: 'defeat_all',
      target: 'enemy_team',
      description: 'Defeat all enemies',
    };
    expect(typeof objective.type).toBe('string');
    expect(typeof objective.target).toBe('string');
    expect(typeof objective.description).toBe('string');
  });

  it('validates MapLayout interface shape', () => {
    const layout: MapLayout = {
      id: 'map_01',
      name: 'Test Map',
      width: 10,
      height: 10,
      tiles: [
        [
          { terrain: 'plain', elevation: 0, destructible: false },
          { terrain: 'forest', elevation: 0, destructible: false },
        ],
      ],
      spawnPoints: [{ x: 0, y: 0, team: 'player' }],
      objectives: [{ type: 'defeat_all', target: 'enemy_team', description: 'Win' }],
    };
    expect(typeof layout.id).toBe('string');
    expect(typeof layout.name).toBe('string');
    expect(typeof layout.width).toBe('number');
    expect(typeof layout.height).toBe('number');
    expect(Array.isArray(layout.tiles)).toBe(true);
    expect(Array.isArray(layout.spawnPoints)).toBe(true);
    expect(Array.isArray(layout.objectives)).toBe(true);
  });

  it('validates MapLayout with optional unlockCondition', () => {
    const cond: UnlockCondition = {
      type: 'story_progress',
      target: 'chapter_1_complete',
    };
    const layout: MapLayout = {
      id: 'map_02',
      name: 'Locked Map',
      width: 8,
      height: 8,
      tiles: [[{ terrain: 'plain', elevation: 0, destructible: false }]],
      spawnPoints: [],
      objectives: [],
      unlockCondition: cond,
    };
    expect(layout.unlockCondition).toBeDefined();
    expect(layout.unlockCondition!.type).toBe('story_progress');
    expect(layout.unlockCondition!.target).toBe('chapter_1_complete');
  });

  it('coverValue is within 0-100 range for all terrain types', () => {
    for (const t of TERRAIN_TYPES) {
      expect(t.coverValue).toBeGreaterThanOrEqual(0);
      expect(t.coverValue).toBeLessThanOrEqual(100);
    }
  });

  it('elevation is within 0-3 range in TileData', () => {
    const tile: TileData = { terrain: 'mountain', elevation: 3, destructible: false };
    expect(tile.elevation).toBeGreaterThanOrEqual(0);
    expect(tile.elevation).toBeLessThanOrEqual(3);
  });
});
