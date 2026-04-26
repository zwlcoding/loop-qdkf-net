import { Scene } from 'phaser';

export default class ResultScene extends Scene {
  constructor() {
    super({ key: "Result" });
  }

  create() {
    const result = this.registry.get("extractionResult") as {
      success: boolean;
      rewards: Array<{ type: string; itemId: string; amount: number }>;
    };

    const width = this.scale.width;
    const height = this.scale.height;

    // Dark blue background
    this.cameras.main.setBackgroundColor("#0f172a");

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

    const createButton = (
      x: number,
      label: string,
      targetScene: string
    ) => {
      const container = this.add.container(x, buttonY);

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
        this.scene.start(targetScene);
      });
    };

    createButton(
      width / 2 - buttonWidth / 2 - buttonGap / 2,
      "返回主菜单",
      "Boot"
    );
    createButton(
      width / 2 + buttonWidth / 2 + buttonGap / 2,
      "继续下一轮",
      "MissionSelect"
    );
  }
}
