## Why

当前战斗场景加载的部分角色与地形素材虽然使用 `.png` 文件名，但实际没有透明通道或甚至是 JPEG 数据，导致等距地图上出现方形背景、风格割裂和遮挡感。移动竖屏下战斗地图还按整屏尺寸保守缩放，没有围绕可交互战斗视窗做适配，手机上可点格子和单位显得过小。

## What Changes

- 规范战斗运行时使用的角色、地形、特效图像素材：必须是真正的 PNG RGBA/alpha 资源，文件格式与扩展名一致。
- 替换或重新导出当前不合规的 `*-sprite.png` 资源，统一角色与地形的视觉风格、边界透明度、尺寸和锚点。
- 调整 BootScene / asset intake 的战斗素材映射，使战斗场景只依赖合规资源，并保留缺失资源的占位兜底。
- 调整战斗地图的移动竖屏布局与缩放策略，使地图优先占据 HUD 与底部行动栏之间的战斗视窗，而不是被整屏 FIT 缩得过小。
- 为素材格式、战斗地图尺寸计算和移动端布局增加针对性测试。

## Capabilities

### New Capabilities
- `battle-visual-assets`: Defines the runtime contract for battle unit, terrain, marker, particle, and UI art assets used by the Phaser prototype.

### Modified Capabilities
- `mobile-portrait-runtime`: Battle scenes must size and position the tactical map for the available portrait battle viewport, keeping map tiles and units touch-readable while preserving HUD and action controls.
- `tactical-battle-system`: Battle presentation must render units and terrain with transparent, style-consistent assets so combat state remains readable on the tactical map.

## Impact

- Affected assets: `frontend/assets/units/*`, `frontend/assets/tiles/*`, and any generated replacements under the frontend asset tree.
- Affected code: `frontend/src/scenes/BootScene.ts`, `frontend/src/core/AssetIntake.ts`, `frontend/src/core/GridMap.ts`, `frontend/src/entities/Unit.ts`, `frontend/src/scenes/BattleScene.ts`, and `frontend/src/scenes/BattleSceneMobileUi.ts`.
- Affected tests: asset format validation, battle map sizing/layout tests, and existing battle/grid/unit tests.
- No new runtime backend dependency is required. Image conversion/generation may use local tooling during implementation, but checked-in runtime assets must remain static frontend files.
