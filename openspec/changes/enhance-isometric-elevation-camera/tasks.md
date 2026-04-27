## 1. Elevation Geometry And Asset Model

- [x] 1.1 Add focused tests for exposed side-wall geometry when adjacent tiles have lower, equal, or missing neighbors
- [x] 1.2 Replace fixed `tile.height * 16` elevation rendering with tile-size-derived level height
- [x] 1.3 Render side walls only for exposed height differences and map boundaries
- [x] 1.4 Add terrain-aware side-wall palettes or material helpers for plain, forest, mountain, urban, and water boundaries
- [x] 1.5 Add edge highlights and contact shadows that preserve readable tile top faces without opaque square artifacts
- [x] 1.6 Verify terrain top textures and any new wall assets remain alpha-safe PNGs

## 2. Tile Anchors And Battle Object Alignment

- [x] 2.1 Add shared projection helpers for elevated tile top center, ground center, level height, and render depth ordering
- [x] 2.2 Update unit sprite, shadow, HP bar, label, selection, and target marker positioning to use the shared tile anchor helpers
- [x] 2.3 Update movement, target, path, mission, hazard, and pressure highlights to render on elevated top faces
- [x] 2.4 Update pointer-to-tile conversion tests so visible elevated highlights resolve to the same logical tile
- [x] 2.5 Run focused `GridMap`, `Unit`, `HpBar`, and `BattleScene` alignment tests

## 3. Local Battle Camera

- [x] 3.1 Add camera bounds calculation from rendered isometric board bounds, elevation height, object padding, and battle viewport
- [x] 3.2 Introduce battle camera focus helpers for active unit, selected unit, movement destination, and attack target
- [x] 3.3 Keep HUD, logs, debug overlays, and action controls fixed in a UI layer while the map camera scrolls
- [x] 3.4 Update pointer-to-tile conversion to account for camera scroll and zoom
- [x] 3.5 Add tests for camera focus, camera bounds clamping, and tapped tile resolution after camera movement

## 4. Mobile Portrait Integration

- [x] 4.1 Update portrait battle layout to preserve readable tile scale and rely on camera navigation when the board exceeds the viewport
- [x] 4.2 Recompute camera bounds and focus when the mobile viewport resizes or orientation changes
- [x] 4.3 Ensure bottom action controls remain tap-safe and do not pass touches through to map tiles while camera is offset
- [x] 4.4 Manually verify phone portrait gameplay for local board view, camera follow, tile tapping, and unit-to-grid alignment

## 5. Verification

- [x] 5.1 Run focused elevation, camera, layout, pointer, and battle scene tests
- [x] 5.2 Run the full frontend test suite
- [x] 5.3 Run the frontend production build
- [x] 5.4 Capture remaining visual gaps or art polish follow-ups without expanding implementation scope
