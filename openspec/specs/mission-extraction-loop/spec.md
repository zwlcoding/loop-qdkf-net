# mission-extraction-loop Specification

## Purpose
TBD - created by archiving change mobile-multiplayer-tactics-roguelite-mvp. Update Purpose after archive.
## Requirements
### Requirement: Each run SHALL reveal the main mission after a short reconnaissance window
The system SHALL start each MVP run with a brief pre-objective reconnaissance period and reveal the main mission after roughly 30 seconds of play.

#### Scenario: Run begins
- **WHEN** a new run starts
- **THEN** players SHALL be able to scout terrain, position, and nearby opportunities before the main mission text and markers appear

#### Scenario: Main mission reveal
- **WHEN** the reconnaissance timer reaches the configured reveal threshold
- **THEN** the system SHALL reveal the run's primary objective and its success conditions to all participants

### Requirement: MVP SHALL ship with a focused first-wave mission set
The system SHALL support a small first-wave mission pool that validates cooperation, competition, and reversal inside the run-extraction loop.

#### Scenario: Mission pool selection
- **WHEN** the game chooses an MVP mission template
- **THEN** it SHALL choose from the approved first-wave templates, including co-op boss kill, relic contest, and co-op-then-reversal

#### Scenario: Unsupported mission template
- **WHEN** a run requests a mission template outside the approved MVP pool
- **THEN** that template SHALL not be used in MVP without an updated spec

### Requirement: Mission structure SHALL support hidden or reversal logic without obscuring the core goal
The system SHALL allow optional hidden tasks, zone-triggered tasks, or reversal conditions while keeping the primary objective readable.

#### Scenario: Hidden task appears
- **WHEN** a configured hidden or zone-triggered condition is met during a run
- **THEN** the system SHALL reveal the additional objective and explain its impact on rewards or relations

#### Scenario: Reversal occurs
- **WHEN** a mission enters its reversal phase
- **THEN** the system SHALL update objective markers, relationship expectations, and extraction logic to reflect the new state

### Requirement: Extraction SHALL be mission-bound rather than globally uniform
The system SHALL determine extraction eligibility and extraction flow from the mission template rather than from one universal rule set.

#### Scenario: Shared extraction mission
- **WHEN** a cooperative boss mission is completed
- **THEN** the system SHALL open the shared extraction flow defined for that mission template

#### Scenario: Priority extraction mission
- **WHEN** a relic-carrying squad satisfies the extraction condition first
- **THEN** the system SHALL grant that squad the priority extraction flow defined by the mission template

### Requirement: Run rewards SHALL separate temporary in-run value from extracted progression value
The system SHALL let players gain and spend temporary run value during a session while reserving full long-term payout for successful extraction.

#### Scenario: Gain temporary run value
- **WHEN** a player defeats enemies, completes side tasks, or interacts with reward nodes during a run
- **THEN** the system SHALL add the appropriate temporary run currency or consumable reward

#### Scenario: Successful extraction
- **WHEN** a squad extracts successfully
- **THEN** the system SHALL convert the run's carried-out rewards into long-term progression payout according to the mission rules

#### Scenario: Failed extraction
- **WHEN** a squad fails to extract
- **THEN** the system SHALL deny the full carried-out payout while applying only the partial retention rules defined for MVP

### Requirement: MVP runs SHALL include side-task and supply variance under controlled randomness
The system SHALL add replayability through controlled random placement of side tasks, supply points, vendors, or event nodes without making outcomes feel arbitrary.

#### Scenario: Run generation
- **WHEN** a run is generated
- **THEN** the system SHALL choose side-task and supply placements from rule-constrained spawn logic tied to map structure and mission type

#### Scenario: Fairness check
- **WHEN** the system places side-task or supply content
- **THEN** it SHALL avoid obviously one-sided placements that invalidate mission competition at spawn

### Requirement: Runs SHALL close under explicit end-of-match pressure
The system SHALL use endgame pressure to ensure objective resolution or extraction within the intended mobile session length.

#### Scenario: Late-game warning
- **WHEN** the run enters the configured late phase
- **THEN** the system SHALL warn players that extraction pressure is escalating

#### Scenario: Endgame collapse
- **WHEN** players delay beyond the late-game threshold
- **THEN** the system SHALL escalate collapse mechanics until the run reaches an outcome and cannot stall indefinitely

