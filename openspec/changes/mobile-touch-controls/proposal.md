## Why

当前原型虽然已经是竖屏壳层，但手机上仍然主要依赖“点单位 + 点格子 + 键盘快捷键语义”的桌面式交互。HUD 文本密、左上遮挡重、缺少大触控按钮和明确步骤提示，导致手机上难点、难学、易误触。这个问题已经直接影响手机验收，因此需要单独收口移动端触控交互。

## What Changes

- 为 BattleScene 增加真正的移动端触控操作栏，而不是只显示键盘快捷键提示
- 收口手机 HUD 与日志布局，减少对战场格子的遮挡
- 增加更清晰的步骤提示、取消/结束回合触控入口，降低误触成本
- 保持桌面端键盘快捷键仍可用，但不再作为手机主交互

## Capabilities

### New Capabilities
- `mobile-touch-controls`: Defines portrait-phone touch controls, large tap targets, and explicit action flow for the battle scene.

### Modified Capabilities
- `mobile-portrait-runtime`: Portrait HUD and overlays must remain touch-safe, not just readable.
- `tactical-battle-system`: A player-controlled turn on phone must be completable through on-screen touch controls without relying on hardware keyboard shortcuts.

## Impact

- Affected code: `frontend/src/scenes/BattleScene.ts`, possible shared UI/layout helpers, and focused tests around mobile control state
- Affected systems: battle HUD layout, touch interaction flow, mobile usability
- No new backend/deployment dependency
