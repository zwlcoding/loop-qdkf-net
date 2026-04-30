## ADDED Requirements

### Requirement: Godot targeting previews SHALL expose selected action context
The Godot battle system SHALL derive board previews and HUD summaries from the selected action category and selected module, so legal-rule-driven target previews are understandable during normal play.

#### Scenario: Selected module changes target preview
- **WHEN** the player changes the selected skill, tool, or combo module for the active unit
- **THEN** the target preview SHALL refresh using that module's team, range, line-of-sight, resource, and remaining-opportunity rules

#### Scenario: Preview counts are explained
- **WHEN** the HUD reports movement or target preview counts
- **THEN** it SHALL also identify the active mode or selected module that produced those counts

#### Scenario: Diagnostics and normal UI agree
- **WHEN** diagnostics are toggled on during a selected action mode
- **THEN** diagnostics and the normal HUD SHALL report consistent active mode, selected module, legal target count, and invalid-command reason
