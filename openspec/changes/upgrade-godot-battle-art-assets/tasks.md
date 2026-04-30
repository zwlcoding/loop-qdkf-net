## 1. Asset Direction And Inventory

- [x] 1.1 Document the final Godot battle art style guide, prompt language, target dimensions, naming rules, and acceptance criteria in `godot/assets/README.md` or a dedicated battle asset note
- [x] 1.2 Inventory every terrain, unit chassis, objective marker, feedback marker, and fallback visual needed by the current Godot data and `BattleBoard`
- [x] 1.3 Define stable runtime texture keys and file paths for terrain tops, terrain sides, units, objectives, and tactical feedback markers

## 2. Authored Battle Asset Set

- [x] 2.1 Generate or author transparent PNG terrain top assets for `plain`, `forest`, `urban`, `mountain`, `water`, and `rift`
- [x] 2.2 Generate or author compatible terrain side or material assets for exposed elevation walls
- [x] 2.3 Generate or author transparent PNG unit sprites for `vanguard`, `skirmisher`, `support`, `controller`, and `caster`
- [x] 2.4 Generate or author objective and tactical marker assets for relic, extraction, blocked, movement, target, selected, active, and team identity states
- [x] 2.5 Add Godot import metadata or import settings so battle PNGs keep transparent edges and render crisply at gameplay scale

## 3. Godot Rendering Integration

- [ ] 3.1 Add a small battle art registry or helper that loads assets through stable logical keys with procedural fallback support
- [ ] 3.2 Update terrain drawing in `BattleBoard` to render authored top-face art while preserving current tile anchors, elevation offsets, borders, and hit testing
- [ ] 3.3 Update exposed elevation wall drawing to use authored or terrain-aware side treatment without hiding tile height differences
- [ ] 3.4 Update unit drawing in `BattleBoard` to render chassis sprites with shadows, team identity, facing indication, active state, labels, and HP bars in the existing depth order
- [ ] 3.5 Update objective and tactical feedback drawing so movement, targeting, path, selected, blocked, relic, and extraction states remain readable over authored terrain art

## 4. Validation And Manual QA

- [ ] 4.1 Add focused validation that required Godot battle asset files exist, are PNGs, and support transparency-capable color data
- [ ] 4.2 Run the Godot smoke check or equivalent battle-scene validation after the renderer changes
- [ ] 4.3 Manually verify a phone portrait battle viewport for consistent style, readable units, readable elevation, readable overlays, and correct tile tapping
- [ ] 4.4 Update task checkboxes as each implementation task completes and leave the change unarchived for explicit user review
