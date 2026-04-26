# Spec Update: audio-visual-feedback

## MODIFIED Requirements

### Requirement: Battles SHALL provide audio-visual feedback for all combat actions

The system SHALL provide audio and visual feedback for combat actions so that attacks, skills, movement, and death feel responsive and readable.

#### Scenario: Melee attack
- **WHEN** a unit performs a melee attack
- **THEN** the system SHALL play a melee hit sound, spawn slash particles at the target, flash the target white, and apply screen shake on critical hits

#### Scenario: Ranged attack
- **WHEN** a unit performs a ranged attack
- **THEN** the system SHALL play a ranged hit sound and spawn projectile trail particles along the attack path

#### Scenario: Magic attack
- **WHEN** a unit performs a magic attack
- **THEN** the system SHALL play a magic cast sound and spawn magic spark particles at the target

#### Scenario: Unit death
- **WHEN** a unit's HP reaches zero
- **THEN** the system SHALL play a death sound and spawn death burst particles at the unit's position

#### Scenario: Skill activation
- **WHEN** a unit activates a skill
- **THEN** the system SHALL play a skill activation sound with appropriate visual feedback

#### Scenario: Movement
- **WHEN** a unit moves to a new tile
- **THEN** the system SHALL play a movement sound

#### Scenario: Battle background music
- **WHEN** a battle scene starts
- **THEN** the system SHALL begin playing battle background music on loop

#### Scenario: Menu background music
- **WHEN** the main menu or mission select scene is active
- **THEN** the system SHALL begin playing menu background music on loop

#### Scenario: UI interaction
- **WHEN** the player taps a button or UI element
- **THEN** the system SHALL play a UI click sound

#### Scenario: Scene transition
- **WHEN** the game transitions between scenes
- **THEN** the system SHALL fade out the current scene and fade in the next scene
