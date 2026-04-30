## Context

The current Godot battle loop rebuilds turn order by speed and advances through that sorted list. Facing exists as unit state and affects damage, but the player cannot choose final facing and combat currently resolves as guaranteed hit/miss-free damage. Line of sight exists for some modules, while terrain passability handles water as fully impassable and there is no persistent explored/current visibility state.

The project direction now favors dungeon uncertainty over pre-battle map/enemy previews. That means the tactical layer needs stronger in-battle information rules: players should discover space through vision, use cover and blockers, and make risk decisions from hit reliability, facing, and action timing.

## Goals / Non-Goals

**Goals:**
- Add a lightweight WT/CT-style tempo model that makes speed and wait actions tactically meaningful.
- Let players confirm final facing without relying on final unit sprite art.
- Add hit chance and hit/miss outcomes while preserving readable action previews.
- Add persistent explored tiles, current visibility, and obstacle blockers as a foundation for dungeon fog-of-war.
- Preserve the existing MVP scale: local Godot prototype, small squads, mobile portrait controls, deterministic test fixtures.

**Non-Goals:**
- Full战前准备、deployment, enemy scouting, or map preview flow.
- Full system menu, enemy detail encyclopedia, external punishment economy, prison-like consequences, or complete judge/law implementation.
- Full downed/revival/corpse gameplay. This remains a later change.
- RTS-grade fog-of-war simulation. This change only needs tactical-grid explored/current visibility.
- Complex reaction chains, charge times, interrupts, or high-frequency timeline rewrites.

## Decisions

### Use readiness-based CT instead of a fixed sorted speed loop

Each living, active combatant tracks a readiness value. Battle time advances readiness by speed until one or more units reaches the action threshold. When a unit completes its turn, the chosen command applies a recovery cost that reduces readiness. Waiting uses a lower recovery cost than moving plus attacking, so direct wait produces an earlier next turn.

Alternatives considered:
- Keep static speed sorting: simple, but it cannot express wait advantage or action tempo.
- Use a full initiative timestamp queue: precise, but more abstract to explain in the HUD and more work to debug.

This preserves an FFTA-like tempo decision while staying small enough for MVP.

### Make end-facing a command state, not an art dependency

After a player spends their intended actions or taps wait/end turn, the unit enters a facing-confirmation state. The board shows a direction arrow on the unit base and four direction choices. Confirming facing ends the turn. AI units choose facing automatically from nearby threats or objective direction.

Alternatives considered:
- Auto-facing only: already exists, but it removes an important positioning decision.
- Sprite rotation/animation first: unnecessary blocker while battle art is still evolving.

### Treat hit chance as previewed reliability plus deterministic testable resolution

Combat preview calculates hit chance from base action accuracy, facing arc, height, cover, visibility/line-of-sight, statuses, and module metadata. Resolution uses the same calculation and an injectable or seeded battle RNG for deterministic tests.

Alternatives considered:
- Guaranteed hits with damage modifiers only: readable, but facing becomes too shallow.
- Heavy random formula early: hard to balance and harder to communicate on mobile.

### Separate terrain from battlefield objects

Terrain describes tile movement, height, water/action restrictions, and cover baseline. Battlefield objects describe blockers such as trees, walls, stones, crates, or rift crystals. Objects can independently block movement, sight, projectile paths, and targeting. Durability is optional: some blockers are indestructible, while trees or cover can be targetable and destructible when configured.

This avoids forcing every tree to have HP while still giving ranged units a way to remove or play around configured cover.

### Visibility is tactical and persistent, not pre-battle scouting

The battle state tracks explored tiles and currently visible tiles per relevant side or visibility-sharing group. Explored tiles keep known terrain and last-known object state visible; current visibility controls live enemy visibility and legal targeting. Mission templates can choose whether squads share visibility for cooperative phases or keep visibility separate for rival/uncertain phases.

Alternatives considered:
- Full map always visible: undermines dungeon uncertainty.
- RTS-style shroud with continuous memory simulation: unnecessary complexity for turn-based MVP.

## Risks / Trade-offs

- CT can make turns feel unpredictable if the HUD does not explain upcoming order -> show the next several acting units and why waiting changes recovery.
- Hit chance can frustrate players if misses feel opaque -> previews and result feedback must identify major modifiers such as front/side/rear, cover, height, or blocked sight.
- Facing confirmation can add taps on mobile -> default to current/auto-facing and make the four-direction confirm compact.
- Visibility can hide too much information in small maps -> fixtures should tune sight radius and blocker density conservatively.
- Destructible cover can make ranged play worse if every shot is blocked -> only configured blockers should block projectiles, and some classes/modules should be able to destroy, ignore, arc over, or reveal through blockers.

## Migration Plan

1. Add data fields and compatibility defaults so existing maps and modules keep working.
2. Introduce tempo state while preserving existing fixtures through deterministic initial readiness.
3. Add facing confirmation UI and AI auto-facing.
4. Add hit chance preview/resolution with deterministic test hooks.
5. Add object blockers and visibility state to grid/map evaluation.
6. Update smoke checks and fixtures to cover the new rules.

Rollback can keep the old speed-sorted loop and guaranteed-hit resolver behind temporary compatibility methods during implementation, but the final archived spec should prefer the new CT and hit-chance behavior.

## Open Questions

- Should cooperative squads always share explored/current visibility, or should that be mission-phase configurable from the first implementation?
- Should water block tool usage as well as primary actions, or should emergency tools remain usable from water for mobile-friendly recovery?
- Should destructible blocker damage use normal combat formulas or a simple durability decrement per hit?
