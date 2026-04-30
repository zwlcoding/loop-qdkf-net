## ADDED Requirements

### Requirement: Godot combat feedback SHALL explain resolved tactical effects
The Godot battle system SHALL expose resolved tactical effects to normal battle feedback so players can understand damage, healing, statuses, knockback, combo participation, and AI actions without opening diagnostics.

#### Scenario: Action result records source and target
- **WHEN** an attack, skill, tool, heal, or combo resolves
- **THEN** the result feedback SHALL include the acting unit, target unit, action label, and primary numeric or status outcome

#### Scenario: Knockback or status is applied
- **WHEN** an action applies knockback or status
- **THEN** the result feedback SHALL mention the knockback or status in the normal log, banner, or action summary

#### Scenario: AI action is resolved through same feedback path
- **WHEN** an AI-controlled unit resolves a legal plan
- **THEN** the same player-facing feedback path SHALL identify what the AI did and which player-visible unit changed
