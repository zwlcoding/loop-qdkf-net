## Why

The Godot rebuild created a runnable project shell, but acceptance testing showed that important Phaser prototype intentions were not preserved: movement can be chained beyond the unit's Move allowance, enemy actors are not reliably visible or understood, and battle diagnostics/debug visibility are missing. The next change should treat the Phaser version as an intent reference, not a source-code port, and rebuild the Godot battle loop around explicit tactical contracts.

## What Changes

- Audit the Phaser prototype feature set and capture the intended battle semantics as a migration checklist.
- Refactor the Godot tactical battle loop so setup, units, turn state, movement, targeting, AI, objectives, extraction, and results are driven by explicit battle state instead of ad hoc scene callbacks.
- Preserve the Phaser prototype's player-facing intent: one movement opportunity per active unit, reachable-tile-only movement, clear enemy/AI presence, legal target previews, action/tool/combo gating, mission pressure, and result closure.
- Add a Godot-native battle diagnostics panel that replaces the Phaser debug panel's core purpose: explain turn order, active/selected unit state, hovered/selected tile state, combo eligibility, mission/extraction state, and recent log events.
- Add deterministic smoke fixtures and checks that prove the Godot version cannot regress into free movement, missing enemies, hidden AI turns, or unreadable debug state.
- Do not mechanically translate Phaser classes or preserve browser/Phaser implementation details that do not fit Godot.

## Capabilities

### New Capabilities
- `godot-tactical-parity-rework`: Godot battle-state architecture and tactical rules needed to preserve the Phaser prototype's intended local battle behavior.
- `godot-battle-diagnostics`: Godot-native battle diagnostics/debug UI for inspecting tactical state during manual review.
- `godot-parity-verification`: Deterministic fixtures, smoke checks, and review checklist for validating Godot battle parity against Phaser intent.

### Modified Capabilities
- None. This change adds Godot-specific follow-up contracts without changing the archived core gameplay requirements.

## Impact

- Affects `godot/scripts/battle/*`, `godot/scripts/scenes/battle*.gd`, Godot battle data under `godot/data/`, and relevant scene/UI files.
- May add new Godot battle-state, setup, validation, diagnostics, and smoke-check scripts under `godot/scripts/` and `godot/tools/`.
- Does not remove or rewrite `frontend/`; Phaser remains a behavioral reference during this change.
- Does not archive `rebuild-prototype-in-godot`; that change should remain unarchived until this follow-up is reviewed and applied.
