## 1. 裂隙地图系统

- [x] 1.1 创建 `src/core/RiftMap.ts` 实现 DAG 地图数据结构
- [x] 1.2 实现地图生成算法（5-10层，每层2-3房间，随机类型分配）
- [x] 1.3 实现地图可视化（Phaser 图形渲染节点和连线）— RiftMapScene.ts
- [x] 1.4 实现路径选择逻辑（高亮可选房间，处理玩家点击）— RiftMapScene.ts
- [x] 1.5 实现地图状态持久化（当前层、已访问房间）— 存储在 Phaser registry

## 2. 战利品系统

- [x] 2.1 创建 `src/core/LootSystem.ts` 实现战利品生成逻辑
- [x] 2.2 扩展 `src/data/modules.json` 添加稀有度字段
- [x] 2.3 实现加权随机算法（按稀有度分布生成3个模块）— generateLoot()
- [x] 2.4 创建 `src/scenes/LootScene.ts` 实现战利品选择界面
- [x] 2.5 实现模块协同检测与显示 — detectSynergies()

## 3. 单局进度管理

- [x] 3.1 创建 `src/core/RiftRunManager.ts` 实现单局状态管理
- [x] 3.2 实现层间进度追踪（当前层、已完成房间）
- [x] 3.3 实现运行统计（击杀数、伤害、金币等）
- [x] 3.4 实现放弃运行功能（部分奖励计算）

## 4. 局间进度系统

- [x] 4.1 创建 `src/core/MetaProgression.ts` 实现永久进度管理
- [x] 4.2 实现 localStorage 持久化（金币、解锁模块、解锁底盘）
- [ ] 4.3 实现升级商店界面（购买永久升级）
- [ ] 4.4 实现解锁条件检查与通知

## 5. 场景集成

- [x] 5.1 修改 `src/scenes/BattleScene.ts` 结算后跳转到 LootScene
- [x] 5.2 修改 `src/scenes/ResultScene.ts` 对接 RunProgression
- [x] 5.3 创建 `src/scenes/RiftMapScene.ts` 实现地图界面
- [x] 5.4 实现完整流程：主菜单→裂隙地图→战斗→战利品→下一层

## 6. 测试与验证

- [x] 6.1 为 RiftMap 添加单元测试（生成、路径查找）— 15 tests
- [x] 6.2 为 LootSystem 添加单元测试（权重随机、协同检测）— 6 tests
- [x] 6.3 为 RiftRunManager 添加单元测试（状态管理、统计）— 11 tests
- [x] 6.4 为 MetaProgression 添加单元测试（持久化、解锁）— 10 tests
- [ ] 6.5 集成测试完整 Roguelite 循环
- [x] 6.6 构建验证（tsc + vite build）— 355 tests pass, build OK
