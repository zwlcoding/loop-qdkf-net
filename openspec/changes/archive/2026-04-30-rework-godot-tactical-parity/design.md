## Context

The Phaser prototype has more battle semantics than the first Godot rebuild preserved. It is not production architecture, but it documents intent through code and tests:

- Setup creates two squads from validated `BattleSetup` data: Alpha is human, Bravo is AI, each with up to three units, chassis identity, module loadouts, spawn tiles, and an optional boss.
- Battle turn state is unit-based. A unit starts a turn, receives one movement opportunity, one primary action opportunity, one tool opportunity, and then ends the turn. Statuses can block movement or action.
- Movement previews come from Move/Jump constrained pathfinding over grid walkability, elevation, movement cost, and live occupancy. A move consumes the unit's movement opportunity.
- Targeting is mode-based: move, basic attack, skill, tool, combo, cancel/end/extract. Only legal targets are highlighted and accepted.
- Combat resolves range, line of sight, facing/arc, height modifiers, damage, healing, statuses, knockback, collision/fall/hazard consequences, feedback, and death cleanup.
- AI builds a battle snapshot, enumerates legal move/action candidates, scores them by profile and mission state, and executes a valid plan.
- Mission state includes reveal/recon timing, boss/relic/reversal objective variants, extraction eligibility, extraction timeout/capacity, pressure escalation, collapse, and battle/result routing.
- The Phaser debug panel and compact overlay expose turn order, mission state, selected unit, hovered tile, combo eligibility, extraction conditions, and log context.

The current Godot implementation has a useful shell, data loading, scenes, a board, basic units, basic AI hooks, and result flow. The main gaps are semantic: movement can be repeated because `moved` is not used as a gate, the battle setup model only represents one player squad plus map enemies instead of the local two-squad intent, target/action state is under-modeled, and diagnostics are too thin to prove what the battle state is doing.

## Goals / Non-Goals

**Goals:**
- Rebuild Godot battle behavior around an explicit state model before adding more presentation polish.
- Use Phaser as an intent checklist, not as code to translate line-by-line.
- Make tactical legality visible in both code and UI: movement, targeting, AI actions, objective/extraction, and outcome closure.
- Ensure enemies/AI-controlled units are seeded, rendered, included in turn order, and visible through HUD/debug output.
- Add deterministic Godot smoke checks for the exact acceptance failures reported by the user.

**Non-Goals:**
- Do not port every Phaser class, rendering detail, or old browser UI pattern.
- Do not expand scope into online multiplayer, save sync, final art, or export pipelines.
- Do not archive the original Godot rebuild automatically.
- Do not remove the existing `frontend/` reference.

## Phaser Intent Checklist

1. Scene flow: menu/setup/loadout/rift/battle/result exists, but battle must launch from validated setup/run context.
2. Battle setup: two squads, control mode per squad, three units per squad, chassis, modules, spawn tiles, optional boss/enemy actors.
3. Unit state: HP/max HP, move, jump, speed, attack, defense, facing, statuses, modules, per-turn flags.
4. Turn lifecycle: start turn resets flags and processes statuses; end turn advances speed order; dead units are skipped.
5. Movement: preview only legal reachable tiles; path includes steps; movement consumes movement; occupied destinations are rejected.
6. Targeting: action modes expose only legal unit targets; illegal taps do nothing except provide feedback.
7. Actions: basic attack, active skill, tool, and combo are separate opportunities with distinct costs and target rules.
8. Combat: line of sight, range, height, facing arc, damage/heal/status, knockback, collision/fall/hazard, death cleanup.
9. AI: AI units get the same legal state snapshot as players and execute legal move/action plans.
10. Mission/extraction: objective reveal, objective progress, extraction unlock/eligibility, pressure escalation, collapse, and result routing are stateful.
11. Presentation: board highlights reachable/path/targets/objectives/blocked cells; units show team, role, facing, HP/status.
12. Diagnostics: debug panel explains turn order, selected unit, hovered tile, combo eligibility, mission/extraction, and recent logs.

## Decisions

### Decision 1: Introduce a Godot battle-state boundary

Create or refactor into a small set of battle-domain scripts that own setup, turn state, units, grid queries, action legality, and mission state. The scene should ask this domain for previews and commands, then render results.

Rationale:
- The current scene/controller mix allows UI taps to mutate state without enough legality checks.
- Godot scenes are good presentation owners, but tactical invariants need a stable non-visual home.

Alternatives considered:
- Patch only the observed `moved` bug. This would fix one symptom while leaving missing setup, target legality, diagnostics, and verification gaps.
- Translate Phaser classes directly. This would carry Phaser/browser assumptions into Godot and slow later native iteration.

### Decision 2: Model squads and enemies as actors from setup data

Godot should support battle setup data that can express at least two local squads with control mode, unit ids, labels, chassis ids, modules, and spawn tiles. Map-spawned enemies or bosses can be layered on top, but they should be normal battle actors once spawned.

Rationale:
- The Phaser intent is local human-vs-AI validation, not just one player squad against anonymous map entries.
- A unified actor model makes rendering, turn order, AI, diagnostics, and results easier to verify.

### Decision 3: Make command legality explicit

Use command-style APIs such as `preview_move`, `try_move`, `preview_actions`, `try_action`, `try_interact`, and `end_turn`. Each command returns a structured result with success, reason, state changes, feedback, and next preview state.

Rationale:
- This prevents UI from accidentally allowing repeated movement or invalid target taps.
- Structured results become useful for debug output and smoke checks.

### Decision 4: Rebuild diagnostics as first-class Godot UI

Add a toggleable debug panel or tab inside the battle scene. It should not be a hidden console-only log. On mobile it may be collapsed, but reviewers must be able to show it and inspect battle state.

Rationale:
- The Phaser debug panel was how reviewers understood turn order, combo, mission, and tile state.
- Without equivalent visibility, manual acceptance cannot distinguish missing actors from camera/framing issues.

### Decision 5: Verify with deterministic acceptance checks

Add fixtures and smoke checks that assert behavior rather than only "scene opens." The first checks should cover the reported regressions: no chained movement, enemy/AI presence, legal highlighting, debug data, and battle closure.

Rationale:
- The previous task list was marked complete despite visible parity failures.
- Deterministic checks reduce dependence on manual visual inspection alone.

## Risks / Trade-offs

- Refactoring can destabilize the runnable shell -> keep scene flow intact and refactor battle internals behind one scene at a time.
- Phaser behavior contains demo shortcuts and duplicated concepts -> preserve intent only where it supports current MVP specs.
- Godot CLI automated UI testing may be limited -> combine domain-level smoke scripts with manual portrait review notes.
- Diagnostics can clutter mobile UI -> make it toggleable/collapsible and excluded from normal player flow by default.

## Migration Plan

1. Capture current Godot behavior with a quick baseline smoke run and known-failing checklist.
2. Add battle setup and actor-state structures without changing presentation.
3. Refactor movement/turn/action legality into battle-domain scripts and make the board consume previews.
4. Seed visible AI-controlled opposing units through setup data and verify turn order/rendering/debug output.
5. Add diagnostics panel and deterministic smoke checks.
6. Re-run Godot validation and manual portrait acceptance.

Rollback is limited to this follow-up change because the prior Godot shell remains isolated under `godot/`.

## Open Questions

- Should the Godot MVP default battle use the Phaser two-squad Alpha/Bravo setup exactly, or a smaller two-squad fixture tuned for mobile portrait readability?
- Should the optional boss be included in the first Godot parity pass, or left as a second fixture after squad-vs-squad is stable?
- Which debug toggle should be preferred in Godot: a visible small button, keyboard shortcut, or both?
