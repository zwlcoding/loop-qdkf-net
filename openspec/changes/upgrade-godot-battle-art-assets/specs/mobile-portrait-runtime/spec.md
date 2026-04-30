## ADDED Requirements

### Requirement: Portrait battle art SHALL remain readable and tappable
The system SHALL keep authored Godot battle art readable and touch-safe inside the portrait-first runtime shell without shrinking the tactical board into a decorative preview.

#### Scenario: Phone portrait battle starts
- **WHEN** a player opens the Godot battle scene on a common phone portrait viewport
- **THEN** terrain materials, unit silhouettes, team indicators, HP bars, and tactical highlights SHALL remain readable without desktop zooming

#### Scenario: Player taps authored terrain
- **WHEN** the player taps a visible tile after authored terrain art is enabled
- **THEN** pointer-to-tile conversion SHALL still select the intended logical tile using the same elevated board layout as rendering

#### Scenario: Runtime viewport changes
- **WHEN** the portrait viewport size changes after authored art has loaded
- **THEN** the battle board SHALL preserve centered map framing, readable art scale, and valid tile tapping after layout recomputation
