## Context

The Godot battle scene already has legal movement and targeting previews in `BattleController`: movement uses grid reachability, while attack, skill, tool, and combo modes filter targets by team, range, line of sight, resources, module kind, and remaining action opportunities. The visible board currently turns reachable tiles green and target units red/purple, but the low-contrast overlay is hard to read on real devices and non-move actions do not expose their full range or selected module context.

This change is a usability pass over existing Godot battle rules. It should make the next action understandable without opening diagnostics and without migrating the broader Phaser progression systems.

## Goals / Non-Goals

**Goals:**
- Make movement, path, range, valid target, selected tile, and objective overlays readable on portrait phone screens.
- Show full range/area affordances for attack, skill, tool, and combo modes, while still distinguishing legal targets.
- Let players choose a specific skill, tool, or combo module and see its range, target rules, cost/uses, and effect summary.
- Surface concise invalid-action reasons in the normal HUD.
- Preserve the current Godot battle rule semantics unless a small normalization is required to display them consistently.

**Non-Goals:**
- Do not migrate Phaser's full module schema, loadout equipment model, meta progression, shop, or rift map DAG in this change.
- Do not redesign battle art assets; this can work with existing drawn board geometry and simple vector glyphs.
- Do not add new combat mechanics beyond making existing attack/skill/tool/combo behavior selectable and visible.
- Do not require online services or platform-specific runtime behavior.

## Decisions

### Use Preview Layers Instead Of One Target List

`BattleBoard` should render preview categories separately:
- movement destinations
- selected movement path
- action range tiles
- legal action target tiles
- selected tile and objectives

This is better than reusing the current `reachable`/`targets` arrays for every mode because range and legal target are not the same concept. A skill may have many tiles in range but only one enemy with line of sight; a heal may show ally range but legal targets should still be emphasized.

Alternative considered: only increase the alpha of current overlays. That would be faster, but it would not solve the user's core confusion about how far attacks, skills, tools, and combos can reach.

### Keep Rule Calculation In BattleController

`BattleController` should expose display-oriented preview data derived from existing rules, such as selected module, range tiles, target previews, and disabled reasons. `BattleBoard` should stay a renderer and not duplicate legality logic.

Alternative considered: compute range directly in `BattleBoard`. That risks drift from controller legality, especially for line of sight, team targeting, combo resources, and tool opportunity.

### Add Lightweight Module Selection To Battle Scene

The battle scene should show a compact action/module row or panel:
- movement and basic attack remain direct modes
- skill, tool, and combo modes select from modules available to the active unit
- the selected module drives range and target previews
- unavailable modules remain visible or are summarized with a clear reason when practical

This mirrors the useful Phaser behavior without importing the full Phaser data model. The first available module can remain the default so current tap flow still works.

### Encode Overlays With Color And Shape

Use both color and shape so previews remain readable over varied terrain and for color-impaired users:
- movement: high-contrast cyan/green fill plus bright outline or dots
- path/end tile: yellow path markers with a stronger endpoint
- attack/harmful target: red/orange
- skill: orange or magenta depending on harmful/helpful effect
- tool/heal: cyan/blue plus plus glyph for healing
- combo: violet rings
- invalid/spent state: muted overlays plus HUD reason instead of hidden failure

No bitmap asset dependency is required; simple polygons, rings, and glyph marks can be drawn in `BattleBoard`.

## Risks / Trade-offs

- **Overlay clutter** -> Keep range tiles lower alpha than legal target tiles; draw legal targets last with outline/glyph emphasis.
- **Small phone HUD becomes crowded** -> Use a compact module summary and only show full details for the selected module, not every module at once.
- **Controller display helpers drift from action execution** -> Build range and target previews from the same selected mode/module inputs used by `try_action_active_at`.
- **Module data is currently simplified** -> Add small helper functions for display summaries rather than migrating Phaser's full `effects[]` schema now.
- **Line-of-sight range visualization can confuse players** -> Show "in range" separately from "valid target"; legal targets remain the decisive highlight.
