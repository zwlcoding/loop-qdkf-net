# Spec Update: rift-dungeon-core

## ADDED Requirements

### Requirement: Players SHALL earn permanent upgrades between runs

The system SHALL allow players to spend resources earned during runs to purchase permanent upgrades that persist across runs.

#### Scenario: Resource earning
- **WHEN** a run ends
- **THEN** the system SHALL convert run rewards (gold, modules) into meta-progression currency (shards)

#### Scenario: Upgrade purchase
- **WHEN** the player visits the upgrade shop between runs
- **THEN** the system SHALL display available upgrades with costs and allow purchase if the player has sufficient shards

### Requirement: New content SHALL be unlocked through meta-progression

The system SHALL gate access to new modules, chassis types, and rift modifiers behind meta-progression milestones.

#### Scenario: Module unlocking
- **WHEN** the player reaches a meta-progression milestone
- **THEN** the system SHALL unlock new modules that can appear in loot drops

#### Scenario: Chassis unlocking
- **WHEN** the player completes specific run achievements
- **THEN** the system SHALL unlock new chassis types for use in future runs

### Requirement: Meta-progression SHALL be persisted across sessions

The system SHALL save all meta-progression data to local storage and load it on game start.

#### Scenario: Save meta-progression
- **WHEN** meta-progression changes occur
- **THEN** the system SHALL immediately persist the updated data to local storage

#### Scenario: Load meta-progression
- **WHEN** the game starts
- **THEN** the system SHALL load saved meta-progression data and apply all unlocked upgrades
