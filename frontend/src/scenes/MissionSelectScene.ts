import { Scene, Geom } from 'phaser';
import type { Mission, Reward, UnlockCondition } from '../data/MissionTypes';
import missionsData from '../data/missions.json';
import { ProgressManager } from '../core/ProgressManager';
import { AudioManager } from '../core/AudioManager';
import { COLORS, FONTS, createPanel } from '../ui/Theme';

const DIFFICULTY_COLORS: Record<string, number> = {
  easy: COLORS.difficulty.easy,
  normal: COLORS.difficulty.normal,
  hard: COLORS.difficulty.hard,
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '简单',
  normal: '普通',
  hard: '困难',
};

export class MissionSelectScene extends Scene {
  private progressManager = new ProgressManager();

  constructor() {
    super({ key: 'MissionSelect' });
  }

  create(): void {
    AudioManager.getInstance().playBgm('menu-bgm');
    this.cameras.main.setBackgroundColor('#0f172a');

    const isPortrait = this.scale.height > this.scale.width;
    const cardWidth = isPortrait ? this.scale.width - 32 : Math.min(640, this.scale.width - 64);
    const startX = (this.scale.width - cardWidth) / 2;
    const startY = isPortrait ? 80 : 100;
    const cardGap = isPortrait ? 16 : 20;
    const cardMinHeight = 48;

    this.add.text(this.scale.width / 2, isPortrait ? 36 : 48, '选择任务', {
      color: FONTS.title.color,
      fontFamily: FONTS.title.family,
      fontSize: FONTS.title.size,
      align: 'center',
    }).setOrigin(0.5);

    const missions: Mission[] = (missionsData as unknown as { missions: Mission[] }).missions;

    missions.forEach((mission, index) => {
      const y = startY + index * (cardMinHeight + cardGap + 60);
      this.createMissionCard(mission, startX, y, cardWidth, cardMinHeight, isPortrait);
    });
  }

  private createMissionCard(
    mission: Mission,
    x: number,
    y: number,
    width: number,
    minHeight: number,
    isPortrait: boolean
  ): void {
    const isLocked = !this.isMissionUnlocked(mission);
    const difficultyColor = DIFFICULTY_COLORS[mission.difficulty] ?? COLORS.text.secondary;
    const difficultyLabel = DIFFICULTY_LABELS[mission.difficulty] ?? mission.difficulty;

    const padding = isPortrait ? 12 : 16;
    const fontSize = isPortrait ? '14px' : '16px';
    const badgeFontSize = isPortrait ? '12px' : '14px';

    const container = this.add.container(x, y);

    // Card background using createPanel
    const bg = createPanel(
      this,
      width / 2,
      minHeight / 2,
      width,
      minHeight,
      {
        fillColor: COLORS.bg.secondary,
        fillAlpha: 0.95,
        strokeColor: isLocked ? COLORS.border.dim : COLORS.border.dark,
        strokeAlpha: 0.9,
        strokeWidth: 2,
      }
    ).setOrigin(0.5);
    container.add(bg);

    // Difficulty color strip on left side (3px wide rectangle)
    const strip = this.add.rectangle(0, minHeight / 2, 3, minHeight, difficultyColor, 1).setOrigin(0, 0.5);
    container.add(strip);

    const nameText = this.add.text(padding + 6, padding, mission.name, {
      color: isLocked ? COLORS.text.secondary : COLORS.text.primary,
      fontFamily: FONTS.body.family,
      fontSize,
    });
    container.add(nameText);

    const badgeBg = this.add.rectangle(width - padding - 40, padding + 8, 80, 24, difficultyColor, 0.9)
      .setOrigin(0.5);
    container.add(badgeBg);

    const badgeText = this.add.text(width - padding - 40, padding + 8, difficultyLabel, {
      color: '#0f172a',
      fontFamily: FONTS.body.family,
      fontSize: badgeFontSize,
      align: 'center',
    }).setOrigin(0.5);
    container.add(badgeText);

    const rewardY = padding + nameText.height + 8;
    const rewardText = this.add.text(padding + 6, rewardY, this.formatRewards(mission.rewards), {
      color: isLocked ? COLORS.text.muted : COLORS.text.secondary,
      fontFamily: FONTS.body.family,
      fontSize: isPortrait ? '12px' : '14px',
    });
    container.add(rewardText);

    let contentHeight = rewardY + rewardText.height + padding;
    if (contentHeight < minHeight) {
      contentHeight = minHeight;
    }
    bg.setSize(width, contentHeight);
    strip.setSize(3, contentHeight);

    if (isLocked) {
      const lockText = this.add.text(padding + 6, contentHeight - padding - 14, this.getLockText(mission.unlockCondition), {
        color: COLORS.text.muted,
        fontFamily: FONTS.body.family,
        fontSize: isPortrait ? '11px' : '13px',
      });
      container.add(lockText);

      // Lock overlay: semi-transparent dark rectangle over locked cards
      const lockOverlay = this.add.rectangle(width / 2, contentHeight / 2, width, contentHeight, COLORS.bg.overlay, 0.55)
        .setOrigin(0.5);
      container.add(lockOverlay);
    }

    container.setSize(width, contentHeight);
    container.setInteractive(
      new Geom.Rectangle(0, 0, width, contentHeight),
      Geom.Rectangle.Contains
    );
    if (container.input) {
      container.input.cursor = isLocked ? 'default' : 'pointer';
    }

    // Card hover: change border color to accent blue on pointerover, restore on pointerout
    if (!isLocked) {
      container.on('pointerover', () => {
        bg.setStrokeStyle(2, COLORS.accent.blue, 0.9);
      });
      container.on('pointerout', () => {
        bg.setStrokeStyle(2, COLORS.border.dark, 0.9);
      });
      container.on('pointerdown', () => {
        AudioManager.getInstance().playSfx('sfx-click');
        this.registry.set('selectedMission', mission);
        this.registry.set('selectedMap', mission.mapId);
        this.scene.start('SetupScene');
      });
    }
  }

  private isMissionUnlocked(mission: Mission): boolean {
    if (!mission.unlockCondition) {
      return true;
    }
    return this.checkUnlockCondition(mission.unlockCondition);
  }

  private checkUnlockCondition(condition: UnlockCondition): boolean {
    const progress = this.progressManager.load();
    if (!progress) {
      return false;
    }
    if (condition.type === 'mission_complete') {
      return progress.missionId === condition.targetId && progress.currentTurn >= condition.targetValue;
    }
    if (condition.type === 'level_reach') {
      return (progress.collectedRewards?.length ?? 0) >= condition.targetValue;
    }
    return false;
  }

  private getLockText(condition: UnlockCondition | undefined): string {
    if (!condition) return '已锁定';
    if (condition.type === 'mission_complete') {
      return `解锁条件：完成任务 "${condition.targetId}"`;
    }
    if (condition.type === 'level_reach') {
      return `解锁条件：达到等级 ${condition.targetValue}`;
    }
    return '已锁定';
  }

  private formatRewards(rewards: Reward[]): string {
    if (rewards.length === 0) return '奖励：无';
    const lines = rewards.map((r) => {
      const label = r.type === 'resource' ? '资源' : r.type === 'experience' ? '经验' : '解锁';
      return `${label} ${r.itemId} x${r.amount}`;
    });
    return `奖励：${lines.join('，')}`;
  }
}
