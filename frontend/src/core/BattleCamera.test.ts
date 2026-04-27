import { describe, expect, it } from 'vitest';
import { expandBattleCameraBounds, resolveBattleCameraScroll } from './BattleCamera';

describe('BattleCamera', () => {
  it('centers small boards inside the battle viewport', () => {
    const scroll = resolveBattleCameraScroll({
      bounds: { x: 100, y: 200, width: 240, height: 160 },
      viewport: { x: 0, y: 120, width: 390, height: 420 },
      focus: { x: 140, y: 240 },
    });

    expect(scroll.scrollX).toBeCloseTo(25);
    expect(scroll.scrollY).toBeCloseTo(-50);
  });

  it('focuses a local region on large boards', () => {
    const scroll = resolveBattleCameraScroll({
      bounds: { x: 0, y: 0, width: 1200, height: 900 },
      viewport: { x: 0, y: 160, width: 390, height: 420 },
      focus: { x: 700, y: 520 },
    });

    expect(scroll.scrollX).toBeCloseTo(505);
    expect(scroll.scrollY).toBeCloseTo(150);
  });

  it('clamps focus near board edges', () => {
    const scroll = resolveBattleCameraScroll({
      bounds: { x: 0, y: 0, width: 1200, height: 900 },
      viewport: { x: 0, y: 160, width: 390, height: 420 },
      focus: { x: 30, y: 20 },
    });

    expect(scroll.scrollX).toBe(0);
    expect(scroll.scrollY).toBe(-160);
  });

  it('expands board bounds with padding', () => {
    expect(expandBattleCameraBounds({ x: 10, y: 20, width: 100, height: 80 }, 12)).toEqual({
      x: -2,
      y: 8,
      width: 124,
      height: 104,
    });
  });
});
