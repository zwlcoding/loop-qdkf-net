import type { MissionTemplate, BossKillState, RelicContestState, CoopThenReversalState, ExtractionState, EndgamePressureState } from '../data/MissionTypes';

export interface MissionState {
  template: MissionTemplate;
  elapsedMs: number;
  isRevealed: boolean;
  isReconnaissancePhase: boolean;
  remainingRevealMs: number;
  bossKill?: BossKillState;
  relicContest?: RelicContestState;
  coopThenReversal?: CoopThenReversalState;
  extraction: ExtractionState;
  pressure: EndgamePressureState;
}

export class MissionManager {
  private state: MissionState | null = null;
  private revealDelayMs: number = 30000;
  private onRevealCallback: (() => void) | null = null;
  private onPhaseChangeCallback: ((phase: string) => void) | null = null;
  private onPressureWarningCallback: (() => void) | null = null;
  private onCollapseCallback: (() => void) | null = null;

  startMission(template: MissionTemplate): void {
    const capacity = this.resolveCapacity(template);
    this.state = {
      template,
      elapsedMs: 0,
      isRevealed: false,
      isReconnaissancePhase: true,
      remainingRevealMs: template.revealDelay * 1000,
      extraction: {
        isUnlocked: false,
        unlockedAtMs: null,
        extractedUnitIds: [],
        priorityUnitId: null,
        prioritySquad: null,
        capacity,
      },
      pressure: {
        stage: 0,
        nextEscalationAtMs: template.endgamePressure.startTime * 1000,
        warningFired: false,
        collapsed: false,
      },
    };
    this.revealDelayMs = template.revealDelay * 1000;

    // Initialize template-specific state
    if (template.id === 'coop_boss_kill') {
      this.state.bossKill = {
        bossUnitId: 'boss-1',
        bossMaxHp: 500,
        bossCurrentHp: 500,
        isDefeated: false,
      };
    } else if (template.id === 'relic_contest') {
      this.state.relicContest = {
        relicUnitId: null,
        relicSquad: null,
        isCaptured: false,
      };
    } else if (template.id === 'coop_then_reversal') {
      const coopPhase = template.phases?.find(p => p.name === 'cooperation');
      const durationSec = coopPhase?.objectives?.[0]?.duration ?? 120;
      this.state.coopThenReversal = {
        currentPhase: 'cooperation',
        cooperationElapsedMs: 0,
        cooperationDurationMs: durationSec * 1000,
        isReversed: false,
        extractPointHeld: false,
      };
    }
  }

  private resolveCapacity(template: MissionTemplate): number {
    if (template.extractionRules.type === 'capacity_limited') {
      const reversalPhase = template.phases?.find(p => p.name === 'reversal');
      return reversalPhase?.objectives?.[0]?.capacity ?? 3;
    }
    return 6; // default high capacity for shared/priority
  }

  update(deltaMs: number): void {
    if (!this.state) return;

    this.state.elapsedMs += deltaMs;
    this.state.remainingRevealMs = Math.max(0, this.revealDelayMs - this.state.elapsedMs);

    if (!this.state.isRevealed && this.state.elapsedMs >= this.revealDelayMs) {
      this.revealMission();
    }

    // Update template-specific timers
    if (this.state.coopThenReversal && !this.state.coopThenReversal.isReversed) {
      this.state.coopThenReversal.cooperationElapsedMs += deltaMs;
      if (this.state.coopThenReversal.cooperationElapsedMs >= this.state.coopThenReversal.cooperationDurationMs) {
        this.triggerReversal();
      }
    }

    // Update endgame pressure
    this.updatePressure(deltaMs);
  }

  private updatePressure(_deltaMs: number): void {
    if (!this.state) return;
    const pressure = this.state.pressure;
    if (pressure.collapsed) return;

    const startMs = this.state.template.endgamePressure.startTime * 1000;
    const intervalMs = this.state.template.endgamePressure.escalationInterval * 1000;

    if (this.state.elapsedMs >= startMs && pressure.stage === 0) {
      pressure.stage = 1;
      pressure.warningFired = true;
      pressure.nextEscalationAtMs = startMs + intervalMs;
      if (this.onPressureWarningCallback) {
        this.onPressureWarningCallback();
      }
    }

    while (pressure.stage >= 1 && pressure.stage < 5 && this.state.elapsedMs >= pressure.nextEscalationAtMs) {
      pressure.stage += 1;
      pressure.nextEscalationAtMs += intervalMs;
    }

    // Collapse after enough escalations (prototype: 5 stages total)
    if (pressure.stage >= 5 && !pressure.collapsed) {
      pressure.collapsed = true;
      if (this.onCollapseCallback) {
        this.onCollapseCallback();
      }
    }
  }

  private revealMission(): void {
    if (!this.state) return;

    this.state.isRevealed = true;
    this.state.isReconnaissancePhase = false;
    this.state.remainingRevealMs = 0;

    if (this.onRevealCallback) {
      this.onRevealCallback();
    }
  }

  private triggerReversal(): void {
    if (!this.state?.coopThenReversal) return;

    this.state.coopThenReversal.isReversed = true;
    this.state.coopThenReversal.currentPhase = 'reversal';
    this.tryUnlockExtraction();

    if (this.onPhaseChangeCallback) {
      this.onPhaseChangeCallback('reversal');
    }
  }

  onReveal(callback: () => void): void {
    this.onRevealCallback = callback;
  }

  onPhaseChange(callback: (phase: string) => void): void {
    this.onPhaseChangeCallback = callback;
  }

  onPressureWarning(callback: () => void): void {
    this.onPressureWarningCallback = callback;
  }

  onCollapse(callback: () => void): void {
    this.onCollapseCallback = callback;
  }

  // Boss Kill methods
  getBossKillState(): BossKillState | null {
    return this.state?.bossKill ?? null;
  }

  applyBossDamage(damage: number): void {
    if (!this.state?.bossKill) return;
    this.state.bossKill.bossCurrentHp = Math.max(0, this.state.bossKill.bossCurrentHp - damage);
    if (this.state.bossKill.bossCurrentHp <= 0) {
      this.state.bossKill.isDefeated = true;
      this.tryUnlockExtraction();
    }
  }

  // Relic Contest methods
  getRelicContestState(): RelicContestState | null {
    return this.state?.relicContest ?? null;
  }

  setRelicHolder(unitId: string, squad: number): void {
    if (!this.state?.relicContest) return;
    this.state.relicContest.relicUnitId = unitId;
    this.state.relicContest.relicSquad = squad;
    this.state.relicContest.isCaptured = true;
    this.state.extraction.priorityUnitId = unitId;
    this.state.extraction.prioritySquad = squad;
    this.tryUnlockExtraction();
  }

  clearRelicHolder(): void {
    if (!this.state?.relicContest) return;
    this.state.relicContest.relicUnitId = null;
    this.state.relicContest.relicSquad = null;
    // isCaptured stays true once captured (dropped but still in play)
  }

  // Coop Then Reversal methods
  getCoopThenReversalState(): CoopThenReversalState | null {
    return this.state?.coopThenReversal ?? null;
  }

  isInReversalPhase(): boolean {
    return this.state?.coopThenReversal?.isReversed ?? false;
  }

  setExtractPointHeld(held: boolean): void {
    if (!this.state?.coopThenReversal) return;
    this.state.coopThenReversal.extractPointHeld = held;
  }

  // Extraction methods
  private tryUnlockExtraction(): void {
    if (!this.state) return;
    const rules = this.state.template.extractionRules;
    let shouldUnlock = false;

    if (this.state.template.id === 'coop_boss_kill' && rules.trigger === 'objective_complete') {
      shouldUnlock = this.state.bossKill?.isDefeated ?? false;
    } else if (this.state.template.id === 'relic_contest' && rules.trigger === 'relic_carrier') {
      shouldUnlock = this.state.relicContest?.isCaptured ?? false;
    } else if (this.state.template.id === 'coop_then_reversal' && rules.trigger === 'phase_complete') {
      shouldUnlock = this.state.coopThenReversal?.isReversed ?? false;
    }

    if (shouldUnlock && !this.state.extraction.isUnlocked) {
      this.state.extraction.isUnlocked = true;
      this.state.extraction.unlockedAtMs = this.state.elapsedMs;
    }
  }

  unlockExtraction(): void {
    if (!this.state) return;
    if (!this.state.extraction.isUnlocked) {
      this.state.extraction.isUnlocked = true;
      this.state.extraction.unlockedAtMs = this.state.elapsedMs;
    }
  }

  isExtractionUnlocked(): boolean {
    return this.state?.extraction.isUnlocked ?? false;
  }

  canUnitExtract(unitId: string, _squad: number): boolean {
    if (!this.state) return false;
    const ex = this.state.extraction;
    if (!ex.isUnlocked) return false;
    if (ex.extractedUnitIds.includes(unitId)) return false;

    if (this.state.template.extractionRules.type === 'priority') {
      return ex.priorityUnitId === unitId;
    }

    if (this.state.template.extractionRules.type === 'capacity_limited') {
      return ex.extractedUnitIds.length < ex.capacity;
    }

    // shared
    return true;
  }

  extractUnit(unitId: string): boolean {
    if (!this.state) return false;
    const ex = this.state.extraction;
    if (!ex.isUnlocked) return false;
    if (ex.extractedUnitIds.includes(unitId)) return false;

    if (this.state.template.extractionRules.type === 'priority' && ex.priorityUnitId !== unitId) {
      return false;
    }

    if (this.state.template.extractionRules.type === 'capacity_limited' && ex.extractedUnitIds.length >= ex.capacity) {
      return false;
    }

    ex.extractedUnitIds.push(unitId);
    return true;
  }

  getExtractedUnitIds(): string[] {
    return this.state?.extraction.extractedUnitIds.slice() ?? [];
  }

  getExtractionCapacityRemaining(): number {
    if (!this.state) return 0;
    const ex = this.state.extraction;
    if (this.state.template.extractionRules.type === 'capacity_limited') {
      return Math.max(0, ex.capacity - ex.extractedUnitIds.length);
    }
    return Infinity;
  }

  getExtractionTimeRemainingMs(): number {
    if (!this.state) return 0;
    const ex = this.state.extraction;
    if (!ex.isUnlocked || ex.unlockedAtMs === null) return 0;
    const timeoutMs = this.state.template.extractionRules.timeout * 1000;
    return Math.max(0, timeoutMs - (this.state.elapsedMs - ex.unlockedAtMs));
  }

  getExtractionStatusText(): string {
    if (!this.state) return '撤离点状态未知';
    const ex = this.state.extraction;
    if (!ex.isUnlocked) return '撤离点：锁定';

    const remainingSec = Math.ceil(this.getExtractionTimeRemainingMs() / 1000);
    const base = `撤离点：解锁（剩余 ${remainingSec} 秒）`;

    if (this.state.template.extractionRules.type === 'priority' && ex.priorityUnitId) {
      return `${base} | 优先：${ex.priorityUnitId}（队伍${ex.prioritySquad === 0 ? 'A' : 'B'}）`;
    }

    if (this.state.template.extractionRules.type === 'capacity_limited') {
      const cap = this.getExtractionCapacityRemaining();
      return `${base} | 剩余名额：${cap === Infinity ? '无限制' : cap}`;
    }

    return `${base} | 全员可撤离`;
  }

  // Endgame pressure methods
  getPressureStage(): number {
    return this.state?.pressure.stage ?? 0;
  }

  isCollapsed(): boolean {
    return this.state?.pressure.collapsed ?? false;
  }

  getEndgamePressureText(): string {
    if (!this.state) return '区域稳定';
    const pressure = this.state.pressure;
    const mechanic = this.state.template.endgamePressure.collapseMechanic;

    if (pressure.collapsed) {
      return `[区域崩溃] ${this.getMechanicLabel(mechanic)} — 任务即将强制结束`;
    }

    if (pressure.stage === 0) {
      const startSec = this.state.template.endgamePressure.startTime;
      const remaining = Math.max(0, startSec - Math.floor(this.state.elapsedMs / 1000));
      return `区域稳定（距离压迫开始：${remaining} 秒）`;
    }

    if (pressure.stage === 1) {
      return `[警告] ${this.getMechanicLabel(mechanic)} 开始扩散`;
    }

    return `[压迫阶段 ${pressure.stage}] ${this.getMechanicLabel(mechanic)} 加剧中`;
  }

  private getMechanicLabel(mechanic: string): string {
    const labels: Record<string, string> = {
      corruption_spread: '腐化蔓延',
      zone_collapse: '区域崩塌',
      boss_escalation: '首领狂暴',
    };
    return labels[mechanic] ?? mechanic;
  }

  // Objective text in Chinese
  getCurrentObjectiveText(): string {
    if (!this.state) return '任务加载中...';

    if (this.state.isReconnaissancePhase) {
      return `[侦察阶段] ${this.state.remainingRevealMs > 0 ? '等待任务揭晓...' : '即将揭晓'}`;
    }

    switch (this.state.template.id) {
      case 'coop_boss_kill': {
        const boss = this.state.bossKill;
        if (!boss) return '击杀首领';
        if (boss.isDefeated) {
          if (this.state.extraction.isUnlocked) {
            return `[完成] 首领已被击败 — ${this.getExtractionStatusText()}`;
          }
          return '[完成] 首领已被击败';
        }
        return `合作击杀首领（${boss.bossCurrentHp}/${boss.bossMaxHp}）`;
      }
      case 'relic_contest': {
        const relic = this.state.relicContest;
        if (!relic) return '争夺遗物';
        if (!relic.isCaptured) return '夺取并持有遗物';
        if (relic.relicUnitId) {
          let text = `遗物持有者：${relic.relicUnitId}（队伍${relic.relicSquad === 0 ? 'A' : 'B'}）`;
          if (this.state.extraction.isUnlocked) {
            text += ` — ${this.getExtractionStatusText()}`;
          }
          return text;
        }
        return '遗物已掉落——重新争夺';
      }
      case 'coop_then_reversal': {
        const reversal = this.state.coopThenReversal;
        if (!reversal) return '合作后反转';
        if (!reversal.isReversed) {
          const remaining = Math.max(0, Math.ceil((reversal.cooperationDurationMs - reversal.cooperationElapsedMs) / 1000));
          return `合作阶段：坚守撤离点（剩余 ${remaining} 秒）`;
        }
        return `[反转] ${this.getExtractionStatusText()}`;
      }
      default:
        return this.state.template.description;
    }
  }

  getState(): MissionState | null {
    return this.state;
  }

  getTemplate(): MissionTemplate | null {
    return this.state?.template ?? null;
  }

  getElapsedSeconds(): number {
    return this.state ? Math.floor(this.state.elapsedMs / 1000) : 0;
  }

  getRemainingRevealSeconds(): number {
    return this.state ? Math.ceil(this.state.remainingRevealMs / 1000) : 0;
  }

  isInReconnaissancePhase(): boolean {
    return this.state?.isReconnaissancePhase ?? false;
  }

  isMissionRevealed(): boolean {
    return this.state?.isRevealed ?? false;
  }

  getMissionId(): string {
    return this.state?.template.id ?? 'unknown';
  }

  getMissionName(): string {
    return this.state?.template.name ?? '未知任务';
  }

  getMissionType(): string {
    const typeMap: Record<string, string> = {
      cooperative: '合作',
      competitive: '对抗',
      reversal: '反转',
    };
    return typeMap[this.state?.template.type ?? ''] ?? this.state?.template.type ?? '未知';
  }

  getMissionDescription(): string {
    return this.state?.template.description ?? '';
  }
}
