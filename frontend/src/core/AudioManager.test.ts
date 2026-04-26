import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AudioManager } from './AudioManager';

describe('AudioManager', () => {
  beforeEach(() => {
    AudioManager.__resetInstance();
  });

  it('returns the same singleton instance', () => {
    const a = AudioManager.getInstance();
    const b = AudioManager.getInstance();
    expect(a).toBe(b);
  });

  it('preload method exists and is callable', () => {
    const manager = AudioManager.getInstance();
    expect(typeof manager.preload).toBe('function');

    const mockLoad = {
      audio: vi.fn(),
    };
    const mockScene = {
      load: mockLoad,
    } as unknown as Phaser.Scene;

    manager.preload(mockScene);

    expect(mockLoad.audio).toHaveBeenCalledWith(
      'battle-bgm',
      expect.stringContaining('audio/battle-bgm.mp3')
    );
    expect(mockLoad.audio).toHaveBeenCalledWith(
      'menu-bgm',
      expect.stringContaining('audio/menu-bgm.mp3')
    );
    expect(mockLoad.audio).toHaveBeenCalledWith(
      'sfx-melee',
      expect.stringContaining('audio/sfx-melee.mp3')
    );
  });

  it('setVolume clamps values between 0 and 1', () => {
    const manager = AudioManager.getInstance();

    const mockSound = {
      play: vi.fn(),
      stop: vi.fn(),
      destroy: vi.fn(),
      setVolume: vi.fn(),
    };

    const mockScene = {
      sound: {
        add: vi.fn().mockReturnValue(mockSound),
        play: vi.fn(),
      },
      load: { audio: vi.fn() },
    } as unknown as Phaser.Scene;

    manager.preload(mockScene);
    manager.playBgm('battle-bgm');

    manager.setVolume('bgm', 1.5);
    expect(mockSound.setVolume).toHaveBeenCalledWith(1);

    manager.setVolume('bgm', -0.5);
    expect(mockSound.setVolume).toHaveBeenCalledWith(0);

    manager.setVolume('bgm', 0.5);
    expect(mockSound.setVolume).toHaveBeenCalledWith(0.5);
  });
});
