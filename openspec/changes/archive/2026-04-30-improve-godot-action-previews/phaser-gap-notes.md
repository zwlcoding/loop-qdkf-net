## Phaser-To-Godot Gaps Outside This Change

This change improves Godot battle action readability and module selection only. The following Phaser prototype systems remain outside scope and should be prioritized separately:

- Full module schema: Phaser modules carry category, rarity, targeting shape, line-of-sight, participation rules, use limits, and effect arrays; Godot still uses a compact `kind/range/power/heal/status` schema.
- Loadout equipment: Phaser has slot-based chassis/module loadout and progression-derived bonuses; Godot currently selects chassis only and assigns default modules.
- Loot selection: Phaser generates weighted module rewards and synergy hints; Godot currently shows simple reward strings.
- Rift run map: Phaser has a layered room DAG with battle, elite, shop, event, and treasure rooms; Godot currently shows mission cards.
- Meta progression: Phaser tracks shards, unlocks, permanent upgrades, and purchases; Godot has no equivalent progression shop.
- Mission variants: Phaser supports boss kill, relic contest, cooperation-then-reversal, extraction capacity, reveal timing, and pressure callbacks; Godot currently has simplified objective, extraction, and pressure state.
- AI scoring: Phaser AI scores objectives, kill opportunities, extraction denial, relic state, and reversal phases; Godot AI currently uses a simpler legal-action-first planner.
