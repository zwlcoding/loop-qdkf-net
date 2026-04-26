import { Scene } from 'phaser';
import { calculateRunReward, type RiftRunState } from '../core/RiftRunManager';
import { loadMetaProgress, saveMetaProgress, addShards } from '../core/MetaProgression';
import { COLORS, FONTS, createPanel, createButton } from '../ui/Theme';

export default class ResultScene extends Scene {
  constructor() {
    super({ key: "Result" });
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Dark blue background
    this.cameras.main.setBackgroundColor(COLORS.bg.primary);

    const riftRunState = this.registry.get("riftRunState") as RiftRunState | undefined;

    if (riftRunState) {
      this.createRiftRunResult(width, height, riftRunState);
      return;
    }

    this.createExtractionResult(width, height);
  }

  private createRiftRunResult(width: number, height: number, state: RiftRunState): void {
    const reward = calculateRunReward(state);
    const shards = reward.shards;

    // Update meta progression
    const meta = loadMetaProgress();
    const updatedMeta = addShards(meta, shards);
    updatedMeta.totalRuns += 1;
    const currentLayer = state.riftMap.currentLayer;
    if (currentLayer > updatedMeta.bestLayer) {
      updatedMeta.bestLayer = currentLayer;
    }
    saveMetaProgress(updatedMeta);

    // Clear rift run state
    this.registry.remove("riftRunState");
    this.registry.remove("riftMap");

    // Reward panel background
    const panelW = Math.min(480, width * 0.8);
    const panelH = Math.max(360, height * 0.5);
    createPanel(this, width / 2, height * 0.45, panelW, panelH, {
      fillColor: COLORS.bg.overlay,
      fillAlpha: 0.92,
      strokeColor: COLORS.border.light,
      strokeAlpha: 0.8,
      strokeWidth: 2,
    });

    // Title
    const titleText = "裂隙运行结束";
    this.add
      .text(width / 2, height * 0.22, titleText, {
        fontSize: FONTS.title.size,
        color: COLORS.text.accent,
        fontFamily: FONTS.title.family,
      })
      .setOrigin(0.5);

    // Stats
    const stats = state.stats;
    const statLines = [
      `房间清理: ${stats.roomsCleared}`,
      `敌人击败: ${stats.enemiesDefeated}`,
      `模块收集: ${stats.modulesCollected}`,
      `层数完成: ${stats.layersCompleted}`,
    ];

    let y = height * 0.35;
    for (const line of statLines) {
      this.add
        .text(width / 2, y, line, {
          fontSize: FONTS.body.size,
          color: FONTS.body.color,
          fontFamily: FONTS.body.family,
        })
        .setOrigin(0.5);
      y += 32;
    }

    // Shards reward
    this.add
      .text(width / 2, height * 0.62, `获得碎片: ${shards}`, {
        fontSize: FONTS.title.size,
        color: COLORS.text.accent,
        fontFamily: FONTS.title.family,
      })
      .setOrigin(0.5);

    // Return button
    const btnW = 200;
    const btnH = Math.max(48, height * 0.06);
    createButton(this, width / 2, height * 0.82, "返回主菜单", btnW, btnH, () => {
      this.scene.start("MissionSelectScene");
    });
  }

  private createExtractionResult(width: number, height: number): void {
    const result = this.registry.get("extractionResult") as {
      success: boolean;
      rewards: Array<{ type: string; itemId: string; amount: number }>;
    };

    const titleText = result.success ? "任务完成" : "任务失败";
    const titleColor = result.success ? COLORS.text.accent : '#ef4444';

    // Reward panel background
    const panelW = Math.min(480, width * 0.8);
    const panelH = Math.max(320, height * 0.45);
    createPanel(this, width / 2, height * 0.42, panelW, panelH, {
      fillColor: COLORS.bg.overlay,
      fillAlpha: 0.92,
      strokeColor: COLORS.border.light,
      strokeAlpha: 0.8,
      strokeWidth: 2,
    });

    this.add
      .text(width / 2, height * 0.22, titleText, {
        fontSize: FONTS.title.size,
        color: titleColor,
        fontFamily: FONTS.title.family,
      })
      .setOrigin(0.5);

    if (result.success && result.rewards && result.rewards.length > 0) {
      const typeLabels: Record<string, string> = {
        resource: "资源",
        experience: "经验",
        unlock: "解锁",
      };

      let y = height * 0.34;
      for (const reward of result.rewards) {
        const label = typeLabels[reward.type] ?? reward.type;
        const text = `${label}: ${reward.itemId} x${reward.amount}`;
        this.add
          .text(width / 2, y, text, {
            fontSize: FONTS.body.size,
            color: FONTS.body.color,
            fontFamily: FONTS.body.family,
          })
          .setOrigin(0.5);
        y += 32;
      }
    }

    const btnW = 200;
    const btnH = Math.max(48, height * 0.06);
    const buttonY = height * 0.72;
    const buttonGap = 20;

    createButton(
      this,
      width / 2 - btnW / 2 - buttonGap / 2,
      buttonY,
      "返回主菜单",
      btnW,
      btnH,
      () => {
        this.scene.start("Boot");
      }
    );
    createButton(
      this,
      width / 2 + btnW / 2 + buttonGap / 2,
      buttonY,
      "继续下一轮",
      btnW,
      btnH,
      () => {
        this.scene.start("MissionSelect");
      }
    );
  }
}
