import { Scene } from "phaser";
import { MapManager } from "../core/MapManager";
import type { MapLayout, TileData } from "../data/TerrainTypes";
import { getTerrainType } from "../data/TerrainTypes";

const SPAWN_COLORS: Record<string, number> = {
  player: 0x3b82f6,
  enemy: 0xef4444,
  neutral: 0xa855f7,
};

export class MapPreviewScene extends Scene {
  private mapManager = new MapManager();

  constructor() {
    super({ key: "MapPreview" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0f172a");

    const selectedMap: MapLayout | undefined = this.registry.get("selectedMap");
    if (!selectedMap) {
      this.showErrorAndReturn();
      return;
    }

    const mapLayout = this.mapManager.getMapLayout(selectedMap.id) ?? selectedMap;

    const isPortrait = this.scale.height > this.scale.width;
    const titleSize = isPortrait ? "22px" : "28px";
    const btnWidth = isPortrait ? this.scale.width - 48 : 180;

    // Title
    this.add
      .text(this.scale.width / 2, isPortrait ? 36 : 48, mapLayout.name, {
        color: "#f8fafc",
        fontFamily: "monospace",
        fontSize: titleSize,
        align: "center",
      })
      .setOrigin(0.5);

    // Grid preview
    const gridContainer = this.createGridPreview(mapLayout, isPortrait);
    gridContainer.setPosition(this.scale.width / 2, isPortrait ? 180 : 220);

    // Legend
    const legendY = isPortrait
      ? 180 + gridContainer.height + 32
      : 220 + gridContainer.height + 32;
    this.createLegend(mapLayout, legendY, isPortrait);

    // Buttons
    const btnY = this.scale.height - (isPortrait ? 80 : 96);
    if (isPortrait) {
      this.createButton(this.scale.width / 2, btnY - 40, "返回", () => {
        this.scene.start("MissionSelect");
      }, btnWidth);
      this.createButton(this.scale.width / 2, btnY + 28, "确认", () => {
        this.scene.start("SetupScene");
      }, btnWidth);
    } else {
      this.createButton(this.scale.width / 2 - 120, btnY, "返回", () => {
        this.scene.start("MissionSelect");
      }, btnWidth);
      this.createButton(this.scale.width / 2 + 120, btnY, "确认", () => {
        this.scene.start("SetupScene");
      }, btnWidth);
    }
  }

  private showErrorAndReturn(): void {
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, "未选择地图，请返回重试", {
        color: "#ef4444",
        fontFamily: "monospace",
        fontSize: "18px",
        align: "center",
      })
      .setOrigin(0.5);

    this.time.delayedCall(1500, () => {
      this.scene.start("MissionSelect");
    });
  }

  private createGridPreview(map: MapLayout, isPortrait: boolean): Phaser.GameObjects.Container {
    const maxGridWidth = isPortrait ? this.scale.width - 48 : Math.min(480, this.scale.width - 64);
    const maxGridHeight = isPortrait ? 200 : 280;

    const cols = map.width;
    const rows = map.height;

    const cellSizeW = Math.floor(maxGridWidth / cols);
    const cellSizeH = Math.floor(maxGridHeight / rows);
    const cellSize = Math.min(cellSizeW, cellSizeH, 24);

    const gridW = cols * cellSize;
    const gridH = rows * cellSize;

    const container = this.add.container(0, 0);

    // Background
    const bg = this.add.rectangle(0, 0, gridW + 4, gridH + 4, 0x1e293b, 0.6).setOrigin(0.5);
    container.add(bg);

    const startX = -gridW / 2;
    const startY = -gridH / 2;

    // Terrain tiles
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tile: TileData | undefined = map.tiles[y]?.[x];
        const terrain = tile ? getTerrainType(tile.terrain) : undefined;
        const color = terrain ? parseInt(terrain.color.replace("#", ""), 16) : 0x334155;

        const rect = this.add.rectangle(
          startX + x * cellSize + cellSize / 2,
          startY + y * cellSize + cellSize / 2,
          cellSize - 1,
          cellSize - 1,
          color,
          0.95
        );
        container.add(rect);
      }
    }

    // Spawn points
    for (const spawn of map.spawnPoints) {
      const color = SPAWN_COLORS[spawn.team] ?? 0xfacc15;
      const cx = startX + spawn.x * cellSize + cellSize / 2;
      const cy = startY + spawn.y * cellSize + cellSize / 2;
      const radius = Math.max(3, cellSize / 3);

      const circle = this.add.circle(cx, cy, radius, color, 0.95);
      container.add(circle);

      // Border for visibility
      const border = this.add.circle(cx, cy, radius, 0xffffff, 0.3);
      border.setStrokeStyle(1, 0xffffff, 0.6);
      container.add(border);
    }

    container.setSize(gridW + 4, gridH + 4);
    return container;
  }

  private createLegend(map: MapLayout, y: number, isPortrait: boolean): void {
    const usedTerrainIds = new Set<string>();
    for (const row of map.tiles) {
      for (const tile of row) {
        usedTerrainIds.add(tile.terrain);
      }
    }

    const terrains = Array.from(usedTerrainIds)
      .map((id) => getTerrainType(id))
      .filter((t): t is NonNullable<typeof t> => t !== undefined);

    if (terrains.length === 0) return;

    const startX = isPortrait ? 24 : (this.scale.width - Math.min(480, this.scale.width - 64)) / 2;
    const maxWidth = isPortrait ? this.scale.width - 48 : Math.min(480, this.scale.width - 64);
    const itemGap = isPortrait ? 8 : 12;
    const itemHeight = isPortrait ? 20 : 24;

    let currentX = startX;
    let currentY = y;

    for (const terrain of terrains) {
      const color = parseInt(terrain.color.replace("#", ""), 16);
      const textWidth = terrain.name.length * (isPortrait ? 13 : 15) + 24;

      if (currentX + textWidth > startX + maxWidth) {
        currentX = startX;
        currentY += itemHeight + itemGap;
      }

      this.add.rectangle(currentX + 8, currentY + itemHeight / 2, 14, 14, color, 0.95);
      this.add.text(currentX + 22, currentY, `${terrain.name}`, {
        color: "#e2e8f0",
        fontFamily: "monospace",
        fontSize: isPortrait ? "12px" : "14px",
      });

      currentX += textWidth + itemGap;
    }

    // Spawn point legend
    currentY += itemHeight + itemGap + 4;
    currentX = startX;

    const spawnTeams = new Set(map.spawnPoints.map((s) => s.team));
    for (const team of spawnTeams) {
      const label = team === "player" ? "玩家出生点" : team === "enemy" ? "敌人出生点" : "中立出生点";
      const color = SPAWN_COLORS[team] ?? 0xfacc15;
      const textWidth = label.length * (isPortrait ? 13 : 15) + 28;

      if (currentX + textWidth > startX + maxWidth) {
        currentX = startX;
        currentY += itemHeight + itemGap;
      }

      const circle = this.add.circle(currentX + 10, currentY + itemHeight / 2, 6, color, 0.95);
      circle.setStrokeStyle(1, 0xffffff, 0.6);
      this.add.text(currentX + 24, currentY, label, {
        color: "#e2e8f0",
        fontFamily: "monospace",
        fontSize: isPortrait ? "12px" : "14px",
      });

      currentX += textWidth + itemGap;
    }
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    width = 180
  ): void {
    const background = this.add
      .rectangle(x, y, width, 48, 0x1d4ed8, 0.92)
      .setStrokeStyle(2, 0xbfdbfe, 0.85)
      .setInteractive({ useHandCursor: true });

    const text = this.add
      .text(x, y, label, {
        color: "#ffffff",
        fontFamily: "monospace",
        fontSize: "16px",
      })
      .setOrigin(0.5);

    background.on("pointerdown", onClick);
    text.setInteractive({ useHandCursor: true }).on("pointerdown", onClick);
  }
}
