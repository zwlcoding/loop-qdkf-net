## Phaser Intent Checklist And Godot Gap Map

This audit treats the Phaser prototype as an intent reference, not as code to port directly.

| Area | Phaser intent | Current Godot state before this change | First-pass target |
| --- | --- | --- | --- |
| Setup | Validated battle setup with human Alpha squad, AI Bravo squad, unit ids, labels, chassis, module ids, spawn tiles, mission id, optional boss | Partial: one selected player squad plus map enemy entries | Explicit fixture/setup data for human and AI squads |
| Validation | Missing ids, duplicate ids, duplicate spawn tiles, bad modules, out-of-bounds tiles are rejected before battle | Partial: content registry validates only broad data collections and map terrain ids | Battle setup validation with readable error list |
| Turn lifecycle | Start turn resets flags and processes statuses; end turn advances initiative; dead units are skipped | Partial: flags reset, but movement/action gates are not enforced consistently | Per-turn move/action/tool flags with command-level guards |
| Movement | Reachable tiles are derived from Move, terrain cost, Jump, passability, and occupancy; movement consumes the opportunity | Partial: reachable exists, but repeated movement allows chained travel | Preview paths plus one movement per turn |
| Targeting | Modes expose legal targets only; illegal taps provide feedback and do not mutate state | Partial: attack/combo can be attempted without preview-driven legality | Target preview and command validation for each mode |
| Combat | Facing, height, damage/heal/status, knockback, collision/fall/hazard, feedback, death cleanup | Partial: basic facing/height/knockback exists | Structured combat result and log/diagnostic visibility |
| AI | AI sees the same legal battle snapshot and executes legal move/action plans | Partial: AI chooses reachable move or adjacent attack directly | AI uses controller preview/command APIs |
| Mission/extraction | Objective, extraction, pressure, collapse, and result routing are stateful | Partial: extraction tile and simple pressure exist | Mission state fields shown in HUD/debug and result payload |
| Presentation | Board highlights movement, paths, targets, objectives, occupied/enemy state | Partial: reachable highlight only | Board renders move/target previews, selected path, teams, labels |
| Diagnostics | Toggleable debug panel explains turn order, selected/hovered tile, unit state, combo, extraction, logs | Missing as UI; only console DebugLog exists | Godot diagnostics panel toggled from battle UI |
| Verification | Tests cover legality and major acceptance flows | Partial smoke only checks scene-ish behavior and would not catch chained movement | Deterministic fixture and smoke assertions for reported regressions |

## Minimum First-Pass Fixtures

- `quick_parity`: human Alpha squad versus AI Bravo squad on `ridge_gate`.
- Known first active unit has reachable movement but cannot move twice in one turn.
- At least three AI-controlled opposing units exist, render on the board, appear in turn order, and act through AI commands.
- Objective tiles include relic and extraction so diagnostics can show mission/extraction state.
- Smoke check attempts invalid movement, invalid target, diagnostics snapshot generation, AI turn advancement, and result closure.
