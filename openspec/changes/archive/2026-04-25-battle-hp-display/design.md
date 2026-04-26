# Design: Battle HP Display System

## Architecture

### Data Layer
- Unit 实体已有 `hp` 和 `maxHp` 字段（需确认）
- 添加 `onHpChanged` 事件回调，HP 变化时通知 UI

### UI Layer
- 新增 `HpBar` 组件类，负责渲染血条
- 血条跟随单位位置，使用 Phaser Container 绑定
- 血条宽度基于单位精灵宽度，高度固定

### 渲染流程
```
Unit.hp 变化 → 触发 onHpChanged → HpBar 更新宽度 → 动画过渡
Unit.hp == 0 → 触发 onDeath → 播放死亡动画 → 移除 Unit + HpBar
```

## Component Design

### HpBar 类
```typescript
class HpBar {
  private bg: Phaser.GameObjects.Rectangle    // 背景（灰色）
  private fill: Phaser.GameObjects.Rectangle  // 填充（绿色→黄色→红色）
  private container: Phaser.GameObjects.Container
  
  constructor(scene: Scene, parentUnit: Unit)
  update(currentHp: number, maxHp: number): void
  destroy(): void
}
```

### 颜色策略
- HP > 60%: 绿色 (#4ade80)
- HP 30%-60%: 黄色 (#facc15)
- HP < 30%: 红色 (#ef4444)

### 死亡处理
- HP 归零时播放淡出动画（200ms）
- 动画完成后调用 BattleOccupancy 移除单位
- 清理 HpBar 资源

## Integration Points
- `BattleScene.ts`: 创建和管理 HpBar 实例
- `Unit.ts`: 添加 HP 变化事件
- `CombatResolver.ts`: 伤害结算后触发 HP 更新
- `BattleOccupancy.ts`: 死亡移除时清理 HpBar

## Mobile Considerations
 血条宽度：单位精灵宽度的 80%
 血条高度：4px（手机端清晰但不遮挡）
 位置：单位头顶上方 8px

 ## Damage Number Component

 ### DamageText 类
 ```typescript
 class DamageText {
   private text: Phaser.GameObjects.Text
   
   constructor(scene: Scene, x: number, y: number, value: number, type: 'damage' | 'heal' | 'miss')
   play(): void  // 向上飘动 + 淡出，600ms 后销毁
   destroy(): void
 }
 ```

 ### 视觉规则
 - 普通伤害：白色，字号 14
 - 暴击/弱点：黄色加粗，字号 18
 - 治疗：绿色，字号 14
 - Miss：灰色斜体，字号 12
 - 飘动方向：正上方 30px，600ms 淡出

 ### 触发时机
 - CombatResolver 伤害结算后，根据结果生成 DamageText
 - 位置：目标单位头顶偏右（避免遮挡血条）
