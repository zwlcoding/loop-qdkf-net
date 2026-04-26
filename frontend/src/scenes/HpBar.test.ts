import { describe, expect, it, vi } from 'vitest';
import { HpBar, type HpBarParent } from './HpBar';

const makeParent = (hp: number, maxHp: number): HpBarParent => ({
  getWorldPosition: () => ({ x: 100, y: 100 }),
  getHp: () => hp,
  getMaxHp: () => maxHp,
});

const makeScene = () => {
  const rectangles: Array<{
    width: number;
    height: number;
    fillColor: number;
    originX: number;
    originY: number;
    destroyed: boolean;
    setFillStyle: ReturnType<typeof vi.fn>;
    setOrigin: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  }> = [];

  const containers: Array<{
    x: number;
    y: number;
    list: unknown[];
    destroyed: boolean;
    destroy: ReturnType<typeof vi.fn>;
  }> = [];

  const addRectangle = (
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: number
  ) => {
    const rect = {
      width,
      height,
      fillColor,
      originX: 0.5,
      originY: 0.5,
      destroyed: false,
      setFillStyle: vi.fn((color: number) => {
        rect.fillColor = color;
      }),
      setOrigin: vi.fn((ox: number, oy: number) => {
        rect.originX = ox;
        rect.originY = oy;
      }),
      destroy: vi.fn(() => {
        rect.destroyed = true;
      }),
    };
    rectangles.push(rect);
    return rect;
  };

  const addContainer = (x: number, y: number, list: unknown[] = []) => {
    const container = {
      x,
      y,
      list,
      destroyed: false,
      destroy: vi.fn(() => {
        container.destroyed = true;
      }),
    };
    containers.push(container);
    return container;
  };

  return {
    rectangles,
    containers,
    add: {
      rectangle: vi.fn(addRectangle),
      container: vi.fn(addContainer),
    },
  };
};

describe('HpBar', () => {
  it('creates background and fill rectangles inside a container', () => {
    const scene = makeScene();
    const parent = makeParent(80, 100);

    new HpBar(scene as unknown as Parameters<typeof HpBar.prototype.constructor>[0], parent);

    expect(scene.add.rectangle).toHaveBeenCalledTimes(2);
    expect(scene.add.container).toHaveBeenCalledTimes(1);

    const container = scene.containers[0];
    expect(container.x).toBe(100);
    expect(container.y).toBe(68); // 100 - 32
    expect(container.list).toHaveLength(2);
  });

  it('sets fill width proportional to HP ratio', () => {
    const scene = makeScene();
    const parent = makeParent(50, 100);

    const hpBar = new HpBar(
      scene as unknown as Parameters<typeof HpBar.prototype.constructor>[0],
      parent
    );

    expect(scene.rectangles[1].width).toBe(20); // 40 * 0.5

    hpBar.update(25, 100);
    expect(scene.rectangles[1].width).toBe(10); // 40 * 0.25

    hpBar.update(100, 100);
    expect(scene.rectangles[1].width).toBe(40); // 40 * 1.0
  });

  it('clamps fill width to 0 when HP is zero or negative', () => {
    const scene = makeScene();
    const parent = makeParent(0, 100);

    const hpBar = new HpBar(
      scene as unknown as Parameters<typeof HpBar.prototype.constructor>[0],
      parent
    );

    hpBar.update(-10, 100);
    expect(scene.rectangles[1].width).toBe(0);
  });

  it('uses green color when HP > 60%', () => {
    const scene = makeScene();
    const parent = makeParent(70, 100);

    new HpBar(scene as unknown as Parameters<typeof HpBar.prototype.constructor>[0], parent);

    expect(scene.rectangles[1].fillColor).toBe(0x4ade80);
  });

  it('uses yellow color when HP is 30-60%', () => {
    const scene = makeScene();
    const parent = makeParent(45, 100);

    const hpBar = new HpBar(
      scene as unknown as Parameters<typeof HpBar.prototype.constructor>[0],
      parent
    );

    expect(scene.rectangles[1].fillColor).toBe(0xfacc15);

    hpBar.update(30, 100);
    expect(scene.rectangles[1].fillColor).toBe(0xfacc15);
  });

  it('uses red color when HP < 30%', () => {
    const scene = makeScene();
    const parent = makeParent(20, 100);

    const hpBar = new HpBar(
      scene as unknown as Parameters<typeof HpBar.prototype.constructor>[0],
      parent
    );

    expect(scene.rectangles[1].fillColor).toBe(0xef4444);

    hpBar.update(29, 100);
    expect(scene.rectangles[1].fillColor).toBe(0xef4444);
  });

  it('changes color dynamically when update crosses thresholds', () => {
    const scene = makeScene();
    const parent = makeParent(80, 100);

    const hpBar = new HpBar(
      scene as unknown as Parameters<typeof HpBar.prototype.constructor>[0],
      parent
    );

    expect(scene.rectangles[1].fillColor).toBe(0x4ade80);

    hpBar.update(50, 100);
    expect(scene.rectangles[1].fillColor).toBe(0xfacc15);

    hpBar.update(10, 100);
    expect(scene.rectangles[1].fillColor).toBe(0xef4444);
  });

  it('destroys all Phaser objects', () => {
    const scene = makeScene();
    const parent = makeParent(100, 100);

    const hpBar = new HpBar(
      scene as unknown as Parameters<typeof HpBar.prototype.constructor>[0],
      parent
    );

    hpBar.destroy();

    expect(scene.rectangles[0].destroyed).toBe(true);
    expect(scene.rectangles[1].destroyed).toBe(true);
    expect(scene.containers[0].destroyed).toBe(true);
  });
});
