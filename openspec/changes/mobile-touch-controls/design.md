## Context

当前页面在手机上已经能打开，但操作方式仍偏桌面：
- HUD 占左上大块区域，压住战场视野
- 提示文案仍围绕 `1/2/3/4/C/E/D` 这类键盘语义
- 玩家缺少大尺寸屏幕按钮去完成“移动 / 普攻 / 技能 / 道具 / 连携 / 结束回合 / 取消”
- 手机用户需要自己猜流程，不够直接

## Goals / Non-Goals

**Goals:**
- 在手机竖屏下提供大尺寸、明确、单手可点的战斗操作入口
- 让玩家不依赖硬件键盘也能完整完成一个回合
- 减少 HUD 对战场的遮挡
- 保持现有战斗规则、AI、Pages 预览不被破坏

**Non-Goals:**
- 不重做整套美术 UI
- 不改战斗核心规则
- 不改 bot/boss 行为逻辑
- 不在本 change 内做复杂手势系统（如双指缩放重构）

## Decisions

### Decision 1: Add a portrait-only on-screen action bar
- **Decision:** 在 BattleScene 中加入手机竖屏优先的底部/边缘触控按钮栏，包含移动、普攻、技能、道具、连携、结束回合、取消。
- **Why:** 这是最直接解决手机难操作的问题，避免继续依赖键盘提示。

### Decision 2: Collapse secondary HUD information on portrait
- **Decision:** 手机竖屏下把关键状态保留在顶部，日志/次级信息缩短或下沉，不再长期占据大面积战场。
- **Why:** 战棋类核心问题首先是“看得到格子、点得到格子”。

### Decision 3: Make touch flow explicit
- **Decision:** 使用更口语化的步骤提示，例如“先点单位”“点绿色格移动”“再点底部按钮选动作”“点敌人确认目标”。
- **Why:** 手机上用户不应该自己推断 PC 操作逻辑。

## Risks / Trade-offs

- 新增按钮可能继续挤压战场空间 → 用更紧凑的按钮排布，并优先减少顶部 HUD 占用
- 触控入口和键盘快捷键并存可能造成逻辑分叉 → 统一仍走现有 `setActionMode` / `endActiveTurn` / `tryResolveUnitTarget`
- 手机按钮太多会显乱 → 优先先做核心按钮可用，再决定是否折叠次级入口

## Migration Plan

1. 先为 BattleScene 加入 portrait 触控操作栏和状态提示
2. 收口 HUD / log 布局，减少遮挡
3. 增加 focused tests，锁住触控模式和移动端提示行为
4. 跑 `npm test` / `npm run build`
5. 在手机 Pages 页面验证

## Open Questions

- 连携和道具是否要始终显示，还是在手机上允许折叠到“更多”按钮
- 是否需要额外的“取消选择/返回移动模式”独立按钮
