## 1. Data and State Model

- [x] 1.1 Add tempo/readiness fields and recovery defaults to Godot battle unit/controller state while preserving existing fixture startup.
- [x] 1.2 Extend terrain data to support standable action-blocking water with compatibility defaults for existing maps.
- [x] 1.3 Add battlefield object data structures for movement, vision, projectile, targeting, durability, and destructibility flags.
- [x] 1.4 Add visibility-group state for explored tiles and currently visible tiles.

## 2. CT Tempo Loop

- [x] 2.1 Replace static speed-sorted active-unit cycling with deterministic CT/readiness active-unit selection.
- [x] 2.2 Apply recovery costs for wait, movement-only, action, tool, combo, and movement-plus-action turns.
- [x] 2.3 Update diagnostics and normal HUD turn-order summaries to show CT-driven upcoming units.
- [x] 2.4 Update AI turn execution to use the same CT completion path as player commands.

## 3. Facing Confirmation

- [x] 3.1 Add a player-facing final-facing confirmation state before human turns fully end.
- [x] 3.2 Render a board-level facing indicator that works without final directional unit sprites.
- [x] 3.3 Add compact north/east/south/west facing controls to the battle UI.
- [x] 3.4 Add AI automatic final-facing selection based on nearby threats or fallback current facing.

## 4. Hit Chance and Combat Resolution

- [x] 4.1 Add hit chance calculation using base accuracy, facing arc, height, cover, visibility/line-of-sight, statuses, and module modifiers.
- [x] 4.2 Update action forecasts to show hit chance and the dominant tactical modifiers.
- [x] 4.3 Resolve offensive actions through a deterministic battle RNG hook and report misses through normal feedback.
- [x] 4.4 Ensure miss outcomes do not apply damage, hostile status, knockback, or combo follow-up effects unless a module defines a miss effect.

## 5. Visibility, Obstacles, and Terrain Restrictions

- [x] 5.1 Compute current visibility from unit sight range, terrain, and object blockers.
- [x] 5.2 Persist explored terrain and hide live enemy positions outside current visibility.
- [x] 5.3 Include battlefield objects in movement pathing, line-of-sight checks, projectile legality, and target previews.
- [x] 5.4 Implement destructible blocker behavior for configured targetable objects while preserving indestructible blockers.
- [x] 5.5 Implement standable water action lockout with terrain-based invalid-action feedback.

## 6. Presentation and Feedback

- [x] 6.1 Render explored, unseen, currently visible, and blocked-preview states distinctly on the Godot board.
- [x] 6.2 Explain fog, sight, projectile obstruction, and terrain action blockers in normal HUD feedback.
- [x] 6.3 Keep mobile portrait controls readable while adding facing and CT preview information.
- [x] 6.4 Update battle event logs to include hit, miss, obstruction, and visibility-relevant feedback.

## 7. Verification

- [x] 7.1 Add deterministic tests or smoke checks for CT order, wait recovery, and AI CT advancement.
- [x] 7.2 Add tests or fixture assertions for facing confirmation and facing-based hit modifiers.
- [x] 7.3 Add tests or fixture assertions for hit/miss outcomes and miss-safe effect application.
- [x] 7.4 Add tests or fixture assertions for explored/current visibility, unseen enemy targeting denial, and shared/separate visibility groups.
- [x] 7.5 Add tests or fixture assertions for tree/projectile obstruction, destructible blockers, and water action lockout.
- [x] 7.6 Run the Godot smoke check or documented local verification path and update any diagnostics expectations.
