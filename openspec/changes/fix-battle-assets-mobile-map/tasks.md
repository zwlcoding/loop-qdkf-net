## 1. Asset Contract And Intake

- [x] 1.1 Add frontend tests that validate battle runtime image files are true PNGs with alpha-capable color types
- [x] 1.2 Inventory current unit and terrain runtime mappings and identify every malformed or non-alpha battle asset currently loaded by BootScene
- [x] 1.3 Replace or remap unit textures so all `unit-*` battle keys load compliant transparent PNG assets
- [x] 1.4 Replace or remap terrain textures so all isometric tile battle keys load compliant transparent PNG assets
- [x] 1.5 Keep missing-asset fallback generation transparent and visually consistent with the battle asset contract

## 2. Battle Map Mobile Layout

- [x] 2.1 Extract portrait battle viewport sizing into a testable helper using HUD, log, and action bar reserved regions
- [x] 2.2 Update BattleScene tile-size calculation to use the portrait battle viewport instead of full-scene FIT sizing
- [x] 2.3 Update GridMap positioning or offsets so the isometric map centers inside the battle viewport
- [x] 2.4 Ensure pointer-to-tile conversion uses the same viewport offset and scale as rendering
- [x] 2.5 Recompute battle map layout on viewport resize/orientation changes without stale tile size or stale click coordinates

## 3. Battle Readability Integration

- [x] 3.1 Verify unit sprites, shadows, labels, HP bars, markers, highlights, and terrain render in the correct depth order after asset changes
- [x] 3.2 Adjust unit display sizing if needed so compliant transparent sprites remain readable on portrait tile sizes
- [x] 3.3 Preserve existing squad tinting or replace it with an alpha-safe visual treatment that does not muddy the new art

## 4. Verification

- [x] 4.1 Run focused asset validation, layout, GridMap, Unit, and BattleScene tests
- [x] 4.2 Run the full frontend test suite
- [x] 4.3 Run the frontend production build
- [ ] 4.4 Manually verify a phone portrait viewport for transparent art, consistent style, readable map scale, and correct tile tapping
