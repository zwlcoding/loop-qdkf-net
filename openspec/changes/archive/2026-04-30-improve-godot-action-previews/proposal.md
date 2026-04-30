## Why

The Godot battle prototype has movement, attack, skill, tool, and combo rules, but the board and HUD do not make action ranges, legal targets, or selected module effects clear enough for real phone play. Players can see some blinking movement tiles, yet the colors are low-contrast and non-move actions are hard to discover or use without debug knowledge.

## What Changes

- Increase Godot battle board preview contrast for movement, path, attack, skill, tool/heal, combo, blocked, selected, and objective states.
- Add distinct visual encoding for preview categories beyond color alone, such as outlines, endpoint emphasis, small glyphs, or rings.
- Show action range overlays for attack, skill, tool, and combo modes, not only currently legal target units.
- Add an action/module selection surface for skills, tools, and combos that displays name, range, cost/uses, target type, line-of-sight requirement, and effect summary.
- Make the HUD explain the selected mode/module and why actions are unavailable or invalid.
- Keep the scope focused on usability of the existing Godot tactical rules; do not migrate the full Phaser progression, rift, loot, or mission systems in this change.

## Capabilities

### New Capabilities
- `godot-action-preview-usability`: Godot-specific battle UX for readable board overlays, action range previews, module selection, and concise action feedback.

### Modified Capabilities
- `godot-tactical-parity-rework`: Targeting previews must remain legal-rule driven while exposing selected module and range context clearly enough for normal play.
- `tactical-battle-system`: Godot battle presentation must make movement and action affordances readable, especially when board feedback overlaps terrain and units.

## Impact

- Affected Godot files: `godot/scripts/scenes/battle.gd`, `godot/scripts/scenes/battle_board.gd`, `godot/scripts/battle/battle_controller.gd`, and supporting UI/palette/data helpers as needed.
- Affected data: existing `godot/data/modules.json` may need lightweight display metadata or normalized summaries, but should keep current rule semantics unless required for clarity.
- Verification: Godot smoke checks plus manual portrait review of move, attack, skill, tool, combo, invalid target, spent action, and selected module states.
