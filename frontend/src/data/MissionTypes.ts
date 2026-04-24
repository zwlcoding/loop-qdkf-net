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
