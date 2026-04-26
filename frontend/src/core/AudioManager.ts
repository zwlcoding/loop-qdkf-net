import { resolvePublicAssetPath } from './AssetPath';

const BGM_KEYS = ['battle-bgm', 'menu-bgm'] as const;
const SFX_KEYS = [
  'sfx-melee',
  'sfx-ranged',
  'sfx-magic',
  'sfx-move',
  'sfx-click',
  'sfx-confirm',
  'sfx-death',
  'sfx-skill',
] as const;

export type BgmKey = (typeof BGM_KEYS)[number];
export type SfxKey = (typeof SFX_KEYS)[number];

export class AudioManager {
  private static _instance: AudioManager | null = null;

  /** Scene used for the current/last BGM. Updated each time playBgm is called. */
  private _scene: Phaser.Scene | null = null;
  private _currentBgm: Phaser.Sound.WebAudioSound | null = null;
  private _bgmVolume = 1;
  private _sfxVolume = 1;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager._instance) {
      AudioManager._instance = new AudioManager();
    }
    return AudioManager._instance;
  }

  /** Reset the singleton instance. Intended for tests only. */
  static __resetInstance(): void {
    AudioManager._instance = null;
  }

  preload(scene: Phaser.Scene): void {
    this._scene = scene;

    for (const key of BGM_KEYS) {
      scene.load.audio(key, resolvePublicAssetPath(`audio/${key}.mp3`));
    }

    for (const key of SFX_KEYS) {
      scene.load.audio(key, resolvePublicAssetPath(`audio/${key}.mp3`));
    }
  }

  /**
   * Play a BGM track. Pass the calling scene so sounds are created on the
   * correct (active) scene's sound manager — prevents stale references after
   * scene transitions.
   */
  playBgm(key: BgmKey, scene?: Phaser.Scene): void {
    // Update scene reference if a new one is provided
    if (scene) {
      this._scene = scene;
    }

    if (!this._scene) return;

    this.stopBgm();

    const sound = this._scene.sound.add(key, {
      loop: true,
      volume: this._bgmVolume,
    }) as Phaser.Sound.WebAudioSound;

    sound.play();
    this._currentBgm = sound;
  }

  playSfx(key: SfxKey): void {
    if (!this._scene) return;

    this._scene.sound.play(key, { volume: this._sfxVolume });
  }

  stopBgm(): void {
    if (this._currentBgm) {
      this._currentBgm.stop();
      this._currentBgm.destroy();
      this._currentBgm = null;
    }
  }

  setVolume(category: 'bgm' | 'sfx', value: number): void {
    const clamped = Math.max(0, Math.min(1, value));

    if (category === 'bgm') {
      this._bgmVolume = clamped;
      if (this._currentBgm) {
        this._currentBgm.setVolume(clamped);
      }
    } else {
      this._sfxVolume = clamped;
    }
  }

  getBgmKeys(): readonly BgmKey[] {
    return BGM_KEYS;
  }

  getSfxKeys(): readonly SfxKey[] {
    return SFX_KEYS;
  }
}
