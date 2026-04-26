import type { Scene } from 'phaser';

export type ParticleType = 'slash' | 'projectile' | 'magic' | 'death';

const PARTICLE_TEXTURE_MAP: Record<ParticleType, string> = {
  slash: 'particle-slash',
  projectile: 'particle-projectile',
  magic: 'particle-magic',
  death: 'particle-death',
};

export interface TintableSprite {
  setTint: (color: number) => void;
  clearTint: () => void;
}

export class VisualEffects {
  static screenShake(scene: Scene, intensity = 0.005, duration = 100): void {
    scene.cameras.main.shake(duration, intensity);
  }

  static hitFlash(target: TintableSprite, duration = 100): void {
    target.setTint(0xffffff);
    setTimeout(() => {
      target.clearTint();
    }, duration);
  }

  static spawnParticles(scene: Scene, x: number, y: number, type: ParticleType): void {
    const textureKey = PARTICLE_TEXTURE_MAP[type];
    const particles = scene.add.particles(x, y, textureKey, {
      speed: 100,
      scale: { start: 0.5, end: 0 },
      lifespan: 300,
      quantity: 10,
      emitting: false,
    });
    particles.explode(10);
  }

  static fadeTransition(scene: Scene, callback: () => void): void {
    scene.cameras.main.fadeOut(200);
    scene.cameras.main.once('camerafadeoutcomplete', () => {
      callback();
      scene.cameras.main.fadeIn(200);
    });
  }
}
