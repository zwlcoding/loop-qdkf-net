## ADDED Requirements

### Requirement: Battle camera SHALL show a local portion of the tactical board
The system SHALL keep battle tiles at a readable gameplay scale and use a camera viewport to show a local portion of the tactical board instead of always fitting the entire board inside the screen.

#### Scenario: Battle starts on a large board
- **WHEN** the tactical board is larger than the visible battle viewport
- **THEN** the camera SHALL show only the local region around the initial battle focus while preserving readable tile and unit size

#### Scenario: Board is smaller than viewport
- **WHEN** the tactical board is smaller than the available battle viewport
- **THEN** the camera SHALL center the board without excessive empty scrolling space

### Requirement: Battle camera SHALL follow gameplay focus
The system SHALL move or snap the battle camera to relevant gameplay focus points such as the active unit, selected unit, movement destination, and attack target.

#### Scenario: Active turn changes
- **WHEN** a new unit becomes active
- **THEN** the camera SHALL focus that unit's tile within the battle viewport

#### Scenario: Player selects a unit
- **WHEN** the player selects a controllable unit outside or near the edge of the current camera view
- **THEN** the camera SHALL bring that unit into a readable position without moving HUD controls

#### Scenario: Player previews an action target
- **WHEN** the player previews movement, attack, or skill target tiles
- **THEN** the camera SHALL keep the actor and relevant target region visible when the board bounds allow it

### Requirement: Camera bounds SHALL be derived from rendered board bounds
The system SHALL calculate camera bounds from the projected isometric board, elevation height, object padding, and battle viewport size.

#### Scenario: Camera pans to board edge
- **WHEN** the focused unit or target is near the edge of the map
- **THEN** the camera SHALL clamp to board bounds without showing excessive empty space

#### Scenario: Viewport changes size
- **WHEN** the battle viewport changes due to mobile resize or orientation changes
- **THEN** camera bounds and current focus SHALL be recalculated from the updated viewport

### Requirement: Pointer input SHALL account for camera scroll
The system SHALL convert screen pointer coordinates through the active battle camera before resolving grid tiles.

#### Scenario: Player taps a highlighted tile after camera scroll
- **WHEN** the camera is scrolled away from the board origin and the player taps a visible highlighted tile
- **THEN** pointer-to-tile conversion SHALL resolve to the same logical tile that is visually highlighted

#### Scenario: Player taps outside visible board
- **WHEN** the player taps outside any visible board tile after camera movement
- **THEN** the system SHALL not select an unrelated tile from pre-camera coordinates

### Requirement: Battle UI SHALL remain stable while the map camera moves
The system SHALL keep HUD, logs, action controls, and debug overlays fixed in the screen UI layer while the tactical map camera scrolls underneath them.

#### Scenario: Camera follows active unit
- **WHEN** the battle camera moves to a new unit
- **THEN** HUD text, action buttons, logs, and bottom controls SHALL remain in their portrait layout positions
