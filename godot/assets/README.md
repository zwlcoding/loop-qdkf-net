# Placeholder Asset Contract

The first Godot rebuild uses checked-in SVG placeholders and procedural drawing for the board. Runtime keys are stable so higher fidelity PNG/SVG/audio assets can replace them without script rewrites.

- `icons/objective.svg`: project icon and objective marker reference.
- `icons/action_*.svg`: action button placeholders.
- `battle/`: retained authored PNG battle assets for a future unified art integration pass. The current `BattleBoard` rendering path is procedural again.
