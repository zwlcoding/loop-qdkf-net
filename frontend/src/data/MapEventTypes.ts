export interface MapEventSpawnRules {
  minDistanceFromSpawn: number;
  maxDistanceFromSpawn?: number;
  terrainPreference?: string[];
  avoidMissionObjectives?: boolean;
  avoidClearPaths?: boolean;
  avoidClusters?: boolean;
  maxPerRun?: number;
}

export interface MapEventReward {
  type: string;
  itemId?: string;
  quantity?: number;
  stat?: string;
  value?: number;
  duration?: number;
  amount?: number;
  reveals?: string[];
}

export interface MapEventEffect {
  type: string;
  power?: number;
  status?: string;
  duration?: number;
}

export interface MapEventObjective {
  type: string;
  turnsRequired?: number;
  interruptedByCombat?: boolean;
}

export interface MapEventVendorItem {
  itemId: string;
  cost: number;
  stock: number;
}

export interface MapEventDefinition {
  id: string;
  name: string;
  type: 'reward' | 'hazard' | 'side_task' | 'vendor';
  description: string;
  spawnRules: MapEventSpawnRules;
  rewards?: MapEventReward[];
  effects?: MapEventEffect[];
  objective?: MapEventObjective;
  inventory?: MapEventVendorItem[];
}

export interface MapEventData {
  events: MapEventDefinition[];
}
