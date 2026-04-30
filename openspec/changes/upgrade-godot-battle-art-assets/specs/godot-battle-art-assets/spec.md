## ADDED Requirements

### Requirement: Godot battle art SHALL load through stable runtime keys
The system SHALL expose stable logical texture keys for Godot battle terrain, unit, objective, and tactical feedback art so rendering code can replace prototype drawing without hard-coding generated filenames across gameplay logic.

#### Scenario: Terrain art resolves by key
- **WHEN** the battle board renders a tile whose terrain id is `plain`, `forest`, `urban`, `mountain`, `water`, or `rift`
- **THEN** the renderer SHALL resolve the visible art through a stable terrain key for that terrain id

#### Scenario: Unit art resolves by chassis
- **WHEN** the battle board renders a living unit whose chassis id is `vanguard`, `skirmisher`, `support`, `controller`, or `caster`
- **THEN** the renderer SHALL resolve the visible unit art through a stable unit key for that chassis id

#### Scenario: Missing art falls back safely
- **WHEN** a required runtime art key is missing or fails to load
- **THEN** the battle board SHALL render a readable procedural fallback instead of crashing or showing an opaque placeholder square

### Requirement: Godot battle image files SHALL be transparent PNG assets
The system SHALL store authored Godot battle assets as valid PNG files with transparency-capable color data so terrain, units, markers, and overlays composite cleanly on the isometric board.

#### Scenario: Unit asset is validated
- **WHEN** asset validation checks a unit image used by the Godot battle board
- **THEN** the file SHALL be a valid PNG and SHALL support transparent pixels around the sprite silhouette

#### Scenario: Terrain asset is validated
- **WHEN** asset validation checks an isometric terrain image used by the Godot battle board
- **THEN** the file SHALL be a valid PNG and SHALL support transparent pixels outside the visible tile shape

### Requirement: Godot battle art SHALL use one coherent original style
The system SHALL use a coherent original polished chibi pixel / 2.5D isometric tactics style for the first authored Godot battle asset set.

#### Scenario: Terrain and units render together
- **WHEN** a battle map displays terrain and multiple chassis roles at gameplay scale
- **THEN** the terrain, units, objectives, and tactical feedback SHALL share compatible palette, lighting direction, edge treatment, and level of detail

#### Scenario: Commercial references inform readability only
- **WHEN** art prompts, file names, or style notes are created for this asset set
- **THEN** they SHALL avoid copying specific commercial characters, costumes, logos, screenshots, or exact art treatments from referenced games

### Requirement: Godot battle assets SHALL cover the current playable content
The system SHALL include enough authored assets to replace the current procedural demo look for all terrain types, chassis roles, and mission markers present in the checked-in Godot data.

#### Scenario: Current map starts
- **WHEN** the `ridge_gate` map is loaded in the Godot battle scene
- **THEN** every visible terrain type, unit chassis, relic objective, extraction objective, and impassable hazard SHALL have an authored or contract-compliant fallback visual

#### Scenario: Team identity is shown
- **WHEN** player and enemy units use the same chassis art
- **THEN** the renderer SHALL show team identity through a readable treatment such as rings, bases, outlines, or badges without muddying the unit sprite art
