import { describe, expect, it, vi } from 'vitest';
import { VisualEffects } from './VisualEffects';

const makeScene = () => ({
  cameras: {
    main: {
      shake: vi.fn(),
      fadeOut: vi.fn(),
      fadeIn: vi.fn(),
      once: vi.fn(),
    },
  },
  add: {
    particles: vi.fn(() => ({
      explode: vi.fn(),
    })),
  },
});

describe('VisualEffects', () => {
  it('screenShake is callable', () => {
    const scene = makeScene();
    VisualEffects.screenShake(scene as unknown as Parameters<typeof VisualEffects.screenShake>[0], 0.01, 200);
    expect(scene.cameras.main.shake).toHaveBeenCalledWith(200, 0.01);
  });

  it('hitFlash is callable', () => {
    const target = {
      setTint: vi.fn(),
      clearTint: vi.fn(),
    };
    vi.useFakeTimers();
    VisualEffects.hitFlash(target, 150);
    expect(target.setTint).toHaveBeenCalledWith(0xffffff);
    vi.advanceTimersByTime(150);
    expect(target.clearTint).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('spawnParticles uses correct texture key for slash', () => {
    const scene = makeScene();
    VisualEffects.spawnParticles(scene as unknown as Parameters<typeof VisualEffects.spawnParticles>[0], 100, 200, 'slash');
    expect(scene.add.particles).toHaveBeenCalledWith(
      100,
      200,
      'particle-slash',
      expect.objectContaining({
        speed: 100,
        scale: { start: 0.5, end: 0 },
        lifespan: 300,
        quantity: 10,
        emitting: false,
      })
    );
  });

  it('fadeTransition fades out, calls callback, then fades in', () => {
    const scene = makeScene();
    const callback = vi.fn();
    VisualEffects.fadeTransition(scene as unknown as Parameters<typeof VisualEffects.fadeTransition>[0], callback);
    expect(scene.cameras.main.fadeOut).toHaveBeenCalledWith(200);
    expect(scene.cameras.main.once).toHaveBeenCalledWith('camerafadeoutcomplete', expect.any(Function));

    // Simulate fade-out completion
    const onceHandler = scene.cameras.main.once.mock.calls[0][1] as () => void;
    onceHandler();
    expect(callback).toHaveBeenCalled();
    expect(scene.cameras.main.fadeIn).toHaveBeenCalledWith(200);
  });
});
