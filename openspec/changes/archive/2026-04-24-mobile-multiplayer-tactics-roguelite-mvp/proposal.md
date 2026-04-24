## Why

The project now has a clear product direction, battle model, task structure, and MVP technical path, but it still lacks formal OpenSpec artifacts that define the first buildable scope. We need a single, implementation-ready MVP contract now so the team can move from ideation into scoped execution without drifting into MMO-scale complexity.

## What Changes

- Define the first playable MVP for a mobile-first, FFTA-like multiplayer tactics roguelite centered on 2 squads of 3 units.
- Specify the tactical battle rules required in v1, including turn order, facing, Move/Jump height traversal, knockback, and active combo actions.
- Specify the mission-and-extraction loop for the first playable run, including 30-second mission reveal, first-wave mission templates, extraction gates, and forced endgame pressure.
- Specify the minimum progression/build layer using chassis plus modules instead of fixed jobs.
- Establish a client-first, PhaserJS-based prototype boundary with lightweight data-driven content definitions.
- Explicitly exclude formal server authority, large-scale multiplayer, true 3D terrain, and deep live-service systems from this change.

## Capabilities

### New Capabilities
- `tactical-battle-system`: Core FFTA-like squad tactics rules for movement, facing, height, knockback, combo actions, statuses, and turn resolution.
- `mission-extraction-loop`: The run structure for mission reveal, objective resolution, extraction eligibility, run rewards, and forced 15-minute match closure.
- `chassis-module-progression`: The minimum build/progression model using chassis, modules, squad assembly, and post-run unlock flow.

### Modified Capabilities
- None.

## Impact

- Affects the future PhaserJS/TypeScript prototype structure under `frontend/`.
- Defines the behavior contract for battle sandbox, mission logic, extraction rules, and minimal progression.
- Creates the foundation for later implementation planning, prototype sequencing, and review gates before `/opsx-apply`.
- Constrains technical decisions so the MVP stays client-first, 2D isometric/faux-2.5D, and data-driven.