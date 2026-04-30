# godot-tactical-parity-rework Specification

## Purpose
TBD - created by archiving change rework-godot-tactical-parity. Update Purpose after archive.
## Requirements
### Requirement: Godot battle SHALL initialize from explicit battle setup data
The Godot battle system SHALL initialize tactical encounters from validated setup data that defines squads, control modes, unit ids, labels, chassis, modules, spawn tiles, mission id, map id, and optional non-squad actors.

#### Scenario: Two-squad fixture starts
- **WHEN** the deterministic Godot parity fixture launches a battle
- **THEN** the battle SHALL contain one human-controlled player squad and one AI-controlled opposing squad, each with up to three configured units visible in turn order and on the board

#### Scenario: Invalid setup is rejected
- **WHEN** setup data references missing chassis, missing modules, duplicate unit ids, duplicate occupied spawn tiles, or out-of-bounds spawn tiles
- **THEN** the battle SHALL fail validation with readable diagnostics instead of silently starting a broken encounter

### Requirement: Godot unit turns SHALL enforce one movement opportunity and action gates
The Godot battle system SHALL track per-turn movement, primary action, tool action, and combo/action costs for each active unit and SHALL reject commands whose opportunity has already been spent.

#### Scenario: Movement is consumed
- **WHEN** a player moves the active unit to a legal reachable tile
- **THEN** the unit SHALL update to the destination, mark movement spent, clear movement previews, and reject any second movement attempt until the unit's next turn

#### Scenario: Action is consumed
- **WHEN** a player resolves a primary attack, skill, or combo for the active unit
- **THEN** the unit SHALL mark its primary action spent and disable further primary-action targets until the next turn

### Requirement: Godot movement SHALL be reachable-tile only
The Godot battle system SHALL calculate movement previews from logical grid data using Move points, terrain movement cost, Jump tolerance, passability, blockers, and live occupancy, and SHALL accept only destinations in the current preview set.

#### Scenario: Legal move preview
- **WHEN** movement mode is selected for an active unit that can move
- **THEN** the board SHALL highlight only destinations reachable within that unit's current Move and Jump constraints and SHALL expose the path used for the highlighted destination

#### Scenario: Illegal move rejected
- **WHEN** the player taps an unhighlighted tile, occupied tile, impassable tile, out-of-range tile, or over-height tile while in movement mode
- **THEN** the unit SHALL remain in place and the HUD or diagnostics SHALL report why the move is invalid

### Requirement: Godot targeting SHALL be action-mode legal
The Godot battle system SHALL derive target previews from the selected action mode and the active unit's current legal actions rather than accepting arbitrary unit taps.

#### Scenario: Attack target preview
- **WHEN** the player selects basic attack, skill, tool, or combo mode
- **THEN** the board SHALL highlight only targets that satisfy team, range, line-of-sight, resource, module, and remaining-opportunity rules for that mode

#### Scenario: Illegal target rejected
- **WHEN** the player taps a unit or tile that is not in the active target preview
- **THEN** no action SHALL resolve and the UI SHALL provide concise invalid-target feedback

### Requirement: Godot combat SHALL preserve tactical effects required by MVP
The Godot battle system SHALL resolve MVP combat effects including facing arc, height modifiers, line of sight where configured, damage, healing, statuses, knockback, collision, fall/hazard consequences, death cleanup, and combat feedback records.

#### Scenario: Positional attack resolves
- **WHEN** a unit attacks from a side or rear arc or from a different height level
- **THEN** the combat result SHALL include the applied positional or height modifier and expose it to the battle log or diagnostics

#### Scenario: Knockback resolves
- **WHEN** an action applies knockback
- **THEN** the target SHALL move only through legal knockback steps and SHALL apply collision, edge, elevation drop, or hazard consequences when encountered

### Requirement: Godot AI-controlled actors SHALL execute legal plans
The Godot battle system SHALL give AI-controlled actors the same battle-state snapshot used for player legality and SHALL execute only legal move/action/interact/end-turn commands.

#### Scenario: AI turn executes
- **WHEN** an AI-controlled unit becomes active
- **THEN** the AI SHALL choose a legal plan from available candidates, update unit state through the same command APIs as a player command, log the action, and advance the turn

#### Scenario: AI has no valid action
- **WHEN** an AI-controlled unit has no legal movement, action, or objective interaction
- **THEN** the AI SHALL wait/end turn without mutating illegal state

### Requirement: Godot mission and result state SHALL close the encounter clearly
The Godot battle system SHALL maintain mission objective, extraction, pressure, and result state so battles end through victory, defeat, extraction, objective completion, or forced pressure closure.

#### Scenario: Objective or extraction changes
- **WHEN** an objective is completed or extraction becomes available
- **THEN** the HUD, board markers, diagnostics, and result routing SHALL reflect the new mission state

#### Scenario: Battle closes
- **WHEN** all required enemy actors are defeated, all player actors are defeated/extracted, or pressure forces closure
- **THEN** the battle SHALL route to result or loot flow with outcome, rewards, losses, surviving/extracted actors, and turn count

### Requirement: Godot targeting previews SHALL expose selected action context
The Godot battle system SHALL derive board previews and HUD summaries from the selected action category and selected module, so legal-rule-driven target previews are understandable during normal play.

#### Scenario: Selected module changes target preview
- **WHEN** the player changes the selected skill, tool, or combo module for the active unit
- **THEN** the target preview SHALL refresh using that module's team, range, line-of-sight, resource, and remaining-opportunity rules

#### Scenario: Preview counts are explained
- **WHEN** the HUD reports movement or target preview counts
- **THEN** it SHALL also identify the active mode or selected module that produced those counts

#### Scenario: Diagnostics and normal UI agree
- **WHEN** diagnostics are toggled on during a selected action mode
- **THEN** diagnostics and the normal HUD SHALL report consistent active mode, selected module, legal target count, and invalid-command reason

