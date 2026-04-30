## ADDED Requirements

### Requirement: Battle runtime image assets SHALL use alpha-capable PNG files
The system SHALL load battle unit, terrain, marker, particle, and UI images from files whose byte format matches their extension and whose PNG color type supports transparency when the image is composited on the battle map.

#### Scenario: Unit art is loaded
- **WHEN** the battle scene preloads a unit texture such as `unit-vanguard`
- **THEN** the source file SHALL be a valid PNG file with an alpha-capable color type and SHALL NOT be mislabeled JPEG data

#### Scenario: Terrain art is loaded
- **WHEN** the battle scene preloads terrain textures for isometric tiles
- **THEN** each terrain source file SHALL be a valid PNG file with an alpha-capable color type so diamond tiles can be composited without square backgrounds

#### Scenario: Asset validation runs
- **WHEN** the frontend asset validation test suite runs
- **THEN** it SHALL fail if a battle runtime image is not a PNG file or does not support alpha

### Requirement: Battle visual assets SHALL use stable runtime texture keys
The system SHALL expose stable texture keys for battle code while allowing the underlying checked-in files to be replaced or remapped as long as they satisfy the battle asset contract.

#### Scenario: Unit texture mapping changes
- **WHEN** compliant replacement art is added for a chassis
- **THEN** BattleScene and Unit code SHALL continue using the same runtime texture key for that chassis

#### Scenario: Terrain texture mapping changes
- **WHEN** compliant replacement terrain art is added
- **THEN** GridMap SHALL continue resolving terrain types through stable texture keys instead of hard-coding generated filenames across rendering logic

### Requirement: Battle art style SHALL be consistent at gameplay scale
The system SHALL use a coherent set of unit and terrain assets that remain readable at the battle scene's rendered tile and unit sizes.

#### Scenario: Units render on the tactical map
- **WHEN** a battle starts with multiple chassis types
- **THEN** each unit SHALL display without opaque square backgrounds and SHALL remain visually distinguishable from terrain and other squads

#### Scenario: Terrain renders on the tactical map
- **WHEN** an isometric battle map is displayed
- **THEN** terrain tiles SHALL share a consistent visual treatment and SHALL not mix incompatible generated-photo, pixel, or placeholder styles within the same battle map
