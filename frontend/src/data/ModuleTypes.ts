export type ModuleCategory = 'active' | 'passive' | 'combo' | 'tool';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';

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
  rarity: Rarity;
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

// ---------------------------------------------------------------------------
// Refined ModuleEffect for the progression system
// ---------------------------------------------------------------------------

export type ProgressionEffectType = 'stat_bonus' | 'ability' | 'passive';

export interface ProgressionModuleEffect {
  type: ProgressionEffectType;
  target: string;
  value: number | string;
}

export type ModuleSlotType = 'weapon' | 'armor' | 'skill' | 'utility';

export interface ModuleSlot {
  id: string;
  type: ModuleSlotType;
  name: string;
  description: string;
  effects: ProgressionModuleEffect[];
}

export interface ModuleItem {
  id: string;
  name: string;
  slotType: ModuleSlotType;
  description: string;
  effects: ProgressionModuleEffect[];
}

// ---------------------------------------------------------------------------
// Initial module data (8 modules)
// ---------------------------------------------------------------------------

export const MODULE_ITEMS: ModuleItem[] = [
  // Weapons
  {
    id: 'mod_laser_rifle',
    name: 'Laser Rifle',
    slotType: 'weapon',
    description: 'Standard ranged energy weapon.',
    effects: [
      { type: 'stat_bonus', target: 'attack', value: 6 },
      { type: 'ability', target: 'ranged_attack', value: 'laser_shot' },
    ],
  },
  {
    id: 'mod_plasma_blade',
    name: 'Plasma Blade',
    slotType: 'weapon',
    description: 'Close-quarters energy blade.',
    effects: [
      { type: 'stat_bonus', target: 'attack', value: 8 },
      { type: 'ability', target: 'melee_attack', value: 'plasma_slash' },
    ],
  },
  // Armors
  {
    id: 'mod_ceramic_plate',
    name: 'Ceramic Plate',
    slotType: 'armor',
    description: 'Lightweight ceramic plating.',
    effects: [
      { type: 'stat_bonus', target: 'defense', value: 4 },
      { type: 'passive', target: 'damage_reduction', value: 2 },
    ],
  },
  {
    id: 'mod_reactive_shield',
    name: 'Reactive Shield',
    slotType: 'armor',
    description: 'Energy shield that reacts to impacts.',
    effects: [
      { type: 'stat_bonus', target: 'defense', value: 3 },
      { type: 'passive', target: 'reflect_damage', value: 1 },
    ],
  },
  // Skills
  {
    id: 'mod_overclock',
    name: 'Overclock',
    slotType: 'skill',
    description: 'Temporarily boost movement and attack speed.',
    effects: [
      { type: 'ability', target: 'active_skill', value: 'overclock_burst' },
      { type: 'passive', target: 'speed_bonus', value: 1 },
    ],
  },
  {
    id: 'mod_repair_nanites',
    name: 'Repair Nanites',
    slotType: 'skill',
    description: 'Slowly regenerate hull integrity over time.',
    effects: [
      { type: 'ability', target: 'active_skill', value: 'emergency_repair' },
      { type: 'passive', target: 'hp_regen', value: 3 },
    ],
  },
  // Utilities
  {
    id: 'mod_jump_jets',
    name: 'Jump Jets',
    slotType: 'utility',
    description: 'Enhanced jump capability.',
    effects: [
      { type: 'stat_bonus', target: 'jump', value: 2 },
      { type: 'passive', target: 'ignore_terrain', value: 'low' },
    ],
  },
  {
    id: 'mod_targeting_comp',
    name: 'Targeting Computer',
    slotType: 'utility',
    description: 'Improved accuracy and crit chance.',
    effects: [
      { type: 'stat_bonus', target: 'attack', value: 3 },
      { type: 'passive', target: 'crit_chance', value: 5 },
    ],
  },
];

export function getModuleItem(id: string): ModuleItem | undefined {
  return MODULE_ITEMS.find(m => m.id === id);
}

export function getModulesBySlotType(slotType: ModuleSlotType): ModuleItem[] {
  return MODULE_ITEMS.filter(m => m.slotType === slotType);
}

export function getAllModuleItems(): ModuleItem[] {
  return MODULE_ITEMS;
}
