# godot-parity-verification Specification

## Purpose
TBD - created by archiving change rework-godot-tactical-parity. Update Purpose after archive.
## Requirements
### Requirement: Godot parity work SHALL include deterministic battle fixtures
The Godot project SHALL include deterministic fixtures that exercise tactical movement, opposing actors, AI turns, targeting, mission objectives, extraction, pressure, and result routing.

#### Scenario: Quick parity fixture loads
- **WHEN** the quick parity fixture is loaded from Godot tools or the battle scene
- **THEN** it SHALL create a repeatable encounter with known human units, AI units, terrain heights, blockers, objectives, and expected first-turn legal previews

#### Scenario: Fixture data is invalid
- **WHEN** fixture data is missing required ids, units, map cells, or objectives
- **THEN** validation SHALL report all detected fixture errors before the encounter starts

### Requirement: Verification SHALL cover reported acceptance regressions
The Godot verification checklist SHALL explicitly test that movement cannot be chained, enemies are visible and active, diagnostics are available, legal previews constrain input, and battle outcome closure works.

#### Scenario: Movement chaining is tested
- **WHEN** a smoke check moves an active unit once and then attempts a second move in the same turn
- **THEN** the second move SHALL fail and the unit SHALL remain at the first destination

#### Scenario: Enemy presence is tested
- **WHEN** a smoke check starts the parity fixture
- **THEN** at least one AI-controlled opposing unit SHALL be present in battle state, visible on the board, present in turn order, and reported by diagnostics

#### Scenario: Diagnostics availability is tested
- **WHEN** a smoke check or manual reviewer toggles diagnostics
- **THEN** diagnostics SHALL show turn order, active unit, tile state, combo/resource state, mission/extraction state, and recent log entries

### Requirement: Verification SHALL distinguish domain checks from visual review
The Godot parity work SHALL include both non-visual domain checks for rule legality and manual visual review notes for board/HUD readability.

#### Scenario: Domain smoke check runs
- **WHEN** the Godot smoke check script runs headlessly or through the editor
- **THEN** it SHALL assert battle-state invariants without requiring visual inspection

#### Scenario: Manual portrait review is completed
- **WHEN** the reviewer follows the documented portrait smoke path
- **THEN** the reviewer SHALL verify that board highlights, units, enemies, HUD, diagnostics, and action controls are readable and do not overlap at the supported phone viewport size

