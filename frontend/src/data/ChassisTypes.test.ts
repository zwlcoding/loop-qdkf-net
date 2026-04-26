import { describe, expect, it } from 'vitest';
import { contentLoader } from './ContentLoader';
import chassisJson from '../../assets/data/chassis.json';
import {
  CHASSIS_TYPES,
  getChassisType,
  getAllChassisTypes,
  type ChassisType,
  type ModuleSlot,
  type Loadout,
  type UnlockCondition,
} from './ChassisTypes';

describe('ChassisDefinitions', () => {
  it('loads exactly five MVP chassis from JSON', () => {
    contentLoader.loadChassis(chassisJson as { chassis: unknown[] });
    const all = contentLoader.getAllChassis();
    expect(all).toHaveLength(5);
  });

  it('exposes required readable metadata for every chassis', () => {
    contentLoader.loadChassis(chassisJson as { chassis: unknown[] });
    const all = contentLoader.getAllChassis();
    for (const c of all) {
      expect(typeof c.id).toBe('string');
      expect(typeof c.name).toBe('string');
      expect(typeof c.role).toBe('string');
      expect(typeof c.baseStats.move).toBe('number');
      expect(typeof c.baseStats.jump).toBe('number');
      expect(typeof c.slotBias.active).toBe('number');
      expect(typeof c.slotBias.passive).toBe('number');
      expect(typeof c.slotBias.combo).toBe('number');
      expect(typeof c.slotBias.tool).toBe('number');
    }
  });

  it('contains the expected five archetype IDs', () => {
    contentLoader.loadChassis(chassisJson as { chassis: unknown[] });
    const ids = contentLoader.getAllChassis().map(c => c.id);
    expect(ids).toEqual([
      'vanguard',
      'skirmisher',
      'caster',
      'support',
      'controller',
    ]);
  });

  it('has distinct tactical roles', () => {
    contentLoader.loadChassis(chassisJson as { chassis: unknown[] });
    const roles = contentLoader.getAllChassis().map(c => c.role);
    expect(new Set(roles).size).toBe(5);
  });

  it('validates baseline Move and Jump values', () => {
    contentLoader.loadChassis(chassisJson as { chassis: unknown[] });
    const vanguard = contentLoader.getChassis('vanguard');
    const skirmisher = contentLoader.getChassis('skirmisher');
    const caster = contentLoader.getChassis('caster');
    const support = contentLoader.getChassis('support');
    const controller = contentLoader.getChassis('controller');

    expect(vanguard!.baseStats.move).toBe(3);
    expect(vanguard!.baseStats.jump).toBe(1);

    expect(skirmisher!.baseStats.move).toBe(4);
    expect(skirmisher!.baseStats.jump).toBe(2);

    expect(caster!.baseStats.move).toBe(3);
    expect(caster!.baseStats.jump).toBe(1);

    expect(support!.baseStats.move).toBe(3);
    expect(support!.baseStats.jump).toBe(1);

    expect(controller!.baseStats.move).toBe(3);
    expect(controller!.baseStats.jump).toBe(1);
  });

  it('validates slot bias for all chassis', () => {
    contentLoader.loadChassis(chassisJson as { chassis: unknown[] });
    const all = contentLoader.getAllChassis();
    for (const c of all) {
      expect(c.slotBias.active).toBe(2);
      expect(c.slotBias.passive).toBe(1);
      expect(c.slotBias.combo).toBe(1);
      expect(c.slotBias.tool).toBe(1);
    }
  });
});

describe('ChassisType data models', () => {
  it('exports CHASSIS_TYPES with exactly 3 entries', () => {
    expect(CHASSIS_TYPES).toHaveLength(3);
  });

  it('has light, heavy, and balanced chassis IDs', () => {
    const ids = CHASSIS_TYPES.map(c => c.id);
    expect(ids).toContain('light');
    expect(ids).toContain('heavy');
    expect(ids).toContain('balanced');
  });

  it('validates ChassisType interface fields for all entries', () => {
    for (const c of CHASSIS_TYPES) {
      expect(typeof c.id).toBe('string');
      expect(typeof c.name).toBe('string');
      expect(typeof c.description).toBe('string');
      expect(typeof c.baseStats.hp).toBe('number');
      expect(typeof c.baseStats.move).toBe('number');
      expect(typeof c.baseStats.jump).toBe('number');
      expect(typeof c.baseStats.attack).toBe('number');
      expect(typeof c.baseStats.defense).toBe('number');
      expect(Array.isArray(c.moduleSlots)).toBe(true);
      for (const slot of c.moduleSlots) {
        expect(typeof slot.id).toBe('string');
        expect(['weapon', 'armor', 'skill', 'utility']).toContain(slot.type);
      }
    }
  });

  it('light chassis has high move, low defense, 3 slots', () => {
    const light = getChassisType('light')!;
    expect(light.baseStats.move).toBeGreaterThan(3);
    expect(light.baseStats.defense).toBeLessThan(6);
    expect(light.moduleSlots).toHaveLength(3);
  });

  it('heavy chassis has low move, high defense, 4 slots', () => {
    const heavy = getChassisType('heavy')!;
    expect(heavy.baseStats.move).toBeLessThan(3);
    expect(heavy.baseStats.defense).toBeGreaterThan(10);
    expect(heavy.moduleSlots).toHaveLength(4);
  });

  it('balanced chassis has medium stats, 3 slots', () => {
    const balanced = getChassisType('balanced')!;
    expect(balanced.baseStats.move).toBe(3);
    expect(balanced.baseStats.defense).toBeGreaterThanOrEqual(6);
    expect(balanced.baseStats.defense).toBeLessThanOrEqual(10);
    expect(balanced.moduleSlots).toHaveLength(3);
  });

  it('getChassisType returns undefined for unknown id', () => {
    expect(getChassisType('unknown')).toBeUndefined();
  });

  it('getAllChassisTypes returns all chassis', () => {
    expect(getAllChassisTypes()).toEqual(CHASSIS_TYPES);
  });

  it('supports optional unlockCondition', () => {
    const light = getChassisType('light')!;
    expect(light.unlockCondition).toBeDefined();
    expect(light.unlockCondition!.type).toBe('story_progress');
    expect(typeof light.unlockCondition!.target).toBe('string');

    const balanced = getChassisType('balanced')!;
    expect(balanced.unlockCondition).toBeUndefined();
  });

  it('validates Loadout interface shape', () => {
    const loadout: Loadout = {
      unitId: 'unit_01',
      chassisId: 'light',
      equippedModules: {
        light_w1: 'mod_laser_rifle',
        light_a1: 'mod_ceramic_plate',
      },
    };
    expect(typeof loadout.unitId).toBe('string');
    expect(typeof loadout.chassisId).toBe('string');
    expect(typeof loadout.equippedModules).toBe('object');
  });

  it('validates UnlockCondition interface shape', () => {
    const cond: UnlockCondition = {
      type: 'mission_clear',
      target: 'mission_01',
      value: 1,
    };
    expect(cond.type).toBe('mission_clear');
    expect(cond.target).toBe('mission_01');
    expect(cond.value).toBe(1);
  });
});
