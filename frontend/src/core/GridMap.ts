import { Scene, GameObjects } from 'phaser';

export interface TileData {
  x: number;
  y: number;
  height: number;
  walkable: boolean;
  terrain: 'grass' | 'dirt' | 'stone' | 'water';
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

export class GridMap {
  private scene: Scene;
  private tiles: TileData[][];
  private tileSize: number;
  private width: number;
  private height: number;
  private tileSprites: GameObjects.Image[][];
  private highlightGraphics: GameObjects.Graphics;
  private pathGraphics: GameObjects.Graphics;
  private markerGraphics: GameObjects.Graphics;
  private pressureGraphics: GameObjects.Graphics;
  private markerTexts: GameObjects.Text[] = [];

  constructor(scene: Scene, width: number, height: number, tileSize: number = 64) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.tiles = [];
    this.tileSprites = [];
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
      this.tileSprites[x] = [];
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
    if (noise < 0.1) return 'water';
    if (noise < 0.4) return 'dirt';
    if (noise < 0.7) return 'stone';
    return 'grass';
  }

  private getTerrainFlags(terrain: TileData['terrain']): string[] {
    const flags: Record<TileData['terrain'], string[]> = {
      grass: ['natural'],
      dirt: ['natural', 'rough'],
      stone: ['obstacle', 'rough'],
      water: ['hazard', 'impassable'],
    };
    return flags[terrain];
  }

  private renderMap(): void {
    const offsetX = (this.scene.scale.width - this.width * this.tileSize) / 2;
    const offsetY = (this.scene.scale.height - this.height * this.tileSize) / 2;

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const tile = this.tiles[x][y];
        const px = offsetX + x * this.tileSize;
        const py = offsetY + y * this.tileSize - tile.height * 16;

        const sprite = this.scene.add.image(px, py, `tile-${tile.terrain}`);
        sprite.setOrigin(0, 0);
        sprite.setDisplaySize(this.tileSize, this.tileSize);
        sprite.setAlpha(tile.walkable ? 1 : 0.5);

        if (tile.hazardType) {
          sprite.setTint(0xffb703);
        } else if (tile.objectiveId) {
          sprite.setTint(0xd8b4fe);
        }

        this.tileSprites[x][y] = sprite;
      }
    }
  }

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

  getTileWorldPosition(x: number, y: number): { x: number; y: number } {
    const offsetX = (this.scene.scale.width - this.width * this.tileSize) / 2;
    const offsetY = (this.scene.scale.height - this.height * this.tileSize) / 2;
    const tile = this.getTile(x, y);
    const height = tile ? tile.height : 0;

    return {
      x: offsetX + x * this.tileSize + this.tileSize / 2,
      y: offsetY + y * this.tileSize + this.tileSize / 2 - height * 16,
    };
  }

  worldToTile(wx: number, wy: number): { x: number; y: number } | null {
    const offsetX = (this.scene.scale.width - this.width * this.tileSize) / 2;
    const offsetY = (this.scene.scale.height - this.height * this.tileSize) / 2;

    const x = Math.floor((wx - offsetX) / this.tileSize);
    const y = Math.floor((wy - offsetY + 32) / this.tileSize);

    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return { x, y };
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

        visited.add(key);
        queue.push({
          x: nx,
          y: ny,
          remainingMove: current.remainingMove - 1,
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
      if (!tile || tile.terrainFlags.includes('obstacle')) {
        return false;
      }
    }

    return true;
  }

  /**
   * Highlight tiles for UI feedback with improved readability (fill + outline)
   */
  highlightTiles(tiles: HighlightTile[]): void {
    this.highlightGraphics.clear();

    for (const tile of tiles) {
      const worldPos = this.getTileWorldPosition(tile.x, tile.y);
      const color = tile.color ?? 0x00ff00;
      const alpha = tile.alpha ?? 0.3;
      const half = this.tileSize / 2;
      const pad = 2;

      // Fill
      this.highlightGraphics.fillStyle(color, alpha);
      this.highlightGraphics.fillRect(
        worldPos.x - half + pad,
        worldPos.y - half + pad,
        this.tileSize - pad * 2,
        this.tileSize - pad * 2
      );

      // Outline for readability
      this.highlightGraphics.lineStyle(2, color, Math.min(1, alpha + 0.3));
      this.highlightGraphics.strokeRect(
        worldPos.x - half + pad,
        worldPos.y - half + pad,
        this.tileSize - pad * 2,
        this.tileSize - pad * 2
      );
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
