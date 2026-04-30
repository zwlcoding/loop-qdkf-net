## ADDED Requirements

### Requirement: Tactical battle presentation SHALL distinguish action affordances
The tactical battle presentation SHALL visually distinguish movement destinations, selected path, action range, legal targets, and invalid command feedback so players can understand available actions without reading debug-only output.

#### Scenario: Action range differs from legal target
- **WHEN** a selected action has tiles in range but no legal target on some of those tiles
- **THEN** the presentation SHALL show range context with lower emphasis than legal targets and SHALL prevent players from mistaking range-only tiles for executable targets

#### Scenario: Multiple action categories exist
- **WHEN** the battle supports movement, basic attacks, skills, tools, and combos
- **THEN** each action category SHALL have distinguishable presentation through color, outline, glyph, label, or another non-color cue

#### Scenario: Feedback overlaps board occupants
- **WHEN** action feedback overlaps terrain height, objectives, or unit occupants
- **THEN** the presentation SHALL preserve the logical occupant and still make the action affordance readable
