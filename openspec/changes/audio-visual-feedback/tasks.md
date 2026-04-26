# Tasks: audio-visual-feedback

## 1. Asset generation (mmx)

- [x] 1.1 Generate battle BGM — tactical orchestral instrumental (mmx music generate)
- [x] 1.2 Generate menu BGM — calm ambient instrumental (mmx music generate)
- [x] 1.3 Generate 6 SFX via mmx: melee hit, ranged hit, magic cast, move, death, skill
- [x] 1.4 Generate 2 UI SFX via mmx: click, confirm
- [x] 1.5 Generate 4 particle textures via mmx: slash, projectile, magic spark, death burst
- [x] 1.6 Copy all assets to frontend/public/audio/ and frontend/public/particles/

## 2. Audio system

- [ ] 2.1 Create core/AudioManager.ts — preload, playBgm, playSfx, stopBgm, volume control
- [ ] 2.2 Create core/AudioManager.test.ts — unit tests for AudioManager
- [ ] 2.3 Integrate AudioManager into BootScene.preload() — load all audio keys

## 3. Visual effects system

- [ ] 3.1 Create core/VisualEffects.ts — screenShake, hitFlash, spawnParticles, fadeTransition
- [ ] 3.2 Create core/VisualEffects.test.ts — unit tests for VisualEffects
- [ ] 3.3 Integrate particle texture loading into BootScene.preload()

## 4. Battle integration

- [ ] 4.1 Hook AudioManager into BattleScene — play BGM on create, SFX on attack
- [ ] 4.2 Hook VisualEffects into BattleScene — hitFlash + particles on attack, screenShake on critical
- [ ] 4.3 Hook death effects — AudioManager + VisualEffects on unit death
- [ ] 4.4 Hook skill effects — special SFX + particles on skill activation

## 5. UI integration

- [ ] 5.1 Add UI SFX to BattleSceneMobileUi — tap and confirm sounds
- [ ] 5.2 Add UI SFX to MissionSelectScene — card tap
- [ ] 5.3 Add UI SFX to SetupScene — button tap, start battle confirm
- [ ] 5.4 Add menu BGM to BootScene — play on main menu
- [ ] 5.5 Add scene fade transition between scenes

## 6. Verification

- [ ] 6.1 Run cd frontend && npm test — all 306 tests pass
- [ ] 6.2 Run cd frontend && npm run build — build succeeds
- [ ] 6.3 Manual verification: audio plays, effects visible, no regressions
