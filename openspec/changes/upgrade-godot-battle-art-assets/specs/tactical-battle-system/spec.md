## ADDED Requirements

### Requirement: Tactical battle readability SHALL be preserved with authored art
The system SHALL preserve tactical readability for movement, targeting, elevation, unit state, and objective state when authored Godot battle art replaces prototype procedural terrain and unit shapes.

#### Scenario: Movement preview remains readable
- **WHEN** the player selects movement mode with authored terrain art enabled
- **THEN** reachable tiles, selected paths, selected tiles, and blocked tiles SHALL remain visually distinguishable from the underlying terrain art

#### Scenario: Targeting preview remains readable
- **WHEN** the player selects attack, skill, tool, or combo mode with authored terrain and unit art enabled
- **THEN** valid target tiles SHALL remain visually distinguishable from movement highlights, objective markers, and terrain material details

#### Scenario: Unit state remains readable
- **WHEN** multiple living units are visible on the board with authored unit art enabled
- **THEN** the active unit, team ownership, facing direction, label, shadow, and HP bar SHALL remain readable at gameplay scale

#### Scenario: Elevation remains readable
- **WHEN** adjacent terrain cells have different heights with authored tile art enabled
- **THEN** the visible top faces, exposed sides, and unit anchors SHALL still communicate the logical height difference used by movement and targeting rules
