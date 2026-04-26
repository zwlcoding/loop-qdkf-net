# Design: Map Level System

## Architecture

### Data Model
```typescript
// 地形类型
interface TerrainType {
  id: string
  name: string
  moveCost: number      // 移动消耗（1=正常，2=困难，0=不可通行）
  coverValue: number    // 掩体值（0-100，影响命中率）
  blocksVision: boolean // 是否遮挡视野
  color: string         // 渲染颜色
  icon: string          // 地形图标
}

// 地图布局
interface MapLayout {
  id: string
  name: string
  width: number
  height: number
  tiles: TileData[][]
  spawnPoints: SpawnPoint[]
  objectives: Objective[]
  unlockCondition?: UnlockCondition
}

// 格子数据
interface TileData {
  terrain: string       // terrainType id
  elevation: number     // 高度（0-3）
  destructible: boolean // 是否可破坏
}

// 生成点
interface SpawnPoint {
  x: number
  y: number
  team: 'player' | 'enemy' | 'neutral'
}
```

### 地形类型设计
1. **平原**：移动消耗 1，无掩体，不遮挡视野
2. **山地**：移动消耗 2，中等掩体，遮挡视野
3. **城市**：移动消耗 1，高掩体，遮挡视野
4. **森林**：移动消耗 1，中等掩体，部分遮挡视野
5. **水域**：移动消耗 3（或不可通行），无掩体，不遮挡视野

### 地图生成策略
- **预设布局**：核心地图使用手工设计
- **随机元素**：在预设基础上随机放置装饰物和可破坏物
- **难度缩放**：根据关卡难度调整敌人数量和位置

### 地形效果实现
- **移动消耗**：在路径计算时累加地形消耗
- **掩体值**：在命中计算时作为减益因子
- **视野遮挡**：在视线计算时作为阻挡条件

## Component Design

### MapManager
- getMapLayout(mapId: string): MapLayout
- getTerrainType(terrainId: string): TerrainType
- getAvailableMaps(): MapLayout[]
- unlockMap(mapId: string): void

### MapRenderer
- renderMap(layout: MapLayout): void
- renderTile(x: number, y: number, tile: TileData): void
- highlightReachableTiles(tiles: TileData[]): void
- showLineOf sight(from: Point, to: Point): void

### MapPreviewScene
- 显示地图缩略图
- 显示地形分布
- 显示敌人配置
- 显示推荐等级/难度

## Integration Points
- `GridMap.ts`: 扩展以支持新地形类型和效果
- `BattleOccupancy.ts`: 移动计算时考虑地形消耗
- `CombatResolver.ts`: 命中计算时考虑掩体值
- `BattleScene.ts`: 渲染新地形效果
- `MissionSelectScene.ts`: 显示地图预览

## Mobile Considerations
- 地图缩放：支持捏合缩放查看细节
- 地形信息：长按格子显示地形详情
- 小地图：右上角显示全局小地图
