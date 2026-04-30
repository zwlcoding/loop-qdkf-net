## 1. Phaser Intent Audit

- [x] 1.1 Document the Phaser battle intent checklist in the change artifacts, covering setup, turns, movement, targeting, combat, AI, mission/extraction, HUD, diagnostics, and verification.
- [x] 1.2 Map each checklist item to the current Godot implementation and mark it as present, partial, missing, or intentionally out of scope.
- [x] 1.3 Identify minimum first-pass fixtures needed to validate the reported regressions: chained movement, missing enemies, and missing diagnostics.

## 2. Battle State Refactor

- [x] 2.1 Introduce or refactor Godot battle setup data to represent human and AI squads with unit ids, labels, chassis, modules, spawn tiles, mission id, and map id.
- [x] 2.2 Add setup/content validation for missing ids, duplicate actors, duplicate occupied tiles, out-of-bounds starts, invalid map cells, and missing objectives.
- [x] 2.3 Refactor unit turn state so movement, primary action, tool opportunity, combo/action costs, facing, statuses, and death are explicit state fields.
- [x] 2.4 Refactor turn order so dead units are skipped, AI/human control mode is preserved, and turn-start/end state is consistently reset.

## 3. Movement And Command Legality

- [x] 3.1 Rebuild movement preview to return reachable destinations and paths from Move, terrain cost, Jump, passability, blockers, and occupancy.
- [x] 3.2 Make movement command validation consume the active unit's movement opportunity and reject second movement attempts in the same turn.
- [x] 3.3 Add invalid-command feedback for out-of-range, occupied, impassable, over-height, wrong-turn, and movement-spent cases.
- [x] 3.4 Wire the board to render reachable tiles and selected path from battle-state previews instead of recalculating ad hoc scene state.

## 4. Targeting, Combat, And AI

- [x] 4.1 Implement action-mode target previews for basic attack, skills, tools, combo, interact/extract, cancel, and wait/end-turn.
- [x] 4.2 Implement command validation for target actions using team, range, line-of-sight, resource, module, and remaining-opportunity rules.
- [x] 4.3 Rework combat resolution for facing, height, damage, healing, statuses, knockback, collision, fall/hazard, death cleanup, and feedback records.
- [x] 4.4 Rework AI turns to enumerate legal command candidates from the same battle-state previews and execute commands through the same APIs as player input.
- [x] 4.5 Ensure AI-controlled opposing units are seeded, visible, selectable for targeting, included in turn order, and logged when acting.

## 5. Mission, Extraction, And Results

- [x] 5.1 Represent objective state, extraction lock/eligibility, pressure stage, collapse, and battle outcome in Godot battle state.
- [x] 5.2 Update HUD and board markers when mission objective, extraction, pressure, or outcome state changes.
- [x] 5.3 Route completed battles to result or loot flow with outcome, rewards, losses, surviving/extracted actors, and turn count.

## 6. Diagnostics UI

- [x] 6.1 Add a toggleable battle diagnostics panel or tab in Godot battle UI.
- [x] 6.2 Show turn order, active unit, selected unit, team/control mode, HP, chassis/role, move/jump/speed, facing, statuses, and per-turn flags.
- [x] 6.3 Show hovered/selected tile, terrain, height, passability, objective, occupancy, preview counts, selected path, target previews, and invalid-command reason.
- [x] 6.4 Show mission/objective, pressure, extraction, combo resource, combo participant eligibility, and recent log entries.
- [x] 6.5 Verify diagnostics can be collapsed without blocking normal portrait controls or the reserved board viewport.

## 7. Verification

- [x] 7.1 Add deterministic Godot parity fixture data for a quick human-vs-AI encounter with terrain heights, blockers, objectives, and known first-turn previews.
- [x] 7.2 Add or update Godot smoke checks for setup validation, no chained movement, enemy/AI presence, legal target rejection, and battle closure.
- [x] 7.3 Run Godot 4.6 open/run validation after the refactor and fix missing script/resource/project errors.
- [x] 7.4 Complete manual portrait review for menu/setup/rift/battle/result, movement, target actions, AI turns, mission/extraction, diagnostics toggle, and layout readability.
- [x] 7.5 Confirm the existing `frontend/` Phaser prototype remains available and was not rewritten or removed.
