## 1. Prototype foundation

- [x] 1.1 Initialize the Vite + TypeScript + latest Phaser prototype scaffold under `frontend/` with a deterministic app entry, scene boot flow, and lightweight local content-loading layer
- [x] 1.2 Add repo asset directories plus data definition folders and loaders for chassis, modules, mission templates, and map-event rules so MVP content is configuration-driven from the start
- [x] 1.3 Implement a reusable grid/height map representation that stores tile coordinates, walkability, terrain flags, and height values for tactical scenes
- [x] 1.4 Wire an asset intake workflow that lets Hermes-generated `mmx` image/video placeholders be dropped into the appropriate frontend asset directories without changing battle code

## 2. Core tactical battle loop

- [x] 2.1 Implement the unit turn timeline and active-unit state machine for two squads of up to three units plus neutral mission entities
- [x] 2.2 Implement Move/Jump path preview and reachable-tile resolution based on horizontal movement and vertical traversal limits
- [x] 2.3 Implement facing state, front/side/rear attack arc checks, and MVP positional combat modifiers
- [x] 2.4 Implement primary action resolution for basic attacks, skill targeting, and per-turn tool/item usage limits
- [x] 2.5 Implement knockback, collision, fall, and hazard-resolution rules tied to terrain and objective positions
- [x] 2.6 Implement the MVP status set and its turn-based resolution hooks

## 3. Combo and mission systems

- [x] 3.1 Implement squad-shared combo resource tracking and active combo initiation flow
- [x] 3.2 Implement combo participation checks using unit state, range, line-of-sight, and equipped combo modules
- [x] 3.3 Implement the 30-second reconnaissance timer and primary mission reveal flow
- [x] 3.4 Implement the first three mission templates: co-op boss kill, relic contest, and co-op-then-reversal
- [x] 3.5 Implement mission-bound extraction gates, extraction point behavior, and forced endgame pressure for sub-15-minute runs

## 4. Chassis, modules, and progression

- [x] 4.1 Define the five MVP chassis archetypes with baseline Move, Jump, slot bias, and tactical role metadata
- [x] 4.2 Define the first-wave module pool across active, passive, combo, and tool categories with slot validation rules
- [x] 4.3 Implement squad assembly and loadout validation so units are built from one chassis plus constrained module slots
- [x] 4.4 Implement temporary run rewards, in-run spend rules, extraction payout conversion, and minimal post-run unlock progression

## 5. UX, debugging, and validation

- [x] 5.1 Build tactical UX for tile highlighting, path previews, target previews, mission markers, extraction state, and late-game pressure warnings
- [x] 5.2 Add debug tooling for turn order, mission state, unit stats, tile height, combo eligibility, and extraction conditions so Hermes can police OpenCode apply against scope drift
- [x] 5.3 Validate the playable prototype against the first-wave specs and confirm the run closes reliably within the intended mobile session length
