## Why

The current Godot battle prototype has a playable tactical loop, but its turn order, facing, and targeting rules are still too deterministic to create the FFTA-like positioning decisions the project is aiming for. This change adds the missing MVP battle-decision layer: tempo management, explicit end-facing choices, hit reliability, and the first visibility/obstacle model needed for dungeon exploration and ranged counterplay.

## What Changes

- Replace static speed-sorted turn cycling with a lightweight WT/CT-style tempo model where speed, action cost, and waiting affect when a unit acts again.
- Add explicit end-facing confirmation so players can choose a unit's final direction even before final sprite-facing art exists.
- Add hit chance calculation and preview, with facing arc, height, line of sight, cover, and status modifiers affecting reliability.
- Add a basic battlefield visibility model for explored tiles, current vision, line-of-sight blockers, and projectile blockers.
- Add support for object-style blockers such as trees or destructible cover as a rules layer separate from terrain.
- Keep战前准备、系统菜单、敌方详情、战斗外惩罚、完整裁判后果、倒地/复活链路 out of this change.

## Capabilities

### New Capabilities
- `battlefield-visibility-system`: Covers explored/current vision state, line-of-sight blockers, projectile blockers, and obstacle metadata such as durability and destructibility.

### Modified Capabilities
- `tactical-battle-system`: Adds WT/CT tempo, wait-cost behavior, end-facing confirmation, hit chance, water action restrictions, and obstacle-aware combat rules.
- `godot-tactical-parity-rework`: Requires the Godot battle prototype to implement the new tempo, facing, hit, and visibility legality rules through the existing command/controller path.
- `godot-action-preview-usability`: Extends player-facing previews to show hit chance, facing arc, visibility/cover blockers, and end-facing guidance.

## Impact

- Affected Godot systems: `BattleController`, `ActionResolver`, `BattleUnit`, `GridMap`, `AiPlanner`, `BattleBoard`, and the battle scene HUD/action panel.
- Affected data: terrain definitions, map cells, and new or extended obstacle/object definitions for blockers and durability.
- Affected tests/tools: Godot smoke checks and deterministic fixtures need coverage for CT ordering, wait behavior, facing confirmation, hit/miss outcomes, water action lockout, obstacle line-of-sight, and explored/current visibility state.
- No new external dependencies are expected.
