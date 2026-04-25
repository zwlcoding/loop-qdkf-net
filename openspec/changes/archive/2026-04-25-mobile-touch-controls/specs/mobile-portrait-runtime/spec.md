## MODIFIED Requirements

### Requirement: Portrait runtime HUD SHALL prioritize readability and tap safety
The system SHALL arrange mission HUD, action hints, logs, and other essential overlays so they remain readable, touch-safe, and do not block the main tactical interaction area on phone portrait widths.

#### Scenario: Essential battle HUD is shown on a phone
- **WHEN** the battle scene renders on a portrait-width device
- **THEN** the system SHALL keep the current mission state, active-unit guidance, and primary controls readable without covering a large portion of actionable battle tiles

#### Scenario: Secondary overlays are present on a phone
- **WHEN** logs, debug information, or other secondary overlays are shown on a portrait viewport
- **THEN** the system SHALL constrain, shorten, collapse, or reposition them so the main battle surface remains tappable
