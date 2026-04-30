## 1. Godot Project Foundation

- [x] 1.1 Create `godot/` with a Godot 4.6 `project.godot`, main scene, input map, display/window settings, and baseline folder structure.
- [x] 1.2 Add autoload services for scene routing, shared game state, run state, content registry, audio/settings, and debug helpers.
- [x] 1.3 Add a reusable Godot theme resource and base UI controls for buttons, panels, labels, tabs, status chips, and action buttons.
- [x] 1.4 Add documented local run instructions or smoke-check notes for opening/running the project in Godot 4.6.

## 2. Data And Content Layer

- [x] 2.1 Define Godot-native data/resources or JSON loaders for chassis, unit roles, modules, terrain, maps, missions, loot, and status definitions.
- [x] 2.2 Seed MVP content equivalent to the existing prototype: three-unit player squad options, opposing actors, basic modules/actions, terrain types, and at least one playable map.
- [x] 2.3 Implement content validation helpers that report missing IDs, broken references, invalid map cells, and missing runtime assets.
- [x] 2.4 Add deterministic fixtures for a quick local battle and a quick result/loot loop.

## 3. Scene Flow

- [x] 3.1 Implement boot and main menu scenes that load content and start a local prototype run.
- [x] 3.2 Implement loadout/setup scene for reviewing/selecting three squad units and readiness.
- [x] 3.3 Implement rift/map selection scene that chooses a mission/map and passes run context forward.
- [x] 3.4 Implement loot and result scenes that summarize battle outcome, rewards, losses, and navigation back to the run/menu flow.
- [x] 3.5 Ensure scene transitions preserve run context through autoload state instead of hidden scene nodes.

## 4. Tactical Battle Rules

- [x] 4.1 Implement logical grid, tile height, terrain passability, occupancy, objectives, and tile-to-visual anchor helpers.
- [x] 4.2 Implement unit model, stats, HP/status state, team ownership, facing, role/chassis identity, and battle setup from selected data.
- [x] 4.3 Implement turn order, active unit lifecycle, movement state, action state, facing confirmation, and turn completion.
- [x] 4.4 Implement Move/Jump pathfinding and movement preview using height, passability, occupancy, and blockers.
- [x] 4.5 Implement basic attacks, skills, range/target validation, facing modifiers, height modifiers, damage, statuses, and combat feedback data.
- [x] 4.6 Implement knockback with obstacle, edge, collision, and height/fall consequences.
- [x] 4.7 Implement shared combo resource and at least one active combo action with eligible ally participation.
- [x] 4.8 Implement objective/extraction/endgame pressure rules that can force battle closure within the prototype time target.
- [x] 4.9 Implement local AI turn planning for opposing actors with valid movement/action execution.

## 5. Battle Presentation And Interaction

- [x] 5.1 Build a 2.5D/isometric battle board with readable terrain tops, height edges, tile states, objectives, and selection/highlight layers.
- [x] 5.2 Render player, enemy, and neutral units with stable visual anchors, team/role readability, facing indicators, HP/status markers, and selection states.
- [x] 5.3 Add pointer/touch hit testing from screen position to logical tile, including camera/viewport offsets.
- [x] 5.4 Add camera/viewport framing for portrait play, active unit focus, target preview visibility, and board bounds.
- [x] 5.5 Add combat animation placeholders, VFX/audio cues, floating damage/status feedback, and scene transition feedback.

## 6. Visual And UI Redesign

- [x] 6.1 Create a new restrained dark fantasy/sci-fi visual palette for Godot with readable terrain, unit, objective, danger, and team colors.
- [x] 6.2 Add checked-in placeholder assets for terrain, units, icons, panels, buttons, VFX, and audio that meet the runtime readability contracts.
- [x] 6.3 Implement portrait battle HUD with mission state, active unit, turn order, selected unit/target details, combo resource, combat log, and action controls.
- [x] 6.4 Implement compact menu/loadout/rift/loot/result UI layouts using Godot `Control` containers and the shared theme.
- [x] 6.5 Verify primary UI controls remain touch-sized and do not overlap at common portrait viewport sizes.

## 7. Verification

- [x] 7.1 Run Godot 4.6 project open/run validation and fix missing-script, missing-resource, or project-version errors.
- [x] 7.2 Complete a manual smoke path: menu -> loadout -> rift selection -> battle -> result/loot -> return.
- [x] 7.3 Verify battle interactions manually: movement, attack, facing, height, knockback, combo, AI turn, objective, extraction, and endgame pressure.
- [x] 7.4 Verify portrait layout manually at representative phone viewport sizes.
- [x] 7.5 Run existing repository checks that remain relevant and confirm the existing `frontend/` prototype was not removed or rewritten.
