import { describe, expect, it, vi } from 'vitest';
import { DamageText, type DamageTextType } from './DamageText';

const makeScene = () => {
  const texts: Array<{
    x: number;
    y: number;
    text: string;
    style: Phaser.Types.GameObjects.Text.TextStyle;
    originX: number;
    originY: number;
    depth: number;
    alpha: number;
    active: boolean;
    destroyed: boolean;
    setOrigin: ReturnType<typeof vi.fn>;
    setDepth: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  }> = [];

  const tweens: Array<{
    targets: Phaser.GameObjects.Text;
    y: number;
    alpha: number;
    duration: number;
    onComplete?: () => void;
  }> = [];

  const addText = (
    x: number,
    y: number,
    text: string,
    style: Phaser.Types.GameObjects.Text.TextStyle
  ) => {
    const textObj: ReturnType<typeof addText> = {
      x,
      y,
      text,
      style,
      originX: 0,
      originY: 0,
      depth: 0,
      alpha: 1,
      active: true,
      destroyed: false,
      setOrigin: vi.fn((ox: number, oy: number) => {
        textObj.originX = ox;
        textObj.originY = oy;
        return textObj;
      }),
      setDepth: vi.fn((d: number) => {
        textObj.depth = d;
        return textObj;
      }),
      destroy: vi.fn(() => {
        textObj.destroyed = true;
        textObj.active = false;
      }),
    };
    texts.push(textObj);
    return textObj;
  };

  const addTween = (config: {
    targets: Phaser.GameObjects.Text;
    y: number;
    alpha: number;
    duration: number;
    onComplete?: () => void;
  }) => {
    tweens.push(config);
    if (config.onComplete) {
      config.onComplete();
    }
    return { stop: vi.fn() };
  };

  return {
    texts,
    tweenCalls: tweens,
    add: {
      text: vi.fn(addText),
    },
    tweens: {
      add: vi.fn(addTween),
    },
  };
};

describe('DamageText', () => {
  it('creates text object with correct position and depth', () => {
    const scene = makeScene();
    const dt = new DamageText(
      scene as unknown as Parameters<typeof DamageText.prototype.constructor>[0],
      200,
      150,
      42,
      'damage'
    );

    expect(scene.add.text).toHaveBeenCalledTimes(1);
    const textObj = scene.texts[0];
    expect(textObj.x).toBe(200);
    expect(textObj.y).toBe(150);
    expect(textObj.text).toBe('42');
    expect(textObj.setOrigin).toHaveBeenCalledWith(0.5);
    expect(textObj.setDepth).toHaveBeenCalledWith(15);
  });

  it('uses white 14px for damage type', () => {
    const scene = makeScene();
    new DamageText(scene as unknown as Parameters<typeof DamageText.prototype.constructor>[0], 0, 0, 10, 'damage');

    const style = scene.texts[0].style;
    expect(style.color).toBe('#ffffff');
    expect(style.fontSize).toBe('14px');
    expect(style.fontStyle).toBe('normal');
  });

  it('uses yellow bold 18px for critical type', () => {
    const scene = makeScene();
    new DamageText(scene as unknown as Parameters<typeof DamageText.prototype.constructor>[0], 0, 0, 99, 'critical');

    const style = scene.texts[0].style;
    expect(style.color).toBe('#facc15');
    expect(style.fontSize).toBe('18px');
    expect(style.fontStyle).toBe('bold');
  });

  it('uses green 14px with + prefix for heal type', () => {
    const scene = makeScene();
    new DamageText(scene as unknown as Parameters<typeof DamageText.prototype.constructor>[0], 0, 0, 25, 'heal');

    const textObj = scene.texts[0];
    expect(textObj.text).toBe('+25');
    expect(textObj.style.color).toBe('#4ade80');
    expect(textObj.style.fontSize).toBe('14px');
  });

  it('uses gray italic 12px with "Miss" text for miss type', () => {
    const scene = makeScene();
    new DamageText(scene as unknown as Parameters<typeof DamageText.prototype.constructor>[0], 0, 0, 0, 'miss');

    const textObj = scene.texts[0];
    expect(textObj.text).toBe('Miss');
    expect(textObj.style.color).toBe('#9ca3af');
    expect(textObj.style.fontSize).toBe('12px');
    expect(textObj.style.fontStyle).toBe('italic');
  });

  it('play() tweens upward 30px over 600ms and fades to alpha 0', () => {
    const scene = makeScene();
    const dt = new DamageText(scene as unknown as Parameters<typeof DamageText.prototype.constructor>[0], 100, 100, 10, 'damage');

    dt.play();

    expect(scene.tweens.add).toHaveBeenCalledTimes(1);
    const tweenConfig = scene.tweens.add.mock.calls[0][0] as {
      targets: unknown;
      y: number;
      alpha: number;
      duration: number;
    };
    expect(tweenConfig.targets).toBe(scene.texts[0]);
    expect(tweenConfig.y).toBe(70); // 100 - 30
    expect(tweenConfig.alpha).toBe(0);
    expect(tweenConfig.duration).toBe(600);
  });

  it('destroy() cleans up the text object', () => {
    const scene = makeScene();
    const dt = new DamageText(scene as unknown as Parameters<typeof DamageText.prototype.constructor>[0], 0, 0, 10, 'damage');

    dt.destroy();

    expect(scene.texts[0].destroyed).toBe(true);
    expect(scene.texts[0].active).toBe(false);
  });

  it('play() calls destroy via onComplete', () => {
    const scene = makeScene();
    const dt = new DamageText(scene as unknown as Parameters<typeof DamageText.prototype.constructor>[0], 0, 0, 10, 'damage');

    dt.play();

    // onComplete is invoked immediately in our mock, so text should be destroyed
    expect(scene.texts[0].destroyed).toBe(true);
  });

  it('handles random x offset in constructor position', () => {
    // The DamageText class accepts raw x/y; offset logic lives in BattleScene.
    // Verify that passed coordinates are used directly.
    const scene = makeScene();
    new DamageText(scene as unknown as Parameters<typeof DamageText.prototype.constructor>[0], 123, 456, 7, 'critical');

    expect(scene.texts[0].x).toBe(123);
    expect(scene.texts[0].y).toBe(456);
  });
});
