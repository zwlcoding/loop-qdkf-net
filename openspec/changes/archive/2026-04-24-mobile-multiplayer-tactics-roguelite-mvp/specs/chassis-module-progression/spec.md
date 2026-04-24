## ADDED Requirements

### Requirement: Squad building SHALL use chassis plus modules instead of fixed jobs
The system SHALL define each unit by a chassis for baseline identity and by modules for tactical expression rather than by a fully locked class tree.

#### Scenario: Unit definition
- **WHEN** the game builds a unit for squad assembly
- **THEN** it SHALL combine one chassis definition with the currently equipped module set

#### Scenario: Build variation within one chassis
- **WHEN** two units share the same chassis but equip different modules
- **THEN** the system SHALL allow them to perform different tactical roles within MVP constraints

### Requirement: MVP SHALL ship with five chassis archetypes
The system SHALL provide a minimum of five chassis archetypes for MVP: vanguard, skirmisher, caster, support, and controller.

#### Scenario: Chassis list is presented
- **WHEN** the player opens squad setup in MVP
- **THEN** the available chassis list SHALL include the five approved archetypes

#### Scenario: Chassis identity
- **WHEN** a player selects a chassis
- **THEN** the system SHALL expose that chassis's baseline movement, jump, slot bias, and tactical role expectations

### Requirement: Modules SHALL be grouped into four functional categories
The system SHALL organize MVP modules into active, passive, combo, and tool categories.

#### Scenario: Module inventory is shown
- **WHEN** a player inspects available modules
- **THEN** each module SHALL belong to exactly one MVP module category

#### Scenario: Category-specific equip slot
- **WHEN** a player equips a module
- **THEN** the system SHALL require a matching slot category on the unit build

### Requirement: Each unit SHALL use a constrained MVP slot model
The system SHALL use a limited equip model so build depth exists without allowing unlimited loadouts.

#### Scenario: Default equip structure
- **WHEN** a fresh MVP unit is assembled
- **THEN** it SHALL support the default slot model of two active slots, one passive slot, one combo slot, and one tool slot unless chassis bias changes one of those counts within the approved MVP range

#### Scenario: Invalid over-capacity build
- **WHEN** a player attempts to equip more modules than the unit's slot limits allow
- **THEN** the system SHALL block the equip action

### Requirement: MVP progression SHALL keep run-time power light and post-run progression meaningful
The system SHALL reserve most lasting growth for post-run progression while keeping in-run progression short and readable.

#### Scenario: Post-run unlock
- **WHEN** a player completes runs and earns lasting rewards
- **THEN** the system SHALL unlock or improve chassis, modules, slot options, or related progression items according to MVP progression rules

#### Scenario: In-run enhancement
- **WHEN** a player gains temporary run upgrades during a match
- **THEN** those effects SHALL remain limited to that run unless explicitly converted through extraction payout rules

### Requirement: The build system SHALL be data-driven from MVP start
The system SHALL store chassis, module, mission-template-adjacent progression definitions, and related content in editable data definitions rather than hard-coding them into battle logic.

#### Scenario: Chassis data update
- **WHEN** a developer changes a chassis definition in the approved data source
- **THEN** the build system SHALL use the updated values without requiring battle-rule code changes for that chassis

#### Scenario: New module definition
- **WHEN** a developer adds a new valid module configuration to the approved data source
- **THEN** the system SHALL make that module available through the build pipeline subject to unlock rules and category validation
