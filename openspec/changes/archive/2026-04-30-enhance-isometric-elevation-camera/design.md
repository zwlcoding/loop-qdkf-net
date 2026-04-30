## Context

The battle prototype already stores per-tile height in `GridMap.TileData` and uses height for movement, jump constraints, and combat modifiers. Rendering is behind the rules: `tileToIso()` lifts tile centers by height, but terrain is still drawn as a single clipped top-face image and the current side faces are generic black translucent triangles.

The FFTA reference images show a different construction: the board reads as stacked isometric platforms. Height is communicated through visible side walls only where a tile edge is exposed, terrain-specific wall material, strong top/side value separation, edge highlights, cast/contact shadows, and objects that sit on top of the tile plane. The camera also shows only a local portion of the board and moves with the active unit, instead of fitting the whole map at once.

This change should build on the existing logical grid instead of changing battle rules. `TileData.height`, unit tile coordinates, and pathing remain authoritative; rendering and camera behavior become faithful to that model.

## Goals / Non-Goals

**Goals:**
- Make height immediately readable at gameplay scale with FFTA-style top faces, side walls, edges, and shadows.
- Draw visible side walls from neighbor height differences rather than from a tile's height in isolation.
- Keep units, shadows, labels, HP bars, highlights, and target markers anchored to the same elevated tile origin.
- Show a local portion of the tactical board on mobile and desktop, with camera movement following active/selected units and action targets.
- Preserve reliable pointer-to-tile mapping after camera scroll, tile elevation, and viewport changes.
- Add deterministic tests for elevation geometry, anchoring, camera focus, and click conversion.

**Non-Goals:**
- Do not clone or include FFTA copyrighted art; use it only as a visual reference for technique.
- Do not change movement, jump, combat, AI, or mission rules except where tests need to verify visual alignment to existing coordinates.
- Do not add a map editor, full terrain auto-tiling system, or production-complete biome art library in this change.
- Do not archive existing active OpenSpec changes.

## Decisions

### Decision 1: Render elevation as exposed edges

For each tile, compare its height with the neighboring tiles that can expose walls in the current isometric view, especially the front-left and front-right edges. Render a wall segment only when `tile.height > neighbor.height` or when the edge is outside the map. The wall segment height is `(tile.height - neighbor.height) * levelHeightPx`.

Rationale:
- This matches how tactics maps communicate plateaus and cliffs.
- It avoids every raised tile drawing full dark slabs even when adjacent to equally high tiles.
- It lets a group of high tiles read as a single platform with walls only at the perimeter.

Alternatives considered:
- Keep drawing side faces for every tile with `height > 0`. This creates clutter and does not communicate plateau boundaries.
- Bake height into each terrain PNG. This explodes asset count and breaks when adjacent heights vary.

### Decision 2: Keep top-face art separate from side-wall styling

Use terrain top textures for the diamond surface and procedural/material side faces for exposed walls. Side faces can start as Phaser polygons with terrain-specific palettes, edge strokes, and simple texture lines, then later evolve into dedicated side-wall image assets without changing the geometry contract.

Rationale:
- The current asset pipeline can improve quickly without waiting for a full tile atlas.
- Side-wall material should depend on terrain and height difference, not on a pre-baked single tile image.
- Tests can validate geometry and alpha regardless of final art fidelity.

Alternatives considered:
- Generate full 3D-looking tile sprites for every terrain/height combination. This is visually appealing but brittle and expensive for the current prototype.
- Use only shader-like tinting on top faces. This does not create true vertical separation.

### Decision 3: Define a shared tile anchor model

Introduce a small set of grid projection helpers, either inside `GridMap` or extracted beside it:
- `tileToTopCenter(x, y)` returns the elevated top-face center.
- `tileToGroundCenter(x, y)` returns the un-elevated grid footprint center if needed for shadows.
- `getLevelHeightPx()` derives elevation height from tile size.
- `getTileDepth(x, y, layerOffset)` centralizes render ordering.

Units, shadows, HP bars, labels, highlights, mission markers, and pointer conversion must use these helpers instead of each component applying its own offsets.

Rationale:
- The user-visible issue that pieces do not correspond to board squares is usually anchor drift, not rules drift.
- A shared projection contract makes camera scrolling and mobile resizing less fragile.

Alternatives considered:
- Patch offsets in `Unit`, `HpBar`, and `BattleScene` independently. This can make one viewport look correct while breaking another.

### Decision 4: Use Phaser camera scroll for local board framing

Render the tactical board in world coordinates and use the main camera to show a viewport-sized subsection of it. HUD/action controls should remain camera-ignored or placed in a separate UI layer so they do not scroll with the map.

Camera focus rules:
- On battle start, focus the first active unit or mission-relevant player unit.
- On turn change, pan/focus to the active unit.
- On selecting a unit, focus that unit if needed.
- On previewing movement or attack targets, keep both actor and target area reasonably visible when possible.
- Clamp camera bounds to the rendered board plus padding, so it does not show excessive empty space.

Rationale:
- FFTA-style presentation depends on keeping tiles large and moving the view, not shrinking the entire board.
- Phaser already provides camera scroll and bounds, which is better than manually offsetting every sprite for panning.

Alternatives considered:
- Continue centering the full board in the available viewport. This conflicts with readable mobile tile size.
- Move all map objects through a custom container transform. This increases pointer conversion complexity and may conflict with existing scene objects.

### Decision 5: Pointer conversion must include camera scroll

Pointer-to-tile conversion must transform screen coordinates into world coordinates using camera scroll/zoom before applying inverse isometric projection. Highlight hit tests should use the same projection helpers used for rendering.

Rationale:
- A local camera view is unusable if taps resolve to pre-camera coordinates.
- This is a high-regression area and needs tests.

Alternatives considered:
- Disable map tapping while camera is offset. That would break core battle interaction.

## Risks / Trade-offs

- Procedural wall materials may still look temporary compared with hand-authored FFTA-like art → Mitigation: define the geometry and material slots now, then improve art incrementally behind stable keys.
- Camera-follow can disorient players if it moves too often → Mitigation: focus only on meaningful state changes, use short pans, and keep selected action context visible.
- Camera scroll can break HUD layout if UI objects are not excluded from the battle camera → Mitigation: explicitly separate world-layer and UI-layer objects in `BattleScene`.
- Large tile sizes may reduce strategic overview → Mitigation: keep a readable local view first, and leave room for later mini-map or overview command.
- Elevation geometry can overlap units/markers incorrectly → Mitigation: centralize depth ordering and add tests for top surface, side wall, unit, label, and highlight layer order.

## Migration Plan

1. Add projection and elevation geometry tests around `GridMap`.
2. Implement exposed-edge wall geometry and terrain-specific wall styling while preserving current map data.
3. Move unit and overlay positioning to shared tile anchor helpers.
4. Introduce battle camera bounds and focus behavior, keeping HUD/action UI outside map camera scroll.
5. Update pointer-to-tile conversion to account for camera scroll and verify highlighted tile tapping.
6. Run focused battle rendering tests, full frontend tests, production build, and manual phone portrait verification.

Rollback can restore the previous full-board fit by disabling battle camera bounds/focus and using the old flat side-face render path. No data migration is required.

## Follow-up Notes

- The implemented side walls can start as procedural terrain-aware polygons. Later art polish can replace those material helpers with hand-authored wall strips or a tile atlas without changing the exposed-edge geometry contract.
- FFTA remains a technique reference only: stacked isometric platforms, exposed perimeter walls, edge lighting, and local camera framing. The project should not copy its original assets.
- A future overview/minimap command may be useful once camera navigation hides most of the board, but it is intentionally outside this implementation scope.
