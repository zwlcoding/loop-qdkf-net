import { describe, it, expect, vi } from 'vitest';

// Mock phaser to avoid `window is not defined` in node test environment
vi.mock('phaser', () => {
  return {
    Scene: class Scene {
      scene = { key: '' };
      constructor(config?: { key?: string }) {
        if (config?.key) {
          this.scene.key = config.key;
        }
      }
    },
  };
});

// Dynamic import after mock is established
const loadMapPreviewScene = async () => {
  const module = await import('./MapPreviewScene');
  return module.MapPreviewScene;
};

describe('MapPreviewScene', () => {
  it('should exist and be a function', async () => {
    const MapPreviewScene = await loadMapPreviewScene();
    expect(typeof MapPreviewScene).toBe('function');
  });

  it('should have scene key "MapPreview"', async () => {
    const MapPreviewScene = await loadMapPreviewScene();
    const scene = new MapPreviewScene();
    expect(scene.scene.key).toBe('MapPreview');
  });
});
