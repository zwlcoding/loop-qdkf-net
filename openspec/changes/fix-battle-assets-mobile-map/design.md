## Context

The current battle visual stack was partially upgraded by the archived UI visual overhaul, but the runtime now loads generated `*-sprite.png` assets that are not suitable for compositing on an isometric tactical board:

- `frontend/assets/units/*-sprite.png` files are JPEG image data despite the `.png` extension and have no alpha channel.
- `frontend/assets/tiles/tile-*-sprite.png` files are large RGB PNGs with no alpha channel.
- `BootScene` loads those generated sprite files as the active `unit-*` and `tile-*-sprite` textures.
- `GridMap` masks terrain sprites into diamonds, but non-alpha source images still create inconsistent color and style when scaled down.
- `BattleScene.calculateTileSize()` fits the whole isometric map against the full scene dimensions, so portrait HUD/action controls do not define a dedicated battle viewport and the map reads too small on phones.

There are already smaller RGBA placeholder/unit/tile assets in `frontend/assets/units` and `frontend/assets/tiles`; the fix should prioritize a stable runtime contract and only then improve art fidelity.

## Goals / Non-Goals

**Goals:**
- Ensure all battle runtime unit and terrain textures are valid PNG files with alpha-capable color types.
- Stop loading malformed or non-alpha generated art into BattleScene by default.
- Keep the asset mapping centralized enough that later artist-generated replacements can use the same runtime keys.
- Size and position the isometric battle map from a portrait battle viewport between HUD and action controls.
- Preserve tap-safe HUD/action controls while making tiles and units visibly larger on common phone portrait viewports.
- Add automated validation for image format, asset mapping, and battle map sizing logic.

**Non-Goals:**
- Do not introduce a new live asset service or backend.
- Do not require full final-production art in this change.
- Do not redesign all menus, loadout, loot, or rift map scenes.
- Do not archive the active `rift-dungeon-core` change.

## Decisions

### Decision 1: Treat battle art as checked-in static runtime assets

Use checked-in PNG files under `frontend/assets` as the source of truth for BattleScene. The runtime SHALL not depend on files whose bytes are JPEG or RGB-only PNGs for units and terrain.

Rationale:
- Phaser compositing and isometric overlap require transparent backgrounds.
- Static checked-in files are compatible with GitHub Pages and offline phone preview.
- The implementation can pass deterministic tests without depending on image generation tooling.

Alternatives considered:
- Keep generated `*-sprite.png` files and mask them harder in Phaser. This does not solve unit square backgrounds and still leaves inconsistent source style.
- Add runtime background removal. This adds complexity and is fragile in a browser game loop.

### Decision 2: Normalize texture keys instead of scattering filenames

Keep stable texture keys such as `unit-vanguard` and `tile-plain-sprite`, but update their loaded source paths to compliant assets. If new alpha-correct art is created during implementation, it should replace or map through the same keys.

Rationale:
- Existing `Unit` and `GridMap` code already consume stable texture keys.
- Changing keys broadly would touch more battle logic than necessary.
- Later art replacement stays localized to BootScene / asset intake mapping.

Alternatives considered:
- Rename every runtime key to match physical filenames. This increases churn and does not improve behavior.

### Decision 3: Validate PNG structure in tests

Add a lightweight test helper that reads PNG headers and verifies:
- PNG signature is present.
- IHDR color type supports alpha, such as truecolor with alpha or grayscale with alpha.
- Files are not mislabeled JPEGs.

Rationale:
- The current issue is exactly a file-format contract violation.
- Header validation is fast, deterministic, and does not require browser rendering.

Alternatives considered:
- Visual-only manual QA. Useful but too easy to regress.
- Pixel-level alpha sampling for every asset. More precise but unnecessary if the contract is alpha-capable PNG plus targeted smoke checks.

### Decision 4: Compute portrait battle map size from a reserved battle viewport

Move map sizing toward an explicit layout model:

```
┌───────────────────────────┐
│ HUD / guidance             │
├───────────────────────────┤
│                           │
│ battle viewport            │
│   isometric map centered   │
│   tile size based here     │
│                           │
├───────────────────────────┤
│ log + action bar           │
└───────────────────────────┘
```

For portrait scenes, calculate tile size from the battle viewport width and height, with a minimum touch-readable target. If the full map cannot fit at that target, prefer a larger map with camera/world offset support over shrinking below readable tile/unit sizes.

Rationale:
- The user problem is not just scale mode; it is the map being optimized for full-screen fit instead of the actual playable area.
- Battle controls already have a portrait layout helper that can provide top/bottom reserved areas.

Alternatives considered:
- Increase the current constant multiplier only. This is quick but brittle across devices.
- Use CSS viewport scaling only. Phaser world coordinates and pointer-to-tile mapping still need scene-level layout.

## Risks / Trade-offs

- Existing placeholder RGBA assets may be less visually rich than the generated art → Mitigation: prioritize correct alpha/style consistency now, keep stable keys so higher quality replacements can land later.
- Larger portrait maps may extend beyond the visible screen on narrow devices → Mitigation: compute from a reserved viewport, clamp minimum/maximum tile sizes, and keep pointer-to-tile conversion aligned with the rendered map.
- Asset tests may fail if future tools export palette PNGs without alpha but visually transparent via masks → Mitigation: document the accepted runtime contract as alpha-capable PNG for battle compositing.
- Changing map sizing can affect click hit testing → Mitigation: cover `tileToIso` / `worldToTile` and layout calculations with tests, then run the existing battle/grid test suite.

## Migration Plan

1. Add asset validation tests that expose the current malformed/non-alpha files.
2. Update runtime asset mapping and/or replace checked-in battle assets with valid RGBA PNGs.
3. Add portrait battle viewport sizing helpers and tests.
4. Integrate the sizing helper into `BattleScene` / `GridMap` without changing core battle rules.
5. Run unit tests and build, then manually verify a phone portrait viewport.

Rollback is straightforward: restore previous asset mapping and tile-size calculation. No saved data migration is required.
