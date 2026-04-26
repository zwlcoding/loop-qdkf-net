# Spec Update: chassis-module-progression

## New Specification: Chassis Module Progression

### Requirement: Players SHALL configure unit loadouts before battle
The system SHALL provide a loadout configuration interface where players can select chassis types and equip modules for each unit.

#### Scenario: Player opens loadout screen
- **WHEN** the player enters the battle setup phase
- **THEN** the system SHALL display the loadout configuration interface with all squad units

#### Scenario: Player selects a chassis type
- **WHEN** the player chooses a chassis type for a unit
- **THEN** the system SHALL update the unit's base stats and available module slots

#### Scenario: Player equips a module
- **WHEN** the player selects a module for an empty slot
- **THEN** the system SHALL equip the module and apply its effects to the unit

#### Scenario: Player removes a module
- **WHEN** the player selects an equipped module
- **THEN** the system SHALL remove the module and revert its effects

### Requirement: Chassis types SHALL provide different base statistics
The system SHALL define multiple chassis types with distinct stat profiles and module slot configurations.

#### Scenario: Light chassis selected
- **WHEN** a player selects a light chassis type
- **THEN** the unit SHALL receive high movement, low defense, and 3 module slots

#### Scenario: Heavy chassis selected
- **WHEN** a player selects a heavy chassis type
- **THEN** the unit SHALL receive low movement, high defense, and 4 module slots

#### Scenario: Balanced chassis selected
- **WHEN** a player selects a balanced chassis type
- **THEN** the unit SHALL receive moderate stats and 3 module slots

### Requirement: Modules SHALL provide stat bonuses and special abilities
The system SHALL support weapon, armor, skill, and utility modules that modify unit capabilities.

#### Scenario: Weapon module equipped
- **WHEN** a weapon module is equipped to a unit
- **THEN** the system SHALL increase the unit's attack stat or add special attack effects

#### Scenario: Armor module equipped
- **WHEN** an armor module is equipped to a unit
- **THEN** the system SHALL increase the unit's defense stat or add resistance effects

#### Scenario: Skill module equipped
- **WHEN** a skill module is equipped to a unit
- **THEN** the system SHALL unlock an active or passive ability for that unit

#### Scenario: Module effects stack
- **WHEN** multiple modules with different effect types are equipped
- **THEN** the system SHALL apply all effects additively

#### Scenario: Duplicate module effects
- **WHEN** multiple modules with the same effect type are equipped
- **THEN** the system SHALL apply only the highest value effect (no stacking)

### Requirement: Chassis and modules SHALL be unlockable through gameplay
The system SHALL restrict certain chassis types and modules behind unlock conditions obtained from mission rewards.

#### Scenario: Chassis is locked
- **WHEN** a chassis type has not been unlocked
- **THEN** the system SHALL display it as locked with the unlock requirement

#### Scenario: Module is locked
- **WHEN** a module has not been unlocked
- **THEN** the system SHALL display it as locked and unavailable for equipping

#### Scenario: Unlock from mission reward
- **WHEN** a mission reward includes a chassis or module unlock
- **THEN** the system SHALL add the unlocked item to the player's available pool
