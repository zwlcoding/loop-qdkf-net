# Spec Update: rift-dungeon-core

## ADDED Requirements

### Requirement: The loot system SHALL present random module choices after battles

The system SHALL generate 3 random modules after each battle, allowing the player to select one to add to their inventory.

#### Scenario: Loot generation
- **WHEN** a battle is won
- **THEN** the system SHALL generate 3 random modules from the available pool, weighted by rarity (common 50%, uncommon 30%, rare 15%, epic 5%)

#### Scenario: Loot selection
- **WHEN** 3 modules are presented
- **THEN** the player SHALL be able to select one module to add to their inventory, or skip the loot entirely

#### Scenario: Module rarity
- **WHEN** a module is generated
- **THEN** the system SHALL assign it a rarity tier (common, uncommon, rare, epic) that affects its stats and drop rate

### Requirement: Modules SHALL have synergies based on chassis type

The system SHALL provide bonus effects when modules of the same chassis type are equipped together.

#### Scenario: Synergy detection
- **WHEN** a module is equipped
- **THEN** the system SHALL check for synergies with other equipped modules and display any active synergies

#### Scenario: Synergy bonus
- **WHEN** synergies are active
- **THEN** the system SHALL apply the synergy bonuses to the affected units' stats

### Requirement: The inventory SHALL have limited capacity

The system SHALL limit the number of modules a player can carry, forcing strategic decisions about which modules to keep.

#### Scenario: Inventory full
- **WHEN** the inventory is at capacity and the player selects a new module
- **THEN** the system SHALL prompt the player to discard an existing module to make room

#### Scenario: Inventory management
- **WHEN** the player views their inventory
- **THEN** the system SHALL display all equipped and unequipped modules with their stats and synergies
