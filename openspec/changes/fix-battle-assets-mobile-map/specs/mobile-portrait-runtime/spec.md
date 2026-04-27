## ADDED Requirements

### Requirement: Portrait battle maps SHALL be sized from the available battle viewport
The system SHALL calculate the tactical battle map size from the visible battle viewport between portrait HUD/guidance content and bottom log/action controls instead of fitting the isometric map against the entire scene height.

#### Scenario: Battle scene opens on a phone viewport
- **WHEN** the battle scene renders on a common phone portrait viewport
- **THEN** the system SHALL allocate a battle viewport between the HUD and action controls and size the isometric map from that area

#### Scenario: HUD or action bar occupies portrait space
- **WHEN** portrait HUD, log text, or action controls reserve vertical space
- **THEN** the tactical map SHALL remain centered in the remaining battle viewport and SHALL NOT shrink solely because the full scene height includes UI

### Requirement: Portrait battle tiles and units SHALL remain touch-readable
The system SHALL keep battle tiles, units, highlights, and target markers large enough for reliable touch interaction on phone portrait screens.

#### Scenario: Tile size is calculated for portrait
- **WHEN** the map layout is calculated for portrait battle
- **THEN** the tile size SHALL be clamped to a readable minimum and SHALL prefer map panning or viewport-aware positioning over shrinking below that minimum

#### Scenario: Player selects a tile on portrait
- **WHEN** the player taps a visible highlighted tile on a phone viewport
- **THEN** the pointer-to-tile mapping SHALL resolve to the same tile that is visually highlighted

### Requirement: Battle layout SHALL respond to viewport changes
The system SHALL recompute battle map sizing and UI positions when the mobile viewport changes due to resize, browser chrome changes, or orientation change.

#### Scenario: Phone viewport changes height
- **WHEN** the browser viewport height changes while the battle scene is active
- **THEN** the battle map and portrait HUD/action controls SHALL be repositioned from the updated viewport dimensions without leaving stale map scale or stale click coordinates
