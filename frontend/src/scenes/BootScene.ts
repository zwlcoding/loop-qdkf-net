import { Scene, GameObjects } from 'phaser';
import { contentLoader } from '../data/ContentLoader';
import { AssetIntake } from '../core/AssetIntake';
import { resolvePublicAssetPath } from '../core/AssetPath';
import { ProgressManager } from '../core/ProgressManager';
import { AudioManager } from '../core/AudioManager';
import { COLORS, FONTS, createButton } from '../ui/Theme';
import type { Mission } from '../data/MissionTypes';
import missionsData from '../data/missions.json';

export class BootScene extends Scene {
  private assetIntake!: AssetIntake;
  private progressManager = new ProgressManager();
  // Loading UI elements
  private loadingBg!: GameObjects.Rectangle;
  private progressBar!: GameObjects.Rectangle;
  private progressBorder!: GameObjects.Rectangle;
  private progressText!: GameObjects.Text;
  private loadingTitle!: GameObjects.Text;
  private loadingHint!: GameObjects.Text;
  private hintDots = 0;
  private hintTimer = 0;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.showLoadingUI();

    this.assetIntake = new AssetIntake(this);
    this.assetIntake.loadAllAssets();

    AudioManager.getInstance().preload(this);

    this.load.image('particle-slash', resolvePublicAssetPath('particles/slash.png'));
    this.load.image('particle-projectile', resolvePublicAssetPath('particles/projectile.png'));
    this.load.image('particle-magic', resolvePublicAssetPath('particles/magic-spark.png'));
    this.load.image('particle-death', resolvePublicAssetPath('particles/death-burst.png'));

    this.load.json('chassis-data', resolvePublicAssetPath('data/chassis.json'));
    this.load.json('modules-data', resolvePublicAssetPath('data/modules.json'));
    this.load.json('mission-templates', resolvePublicAssetPath('data/mission-templates.json'));
    this.load.json('map-events', resolvePublicAssetPath('data/map-events.json'));

    // Character sprites
    this.load.image('unit-vanguard', resolvePublicAssetPath('units/vanguard-sprite.png'));
    this.load.image('unit-skirmisher', resolvePublicAssetPath('units/skirmisher-sprite.png'));
    this.load.image('unit-controller', resolvePublicAssetPath('units/controller-sprite.png'));
    this.load.image('unit-support', resolvePublicAssetPath('units/support-sprite.png'));
    this.load.image('unit-caster', resolvePublicAssetPath('units/caster-sprite.png'));

    // Terrain tile sprites
    this.load.imageLoadType = 'HTMLImageElement';
    this.load.image('tile-plain-sprite', resolvePublicAssetPath('tiles/tile-plain-sprite.png'));
    this.load.image('tile-mountain-sprite', resolvePublicAssetPath('tiles/tile-mountain-sprite.png'));
    this.load.image('tile-urban-sprite', resolvePublicAssetPath('tiles/tile-urban-sprite.png'));
    this.load.image('tile-forest-sprite', resolvePublicAssetPath('tiles/tile-forest-sprite.png'));
    this.load.image('tile-water-sprite', resolvePublicAssetPath('tiles/tile-water-sprite.png'));
    this.load.imageLoadType = 'XHR';

    // Wire up progress events
    this.load.on('progress', (value: number) => {
      this.updateProgress(value);
    });
    this.load.on('complete', () => {
      this.cleanUpLoadingUI();
    });
  }

  create(): void {
    // Generate placeholders for missing assets
    this.assetIntake.generatePlaceholders();

    // Parse loaded data
    const chassisData = this.cache.json.get('chassis-data');
    const modulesData = this.cache.json.get('modules-data');
    const missionTemplates = this.cache.json.get('mission-templates');
    const mapEvents = this.cache.json.get('map-events');

    // Load into content loader
    contentLoader.loadChassis(chassisData);
    contentLoader.loadModules(modulesData);
    contentLoader.loadMissionTemplates(missionTemplates);
    contentLoader.loadMapEvents(mapEvents);

    // Store in registry for cross-scene access
    this.registry.set('chassisData', chassisData);
    this.registry.set('modulesData', modulesData);
    this.registry.set('missionTemplates', missionTemplates);
    this.registry.set('mapEvents', mapEvents);
    this.registry.set('contentLoader', contentLoader);

    this.showMainMenu();
  }

  /* ── Loading UI ──────────────────────────────────── */

  private showLoadingUI(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const isPortrait = h > w;

    // Dark background
    this.loadingBg = this.add.rectangle(w / 2, h / 2, w, h, 0x0f172a);

    // Title
    const titleY = isPortrait ? h * 0.32 : h * 0.35;
    this.loadingTitle = this.add.text(w / 2, titleY, 'LOOP QDKF', {
      color: '#f8fafc',
      fontFamily: 'monospace',
      fontSize: isPortrait ? '26px' : '32px',
    }).setOrigin(0.5);

    // Progress bar dimensions
    const barWidth = Math.min(w * 0.6, 320);
    const barHeight = 12;
    const barX = (w - barWidth) / 2;
    const barY = titleY + 60;

    // Border (1px outline)
    this.progressBorder = this.add.rectangle(
      barX + barWidth / 2, barY, barWidth + 4, barHeight + 4, 0x334155
    ).setOrigin(0.5);

    // Bar (starts at 0 width)
    this.progressBar = this.add.rectangle(
      barX, barY - barHeight / 2, 0, barHeight, 0x3b82f6
    ).setOrigin(0, 0);

    // Percentage text
    this.progressText = this.add.text(w / 2, barY + 28, '0%', {
      color: '#94a3b8',
      fontFamily: 'monospace',
      fontSize: '14px',
    }).setOrigin(0.5);

    // Hint text (animated dots)
    this.loadingHint = this.add.text(w / 2, barY + 54, '正在加载资源', {
      color: '#64748b',
      fontFamily: 'monospace',
      fontSize: '13px',
    }).setOrigin(0.5);
  }

  private updateProgress(value: number): void {
    const barWidth = Math.min(this.scale.width * 0.6, 320);

    this.progressBar.width = barWidth * value;
    this.progressText.setText(`${Math.floor(value * 100)}%`);

    // Animate hint dots
    const dots = '.'.repeat(this.hintDots % 4);
    this.loadingHint.setText(`正在加载资源${dots}`);
  }

  private cleanUpLoadingUI(): void {
    this.loadingBg?.destroy();
    this.progressBar?.destroy();
    this.progressBorder?.destroy();
    this.progressText?.destroy();
    this.loadingTitle?.destroy();
    this.loadingHint?.destroy();
  }

  update(_time: number, delta: number): void {
    // Animate loading dots while loading
    if (this.loadingHint?.active) {
      this.hintTimer += delta;
      if (this.hintTimer > 400) {
        this.hintTimer = 0;
        this.hintDots++;
        const dots = '.'.repeat(this.hintDots % 4);
        this.loadingHint.setText(`正在加载资源${dots}`);
      }
    }
  }

  private showMainMenu(): void {
    AudioManager.getInstance().playBgm('menu-bgm');
    this.cameras.main.setBackgroundColor('#0f172a');

    const w = this.scale.width;
    const h = this.scale.height;
    const isPortrait = h > w;
    const titleSize = isPortrait ? '48px' : '64px';
    const btnWidth = isPortrait ? w - 64 : 280;
    const btnHeight = isPortrait ? 64 : 56;

    const titleY = isPortrait ? 120 : 160;

    // Glow layer (duplicate text behind) — breathing animation
    const glowText = this.add.text(w / 2, titleY, 'LOOP QDKF', {
      color: '#3b82f6',
      fontFamily: 'monospace',
      fontSize: titleSize,
      align: 'center',
    }).setOrigin(0.5).setAlpha(0.35);

    this.tweens.add({
      targets: glowText,
      alpha: { from: 0.2, to: 0.5 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Main title
    this.add.text(w / 2, titleY, 'LOOP QDKF', {
      color: '#f8fafc',
      fontFamily: 'monospace',
      fontSize: titleSize,
      align: 'center',
    }).setOrigin(0.5);

    // Version text at bottom
    this.add.text(w / 2, h - 30, 'v0.2.0', {
      color: COLORS.text.muted,
      fontFamily: FONTS.ui.family,
      fontSize: FONTS.ui.size,
    }).setOrigin(0.5);

    const hasUnfinished = this.progressManager.hasUnfinishedRun();

    if (hasUnfinished) {
      createButton(
        this,
        w / 2,
        isPortrait ? h / 2 - 40 : h / 2 - 30,
        '继续上次运行',
        btnWidth,
        btnHeight,
        () => this.continueRun()
      );
      createButton(
        this,
        w / 2,
        isPortrait ? h / 2 + 60 : h / 2 + 50,
        '开始新游戏',
        btnWidth,
        btnHeight,
        () => this.startNewGame()
      );
    } else {
      createButton(
        this,
        w / 2,
        isPortrait ? h / 2 : h / 2,
        '开始新游戏',
        btnWidth,
        btnHeight,
        () => this.startNewGame()
      );
    }
  }

  private startNewGame(): void {
    this.scene.start('MissionSelect');
  }

  private continueRun(): void {
    const progress = this.progressManager.load();
    if (!progress) {
      this.startNewGame();
      return;
    }

    const missions: Mission[] = (missionsData as unknown as { missions: Mission[] }).missions;
    const mission = missions.find((m) => m.id === progress.missionId);

    if (mission) {
      this.registry.set('selectedMission', mission);
    }

    this.registry.set('runProgress', progress);
    this.scene.start('BattleScene');
  }
}
