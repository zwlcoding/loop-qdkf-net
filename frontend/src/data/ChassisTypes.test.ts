import { describe, expect, it } from 'vitest';
import { contentLoader } from './ContentLoader';
import chassisJson from '../../assets/data/chassis.json';

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
