## ADDED Requirements

### Requirement: Portrait battle runtime SHALL prefer camera navigation over full-board fit
The system SHALL keep the tactical map at a readable tile and unit scale on phone portrait viewports by showing a camera-framed portion of the board instead of shrinking the full board to fit.

#### Scenario: Phone battle viewport is smaller than the board
- **WHEN** the battle board cannot fit in the portrait battle viewport at the readable tile size
- **THEN** the system SHALL keep the readable tile size and expose the rest of the board through camera movement

#### Scenario: Player changes active focus on phone
- **WHEN** the active unit, selected unit, movement destination, or attack target changes on a portrait viewport
- **THEN** the visible battle region SHALL move to keep the relevant gameplay focus readable without moving HUD controls

### Requirement: Portrait battle input SHALL target visible tiles after camera movement
The system SHALL keep touch input aligned with the camera-framed map region on mobile.

#### Scenario: Player taps a visible tile after camera follows a unit
- **WHEN** the battle camera has moved from the initial board origin and the player taps a visible tile on a phone
- **THEN** the touch SHALL resolve to that visible tile rather than a tile at the old unscrolled board coordinate

#### Scenario: Player uses bottom action controls while camera is offset
- **WHEN** the battle camera is offset and bottom action controls are visible
- **THEN** tapping action controls SHALL trigger UI actions rather than map tile selection underneath the controls
