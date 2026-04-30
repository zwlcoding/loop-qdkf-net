## Context

Godot battles now expose legal movement and action previews, but most consequences are only understood after an action resolves. AI actions can reduce HP without a strong on-screen explanation, tool and combo use is still hard to internalize, and units do not yet feel role-distinct despite having different chassis/modules.

The implementation should make battles feel more authored and readable using lightweight Godot UI/draw effects. It should reuse existing controller/action resolution data and avoid building a new animation framework or importing Phaser progression systems.

## Goals / Non-Goals

**Goals:**
- Let the player understand expected action consequences before confirming a target.
- Make player, AI, pressure, damage, healing, status, knockback, and combo events visibly attributable.
- Make tool and combo actions feel intentional rather than hidden secondary buttons.
- Improve unit role identity through short summaries and clearer default action identity.
- Keep verification possible through smoke checks and phone portrait manual review.

**Non-Goals:**
- Do not implement loot selection, equipment inventory, permanent progression, shops, or rift room routing.
- Do not replace the current drawn board with final art or skeletal animation.
- Do not add complex AI planning beyond communicating what the AI did.
- Do not implement full projectile physics; simple lines, flashes, and floating text are enough for this pass.

## Decisions

### Use Battle Event Records As The Feedback Backbone

`BattleController` should produce recent event records for resolved actions, AI turns, pressure ticks, invalid commands, and turn starts. Events should include source unit, target unit, action label, damage/healing, status, knockback, and a concise summary.

This keeps feedback deterministic and testable. `BattleScene` and `BattleBoard` can render banners, floating text, and flashes from the same event data instead of re-parsing log strings.

Alternative considered: only expand text logs. Text logs help, but they do not solve attribution when HP changes on the board during AI turns.

### Keep Forecasts Lightweight And Rule-Derived

Action intent should estimate consequences from current action/module data:
- basic attack/skill: approximate damage range or expected damage
- heal/tool: healing amount and target rule
- status: status name and duration if available
- knockback: distance
- combo: cost and eligible participants

Forecasts can be approximate as long as they use the same selected mode/module and target preview path as execution. The goal is confidence, not exact simulation of every future modifier.

Alternative considered: run real combat resolution in preview mode. That risks mutating state unless the resolver is refactored deeply, which is too much for this pass.

### Render Feedback In Existing Battle Scene/Board

Use existing `Control._draw()` rendering and labels:
- a compact recent-action banner above or below the board
- floating text records anchored to unit tile centers
- short-lived attack line or combo ring
- tint/flash state for recently damaged or healed units

This avoids new assets and keeps the change portable to Android export.

### Strengthen Role Identity With Presentation First

Unit role identity should be communicated through HUD text and module summaries before adding more mechanics. The default squad can show:
- vanguard: guard, melee, knockback
- skirmisher: flanker, ranged root
- support: medic, heal/tool
- caster: burst, fireball
- controller: control, root/status

This is enough to make current actions more meaningful without requiring a loadout system.

## Risks / Trade-offs

- **Forecasts can diverge from real results** -> Label them as expected/preview values and derive them from current module data; keep smoke checks focused on presence and consistency, not exact damage formulas.
- **Too much UI text can crowd portrait layout** -> Use one-line summaries and event banners, with detailed information only for selected target or diagnostics.
- **Visual effects can obscure board readability** -> Use short durations and draw transient feedback after units but before persistent HUD where possible.
- **AI events may resolve too quickly to follow** -> Store recent events and show a banner long enough for the player to read after control returns.
- **Role identity can imply mechanics that do not exist yet** -> Summaries must describe current default modules, not future design promises.
