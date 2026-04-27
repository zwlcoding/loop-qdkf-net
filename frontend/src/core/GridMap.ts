import { Scene, GameObjects } from 'phaser';
import { BATTLE_TERRAIN_TEXTURE_BY_TERRAIN } from './BattleVisualAssets';
import { getTerrainType } from '../data/TerrainTypes';

export interface TileData {
  x: number;
  y: number;
  height: number;
  walkable: boolean;
  terrain: 'grass' | 'dirt' | 'stone' | 'water' | 'plain' | 'mountain' | 'urban' | 'forest';
  terrainFlags: string[];
  hazardType?: string;
  objectiveId?: string;
}

export interface PathNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent?: PathNode;
  heightDiff: number;
}

export interface HighlightTile {
  x: number;
  y: number;
  color?: number;
  alpha?: number;
}

export interface GridMapViewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ExposedWallEdge = 'east' | 'south';

export interface IsoPoint {
  x: number;
  y: number;
}

export interface ExposedSideWall {
  edge: ExposedWallEdge;
  heightLevels: number;
  wallHeight: number;
  color: number;
  shadowColor: number;
  lineColor: number;
  vertices: {
    topA: IsoPoint;
    topB: IsoPoint;
    bottomA: IsoPoint;
    bottomB: IsoPoint;
  };
}

export interface GridMapWorldBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function darkenColor(color: number, amount: number): number {
  const factor = Math.max(0, Math.min(1, 1 - amount));
  const r = Math.round(((color >> 16) & 0xff) * factor);
  const g = Math.round(((color >> 8) & 0xff) * factor);
  const b = Math.round((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

export class GridMap {
  private scene: Scene;
  private tiles: TileData[][];
  private tileSize: number;
  private width: number;
  private height: number;
  private tileGraphics: GameObjects.Graphics;
  private edgeGraphics: GameObjects.Graphics;
  private tileIconTexts: GameObjects.Text[][];
  private highlightGraphics: GameObjects.Graphics;
  private pathGraphics: GameObjects.Graphics;
  private markerGraphics: GameObjects.Graphics;
  private pressureGraphics: GameObjects.Graphics;
  private markerTexts: GameObjects.Text[] = [];
  private tileSprites: (GameObjects.Image | null)[][] = [];
  private tileMaskGraphics: GameObjects.Graphics[][] = [];
  private viewport: GridMapViewport;

  constructor(scene: Scene, width: number, height: number, tileSize: number = 64, viewport?: GridMapViewport) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.viewport = viewport ?? { x: 0, y: 0, width: scene.scale.width, height: scene.scale.height };
    this.tiles = [];
    this.tileGraphics = scene.add.graphics();
    this.tileGraphics.setDepth(1);
    this.edgeGraphics = scene.add.graphics();
    this.edgeGraphics.setDepth(3);
    this.tileIconTexts = [];
    this.highlightGraphics = scene.add.graphics();
    this.pathGraphics = scene.add.graphics();
    this.markerGraphics = scene.add.graphics();
    this.pressureGraphics = scene.add.graphics();

    // Layer ordering: tile sprites < highlights < path < markers < pressure < UI
    this.highlightGraphics.setDepth(5);
    this.pathGraphics.setDepth(6);
    this.markerGraphics.setDepth(7);
    this.pressureGraphics.setDepth(8);

    this.generateMap();
    this.renderMap();
  }

  private generateMap(): void {
    for (let x = 0; x < this.width; x++) {
      this.tiles[x] = [];
      this.tileIconTexts[x] = [];
      this.tileSprites[x] = [];
      this.tileMaskGraphics[x] = [];
      for (let y = 0; y < this.height; y++) {
        const height = Math.floor(Math.random() * 3);
        const terrain = this.determineTerrain(x, y);
        const terrainFlags = this.getTerrainFlags(terrain);
        const hazardType = terrain !== 'water' && Math.random() < 0.08 ? 'spikes' : undefined;
        const objectiveId = terrain === 'stone' && Math.random() < 0.04 ? `objective-${x}-${y}` : undefined;

        this.tiles[x][y] = {
          x,
          y,
          height,
          walkable: terrain !== 'water',
          terrain,
          terrainFlags: hazardType ? [...terrainFlags, 'hazard'] : terrainFlags,
          hazardType,
          objectiveId,
        };
      }
    }
  }

  private determineTerrain(_x: number, _y: number): TileData['terrain'] {
    const noise = Math.random();
    if (noise < 0.08) return 'water';
    if (noise < 0.25) return 'mountain';
    if (noise < 0.38) return 'urban';
    if (noise < 0.55) return 'forest';
    return 'plain';
  }

  private getTerrainFlags(terrain: TileData['terrain']): string[] {
    const flags: Record<TileData['terrain'], string[]> = {
      grass: ['natural'],
      dirt: ['natural', 'rough'],
      stone: ['obstacle', 'rough'],
      water: ['hazard', 'impassable'],
      plain: ['natural'],
      mountain: ['obstacle', 'rough'],
      urban: ['obstacle'],
      forest: ['natural', 'rough'],
    };
    return flags[terrain];
  }

  /**
   * Map terrain type to sprite key for tile sprites loaded in BootScene
   */
  private getTerrainSpriteKey(terrain: TileData['terrain']): string {
    return BATTLE_TERRAIN_TEXTURE_BY_TERRAIN[terrain];
  }

  /**
   * Ensure a terrain sprite texture exists. Returns the texture key to use.
   * If the expected sprite texture didn't load, generates a fallback
   * colored rectangle so the tile is never invisible.
   */
  private ensureTerrainSprite(terrain: TileData['terrain']): string {
    const spriteKey = this.getTerrainSpriteKey(terrain);
    if (this.scene.textures && this.scene.textures.exists(spriteKey)) {
      return spriteKey;
    }

    // Generate a fallback texture based on terrain color
    const fallbackKey = `fallback-sprite-${terrain}`;
    if (this.scene.textures && !this.scene.textures.exists(fallbackKey)) {
      const terrainInfo = getTerrainType(terrain);
      const colorHex = terrainInfo?.color ?? this.getTerrainFallbackColor(terrain);
      const color = typeof colorHex === 'string' ? parseInt(colorHex.replace('#', '0x'), 16) : colorHex;
      const g = this.scene.add.graphics();
      const halfW = 32;
      const halfH = 16;
      const cx = 32;
      const cy = 32;
      for (let i = 0; i < 8; i++) {
        const bandAlpha = 0.5 + (i / 8) * 0.5;
        g.fillStyle(color, bandAlpha);
        const inset = i * 3;
        g.fillTriangle(cx, cy - halfH + inset / 2, cx + halfW - inset, cy, cx, cy + halfH - inset / 2);
        g.fillTriangle(cx, cy - halfH + inset / 2, cx - halfW + inset, cy, cx, cy + halfH - inset / 2);
      }
      g.fillStyle(0xffffff, 0.08);
      g.fillTriangle(32, 8, 56, 32, 32, 56);
      g.fillTriangle(32, 8, 8, 32, 32, 56);
      g.lineStyle(1, 0xffffff, 0.15);
      g.beginPath();
      g.moveTo(cx, cy - halfH);
      g.lineTo(cx + halfW, cy);
      g.lineTo(cx, cy + halfH);
      g.lineTo(cx - halfW, cy);
      g.closePath();
      g.strokePath();
      g.generateTexture(fallbackKey, 64, 64);
      g.destroy();
    }
    return fallbackKey;
  }

  // ─── Isometric coordinate conversion ─────────────────────────────────

  getElevationLevelHeight(): number {
    return Math.max(10, Math.round(this.tileSize * 0.24));
  }

  private getMapOrigin(): { x: number; y: number } {
    const mapWidth = (this.width + this.height) * (this.tileSize / 2);
    const mapHeight = (this.width + this.height) * (this.tileSize / 4);
    return {
      x: this.viewport.x + (this.viewport.width - mapWidth) / 2 + this.tileSize / 2,
      y: this.viewport.y + (this.viewport.height - mapHeight) / 2,
    };
  }

  tileToGroundCenter(x: number, y: number): { px: number; py: number } {
    const origin = this.getMapOrigin();
    return {
      px: (x - y) * (this.tileSize / 2) + origin.x,
      py: (x + y) * (this.tileSize / 4) + origin.y,
    };
  }

  tileToTopCenter(x: number, y: number): { px: number; py: number } {
    const ground = this.tileToGroundCenter(x, y);
    const tile = this.getTile(x, y);
    const tileHeight = tile ? tile.height : 0;
    return {
      px: ground.px,
      py: ground.py - tileHeight * this.getElevationLevelHeight(),
    };
  }

  getTileDepth(x: number, y: number, layerOffset: number = 0): number {
    const tile = this.getTile(x, y);
    return 2 + (x + y) * 0.1 + (tile?.height ?? 0) * 0.02 + layerOffset;
  }

  private getTerrainWallMaterial(terrain: TileData['terrain']): { color: number; shadowColor: number; lineColor: number } {
    const materials: Record<TileData['terrain'], { color: number; shadowColor: number; lineColor: number }> = {
      grass: { color: 0x568e3f, shadowColor: 0x2f5b2e, lineColor: 0x8ecf63 },
      dirt: { color: 0x7a5734, shadowColor: 0x4e3420, lineColor: 0xb0834d },
      stone: { color: 0x6f7880, shadowColor: 0x424950, lineColor: 0xa6afb8 },
      water: { color: 0x286d9e, shadowColor: 0x184464, lineColor: 0x72d4ff },
      plain: { color: 0x5f9f43, shadowColor: 0x315e2d, lineColor: 0x9ad96f },
      mountain: { color: 0x806044, shadowColor: 0x4a382a, lineColor: 0xb9966f },
      urban: { color: 0x6d7379, shadowColor: 0x3e454c, lineColor: 0xb7c0c8 },
      forest: { color: 0x3f753a, shadowColor: 0x234b25, lineColor: 0x77b95d },
    };

    return materials[terrain];
  }

  getExposedSideWalls(x: number, y: number): ExposedSideWall[] {
    const tile = this.getTile(x, y);
    if (!tile || tile.height <= 0) {
      return [];
    }

    const { px: cx, py: cy } = this.tileToTopCenter(x, y);
    const halfW = this.tileSize / 2;
    const halfH = this.tileSize / 4;
    const material = this.getTerrainWallMaterial(tile.terrain);
    const bottom: IsoPoint = { x: cx, y: cy + halfH };
    const left: IsoPoint = { x: cx - halfW, y: cy };
    const right: IsoPoint = { x: cx + halfW, y: cy };

    const candidates: Array<{
      edge: ExposedWallEdge;
      neighbor: TileData | null;
      topA: IsoPoint;
      topB: IsoPoint;
      shade: number;
    }> = [
      { edge: 'south', neighbor: this.getTile(x, y + 1), topA: left, topB: bottom, shade: 0.88 },
      { edge: 'east', neighbor: this.getTile(x + 1, y), topA: bottom, topB: right, shade: 1 },
    ];

    return candidates.flatMap((candidate) => {
      const neighborHeight = candidate.neighbor?.height ?? 0;
      const heightLevels = tile.height - neighborHeight;
      if (heightLevels <= 0) {
        return [];
      }

      const wallHeight = heightLevels * this.getElevationLevelHeight();
      const color = darkenColor(material.color, 1 - candidate.shade);
      return [{
        edge: candidate.edge,
        heightLevels,
        wallHeight,
        color,
        shadowColor: material.shadowColor,
        lineColor: material.lineColor,
        vertices: {
          topA: candidate.topA,
          topB: candidate.topB,
          bottomA: { x: candidate.topA.x, y: candidate.topA.y + wallHeight },
          bottomB: { x: candidate.topB.x, y: candidate.topB.y + wallHeight },
        },
      }];
    });
  }

  /**
   * Grid tile center → pixel center (isometric)
   */
  tileToIso(x: number, y: number): { px: number; py: number } {
    return this.tileToTopCenter(x, y);
  }

  /**
   * Pixel position → grid tile (inverse isometric)
   */
  isoToTile(px: number, py: number): { x: number; y: number } | null {
    return this.pickTileAtWorld(px, py);
  }

  screenToTile(
    screenX: number,
    screenY: number,
    camera?: { scrollX?: number; scrollY?: number; zoom?: number }
  ): { x: number; y: number } | null {
    const zoom = camera?.zoom && camera.zoom > 0 ? camera.zoom : 1;
    return this.worldToTile(
      (screenX / zoom) + (camera?.scrollX ?? 0),
      (screenY / zoom) + (camera?.scrollY ?? 0)
    );
  }

  private pickTileAtWorld(wx: number, wy: number): { x: number; y: number } | null {
    let best: { x: number; y: number; depth: number } | null = null;
    const halfW = this.tileSize / 2;
    const halfH = this.tileSize / 4;

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const { px, py } = this.tileToTopCenter(x, y);
        const normalized = Math.abs(wx - px) / halfW + Math.abs(wy - py) / halfH;
        if (normalized <= 1) {
          const depth = this.getTileDepth(x, y);
          if (!best || depth >= best.depth) {
            best = { x, y, depth };
          }
        }
      }
    }

    return best ? { x: best.x, y: best.y } : null;
  }

  // ─── Rendering ───────────────────────────────────────────────────────

  private renderMap(): void {
    this.tileGraphics.clear();
    this.edgeGraphics.clear();

    // Clean up previous diamond mask graphics
    for (let mx = 0; mx < this.tileMaskGraphics.length; mx++) {
      if (this.tileMaskGraphics[mx]) {
        for (let my = 0; my < this.tileMaskGraphics[mx].length; my++) {
          if (this.tileMaskGraphics[mx][my]) {
            this.tileMaskGraphics[mx][my]!.destroy();
          }
        }
      }
    }
    this.tileMaskGraphics = [];

    for (let x = 0; x < this.width; x++) {
      this.tileMaskGraphics[x] = [];
      for (let y = 0; y < this.height; y++) {
        const tile = this.tiles[x][y];
        const { px: cx, py: cy } = this.tileToTopCenter(x, y);
        const halfW = this.tileSize / 2;
        const halfH = this.tileSize / 4;

        // Diamond top-face vertices (flat tile surface)
        const topX = cx;
        const topY = cy - halfH;
        const rightX = cx + halfW;
        const rightY = cy;
        const bottomX = cx;
        const bottomY = cy + halfH;
        const leftX = cx - halfW;
        const leftY = cy;

        if (tile.height > 0) {
          const shadowOffset = Math.max(4, this.getElevationLevelHeight() * 0.35);
          this.tileGraphics.fillStyle(0x000000, 0.18);
          this.tileGraphics.fillTriangle(topX, topY + shadowOffset, rightX, rightY + shadowOffset, bottomX, bottomY + shadowOffset);
          this.tileGraphics.fillTriangle(topX, topY + shadowOffset, leftX, leftY + shadowOffset, bottomX, bottomY + shadowOffset);
        }

        for (const wall of this.getExposedSideWalls(x, y)) {
          const { topA, topB, bottomA, bottomB } = wall.vertices;
          this.tileGraphics.fillStyle(wall.shadowColor, 0.95);
          this.tileGraphics.fillTriangle(topA.x, topA.y, topB.x, topB.y, bottomB.x, bottomB.y);
          this.tileGraphics.fillStyle(wall.color, 0.95);
          this.tileGraphics.fillTriangle(topA.x, topA.y, bottomA.x, bottomA.y, bottomB.x, bottomB.y);

          this.tileGraphics.lineStyle(1, wall.lineColor, 0.45);
          this.tileGraphics.beginPath();
          this.tileGraphics.moveTo(topA.x, topA.y);
          this.tileGraphics.lineTo(topB.x, topB.y);
          this.tileGraphics.lineTo(bottomB.x, bottomB.y);
          this.tileGraphics.lineTo(bottomA.x, bottomA.y);
          this.tileGraphics.closePath();
          this.tileGraphics.strokePath();

          for (let level = 1; level < wall.heightLevels; level++) {
            const yOffset = level * this.getElevationLevelHeight();
            this.tileGraphics.lineStyle(1, wall.lineColor, 0.3);
            this.tileGraphics.beginPath();
            this.tileGraphics.moveTo(topA.x, topA.y + yOffset);
            this.tileGraphics.lineTo(topB.x, topB.y + yOffset);
            this.tileGraphics.strokePath();
          }
        }

        // --- Draw tile sprite ---
        const spriteKey = this.ensureTerrainSprite(tile.terrain);
        if (this.tileSprites[x] && this.tileSprites[x][y]) {
          this.tileSprites[x][y]!.destroy();
        }
        const img = this.scene.add.image(cx, cy, spriteKey);
        // Scale the sprite to fit the diamond footprint
        const scaleX = this.tileSize / img.width;
        const scaleY = (this.tileSize / 2) / img.height;
        img.setScale(Math.max(scaleX, scaleY));
        img.setDepth(this.getTileDepth(x, y, 0.1));
        img.setAlpha(tile.walkable ? 1 : 0.65);

        // Apply visual overlays directly via sprite tint instead of drawing
        // colored diamonds on top (which would cover the sprite image)
        if (!tile.walkable) {
          img.setTint(0x333333);
        } else if (tile.hazardType) {
          img.setTint(0xffcc66);
        } else if (tile.objectiveId) {
          img.setTint(0xe0c0ff);
        }
        this.tileSprites[x][y] = img;

        // --- Diamond geometry mask: clip sprite to tile boundaries ---
        const maskGfx = this.scene.add.graphics();
        maskGfx.setDepth(-1);
        maskGfx.fillStyle(0x333333);
        maskGfx.fillTriangle(cx, cy - halfH, cx + halfW, cy, cx, cy + halfH);
        maskGfx.fillTriangle(cx, cy - halfH, cx - halfW, cy, cx, cy + halfH);
        // Geometry mask creation (Phaser runtime only; guarded for test mocks)
        if (typeof maskGfx.createGeometryMask === 'function') {
          const geomMask = maskGfx.createGeometryMask();
          if (typeof img.setMask === 'function') {
            img.setMask(geomMask);
          }
        }
        this.tileMaskGraphics[x][y] = maskGfx;

        // --- Diamond outline ---
        this.edgeGraphics.lineStyle(2, 0xffffff, tile.height > 0 ? 0.2 : 0.1);
        this.edgeGraphics.beginPath();
        this.edgeGraphics.moveTo(topX, topY);
        this.edgeGraphics.lineTo(rightX, rightY);
        this.edgeGraphics.lineTo(bottomX, bottomY);
        this.edgeGraphics.lineTo(leftX, leftY);
        this.edgeGraphics.closePath();
        this.edgeGraphics.strokePath();
        this.edgeGraphics.lineStyle(1, 0x000000, 0.3);
        this.edgeGraphics.beginPath();
        this.edgeGraphics.moveTo(topX, topY);
        this.edgeGraphics.lineTo(rightX, rightY);
        this.edgeGraphics.lineTo(bottomX, bottomY);
        this.edgeGraphics.lineTo(leftX, leftY);
        this.edgeGraphics.closePath();
        this.edgeGraphics.strokePath();
      }
    }
  }

  setLayout(tileSize: number, viewport: GridMapViewport): void {
    this.tileSize = tileSize;
    this.viewport = viewport;
    this.renderMap();
  }

  private getTerrainFallbackColor(terrain: string): string {
    const map: Record<string, string> = {
      grass: '#90EE90',
      dirt: '#8B7355',
      stone: '#708090',
      water: '#4a90d9',
      plain: '#7ec850',
      mountain: '#8B7355',
      urban: '#9e9e9e',
      forest: '#2e7d32',
    };
    return map[terrain] ?? '#888888';
  }

  getWorldBounds(padding: number = 0): GridMapWorldBounds {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    const halfW = this.tileSize / 2;
    const halfH = this.tileSize / 4;

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const { px, py } = this.tileToTopCenter(x, y);
        minX = Math.min(minX, px - halfW);
        maxX = Math.max(maxX, px + halfW);
        minY = Math.min(minY, py - halfH);
        maxY = Math.max(maxY, py + halfH);

        for (const wall of this.getExposedSideWalls(x, y)) {
          const vertices = Object.values(wall.vertices);
          for (const vertex of vertices) {
            minX = Math.min(minX, vertex.x);
            maxX = Math.max(maxX, vertex.x);
            minY = Math.min(minY, vertex.y);
            maxY = Math.max(maxY, vertex.y);
          }
        }
      }
    }

    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    return {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };
  }

  // ─── Public accessors ────────────────────────────────────────────────

  getTile(x: number, y: number): TileData | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.tiles[x][y];
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile !== null && tile.walkable;
  }

  getHeight(x: number, y: number): number {
    const tile = this.getTile(x, y);
    return tile ? tile.height : -1;
  }

  /**
   * Get terrain type info for a tile
   */
  getTerrainInfo(x: number, y: number) {
    const tile = this.getTile(x, y);
    if (!tile) return undefined;
    return getTerrainType(tile.terrain);
  }

  /**
   * Get move cost for a tile (defaults to 1 if terrain not found)
   */
  getMoveCost(x: number, y: number): number {
    const info = this.getTerrainInfo(x, y);
    return info?.moveCost ?? 1;
  }

  /**
   * Get cover value for a tile (defaults to 0)
   */
  getCoverValue(x: number, y: number): number {
    const info = this.getTerrainInfo(x, y);
    return info?.coverValue ?? 0;
  }

  /**
   * Check if terrain at tile blocks vision
   */
  terrainBlocksVision(x: number, y: number): boolean {
    const info = this.getTerrainInfo(x, y);
    if (info) return info.blocksVision;
    return false;
  }

  getTileWorldPosition(x: number, y: number): { x: number; y: number } {
    const { px, py } = this.tileToIso(x, y);
    return { x: px, y: py };
  }

  worldToTile(wx: number, wy: number): { x: number; y: number } | null {
    return this.isoToTile(wx, wy);
  }

  /**
   * Find all reachable tiles from a starting position within Move/Jump constraints
   */
  findReachableTiles(startX: number, startY: number, move: number, jump: number): { x: number; y: number; path: {x: number; y: number}[] }[] {
    const reachable: { x: number; y: number; path: {x: number; y: number}[] }[] = [];
    const visited = new Set<string>();
    const startTile = this.getTile(startX, startY);

    if (!startTile) return reachable;

    const queue: { x: number; y: number; remainingMove: number; path: {x: number; y: number}[] }[] = [
      { x: startX, y: startY, remainingMove: move, path: [{ x: startX, y: startY }] }
    ];

    visited.add(`${startX},${startY}`);

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentTile = this.getTile(current.x, current.y);

      if (!currentTile) continue;

      // Add to reachable (skip the starting tile)
      if (current.x !== startX || current.y !== startY) {
        reachable.push({ x: current.x, y: current.y, path: current.path });
      }

      if (current.remainingMove <= 0) continue;

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        const key = `${nx},${ny}`;

        if (visited.has(key)) continue;

        const neighbor = this.getTile(nx, ny);
        if (!neighbor || !neighbor.walkable) continue;

        const heightDiff = Math.abs(neighbor.height - currentTile.height);
        if (heightDiff > jump) continue;

        const moveCost = this.getMoveCost(nx, ny);
        if (current.remainingMove < moveCost) continue;

        visited.add(key);
        queue.push({
          x: nx,
          y: ny,
          remainingMove: current.remainingMove - moveCost,
          path: [...current.path, { x: nx, y: ny }]
        });
      }
    }

    return reachable;
  }

  /**
   * Find path between two points using A* with height constraints
   */
  findPath(startX: number, startY: number, endX: number, endY: number, jump: number): { x: number; y: number }[] | null {
    const startTile = this.getTile(startX, startY);
    const endTile = this.getTile(endX, endY);

    if (!startTile || !endTile || !endTile.walkable) return null;

    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();

    const startNode: PathNode = {
      x: startX,
      y: startY,
      g: 0,
      h: Math.abs(endX - startX) + Math.abs(endY - startY),
      f: 0,
      heightDiff: 0,
    };
    startNode.f = startNode.g + startNode.h;

    openSet.push(startNode);

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    while (openSet.length > 0) {
      // Get node with lowest f score
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i;
        }
      }

      const current = openSet[currentIndex];

      if (current.x === endX && current.y === endY) {
        // Reconstruct path
        const path: { x: number; y: number }[] = [];
        let node: PathNode | undefined = current;
        while (node) {
          path.unshift({ x: node.x, y: node.y });
          node = node.parent;
        }
        return path;
      }

      openSet.splice(currentIndex, 1);
      closedSet.add(`${current.x},${current.y}`);

      const currentTile = this.getTile(current.x, current.y);
      if (!currentTile) continue;

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        const key = `${nx},${ny}`;

        if (closedSet.has(key)) continue;

        const neighbor = this.getTile(nx, ny);
        if (!neighbor || !neighbor.walkable) continue;

        const heightDiff = Math.abs(neighbor.height - currentTile.height);
        if (heightDiff > jump) continue;

        const gScore = current.g + 1 + heightDiff * 0.5;
        const hScore = Math.abs(endX - nx) + Math.abs(endY - ny);

        const existingNode = openSet.find(n => n.x === nx && n.y === ny);
        if (existingNode) {
          if (gScore < existingNode.g) {
            existingNode.g = gScore;
            existingNode.f = gScore + existingNode.h;
            existingNode.parent = current;
            existingNode.heightDiff = heightDiff;
          }
        } else {
          const newNode: PathNode = {
            x: nx,
            y: ny,
            g: gScore,
            h: hScore,
            f: gScore + hScore,
            parent: current,
            heightDiff,
          };
          openSet.push(newNode);
        }
      }
    }

    return null;
  }

  /**
   * Check line of sight between two tiles
   */
  hasLineOfSight(fromX: number, fromY: number, toX: number, toY: number): boolean {
    const fromTile = this.getTile(fromX, fromY);
    const toTile = this.getTile(toX, toY);

    if (!fromTile || !toTile) return false;

    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);
    const sx = fromX < toX ? 1 : -1;
    const sy = fromY < toY ? 1 : -1;
    let err = dx - dy;

    let x = fromX;
    let y = fromY;

    while (x !== toX || y !== toY) {
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }

      if (x === toX && y === toY) break;

      const tile = this.getTile(x, y);
      if (!tile) {
        return false;
      }
      if (tile.terrainFlags.includes('obstacle') || this.terrainBlocksVision(x, y)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Highlight tiles for UI feedback with diamond shapes
   */
  highlightTiles(tiles: HighlightTile[]): void {
    this.highlightGraphics.clear();

    for (const tile of tiles) {
      const { px: cx, py: cy } = this.tileToIso(tile.x, tile.y);
      const color = tile.color ?? 0x00ff00;
      const alpha = tile.alpha ?? 0.3;
      const halfW = this.tileSize / 2;
      const halfH = this.tileSize / 4;
      const pad = 2;

      // Diamond vertices with padding
      const topX = cx;
      const topY = cy - halfH + pad;
      const rightX = cx + halfW - pad;
      const rightY = cy;
      const bottomX = cx;
      const bottomY = cy + halfH - pad;
      const leftX = cx - halfW + pad;
      const leftY = cy;

      // Fill diamond
      this.highlightGraphics.fillStyle(color, alpha);
      this.highlightGraphics.fillTriangle(topX, topY, rightX, rightY, bottomX, bottomY);
      this.highlightGraphics.fillTriangle(topX, topY, leftX, leftY, bottomX, bottomY);

      // Outline diamond
      this.highlightGraphics.lineStyle(2, color, Math.min(1, alpha + 0.3));
      this.highlightGraphics.beginPath();
      this.highlightGraphics.moveTo(topX, topY);
      this.highlightGraphics.lineTo(rightX, rightY);
      this.highlightGraphics.lineTo(bottomX, bottomY);
      this.highlightGraphics.lineTo(leftX, leftY);
      this.highlightGraphics.closePath();
      this.highlightGraphics.strokePath();
    }
  }

  clearHighlights(): void {
    this.highlightGraphics.clear();
  }

  /**
   * Draw a path preview with dots and endpoint marker
   */
  drawPathPreview(path: { x: number; y: number }[], endColor: number = 0xffd166): void {
    this.pathGraphics.clear();
    if (path.length === 0) return;

    for (let i = 0; i < path.length; i++) {
      const worldPos = this.getTileWorldPosition(path[i].x, path[i].y);
      const isEnd = i === path.length - 1;
      const radius = isEnd ? 8 : 4;
      const color = isEnd ? endColor : 0xffffff;
      const alpha = isEnd ? 0.9 : 0.6;

      this.pathGraphics.fillStyle(color, alpha);
      this.pathGraphics.fillCircle(worldPos.x, worldPos.y, radius);

      if (isEnd) {
        // Draw a ring around the endpoint for emphasis
        this.pathGraphics.lineStyle(2, endColor, 0.8);
        this.pathGraphics.strokeCircle(worldPos.x, worldPos.y, 12);
      }
    }

    // Connect dots with faint lines
    if (path.length > 1) {
      this.pathGraphics.lineStyle(2, 0xffffff, 0.35);
      this.pathGraphics.beginPath();
      const start = this.getTileWorldPosition(path[0].x, path[0].y);
      this.pathGraphics.moveTo(start.x, start.y);
      for (let i = 1; i < path.length; i++) {
        const wp = this.getTileWorldPosition(path[i].x, path[i].y);
        this.pathGraphics.lineTo(wp.x, wp.y);
      }
      this.pathGraphics.strokePath();
    }
  }

  clearPathPreview(): void {
    this.pathGraphics.clear();
  }

  /**
   * Draw mission markers on tiles (objective, extraction, boss, relic)
   */
  drawMissionMarkers(tiles: { x: number; y: number; label: string; color: number }[]): void {
    this.clearMissionMarkers();

    for (const tile of tiles) {
      const worldPos = this.getTileWorldPosition(tile.x, tile.y);

      // Marker background diamond
      this.markerGraphics.fillStyle(tile.color, 0.85);
      this.markerGraphics.fillTriangle(
        worldPos.x, worldPos.y - 14,
        worldPos.x + 10, worldPos.y,
        worldPos.x - 10, worldPos.y
      );
      this.markerGraphics.fillTriangle(
        worldPos.x, worldPos.y + 14,
        worldPos.x + 10, worldPos.y,
        worldPos.x - 10, worldPos.y
      );

      // Label above marker
      const text = this.scene.add.text(worldPos.x, worldPos.y - 28, tile.label, {
        color: '#ffffff',
        fontFamily: 'monospace',
        fontSize: '11px',
        backgroundColor: '#000000aa',
        padding: { x: 3, y: 1 },
      }).setOrigin(0.5).setDepth(9);

      this.markerTexts.push(text);
    }
  }

  clearMissionMarkers(): void {
    this.markerGraphics.clear();
    for (const text of this.markerTexts) {
      text.destroy();
    }
    this.markerTexts = [];
  }

  /**
   * Set pressure overlay based on stage (0 = none, 1-4 = warning, 5 = collapse)
   */
  setPressureOverlay(stage: number): void {
    this.pressureGraphics.clear();
    if (stage <= 0) return;

    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    // Color ramp: yellow -> orange -> red -> deep red -> purple
    const colors = [0xffd166, 0xf4a261, 0xe63946, 0xd00000, 0x7209b7];
    const color = colors[Math.min(stage - 1, colors.length - 1)];
    const alpha = Math.min(0.08 + stage * 0.04, 0.28);

    // Vignette-style overlay at edges
    this.pressureGraphics.fillStyle(color, alpha);
    this.pressureGraphics.fillRect(0, 0, w, h);

    // Clear center to create vignette
    const clearMargin = Math.max(40, 120 - stage * 15);
    this.pressureGraphics.fillStyle(0x000000, 0);
    this.pressureGraphics.fillRect(clearMargin, clearMargin, w - clearMargin * 2, h - clearMargin * 2);

    // Stage text at top center
    const labels = ['', '[环境警告]', '[环境恶化]', '[区域危急]', '[区域崩溃]'];
    const label = labels[Math.min(stage, labels.length - 1)];
    if (label) {
      const text = this.scene.add.text(w / 2, 6, label, {
        color: '#ffffff',
        fontFamily: 'monospace',
        fontSize: '13px',
        backgroundColor: color !== undefined ? `#${color.toString(16).padStart(6, '0')}cc` : '#000000cc',
        padding: { x: 8, y: 3 },
      }).setOrigin(0.5, 0).setDepth(9);
      this.markerTexts.push(text);
    }
  }

  clearPressureOverlay(): void {
    this.pressureGraphics.clear();
  }

  /**
   * Get all objective tiles currently on the map
   */
  getObjectiveTiles(): TileData[] {
    const results: TileData[] = [];
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const tile = this.tiles[x][y];
        if (tile.objectiveId) {
          results.push(tile);
        }
      }
    }
    return results;
  }

  /**
   * Get all hazard tiles currently on the map
   */
  getHazardTiles(): TileData[] {
    const results: TileData[] = [];
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const tile = this.tiles[x][y];
        if (tile.hazardType) {
          results.push(tile);
        }
      }
    }
    return results;
  }
}
