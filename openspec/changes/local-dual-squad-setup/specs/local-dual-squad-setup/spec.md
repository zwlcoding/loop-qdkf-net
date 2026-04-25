## ADDED Requirements

### Requirement: The prototype SHALL support a local two-squad setup flow before battle start
The system SHALL allow a player to prepare two local squads and launch a battle without editing hardcoded scene fixtures.

#### Scenario: Two squads are configured locally
- **WHEN** the player confirms a local pre-battle setup
- **THEN** the system SHALL produce two validated squads that can enter a mission-ready battle

### Requirement: The prototype SHALL summarize both squads' battle outcomes after a run
The system SHALL provide a lightweight result summary for both squads after a battle so the relationship model can be evaluated without digging through debug text.

#### Scenario: Battle ends
- **WHEN** a local battle reaches victory, defeat, extraction closure, or forced end state
- **THEN** the system SHALL show both squads' survival, extraction, objective completion, and payout conversion summary
