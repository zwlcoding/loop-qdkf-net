# godot-visual-ui-system Specification

## Purpose
TBD - created by archiving change rebuild-prototype-in-godot. Update Purpose after archive.
## Requirements
### Requirement: Godot visual direction SHALL prioritize readable 2.5D tactics
The Godot prototype SHALL use a cohesive visual direction that makes terrain height, tile ownership, unit roles, objectives, and action previews readable at mobile portrait scale.

#### Scenario: Battle board is shown
- **WHEN** the tactical battle scene renders a map with multiple terrain types and heights
- **THEN** tile tops, exposed height edges, unit positions, reachable tiles, attack targets, objectives, and blocked cells SHALL be visually distinguishable

#### Scenario: Units are shown on the board
- **WHEN** player, enemy, and neutral units are present
- **THEN** each unit SHALL have a readable role/team silhouette or marker and SHALL remain visually anchored to its logical tile

### Requirement: Godot UI SHALL use reusable native control scenes
The Godot prototype SHALL implement its menus and HUD with reusable Godot `Control` scenes, containers, theme resources, and shared style tokens.

#### Scenario: UI screen is resized
- **WHEN** a Godot UI screen changes between supported portrait viewport sizes
- **THEN** controls SHALL reflow through anchors/containers without incoherent overlap or clipped primary commands

#### Scenario: UI theme is updated
- **WHEN** shared colors, fonts, or control styles are changed in the Godot UI theme resources
- **THEN** core menu and HUD controls SHALL pick up the updated style without duplicating per-screen constants

### Requirement: Battle HUD SHALL expose tactical state without blocking interaction
The Godot battle HUD SHALL show mission state, active unit, turn order, action buttons, selected target details, HP/status, shared combo resource, and combat feedback while preserving a tappable battle viewport.

#### Scenario: Active unit turn starts
- **WHEN** a player-controlled unit becomes active
- **THEN** the HUD SHALL show the active unit, available actions, movement/attack guidance, and relevant resources without covering the majority of actionable tiles

#### Scenario: Action target is previewed
- **WHEN** the player previews movement, attack, skill, combo, item, objective interaction, or extraction
- **THEN** the HUD and board SHALL show target validity, expected effect category, and confirmation/cancel controls

### Requirement: Menu UI SHALL support fast prototype loops
The Godot menu, loadout, rift map, loot, and result screens SHALL prioritize compact repeated-play workflows over marketing or landing-page presentation.

#### Scenario: Player edits squad setup
- **WHEN** the player enters loadout/setup
- **THEN** the UI SHALL allow selecting or reviewing three squad units, their role/chassis identity, modules, and readiness state

#### Scenario: Player reviews result
- **WHEN** a run or battle result is shown
- **THEN** the UI SHALL summarize outcome, rewards, losses, and next commands in a compact screen suitable for portrait play

### Requirement: Placeholder assets SHALL meet runtime readability contracts
The Godot prototype SHALL include checked-in placeholder assets for core terrain, units, icons, UI, audio, and effects, with stable keys and transparent/reusable formats where needed.

#### Scenario: Placeholder art is used in battle
- **WHEN** the battle scene loads placeholder terrain and units
- **THEN** the assets SHALL render without opaque unwanted backgrounds and SHALL remain readable against the board and HUD

#### Scenario: Asset is replaced later
- **WHEN** a placeholder asset is replaced with higher fidelity art using the same key/path contract
- **THEN** the scene referencing that asset SHALL continue to load without script changes

