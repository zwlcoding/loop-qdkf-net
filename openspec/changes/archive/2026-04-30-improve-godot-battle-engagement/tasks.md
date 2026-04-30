## 1. Forecast And Event Model

- [x] 1.1 Add battle event records for player actions, AI actions, pressure damage, healing, support effects, invalid commands, and turn transitions.
- [x] 1.2 Add selected action forecast data for expected damage, healing, status, knockback, resource cost, range, and participant requirements.
- [x] 1.3 Ensure forecasts are derived from the selected mode, selected module, selected target, and current board state without mutating battle state.
- [x] 1.4 Preserve the latest meaningful event summary so enemy actions and pressure damage remain attributable after control returns to the player.

## 2. Battle Feedback Presentation

- [x] 2.1 Add a compact recent-action banner in the battle HUD for source, action, target, and outcome.
- [x] 2.2 Add floating damage, healing, status, blocked, and combo text cues on the board.
- [x] 2.3 Add target flash or tint feedback for damaged, healed, buffed, debuffed, and affected units.
- [x] 2.4 Add short source-to-target line or ring cues for attacks, skills, support tools, and combos.
- [x] 2.5 Distinguish pressure/environment damage from unit attacks in both HUD text and board feedback.

## 3. Tool, Combo, And Role Clarity

- [x] 3.1 Expand action and module summaries to show what each tool and combo can do before use.
- [x] 3.2 Show actionable blockers for tools and combos, including missing target, missing participant, range, and resource constraints.
- [x] 3.3 Show combo participants and readiness in normal battle UI instead of requiring trial-and-error.
- [x] 3.4 Add active unit role summaries based on chassis and equipped modules.
- [x] 3.5 Align default module names, roles, and summary copy with the current Godot battle content.

## 4. Verification

- [x] 4.1 Update Godot smoke checks for action forecasts, event attribution, tool blockers, combo readiness, and role summaries.
- [x] 4.2 Run the Godot smoke check script successfully.
- [x] 4.3 Launch the Battle scene headlessly to catch scene or script regressions.
- [x] 4.4 Export an Android debug APK successfully after the battle changes.
- [ ] 4.5 Manually review portrait gameplay for forecasts, AI damage attribution, floating feedback, tool/combo use, and role clarity.
