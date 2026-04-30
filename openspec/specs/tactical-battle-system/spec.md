# tactical-battle-system Specification

## Purpose
TBD - created by archiving change mobile-multiplayer-tactics-roguelite-mvp. Update Purpose after archive.
## Requirements
### Requirement: Tactical battles SHALL resolve as unit-based squad turns
The system SHALL run MVP battles as unit-by-unit tactical encounters between up to two squads, with each squad fielding up to three controllable units and optional neutral enemies, mission entities, or approved AI-controlled actors. Battles SHALL be startable from validated battle setup data instead of only hardcoded scene fixtures.

#### Scenario: Battle starts from setup data
- **WHEN** a local run is launched after squad setup is confirmed
- **THEN** the system SHALL initialize the battle from the selected squad setup data while preserving the same mission, AI, movement, action, and mobile-touch rules

### Requirement: Movement SHALL use Move and Jump to determine reachable tiles
The system SHALL determine movement by combining horizontal range with vertical traversal limits so terrain height changes alter pathing and route quality.

#### Scenario: Tile is reachable
- **WHEN** a player previews movement for a unit and a target tile is within Move range and every traversed height step is within Jump tolerance
- **THEN** the tile SHALL be shown as reachable

#### Scenario: Height blocks movement
- **WHEN** a path requires crossing a height difference greater than the unit's Jump value
- **THEN** the system SHALL mark that path and destination as unreachable

### Requirement: Facing SHALL affect combat resolution
The system SHALL evaluate attacks against the target's current facing and apply stronger positional benefits for side and rear attacks than for frontal attacks.

#### Scenario: Frontal attack
- **WHEN** an attacker targets the defender from the defender's front arc
- **THEN** the attack SHALL resolve with baseline positional modifiers

#### Scenario: Rear attack
- **WHEN** an attacker targets the defender from the defender's rear arc
- **THEN** the attack SHALL gain increased hit reliability or enhanced effect resolution compared with a frontal attack

### Requirement: Height SHALL provide tactical advantage without becoming the only winning condition
The system SHALL make height matter through pathing, sight, light combat modifiers, and fall risk rather than through overwhelming raw damage bonuses.

#### Scenario: High ground ranged attack
- **WHEN** a ranged unit attacks from a higher tile to a lower tile
- **THEN** the system SHALL apply the configured high-ground benefit such as improved line of sight, light range support, or light hit bonus

#### Scenario: Low ground disadvantage
- **WHEN** a unit attacks from a lower tile to a higher tile
- **THEN** the system SHALL apply the configured low-ground penalty used by the MVP combat rules

### Requirement: Combo actions SHALL be explicitly initiated and squad-coordinated
The system SHALL support active combo actions that consume a shared squad combat resource and allow eligible allies to join based on combo module rules.

#### Scenario: Combo initiation succeeds
- **WHEN** the acting unit spends the required shared combo resource and at least one ally meets combo participation conditions
- **THEN** the system SHALL resolve the initiator's combo action and all valid follow-up participants in sequence

#### Scenario: No ally can join
- **WHEN** the acting unit attempts to initiate a combo and no ally meets the participation requirements
- **THEN** the system SHALL either deny the combo or resolve only the initiator according to the configured MVP rule set

### Requirement: Knockback SHALL interact with terrain and objectives
The system SHALL treat knockback as positional control that can alter route access, objective control, and terrain outcomes.

#### Scenario: Knockback into blocked space
- **WHEN** a unit is knocked back and its path is interrupted by an obstacle or impassable tile
- **THEN** the system SHALL apply the configured collision consequence

#### Scenario: Knockback off elevation
- **WHEN** a unit is knocked from a higher tile to a lower tile with sufficient drop distance
- **THEN** the system SHALL apply the configured fall consequence such as bonus damage, stun, or forced reposition

### Requirement: MVP combat SHALL use a small, high-value status set
The system SHALL ship with only a limited set of readable tactical statuses for MVP and avoid broad status bloat.

#### Scenario: Status is applied
- **WHEN** a skill or effect applies an MVP status such as slow, root, vulnerable, shield, stun, or damage-over-time
- **THEN** the system SHALL show the status clearly and resolve its rules on the affected unit's future turns or damage checks

#### Scenario: Unsupported status family
- **WHEN** a design requests an unapproved advanced status family during MVP implementation
- **THEN** that status SHALL remain out of scope unless the spec is updated

### Requirement: Battles SHALL force closure within the mobile match-time target
The system SHALL include an endgame pressure system that pushes each match to resolution within the MVP time budget.

#### Scenario: Endgame pressure starts
- **WHEN** the match reaches its configured late-game threshold
- **THEN** the system SHALL begin escalating pressure through mechanics such as zone collapse, corruption spread, extraction countdown, or boss escalation

#### Scenario: Match exceeds safe duration
- **WHEN** players continue stalling after endgame pressure begins
- **THEN** the pressure system SHALL continue tightening until the battle reaches victory, defeat, or forced extraction outcome within the intended mobile session length

### Requirement: Battles SHALL provide audio-visual feedback for all combat actions

The system SHALL provide audio and visual feedback for combat actions so that attacks, skills, movement, and death feel responsive and readable.

#### Scenario: Melee attack
- **WHEN** a unit performs a melee attack
- **THEN** the system SHALL play a melee hit sound, spawn slash particles at the target, flash the target white, and apply screen shake on critical hits

#### Scenario: Ranged attack
- **WHEN** a unit performs a ranged attack
- **THEN** the system SHALL play a ranged hit sound and spawn projectile trail particles along the attack path

#### Scenario: Magic attack
- **WHEN** a unit performs a magic attack
- **THEN** the system SHALL play a magic cast sound and spawn magic spark particles at the target

#### Scenario: Unit death
- **WHEN** a unit's HP reaches zero
- **THEN** the system SHALL play a death sound and spawn death burst particles at the unit's position

#### Scenario: Skill activation
- **WHEN** a unit activates a skill
- **THEN** the system SHALL play a skill activation sound with appropriate visual feedback

#### Scenario: Movement
- **WHEN** a unit moves to a new tile
- **THEN** the system SHALL play a movement sound

#### Scenario: Battle background music
- **WHEN** a battle scene starts
- **THEN** the system SHALL begin playing battle background music on loop

#### Scenario: Menu background music
- **WHEN** the main menu or mission select scene is active
- **THEN** the system SHALL begin playing menu background music on loop

#### Scenario: UI interaction
- **WHEN** the player taps a button or UI element
- **THEN** the system SHALL play a UI click sound

#### Scenario: Scene transition
- **WHEN** the game transitions between scenes
- **THEN** the system SHALL fade out the current scene and fade in the next scene

### Requirement: Tactical battle presentation SHALL visually match logical tile occupancy
The system SHALL render units and board feedback so every visible combat object corresponds to its logical tile, elevation, and turn state.

#### Scenario: Unit is placed on a tile
- **WHEN** a unit is initialized or moved to logical coordinates `(x, y)`
- **THEN** the unit sprite, base shadow, HP bar, label, selection indicator, and target marker SHALL appear anchored to the same visible tile top face

#### Scenario: Unit moves across elevation
- **WHEN** a unit moves between tiles with different heights
- **THEN** the unit's visual path and final resting position SHALL reflect the elevated tile centers used by the board renderer

#### Scenario: Board feedback appears under a unit
- **WHEN** movement, targeting, mission, hazard, or path feedback overlaps a tile occupied by a unit
- **THEN** the feedback SHALL remain readable while preserving the unit as the clear occupant of that tile

### Requirement: Tactical battle presentation SHALL make height readable during combat
The system SHALL present terrain height differences clearly enough that movement, jump limits, range decisions, and high-ground modifiers can be understood from the battlefield view.

#### Scenario: Movement preview crosses a cliff
- **WHEN** movement preview includes tiles separated by a height difference greater than the unit's jump limit
- **THEN** the visual board SHALL show the relevant height break as an elevated edge or wall

#### Scenario: High-ground unit attacks lower target
- **WHEN** a unit attacks from a higher tile to a lower tile
- **THEN** the board presentation SHALL make the relative elevation apparent without requiring the player to read debug text

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

### Requirement: Tactical battle presentation SHALL distinguish action affordances
The tactical battle presentation SHALL visually distinguish movement destinations, selected path, action range, legal targets, and invalid command feedback so players can understand available actions without reading debug-only output.

#### Scenario: Action range differs from legal target
- **WHEN** a selected action has tiles in range but no legal target on some of those tiles
- **THEN** the presentation SHALL show range context with lower emphasis than legal targets and SHALL prevent players from mistaking range-only tiles for executable targets

#### Scenario: Multiple action categories exist
- **WHEN** the battle supports movement, basic attacks, skills, tools, and combos
- **THEN** each action category SHALL have distinguishable presentation through color, outline, glyph, label, or another non-color cue

#### Scenario: Feedback overlaps board occupants
- **WHEN** action feedback overlaps terrain height, objectives, or unit occupants
- **THEN** the presentation SHALL preserve the logical occupant and still make the action affordance readable

