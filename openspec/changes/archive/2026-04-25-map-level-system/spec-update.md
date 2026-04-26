# Spec Update: map-level-system

## New Specification: Map Level System

### Requirement: The system SHALL support multiple terrain types with distinct effects
The system SHALL define terrain types that affect movement cost, cover value, and vision blocking.

#### Scenario: Unit moves through平原
- **WHEN** a unit moves through plain terrain
- **THEN** the system SHALL apply normal movement cost (1) with no cover or vision effects

#### Scenario: Unit moves through山地
- **WHEN** a unit moves through mountain terrain
- **THEN** the system SHALL apply increased movement cost (2) and provide medium cover

#### Scenario: Unit moves through城市
- **WHEN** a unit moves through urban terrain
- **THEN** the system SHALL apply normal movement cost (1) and provide high cover with vision blocking

#### Scenario: Unit moves through森林
- **WHEN** a unit moves through forest terrain
- **THEN** the system SHALL apply normal movement cost (1) with medium cover and partial vision blocking

#### Scenario: Unit moves through水域
- **WHEN** a unit moves through water terrain
- **THEN** the system SHALL apply high movement cost (3) or block movement entirely

### Requirement: Maps SHALL have varied layouts with tactical elements
The system SHALL provide multiple map layouts with different sizes, terrain distributions, and objective placements.

#### Scenario: Map selection
- **WHEN** the player enters map selection
- **THEN** the system SHALL display available maps with preview, terrain distribution, and difficulty

#### Scenario: Map is locked
- **WHEN** a map has an unlock condition that is not met
- **THEN** the system SHALL display the map as locked with the unlock requirement

#### Scenario: Map contains destructible elements
- **WHEN** a map includes destructible tiles
- **THEN** the system SHALL allow those tiles to be destroyed, altering terrain effects

### Requirement: Terrain SHALL affect combat mechanics
The system SHALL integrate terrain effects into movement, cover, and line-of-sight calculations.

#### Scenario: Movement cost calculation
- **WHEN** a unit calculates movement range
- **THEN** the system SHALL累加 path terrain costs and limit movement to available movement points

#### Scenario: Cover effect on accuracy
- **WHEN** an attacker targets a unit behind cover
- **THEN** the system SHALL reduce hit probability based on the cover value of intervening terrain

#### Scenario: Vision blocking
- **WHEN** a unit attempts to see through terrain that blocks vision
- **THEN** the system SHALL mark the obscured tiles as not visible

#### Scenario: Height advantage
- **WHEN** a unit attacks from higher elevation to lower elevation
- **THEN** the system SHALL apply the configured height advantage bonus

### Requirement: Maps SHALL be unlockable through gameplay progression
The system SHALL restrict certain maps behind unlock conditions obtained from mission completion.

#### Scenario: Map unlock from mission
- **WHEN** a player completes a mission that rewards a map unlock
- **THEN** the system SHALL add the map to the available pool

#### Scenario: Map preview shows unlock status
- **WHEN** the player views the map selection screen
- **THEN** the system SHALL clearly indicate locked maps and their unlock requirements
