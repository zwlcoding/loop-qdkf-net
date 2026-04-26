import type { RunProgress, Reward } from "../data/MissionTypes";

export class ProgressManager {
  private readonly STORAGE_KEY = "loop-qdkf-run-progress";
  private readonly CHASSIS_UNLOCK_KEY = "loop-qdkf-unlocked-chassis";
  private readonly MODULE_UNLOCK_KEY = "loop-qdkf-unlocked-modules";

  save(progress: RunProgress): void {
    try {
      const data = JSON.stringify(progress);
      globalThis.localStorage.setItem(this.STORAGE_KEY, data);
    } catch {
      // Ignore serialization or storage errors
    }
  }

  load(): RunProgress | null {
    try {
      const data = globalThis.localStorage.getItem(this.STORAGE_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data) as RunProgress;
      // Basic validation: ensure required fields exist
      if (
        typeof parsed.missionId !== "string" ||
        typeof parsed.currentTurn !== "number" ||
        typeof parsed.extractionAvailable !== "boolean" ||
        !Array.isArray(parsed.squadStates) ||
        !Array.isArray(parsed.collectedRewards) ||
        !Array.isArray(parsed.chassisUnlocked) ||
        !Array.isArray(parsed.modulesUnlocked) ||
        typeof parsed.version !== "number"
      ) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  clear(): void {
    globalThis.localStorage.removeItem(this.STORAGE_KEY);
  }

  hasUnfinishedRun(): boolean {
    return this.load() !== null;
  }

  getVersion(): number {
    const progress = this.load();
    return progress?.version ?? 0;
  }

  setVersion(version: number): void {
    const progress = this.load();
    if (progress) {
      progress.version = version;
      this.save(progress);
    }
  }

  // ---------------------------------------------------------------------------
  // Unlock tracking (persistent across runs)
  // ---------------------------------------------------------------------------

  private loadStringArray(key: string): string[] {
    try {
      const data = globalThis.localStorage.getItem(key);
      if (!data) return [];
      const parsed = JSON.parse(data) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      // ignore
    }
    return [];
  }

  private saveStringArray(key: string, values: string[]): void {
    try {
      globalThis.localStorage.setItem(key, JSON.stringify(values));
    } catch {
      // ignore
    }
  }

  getUnlockedChassis(): string[] {
    return this.loadStringArray(this.CHASSIS_UNLOCK_KEY);
  }

  getUnlockedModules(): string[] {
    return this.loadStringArray(this.MODULE_UNLOCK_KEY);
  }

  isChassisUnlocked(chassisId: string): boolean {
    return this.getUnlockedChassis().includes(chassisId);
  }

  isModuleUnlocked(moduleId: string): boolean {
    return this.getUnlockedModules().includes(moduleId);
  }

  unlockChassis(chassisId: string): void {
    const list = this.getUnlockedChassis();
    if (!list.includes(chassisId)) {
      list.push(chassisId);
      this.saveStringArray(this.CHASSIS_UNLOCK_KEY, list);
    }
  }

  unlockModule(moduleId: string): void {
    const list = this.getUnlockedModules();
    if (!list.includes(moduleId)) {
      list.push(moduleId);
      this.saveStringArray(this.MODULE_UNLOCK_KEY, list);
    }
  }

  applyUnlockRewards(rewards: Reward[]): void {
    for (const reward of rewards) {
      if (reward.type !== "unlock") continue;
      // Heuristic: itemIds starting with "chassis_" or matching known chassis
      // ids are treated as chassis unlocks; otherwise module unlocks.
      if (reward.itemId.startsWith("chassis_")) {
        this.unlockChassis(reward.itemId);
      } else {
        this.unlockModule(reward.itemId);
      }
    }
  }
}
