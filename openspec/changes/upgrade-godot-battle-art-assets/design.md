## Context

The Godot rebuild currently treats battle art as a placeholder layer. `godot/assets/README.md` says battle terrain and units are drawn procedurally until final assets are authored, and `BattleBoard._draw()` confirms that tiles are colored polygons while units are circles and labels. The current map uses six terrain ids (`plain`, `forest`, `urban`, `mountain`, `water`, `rift`) and five chassis ids (`vanguard`, `skirmisher`, `support`, `controller`, `caster`).

The requested direction is an original polished tactics look: readable like classic isometric tactics, but more refined than a low-resolution demo. The implementation should not copy FFTA, Genshin Impact, Honkai: Star Rail, or any specific commercial asset. The practical art direction is "polished chibi pixel / 2.5D isometric fantasy tactics": compact silhouettes, bright rim detail, clean transparent PNGs, and terrain with enough material texture to read at mobile gameplay scale.

## Goals / Non-Goals

**Goals:**

- Create a coherent Godot battle asset set for terrain tops, exposed elevation walls, units, objective markers, and tactical feedback markers.
- Render those assets through stable runtime keys so future asset replacement does not require gameplay script rewrites.
- Preserve current battle rules, grid math, elevation, hit testing, selection, path highlights, labels, HP bars, and portrait layout behavior.
- Keep a procedural fallback path for missing or invalid assets.
- Add focused validation so invalid PNGs, missing asset keys, and broken smoke rendering are caught before manual QA.

**Non-Goals:**

- No exact recreation of FFTA, Genshin Impact, Honkai: Star Rail, or other copyrighted visual designs.
- No animation system, sprite sheets, VFX overhaul, audio replacement, or UI redesign beyond what is necessary to integrate the new battle board art.
- No change to chassis stats, map data, movement rules, AI, mission rules, or OpenSpec upstream command and skill files.

## Decisions

### Use authored PNGs with stable logical keys

Battle rendering will resolve texture keys such as `terrain/plain/top`, `terrain/plain/side`, `unit/vanguard`, and `marker/objective/relic` from a small asset registry or dictionary owned by the Godot battle rendering layer. The file paths can change later, but the renderer should ask for logical keys.

Alternative considered: preload specific PNG paths directly inside every draw branch. That is faster to write initially but spreads asset filenames through rendering logic and makes later art swaps brittle.

### Use one original art direction for the first pass

The first checked-in set will use polished chibi pixel / 2.5D isometric fantasy tactics. It fits the small mobile board, supports readable role silhouettes, and is realistic enough to stop looking like a demo without needing high-resolution 3D-like illustration.

Alternative considered: painterly non-pixel chibi art. It can look more premium in isolation, but on a 6x6 mobile isometric board it risks noisy scaling, inconsistent edges, and weaker tile readability.

### Render terrain as texture top faces plus compatible side treatment

Terrain top faces should be transparent diamond PNGs. Exposed walls can use terrain-specific side PNGs if available, with a procedural color/material fallback to preserve elevation readability. Highlights and objective markers remain drawn on top of the elevated face so the gameplay state stays legible.

Alternative considered: full block sprites for every terrain-height combination. That produces richer tiles, but creates a larger asset matrix and makes early iteration slower because every terrain/height/neighbor combination needs authored coverage.

### Render units as role sprites with team treatment outside the source art

Each chassis gets a neutral readable sprite. Team identity should be applied through rings, bases, outlines, or small badges rather than recoloring the sprite body, because broad tinting can muddy generated art and reduce role readability.

Alternative considered: separate blue-team and red-team sprites for every chassis. That may look better eventually, but doubles the asset count and makes the first replacement pass harder to keep consistent.

### Validate assets by contract rather than visual taste

Automated checks should verify file existence, PNG signature, alpha-capable color type, expected logical keys, and smoke rendering. Manual QA should still assess style consistency, mobile scale, and whether the board feels more like a finished game.

Alternative considered: rely only on manual review. That would not catch simple asset mistakes like mislabeled files, opaque square backgrounds, or missing imports.

## Risks / Trade-offs

- Generated art may be visually inconsistent across assets -> use a single prompt style guide, generate in batches by category, and reject assets that do not match the set before wiring them into runtime.
- Pixel-style assets can become blurry when scaled -> author larger transparent PNGs with crisp silhouettes and use Godot import settings that avoid unwanted filtering where appropriate.
- New art may reduce tactical readability -> keep overlays, HP bars, labels, team rings, and movement/target highlights above sprites and verify on a phone portrait viewport.
- Texture rendering can drift from current hit testing -> preserve the existing `tile_to_world` and `_hit_tile` math, and treat art placement as a visual layer anchored to those same centers.
- Asset generation may require iteration -> keep file naming and registry stable so improved art can replace first-pass PNGs without more code changes.
