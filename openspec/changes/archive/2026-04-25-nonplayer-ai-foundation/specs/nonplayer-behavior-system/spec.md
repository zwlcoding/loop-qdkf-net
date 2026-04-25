# nonplayer-behavior-system Specification

## ADDED Requirements

### Requirement: Non-player tactical actors SHALL use a unified rule-scored planner
The system SHALL evaluate non-player decisions through a shared planner that scores legal candidate actions from a decision context instead of hard-coding separate battle AI paths for each actor type.

#### Scenario: Planner evaluates a non-player turn
- **WHEN** a bot squad unit, boss unit, or other approved non-player actor starts its turn
- **THEN** the system SHALL build a decision context, enumerate legal candidate actions, score them with the actor's current profile, and execute the highest-priority legal action

#### Scenario: Illegal action candidate is considered
- **WHEN** a candidate action violates movement, range, cooldown, targeting, or mission-state restrictions
- **THEN** the planner SHALL exclude that action from final selection

### Requirement: AI profiles SHALL be data-driven weight sets over shared scoring dimensions
The system SHALL define non-player behavior through reusable profile weights and rules rather than through one-off hard-coded scripts for each unit.

#### Scenario: Different actor profiles share one planner
- **WHEN** a cooperative bot squad unit and an aggressive rival unit evaluate the same battlefield state
- **THEN** the system SHALL allow them to prefer different actions because their profiles weight objective, support, threat, position, or escape priorities differently

#### Scenario: Profile is updated
- **WHEN** a developer changes an approved profile definition or score weight configuration
- **THEN** the planner SHALL use the new behavior weights without requiring a rewrite of the core battle loop

### Requirement: Bot squads SHALL support cooperation, competition, and reversal validation in local runs
The system SHALL support at least one bot-controlled squad that can validate the approved MVP relationship modes inside the existing mission templates.

#### Scenario: Cooperative mission behavior
- **WHEN** a run uses the approved cooperative boss mission
- **THEN** the bot squad SHALL prioritize actions that help progress the shared boss objective before extraction opens

#### Scenario: Competitive mission behavior
- **WHEN** a run uses the approved relic contest mission
- **THEN** the bot squad SHALL prioritize contesting the relic, pressuring carriers, and pursuing extraction advantage according to its active profile

#### Scenario: Reversal mission behavior
- **WHEN** a run enters the reversal phase of the approved reversal mission
- **THEN** the bot squad SHALL switch to the configured reversal priorities without replacing the underlying battle system

### Requirement: MVP Boss behavior SHALL reuse the shared planner with boss-specific priorities
The system SHALL implement first-wave boss behavior through the shared planner while allowing boss profiles to emphasize area control, survival thresholds, pressure creation, or summon-like priorities.

#### Scenario: Boss anchors an objective space
- **WHEN** a boss profile is configured to defend a critical objective zone
- **THEN** the planner SHALL prefer actions that keep the boss contesting that zone while still using only legal battle actions

#### Scenario: Boss reaches a danger threshold
- **WHEN** the boss enters a configured low-health or late-phase threshold
- **THEN** the planner SHALL shift toward the approved survival, escalation, or pressure priorities for that boss profile
