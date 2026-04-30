# godot-prototype-runtime Specification

## Purpose
TBD - created by archiving change rebuild-prototype-in-godot. Update Purpose after archive.
## Requirements
### Requirement: Godot project SHALL live under a dedicated directory
The system SHALL add a Godot 4.6 project under `godot/` with its own project configuration, scenes, scripts, resources, assets, and data.

#### Scenario: Project files are present
- **WHEN** a developer opens the repository after implementation
- **THEN** `godot/project.godot` SHALL exist and SHALL identify a runnable Godot project without requiring files from outside the repository

#### Scenario: Existing frontend remains available
- **WHEN** the Godot project is added
- **THEN** the existing `frontend/` prototype SHALL remain in place and SHALL NOT be deleted as part of this change

### Requirement: Godot runtime SHALL provide the core prototype scene flow
The Godot prototype SHALL provide a playable scene flow covering menu entry, squad/loadout setup, rift/map selection, tactical battle, loot, and result screens.

#### Scenario: Player starts a local run
- **WHEN** the player starts from the Godot menu and confirms a valid squad/loadout
- **THEN** the runtime SHALL advance through rift/map selection into a tactical battle using the selected setup

#### Scenario: Battle completes
- **WHEN** a Godot battle reaches victory, defeat, extraction, or forced resolution
- **THEN** the runtime SHALL route to a result or loot screen that summarizes the outcome and allows returning to the run/menu flow

### Requirement: Godot runtime SHALL centralize cross-scene state
The Godot prototype SHALL use explicit shared state services or autoloads for content data, current run state, scene routing, and audio/settings state.

#### Scenario: Scene transition preserves run context
- **WHEN** the player moves from loadout to rift map to battle
- **THEN** selected squad, mission/run context, and relevant content references SHALL be preserved without relying on hidden UI nodes from previous scenes

### Requirement: Godot runtime SHALL load prototype content from stable data definitions
The Godot prototype SHALL define chassis, units, modules, terrain, missions, maps, and loot in stable data files or Godot resources rather than hardcoding all content directly inside scene scripts.

#### Scenario: Battle content is initialized
- **WHEN** a battle scene starts
- **THEN** units, terrain, objectives, and mission metadata SHALL be created from content definitions or test fixtures with documented keys

### Requirement: Godot runtime SHALL support local prototype verification
The Godot project SHALL include enough runnable configuration and documented smoke checks for a developer to verify the prototype in Godot 4.6.

#### Scenario: Project is launched in Godot 4.6
- **WHEN** a developer runs or opens the Godot project with Godot 4.6
- **THEN** the initial scene SHALL load without missing-script, missing-resource, or project-version errors

#### Scenario: Local smoke run is completed
- **WHEN** a developer follows the local smoke path through menu, setup, battle, and result
- **THEN** each core scene SHALL be reachable without requiring network services

