## ADDED Requirements

### Requirement: Godot battle SHALL forecast selected action consequences
The Godot battle UI SHALL show expected consequences for the selected action and target before the player confirms attack, skill, tool, or combo commands.

#### Scenario: Attack forecast is shown
- **WHEN** the player selects a legal attack or harmful skill target
- **THEN** the UI SHALL show the action name and expected damage, status, line-of-sight, or knockback consequence known before confirmation

#### Scenario: Tool or heal forecast is shown
- **WHEN** the player selects a legal tool or healing target
- **THEN** the UI SHALL show the action name, expected healing or status effect, target rule, and use opportunity state before confirmation

#### Scenario: Combo forecast is shown
- **WHEN** the player selects a legal combo target
- **THEN** the UI SHALL show combo cost, expected damage or effect, and eligible participating allies before confirmation

### Requirement: Godot battle SHALL communicate resolved events visibly
The Godot battle scene SHALL communicate resolved player, AI, and pressure events with visible feedback beyond the debug panel.

#### Scenario: AI damages a player unit
- **WHEN** an AI-controlled unit damages a player unit
- **THEN** the battle UI SHALL show a readable event summary identifying source, action, target, and damage amount

#### Scenario: Healing or support resolves
- **WHEN** a heal, tool, shield, or support effect resolves
- **THEN** the battle UI SHALL show a readable event summary and a distinct healing or support visual cue

#### Scenario: Pressure damages units
- **WHEN** endgame pressure applies damage or forces battle closure
- **THEN** the battle UI SHALL identify pressure as the source instead of making HP loss appear unexplained

### Requirement: Godot battle SHALL provide lightweight combat visual feedback
The Godot board SHALL render short-lived visual cues for combat events using existing drawing/UI systems.

#### Scenario: Damage feedback appears
- **WHEN** a unit takes damage from an action
- **THEN** the board SHALL show floating damage text, target flash or tint, and a source-to-target cue when source and target are known

#### Scenario: Healing feedback appears
- **WHEN** a unit is healed
- **THEN** the board SHALL show floating healing text and a distinct healing cue at the target

#### Scenario: Combo feedback appears
- **WHEN** a combo resolves
- **THEN** the board SHALL show a combo-specific cue that distinguishes it from basic attacks and single-unit skills

### Requirement: Godot battle SHALL clarify unit roles during action selection
The Godot battle UI SHALL expose each active unit's role identity and default action niche using current chassis and module data.

#### Scenario: Active unit changes
- **WHEN** a new human-controlled unit becomes active
- **THEN** the HUD SHALL show a concise role/action summary for that unit based on its chassis and equipped modules

#### Scenario: Module summaries reinforce role
- **WHEN** the player cycles through skill, tool, or combo modules
- **THEN** the summaries SHALL communicate whether the unit is acting as damage, control, support, or combo initiator

### Requirement: Godot battle SHALL explain tool and combo usability
The Godot battle UI SHALL make tool and combo conditions understandable in normal play.

#### Scenario: Tool has no useful target
- **WHEN** tool mode is selected and no valid or useful target exists
- **THEN** the UI SHALL explain why the tool cannot currently help, such as no damaged ally, range, or spent opportunity

#### Scenario: Combo lacks participants or resource
- **WHEN** combo mode is selected and combo cannot resolve with the intended effect
- **THEN** the UI SHALL explain whether the blocker is combo resource, range, legal hostile target, or lack of eligible participants
