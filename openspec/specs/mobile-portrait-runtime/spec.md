# mobile-portrait-runtime Specification

## Purpose
TBD - created by archiving change mobile-portrait-pages-preview. Update Purpose after archive.
## Requirements
### Requirement: The prototype SHALL run in a portrait-first mobile shell
The system SHALL treat a phone portrait viewport as the primary runtime target for the prototype rather than assuming a desktop-first browser window.

#### Scenario: Prototype loads on a phone
- **WHEN** a player opens the prototype on a common mobile portrait browser viewport
- **THEN** the system SHALL present the game inside a bounded portrait layout that keeps the core battle surface and primary HUD readable without desktop zooming

#### Scenario: Viewport changes size
- **WHEN** the mobile viewport changes due to browser chrome, resize, or orientation changes
- **THEN** the runtime shell SHALL recompute layout and preserve a usable portrait presentation instead of leaving stale desktop positioning

### Requirement: Portrait runtime HUD SHALL prioritize readability and tap safety
The system SHALL arrange mission HUD, action hints, logs, and other essential overlays so they remain readable, touch-safe, and do not block the main tactical interaction area on phone portrait widths.

#### Scenario: Essential battle HUD is shown on a phone
- **WHEN** the battle scene renders on a portrait-width device
- **THEN** the system SHALL keep the current mission state, active-unit guidance, and primary controls readable without covering a large portion of actionable battle tiles

#### Scenario: Secondary overlays are present on a phone
- **WHEN** logs, debug information, or other secondary overlays are shown on a portrait viewport
- **THEN** the system SHALL constrain, shorten, collapse, or reposition them so the main battle surface remains tappable

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

### Requirement: Godot prototype SHALL run in a portrait-first mobile layout
The Godot prototype SHALL treat phone portrait as the primary layout target and SHALL keep its battle surface, menus, HUD, and touch controls usable within portrait viewport constraints.

#### Scenario: Godot prototype loads in portrait dimensions
- **WHEN** the Godot prototype runs at a common phone portrait viewport size
- **THEN** the current scene SHALL preserve readable primary content, touch-sized controls, and safe margins without requiring desktop-style zooming

#### Scenario: Godot battle uses reserved viewport space
- **WHEN** the Godot battle scene lays out mission HUD, tactical board, logs, and action controls
- **THEN** the tactical board SHALL receive a reserved interactive viewport instead of being covered by primary HUD or action controls

### Requirement: Godot prototype SHALL tolerate viewport changes
The Godot prototype SHALL recompute layout when the window, device viewport, or orientation-compatible portrait size changes.

#### Scenario: Viewport size changes
- **WHEN** the Godot window or exported viewport changes size during a scene
- **THEN** the scene SHALL update control anchors, board framing, and touch regions without leaving stale positions from the previous size

