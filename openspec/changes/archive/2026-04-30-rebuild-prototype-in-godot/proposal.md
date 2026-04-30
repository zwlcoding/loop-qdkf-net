## Why

The existing prototype has validated the tactical strategy direction in the web frontend, but the project now needs a Godot 4.6 foundation so mobile-first interaction, camera presentation, UI composition, and future native/export targets can be developed in the intended engine. This change rebuilds the prototype under a new `godot/` directory while preserving the current combat strategy assumptions.

## What Changes

- Add a new Godot 4.6 project under `godot/` without replacing or deleting the existing `frontend/` prototype.
- Recreate the prototype scene flow in Godot: boot/menu, squad/loadout setup, rift/map selection, tactical battle, loot/result loop.
- Rebuild the tactical battle prototype in Godot with the existing MVP strategy rules: 3-unit squads, unit turns, Move/Jump terrain traversal, facing, height, knockback, combo resource, objectives, extraction/endgame pressure, and simple AI opponents.
- Redesign the visual direction for Godot instead of copying the previous web UI one-to-one: clearer 2.5D tactical board readability, stronger unit silhouettes, restrained dark fantasy/sci-fi tone, and mobile-safe HUD hierarchy.
- Redesign the UI as native Godot control scenes with portrait-first layouts, touch-sized controls, readable unit/action panels, turn order, combat log, mission state, and result feedback.
- Define a compact Godot asset and data pipeline for placeholder art/audio/data so the prototype can be iterated without blocking on final production assets.
- Keep the existing gameplay strategy direction intact unless implementation exposes an artifact mistake that must be fixed before apply.

## Capabilities

### New Capabilities
- `godot-prototype-runtime`: Godot 4.6 project structure, scene flow, input model, data loading, and runnable prototype shell under `godot/`.
- `godot-visual-ui-system`: Godot-specific visual direction, board presentation, HUD hierarchy, reusable UI scenes, and placeholder asset standards.

### Modified Capabilities
- `mobile-portrait-runtime`: Extend the portrait-first runtime requirement to the Godot prototype and its mobile/export layout constraints.
- `tactical-battle-system`: Require the Godot tactical battle prototype to preserve the existing MVP strategy rules and expose them through a playable battle loop.

## Impact

- Adds a new `godot/` directory containing Godot 4.6 project files, scenes, scripts, resources, data, and placeholder assets.
- Does not remove or rewrite the existing `frontend/` implementation during this change.
- Introduces GDScript/Godot scene architecture alongside the existing TypeScript codebase.
- May reuse gameplay data concepts from `frontend/src/data` and `docs/`, but should define Godot-native resources or JSON loaders rather than coupling to frontend runtime code.
- Verification will require Godot 4.6 CLI/editor availability in addition to existing repository checks.
