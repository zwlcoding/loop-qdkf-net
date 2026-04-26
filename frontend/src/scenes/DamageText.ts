import type { Scene } from 'phaser';

export type DamageTextType = 'damage' | 'heal' | 'miss' | 'critical';

interface TextStyle {
  color: string;
  fontSize: string;
  fontStyle?: string;
}

export class DamageText {
  private textObject: Phaser.GameObjects.Text;
  private scene: Scene;

  constructor(scene: Scene, x: number, y: number, value: number, type: DamageTextType) {
    this.scene = scene;

    const style = this.resolveStyle(type);
    const displayText = this.resolveDisplayText(value, type);

    this.textObject = scene.add.text(x, y, displayText, {
      color: style.color,
      fontFamily: 'monospace',
      fontSize: style.fontSize,
      fontStyle: style.fontStyle ?? 'normal',
    }).setOrigin(0.5).setDepth(15);
  }

  play(): void {
    this.scene.tweens.add({
      targets: this.textObject,
      y: this.textObject.y - 30,
      alpha: 0,
      duration: 600,
      onComplete: () => {
        this.destroy();
      },
    });
  }

  destroy(): void {
    if (this.textObject.active) {
      this.textObject.destroy();
    }
  }

  private resolveStyle(type: DamageTextType): TextStyle {
    switch (type) {
      case 'damage':
        return { color: '#ffffff', fontSize: '14px' };
      case 'critical':
        return { color: '#facc15', fontSize: '18px', fontStyle: 'bold' };
      case 'heal':
        return { color: '#4ade80', fontSize: '14px' };
      case 'miss':
        return { color: '#9ca3af', fontSize: '12px', fontStyle: 'italic' };
      default:
        return { color: '#ffffff', fontSize: '14px' };
    }
  }

  private resolveDisplayText(value: number, type: DamageTextType): string {
    if (type === 'miss') {
      return 'Miss';
    }
    if (type === 'heal') {
      return `+${value}`;
    }
    return `${value}`;
  }
}
