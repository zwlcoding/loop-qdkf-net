## ADDED Requirements

### Requirement: Tactical battles SHALL use CT tempo for unit readiness
The tactical battle system SHALL determine acting units through a lightweight CT/readiness model where speed advances readiness and completed commands apply recovery costs that affect when a unit acts again.

#### Scenario: Faster unit becomes ready sooner
- **WHEN** two living units have equal readiness and different speed values
- **THEN** the unit with higher speed SHALL reach the action threshold sooner unless affected by status, terrain, or rule modifiers

#### Scenario: Wait has lower recovery than full action
- **WHEN** a unit ends its turn by waiting without spending movement or primary action
- **THEN** the system SHALL apply a lower recovery cost than a turn that includes movement plus primary action, causing the waiting unit to return to readiness earlier under equal speed conditions

### Requirement: Tactical battles SHALL require explicit end-facing for player units
The tactical battle system SHALL let a player choose a unit's final facing before the turn fully ends, and that facing SHALL affect later front, side, and rear attack calculations.

#### Scenario: Player confirms final facing
- **WHEN** a player-controlled unit is ready to end its turn
- **THEN** the system SHALL offer north, east, south, and west facing choices and SHALL store the selected facing before advancing to the next acting unit

#### Scenario: AI selects facing automatically
- **WHEN** an AI-controlled unit ends its turn
- **THEN** the system SHALL choose a legal final facing using tactical context such as nearby threats, objective direction, or fallback current facing

### Requirement: Tactical combat SHALL resolve hit chance before effects
The tactical battle system SHALL calculate hit chance for attacks and offensive skills before applying damage, status, knockback, or combo follow-up effects.

#### Scenario: Hit chance uses tactical modifiers
- **WHEN** an action previews or resolves against a target
- **THEN** hit chance SHALL account for configured base accuracy, target facing arc, height difference, cover, visibility or line of sight, statuses, and module-specific modifiers

#### Scenario: Attack misses
- **WHEN** an offensive action fails its hit check
- **THEN** the system SHALL report a miss and SHALL NOT apply that action's damage, hostile status, knockback, or hostile combo follow-up effects unless the module explicitly defines a miss effect

### Requirement: Water tiles SHALL allow standing while restricting actions
The tactical battle system SHALL support water or similar terrain that can be entered and occupied while blocking configured action categories from units standing on that terrain.

#### Scenario: Unit stands in water
- **WHEN** a unit moves onto a water tile that is configured as standable
- **THEN** the unit SHALL occupy the tile and remain available for movement, turn order, facing, and visibility rules

#### Scenario: Unit attempts action from water
- **WHEN** a unit standing on an action-blocking water tile attempts a primary attack, skill, tool, or combo that is not explicitly allowed from that terrain
- **THEN** the system SHALL reject the command and show terrain-based invalid-action feedback

### Requirement: Obstacles SHALL affect tactical movement, sight, and ranged legality
The tactical battle system SHALL include battlefield obstacles in movement, visibility, projectile, and targeting legality without treating every obstacle as terrain.

#### Scenario: Obstacle blocks movement
- **WHEN** a tile contains an object configured to block movement
- **THEN** movement preview and pathfinding SHALL treat that tile as blocked unless a unit or module has an explicit bypass rule

#### Scenario: Obstacle blocks ranged attack
- **WHEN** a ranged action requires an unobstructed projectile path and an obstacle blocks that path
- **THEN** the action preview SHALL mark the target illegal or explain the obstruction before confirmation
