## ADDED Requirements

### Requirement: Godot battle SHALL implement CT readiness through battle state
The Godot battle system SHALL replace static speed-sorted turn cycling with battle-state CT/readiness data that is deterministic in fixtures and drives active-unit selection.

#### Scenario: CT order is deterministic
- **WHEN** a deterministic Godot fixture initializes units with configured speed and readiness defaults
- **THEN** repeated runs SHALL produce the same first acting units and the same post-wait readiness ordering

#### Scenario: Wait changes next readiness
- **WHEN** the active Godot unit waits without movement or primary action
- **THEN** that unit SHALL receive the configured wait recovery and diagnostics or HUD turn order SHALL update to show the changed upcoming order

### Requirement: Godot battle SHALL provide a facing-confirmation state
The Godot battle system SHALL expose a player-facing confirmation step for final facing and SHALL use the confirmed direction in later combat resolution.

#### Scenario: Player ends turn with facing choice
- **WHEN** a human-controlled unit taps wait or otherwise completes its turn
- **THEN** the battle UI SHALL show a compact four-direction facing choice or equivalent board control before advancing to the next active unit

#### Scenario: Facing is visible without sprite art
- **WHEN** a unit is displayed on the board
- **THEN** the board SHALL show a readable base arrow, arc marker, or equivalent non-sprite indicator for the unit's current facing

### Requirement: Godot combat SHALL resolve and report hit chance
The Godot battle system SHALL calculate, preview, resolve, and report hit chance for offensive actions using the same tactical modifiers in preview and execution.

#### Scenario: Preview and execution use same hit inputs
- **WHEN** a player previews an attack against a visible legal target
- **THEN** the forecast SHALL show hit chance computed from the same action, attacker, defender, facing, height, cover, visibility, status, and module data used during execution

#### Scenario: Deterministic miss is reported
- **WHEN** a seeded or deterministic test run causes an action to miss
- **THEN** the Godot battle SHALL leave damage and hostile effects unapplied and SHALL record miss feedback in the normal event/log path

### Requirement: Godot grid SHALL evaluate visibility and battlefield objects
The Godot battle system SHALL load or derive battlefield object data and visibility state so movement, target preview, line of sight, projectile legality, and board rendering use the same logical blockers.

#### Scenario: Unseen enemy is not a legal target
- **WHEN** an enemy is outside the active unit's current visibility
- **THEN** target preview SHALL NOT include that enemy even if the enemy is within raw action range

#### Scenario: Tree blocks projectile line
- **WHEN** a visible target is within raw range but a tree object blocks projectile path
- **THEN** ranged target preview SHALL reject the target or show obstruction feedback unless the selected module can arc over, pierce, destroy, or ignore the tree

### Requirement: Godot water terrain SHALL support action lockout
The Godot battle system SHALL support terrain data that allows units to stand on water while blocking configured actions from that tile.

#### Scenario: Water move is legal but attack is blocked
- **WHEN** a unit can move onto a standable water tile and then attempts a non-exempt attack from that tile
- **THEN** movement SHALL resolve normally and the attack SHALL be rejected with terrain-based feedback
