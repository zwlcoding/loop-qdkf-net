import { describe, expect, it } from 'vitest';
import { filterReachableTilesByOccupancy, isTileOccupiedByOtherUnit, type OccupancyUnit, type ReachableTile } from './BattleOccupancy';

const units: OccupancyUnit[] = [
  { id: 'a-1', tileX: 2, tileY: 5, isAlive: true },
  { id: 'b-1', tileX: 3, tileY: 5, isAlive: true },
  { id: 'boss-1', tileX: 4, tileY: 5, isAlive: true },
  { id: 'downed', tileX: 5, tileY: 5, isAlive: false },
];

const reachableTiles: ReachableTile[] = [
  { x: 2, y: 4, path: [{ x: 2, y: 5 }, { x: 2, y: 4 }] },
  { x: 3, y: 5, path: [{ x: 2, y: 5 }, { x: 3, y: 5 }] },
  { x: 4, y: 5, path: [{ x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }] },
  { x: 5, y: 5, path: [{ x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }] },
];

describe('BattleOccupancy', () => {
  it('detects only living blockers from other units', () => {
    expect(isTileOccupiedByOtherUnit(units, 3, 5, 'a-1')).toBe(true);
    expect(isTileOccupiedByOtherUnit(units, 2, 5, 'a-1')).toBe(false);
    expect(isTileOccupiedByOtherUnit(units, 5, 5, 'a-1')).toBe(false);
  });

  it('filters reachable tiles so movement cannot end on occupied living units', () => {
    expect(filterReachableTilesByOccupancy(reachableTiles, units, 'a-1')).toEqual([
      { x: 2, y: 4, path: [{ x: 2, y: 5 }, { x: 2, y: 4 }] },
      { x: 5, y: 5, path: [{ x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }] },
    ]);
  });
});
