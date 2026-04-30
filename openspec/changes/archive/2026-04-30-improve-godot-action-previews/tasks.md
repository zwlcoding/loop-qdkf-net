## 1. Preview Data Model

- [x] 1.1 Add controller helpers for selected action category, selected module id, selected module definition, module display summary, and unavailable reason.
- [x] 1.2 Add controller preview helpers for action range tiles separate from legal target tiles for attack, skill, tool, combo, and interact where applicable.
- [x] 1.3 Ensure range and target previews are derived from the same team, range, line-of-sight, resource, module, and opportunity rules used by action execution.
- [x] 1.4 Add concise invalid-reason mapping for normal HUD display while preserving diagnostics detail.

## 2. Battle Board Presentation

- [x] 2.1 Replace low-contrast movement overlay with higher-contrast fill, outline, and pulse values that remain readable over all current terrain colors.
- [x] 2.2 Render movement path and final destination with distinct yellow path/endpoint emphasis.
- [x] 2.3 Render action range tiles separately from legal targets, with lower emphasis for range-only tiles and stronger outlines or rings for executable targets.
- [x] 2.4 Add non-color cues for preview categories such as dots, plus marks, cross marks, or rings for movement, attack/skill, tool/heal, and combo.
- [x] 2.5 Preserve readability when overlays overlap units, objectives, selected tile, impassable tiles, and elevated terrain sides.

## 3. Action And Module UI

- [x] 3.1 Add a compact action/module selection surface in the battle scene for skill, tool, and combo modules available to the active unit.
- [x] 3.2 Keep movement and basic attack as direct modes while defaulting skill/tool/combo to the first available module when entering that mode.
- [x] 3.3 Refresh board previews immediately when the selected mode or selected module changes.
- [x] 3.4 Show selected module name, range, target rule, line-of-sight requirement, cost/use state, and effect summary in the normal HUD.
- [x] 3.5 Show no-target, action-spent, tool-spent, combo-resource, line-of-sight, and invalid-target reasons in the normal HUD without requiring diagnostics.

## 4. Verification

- [x] 4.1 Add or update focused Godot smoke checks for range preview data, legal target data, selected module changes, and invalid reasons.
- [x] 4.2 Manually verify portrait gameplay for movement, attack, skill, tool/heal, combo, path preview, selected module switching, and invalid taps.
- [x] 4.3 Export or run the Godot project after implementation and confirm no missing script/resource/project errors.
- [x] 4.4 Document any remaining Phaser-to-Godot feature gaps that are outside this change, without expanding implementation scope.
