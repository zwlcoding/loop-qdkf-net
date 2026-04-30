## ADDED Requirements

### Requirement: Godot action previews SHALL include expected consequences
Godot action previews SHALL include concise expected consequences for the selected module or action, in addition to range and legal target information.

#### Scenario: Consequence summary follows selected module
- **WHEN** the player changes the selected module
- **THEN** the action summary SHALL update expected damage, healing, status, knockback, cost, or participants for the new module

#### Scenario: Consequence summary follows selected target
- **WHEN** the player selects or hovers a legal target
- **THEN** the action summary SHALL identify that target and show target-specific expected consequences when available

### Requirement: Godot action previews SHALL explain tool and combo blockers
Godot action previews SHALL distinguish unavailable tools and combos from merely out-of-range targets.

#### Scenario: Tool blocker is shown
- **WHEN** tool mode has no legal target
- **THEN** the preview summary SHALL identify whether the tool opportunity is spent, no ally is eligible, or targets are out of range

#### Scenario: Combo blocker is shown
- **WHEN** combo mode has no legal target
- **THEN** the preview summary SHALL identify whether the blocker is combo resource, target legality, range, or participant availability
