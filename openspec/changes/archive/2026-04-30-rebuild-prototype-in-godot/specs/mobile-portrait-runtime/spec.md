## ADDED Requirements

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
