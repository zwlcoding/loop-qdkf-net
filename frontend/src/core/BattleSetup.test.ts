import { describe, expect, it } from 'vitest';
import type { ChassisDefinition } from '../data/ChassisTypes';
import type { ModuleDefinition } from '../data/ModuleTypes';
import type { MissionTemplate } from '../data/MissionTypes';
import {
  BATTLE_SETUP_REGISTRY_KEY,
  createSeededBattleSetup,
  validateBattleSetup,
  type BattleSetup,
} from './BattleSetup';

const chassis: ChassisDefinition[] = [
  {
    id: 'vanguard',
    name: '先锋',
    role: 'Tank',
    baseStats: { hp: 120, move: 3, jump: 1, speed: 8, attack: 15, defense: 12 },
    slotBias: { active: 2, passive: 1, combo: 1, tool: 1 },
  },
  {
    id: 'support',
    name: '支援',
    role: 'Support',
    baseStats: { hp: 80, move: 3, jump: 1, speed: 9, attack: 8, defense: 7 },
    slotBias: { active: 2, passive: 1, combo: 1, tool: 1 },
  },
  {
    id: 'caster',
    name: '法师',
    role: 'Caster',
    baseStats: { hp: 70, move: 3, jump: 1, speed: 7, attack: 18, defense: 5 },
    slotBias: { active: 2, passive: 1, combo: 1, tool: 1 },
  },
  {
    id: 'skirmisher',
    name: '游击',
    role: 'Scout',
    baseStats: { hp: 90, move: 4, jump: 2, speed: 10, attack: 12, defense: 8 },
    slotBias: { active: 2, passive: 1, combo: 1, tool: 1 },
  },
  {
    id: 'controller',
    name: '控场',
    role: 'Control',
    baseStats: { hp: 85, move: 3, jump: 1, speed: 8, attack: 10, defense: 9 },
    slotBias: { active: 2, passive: 1, combo: 1, tool: 1 },
  },
];

const modules: ModuleDefinition[] = [
  { id: 'slash', name: 'Slash', category: 'active', description: 'hit', effects: [{ type: 'damage', power: 1 }] },
  { id: 'shield_bash', name: 'Shield Bash', category: 'active', description: 'hit', effects: [{ type: 'damage', power: 1 }] },
  { id: 'fireball', name: 'Fireball', category: 'active', description: 'hit', effects: [{ type: 'damage', power: 1 }] },
  { id: 'barrier_field', name: 'Barrier Field', category: 'active', description: 'shield', effects: [{ type: 'status', status: 'shield', duration: 1, value: 1 }] },
  { id: 'charge', name: 'Charge', category: 'active', description: 'hit', effects: [{ type: 'damage', power: 1 }] },
  { id: 'root_shot', name: 'Root Shot', category: 'active', description: 'root', effects: [{ type: 'status', status: 'root', duration: 1, value: 1 }] },
  { id: 'toxin_round', name: 'Toxin Round', category: 'active', description: 'toxin', effects: [{ type: 'damage', power: 1 }] },
  { id: 'heal', name: 'Heal', category: 'active', description: 'heal', effects: [{ type: 'heal', power: 20 }] },
  { id: 'iron_skin', name: 'Iron Skin', category: 'passive', description: 'def', effects: [{ type: 'stat_mod', stat: 'defense', value: 3 }] },
  { id: 'speed_boost', name: 'Speed Boost', category: 'passive', description: 'spd', effects: [{ type: 'stat_mod', stat: 'speed', value: 2 }] },
  { id: 'vigor', name: 'Vigor', category: 'passive', description: 'hp', effects: [{ type: 'stat_mod', stat: 'maxHp', value: 10 }] },
  { id: 'adrenaline', name: 'Adrenaline', category: 'passive', description: 'atk', effects: [{ type: 'stat_mod', stat: 'attack', value: 2 }] },
  { id: 'team_strike', name: 'Team Strike', category: 'combo', description: 'combo', comboCost: 2, effects: [{ type: 'damage', power: 1.2 }] },
  { id: 'unison_blast', name: 'Unison Blast', category: 'combo', description: 'combo', comboCost: 3, effects: [{ type: 'damage', power: 1.8 }] },
  { id: 'rescue_link', name: 'Rescue Link', category: 'combo', description: 'combo', comboCost: 2, effects: [{ type: 'heal', power: 15 }] },
  { id: 'potion', name: 'Potion', category: 'tool', description: 'tool', usesPerTurn: 1, effects: [{ type: 'heal', power: 30 }] },
  { id: 'stim_pack', name: 'Stim Pack', category: 'tool', description: 'tool', usesPerTurn: 1, effects: [{ type: 'heal', power: 15 }] },
  { id: 'smoke_bomb', name: 'Smoke Bomb', category: 'tool', description: 'tool', usesPerTurn: 1, effects: [{ type: 'status', status: 'slow', duration: 1, value: 1 }] },
  { id: 'flash_bang', name: 'Flash Bang', category: 'tool', description: 'tool', usesPerTurn: 1, effects: [{ type: 'status', status: 'stun', duration: 1, value: 1 }] },
];

const missions: MissionTemplate[] = [
  {
    id: 'coop_boss_kill',
    name: 'Boss',
    type: 'cooperative',
    description: 'boss',
    revealDelay: 30,
    objectives: [{ type: 'defeat', target: 'boss', count: 1 }],
    extractionRules: { type: 'shared', trigger: 'objective_complete', timeout: 120, partialRetention: 0.5 },
    endgamePressure: { startTime: 600, escalationInterval: 60, collapseMechanic: 'corruption_spread' },
  },
];

const makeSetup = (): BattleSetup => ({
  version: 1,
  source: 'local-setup',
  squads: [
    {
      id: 0,
      name: 'Alpha',
      control: 'human',
      units: [
        { id: 'a-1', label: 'A1', chassisId: 'vanguard', tile: { x: 2, y: 5 }, moduleIds: ['slash', 'iron_skin', 'team_strike', 'potion'] },
        { id: 'a-2', label: 'A2', chassisId: 'support', tile: { x: 3, y: 4 }, moduleIds: ['heal', 'potion'] },
      ],
    },
    {
      id: 1,
      name: 'Bravo',
      control: 'ai',
      units: [
        { id: 'b-1', label: 'B1', chassisId: 'skirmisher', tile: { x: 13, y: 5 }, moduleIds: ['slash', 'potion'] },
        { id: 'b-2', label: 'B2', chassisId: 'controller', tile: { x: 12, y: 4 }, moduleIds: ['heal', 'potion'] },
      ],
    },
  ],
  missionTemplateId: 'coop_boss_kill',
  boss: { enabled: true },
});

describe('BattleSetup', () => {
  it('exports the registry key used across scenes', () => {
    expect(BATTLE_SETUP_REGISTRY_KEY).toBe('battleSetup');
  });

  it('accepts a valid local two-squad setup with mission context', () => {
    const result = validateBattleSetup(makeSetup(), { chassis, modules, missions });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects an invalid squad count', () => {
    const invalid = makeSetup() as unknown as { squads: BattleSetup['squads'] | BattleSetup['squads'][0][] } & BattleSetup;
    invalid.squads = [invalid.squads[0]] as unknown as BattleSetup['squads'];

    const result = validateBattleSetup(invalid as BattleSetup, { chassis, modules, missions });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field === 'squads')).toBe(true);
  });

  it('rejects duplicate unit ids and overlapping spawns', () => {
    const invalid = makeSetup();
    invalid.squads[0].units[1].id = 'a-1';
    invalid.squads[0].units[1].tile = { x: 2, y: 5 };

    const result = validateBattleSetup(invalid, { chassis, modules, missions });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.message.includes('单位 ID'))).toBe(true);
    expect(result.errors.some((error) => error.message.includes('出生点'))).toBe(true);
  });

  it('rejects invalid loadouts and unknown mission ids', () => {
    const invalid = makeSetup();
    invalid.missionTemplateId = 'missing';
    invalid.squads[0].units[0].moduleIds = ['slash', 'heal', 'shield_bash', 'unknown-module'];

    const result = validateBattleSetup(invalid, { chassis, modules, missions });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field === 'missionTemplateId')).toBe(true);
    expect(result.errors.some((error) => error.field.indexOf('moduleIds') >= 0)).toBe(true);
  });

  it('rejects malformed runtime setup payloads without throwing', () => {
    const malformed = {
      version: 1,
      source: 'local-setup',
      missionTemplateId: 'coop_boss_kill',
      squads: [
        {
          id: 0,
          name: 'Alpha',
          control: 'human',
          units: null,
        },
        {
          id: 1,
          name: 'Bravo',
          control: 'ai',
          units: [
            {
              id: 'b-1',
              label: 'B1',
              chassisId: 'skirmisher',
              tile: { x: 13, y: 5 },
              moduleIds: ['slash'],
            },
          ],
        },
      ],
    } as unknown as BattleSetup;

    const result = validateBattleSetup(malformed, { chassis, modules, missions });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field.includes('units'))).toBe(true);
  });

  it('builds the legacy seeded setup through the shared contract', () => {
    const setup = createSeededBattleSetup('coop_boss_kill');
    expect(setup.source).toBe('seeded-default');
    expect(setup.squads).toHaveLength(2);
    expect(setup.squads[0].units).toHaveLength(3);
    expect(setup.squads[1].units).toHaveLength(3);
    expect(setup.boss?.enabled).toBe(true);

    const result = validateBattleSetup(setup, { chassis, modules, missions });
    expect(result.valid).toBe(true);
  });
});
