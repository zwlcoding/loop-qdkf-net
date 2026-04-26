# Tasks: Chassis Module Progression

## 1. 数据模型定义

- [x] 1.1 定义 ChassisType 接口（id, name, baseStats, moduleSlots）
- [x] 1.2 定义 ModuleSlot 接口（id, type, name, effects）
- [x] 1.3 定义 ModuleEffect 接口（type, target, value）
- [x] 1.4 定义 Loadout 接口（unitId, chassisId, equippedModules）
- [x] 1.5 创建初始底盘类型数据（轻型、重型、均衡）
- [x] 1.6 创建初始模块数据（武器、护甲、技能、工具各 2-3 个）
- [x] 1.7 编写数据模型的单元测试

## 2. 底盘模块管理器

- [x] 2.1 创建 ChassisModuleManager 类
- [x] 2.2 实现 applyLoadout 方法（将 Loadout 应用到 Unit）
- [x] 2.3 实现属性加成计算（底盘基础 + 模块加成）
- [x] 2.4 实现效果叠加规则（同类型取最高，不同类型叠加）
- [x] 2.5 实现解锁管理（getAvailableChassis, unlockChassis, unlockModule）
- [x] 2.6 编写 ChassisModuleManager 的单元测试

## 3. Loadout 配置界面

- [x] 3.1 创建 LoadoutScene
- [x] 3.2 实现队伍单位列表显示
- [x] 3.3 实现底盘选择界面（卡片式布局，横向滑动）
- [x] 3.4 实现模块装备界面（列表式布局，点击装备）
- [x] 3.5 实现属性变化预览（装备前后对比）
- [x] 3.6 实现 Loadout 保存/加载
- [x] 3.7 手机端 UI 适配

## 4. 战斗集成

- [x] 4.1 扩展 Unit 属性以支持底盘/模块加成
- [x] 4.2 在 BattleSetup 中集成 Loadout 配置流程
- [x] 4.3 在 CombatResolver 中计算伤害时考虑模块效果
- [x] 4.4 验证底盘/模块效果在战斗中正确生效

## 5. 解锁系统

- [x] 5.1 在 ExtractionManager 奖励中添加底盘/模块解锁
- [x] 5.2 在 ProgressManager 中保存解锁的底盘/模块
- [x] 5.3 在 LoadoutScene 中显示锁定/解锁状态
- [x] 5.4 编写解锁流程的单元测试

## 6. 验证

- [x] 6.1 运行 `cd frontend && npm test`
- [x] 6.2 运行 `cd frontend && npm run build`
- [x] 6.3 手机预览验证：选择底盘 → 装备模块 → 战斗中效果生效
