# Spec Update: tactical-battle-system

## Added Requirement: Battle units SHALL display HP bars

The system SHALL render a health bar above each战斗 unit showing current HP relative to maximum HP, with real-time updates on damage and death.

### Scenario: Unit takes damage
- **WHEN** a unit receives damage from an attack
- **THEN** the system SHALL update the unit's HP bar to reflect the new HP value with a smooth visual transition

### Scenario: Unit HP reaches zero
- **WHEN** a unit's HP is reduced to zero
- **THEN** the system SHALL play a death animation, then remove the unit and its HP bar from the battlefield

### Scenario: HP bar color changes
- **WHEN** a unit's HP drops below configured thresholds
- **THEN** the system SHALL change the HP bar color (green > 60%, yellow 30-60%, red < 30%)

### Scenario: Mobile HP bar visibility
- **WHEN** the battle is displayed on a phone portrait screen
- **THEN** the system SHALL render HP bars at a size that is clearly visible without obstructing touch controls

### Scenario: Damage number displayed on hit
 - **WHEN** a unit receives damage from an attack
 - **THEN** the system SHALL display a floating damage number at the target's position that animates upward and fades out

### Scenario: Critical or weak point hit
 - **WHEN** a unit receives bonus damage from a critical hit or positional weakness
 - **THEN** the system SHALL display the damage number in a larger, highlighted style

### Scenario: Attack misses
 - **WHEN** an attack fails to hit the target
 - **THEN** the system SHALL display a "Miss" indicator at the target's position
