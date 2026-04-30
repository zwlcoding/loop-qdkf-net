## ADDED Requirements

### Requirement: Godot previews SHALL explain hit chance and major modifiers
The Godot battle UI SHALL show hit chance for offensive previews and include the most important tactical modifiers affecting that chance.

#### Scenario: Facing modifies hit chance
- **WHEN** the player previews an attack against a target from the target's front, side, or rear arc
- **THEN** the forecast SHALL show hit chance and identify the relevant facing arc modifier in concise player-facing text

#### Scenario: Cover or height modifies hit chance
- **WHEN** cover, obstacle, or height changes the selected action's hit chance
- **THEN** the forecast SHALL include the adjusted hit chance and a concise reason such as cover, high ground, low ground, or blocked sight

### Requirement: Godot previews SHALL guide facing confirmation
The Godot battle UI SHALL make final-facing selection readable on mobile without depending on final unit sprite art.

#### Scenario: Facing confirmation is shown
- **WHEN** a human-controlled unit enters final-facing confirmation
- **THEN** the UI SHALL show north, east, south, and west choices and a visible board indicator for the currently selected facing

#### Scenario: Facing risk is visible
- **WHEN** a unit is selected or awaiting facing confirmation
- **THEN** the board or HUD SHALL expose enough front/side/rear information for the player to understand which direction will be vulnerable

### Requirement: Godot previews SHALL distinguish fog, sight, and projectile blockers
The Godot battle UI SHALL explain when a target or tile is unavailable because of current visibility, line of sight, projectile obstruction, or unexplored state.

#### Scenario: Target is hidden by fog
- **WHEN** a potential enemy target is outside current visibility
- **THEN** the UI SHALL avoid presenting it as a legal target and SHALL NOT require the player to infer hidden targets from debug-only output

#### Scenario: Projectile is blocked
- **WHEN** a selected ranged action cannot hit a visible target because an obstacle blocks the projectile path
- **THEN** the preview SHALL identify obstruction as the blocker instead of showing only a generic invalid-target message

### Requirement: Godot HUD SHALL show CT-driven upcoming order
The Godot battle HUD or diagnostics SHALL show the next several upcoming units from the CT/readiness model rather than only the current round's static speed sort.

#### Scenario: Wait updates upcoming order
- **WHEN** the active unit waits and receives lower recovery
- **THEN** the upcoming-order display SHALL refresh to reflect the unit's new readiness position
