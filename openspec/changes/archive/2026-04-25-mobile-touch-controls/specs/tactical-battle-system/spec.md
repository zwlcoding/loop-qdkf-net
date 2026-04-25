## MODIFIED Requirements

### Requirement: Tactical battles SHALL resolve as unit-based squad turns
The system SHALL run MVP battles as unit-by-unit tactical encounters between up to two squads, with each squad fielding up to three controllable units and optional neutral enemies, mission entities, or approved AI-controlled actors. On phone portrait screens, a player-controlled turn SHALL remain completable through on-screen touch controls without requiring hardware keyboard shortcuts.

#### Scenario: AI-controlled unit takes a turn
- **WHEN** an AI-controlled squad unit, boss, or approved non-player actor becomes active on the timeline
- **THEN** the system SHALL resolve that turn through the shared planner while preserving the same movement, action, tool, and facing limits used by the battle system

#### Scenario: Player chooses an action on mobile
- **WHEN** a player selects their active unit on a phone portrait screen
- **THEN** the system SHALL expose touch-accessible controls for movement, primary actions, tool use, combo access, cancel/reset, and ending the turn

#### Scenario: Player needs guidance on mobile
- **WHEN** the battle scene is in a player-controlled step on a phone portrait screen
- **THEN** the system SHALL show clear current-step guidance using mobile-friendly language instead of relying on keyboard-centric shortcut hints
