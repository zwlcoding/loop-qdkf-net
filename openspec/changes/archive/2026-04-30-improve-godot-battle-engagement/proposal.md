## Why

The Godot battle prototype now has clearer movement and action previews, but battles still feel flat because the player cannot easily read action consequences, enemy activity, unit roles, or why tools and combos matter. This change makes a single battle more engaging before expanding loot, progression, or route systems.

## What Changes

- Add an action intent/forecast surface for the selected attack, skill, tool, or combo showing expected damage, healing, status, knockback, cost, and combo participants before confirming a target.
- Add battle event feedback for player and AI actions, including a recent-action banner, clearer logs, floating damage/heal text, target flash/tint feedback, and simple attack/skill/line indicators.
- Make tool and combo usage understandable by exposing target rules, use conditions, available participants, resource cost, and expected outcome in normal play.
- Strengthen unit role identity with clearer default modules and short role/action summaries for vanguard, skirmisher, support, caster, and controller.
- Add lightweight enemy activity communication so HP changes are attributable to AI attacks, pressure damage, or other battle events.
- Keep this scoped to Godot battle engagement; do not implement full loot, meta progression, rift map, shop, or Phaser mission variety in this change.

## Capabilities

### New Capabilities
- `godot-battle-engagement`: Godot-specific battle feel, intent forecasting, action feedback, role clarity, and event communication during local tactical combat.

### Modified Capabilities
- `godot-action-preview-usability`: Existing previews must include expected action consequences and combo/tool usability details, not only range and legal targets.
- `godot-tactical-parity-rework`: Godot combat resolution and targeting must expose enough player-facing feedback to make AI actions, damage, healing, statuses, knockback, and combo participation understandable.
- `tactical-battle-system`: Tactical combat presentation must provide readable moment-to-moment feedback for actions and battle events.

## Impact

- Affected Godot files: `godot/scripts/battle/battle_controller.gd`, `godot/scripts/battle/action_resolver.gd`, `godot/scripts/scenes/battle.gd`, `godot/scripts/scenes/battle_board.gd`, and `godot/tools/smoke_check.gd`.
- Potential data touchpoints: `godot/data/modules.json` and chassis/default module assignment if role summaries or clearer default modules require small data additions.
- Verification: focused Godot smoke checks plus manual portrait review of attack, skill, tool/heal, combo, AI damage attribution, event banner, floating numbers, and role clarity.
