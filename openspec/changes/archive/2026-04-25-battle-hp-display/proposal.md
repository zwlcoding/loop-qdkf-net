# Proposal: Battle HP Display System

## Problem
战斗中没有血条显示，玩家无法直观了解敌我单位的生命状态，攻击反馈感为零，无法判断击杀时机。

## Solution
为每个战斗单位添加头顶血条 UI，实时显示当前 HP / 最大 HP，伤害时动态减少，死亡时归零并移除。

## Scope
- 血条 UI 组件（渲染层）
- HP 变化同步（数据→UI）
- 死亡判定触发移除动画
- 手机端适配

## Out of Scope
 状态效果图标

## Success Criteria
1. 每个单位头顶显示血条，清晰可见
2. 伤害结算后血条实时更新
3. HP 归零时单位移除
4. 手机竖屏下不遮挡操作区域
