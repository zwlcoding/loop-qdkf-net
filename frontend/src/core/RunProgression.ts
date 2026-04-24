export interface TemporaryRunValue {
  /** 局内临时货币/资源，仅当前对局可用 */
  scrap: number;
  /** 局内情报值，用于解锁局内选项 */
  intel: number;
}

export interface ExtractionPayout {
  /** 成功撤离时转换为永久资源的倍率 */
  conversionRate: number;
  /** 失败或未撤离时的保留比例 */
  partialRetention: number;
  /** 最低保底转换量 */
  minimumPayout: number;
}

export interface UnlockEntry {
  id: string;
  name: string;
  description: string;
  requiredRuns: number;
  requiredTotalScrap: number;
  unlocked: boolean;
}

export interface RunProgressionState {
  runValues: TemporaryRunValue;
  extractionPayout: ExtractionPayout;
  extracted: boolean;
  extractionSuccess: boolean | null;
  postRunUnlocks: UnlockEntry[];
  totalRunsCompleted: number;
  totalScrapConverted: number;
}

export class RunProgression {
  private state: RunProgressionState;

  constructor(payout: ExtractionPayout, unlocks: UnlockEntry[]) {
    this.state = {
      runValues: { scrap: 0, intel: 0 },
      extractionPayout: payout,
      extracted: false,
      extractionSuccess: null,
      postRunUnlocks: unlocks.map((u) => ({ ...u })),
      totalRunsCompleted: 0,
      totalScrapConverted: 0,
    };
  }

  /** 获取当前局内临时资源 */
  getRunValues(): TemporaryRunValue {
    return { ...this.state.runValues };
  }

  /** 获取当前状态副本 */
  getState(): RunProgressionState {
    return {
      runValues: { ...this.state.runValues },
      extractionPayout: { ...this.state.extractionPayout },
      extracted: this.state.extracted,
      extractionSuccess: this.state.extractionSuccess,
      postRunUnlocks: this.state.postRunUnlocks.map((u) => ({ ...u })),
      totalRunsCompleted: this.state.totalRunsCompleted,
      totalScrapConverted: this.state.totalScrapConverted,
    };
  }

  /** 增加局内临时资源 */
  earn(scrap = 0, intel = 0): void {
    this.state.runValues.scrap += Math.max(0, scrap);
    this.state.runValues.intel += Math.max(0, intel);
  }

  /** 消耗局内临时资源；若不足则拒绝 */
  spend(scrap = 0, intel = 0): boolean {
    const s = Math.max(0, scrap);
    const i = Math.max(0, intel);
    if (this.state.runValues.scrap < s || this.state.runValues.intel < i) {
      return false;
    }
    this.state.runValues.scrap -= s;
    this.state.runValues.intel -= i;
    return true;
  }

  /** 记录撤离结果；成功则按倍率转换，失败则按保留比例结算 */
  resolveExtraction(success: boolean): { convertedScrap: number; retainedScrap: number } {
    this.state.extracted = true;
    this.state.extractionSuccess = success;

    const rawScrap = this.state.runValues.scrap;
    let converted = 0;
    let retained = 0;

    if (success) {
      converted = Math.max(
        this.state.extractionPayout.minimumPayout,
        Math.floor(rawScrap * this.state.extractionPayout.conversionRate)
      );
      retained = 0;
    } else {
      converted = 0;
      retained = Math.floor(rawScrap * this.state.extractionPayout.partialRetention);
    }

    this.state.totalRunsCompleted += 1;
    this.state.totalScrapConverted += converted;

    // 结算后清空局内资源
    this.state.runValues.scrap = 0;
    this.state.runValues.intel = 0;

    // 检查解锁条件
    this.checkUnlocks();

    return { convertedScrap: converted, retainedScrap: retained };
  }

  private checkUnlocks(): void {
    for (const entry of this.state.postRunUnlocks) {
      if (entry.unlocked) continue;
      if (
        this.state.totalRunsCompleted >= entry.requiredRuns &&
        this.state.totalScrapConverted >= entry.requiredTotalScrap
      ) {
        entry.unlocked = true;
      }
    }
  }

  /** 查询某个解锁项是否已解锁 */
  isUnlocked(unlockId: string): boolean {
    return this.state.postRunUnlocks.find((u) => u.id === unlockId)?.unlocked ?? false;
  }

  /** 获取已解锁列表 */
  getUnlockedEntries(): UnlockEntry[] {
    return this.state.postRunUnlocks.filter((u) => u.unlocked);
  }

  /** 获取局内资源状态的中文描述（调试用） */
  getRunValueStatusText(): string {
    const v = this.state.runValues;
    return `局内资源：废料 ${v.scrap} / 情报 ${v.intel}`;
  }

  /** 获取撤离结算状态的中文描述（调试用） */
  getExtractionResultText(): string {
    if (!this.state.extracted) {
      return '撤离状态：尚未结算';
    }
    const success = this.state.extractionSuccess;
    if (success === true) {
      return `撤离状态：成功 | 累计完成 ${this.state.totalRunsCompleted} 次 | 累计转化 ${this.state.totalScrapConverted} 废料`;
    }
    return `撤离状态：失败 | 累计完成 ${this.state.totalRunsCompleted} 次 | 累计转化 ${this.state.totalScrapConverted} 废料`;
  }

  /** 获取解锁进度的中文描述（调试用） */
  getUnlockStatusText(): string {
    const lines = this.state.postRunUnlocks.map((u) => {
      const progress = u.unlocked
        ? '已解锁'
        : `需完成 ${u.requiredRuns} 次 / 累计转化 ${u.requiredTotalScrap} 废料`;
      return `- ${u.name}：${progress}`;
    });
    return `解锁进度：\n${lines.join('\n')}`;
  }
}
