# Spec Update: mission-extraction-loop

## New Specification: Mission Extraction Loop

### Requirement: Players SHALL select missions before entering battle
The system SHALL provide a mission selection interface where players can choose available missions, view difficulty and rewards, and start a battle.

#### Scenario: Player selects a mission
- **WHEN** the player opens the mission selection screen
- **THEN** the system SHALL display a list of available missions with name, difficulty, and reward preview

#### Scenario: Mission is locked
- **WHEN** a mission has an unlock condition that is not met
- **THEN** the system SHALL display the mission as locked with the unlock requirement

#### Scenario: Player starts a mission
- **WHEN** the player selects an available mission and confirms
- **THEN** the system SHALL transition to the battle setup screen with the mission context

### Requirement: Players SHALL be able to extract from battle
The system SHALL allow players to end a battle early by extracting, with success determined by survival and mission objectives.

#### Scenario: Extraction becomes available
- **WHEN** the battle reaches the configured extraction turn
- **THEN** the system SHALL display an extraction button in the battle UI

#### Scenario: Player chooses to extract
- **WHEN** the player taps the extraction button
- **THEN** the system SHALL evaluate extraction success based on surviving units and mission objectives

#### Scenario: Extraction succeeds
- **WHEN** extraction is attempted with at least one surviving unit and mission objectives met
- **THEN** the system SHALL mark the mission as complete and proceed to reward settlement

#### Scenario: Extraction fails
- **WHEN** extraction is attempted with no surviving units or objectives not met
- **THEN** the system SHALL mark the mission as failed and show the failure screen

### Requirement: Mission rewards SHALL be calculated and displayed
The system SHALL calculate rewards based on mission difficulty, survival status, and objectives completed.

#### Scenario: Reward calculation
- **WHEN** a mission is completed successfully
- **THEN** the system SHALL calculate rewards including base rewards, difficulty bonus, and survival bonus

#### Scenario: Reward display
- **WHEN** rewards are calculated
- **THEN** the system SHALL display each reward type (resource, experience, unlock) with amounts

### Requirement: Game progress SHALL be persisted
The system SHALL save run progress to localStorage and restore it on subsequent sessions.

#### Scenario: Progress is saved
- **WHEN** a mission is completed or extracted from
- **THEN** the system SHALL save the current run progress including collected rewards and unlocked content

#### Scenario: Unfinished run exists
- **WHEN** the game starts with an unfinished run in progress
- **THEN** the system SHALL offer the player the option to continue the previous run

#### Scenario: Player continues a run
- **WHEN** the player chooses to continue an unfinished run
- **THEN** the system SHALL restore the saved progress and transition to the appropriate game phase
