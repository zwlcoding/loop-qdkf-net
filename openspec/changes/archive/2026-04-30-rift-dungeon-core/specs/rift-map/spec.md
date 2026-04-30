# Spec Update: rift-dungeon-core

## ADDED Requirements

### Requirement: The rift map SHALL be a randomly generated directed acyclic graph

The system SHALL generate a rift map as a DAG where each node represents a room and edges represent paths between rooms. The map SHALL have 5-10 layers, with each layer containing 2-3 rooms.

#### Scenario: Map generation
- **WHEN** a new run starts
- **THEN** the system SHALL generate a rift map with 5-10 layers, each containing 2-3 rooms, and ensure every room in layer N connects to at least one room in layer N+1

#### Scenario: Room types
- **WHEN** rooms are generated
- **THEN** each room SHALL be assigned one of the following types: battle, elite, shop, event, or treasure, with distribution weighted toward battles (50%), elites (15%), shops (10%), events (15%), treasures (10%)

### Requirement: Players SHALL select a path through the rift map

The system SHALL display the rift map and allow the player to choose which room to enter next from the available connections.

#### Scenario: Path selection
- **WHEN** the player completes a room
- **THEN** the system SHALL highlight the next available rooms and wait for the player to select one

#### Scenario: Room entry
- **WHEN** the player selects a room
- **THEN** the system SHALL transition to the appropriate scene (BattleScene for battle/elite, ShopScene for shop, EventScene for event, LootScene for treasure)

### Requirement: The rift map SHALL persist across rooms within a run

The system SHALL maintain the rift map state throughout a run, tracking which rooms have been visited and the player's current position.

#### Scenario: Map persistence
- **WHEN** the player enters a room
- **THEN** the system SHALL mark that room as visited and update the player's current position on the map

#### Scenario: Map display
- **WHEN** the player views the rift map
- **THEN** the system SHALL show the full map with visited rooms marked, current position highlighted, and available next paths indicated
