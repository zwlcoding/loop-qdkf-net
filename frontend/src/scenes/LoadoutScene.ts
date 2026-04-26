import { Scene } from 'phaser';
import { ProgressManager } from '../core/ProgressManager';
import { getAllChassisTypes } from '../data/ChassisTypes';
import { getAllModuleItems } from '../data/ModuleTypes';

export default class LoadoutScene extends Scene {
  private progressManager: ProgressManager;

  constructor() {
    super({ key: "Loadout" });
    this.progressManager = new ProgressManager();
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.cameras.main.setBackgroundColor("#0f172a");

    // Title
    this.add
      .text(width / 2, 40, "配置装备", {
        fontSize: "32px",
        color: "#ffffff",
        fontFamily: "sans-serif",
      })
      .setOrigin(0.5);

    const cardWidth = Math.min(width - 32, 400);
    const cardHeight = 120;
    const cardSpacing = 16;
    const startY = 100;

    const unlockedChassis = new Set(this.progressManager.getUnlockedChassis());
    const unlockedModules = new Set(this.progressManager.getUnlockedModules());

    for (let i = 0; i < 3; i++) {
      const y = startY + i * (cardHeight + cardSpacing);

      // Card background
      this.add
        .rectangle(width / 2, y + cardHeight / 2, cardWidth, cardHeight, 0x1e293b)
        .setStrokeStyle(2, 0x334155);

      // Unit label
      this.add
        .text(width / 2 - cardWidth / 2 + 16, y + 16, `单位 ${i + 1}`, {
          fontSize: "20px",
          color: "#e2e8f0",
          fontFamily: "sans-serif",
        })
        .setOrigin(0);

      // Chassis (with lock status)
      const chassisLabel = this.getChassisLabel(unlockedChassis);
      this.add
        .text(width / 2 - cardWidth / 2 + 16, y + 50, chassisLabel, {
          fontSize: "16px",
          color: "#94a3b8",
          fontFamily: "sans-serif",
        })
        .setOrigin(0);

      // Weapon (with lock status)
      const weaponLabel = this.getModuleLabel("weapon", unlockedModules);
      this.add
        .text(width / 2 - cardWidth / 2 + 16, y + 74, weaponLabel, {
          fontSize: "16px",
          color: "#94a3b8",
          fontFamily: "sans-serif",
        })
        .setOrigin(0);

      // Armor (with lock status)
      const armorLabel = this.getModuleLabel("armor", unlockedModules);
      this.add
        .text(width / 2 - cardWidth / 2 + 16, y + 98, armorLabel, {
          fontSize: "16px",
          color: "#94a3b8",
          fontFamily: "sans-serif",
        })
        .setOrigin(0);
    }

    // Confirm button
    const btnWidth = Math.min(width - 32, 400);
    const btnHeight = 56;
    const btnY = height - 80;

    const btnBg = this.add
      .rectangle(width / 2, btnY, btnWidth, btnHeight, 0x3b82f6)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(width / 2, btnY, "确认", {
        fontSize: "20px",
        color: "#ffffff",
        fontFamily: "sans-serif",
      })
      .setOrigin(0.5);

    btnBg.on("pointerdown", () => {
      this.registry.set("loadout", []);
      this.scene.start("Battle");
    });

    // Visual feedback on press
    btnBg.on("pointerover", () => btnBg.setFillStyle(0x60a5fa));
    btnBg.on("pointerout", () => btnBg.setFillStyle(0x3b82f6));
  }

  private getChassisLabel(unlockedChassis: Set<string>): string {
    const all = getAllChassisTypes();
    const first = all[0];
    if (!first) return "底盘: 无";
    const lockPrefix = unlockedChassis.has(first.id) ? "" : "🔒 ";
    return `底盘: ${lockPrefix}${first.name}`;
  }

  private getModuleLabel(slotType: string, unlockedModules: Set<string>): string {
    const all = getAllModuleItems();
    const first = all.find((m) => m.slotType === slotType);
    if (!first) return `${this.slotTypeName(slotType)}: 无`;
    const lockPrefix = unlockedModules.has(first.id) ? "" : "🔒 ";
    return `${this.slotTypeName(slotType)}: ${lockPrefix}${first.name}`;
  }

  private slotTypeName(type: string): string {
    const map: Record<string, string> = {
      weapon: "武器",
      armor: "护甲",
      skill: "技能",
      utility: "工具",
    };
    return map[type] ?? type;
  }
}
