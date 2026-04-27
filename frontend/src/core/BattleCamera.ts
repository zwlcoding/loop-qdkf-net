import type { GridMapViewport } from './GridMap';

export interface BattleCameraBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BattleCameraFocusPoint {
  x: number;
  y: number;
}

export interface BattleCameraScroll {
  scrollX: number;
  scrollY: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function resolveAxisScroll(args: {
  boundsStart: number;
  boundsSize: number;
  viewportStart: number;
  viewportSize: number;
  focus: number;
}): number {
  const { boundsStart, boundsSize, viewportStart, viewportSize, focus } = args;
  const viewportCenter = viewportStart + viewportSize / 2;
  const centeredScroll = focus - viewportCenter;

  if (boundsSize <= viewportSize) {
    return boundsStart + boundsSize / 2 - viewportCenter;
  }

  const minScroll = boundsStart - viewportStart;
  const maxScroll = boundsStart + boundsSize - viewportStart - viewportSize;
  return clamp(centeredScroll, minScroll, maxScroll);
}

export function expandBattleCameraBounds(bounds: BattleCameraBounds, padding: number): BattleCameraBounds {
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  };
}

export function resolveBattleCameraScroll(args: {
  bounds: BattleCameraBounds;
  viewport: GridMapViewport;
  focus: BattleCameraFocusPoint;
}): BattleCameraScroll {
  const { bounds, viewport, focus } = args;
  return {
    scrollX: resolveAxisScroll({
      boundsStart: bounds.x,
      boundsSize: bounds.width,
      viewportStart: viewport.x,
      viewportSize: viewport.width,
      focus: focus.x,
    }),
    scrollY: resolveAxisScroll({
      boundsStart: bounds.y,
      boundsSize: bounds.height,
      viewportStart: viewport.y,
      viewportSize: viewport.height,
      focus: focus.y,
    }),
  };
}
