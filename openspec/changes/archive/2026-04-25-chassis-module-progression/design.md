# Design: Chassis Module Progression

## Architecture

### Data Model
```typescript
// 底盘类型
interface ChassisType {
  id: string
  name: string
  description: string
  baseStats: {
    hp: number
    move: number
    jump: number
    attack: number
    defense: number
  }
  moduleSlots: ModuleSlot[]
  unlockCondition?: UnlockCondition
}

// 模块槽位
interface ModuleSlot {
  id: string
  type: 'weapon' | 'armor' | 'skill' | 'utility'
  name: string
  description: string
  effects: ModuleEffect[]
}

// 模块效果
interface ModuleEffect {
  type: 'stat_bonus' | 'ability' | 'passive'
  target: string
  value: number | string
}

// Loadout 配置
interface Loadout {
  unitId: string
  chassisId: string
  equippedModules: {
    [slotId: string]: string  // moduleId
  }
}
```

### 底盘类型设计
1. **轻型底盘**：高移动、低防御、3 模块槽
2. **重型底盘**：低移动、高防御、4 模块槽
3. **均衡底盘**：中等属性、3 模块槽
4. **特殊底盘**：解锁获得，独特属性组合

### 模块分类
- **武器模块**：增加攻击力、特殊攻击效果
- **护甲模块**：增加防御力、特殊抗性
- **技能模块**：解锁主动技能、被动技能
- **工具模块**：增加移动、跳跃、视野等

### 效果叠加规则
- 同类型效果取最高值（不叠加）
- 不同类型效果叠加
- 特殊效果按模块描述处理

## Component Design

### LoadoutScene
- 显示队伍中所有单位
- 选择单位后显示底盘选择界面
- 底盘选择后显示模块装备界面
- 保存 Loadout 配置

### ChassisSelector
- 显示可用底盘列表
- 显示底盘属性和模块槽位
- 锁定未解锁的底盘

### ModuleEquipper
- 显示当前底盘的模块槽位
- 每个槽位显示可装备的模块列表
- 装备模块后显示属性变化预览

### ChassisModuleManager
- applyLoadout(unit: Unit, loadout: Loadout): void
- getAvailableChassis(): ChassisType[]
- getAvailableModules(slotType: string): Module[]
- unlockChassis(chassisId: string): void
- unlockModule(moduleId: string): void

## Integration Points
- `Unit.ts`: 扩展属性以支持底盘/模块加成
- `BattleSetup.ts`: 集成 Loadout 配置流程
- `CombatResolver.ts`: 计算伤害时考虑模块效果
- `ExtractionManager.ts`: 奖励中包含底盘/模块解锁
- `ProgressManager.ts`: 保存解锁的底盘/模块

## Mobile Considerations
- 底盘选择：卡片式布局，横向滑动
- 模块装备：列表式布局，点击装备
- 属性预览：实时显示装备前后的属性变化
