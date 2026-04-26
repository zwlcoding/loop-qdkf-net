# Tasks: Battle HP Display System

## 1. Unit 数据层确认与事件扩展

- [x] 1.1 检查 Unit.ts 是否已有 hp/maxHp 字段，确认数据结构
- [x] 1.2 为 Unit 添加 onHpChanged 事件回调（HP 变化时触发）
- [x] 1.3 为 Unit 添加 onDeath 事件回调（HP 归零时触发）
- [x] 1.4 编写 Unit 事件触发的单元测试

## 2. HpBar UI 组件

- [x] 2.1 创建 HpBar 类（背景矩形 + 填充矩形 + Container）
- [x] 2.2 实现 update(currentHp, maxHp) 方法，根据比例调整填充宽度
- [x] 2.3 实现颜色策略（绿/黄/红三档）
- [x] 2.4 实现 destroy() 方法清理资源
- [x] 2.5 编写 HpBar 的单元测试（mock Phaser 对象）

## 3. BattleScene 集成

- [x] 3.1 在 BattleScene 中为每个 Unit 创建 HpBar 实例
- [x] 3.2 监听 Unit.onHpChanged 事件，调用 HpBar.update
- [x] 3.3 监听 Unit.onDeath 事件，播放淡出动画后移除
- [x] 3.4 处理单位移动时 HpBar 跟随（Container 绑定）
- [x] 3.5 确保手机端血条位置不遮挡触控区域

## 4. 死亡流程整合

- [x] 4.1 在 CombatResolver 伤害结算后触发 Unit HP 更新
- [x] 4.2 在 BattleOccupancy 移除单位时同步清理 HpBar
- [x] 4.3 验证死亡动画与单位移除的时序正确

 ## 5. 伤害数字飘字

 - [x] 5.1 创建 DamageText 类（Text 对象 + 飘动动画 + 淡出）
 - [x] 5.2 实现颜色策略（白/黄/绿/灰四档）
 - [x] 5.3 在 CombatResolver 伤害结算后生成 DamageText
 - [x] 5.4 处理多单位同时受伤时的文字重叠（随机偏移）
 - [x] 5.5 编写 DamageText 的单元测试

 ## 6. 验证

 - [x] 6.1 运行 `cd frontend && npm test`
 - [x] 6.2 运行 `cd frontend && npm run build`
 - [x] 6.3 手机预览验证血条显示、伤害飘字、死亡移除
