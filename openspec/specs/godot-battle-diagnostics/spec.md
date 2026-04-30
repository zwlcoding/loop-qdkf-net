# godot-battle-diagnostics Specification

## Purpose
TBD - created by archiving change rework-godot-tactical-parity. Update Purpose after archive.
## Requirements
### Requirement: Godot battle SHALL provide a toggleable diagnostics panel
The Godot battle scene SHALL provide a reviewer-facing diagnostics panel or tab that can be toggled during battle without requiring console output.

#### Scenario: Diagnostics are toggled on
- **WHEN** the reviewer activates the diagnostics toggle
- **THEN** the panel SHALL become visible above or beside the battle layout while preserving access to the primary battle controls

#### Scenario: Diagnostics are toggled off
- **WHEN** the reviewer deactivates the diagnostics toggle
- **THEN** the battle SHALL return to the normal portrait HUD layout without stale debug overlays blocking board interaction

### Requirement: Diagnostics SHALL explain turn and unit state
The diagnostics panel SHALL show turn order, active unit, selected unit, team/control mode, HP, chassis/role, move, jump, speed, facing, statuses, and per-turn opportunity flags.

#### Scenario: Active turn changes
- **WHEN** the active unit changes
- **THEN** diagnostics SHALL update to mark the new active unit and show whether it is human-controlled or AI-controlled

#### Scenario: Unit spends movement
- **WHEN** a unit moves during its turn
- **THEN** diagnostics SHALL show that movement has been spent and list the unit's current tile

### Requirement: Diagnostics SHALL explain tile and preview state
The diagnostics panel SHALL show hovered or selected tile coordinates, terrain, height, passability, objective id, occupancy, movement preview count, selected path, target preview count, and last invalid command reason.

#### Scenario: Tile is inspected
- **WHEN** the reviewer hovers, taps, or selects a tile
- **THEN** diagnostics SHALL show that tile's logical grid information and whether it is currently legal for the selected mode

#### Scenario: Invalid command occurs
- **WHEN** a move, target, combo, tool, or interact command is rejected
- **THEN** diagnostics SHALL show the rejection reason until replaced by a newer command result

### Requirement: Diagnostics SHALL explain mission, combo, extraction, and log state
The diagnostics panel SHALL show mission id/name, objective text, objective completion state, pressure stage, extraction lock/eligibility, combo resource, eligible combo participants, and recent combat/system log entries.

#### Scenario: Combo mode is selected
- **WHEN** combo mode is selected for a unit with combo capability
- **THEN** diagnostics SHALL list the current combo resource and eligible participants for each highlighted target

#### Scenario: Mission state changes
- **WHEN** objective, extraction, pressure, or battle outcome state changes
- **THEN** diagnostics SHALL update in the same frame or next scene tick with the new state and recent log entry

