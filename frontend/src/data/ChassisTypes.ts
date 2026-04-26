export interface ChassisDefinition {
  id: string;
  name: string;
  role: string;
  baseStats: {
    hp: number;
    move: number;
    jump: number;
    speed: number;
    attack: number;
    defense: number;
  };
  slotBias: {
    active: number;
    passive: number;
    combo: number;
    tool: number;
  };
}

export interface ChassisData {
  chassis: ChassisDefinition[];
}

// ---------------------------------------------------------------------------
// Chassis / Module / Loadout data models for the progression system
// ---------------------------------------------------------------------------

export type SlotType = 'weapon' | 'armor' | 'skill' | 'utility';

export interface ModuleSlot {
  id: string;
  type: SlotType;
}

export interface UnlockCondition {
  type: 'story_progress' | 'mission_clear' | 'achievement';
  target: string;
  value?: number;
}

export interface ChassisType {
  id: string;
  name: string;
  description: string;
  baseStats: {
    hp: number;
    move: number;
    jump: number;
    attack: number;
    defense: number;
  };
  moduleSlots: ModuleSlot[];
  unlockCondition?: UnlockCondition;
}

export interface Loadout {
  unitId: string;
  chassisId: string;
  equippedModules: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Initial chassis data
// ---------------------------------------------------------------------------

export const CHASSIS_TYPES: ChassisType[] = [
  {
    id: 'light',
    name: 'Light Chassis',
    description: 'High mobility, low defense. Excels at hit-and-run tactics.',
    baseStats: { hp: 80, move: 5, jump: 3, attack: 14, defense: 4 },
    moduleSlots: [
      { id: 'light_w1', type: 'weapon' },
      { id: 'light_a1', type: 'armor' },
      { id: 'light_u1', type: 'utility' },
    ],
    unlockCondition: { type: 'story_progress', target: 'chapter_1_complete' },
  },
  {
    id: 'heavy',
    name: 'Heavy Chassis',
    description: 'Low mobility, high defense. A walking fortress.',
    baseStats: { hp: 150, move: 2, jump: 1, attack: 12, defense: 14 },
    moduleSlots: [
      { id: 'heavy_w1', type: 'weapon' },
      { id: 'heavy_a1', type: 'armor' },
      { id: 'heavy_s1', type: 'skill' },
      { id: 'heavy_u1', type: 'utility' },
    ],
    unlockCondition: { type: 'story_progress', target: 'chapter_2_complete' },
  },
  {
    id: 'balanced',
    name: 'Balanced Chassis',
    description: 'Medium stats across the board. Reliable in any situation.',
    baseStats: { hp: 110, move: 3, jump: 2, attack: 11, defense: 8 },
    moduleSlots: [
      { id: 'balanced_w1', type: 'weapon' },
      { id: 'balanced_a1', type: 'armor' },
      { id: 'balanced_u1', type: 'utility' },
    ],
  },
];

export function getChassisType(id: string): ChassisType | undefined {
  return CHASSIS_TYPES.find(c => c.id === id);
}

export function getAllChassisTypes(): ChassisType[] {
  return CHASSIS_TYPES;
}
