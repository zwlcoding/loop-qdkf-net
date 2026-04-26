# Tasks: Mission Extraction Loop

## 1. 数据模型定义

- [x] 1.1 定义 Mission 接口（id, name, difficulty, rewards, unlockCondition）
- [x] 1.2 定义 RunProgress 接口（missionId, currentTurn, squadStates, collectedRewards）
- [x] 1.3 定义 Reward 接口（type, itemId, amount）
- [x] 1.4 编写数据模型的单元测试

## 2. 进度管理器

- [x] 2.1 创建 ProgressManager 类（save/load/clear/hasUnfinishedRun）
- [x] 2.2 实现 localStorage 持久化
- [x] 2.3 处理数据版本兼容（旧数据迁移）
- [x] 2.4 编写 ProgressManager 的单元测试

## 3. 提取管理器

- [x] 3.1 创建 ExtractionManager 类
- [x] 3.2 实现提取条件检查（回合数、存活单位、任务目标）
- [x] 3.3 实现提取判定逻辑（成功/失败）
- [x] 3.4 实现奖励计算（基础奖励 + 难度加成 + 存活加成）
- [x] 3.5 编写 ExtractionManager 的单元测试

## 4. 任务选择界面

- [x] 4.1 创建 MissionSelectScene
- [x] 4.2 实现任务列表显示（名称、难度、奖励预览）
- [x] 4.3 实现任务锁定/解锁逻辑
- [x] 4.4 实现任务选择后跳转到 BattleSetup
- [x] 4.5 手机端 UI 适配（大按钮、垂直排列）

## 5. 战斗集成

- [x] 5.1 在 BattleScene 中集成 ExtractionManager
- [x] 5.2 回合结束时检查提取条件
- [x] 5.3 提取条件满足时显示提取按钮
- [x] 5.4 提取按钮点击后触发提取判定
- [x] 5.5 提取成功后跳转到奖励结算

## 6. 奖励结算

- [x] 6.1 扩展 BattleResultSummary 为完整奖励结算界面
- [x] 6.2 显示获得的资源、经验、解锁物品
- [x] 6.3 结算后保存进度
- [x] 6.4 提供"返回主菜单"和"继续下一轮"选项

## 7. 启动流程

- [x] 7.1 BootScene 检查未完成运行
- [x] 7.2 有未完成运行时显示"继续"选项
- [x] 7.3 继续运行时恢复 RunProgress 并跳转到对应阶段

## 8. 验证

- [x] 8.1 运行 `cd frontend && npm test`
- [x] 8.2 运行 `cd frontend && npm run build`
- [x] 8.3 手机预览验证完整流程：选任务 → 战斗 → 提取 → 结算 → 保存
