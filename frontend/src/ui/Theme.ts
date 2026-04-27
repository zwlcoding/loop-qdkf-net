import { Scene, GameObjects } from 'phaser';

export const COLORS = {
  bg: {
    primary: 0x0f172a,
    secondary: 0x1e293b,
    overlay: 0x020617,
    hud: 0x10162f,
    debug: 0x081018,
  },
  text: {
    primary: '#f8fafc',
    secondary: '#94a3b8',
    muted: '#64748b',
    accent: '#ffd166',
    debug: '#9fe870',
  },
  accent: {
    blue: 0x3b82f6,
    green: 0x16a34a,
    red: 0xe63946,
    yellow: 0xffd166,
    cyan: 0x4cc9f0,
    purple: 0xc77dff,
    teal: 0x2a9d8f,
  },
  border: {
    light: 0x93c5fd,
    medium: 0x6ea8fe,
    dark: 0x334155,
    dim: 0x6b7280,
  },
  terrain: {
    plain: '#90EE90',
    mountain: '#8B7355',
    urban: '#708090',
    forest: '#228B22',
    water: '#4169E1',
  },
  difficulty: {
    easy: 0x22c55e,
    normal: 0xeab308,
    hard: 0xf97316,
    extreme: 0xef4444,
  },
  squad: {
    player: 0x6699ff,
    enemy: 0xff6666,
    boss: 0xffc857,
    neutral: 0xaaaaaa,
  },
} as const;

export const FONTS = {
  title: {
    family: 'monospace',
    size: '32px',
    color: COLORS.text.primary,
  },
  body: {
    family: 'monospace',
    size: '16px',
    color: COLORS.text.primary,
  },
  ui: {
    family: 'monospace',
    size: '14px',
    color: COLORS.text.secondary,
  },
  hud: {
    family: 'monospace',
    size: '12px',
    color: COLORS.text.primary,
  },
} as const;

export interface PanelOptions {
  fillColor?: number;
  fillAlpha?: number;
  strokeColor?: number;
  strokeAlpha?: number;
  strokeWidth?: number;
  depth?: number;
  scrollFactor?: number;
  rounded?: boolean;
  radius?: number;
}

export function createButton(
  scene: Scene,
  x: number,
  y: number,
  label: string,
  width: number,
  height: number,
  callback: () => void
): { background: GameObjects.Rectangle; text: GameObjects.Text } {
  const bg = scene.add
    .rectangle(x, y, width, height, COLORS.accent.blue, 0.92)
    .setStrokeStyle(2, COLORS.border.medium, 0.85)
    .setInteractive({ useHandCursor: true });

  const text = scene.add
    .text(x, y, label, {
      color: '#ffffff',
      fontFamily: FONTS.body.family,
      fontSize: FONTS.body.size,
    })
    .setOrigin(0.5);

  const onOver = () => {
    bg.setFillStyle(COLORS.accent.blue, 1);
    bg.setScale(1.02);
    text.setScale(1.02);
  };
  const onOut = () => {
    bg.setFillStyle(COLORS.accent.blue, 0.92);
    bg.setScale(1);
    text.setScale(1);
  };
  const onDown = () => {
    bg.setFillStyle(COLORS.accent.teal, 1);
    bg.setScale(0.98);
    text.setScale(0.98);
  };
  const onUp = () => {
    bg.setFillStyle(COLORS.accent.blue, 0.92);
    bg.setScale(1);
    text.setScale(1);
    callback();
  };

  bg.on('pointerover', onOver);
  bg.on('pointerout', onOut);
  bg.on('pointerdown', onDown);
  bg.on('pointerup', onUp);

  text.setInteractive({ useHandCursor: true });
  text.on('pointerover', onOver);
  text.on('pointerout', onOut);
  text.on('pointerdown', onDown);
  text.on('pointerup', onUp);

  return { background: bg, text };
}

export function createPanel(
  scene: Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  options: PanelOptions = {}
): GameObjects.Rectangle {
  const {
    fillColor = COLORS.bg.overlay,
    fillAlpha = 0.92,
    strokeColor = COLORS.border.light,
    strokeAlpha = 0.8,
    strokeWidth = 2,
    depth = 0,
    scrollFactor = 0,
    rounded = false,
    radius = 8,
  } = options;

  if (rounded) {
    const gfx = scene.add.graphics();
    gfx.fillStyle(fillColor, fillAlpha);
    gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, radius);
    if (strokeWidth > 0) {
      gfx.lineStyle(strokeWidth, strokeColor, strokeAlpha);
      gfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, radius);
    }
    gfx.setDepth(depth);
    if (scrollFactor !== undefined) {
      gfx.setScrollFactor(scrollFactor);
    }
    // Return a dummy rectangle for position reference; caller should manage lifecycle
    const rect = scene.add.rectangle(x, y, w, h, fillColor, 0).setDepth(depth);
    if (scrollFactor !== undefined) {
      rect.setScrollFactor(scrollFactor);
    }
    rect.setData('graphics', gfx);
    return rect;
  }

  const rect = scene.add
    .rectangle(x, y, w, h, fillColor, fillAlpha)
    .setStrokeStyle(strokeWidth, strokeColor, strokeAlpha)
    .setDepth(depth);

  if (scrollFactor !== undefined) {
    rect.setScrollFactor(scrollFactor);
  }

  return rect;
}

export function fadeIn(
  scene: Scene,
  target: { setAlpha: (a: number) => void; alpha: number },
  duration: number = 300
): void {
  target.setAlpha(0);
  scene.tweens.add({
    targets: target,
    alpha: 1,
    duration,
    ease: 'Power2',
  });
}

export function fadeOut(
  scene: Scene,
  target: { setAlpha: (a: number) => void; alpha: number },
  duration: number = 300
): void {
  scene.tweens.add({
    targets: target,
    alpha: 0,
    duration,
    ease: 'Power2',
  });
}
