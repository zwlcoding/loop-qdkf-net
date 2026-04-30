# Loop Rift Godot Prototype

Godot 4.6 rebuild of the tactical roguelite prototype. The existing `frontend/` implementation remains a reference and is not required at runtime.

## Local Smoke Check

1. Open `godot/project.godot` with Godot 4.6.
2. Run the project.
3. Follow this path: main menu -> loadout -> rift map -> battle -> result/loot -> menu.
4. In battle, verify movement, attack, combo, wait/facing, AI turns, objective/extraction, and endgame pressure.
5. Use the `Debug` battle button to toggle diagnostics for turn order, active unit flags, tile state, previews, combo eligibility, mission/extraction state, and recent logs.

## Parity Smoke Check

Run the deterministic Godot parity fixture:

```bash
/Applications/Godot.app/Contents/MacOS/Godot --headless --path godot res://scenes/SmokeCheck.tscn
```

The check verifies setup validation, human and AI squad seeding, no chained movement after a move is spent, illegal target rejection, diagnostics data, AI turn execution, and result storage.

The project is portrait-first. The default viewport is `390x844`.
