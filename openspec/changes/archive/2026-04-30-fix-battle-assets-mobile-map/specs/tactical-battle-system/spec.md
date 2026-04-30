## ADDED Requirements

### Requirement: Tactical battle presentation SHALL preserve combat readability
The system SHALL render battle units, terrain, movement highlights, target highlights, HP bars, labels, and mission markers so the tactical state remains readable on the map.

#### Scenario: Battle starts with visual assets
- **WHEN** the battle scene creates the tactical map and units
- **THEN** terrain and unit sprites SHALL render without opaque asset backgrounds obscuring adjacent tiles, units, HP bars, labels, or highlights

#### Scenario: Unit overlaps terrain in isometric view
- **WHEN** a unit stands on an isometric tile with height, marker, or highlight overlays
- **THEN** the unit sprite, shadow, HP bar, and interaction feedback SHALL remain visually separated from the terrain art

#### Scenario: Missing battle art fallback is used
- **WHEN** an expected compliant battle texture is missing at runtime
- **THEN** the system SHALL use a consistent transparent placeholder or generated fallback rather than loading malformed or non-alpha art
