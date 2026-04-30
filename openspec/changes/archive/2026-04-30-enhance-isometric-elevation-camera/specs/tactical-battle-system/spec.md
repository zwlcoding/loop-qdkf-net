## ADDED Requirements

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
