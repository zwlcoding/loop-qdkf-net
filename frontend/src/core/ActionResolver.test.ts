import { describe, expect, it } from 'vitest';
import { ActionResolver } from './ActionResolver';
import type { ModuleDefinition } from '../data/ModuleTypes';

const makeUnitState = (overrides: Partial<Parameters<typeof ActionResolver.getPrimaryActionOptions>[0]> = {}) => ({
  id: 'unit-a',
  squad: 0,
  tileX: 1,
  tileY: 1,
  attack: 10,
  canAct: true,
  canUseTool: true,
  activeModules: [],
  comboModules: [],
  toolModules: [],
  ...overrides,
});

const makeTargetState = (overrides: Partial<Parameters<typeof ActionResolver.getPrimaryActionOptions>[1][number]> = {}) => ({
  id: 'unit-b',
  squad: 1,
  tileX: 2,
  tileY: 1,
  hp: 20,
  maxHp: 20,
  ...overrides,
});

const slashModule: ModuleDefinition = {
  id: 'slash',
  name: 'Slash',
  category: 'active',
  description: 'Basic melee attack',
  targeting: {
    range: 1,
    shape: 'single',
    lineOfSight: false,
  },
  effects: [{ type: 'damage', power: 1 }],
};

const potionModule: ModuleDefinition = {
  id: 'potion',
  name: 'Potion',
  category: 'tool',
  description: 'Healing item',
  usesPerTurn: 1,
  effects: [{ type: 'heal', power: 30 }],
};

describe('ActionResolver', () => {
  it('offers a basic attack against hostile units in range', () => {
    const actions = ActionResolver.getPrimaryActionOptions(makeUnitState(), [makeTargetState()]);

    expect(actions.map((action) => action.type)).toContain('basic-attack');
  });

  it('blocks skill targeting when line of sight is required and unavailable', () => {
    const fireball: ModuleDefinition = {
      id: 'fireball',
      name: 'Fireball',
      category: 'active',
      description: 'Ranged damage',
      targeting: {
        range: 4,
        shape: 'single',
        lineOfSight: true,
      },
      effects: [{ type: 'damage', power: 1.5 }],
    };

    const actions = ActionResolver.getPrimaryActionOptions(
      makeUnitState({ activeModules: [fireball] }),
      [makeTargetState({ tileX: 4, tileY: 1 })],
      {
        hasLineOfSight: () => false,
      }
    );

    expect(actions.some((action) => action.type === 'module' && action.moduleId === 'fireball')).toBe(false);
  });

  it('offers shield skills only to allied targets', () => {
    const barrierField: ModuleDefinition = {
      id: 'barrier_field',
      name: 'Barrier Field',
      category: 'active',
      description: 'Applies shield to an ally',
      targeting: {
        range: 3,
        shape: 'single',
        lineOfSight: false,
      },
      effects: [{ type: 'status', status: 'shield', duration: 2, value: 2 }],
    };

    const actions = ActionResolver.getPrimaryActionOptions(
      makeUnitState({ activeModules: [barrierField] }),
      [makeTargetState({ id: 'ally', squad: 0 }), makeTargetState({ id: 'enemy', squad: 1 })]
    );

    expect(actions.some((action) => action.moduleId === 'barrier_field' && action.targetId === 'ally')).toBe(true);
    expect(actions.some((action) => action.moduleId === 'barrier_field' && action.targetId === 'enemy')).toBe(false);
  });

  it('allows only one tool use opportunity per turn', () => {
    const result = ActionResolver.resolveToolUse(
      makeUnitState({ toolModules: [potionModule] }),
      makeUnitState({ id: 'unit-a', squad: 0, hp: 40, maxHp: 80 }),
      potionModule
    );

    expect(result.success).toBe(true);
    expect(result.consumesToolOpportunity).toBe(true);
  });

  it('exposes knockback distance for modules that push targets', () => {
    const shieldBash: ModuleDefinition = {
      id: 'shield_bash',
      name: 'Shield Bash',
      category: 'active',
      description: 'Attack with knockback',
      targeting: {
        range: 1,
        shape: 'single',
        lineOfSight: false,
      },
      effects: [
        { type: 'damage', power: 0.8 },
        { type: 'knockback', distance: 2 },
      ],
    };

    const result = ActionResolver.resolvePrimaryAction(
      makeUnitState({ activeModules: [shieldBash] }),
      makeTargetState(),
      {
        type: 'module',
        label: 'Shield Bash',
        targetId: 'unit-b',
        moduleId: 'shield_bash',
      }
    );

    expect(result.success).toBe(true);
    expect(result.knockbackDistance).toBe(2);
  });

  it('marks the actor as unable to primary-act again after resolving a primary action', () => {
    const result = ActionResolver.resolvePrimaryAction(
      makeUnitState(),
      makeTargetState(),
      {
        type: 'basic-attack',
        label: 'Basic Attack',
        targetId: 'unit-b',
      }
    );

    expect(result.success).toBe(true);
    expect(result.consumesPrimaryAction).toBe(true);
  });

  it('provides a fallback active module loadout for MVP prototype units', () => {
    const loadout = ActionResolver.getFallbackLoadout('caster', [slashModule]);

    expect(loadout.active.length).toBeGreaterThan(0);
    expect(loadout.active.some((module) => module.id === 'slash')).toBe(true);
  });

  it('returns structured status applications from module effects', () => {
    const toxinRound: ModuleDefinition = {
      id: 'toxin_round',
      name: 'Toxin Round',
      category: 'active',
      description: 'Applies poison and vulnerable',
      targeting: {
        range: 3,
        shape: 'single',
        lineOfSight: true,
      },
      effects: [
        { type: 'damage', power: 0.5 },
        { type: 'status', status: 'poison', duration: 2, value: 2 },
        { type: 'status', status: 'vulnerable', duration: 1, value: 1 },
      ],
    };

    const result = ActionResolver.resolvePrimaryAction(
      makeUnitState({ activeModules: [toxinRound] }),
      makeTargetState(),
      {
        type: 'module',
        label: 'Toxin Round',
        targetId: 'unit-b',
        moduleId: 'toxin_round',
      }
    );

    expect(result.success).toBe(true);
    expect(result.appliedStatuses).toEqual([
      { type: 'poison', duration: 2, magnitude: 2 },
      { type: 'vulnerable', duration: 1, magnitude: 1 },
    ]);
  });
});
