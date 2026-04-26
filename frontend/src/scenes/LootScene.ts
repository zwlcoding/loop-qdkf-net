import { Scene, GameObjects } from 'phaser';
import { contentLoader } from '../data/ContentLoader';
import { generateLoot } from '../core/LootSystem';
import type { ModuleDefinition } from '../data/ModuleTypes';
import type { LootDrop } from '../core/LootSystem';

const RARITY_COLORS: Record<string, number> = {
  common: 0x9ca3af,
  uncommon: 0x22c55e,
  rare: 0x3b82f6,
  epic: 0xa855f7,
};

const RARITY_LABELS: Record<string, string> = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  epic: '史诗',
};

interface CardInfo {
  container: GameObjects.Container;
  drop: LootDrop;
  module: ModuleDefinition;
}

export class LootScene extends Scene {
  private cards: CardInfo[] = [];
  private skipBtn!: GameObjects.Container;
  private titleText!: GameObjects.Text;

  constructor() {
    super({ key: 'LootScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0f172a');
    this.buildUI();

    this.scale.on('resize', this.handleResize, this);
  }

  private buildUI(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const isPortrait = h > w;

    // Title
    this.titleText = this.add.text(w / 2, isPortrait ? h * 0.08 : h * 0.1, '选择战利品', {
      color: '#f8fafc',
      fontFamily: 'monospace',
      fontSize: isPortrait ? '24px' : '28px',
    }).setOrigin(0.5);

    // Get modules
    let allModules: ModuleDefinition[] = this.registry.get('allModules');
    if (!allModules || allModules.length === 0) {
      allModules = contentLoader.getAllModules();
    }

    const loot = generateLoot(allModules, 3);
    const drops = loot.drops;

    // Card dimensions
    const cardWidth = isPortrait ? w * 0.75 : 220;
    const cardHeight = isPortrait ? 180 : 200;
    const gap = isPortrait ? 20 : 24;

    // Position cards
    if (isPortrait) {
      const startY = h * 0.22;
      for (let i = 0; i < drops.length; i++) {
        const mod = contentLoader.getModule(drops[i].moduleId);
        if (!mod) continue;
        const y = startY + i * (cardHeight + gap);
        const card = this.createCard(w / 2, y, cardWidth, cardHeight, drops[i], mod);
        this.cards.push({ container: card, drop: drops[i], module: mod });
      }
    } else {
      const totalWidth = drops.length * cardWidth + (drops.length - 1) * gap;
      const startX = (w - totalWidth) / 2 + cardWidth / 2;
      const y = h * 0.42;
      for (let i = 0; i < drops.length; i++) {
        const mod = contentLoader.getModule(drops[i].moduleId);
        if (!mod) continue;
        const x = startX + i * (cardWidth + gap);
        const card = this.createCard(x, y, cardWidth, cardHeight, drops[i], mod);
        this.cards.push({ container: card, drop: drops[i], module: mod });
      }
    }

    // Skip button
    const skipY = isPortrait ? h * 0.88 : h * 0.82;
    this.skipBtn = this.createSkipButton(w / 2, skipY);
  }

  private createCard(
    x: number,
    y: number,
    width: number,
    height: number,
    drop: LootDrop,
    mod: ModuleDefinition
  ): GameObjects.Container {
    const container = this.add.container(x, y);
    const rarityColor = RARITY_COLORS[drop.rarity] ?? 0x9ca3af;

    // Background
    const bg = this.add.rectangle(0, 0, width, height, 0x1e293b, 0.95)
      .setStrokeStyle(2, rarityColor, 0.9);
    container.add(bg);

    // Rarity badge
    const badgeHeight = 22;
    const badgeWidth = 56;
    const badge = this.add.rectangle(
      -width / 2 + badgeWidth / 2 + 10,
      -height / 2 + badgeHeight / 2 + 10,
      badgeWidth,
      badgeHeight,
      rarityColor,
      0.9
    );
    container.add(badge);

    const badgeText = this.add.text(
      badge.x,
      badge.y,
      RARITY_LABELS[drop.rarity] ?? drop.rarity,
      {
        color: '#ffffff',
        fontFamily: 'monospace',
        fontSize: '12px',
      }
    ).setOrigin(0.5);
    container.add(badgeText);

    // Module name
    const nameText = this.add.text(0, -height * 0.15, mod.name, {
      color: '#f8fafc',
      fontFamily: 'monospace',
      fontSize: '18px',
      align: 'center',
    }).setOrigin(0.5);
    container.add(nameText);

    // Description (wrapped)
    const descText = this.add.text(0, height * 0.18, mod.description, {
      color: '#94a3b8',
      fontFamily: 'monospace',
      fontSize: '13px',
      align: 'center',
      wordWrap: { width: width - 24 },
    }).setOrigin(0.5);
    container.add(descText);

    // Interactivity
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setFillStyle(0x334155, 0.95);
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x1e293b, 0.95);
    });
    bg.on('pointerdown', () => {
      this.selectModule(mod);
    });

    return container;
  }

  private createSkipButton(x: number, y: number): GameObjects.Container {
    const container = this.add.container(x, y);
    const width = 140;
    const height = 44;

    const bg = this.add.rectangle(0, 0, width, height, 0x475569, 0.9)
      .setStrokeStyle(2, 0x94a3b8, 0.8);
    const label = this.add.text(0, 0, '跳过', {
      color: '#e2e8f0',
      fontFamily: 'monospace',
      fontSize: '16px',
    }).setOrigin(0.5);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setFillStyle(0x64748b, 0.9);
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x475569, 0.9);
    });
    bg.on('pointerdown', () => {
      this.goToRiftMap();
    });

    container.add([bg, label]);
    return container;
  }

  private selectModule(mod: ModuleDefinition): void {
    const playerModules: ModuleDefinition[] = this.registry.get('playerModules') ?? [];
    playerModules.push(mod);
    this.registry.set('playerModules', playerModules);
    this.goToRiftMap();
  }

  private goToRiftMap(): void {
    this.scene.start('RiftMapScene');
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const w = gameSize.width;
    const h = gameSize.height;
    const isPortrait = h > w;

    this.titleText.setPosition(w / 2, isPortrait ? h * 0.08 : h * 0.1);
    this.titleText.setFontSize(isPortrait ? '24px' : '28px');

    // Rebuild cards on resize
    for (const card of this.cards) {
      card.container.destroy();
    }
    this.cards = [];
    this.skipBtn.destroy();

    this.buildUI();
  }
}
