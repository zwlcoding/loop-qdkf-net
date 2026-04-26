import { Scene } from 'phaser';
import { calculateRunReward, type RiftRunState } from '../core/RiftRunManager';
import { loadMetaProgress, saveMetaProgress, addShards } from '../core/MetaProgression';

export default class ResultScene extends Scene {
  constructor() {
    super({ key: "Result" });
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Dark blue background
    this.cameras.main.setBackgroundColor("#0f172a");

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

    // Title
    const titleText = "裂隙运行结束";
    this.add
      .text(width / 2, height * 0.2, titleText, {
        fontSize: "48px",
        color: "#22c55e",
        fontFamily: "sans-serif",
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

    let y = height * 0.38;
    for (const line of statLines) {
      this.add
        .text(width / 2, y, line, {
          fontSize: "22px",
          color: "#e2e8f0",
          fontFamily: "sans-serif",
        })
        .setOrigin(0.5);
      y += 36;
    }

    // Shards reward
    this.add
      .text(width / 2, height * 0.65, `获得碎片: ${shards}`, {
        fontSize: "32px",
        color: "#fbbf24",
        fontFamily: "sans-serif",
      })
      .setOrigin(0.5);

    // Return button
    this.createButton(width / 2, height * 0.82, "返回主菜单", () => {
      this.scene.start("MissionSelectScene");
    });
  }

  private createExtractionResult(width: number, height: number): void {
    const result = this.registry.get("extractionResult") as {
      success: boolean;
      rewards: Array<{ type: string; itemId: string; amount: number }>;
    };

    const titleText = result.success ? "任务完成" : "任务失败";
    const titleColor = result.success ? "#22c55e" : "#ef4444";

    this.add
      .text(width / 2, height * 0.2, titleText, {
        fontSize: "48px",
        color: titleColor,
        fontFamily: "sans-serif",
      })
      .setOrigin(0.5);

    if (result.success && result.rewards && result.rewards.length > 0) {
      const typeLabels: Record<string, string> = {
        resource: "资源",
        experience: "经验",
        unlock: "解锁",
      };

      let y = height * 0.35;
      for (const reward of result.rewards) {
        const label = typeLabels[reward.type] ?? reward.type;
        const text = `${label}: ${reward.itemId} x${reward.amount}`;
        this.add
          .text(width / 2, y, text, {
            fontSize: "24px",
            color: "#e2e8f0",
            fontFamily: "sans-serif",
          })
          .setOrigin(0.5);
        y += 40;
      }
    }

    const buttonY = height * 0.75;
    const buttonGap = 20;
    const buttonWidth = 200;
    const buttonHeight = Math.max(48, height * 0.06);

    this.createButton(
      width / 2 - buttonWidth / 2 - buttonGap / 2,
      buttonY,
      "返回主菜单",
      () => {
        this.scene.start("Boot");
      },
      buttonWidth,
      buttonHeight
    );
    this.createButton(
      width / 2 + buttonWidth / 2 + buttonGap / 2,
      buttonY,
      "继续下一轮",
      () => {
        this.scene.start("MissionSelect");
      },
      buttonWidth,
      buttonHeight
    );
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    buttonWidth = 200,
    buttonHeight = Math.max(48, this.scale.height * 0.06)
  ): void {
    const container = this.add.container(x, y);

    const bg = this.add
      .rectangle(0, 0, buttonWidth, buttonHeight, 0x334155)
      .setInteractive({ useHandCursor: true });

    const txt = this.add.text(0, 0, label, {
      fontSize: "20px",
      color: "#f8fafc",
      fontFamily: "sans-serif",
    });
    txt.setOrigin(0.5);

    container.add([bg, txt]);

    bg.on("pointerover", () => {
      bg.setFillStyle(0x475569);
    });
    bg.on("pointerout", () => {
      bg.setFillStyle(0x334155);
    });
    bg.on("pointerdown", () => {
      onClick();
    });
  }
}
