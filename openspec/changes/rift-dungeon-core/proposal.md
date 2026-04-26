## Why

当前游戏只有单次战斗→结算的线性流程，缺乏 Roguelite 的核心循环：随机路径选择、层层推进、战利品积累。这是游戏从"战术演示"变成"可重复游玩的地牢探索"的关键缺失。

## What Changes

- **裂隙机制**：每层战斗前展示 2-3 个随机传送门，每个传送门对应不同路径（战斗/精英/商店/事件/宝藏），玩家选择一条前进
- **Roguelite 轮次结构**：战斗→奖励选择→升级/强化→下一层，支持 5-10 层的单局流程
- **战利品/装备系统**：战斗后从 3 个随机模块中选择 1 个装备，模块有稀有度和协同效果
- **裂隙地图生成**：每局随机生成 5-10 层的裂隙地图，每层 2-3 个分支路径
- **局间进度**：单局结束后保留部分资源用于永久升级（解锁新模块/底盘）

## Capabilities

### New Capabilities
- `rift-map`: 裂隙地图生成与路径选择系统
- `loot-system`: 战利品掉落与装备选择
- `run-progression`: 单局 Roguelite 轮次流程管理
- `meta-progression`: 局间永久进度与解锁

### Modified Capabilities
- `tactical-battle-system`: 战斗结算后对接战利品选择流程

## Impact

- **新增文件**：`src/core/RiftMap.ts`, `src/core/LootSystem.ts`, `src/core/RunProgression.ts`, `src/scenes/RiftMapScene.ts`, `src/scenes/LootScene.ts`
- **修改文件**：`src/scenes/BattleScene.ts`（结算后跳转到 LootScene）, `src/scenes/ResultScene.ts`（对接 RunProgression）
- **数据文件**：`src/data/modules.json` 需要扩展稀有度字段
- **依赖**：无新增外部依赖，纯 Phaser + TypeScript
