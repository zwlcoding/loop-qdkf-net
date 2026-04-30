## ADDED Requirements

### Requirement: Battlefield visibility SHALL distinguish explored and currently visible tiles
The battlefield visibility system SHALL track explored tiles and currently visible tiles for each configured visibility group so dungeon encounters can reveal space through play without requiring pre-battle map previews.

#### Scenario: Tile becomes explored
- **WHEN** a unit gains current visibility over a tile for the first time
- **THEN** the system SHALL mark that tile as explored for that unit's visibility group and keep its terrain visible after current visibility is lost

#### Scenario: Enemy leaves current visibility
- **WHEN** an enemy unit is no longer inside current visibility for the observing visibility group
- **THEN** the system SHALL hide that enemy's live position and SHALL NOT allow that enemy to be directly targeted from normal target selection

### Requirement: Visibility sharing SHALL be mission configurable
The battlefield visibility system SHALL support visibility groups so cooperative squads, rival squads, and uncertain relationship phases can share or separate explored/current visibility according to mission setup.

#### Scenario: Cooperative squads share visibility
- **WHEN** mission setup assigns two squads to the same visibility group
- **THEN** tiles revealed by either squad SHALL be explored and currently visible for both squads in that group

#### Scenario: Rival squads keep visibility separate
- **WHEN** mission setup assigns squads to different visibility groups
- **THEN** each squad SHALL only receive explored and current visibility from its own group unless a rule or effect explicitly shares vision

### Requirement: Battlefield objects SHALL provide blocker metadata separate from terrain
The battlefield visibility system SHALL represent trees, walls, stones, crates, rift crystals, and similar map objects as battlefield objects with explicit movement, sight, projectile, targeting, durability, and destructibility metadata.

#### Scenario: Object blocks line of sight
- **WHEN** a sight ray between source and target crosses an object with `blocks_vision`
- **THEN** the target tile SHALL be treated as not currently visible from that source unless a rule or module ignores the blocker

#### Scenario: Object blocks projectile targeting
- **WHEN** a ranged or line projectile action crosses an object with `blocks_projectile`
- **THEN** the action SHALL be blocked or marked invalid unless the action is configured to arc over, pierce, destroy, or ignore that object

### Requirement: Destructible blockers SHALL be optional and targetable when configured
The battlefield visibility system SHALL allow blockers to be indestructible or destructible, and SHALL only expose direct attacks against blockers when the object is configured as targetable or damageable.

#### Scenario: Tree is destructible cover
- **WHEN** a tree object has durability and is configured as targetable
- **THEN** eligible attacks or skills SHALL be able to damage it and remove or change its blocker flags when durability reaches zero

#### Scenario: Wall is indestructible
- **WHEN** a wall object has blocker flags but no destructible configuration
- **THEN** normal combat actions SHALL NOT reduce or remove the wall unless a specific rule or module says otherwise
