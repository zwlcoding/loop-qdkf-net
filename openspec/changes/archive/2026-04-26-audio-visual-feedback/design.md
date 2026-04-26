# Design: audio-visual-feedback

## Architecture

### Audio System
- New file: `frontend/src/core/AudioManager.ts`
- Wraps Phaser's sound system
- Preloads all audio in BootScene
- Exposes play methods: `playBgm(key)`, `playSfx(key)`, `stopBgm()`
- Volume control per category (bgm, sfx, ui)
- BGM loops, SFX plays once

### Visual Feedback System
- New file: `frontend/src/core/VisualEffects.ts`
- Static utility class, called from BattleScene
- Methods:
  - `screenShake(scene, intensity, duration)` — camera shake
  - `hitFlash(target)` — white flash on unit sprite
  - `spawnParticles(scene, x, y, effectType)` — particle emitter
  - `fadeTransition(scene, callback)` — scene fade

### Particle Textures
- 4 textures generated via mmx, loaded as Phaser particle emitters
- `slash.png` — diagonal swipe for melee
- `projectile.png` — small fast dot for ranged
- `magic_spark.png` — glowing particles for caster
- `death_burst.png` — outward scatter for death

### Audio Files
- `battle-bgm.mp3` — tactical orchestral loop
- `menu-bgm.mp3` — calm ambient loop
- `sfx-melee.mp3` — sword/blade hit
- `sfx-ranged.mp3` — projectile/arrow
- `sfx-magic.mp3` — spell cast
- `sfx-move.mp3` — footstep
- `sfx-click.mp3` — UI tap
- `sfx-confirm.mp3` — UI confirm
- `sfx-death.mp3` — death dissolve
- `sfx-skill.mp3` — skill activation

### Integration Points
- `BootScene.preload()` — load all audio and particle textures
- `BattleScene` — call VisualEffects on attack/death events
- `BattleSceneMobileUi` — play SFX on UI interactions
- `SetupScene` / `MissionSelectScene` — play UI SFX, start menu BGM

## Data flow
```
BootScene.preload()
  → AudioManager.preloadAll()
  → Load particle textures

BattleScene.create()
  → AudioManager.playBgm('battle-bgm')
  → VisualEffects available

BattleScene attack event
  → AudioManager.playSfx(attack type)
  → VisualEffects.hitFlash(target)
  → VisualEffects.spawnParticles(x, y, type)
  → VisualEffects.screenShake() on critical

Unit death
  → AudioManager.playSfx('death')
  → VisualEffects.spawnParticles(x, y, 'death')

Scene transition
  → VisualEffects.fadeTransition()
```

## File changes
| File | Action | Description |
|------|--------|-------------|
| `core/AudioManager.ts` | Create | Audio wrapper |
| `core/VisualEffects.ts` | Create | Visual feedback utilities |
| `scenes/BootScene.ts` | Modify | Preload audio + textures |
| `scenes/BattleScene.ts` | Modify | Hook audio/effects to events |
| `scenes/BattleSceneMobileUi.ts` | Modify | UI SFX |
| `scenes/MissionSelectScene.ts` | Modify | UI SFX |
| `scenes/SetupScene.ts` | Modify | UI SFX |
| `public/audio/` | Create | Audio assets |
| `public/particles/` | Create | Particle textures |
