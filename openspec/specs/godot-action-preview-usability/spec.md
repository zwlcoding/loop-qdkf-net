# godot-action-preview-usability Specification

## Purpose
TBD - created by archiving change improve-godot-action-previews. Update Purpose after archive.
## Requirements
### Requirement: Godot battle SHALL render high-contrast preview overlays
The Godot battle board SHALL render movement, path, action range, legal target, selected tile, and objective feedback with enough contrast and non-color cues to remain readable on portrait Android devices.

#### Scenario: Movement preview is readable
- **WHEN** movement mode is selected for a human-controlled active unit with legal movement destinations
- **THEN** the board SHALL show reachable tiles with a bright fill or outline that is visually distinct from terrain, units, selected path, targets, and objectives

#### Scenario: Path endpoint is emphasized
- **WHEN** the player selects or previews a movement destination with a path
- **THEN** the board SHALL show the selected path separately from general reachable tiles and SHALL make the final destination more prominent than intermediate path tiles

#### Scenario: Legal target remains readable under units
- **WHEN** a legal action target tile contains a unit
- **THEN** the board SHALL render target feedback around or above the tile in a way that does not hide the unit occupant

### Requirement: Godot battle SHALL show action range separately from legal targets
The Godot battle UI SHALL show the selected action's range or usable area independently from the legal target set, so players can understand both how far an action reaches and which targets are currently valid.

#### Scenario: Basic attack range is selected
- **WHEN** the player selects basic attack mode
- **THEN** the board SHALL show the active unit's attack range and SHALL emphasize only hostile targets that can actually be attacked

#### Scenario: Skill range is selected
- **WHEN** the player selects a skill module
- **THEN** the board SHALL show that module's configured range and SHALL emphasize only targets satisfying team, range, line-of-sight, and primary-action rules

#### Scenario: Tool or heal range is selected
- **WHEN** the player selects a tool or healing module
- **THEN** the board SHALL show that module's usable range and SHALL emphasize only valid friendly or hostile targets according to the module's effect type

#### Scenario: Combo range is selected
- **WHEN** the player selects a combo module
- **THEN** the board SHALL show the initiation range, combo resource requirement, and legal hostile targets that can start the combo

### Requirement: Godot battle SHALL expose selectable module details
The Godot battle scene SHALL expose available skill, tool, and combo modules for the active unit, and the selected module SHALL drive both the HUD summary and board previews.

#### Scenario: Active unit has multiple modules
- **WHEN** the active unit has more than one skill, tool, or combo module available for the selected action category
- **THEN** the UI SHALL let the player select a specific module before targeting

#### Scenario: Selected module is summarized
- **WHEN** a module is selected
- **THEN** the HUD SHALL show the module name, range, target type or team rule, line-of-sight requirement when applicable, cost or use limit when applicable, and a concise effect summary

#### Scenario: Module is unavailable
- **WHEN** the selected module cannot be used because the unit spent its action, spent its tool opportunity, lacks combo resource, or has no legal target
- **THEN** the HUD SHALL show a concise reason instead of leaving the player to infer the failure from unchanged board state

### Requirement: Godot battle SHALL report invalid action attempts in normal play
The Godot battle UI SHALL surface invalid movement and targeting reasons in the normal HUD or action panel without requiring the diagnostics panel.

#### Scenario: Invalid target is tapped
- **WHEN** the player taps a tile or unit outside the current legal target set
- **THEN** no action SHALL resolve and the normal HUD SHALL display the current invalid reason such as range, target team, line of sight, resource, action spent, or tool spent

#### Scenario: Invalid reason clears after valid command
- **WHEN** the player executes a valid movement, action, tool, combo, or end-turn command
- **THEN** the normal HUD SHALL clear the stale invalid reason or replace it with the latest successful action summary

