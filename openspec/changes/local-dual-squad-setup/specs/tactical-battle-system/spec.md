## MODIFIED Requirements

### Requirement: Tactical battles SHALL resolve as unit-based squad turns
The system SHALL run MVP battles as unit-by-unit tactical encounters between up to two squads, with each squad fielding up to three controllable units and optional neutral enemies, mission entities, or approved AI-controlled actors. Battles SHALL be startable from validated battle setup data instead of only hardcoded scene fixtures.

#### Scenario: Battle starts from setup data
- **WHEN** a local run is launched after squad setup is confirmed
- **THEN** the system SHALL initialize the battle from the selected squad setup data while preserving the same mission, AI, movement, action, and mobile-touch rules
