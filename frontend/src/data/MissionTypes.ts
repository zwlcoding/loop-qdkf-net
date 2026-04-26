export interface Mission {
  id: string;
  name: string;
  description: string;
  difficulty: "easy" | "normal" | "hard";
  rewards: Reward[];
  unlockCondition?: UnlockCondition;
  extractionTurn: number; // earliest turn to extract
  mapId: string;
}

export interface Reward {
  type: "resource" | "experience" | "unlock";
  itemId: string;
  amount: number;
}

export interface UnlockCondition {
  type: "mission_complete" | "level_reach";
  targetId: string;
  targetValue: number;
}

export interface RunProgress {
  missionId: string;
  currentTurn: number;
  extractionAvailable: boolean;
  squadStates: SquadState[];
  collectedRewards: Reward[];
  chassisUnlocked: string[];
  modulesUnlocked: string[];
  version: number;
}

export interface SquadState {
  unitId: string;
  chassisId: string;
  currentHp: number;
  maxHp: number;
  modules: string[];
}

// Legacy types retained for backward compatibility with existing code
export interface MissionObjective {
  type: string;
  target: string;
  count?: number;
  duration?: number;
  capacity?: number;
}

export interface MissionPhase {
  name: string;
  objectives: MissionObjective[];
}

export interface ExtractionRules {
  type: string;
  trigger: string;
  timeout: number;
  partialRetention: number;
}

export interface EndgamePressure {
  startTime: number;
  escalationInterval: number;
  collapseMechanic: string;
}

export interface MissionTemplate {
  id: string;
  name: string;
  type: 'cooperative' | 'competitive' | 'reversal';
  description: string;
  revealDelay: number;
  objectives?: MissionObjective[];
  phases?: MissionPhase[];
  extractionRules: ExtractionRules;
  endgamePressure: EndgamePressure;
}

export interface BossKillState {
  bossUnitId: string;
  bossMaxHp: number;
  bossCurrentHp: number;
  isDefeated: boolean;
}

export interface RelicContestState {
  relicUnitId: string | null;
  relicSquad: number | null;
  isCaptured: boolean;
}

export interface CoopThenReversalState {
  currentPhase: 'cooperation' | 'reversal';
  cooperationElapsedMs: number;
  cooperationDurationMs: number;
  isReversed: boolean;
  extractPointHeld: boolean;
}

export interface ExtractionState {
  isUnlocked: boolean;
  unlockedAtMs: number | null;
  extractedUnitIds: string[];
  priorityUnitId: string | null;
  prioritySquad: number | null;
  capacity: number;
}

export interface EndgamePressureState {
  stage: number;
  nextEscalationAtMs: number;
  warningFired: boolean;
  collapsed: boolean;
}

export interface MissionTemplateData {
  templates: MissionTemplate[];
}
