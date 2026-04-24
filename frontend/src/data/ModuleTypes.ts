export type ModuleCategory = 'active' | 'passive' | 'combo' | 'tool';

export interface ModuleEffect {
  type: string;
  power?: number;
  stat?: string;
  value?: number;
  status?: string;
  duration?: number;
  distance?: number;
  perParticipant?: boolean;
}

export interface ModuleTargeting {
  range: number;
  shape: string;
  lineOfSight: boolean;
}

export interface ModuleParticipationRules {
  maxAllies: number;
  range: number;
  lineOfSight: boolean;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  category: ModuleCategory;
  description: string;
  targeting?: ModuleTargeting;
  comboCost?: number;
  participationRules?: ModuleParticipationRules;
  usesPerTurn?: number;
  effects: ModuleEffect[];
}

export interface ModuleData {
  modules: ModuleDefinition[];
}
