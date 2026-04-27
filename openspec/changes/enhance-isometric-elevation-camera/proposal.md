## Why

当前战斗地图虽然已有高度数据，但画面仍像平面菱形贴图：高低差、棋子落点、遮挡关系和镜头行为都没有形成战旗游戏应有的空间感。参考 FFTA 的表现方式后，本变更要把战斗场景从“整张地图缩进屏幕”调整为“局部棋盘镜头 + 明确高度层级 + 棋子准确站在格子上”。

## What Changes

- 增加 FFTA 风格的等距高度表现：地形由顶面、可见侧壁、边缘高光、接触阴影和高度差断面共同构成。
- 将地形渲染从“每个高地都画固定黑色侧面”改为“只有相邻格子更低时才画暴露侧壁”，并按实际高度差画多层侧壁。
- 生成或替换战斗 tile 资产，使不同地形拥有一致的顶面和侧壁视觉语言，而不是单张平面图被裁成菱形。
- 修正棋子、阴影、HP 条、标签、选择框和目标标记与棋盘格的坐标/锚点对应关系，保证单位真正站在其所在 tile 的顶面中心。
- 增加局部棋盘相机：屏幕内只显示棋盘的一部分，镜头跟随当前行动棋子、选中棋子和移动/攻击目标切换视角。
- 调整移动端战斗布局，使战斗地图保持可读尺寸，通过相机移动查看地图，而不是把整张棋盘缩得很小。
- 为高度侧壁、棋子对齐、镜头跟随、点击命中和移动端局部视口增加测试与人工验收项。

## Capabilities

### New Capabilities
- `isometric-elevation-presentation`: Defines how battle terrain presents height, side walls, tile edges, shadows, and unit anchoring in an isometric tactics view.
- `battle-camera-framing`: Defines battle camera behavior for showing a local portion of the tactical board and following active gameplay focus.

### Modified Capabilities
- `tactical-battle-system`: Battle presentation must make height readable and keep units visually aligned with their logical tiles.
- `mobile-portrait-runtime`: Portrait battle scenes must use a local camera viewport rather than fitting the entire tactical board into the phone screen.

## Impact

- Affected code: `frontend/src/core/GridMap.ts`, `frontend/src/entities/Unit.ts`, `frontend/src/scenes/BattleScene.ts`, `frontend/src/scenes/BattleSceneMobileUi.ts`, battle marker/highlight helpers, and related tests.
- Affected assets: `frontend/assets/tiles/*` and any new terrain top-face/side-wall assets added for battle rendering.
- Affected behavior: unit positioning, pointer-to-tile conversion, camera scrolling/following, mobile viewport sizing, render depth ordering, and manual battle QA.
- No backend or saved-data migration is expected. Existing `TileData.height` and unit tile coordinates remain the logical source of truth.
