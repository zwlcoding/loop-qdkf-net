## Context

The current playable prototype lives in `frontend/` and has already established the core tactical direction: mobile-first squad tactics, rift/run progression, setup/loadout, battle, loot, and result scenes. The user now wants to rebuild that prototype in Godot 4.6 under a new `godot/` directory, with the strategy layer preserved and the visual/UI layer replanned for the engine.

This is not a direct source-code port. TypeScript/Phaser code remains a behavioral reference, while the Godot implementation should use Godot-native scenes, scripts, resources, controls, input handling, and export assumptions.

## Goals / Non-Goals

**Goals:**
- Create a self-contained Godot 4.6 project in `godot/`.
- Rebuild the MVP loop in Godot: boot/menu, setup/loadout, rift/map selection, battle, loot/result.
- Preserve existing tactical strategy requirements in the Godot prototype.
- Redesign the tactical board presentation, HUD, and menus for portrait-first touch play.
- Keep data definitions compact and easy to iterate through Godot resources or JSON.
- Provide enough validation/manual smoke steps that the Godot project can be opened and run reliably.

**Non-Goals:**
- Do not remove, rewrite, or archive the existing `frontend/` prototype as part of this change.
- Do not implement online multiplayer, matchmaking, account systems, or production save sync.
- Do not create final production art. Placeholder assets are acceptable when they meet readability and style contracts.
- Do not change the high-level game strategy unless an OpenSpec artifact is updated first.
- Do not depend on paid or third-party Godot addons for the first rebuild.

## Decisions

### Decision 1: Treat `godot/` as a new engine boundary

The Godot rebuild will live under `godot/` with its own `project.godot`, scene tree, scripts, resources, and assets. It can copy concepts and small static data from docs/frontend assets, but it should not import frontend TypeScript runtime modules.

Rationale:
- Godot scenes and resources are the native unit of composition.
- Keeping the old frontend intact gives a fallback reference during parity checks.
- A clean boundary avoids hybrid runtime complexity.

Alternatives considered:
- Translate TypeScript files mechanically into GDScript. This would preserve accidental frontend structure and make Godot architecture awkward.
- Replace `frontend/` in place. This would lose a useful reference and create unnecessary migration risk.

### Decision 2: Build around scene ownership and autoload state

Use a small scene graph:
- `Boot.tscn` initializes settings, data registries, audio, and first scene routing.
- `MainMenu.tscn`, `Loadout.tscn`, `RiftMap.tscn`, `Battle.tscn`, `Loot.tscn`, and `Result.tscn` own the main prototype screens.
- Autoload singletons such as `GameState`, `RunState`, `ContentRegistry`, and `SceneRouter` hold cross-scene state.
- Battle-specific classes own grid data, units, actions, turn order, occupancy, AI planning, combat resolution, objectives, and extraction pressure.

Rationale:
- Godot scenes are easier to test and inspect when ownership matches user-visible screens.
- Autoloads keep the prototype simple without building a full dependency injection framework.
- Battle logic remains separable from presentation so future tests and balancing work are practical.

Alternatives considered:
- One large `Game.tscn` with all modes hidden/shown. This makes iteration quick initially but becomes hard to reason about.
- Pure resource-driven architecture from day one. More scalable, but slower for a prototype rebuild.

### Decision 3: Use a 2.5D board with stable grid anchors

Represent the tactical map as logical grid coordinates with height, terrain, occupancy, and objective metadata. Present it as a 2.5D/isometric board using Godot nodes, with shared projection helpers for tiles, units, markers, previews, labels, and hit testing.

Rationale:
- The existing strategy depends on height, facing, movement, and tile control.
- Shared anchors prevent the common problem where visual tiles, units, and taps drift apart.
- Godot can later evolve this from 2D nodes to 3D or hybrid presentation without changing rule data.

Alternatives considered:
- A flat top-down board. Faster to implement, but loses the high/low tactics readability the prototype has been moving toward.
- Full 3D tactics board immediately. More future-facing, but higher implementation risk for the first rebuild.

### Decision 4: Redesign UI as dense mobile game controls, not a web page

Use Godot `Control` scenes for menus and battle HUD:
- Fixed portrait-first composition with safe top mission/turn state, central battle viewport, and bottom action controls.
- Icon-like action buttons with labels only where clarity needs text.
- Unit cards, action panels, target previews, combat log, and turn order designed for repeated tactical use.
- Menus favor concise lists, tabs, segmented filters, and compact cards rather than landing-page layout.

Rationale:
- The first screen should be a playable game surface, not marketing.
- Mobile tactics requires tap safety, readable state, and non-overlapping overlays.
- Godot controls provide anchors, containers, themes, focus, and scaling better than hand-positioned UI nodes.

Alternatives considered:
- Copy the existing web UI visually. It would carry over compromises from a browser/Phaser prototype.
- Use purely custom-drawn UI in the battle scene. This gives full control but slows iteration and accessibility.

### Decision 5: Keep placeholder assets authored for readability

Initial assets should be checked in under `godot/assets/` and can be simple vector/PNG/placeholders generated or drawn for:
- terrain tops and side materials,
- unit silhouettes by chassis/role,
- action/status/objective icons,
- UI panels/buttons,
- basic combat VFX and audio cues.

Asset keys and resource references should be stable so higher quality art can replace placeholders later.

Rationale:
- The user asked for replanned visuals/UI, but final art is not required to validate engine architecture.
- Stable keys let the prototype improve incrementally.
- Readable silhouettes and tile states matter more than decorative detail.

Alternatives considered:
- Block implementation until final art exists. This would block gameplay validation.
- Reuse all existing frontend assets unchanged. Some are useful references, but the Godot visual direction should be reworked rather than copied.

## Risks / Trade-offs

- Godot 4.6 project files can differ from Godot 4.5/4.4 expectations -> Mitigation: target Godot 4.6 explicitly and verify by opening/running with the installed editor/CLI.
- A complete rewrite can drift from proven rules -> Mitigation: use existing specs/docs as parity checks and keep tactical rules in separate scripts from presentation.
- Portrait HUD can cover actionable tiles -> Mitigation: reserve a battle viewport and keep HUD/control layers separate from world nodes.
- Placeholder visuals may still feel temporary -> Mitigation: define style, silhouette, color, and asset key standards now so art polish can replace assets later.
- Godot automated testing may be limited in the local setup -> Mitigation: include manual smoke tests and CLI scene launch/export checks where available.

## Migration Plan

1. Create `godot/` with a Godot 4.6 project, input map, autoloads, base theme, and folder structure.
2. Add content/data resources for chassis, modules, missions, terrain, and maps based on existing prototype concepts.
3. Build the scene flow: boot/menu, loadout, rift map, battle, loot, result.
4. Implement battle rules and presentation incrementally: grid, units, movement, facing, actions, AI, objectives, extraction, feedback.
5. Apply the redesigned visual/UI system across battle HUD and core menus.
6. Verify the project opens/runs in Godot 4.6 and perform portrait smoke tests.

Rollback is simple because the new implementation is isolated in `godot/`: disable or remove that directory while leaving the existing `frontend/` prototype untouched.

## Open Questions

- Exact Godot executable path should be discovered during implementation; the user has stated Godot 4.6 is installed.
- Whether the first Godot build should include an HTML5/web export preset is not required for the rebuild unless requested later.
- Final art production format remains open; this change only requires stable placeholder/runtime asset contracts.
