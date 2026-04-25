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
The system SHALL arrange mission HUD, action hints, logs, and other essential overlays so they remain readable and do not block the main tactical interaction area on phone portrait widths.

#### Scenario: Essential information is shown on a phone
- **WHEN** the battle scene renders on a portrait-width device
- **THEN** the system SHALL keep the current mission state, active-unit guidance, and late-game pressure readable without overlapping critical action targets

#### Scenario: Non-essential overlays are present
- **WHEN** debug or secondary informational overlays are enabled on a phone portrait viewport
- **THEN** the system SHALL keep them collapsed, repositioned, or otherwise constrained so the main battle surface remains usable

