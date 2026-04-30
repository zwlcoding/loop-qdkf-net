## ADDED Requirements

### Requirement: Tactical battle presentation SHALL attribute HP changes
The tactical battle presentation SHALL make HP loss or recovery attributable to a visible event source during normal play.

#### Scenario: HP changes from an action
- **WHEN** a unit's HP changes because of an attack, skill, tool, heal, or combo
- **THEN** the presentation SHALL show the source event and amount clearly enough that the player can tell why the HP bar changed

#### Scenario: HP changes from environment or pressure
- **WHEN** a unit's HP changes because of pressure, hazard, collapse, or another non-unit source
- **THEN** the presentation SHALL identify that non-unit source rather than implying a hidden attack

### Requirement: Tactical battle presentation SHALL sustain player engagement through turn feedback
The tactical battle presentation SHALL make each unit turn feel distinct and readable through active-unit, action-result, and recent-event feedback.

#### Scenario: Human unit becomes active
- **WHEN** a human-controlled unit starts its turn
- **THEN** the presentation SHALL reset to a clear initial action state and show which unit is acting and what its role/action niche is

#### Scenario: Enemy turn resolves
- **WHEN** an enemy-controlled turn resolves
- **THEN** the presentation SHALL preserve a recent-event summary long enough for the player to understand what happened after control returns
