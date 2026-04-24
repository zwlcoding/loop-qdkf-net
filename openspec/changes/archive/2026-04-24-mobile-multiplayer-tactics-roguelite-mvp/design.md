## Context

The project has already converged on a mobile-first tactical roguelite direction: up to two squads of three units, FFTA-like tactical combat, delayed mission reveal, extraction-based rewards, and a PhaserJS + TypeScript client-first prototype path. The repo is still effectively greenfield from an implementation standpoint, so this change is defining the first buildable contract rather than modifying an existing game loop.

The most important constraints are scope and readability. The MVP must validate whether the core loop of tactical positioning, mission pressure, extraction tension, and chassis/module build expression is fun inside a sub-15-minute session. It must not collapse into MMO-scale ambitions, formal online infrastructure, or true 3D rendering complexity before the core loop proves itself.

## Goals / Non-Goals

**Goals:**
- Define the first playable tactical MVP as a client-first prototype with clear behavioral boundaries.
- Keep the battle layer centered on positioning, facing, Move/Jump traversal, knockback, and explicit combo actions.
- Validate the mission-extraction loop with a small first-wave mission pool that proves cooperation, competition, and reversal.
- Establish a minimal but flexible progression model using chassis plus modules with data-driven definitions.
- Preserve future extensibility for real multiplayer and additional content without forcing those systems into the MVP.

**Non-Goals:**
- Building authoritative multiplayer networking or anti-cheat.
- Delivering full live-service systems, world events, guild/social systems, or economy depth.
- Shipping a true 3D battlefield renderer or camera system.
- Designing a deep long-term meta progression tree beyond MVP unlock flow.
- Exhaustively balancing every chassis/module combination in this change.

## Decisions

### Decision 1: Use a client-first Vite + TypeScript + latest Phaser prototype with faux-2.5D rendering
- **Decision:** Build the MVP prototype under `frontend/` around Vite + TypeScript + the latest stable Phaser release, using 2D isometric / faux-2.5D rendering driven by height-aware grid logic.
- **Why:** The project needs fast iteration on battle rules, tasks, and extraction rather than heavy engine investment. The team is already aligned on PhaserJS familiarity, and FFTA-like presentation can be achieved with 2D sprites plus height data.
- **Alternatives considered:**
  - **Unity:** Better built-in editor and broader middleware support, but slower for this team's immediate iteration path and unnecessary before the core loop is proven.
  - **Godot:** Stronger than Phaser for some game-specific workflows, but does not beat existing JS/TS velocity enough to justify a stack switch now.
  - **True 3D renderer:** Adds major complexity without improving MVP validation quality.

### Decision 2: Treat tactical battle, mission-extraction, and chassis-module progression as three separate capability seams
- **Decision:** Split the MVP into three capabilities: `tactical-battle-system`, `mission-extraction-loop`, and `chassis-module-progression`.
- **Why:** These are the three user-visible pillars that must stand independently yet compose into one closed loop. They also map cleanly to future implementation slices and review boundaries.
- **Alternatives considered:**
  - **Single monolithic game-loop capability:** Simpler on paper, but too hard to reason about or implement incrementally.
  - **Many fine-grained capabilities:** Better long-term decomposition, but too fragmented for the first MVP change.

### Decision 3: Prioritize spatial readability over systemic breadth in battle v1
- **Decision:** Include unit turns, Move/Jump traversal, facing, height, knockback, explicit combo actions, and a small status set; defer complex AP systems, long interrupt chains, and broad elemental/state matrices.
- **Why:** The product's identity comes from spatial and squad interplay. Adding too many combat subsystems before validating position-based fun would obscure the real signal.
- **Alternatives considered:**
  - **Broader RPG combat layer with MP/AP complexity:** Higher theoretical depth, but far worse for MVP readability and mobile pacing.
  - **Ultra-minimal sandbox without facing or height:** Faster to build, but too weak to validate the intended FFTA-like feel.

### Decision 4: Use mission-driven extraction rules rather than one global extraction model
- **Decision:** Extraction eligibility and extraction pressure are defined per mission template.
- **Why:** The game needs different emotional shapes across co-op, contest, and reversal missions. Tying extraction to mission type preserves those differences and prevents every run from feeling structurally identical.
- **Alternatives considered:**
  - **Single extraction rule for all modes:** Easier to implement, but flattens tension and weakens mission identity.
  - **Highly bespoke extraction for every future mode:** Too expensive for MVP; first version should support a small approved set.

### Decision 5: Make content data-driven from the beginning
- **Decision:** Define chassis, modules, mission templates, and map event rules in lightweight editable data rather than embedding them in battle logic.
- **Why:** These values will change constantly during prototyping. Data-driven content reduces refactor cost and keeps the battle engine focused on execution rather than content definition.
- **Alternatives considered:**
  - **Hard-coded MVP content:** Slightly faster for the first prototype spike, but creates immediate drag once balance and mission iteration begins.
  - **Full editor/toolchain first:** Too much upfront investment before the gameplay loop is validated.

## Risks / Trade-offs

- **[Risk] PhaserJS faux-2.5D readability breaks under height and sorting edge cases** → **Mitigation:** Keep the MVP renderer tile-first, height-aware, and sprite-sorted by deterministic anchor rules before investing in polish.
- **[Risk] The MVP scope still drifts toward “mini MMO” because of multiplayer aspirations** → **Mitigation:** Enforce the client-first prototype boundary and reject server-authoritative, social, and large-scale world systems in this change.
- **[Risk] The chassis/module system becomes either too shallow or too combinatorially large** → **Mitigation:** Lock MVP to five chassis archetypes and a constrained slot model with a small first-wave module pool.
- **[Risk] Mission variety feels fake if randomization is uncontrolled** → **Mitigation:** Use constrained mission/event placement rules rather than freeform random spawns.
- **[Risk] Extraction failure feels overly punitive in prototype testing** → **Mitigation:** Keep partial-retention rules and strong run feedback visible so failure still supports learning and iteration.

## Migration Plan

1. Use this change to generate the proposal, design, specs, and task artifacts for the MVP contract.
2. Build the prototype in `frontend/` as a client-first Vite + TypeScript + latest Phaser application.
3. Keep generated image/video assets in repo asset directories and allow Hermes to generate placeholder or prototype media with `mmx` CLI when implementation needs art inputs before bespoke assets exist.
4. Implement in slices that preserve battle sandbox validation first, then mission/extraction, then progression.
5. Do not introduce formal server infrastructure during this change.
6. If the prototype validates the core loop, create follow-up changes for multiplayer authority, content expansion, and tooling.

Rollback is simple at this stage because the repo is greenfield: revert or supersede the prototype implementation and update follow-up specs if the validated loop changes.

## Open Questions

- Which of the five chassis archetypes should be in the very first playable prototype if the team wants an even smaller pre-MVP spike?
- What exact partial-retention rule should apply to failed extraction in MVP testing?
- Should the first implementation slice start with one mission template or all three priority templates behind feature flags?
- How much debug tooling (timeline view, path preview, combo preview, mission-state inspector) should be considered mandatory inside the first prototype milestone?