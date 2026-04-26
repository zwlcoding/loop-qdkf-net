# Tasks: audio-visual-feedback

## 1. Asset generation (mmx)

- [x] 1.1 Generate battle BGM — tactical orchestral instrumental (mmx music generate)
- [x] 1.2 Generate menu BGM — calm ambient instrumental (mmx music generate)
- [x] 1.3 Generate 6 SFX via mmx: melee hit, ranged hit, magic cast, move, death, skill
- [x] 1.4 Generate 2 UI SFX via mmx: click, confirm
- [x] 1.5 Generate 4 particle textures via mmx: slash, projectile, magic spark, death burst
- [x] 1.6 Copy all assets to frontend/public/audio/ and frontend/public/particles/

## 2. Audio system

- [x] 2.1 Create core/AudioManager.ts — preload, playBgm, playSfx, stopBgm, volume control
- [x] 2.2 Create core/AudioManager.test.ts — unit tests for AudioManager
- [x] 2.3 Integrate AudioManager into BootScene.preload() — load all audio keys

## 3. Visual effects system

- [x] 3.1 Create core/VisualEffects.ts — screenShake, hitFlash, spawnParticles, fadeTransition
- [x] 3.2 Create core/VisualEffects.test.ts — unit tests for VisualEffects
- [x] 3.3 Integrate particle texture loading into BootScene.preload()

## 4. Battle integration

- [x] 4.1 Hook AudioManager into BattleScene — play BGM on create, SFX on attack
- [x] 4.2 Hook VisualEffects into BattleScene — hitFlash + particles on attack, screenShake on critical
- [x] 4.3 Hook death effects — AudioManager + VisualEffects on unit death
- [x] 4.4 Hook skill effects — special SFX + particles on skill activation

## 5. UI integration

- [x] 5.1 Add UI SFX to BattleSceneMobileUi — tap and confirm sounds
- [x] 5.2 Add UI SFX to MissionSelectScene — card tap
- [x] 5.3 Add UI SFX to SetupScene — button tap, start battle confirm
- [x] 5.4 Add menu BGM to BootScene — play on main menu
- [x] 5.5 Add scene fade transition between scenes

## 6. Verification

- [x] 6.1 Run cd frontend && npm test — all 313 tests pass
- [x] 6.2 Run cd frontend && npm run build — build succeeds
- [x] 6.3 Manual verification: audio plays, effects visible, no regressions
