# Spec Update: rift-dungeon-core

## ADDED Requirements

### Requirement: A run SHALL consist of multiple rift layers

The system SHALL manage a run as a sequence of rift layers, tracking progress through the map and maintaining state across rooms.

#### Scenario: Run start
- **WHEN** the player starts a new run
- **THEN** the system SHALL initialize a fresh rift map, reset current layer to 0, and set starting resources (gold, modules)

#### Scenario: Layer progression
- **WHEN** the player completes a room
- **THEN** the system SHALL advance to the next layer if all rooms in the current layer are completed

#### Scenario: Run end
- **WHEN** the player defeats the final boss or is defeated
- **THEN** the system SHALL calculate run rewards, update meta-progression, and transition to the result scene

### Requirement: The system SHALL track run statistics

The system SHALL maintain statistics throughout a run for display at the end.

#### Scenario: Statistics tracking
- **WHEN** events occur during a run
- **THEN** the system SHALL track: rooms cleared, enemies defeated, damage dealt/taken, modules collected, gold earned, and layers completed

#### Scenario: Statistics display
- **WHEN** the run ends
- **THEN** the system SHALL display a summary of all tracked statistics

### Requirement: Players SHALL be able to abandon a run

The system SHALL allow the player to voluntarily end a run early, forfeiting current progress but keeping any meta-progression earned.

#### Scenario: Abandon run
- **WHEN** the player chooses to abandon the run
- **THEN** the system SHALL end the run, calculate partial rewards based on progress, and return to the main menu
