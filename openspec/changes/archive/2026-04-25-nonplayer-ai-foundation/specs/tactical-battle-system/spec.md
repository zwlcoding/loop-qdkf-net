## MODIFIED Requirements

### Requirement: Tactical battles SHALL resolve as unit-based squad turns
The system SHALL run MVP battles as unit-by-unit tactical encounters between up to two squads, with each squad fielding up to three controllable units and optional neutral enemies, mission entities, or approved AI-controlled actors.

#### Scenario: AI-controlled unit takes a turn
- **WHEN** an AI-controlled squad unit, boss, or approved non-player actor becomes active on the timeline
- **THEN** the system SHALL resolve that turn through the shared planner while preserving the same movement, action, tool, and facing limits used by the battle system
