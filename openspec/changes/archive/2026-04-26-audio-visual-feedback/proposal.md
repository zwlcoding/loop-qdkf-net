# Proposal: audio-visual-feedback

## Problem
The game currently has no audio and minimal visual feedback. Combat feels flat — attacks produce only a number, there's no sound, no screen shake, no particles. The game looks like a prototype, not a playable experience.

## Goal
Add audio (BGM + SFX) and visual feedback (particles, shake, flash) to make combat feel responsive and the game feel like a real product. All assets generated via mmx (MiniMax) to match the game's tactical sci-fi aesthetic.

## Scope

### Audio
- **BGM**: battle theme (tactical/orchestral), menu theme (calm/ambient)
- **SFX**: attack hit (3 variants: melee, ranged, magic), movement, UI click, UI confirm, death, skill activation

### Visual
- **Screen shake** on heavy attacks
- **Hit flash** (white overlay) on damage
- **Particle effects**: slash (melee), projectile trail (ranged), magic spark (caster), death dissolve
- **UI transitions**: scene fade in/out

### Out of scope
- 2.5D perspective change
- Voice acting
- Dynamic music system

## Success criteria
- BGM plays during battle and menu
- Every attack type has a distinct sound
- Screen shakes on critical hits
- Particles appear on attack and death
- All 306 existing tests still pass
- Build succeeds

## Asset generation strategy
- mmx `music generate --instrumental` for BGM (2 tracks)
- mmx `music generate --instrumental` for SFX (short 1-2s clips)
- mmx `image generate` for particle textures (4 textures)
- Assets stored in `frontend/public/audio/` and `frontend/public/particles/`
