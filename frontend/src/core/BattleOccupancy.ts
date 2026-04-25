export interface OccupancyUnit {
  id: string;
  tileX: number;
  tileY: number;
  isAlive: boolean;
}

export interface ReachableTile {
  x: number;
  y: number;
  path: Array<{ x: number; y: number }>;
}

export const isTileOccupiedByOtherUnit = (
  units: OccupancyUnit[],
  tileX: number,
  tileY: number,
  ignoreUnitId?: string,
): boolean => {
  return units.some((unit) => unit.isAlive && unit.id !== ignoreUnitId && unit.tileX === tileX && unit.tileY === tileY);
};

export const filterReachableTilesByOccupancy = (
  reachableTiles: ReachableTile[],
  units: OccupancyUnit[],
  ignoreUnitId?: string,
): ReachableTile[] => {
  return reachableTiles.filter((tile) => !isTileOccupiedByOtherUnit(units, tile.x, tile.y, ignoreUnitId));
};
