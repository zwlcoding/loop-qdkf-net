# isometric-elevation-presentation Specification

## Purpose
TBD - created by archiving change enhance-isometric-elevation-camera. Update Purpose after archive.
## Requirements
### Requirement: Isometric terrain SHALL expose height through visible side walls
The system SHALL render battle terrain as elevated isometric tiles where top faces, exposed side walls, edge strokes, and contact shadows communicate tile height at gameplay scale.

#### Scenario: Raised tile borders lower tile
- **WHEN** a tile has greater height than a visible neighboring tile
- **THEN** the renderer SHALL draw a side wall along the exposed edge with height proportional to the height difference

#### Scenario: Raised tile borders equal height tile
- **WHEN** adjacent tiles have the same height
- **THEN** the renderer SHALL avoid drawing an internal wall between those tiles

#### Scenario: Raised tile borders map edge
- **WHEN** a raised tile edge has no neighboring tile because it is at the map boundary
- **THEN** the renderer SHALL draw the exposed side wall for that boundary edge

### Requirement: Terrain side walls SHALL use terrain-aware visual material
The system SHALL give exposed side walls terrain-aware color, value, and edge treatment so grass, forest, mountain, urban, and water boundaries remain visually distinct without mixing incompatible art styles.

#### Scenario: Mountain side wall is shown
- **WHEN** a mountain tile exposes a height edge
- **THEN** the side wall SHALL use rocky or earth-toned material distinct from the top-face texture

#### Scenario: Urban side wall is shown
- **WHEN** an urban tile exposes a height edge
- **THEN** the side wall SHALL use a harder stone or constructed material distinct from natural terrain

#### Scenario: Water border is shown
- **WHEN** land height exposes an edge next to water or an impassable lower tile
- **THEN** the side wall and water boundary SHALL remain readable without opaque square backgrounds

### Requirement: Elevation scale SHALL respond to tile size
The system SHALL derive rendered elevation height from the current tile size so high and low tiles remain readable after mobile layout and camera changes.

#### Scenario: Tile size changes
- **WHEN** the battle scene recalculates tile size for a viewport
- **THEN** one elevation level SHALL produce a proportional vertical offset and wall height rather than using a fixed pixel constant

#### Scenario: Height difference has multiple levels
- **WHEN** a tile is two or more levels higher than its visible neighbor
- **THEN** the side wall SHALL visibly represent the larger height difference

### Requirement: Tile anchors SHALL align all board objects to elevated top faces
The system SHALL expose a shared projection contract for tile top centers, ground centers, elevation offsets, and depth ordering so units and overlays visually correspond to their logical grid tile.

#### Scenario: Unit stands on an elevated tile
- **WHEN** a unit's logical coordinates are on a tile with height greater than zero
- **THEN** the unit sprite, shadow, HP bar, label, and selection feedback SHALL align to that tile's elevated top-face center

#### Scenario: Highlight is shown on an elevated tile
- **WHEN** movement, targeting, objective, or hazard feedback is shown for an elevated tile
- **THEN** the highlight SHALL appear on that tile's visible top face rather than at the unelevated grid footprint

#### Scenario: Unit overlaps side wall in isometric order
- **WHEN** a unit is visually near raised terrain and side walls
- **THEN** render depth SHALL keep the unit, shadow, HP bar, and label separated from terrain side faces and top faces

