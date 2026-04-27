import { describe, expect, it } from 'vitest';
import { GridMap } from './GridMap';

// GridMap depends on Phaser.Scene; mock the minimum required surface.
const makeMockScene = () =>
  ({
    scale: { width: 800, height: 600 },
    add: {
      graphics: () => ({
        setDepth: () => {},
        clear: () => {},
        fillStyle: () => {},
        fillRect: () => {},
        lineStyle: () => {},
        strokeRect: () => {},
        fillCircle: () => {},
        strokeCircle: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        strokePath: () => {},
        fillTriangle: () => {},
        closePath: () => {},
        destroy: () => {},
      }),
      image: () => ({
        setOrigin: () => {},
        setDisplaySize: () => {},
        setAlpha: () => {},
        setTint: () => {},
        setScale: () => {},
        setDepth: () => {},
        destroy: () => {},
        width: 64,
        height: 64,
      }),
      text: () => ({
        setOrigin: () => ({ setDepth: () => ({}) }),
        setDepth: () => ({ setOrigin: () => ({}) }),
        destroy: () => {},
      }),
    },
  }) as any;

const setAllTileHeights = (grid: GridMap, height: number): void => {
  for (let x = 0; x < (grid as any).tiles.length; x += 1) {
    for (let y = 0; y < (grid as any).tiles[x].length; y += 1) {
      (grid as any).tiles[x][y].height = height;
    }
  }
};

describe('GridMap terrain effects', () => {
  it('centers isometric coordinates inside the configured battle viewport', () => {
    const scene = makeMockScene();
    const grid = new GridMap(scene, 2, 2, 64, { x: 100, y: 200, width: 300, height: 180 });
    setAllTileHeights(grid, 0);

    const pos = grid.getTileWorldPosition(0, 0);
    expect(pos.x).toBeCloseTo(218);
    expect(pos.y).toBeCloseTo(258);
    expect(grid.worldToTile(pos.x, pos.y)).toEqual({ x: 0, y: 0 });
  });

  it('updates coordinate conversion when the battle viewport changes', () => {
    const scene = makeMockScene();
    const grid = new GridMap(scene, 2, 2, 64, { x: 0, y: 0, width: 200, height: 160 });
    setAllTileHeights(grid, 0);
    const before = grid.getTileWorldPosition(0, 0);

    grid.setLayout(64, { x: 40, y: 80, width: 200, height: 160 });
    setAllTileHeights(grid, 0);
    const after = grid.getTileWorldPosition(0, 0);

    expect(after.x - before.x).toBeCloseTo(40);
    expect(after.y - before.y).toBeCloseTo(80);
    expect(grid.worldToTile(after.x, after.y)).toEqual({ x: 0, y: 0 });
  });

  it('derives elevation level height from tile size', () => {
    const scene = makeMockScene();
    const grid = new GridMap(scene, 2, 2, 80);

    expect(grid.getElevationLevelHeight()).toBe(19);

    grid.setLayout(40, { x: 0, y: 0, width: 200, height: 160 });
    expect(grid.getElevationLevelHeight()).toBe(10);
  });

  it('exposes side walls only where neighboring tiles are lower or missing', () => {
    const scene = makeMockScene();
    const grid = new GridMap(scene, 2, 2, 64, { x: 0, y: 0, width: 240, height: 160 });
    (grid as any).tiles[0][0] = {
      x: 0, y: 0, height: 2, walkable: true,
      terrain: 'mountain', terrainFlags: ['obstacle', 'rough'],
    };
    (grid as any).tiles[1][0] = {
      x: 1, y: 0, height: 2, walkable: true,
      terrain: 'plain', terrainFlags: ['natural'],
    };
    (grid as any).tiles[0][1] = {
      x: 0, y: 1, height: 0, walkable: true,
      terrain: 'plain', terrainFlags: ['natural'],
    };

    const walls = grid.getExposedSideWalls(0, 0);

    expect(walls.map((wall) => wall.edge)).toEqual(['south']);
    expect(walls[0].heightLevels).toBe(2);
    expect(walls[0].wallHeight).toBe(grid.getElevationLevelHeight() * 2);
  });

  it('draws boundary side walls for raised map edges', () => {
    const scene = makeMockScene();
    const grid = new GridMap(scene, 1, 1, 64, { x: 0, y: 0, width: 160, height: 120 });
    (grid as any).tiles[0][0] = {
      x: 0, y: 0, height: 1, walkable: true,
      terrain: 'urban', terrainFlags: ['obstacle'],
    };

    const walls = grid.getExposedSideWalls(0, 0);

    expect(walls.map((wall) => wall.edge).sort()).toEqual(['east', 'south']);
    expect(new Set(walls.map((wall) => wall.color)).size).toBeGreaterThan(0);
  });

  it('uses elevated top centers for world positions and hit testing', () => {
    const scene = makeMockScene();
    const grid = new GridMap(scene, 2, 2, 64, { x: 0, y: 0, width: 240, height: 160 });
    (grid as any).tiles[0][0].height = 0;
    (grid as any).tiles[1][0].height = 2;

    const ground = grid.tileToGroundCenter(1, 0);
    const top = grid.getTileWorldPosition(1, 0);

    expect(top.y).toBeCloseTo(ground.py - grid.getElevationLevelHeight() * 2);
    expect(grid.worldToTile(top.x, top.y)).toEqual({ x: 1, y: 0 });
    expect(grid.screenToTile(top.x - 100, top.y - 50, { scrollX: 100, scrollY: 50, zoom: 1 })).toEqual({ x: 1, y: 0 });
  });

  it('calculates world bounds that include elevated wall geometry', () => {
    const scene = makeMockScene();
    const grid = new GridMap(scene, 1, 1, 64, { x: 0, y: 0, width: 160, height: 120 });
    (grid as any).tiles[0][0] = {
      x: 0, y: 0, height: 2, walkable: true,
      terrain: 'mountain', terrainFlags: ['obstacle', 'rough'],
    };

    const bounds = grid.getWorldBounds(12);

    expect(bounds.width).toBeGreaterThan(64);
    expect(bounds.height).toBeGreaterThan(32);
    expect(bounds.x).toBeLessThan(grid.getTileWorldPosition(0, 0).x);
  });

  it('findReachableTiles respects terrain moveCost', () => {
    const scene = makeMockScene();
    const grid = new GridMap(scene, 5, 5, 64);

    // Override tiles manually for deterministic testing
    (grid as any).tiles[2][2] = {
      x: 2, y: 2, height: 0, walkable: true,
      terrain: 'plain', terrainFlags: ['natural'],
    };
    (grid as any).tiles[2][1] = {
      x: 2, y: 1, height: 0, walkable: true,
      terrain: 'mountain', terrainFlags: ['obstacle', 'rough'],
    };
    (grid as any).tiles[2][3] = {
      x: 2, y: 3, height: 0, walkable: true,
      terrain: 'plain', terrainFlags: ['natural'],
    };
    (grid as any).tiles[1][2] = {
      x: 1, y: 2, height: 0, walkable: true,
      terrain: 'plain', terrainFlags: ['natural'],
    };
    (grid as any).tiles[3][2] = {
      x: 3, y: 2, height: 0, walkable: true,
      terrain: 'plain', terrainFlags: ['natural'],
    };

    // From (2,2) with move=2: mountain costs 2, plain costs 1
    const reachable = grid.findReachableTiles(2, 2, 2, 1);
    const keys = reachable.map((r) => `${r.x},${r.y}`);

    // Plain neighbors at distance 1 are reachable
    expect(keys).toContain('2,3');
    expect(keys).toContain('1,2');
    expect(keys).toContain('3,2');

    // Mountain at (2,1) costs 2, so reachable with move=2
    expect(keys).toContain('2,1');
  });

  it('findReachableTiles excludes tiles when moveCost exceeds remaining move', () => {
    const scene = makeMockScene();
    const grid = new GridMap(scene, 5, 5, 64);

    (grid as any).tiles[2][2] = {
      x: 2, y: 2, height: 0, walkable: true,
      terrain: 'plain', terrainFlags: ['natural'],
    };
    (grid as any).tiles[2][1] = {
      x: 2, y: 1, height: 0, walkable: true,
      terrain: 'mountain', terrainFlags: ['obstacle', 'rough'],
    };

    // With move=1, mountain (cost 2) should not be reachable
    const reachable = grid.findReachableTiles(2, 2, 1, 1);
    const keys = reachable.map((r) => `${r.x},${r.y}`);
    expect(keys).not.toContain('2,1');
  });

  it('getMoveCost returns correct values for terrain types', () => {
    const scene = makeMockScene();
    const grid = new GridMap(scene, 5, 5, 64);

    (grid as any).tiles[1][1] = {
      x: 1, y: 1, height: 0, walkable: true,
      terrain: 'plain', terrainFlags: ['natural'],
    };
    (grid as any).tiles[2][2] = {
      x: 2, y: 2, height: 0, walkable: true,
      terrain: 'mountain', terrainFlags: ['obstacle', 'rough'],
    };
    (grid as any).tiles[3][3] = {
      x: 3, y: 3, height: 0, walkable: true,
      terrain: 'water', terrainFlags: ['hazard', 'impassable'],
    };

    expect(grid.getMoveCost(1, 1)).toBe(1);
    expect(grid.getMoveCost(2, 2)).toBe(2);
    expect(grid.getMoveCost(3, 3)).toBe(3);
  });

  it('getCoverValue returns correct values for terrain types', () => {
    const scene = makeMockScene();
    const grid = new GridMap(scene, 5, 5, 64);

    (grid as any).tiles[1][1] = {
      x: 1, y: 1, height: 0, walkable: true,
      terrain: 'plain', terrainFlags: ['natural'],
    };
    (grid as any).tiles[2][2] = {
      x: 2, y: 2, height: 0, walkable: true,
      terrain: 'urban', terrainFlags: ['obstacle'],
    };

    expect(grid.getCoverValue(1, 1)).toBe(0);
    expect(grid.getCoverValue(2, 2)).toBe(70);
  });

  it('terrainBlocksVision returns true for mountain and urban', () => {
    const scene = makeMockScene();
    const grid = new GridMap(scene, 5, 5, 64);

    (grid as any).tiles[1][1] = {
      x: 1, y: 1, height: 0, walkable: true,
      terrain: 'mountain', terrainFlags: ['obstacle', 'rough'],
    };
    (grid as any).tiles[2][2] = {
      x: 2, y: 2, height: 0, walkable: true,
      terrain: 'urban', terrainFlags: ['obstacle'],
    };
    (grid as any).tiles[3][3] = {
      x: 3, y: 3, height: 0, walkable: true,
      terrain: 'forest', terrainFlags: ['natural', 'rough'],
    };

    expect(grid.terrainBlocksVision(1, 1)).toBe(true);
    expect(grid.terrainBlocksVision(2, 2)).toBe(true);
    expect(grid.terrainBlocksVision(3, 3)).toBe(false);
  });

  it('hasLineOfSight returns false when terrain blocks vision', () => {
    const scene = makeMockScene();
    const grid = new GridMap(scene, 5, 5, 64);

    // Set up a line from (0,0) to (0,3) with a vision blocker at (0,1)
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        (grid as any).tiles[x][y] = {
          x, y, height: 0, walkable: true,
          terrain: 'plain', terrainFlags: ['natural'],
        };
      }
    }
    (grid as any).tiles[0][1] = {
      x: 0, y: 1, height: 0, walkable: true,
      terrain: 'urban', terrainFlags: ['obstacle'],
    };

    expect(grid.hasLineOfSight(0, 0, 0, 3)).toBe(false);
    expect(grid.hasLineOfSight(0, 0, 0, 1)).toBe(true); // target tile itself is not checked
  });

  it('hasLineOfSight returns true when no vision blockers are in the way', () => {
    const scene = makeMockScene();
    const grid = new GridMap(scene, 5, 5, 64);

    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        (grid as any).tiles[x][y] = {
          x, y, height: 0, walkable: true,
          terrain: 'plain', terrainFlags: ['natural'],
        };
      }
    }

    expect(grid.hasLineOfSight(0, 0, 4, 4)).toBe(true);
    expect(grid.hasLineOfSight(1, 1, 3, 3)).toBe(true);
  });
});
