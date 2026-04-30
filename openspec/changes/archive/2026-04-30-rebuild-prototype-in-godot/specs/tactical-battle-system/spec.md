## ADDED Requirements

### Requirement: Godot battle prototype SHALL preserve MVP tactical rules
The Godot battle prototype SHALL implement the existing MVP tactical rule set for local play, including up to two squads, up to three units per squad, unit turns, Move/Jump traversal, facing, height effects, knockback, active combo actions, statuses, objectives, extraction, and endgame pressure.

#### Scenario: Godot battle starts from setup data
- **WHEN** a local Godot run launches a tactical battle after squad setup
- **THEN** the battle SHALL initialize player units, opposing actors, terrain, objectives, turn order, resources, and mission state from the selected setup and map data

#### Scenario: Godot unit resolves a turn
- **WHEN** a Godot battle unit takes its turn
- **THEN** the unit SHALL support movement, primary action, optional item/tool interaction where configured, facing confirmation, and turn completion according to the MVP rules

### Requirement: Godot movement SHALL use logical grid and height data
The Godot battle prototype SHALL determine reachable tiles from logical grid data using Move range, Jump tolerance, occupancy, terrain passability, and objective blockers before presenting movement previews.

#### Scenario: Reachable tiles are previewed
- **WHEN** the player selects movement for an active unit
- **THEN** the Godot board SHALL highlight only tiles reachable by the unit's Move and Jump constraints

#### Scenario: Tile selection is confirmed
- **WHEN** the player confirms a highlighted destination
- **THEN** the unit SHALL move to the matching logical tile and the visual unit position SHALL stay anchored to that tile

### Requirement: Godot combat SHALL expose positional tactics
The Godot battle prototype SHALL resolve attacks and skills with readable effects from facing, height, range, line/area targeting where configured, statuses, and knockback.

#### Scenario: Rear or side attack is resolved
- **WHEN** a Godot unit attacks a target from the target's side or rear arc
- **THEN** the combat resolver SHALL apply the configured positional benefit and the UI SHALL communicate the attack result

#### Scenario: Knockback changes position
- **WHEN** a Godot action applies knockback
- **THEN** the target SHALL be pushed according to grid, obstacle, edge, and height/fall rules and the resulting position/effect SHALL be visible to the player

### Requirement: Godot battle SHALL include local AI opponents
The Godot battle prototype SHALL include nonplayer turn planning sufficient to complete local prototype battles without online multiplayer.

#### Scenario: AI unit becomes active
- **WHEN** an AI-controlled unit reaches its turn
- **THEN** it SHALL choose and execute a valid movement/action plan based on available targets, objectives, and tactical opportunity

### Requirement: Godot battle SHALL provide outcome closure
The Godot battle prototype SHALL reach a clear result through mission success, defeat, extraction, objective completion, or escalating endgame pressure.

#### Scenario: Extraction succeeds
- **WHEN** the player's eligible units satisfy extraction requirements
- **THEN** the battle SHALL resolve to an extraction outcome and pass reward/loss summary data to the result or loot flow

#### Scenario: Endgame pressure escalates
- **WHEN** battle duration or turn count reaches the configured late threshold
- **THEN** the Godot battle SHALL apply escalating pressure until the encounter resolves within the prototype time target
