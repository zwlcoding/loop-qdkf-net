import type { Scene, GameObjects } from 'phaser';

const BAR_WIDTH = 40;
const BAR_HEIGHT = 4;
const COLOR_GREEN = 0x4ade80;
const COLOR_YELLOW = 0xfacc15;
const COLOR_RED = 0xef4444;
const COLOR_GRAY = 0x808080;
const Y_OFFSET = -32;

export interface HpBarParent {
  getWorldPosition(): { x: number; y: number };
  getHp(): number;
  getMaxHp(): number;
}

export class HpBar {
  private container: GameObjects.Container;
  private background: GameObjects.Rectangle;
  private fill: GameObjects.Rectangle;
  constructor(scene: Scene, parentUnit: HpBarParent) {

    const pos = parentUnit.getWorldPosition();

    this.background = scene.add.rectangle(
      0,
      0,
      BAR_WIDTH,
      BAR_HEIGHT,
      COLOR_GRAY
    );

    this.fill = scene.add.rectangle(
      -BAR_WIDTH / 2,
      0,
      BAR_WIDTH,
      BAR_HEIGHT,
      COLOR_GREEN
    );
    this.fill.setOrigin(0, 0.5);

    this.container = scene.add.container(pos.x, pos.y + Y_OFFSET, [
      this.background,
      this.fill,
    ]);
    this.container.setDepth?.(15);

    this.update(parentUnit.getHp(), parentUnit.getMaxHp());
  }

  update(currentHp: number, maxHp: number): void {
    const ratio = maxHp > 0 ? Math.max(0, Math.min(1, currentHp / maxHp)) : 0;
    this.fill.width = BAR_WIDTH * ratio;

    const color = this.resolveColor(ratio);
    this.fill.setFillStyle(color);
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  setAlpha(alpha: number): void {
    this.container.setAlpha(alpha);
  }

  destroy(): void {
    this.background.destroy();
    this.fill.destroy();
    this.container.destroy();
  }

  private resolveColor(ratio: number): number {
    if (ratio > 0.6) return COLOR_GREEN;
    if (ratio >= 0.3) return COLOR_YELLOW;
    return COLOR_RED;
  }
}
