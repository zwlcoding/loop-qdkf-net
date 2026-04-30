# Spec Update: rift-dungeon-core

## MODIFIED Requirements

### Requirement: Battles SHALL resolve as unit-based squad turns

The system SHALL resolve battles in unit-based squad turns, with each unit taking actions in sequence. After battle completion, the system SHALL transition to the loot scene instead of directly to the result scene.

#### Scenario: Battle completion
- **WHEN** all enemies are defeated
- **THEN** the system SHALL mark the battle as won and transition to the loot scene

#### Scenario: Battle defeat
- **WHEN** all player units are defeated
- **THEN** the system SHALL mark the battle as lost and transition to the result scene

### Requirement: Battles SHALL force closure within the mobile match-time target

The system SHALL enforce a turn limit to ensure battles complete within a reasonable mobile session time.

#### Scenario: Turn limit reached
- **WHEN** the turn limit is reached
- **THEN** the system SHALL end the battle and award partial rewards based on progress
