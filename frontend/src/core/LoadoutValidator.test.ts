import { describe, expect, it } from 'vitest';
import { LoadoutValidator } from './LoadoutValidator';
import type { ChassisDefinition } from '../data/ChassisTypes';
import type { ModuleDefinition } from '../data/ModuleTypes';

const makeChassis = (overrides?: Partial<ChassisDefinition>): ChassisDefinition => ({
  id: 'test',
  name: '测试机体',
  role: 'Test',
  baseStats: { hp: 100, move: 3, jump: 1, speed: 8, attack: 10, defense: 5 },
  slotBias: { active: 2, passive: 1, combo: 1, tool: 1 },
  ...overrides,
});

const makeModule = (id: string, category: ModuleDefinition['category']): ModuleDefinition => ({
  id,
  name: id,
  category,
  description: 'test',
  effects: [{ type: 'damage', power: 1 }],
});

describe('LoadoutValidator', () => {
  it('accepts a valid loadout within slot limits', () => {
    const validator = new LoadoutValidator([makeChassis()]);
    const result = validator.validateUnit({
      chassisId: 'test',
      modules: [
        makeModule('a1', 'active'),
        makeModule('a2', 'active'),
        makeModule('p1', 'passive'),
        makeModule('c1', 'combo'),
        makeModule('t1', 'tool'),
      ],
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.status).toContain('装备合法');
  });

  it('rejects an unknown chassis', () => {
    const validator = new LoadoutValidator([makeChassis()]);
    const result = validator.validateUnit({
      chassisId: 'missing',
      modules: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('chassis');
    expect(result.errors[0].message).toContain('未知机体');
  });

  it('rejects active modules exceeding slot limit', () => {
    const validator = new LoadoutValidator([makeChassis()]);
    const result = validator.validateUnit({
      chassisId: 'test',
      modules: [
        makeModule('a1', 'active'),
        makeModule('a2', 'active'),
        makeModule('a3', 'active'),
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('modules.active');
    expect(result.errors[0].message).toContain('主动技能');
    expect(result.errors[0].message).toContain('上限为 2');
  });

  it('rejects passive modules exceeding slot limit', () => {
    const validator = new LoadoutValidator([makeChassis()]);
    const result = validator.validateUnit({
      chassisId: 'test',
      modules: [
        makeModule('p1', 'passive'),
        makeModule('p2', 'passive'),
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('modules.passive');
    expect(result.errors[0].message).toContain('被动');
  });

  it('rejects combo modules exceeding slot limit', () => {
    const validator = new LoadoutValidator([makeChassis()]);
    const result = validator.validateUnit({
      chassisId: 'test',
      modules: [
        makeModule('c1', 'combo'),
        makeModule('c2', 'combo'),
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('modules.combo');
    expect(result.errors[0].message).toContain('连携');
  });

  it('rejects tool modules exceeding slot limit', () => {
    const validator = new LoadoutValidator([makeChassis()]);
    const result = validator.validateUnit({
      chassisId: 'test',
      modules: [
        makeModule('t1', 'tool'),
        makeModule('t2', 'tool'),
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('modules.tool');
    expect(result.errors[0].message).toContain('道具');
  });

  it('enforces per-category limits independently', () => {
    const validator = new LoadoutValidator([
      makeChassis({ id: 'custom', slotBias: { active: 1, passive: 0, combo: 2, tool: 0 } }),
    ]);
    const result = validator.validateUnit({
      chassisId: 'custom',
      modules: [
        makeModule('a1', 'active'),
        makeModule('a2', 'active'),
        makeModule('p1', 'passive'),
        makeModule('c1', 'combo'),
        makeModule('c2', 'combo'),
        makeModule('c3', 'combo'),
        makeModule('t1', 'tool'),
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(4);
    const fields = result.errors.map((e) => e.field);
    expect(fields).toContain('modules.active');
    expect(fields).toContain('modules.passive');
    expect(fields).toContain('modules.combo');
    expect(fields).toContain('modules.tool');
  });

  it('validates a full squad and reports per-unit errors', () => {
    const validator = new LoadoutValidator([makeChassis()]);
    const result = validator.validateSquad([
      {
        chassisId: 'test',
        modules: [makeModule('a1', 'active'), makeModule('a2', 'active'), makeModule('a3', 'active')],
      },
      {
        chassisId: 'test',
        modules: [makeModule('t1', 'tool'), makeModule('t2', 'tool')],
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].message).toContain('单位 1');
    expect(result.errors[1].message).toContain('单位 2');
  });

  it('accepts a valid squad', () => {
    const validator = new LoadoutValidator([makeChassis()]);
    const result = validator.validateSquad([
      {
        chassisId: 'test',
        modules: [makeModule('a1', 'active'), makeModule('p1', 'passive'), makeModule('c1', 'combo'), makeModule('t1', 'tool')],
      },
      {
        chassisId: 'test',
        modules: [makeModule('a2', 'active'), makeModule('p2', 'passive'), makeModule('c2', 'combo')],
      },
    ]);
    expect(result.valid).toBe(true);
    expect(result.status).toContain('小队装备合法');
  });

  it('rejects an empty squad', () => {
    const validator = new LoadoutValidator([makeChassis()]);
    const result = validator.validateSquad([]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('小队不能为空');
  });

  it('works with real MVP chassis data from JSON', () => {
    const chassisList: ChassisDefinition[] = [
      {
        id: 'vanguard',
        name: '先锋',
        role: 'Tank / Frontline',
        baseStats: { hp: 120, move: 3, jump: 1, speed: 8, attack: 15, defense: 12 },
        slotBias: { active: 2, passive: 1, combo: 1, tool: 1 },
      },
      {
        id: 'skirmisher',
        name: '游击',
        role: 'Flanker / Scout',
        baseStats: { hp: 90, move: 4, jump: 2, speed: 10, attack: 12, defense: 8 },
        slotBias: { active: 2, passive: 1, combo: 1, tool: 1 },
      },
    ];
    const validator = new LoadoutValidator(chassisList);

    const valid = validator.validateUnit({
      chassisId: 'vanguard',
      modules: [
        makeModule('slash', 'active'),
        makeModule('shield_bash', 'active'),
        makeModule('iron_skin', 'passive'),
        makeModule('team_strike', 'combo'),
        makeModule('potion', 'tool'),
      ],
    });
    expect(valid.valid).toBe(true);
    expect(valid.status).toContain('先锋');

    const invalid = validator.validateUnit({
      chassisId: 'skirmisher',
      modules: [
        makeModule('slash', 'active'),
        makeModule('fireball', 'active'),
        makeModule('heal', 'active'),
        makeModule('speed_boost', 'passive'),
        makeModule('iron_skin', 'passive'),
      ],
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.some((e) => e.message.includes('主动技能') && e.message.includes('上限为 2'))).toBe(true);
    expect(invalid.errors.some((e) => e.message.includes('被动') && e.message.includes('上限为 1'))).toBe(true);
  });
});
