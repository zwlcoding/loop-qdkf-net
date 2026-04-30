## Why

The Godot battle scene still reads as a prototype because the tactical board, terrain, and units are drawn with procedural flat shapes rather than authored game assets. The project already has stable placeholder contracts, so this is the right time to replace the demo look with a coherent, polished original art direction before more battle content depends on the current temporary visuals.

## What Changes

- Establish an original polished chibi pixel / 2.5D isometric tactical art direction inspired by classic isometric tactics readability without copying specific commercial game assets or character designs.
- Add a checked-in Godot battle art asset set for the current terrain types, chassis roles, objective markers, and tactical feedback markers.
- Replace procedural-only terrain and unit drawing in `BattleBoard` with stable texture-key based rendering while preserving the current mobile portrait board layout, hit testing, highlights, HP bars, labels, and elevation logic.
- Keep procedural fallback rendering available for missing or invalid assets so development scenes remain debuggable.
- Add validation and smoke coverage that catches missing, invalid, or visually incompatible battle runtime assets before manual testing.

## Capabilities

### New Capabilities

- `godot-battle-art-assets`: Godot battle scenes load and render coherent authored unit, terrain, objective, and tactical feedback assets through stable runtime keys.

### Modified Capabilities

- `tactical-battle-system`: Tactical battles shall preserve movement, elevation, targeting, and unit readability when authored battle assets replace prototype drawing.
- `mobile-portrait-runtime`: Portrait battle presentation shall keep the new authored art readable and tappable on the existing mobile-first layout.

## Impact

- Affects `godot/assets/`, `godot/scripts/scenes/battle_board.gd`, Godot asset import metadata, and focused Godot smoke checks.
- May add local generated PNG assets under a dedicated Godot asset subdirectory; runtime logic should reference stable keys rather than generated filenames directly.
- Does not change battle rules, map data, chassis stats, mission flow, or OpenSpec upstream command/skill files.
