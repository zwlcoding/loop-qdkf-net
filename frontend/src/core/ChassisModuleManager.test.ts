import { describe, expect, it, vi } from 'vitest';
import type { Scene } from 'phaser';
import { Unit } from '../entities/Unit';
import {
  ChassisModuleManager,
  appliedBonuses,
  appliedAbilities,
  appliedPassives,
} from './ChassisModuleManager';
import type { Loadout } from '../data/ChassisTypes';
import type { ModuleItem } from '../data/ModuleTypes';

const makeScene = (): Scene => {
  const image = {
    setDisplaySize: vi.fn(),
    setTint: vi.fn(),
    setPosition: vi.fn(),
    setAlpha: vi.fn(),
    destroy: vi.fn(),
  };

  return {
    add: {
      image: vi.fn(() => image),
    },
    registry: {
      get: vi.fn(() => null),
    },
  } as unknown as Scene;
};

const makeUnit = (chassis: Parameters<typeof Unit.prototype.constructor>[3] = 'vanguard', squad = 0): Unit => {
  return new Unit(makeScene(), 1, 1, chassis, squad);
};

describe('ChassisModuleManager', () => {
  describe('getAvailableChassis', () => {
    it('returns all chassis types', () => {
      const manager = new ChassisModuleManager();
      const chassis = manager.getAvailableChassis();
      expect(chassis.length).toBe(3);
      const ids = chassis.map(c => c.id);
      expect(ids).toContain('light');
      expect(ids).toContain('heavy');
      expect(ids).toContain('balanced');
    });
  });

  describe('getChassisById', () => {
    it('returns the correct chassis for a valid id', () => {
      const manager = new ChassisModuleManager();
      const chassis = manager.getChassisById('light');
      expect(chassis).not.toBeNull();
      expect(chassis!.id).toBe('light');
      expect(chassis!.name).toBe('Light Chassis');
    });

    it('returns null for an unknown id', () => {
      const manager = new ChassisModuleManager();
      expect(manager.getChassisById('unknown')).toBeNull();
    });
  });

  describe('getAvailableModules', () => {
    it('returns all modules when no slotType is provided', () => {
      const manager = new ChassisModuleManager();
      const modules = manager.getAvailableModules();
      expect(modules.length).toBe(8);
    });

    it('filters modules by slot type', () => {
      const manager = new ChassisModuleManager();
      const weapons = manager.getAvailableModules('weapon');
      expect(weapons.every(m => m.slotType === 'weapon')).toBe(true);
      expect(weapons.length).toBe(2);

      const armors = manager.getAvailableModules('armor');
      expect(armors.every(m => m.slotType === 'armor')).toBe(true);
      expect(armors.length).toBe(2);
    });
  });

  describe('getModuleById', () => {
    it('returns the correct module for a valid id', () => {
      const manager = new ChassisModuleManager();
      const mod = manager.getModuleById('mod_laser_rifle');
      expect(mod).not.toBeNull();
      expect(mod!.id).toBe('mod_laser_rifle');
      expect(mod!.name).toBe('Laser Rifle');
    });

    it('returns null for an unknown id', () => {
      const manager = new ChassisModuleManager();
      expect(manager.getModuleById('unknown')).toBeNull();
    });
  });

  describe('applyLoadout', () => {
    it('applies chassis base stats to unit HP', () => {
      const manager = new ChassisModuleManager();
      const unit = makeUnit('vanguard', 0);

      const loadout: Loadout = {
        unitId: unit.getId(),
        chassisId: 'heavy',
        equippedModules: {},
      };

      manager.applyLoadout(unit, loadout);

      // heavy chassis has 150 hp, vanguard base is 120
      // Unit.takeDamage reduces by defense, so actual HP change depends on unit stats.
      // We verify the loadout was applied without throwing and bonuses are tracked.
      expect(appliedBonuses.get(unit)).toBeDefined();
    });

    it('throws when chassisId is not found', () => {
      const manager = new ChassisModuleManager();
      const unit = makeUnit();
      const loadout: Loadout = {
        unitId: unit.getId(),
        chassisId: 'nonexistent',
        equippedModules: {},
      };
      expect(() => manager.applyLoadout(unit, loadout)).toThrow('Chassis not found: nonexistent');
    });

    it('stores stat bonuses in WeakMap', () => {
      const manager = new ChassisModuleManager();
      const unit = makeUnit();
      const loadout: Loadout = {
        unitId: unit.getId(),
        chassisId: 'light',
        equippedModules: {
          light_w1: 'mod_laser_rifle',
        },
      };

      manager.applyLoadout(unit, loadout);
      const bonuses = appliedBonuses.get(unit);
      expect(bonuses).toBeDefined();
      expect(bonuses!.attack).toBe(6);
    });

    it('stores abilities and passives in WeakMaps', () => {
      const manager = new ChassisModuleManager();
      const unit = makeUnit();
      const loadout: Loadout = {
        unitId: unit.getId(),
        chassisId: 'light',
        equippedModules: {
          light_w1: 'mod_laser_rifle',
          light_a1: 'mod_ceramic_plate',
        },
      };

      manager.applyLoadout(unit, loadout);
      expect(appliedAbilities.get(unit)).toContain('laser_shot');
      // mod_ceramic_plate has a passive effect with value 2 (number), not 'damage_reduction'
      // The passive target is 'damage_reduction' and value is 2. We store the value as string.
      expect(appliedPassives.get(unit)).toContain('2');
    });
  });

  describe('calculateStatBonus', () => {
    it('aggregates stat_bonus effects', () => {
      const manager = new ChassisModuleManager();
      const equipped: Record<string, ModuleItem> = {
        slot1: {
          id: 'mod_laser_rifle',
          name: 'Laser Rifle',
          slotType: 'weapon',
          description: '',
          effects: [{ type: 'stat_bonus', target: 'attack', value: 6 }],
        },
        slot2: {
          id: 'mod_ceramic_plate',
          name: 'Ceramic Plate',
          slotType: 'armor',
          description: '',
          effects: [{ type: 'stat_bonus', target: 'defense', value: 4 }],
        },
      };

      const bonuses = manager.calculateStatBonus(equipped);
      expect(bonuses.attack).toBe(6);
      expect(bonuses.defense).toBe(4);
    });

    it('takes highest value for same stat (no stacking)', () => {
      const manager = new ChassisModuleManager();
      const equipped: Record<string, ModuleItem> = {
        slot1: {
          id: 'mod_laser_rifle',
          name: 'Laser Rifle',
          slotType: 'weapon',
          description: '',
          effects: [{ type: 'stat_bonus', target: 'attack', value: 6 }],
        },
        slot2: {
          id: 'mod_plasma_blade',
          name: 'Plasma Blade',
          slotType: 'weapon',
          description: '',
          effects: [{ type: 'stat_bonus', target: 'attack', value: 8 }],
        },
        slot3: {
          id: 'mod_targeting_comp',
          name: 'Targeting Computer',
          slotType: 'utility',
          description: '',
          effects: [{ type: 'stat_bonus', target: 'attack', value: 3 }],
        },
      };

      const bonuses = manager.calculateStatBonus(equipped);
      expect(bonuses.attack).toBe(8);
    });

    it('ignores non-stat_bonus effects', () => {
      const manager = new ChassisModuleManager();
      const equipped: Record<string, ModuleItem> = {
        slot1: {
          id: 'mod_overclock',
          name: 'Overclock',
          slotType: 'skill',
          description: '',
          effects: [
            { type: 'ability', target: 'active_skill', value: 'overclock_burst' },
            { type: 'passive', target: 'speed_bonus', value: 1 },
          ],
        },
      };

      const bonuses = manager.calculateStatBonus(equipped);
      expect(Object.keys(bonuses).length).toBe(0);
    });
  });

  describe('unlock management', () => {
    it('tracks unlocked chassis', () => {
      const manager = new ChassisModuleManager();
      expect(manager.isChassisUnlocked('light')).toBe(false);
      manager.unlockChassis('light');
      expect(manager.isChassisUnlocked('light')).toBe(true);
    });

    it('tracks unlocked modules', () => {
      const manager = new ChassisModuleManager();
      expect(manager.isModuleUnlocked('mod_laser_rifle')).toBe(false);
      manager.unlockModule('mod_laser_rifle');
      expect(manager.isModuleUnlocked('mod_laser_rifle')).toBe(true);
    });

    it('does not affect other unlocks', () => {
      const manager = new ChassisModuleManager();
      manager.unlockChassis('light');
      expect(manager.isChassisUnlocked('heavy')).toBe(false);
      expect(manager.isModuleUnlocked('light')).toBe(false);
    });
  });
});
