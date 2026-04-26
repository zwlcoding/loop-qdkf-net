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

