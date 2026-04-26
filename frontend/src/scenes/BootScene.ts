import { Scene } from 'phaser';
import { contentLoader } from '../data/ContentLoader';
import { AssetIntake } from '../core/AssetIntake';
import { resolvePublicAssetPath } from '../core/AssetPath';
import { ProgressManager } from '../core/ProgressManager';
import { AudioManager } from '../core/AudioManager';
import type { Mission } from '../data/MissionTypes';
import missionsData from '../data/missions.json';

export class BootScene extends Scene {
  private assetIntake!: AssetIntake;
  private progressManager = new ProgressManager();

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.assetIntake = new AssetIntake(this);
    this.assetIntake.loadAllAssets();

    AudioManager.getInstance().preload(this);

    this.load.image('particle-slash', resolvePublicAssetPath('particles/slash.png'));
    this.load.image('particle-projectile', resolvePublicAssetPath('particles/projectile.png'));
    this.load.image('particle-magic', resolvePublicAssetPath('particles/magic.png'));
    this.load.image('particle-death', resolvePublicAssetPath('particles/death.png'));

    // Vite publicDir assets are served from BASE_URL in build and root in dev.
    this.load.json('chassis-data', resolvePublicAssetPath('data/chassis.json'));
    this.load.json('modules-data', resolvePublicAssetPath('data/modules.json'));
    this.load.json('mission-templates', resolvePublicAssetPath('data/mission-templates.json'));
    this.load.json('map-events', resolvePublicAssetPath('data/map-events.json'));
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

  private showMainMenu(): void {
    AudioManager.getInstance().playBgm('menu-bgm');
    this.cameras.main.setBackgroundColor('#0f172a');

    const isPortrait = this.scale.height > this.scale.width;
    const titleSize = isPortrait ? '28px' : '36px';
    const btnWidth = isPortrait ? this.scale.width - 64 : 280;
    const btnHeight = isPortrait ? 64 : 56;
    const btnFontSize = isPortrait ? '18px' : '16px';

    this.add.text(this.scale.width / 2, isPortrait ? 120 : 160, 'LOOP QDKF', {
      color: '#f8fafc',
      fontFamily: 'monospace',
      fontSize: titleSize,
      align: 'center',
    }).setOrigin(0.5);

    const hasUnfinished = this.progressManager.hasUnfinishedRun();

    if (hasUnfinished) {
      this.createButton(
        this.scale.width / 2,
        isPortrait ? this.scale.height / 2 - 40 : this.scale.height / 2 - 30,
        '继续上次运行',
        btnWidth,
        btnHeight,
        btnFontSize,
        0x16a34a,
        0x86efac,
        () => this.continueRun()
      );
      this.createButton(
        this.scale.width / 2,
        isPortrait ? this.scale.height / 2 + 60 : this.scale.height / 2 + 50,
        '开始新游戏',
        btnWidth,
        btnHeight,
        btnFontSize,
        0x1d4ed8,
        0xbfdbfe,
        () => this.startNewGame()
      );
    } else {
      this.createButton(
        this.scale.width / 2,
        isPortrait ? this.scale.height / 2 : this.scale.height / 2,
        '开始新游戏',
        btnWidth,
        btnHeight,
        btnFontSize,
        0x1d4ed8,
        0xbfdbfe,
        () => this.startNewGame()
      );
    }
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    width: number,
    height: number,
    fontSize: string,
    fillColor: number,
    strokeColor: number,
    onClick: () => void
  ): void {
    const background = this.add.rectangle(x, y, width, height, fillColor, 0.92)
      .setStrokeStyle(2, strokeColor, 0.85)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      color: '#ffffff',
      fontFamily: 'monospace',
      fontSize,
    }).setOrigin(0.5);

    background.on('pointerdown', onClick);
    text.setInteractive({ useHandCursor: true }).on('pointerdown', onClick);
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
