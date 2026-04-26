import { Scene, GameObjects } from 'phaser';
import {
  type RiftMap,
  type RiftRoom,
  type RoomType,
  generateRiftMap,
  getAvailableRooms,
  enterRoom,
} from '../core/RiftMap';

const ROOM_COLORS: Record<RoomType, number> = {
  battle: 0xef4444,
  elite: 0xa855f7,
  shop: 0x3b82f6,
  event: 0xeab308,
  treasure: 0xf59e0b,
};

interface RoomVisual {
  room: RiftRoom;
  circle: GameObjects.Arc;
  border: GameObjects.Arc;
  label: GameObjects.Text;
}

export class RiftMapScene extends Scene {
  private riftMap!: RiftMap;
  private roomVisuals: RoomVisual[] = [];
  private connectionLines: GameObjects.Line[] = [];

  constructor() {
    super({ key: 'RiftMapScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0f172a');

    // Get or generate rift map
    let map = this.registry.get('riftMap') as RiftMap | undefined;
    if (!map) {
      map = generateRiftMap();
      this.registry.set('riftMap', map);
    }
    this.riftMap = map;

    this.drawMap();

    // Redraw on resize
    this.scale.on('resize', this.onResize, this);
  }

  private onResize(): void {
    this.cameras.main.setViewport(0, 0, this.scale.width, this.scale.height);
    this.drawMap();
  }

  private clearMap(): void {
    for (const visual of this.roomVisuals) {
      visual.circle.destroy();
      visual.border.destroy();
      visual.label.destroy();
    }
    this.roomVisuals = [];

    for (const line of this.connectionLines) {
      line.destroy();
    }
    this.connectionLines = [];
  }

  private drawMap(): void {
    this.clearMap();

    const w = this.scale.width;
    const h = this.scale.height;
    const isPortrait = h > w;

    const padding = isPortrait ? w * 0.12 : h * 0.12;
    const maxLayer = Math.max(...this.riftMap.rooms.map((r) => r.layer));

    // Compute layout positions
    const layerCount = maxLayer + 1;
    const roomsByLayer = new Map<number, RiftRoom[]>();
    for (const room of this.riftMap.rooms) {
      const list = roomsByLayer.get(room.layer) ?? [];
      list.push(room);
      roomsByLayer.set(room.layer, list);
    }

    const availableRooms = getAvailableRooms(this.riftMap);
    const availableIds = new Set(availableRooms.map((r) => r.id));

    const roomPositions = new Map<string, { x: number; y: number }>();

    if (isPortrait) {
      // Vertical layout: layers go top to bottom
      const usableHeight = h - padding * 2;
      const layerSpacing = layerCount > 1 ? usableHeight / (layerCount - 1) : usableHeight / 2;
      const startY = padding;

      for (let layer = 0; layer < layerCount; layer++) {
        const layerRooms = roomsByLayer.get(layer) ?? [];
        const roomCount = layerRooms.length;
        const usableWidth = w - padding * 2;
        const roomSpacing = roomCount > 1 ? usableWidth / (roomCount - 1) : 0;
        const startX = roomCount > 1 ? padding : w / 2;

        for (let i = 0; i < roomCount; i++) {
          const x = roomCount > 1 ? startX + i * roomSpacing : startX;
          const y = startY + layer * layerSpacing;
          roomPositions.set(layerRooms[i].id, { x, y });
        }
      }
    } else {
      // Horizontal layout: layers go left to right
      const usableWidth = w - padding * 2;
      const layerSpacing = layerCount > 1 ? usableWidth / (layerCount - 1) : usableWidth / 2;
      const startX = padding;

      for (let layer = 0; layer < layerCount; layer++) {
        const layerRooms = roomsByLayer.get(layer) ?? [];
        const roomCount = layerRooms.length;
        const usableHeight = h - padding * 2;
        const roomSpacing = roomCount > 1 ? usableHeight / (roomCount - 1) : 0;
        const startY = roomCount > 1 ? padding : h / 2;

        for (let i = 0; i < roomCount; i++) {
          const x = startX + layer * layerSpacing;
          const y = roomCount > 1 ? startY + i * roomSpacing : startY;
          roomPositions.set(layerRooms[i].id, { x, y });
        }
      }
    }

    // Draw connections first (behind rooms)
    for (const room of this.riftMap.rooms) {
      const from = roomPositions.get(room.id);
      if (!from) continue;
      for (const targetId of room.connections) {
        const to = roomPositions.get(targetId);
        if (!to) continue;
        const line = this.add.line(0, 0, from.x, from.y, to.x, to.y, 0x475569, 0.6);
        line.setOrigin(0, 0);
        this.connectionLines.push(line);
      }
    }

    // Draw rooms
    const baseRadius = isPortrait ? Math.min(w, h) * 0.035 : Math.min(w, h) * 0.03;

    for (const room of this.riftMap.rooms) {
      const pos = roomPositions.get(room.id);
      if (!pos) continue;

      const isAvailable = availableIds.has(room.id);
      const isVisited = room.visited;
      const isCurrent = this.riftMap.currentRoomId === room.id;

      const radius = baseRadius;
      const color = ROOM_COLORS[room.type];

      // Border (highlight available rooms)
      const borderColor = isAvailable ? 0xffffff : 0x1e293b;
      const borderWidth = isAvailable ? 3 : 2;
      const borderAlpha = isAvailable ? 0.9 : 0.5;

      const border = this.add
        .arc(pos.x, pos.y, radius + borderWidth, 0, 360, false, borderColor, borderAlpha)
        .setClosePath(true);

      // Main circle
      const circleAlpha = isVisited ? 0.6 : 1.0;
      const circle = this.add
        .arc(pos.x, pos.y, radius, 0, 360, false, color, circleAlpha)
        .setClosePath(true)
        .setInteractive({ useHandCursor: isAvailable });

      if (isCurrent) {
        // Pulse indicator for current room
        this.tweens.add({
          targets: border,
          scaleX: 1.15,
          scaleY: 1.15,
          alpha: 0.4,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }

      // Label
      const labelText = this.getRoomLabel(room.type);
      const label = this.add.text(pos.x, pos.y + radius + 14, labelText, {
        color: isAvailable ? '#f8fafc' : '#94a3b8',
        fontFamily: 'monospace',
        fontSize: isPortrait ? '11px' : '12px',
      }).setOrigin(0.5);

      if (isAvailable) {
        circle.on('pointerdown', () => this.handleRoomClick(room));
      }

      this.roomVisuals.push({ room, circle, border, label });
    }

    // Title
    this.add.text(w / 2, isPortrait ? padding * 0.5 : padding * 0.4, 'RIFT MAP', {
      color: '#f8fafc',
      fontFamily: 'monospace',
      fontSize: isPortrait ? '20px' : '24px',
    }).setOrigin(0.5);
  }

  private getRoomLabel(type: RoomType): string {
    switch (type) {
      case 'battle':
        return 'Battle';
      case 'elite':
        return 'Elite';
      case 'shop':
        return 'Shop';
      case 'event':
        return 'Event';
      case 'treasure':
        return 'Treasure';
      default:
        return 'Unknown';
    }
  }

  private handleRoomClick(room: RiftRoom): void {
    const updatedMap = enterRoom(this.riftMap, room.id);
    this.riftMap = updatedMap;
    this.registry.set('riftMap', updatedMap);

    // Transition to appropriate scene
    let targetScene: string;
    switch (room.type) {
      case 'battle':
      case 'elite':
        targetScene = 'BattleScene';
        break;
      case 'treasure':
        targetScene = 'LootScene';
        break;
      default:
        targetScene = 'BattleScene';
        break;
    }

    this.scene.start(targetScene);
  }

  shutdown(): void {
    this.scale.off('resize', this.onResize, this);
  }
}
