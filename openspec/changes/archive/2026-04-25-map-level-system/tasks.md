# Tasks: Map Level System

## 1. 数据模型定义

- [x] 1.1 定义 TerrainType 接口（id, name, moveCost, coverValue, blocksVision, color）
- [x] 1.2 定义 MapLayout 接口（id, name, width, height, tiles, spawnPoints, objectives）
- [x] 1.3 定义 TileData 接口（terrain, elevation, destructible）
- [x] 1.4 定义 SpawnPoint 接口（x, y, team）
- [x] 1.5 创建初始地形类型数据（平原、山地、城市、森林、水域）
- [x] 1.6 编写数据模型的单元测试

## 2. 地图管理器

- [x] 2.1 创建 MapManager 类
- [x] 2.2 实现 getMapLayout 方法（加载地图数据）
- [x] 2.3 实现 getTerrainType 方法（获取地形属性）
- [x] 2.4 实现 getAvailableMaps 方法（获取可用地图列表）
- [x] 2.5 实现 unlockMap 方法（解锁新地图）
- [x] 2.6 编写 MapManager 的单元测试

## 3. 地图布局设计

- [x] 3.1 设计 4 个预设地图布局（每个 10x10 到 15x15）
- [x] 3.2 为每个地图配置生成点和目标点
- [x] 3.3 添加随机装饰物生成逻辑
- [x] 3.4 配置地图解锁条件
- [x] 3.5 编写地图数据验证测试

## 4. 地形效果实现

- [x] 4.1 扩展 GridMap 以支持新地形类型
- [x] 4.2 修改移动计算以考虑地形消耗
- [x] 4.3 修改命中计算以考虑掩体值
- [x] 4.4 实现视野遮挡逻辑
- [x] 4.5 编写地形效果的单元测试

## 5. 地图渲染

- [x] 5.1 扩展 MapRenderer 以渲染新地形
- [x] 5.2 为每种地形添加独特视觉样式
- [x] 5.3 实现地形高亮（移动范围、攻击范围）
- [x] 5.4 实现视线显示（攻击路径）
- [x] 5.5 优化手机端渲染性能

## 6. 地图预览界面

- [x] 6.1 创建 MapPreviewScene
- [x] 6.2 显示地图缩略图和地形分布
- [x] 6.3 显示敌人配置和推荐难度
- [x] 6.4 实现地图选择后跳转到任务配置
- [x] 6.5 手机端 UI 适配

## 7. 集成与验证

- [x] 7.1 在 MissionSelectScene 中集成地图选择
- [x] 7.2 在 BattleScene 中加载新地图布局
- [x] 7.3 验证地形效果在战斗中正确生效
- [x] 7.4 运行 `cd frontend && npm test`
- [x] 7.5 运行 `cd frontend && npm run build`
- [x] 7.6 手机预览验证：选择地图 → 查看预览 → 战斗中地形效果
