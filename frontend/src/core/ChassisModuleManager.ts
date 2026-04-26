import {
  getChassisType,
  getAllChassisTypes,
  type ChassisType,
  type Loadout,
  type SlotType,
} from '../data/ChassisTypes';
import {
  getModuleItem,
  getAllModuleItems,
  getModulesBySlotType,
  type ModuleItem,
} from '../data/ModuleTypes';
import { Unit } from '../entities/Unit';

export class ChassisModuleManager {
  private unlockedChassis: Set<string> = new Set();
  private unlockedModules: Set<string> = new Set();

  getAvailableChassis(): ChassisType[] {
    return getAllChassisTypes();
  }

  getChassisById(id: string): ChassisType | null {
    return getChassisType(id) ?? null;
  }

  getAvailableModules(slotType?: string): ModuleItem[] {
    if (slotType) {
      return getModulesBySlotType(slotType as SlotType);
    }
    return getAllModuleItems();
  }

  getModuleById(id: string): ModuleItem | null {
    return getModuleItem(id) ?? null;
  }

  applyLoadout(unit: Unit, loadout: Loadout): void {
    const chassis = this.getChassisById(loadout.chassisId);
    if (!chassis) {
      throw new Error(`Chassis not found: ${loadout.chassisId}`);
    }

    // Apply chassis base stats to unit
    // Unit doesn't have direct setters for all stats, so we use takeDamage/heal
    // to adjust HP and rely on the fact that base stats are applied.
    const maxHp = unit.getMaxHp();
    const hpDiff = chassis.baseStats.hp - maxHp;

    if (hpDiff > 0) {
      unit.heal(hpDiff);
    } else if (hpDiff < 0) {
      unit.takeDamage(Math.abs(hpDiff));
    }

    // For other stats, Unit doesn't expose setters. We'll store the
    // loadout-derived bonuses on the unit via a metadata approach.
    // Since Unit doesn't have a generic metadata store, we'll track
    // applied bonuses in a WeakMap associated with the unit instance.
    const bonuses = this.calculateStatBonusFromLoadout(loadout);
    appliedBonuses.set(unit, bonuses);

    // Apply ability/passive effects (store them)
    const abilities: string[] = [];
    const passives: string[] = [];

    for (const slotId of Object.keys(loadout.equippedModules)) {
      const moduleId = loadout.equippedModules[slotId];
      const mod = this.getModuleById(moduleId);
      if (!mod) continue;

      for (const effect of mod.effects) {
        if (effect.type === 'ability') {
          abilities.push(String(effect.value));
        } else if (effect.type === 'passive') {
          passives.push(String(effect.value));
        }
      }
    }

    appliedAbilities.set(unit, abilities);
    appliedPassives.set(unit, passives);
  }

  calculateStatBonus(equippedModules: Record<string, ModuleItem>): Record<string, number> {
    const bonuses: Record<string, number> = {};

    for (const mod of Object.values(equippedModules)) {
      for (const effect of mod.effects) {
        if (effect.type === 'stat_bonus' && typeof effect.value === 'number') {
          const current = bonuses[effect.target] ?? 0;
          // Same stat: take highest value (no stacking)
          bonuses[effect.target] = Math.max(current, effect.value);
        }
      }
    }

    return bonuses;
  }

  unlockChassis(chassisId: string): void {
    this.unlockedChassis.add(chassisId);
  }

  unlockModule(moduleId: string): void {
    this.unlockedModules.add(moduleId);
  }

  isChassisUnlocked(chassisId: string): boolean {
    return this.unlockedChassis.has(chassisId);
  }

  isModuleUnlocked(moduleId: string): boolean {
    return this.unlockedModules.has(moduleId);
  }

  // Helper to compute bonuses from a Loadout (using module IDs)
  private calculateStatBonusFromLoadout(loadout: Loadout): Record<string, number> {
    const equipped: Record<string, ModuleItem> = {};
    for (const slotId of Object.keys(loadout.equippedModules)) {
      const moduleId = loadout.equippedModules[slotId];
      const mod = this.getModuleById(moduleId);
      if (mod) {
        equipped[slotId] = mod;
      }
    }
    return this.calculateStatBonus(equipped);
  }
}

// WeakMaps to store applied loadout data on Unit instances without modifying Unit
export const appliedBonuses = new WeakMap<Unit, Record<string, number>>();
export const appliedAbilities = new WeakMap<Unit, string[]>();
export const appliedPassives = new WeakMap<Unit, string[]>();
