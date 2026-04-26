import { Scene } from 'phaser';
import { contentLoader } from '../data/ContentLoader';
import { BATTLE_SETUP_REGISTRY_KEY, createSeededBattleSetup, validateBattleSetup } from '../core/BattleSetup';
import { AudioManager } from '../core/AudioManager';

export class SetupScene extends Scene {
  private missionIndex = 0;
  private setupIndex = 0;
  private missionIds: string[] = [];
  private summaryText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SetupScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0f172a');
    AudioManager.getInstance().playBgm('setup-bgm');

    const isPortrait = this.scale.height > this.scale.width;
    const titleSize = isPortrait ? '22px' : '28px';
    const textSize = isPortrait ? '13px' : '16px';
    const hintSize = isPortrait ? '12px' : '15px';

    this.add.text(this.scale.width / 2, isPortrait ? 48 : 72, '本地双小队设置', {
      color: '#f8fafc',
      fontFamily: 'monospace',
      fontSize: titleSize,
      align: 'center',
    }).setOrigin(0.5);

    this.summaryText = this.add.text(this.scale.width / 2, isPortrait ? 100 : 160, '加载中...', {
      color: '#e2e8f0',
      fontFamily: 'monospace',
      fontSize: textSize,
      align: 'left',
      backgroundColor: '#111827cc',
      padding: { x: 12, y: 12 },
      wordWrap: { width: Math.min(isPortrait ? 340 : 680, this.scale.width - 32) },
    }).setOrigin(0.5, 0);

    this.hintText = this.add.text(this.scale.width / 2, this.scale.height - (isPortrait ? 48 : 96), '', {
      color: '#93c5fd',
      fontFamily: 'monospace',
      fontSize: hintSize,
      align: 'center',
    }).setOrigin(0.5);

    if (isPortrait) {
      // 竖屏：按钮垂直排列
      const btnY = this.scale.height - 200;
      const btnGap = 60;
      this.createButton(this.scale.width / 2, btnY, '切任务', () => {
        AudioManager.getInstance().playSfx('sfx-click');
        this.missionIndex = (this.missionIndex + 1) % this.missionIds.length;
        this.refreshPreview();
      });
      this.createButton(this.scale.width / 2, btnY + btnGap, '切编成', () => {
        AudioManager.getInstance().playSfx('sfx-click');
        this.setupIndex = (this.setupIndex + 1) % 2;
        this.refreshPreview();
      });
      this.createButton(this.scale.width / 2, btnY + btnGap * 2, '开始战斗', () => {
        AudioManager.getInstance().playSfx('sfx-confirm');
        this.startBattle();
      });
    } else {
      // 横屏：按钮水平排列
      this.createButton(this.scale.width / 2 - 220, this.scale.height - 160, '切任务', () => {
        AudioManager.getInstance().playSfx('sfx-click');
        this.missionIndex = (this.missionIndex + 1) % this.missionIds.length;
        this.refreshPreview();
      });
      this.createButton(this.scale.width / 2, this.scale.height - 160, '切编成', () => {
        AudioManager.getInstance().playSfx('sfx-click');
        this.setupIndex = (this.setupIndex + 1) % 2;
        this.refreshPreview();
      });
      this.createButton(this.scale.width / 2 + 220, this.scale.height - 160, '开始战斗', () => {
        AudioManager.getInstance().playSfx('sfx-confirm');
        this.startBattle();
      });
    }

    this.input.keyboard?.on('keydown-M', () => {
      this.missionIndex = (this.missionIndex + 1) % this.missionIds.length;
      this.refreshPreview();
    });
    this.input.keyboard?.on('keydown-S', () => {
      this.setupIndex = (this.setupIndex + 1) % 2;
      this.refreshPreview();
    });
    this.input.keyboard?.on('keydown-ENTER', () => this.startBattle());
    this.input.keyboard?.on('keydown-SPACE', () => this.startBattle());

    setTimeout(() => {
      this.missionIds = contentLoader.getAllMissionTemplates().map((template) => template.id);
      if (this.missionIds.length === 0) {
        this.missionIds = ['coop_boss_kill'];
      }
      this.missionIndex = Math.min(this.missionIndex, this.missionIds.length - 1);
      this.refreshPreview();
    }, 0);
  }

  private createButton(x: number, y: number, label: string, onClick: () => void): void {
    const background = this.add.rectangle(x, y, 180, 52, 0x1d4ed8, 0.92)
      .setStrokeStyle(2, 0xbfdbfe, 0.85)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      color: '#ffffff',
      fontFamily: 'monospace',
      fontSize: '16px',
    }).setOrigin(0.5);

    background.on('pointerdown', onClick);
    text.setInteractive({ useHandCursor: true }).on('pointerdown', onClick);
  }

  private buildPreviewSetup() {
    const missionId = this.missionIds[this.missionIndex];
    const setup = createSeededBattleSetup(missionId);

    if (this.setupIndex === 1) {
      setup.squads[0] = {
        ...setup.squads[0],
        name: 'Alpha Rush',
        units: [
          { id: 'a-1', label: 'A1 游击', chassisId: 'skirmisher', tile: { x: 2, y: 4 }, moduleIds: ['slash', 'charge', 'adrenaline', 'team_strike', 'smoke_bomb'] },
          { id: 'a-2', label: 'A2 控场', chassisId: 'controller', tile: { x: 2, y: 6 }, moduleIds: ['root_shot', 'toxin_round', 'iron_skin', 'rescue_link', 'flash_bang'] },
          { id: 'a-3', label: 'A3 支援', chassisId: 'support', tile: { x: 3, y: 5 }, moduleIds: ['heal', 'barrier_field', 'vigor', 'rescue_link', 'stim_pack'] },
        ],
      };
    }

    return setup;
  }

  private refreshPreview(): void {
    const setup = this.buildPreviewSetup();
    const validation = validateBattleSetup(setup, {
      chassis: contentLoader.getAllChassis(),
      modules: contentLoader.getAllModules(),
      missions: contentLoader.getAllMissionTemplates(),
    });
    const mission = contentLoader.getMissionTemplate(setup.missionTemplateId ?? '')?.name ?? setup.missionTemplateId ?? '随机任务';

    const squadLines = setup.squads.reduce<string[]>((lines, squad) => {
      lines.push(`${squad.name}｜${squad.control === 'human' ? '本地操作' : 'AI 操作'}`);
      squad.units.forEach((unit) => {
        lines.push(`- ${unit.label}：${unit.chassisId} @ (${unit.tile.x},${unit.tile.y})`);
      });
      return lines;
    }, []);

    this.summaryText.setText([
      `任务：${mission}`,
      `Boss：${setup.boss?.enabled ? '启用' : '关闭'}`,
      `校验：${validation.valid ? '通过' : validation.errors.map((error) => error.message).join('；')}`,
      '',
      ...squadLines,
    ].join('\n'));

    this.hintText.setText('M 切任务 ｜ S 切编成 ｜ Enter/空格 开始\n移动/触屏/AI 流程保持不变，R 可在结算后返回这里');
  }

  private startBattle(): void {
    AudioManager.getInstance().playSfx('sfx-confirm');
    const setup = this.buildPreviewSetup();
    const validation = validateBattleSetup(setup, {
      chassis: contentLoader.getAllChassis(),
      modules: contentLoader.getAllModules(),
      missions: contentLoader.getAllMissionTemplates(),
    });

    if (!validation.valid) {
      this.hintText.setText(`设置无效：${validation.errors.map((error) => error.message).join('；')}`);
      return;
    }

    this.registry.set(BATTLE_SETUP_REGISTRY_KEY, setup);
    this.scene.start('BattleScene');
  }
}
