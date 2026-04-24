import { describe, expect, it } from 'vitest';
import { contentLoader } from './ContentLoader';
import modulesJson from '../../assets/data/modules.json';
import type { ModuleDefinition } from './ModuleTypes';

describe('ModuleDefinitions', () => {
  it('covers all four categories: active, passive, combo, tool', () => {
    contentLoader.loadModules(modulesJson as { modules: unknown[] });
    const categories = new Set(contentLoader.getAllModules().map(m => m.category));
    expect(categories).toEqual(new Set(['active', 'passive', 'combo', 'tool']));
  });

  it('has at least one module in each category', () => {
    contentLoader.loadModules(modulesJson as { modules: unknown[] });
    expect(contentLoader.getModulesByCategory('active').length).toBeGreaterThan(0);
    expect(contentLoader.getModulesByCategory('passive').length).toBeGreaterThan(0);
    expect(contentLoader.getModulesByCategory('combo').length).toBeGreaterThan(0);
    expect(contentLoader.getModulesByCategory('tool').length).toBeGreaterThan(0);
  });

  it('exposes required schema fields for every module', () => {
    contentLoader.loadModules(modulesJson as { modules: unknown[] });
    const all = contentLoader.getAllModules();
    for (const m of all) {
      expect(typeof m.id).toBe('string');
      expect(typeof m.name).toBe('string');
      expect(typeof m.category).toBe('string');
      expect(typeof m.description).toBe('string');
      expect(Array.isArray(m.effects)).toBe(true);
    }
  });

  it('includes fields needed for slot validation (id, category, effects)', () => {
    contentLoader.loadModules(modulesJson as { modules: unknown[] });
    const all = contentLoader.getAllModules();
    for (const m of all) {
      expect(m.id).toBeTruthy();
      expect(['active', 'passive', 'combo', 'tool']).toContain(m.category);
      expect(m.effects.length).toBeGreaterThan(0);
      for (const e of m.effects) {
        expect(typeof e.type).toBe('string');
      }
    }
  });

  it('preserves existing runtime IDs for backward compatibility', () => {
    contentLoader.loadModules(modulesJson as { modules: unknown[] });
    const ids = contentLoader.getAllModules().map(m => m.id);
    const expectedIds = [
      'slash',
      'fireball',
      'heal',
      'shield_bash',
      'barrier_field',
      'toxin_round',
      'charge',
      'root_shot',
      'speed_boost',
      'iron_skin',
      'adrenaline',
      'vigor',
      'team_strike',
      'unison_blast',
      'rescue_link',
      'potion',
      'smoke_bomb',
      'stim_pack',
      'flash_bang',
    ];
    expect(ids).toEqual(expectedIds);
  });

  it('validates category-specific fields for active modules', () => {
    contentLoader.loadModules(modulesJson as { modules: unknown[] });
    const actives = contentLoader.getModulesByCategory('active');
    for (const m of actives) {
      expect(m.targeting).toBeDefined();
      expect(typeof m.targeting!.range).toBe('number');
      expect(typeof m.targeting!.shape).toBe('string');
      expect(typeof m.targeting!.lineOfSight).toBe('boolean');
    }
  });

  it('validates category-specific fields for combo modules', () => {
    contentLoader.loadModules(modulesJson as { modules: unknown[] });
    const combos = contentLoader.getModulesByCategory('combo');
    for (const m of combos) {
      expect(typeof m.comboCost).toBe('number');
      expect(m.participationRules).toBeDefined();
      expect(typeof m.participationRules!.maxAllies).toBe('number');
      expect(typeof m.participationRules!.range).toBe('number');
      expect(typeof m.participationRules!.lineOfSight).toBe('boolean');
    }
  });

  it('validates category-specific fields for tool modules', () => {
    contentLoader.loadModules(modulesJson as { modules: unknown[] });
    const tools = contentLoader.getModulesByCategory('tool');
    for (const m of tools) {
      expect(typeof m.usesPerTurn).toBe('number');
    }
  });

  it('validates that passive modules have no targeting or comboCost', () => {
    contentLoader.loadModules(modulesJson as { modules: unknown[] });
    const passives = contentLoader.getModulesByCategory('passive');
    for (const m of passives) {
      expect(m.targeting).toBeUndefined();
      expect(m.comboCost).toBeUndefined();
      expect(m.participationRules).toBeUndefined();
      expect(m.usesPerTurn).toBeUndefined();
    }
  });
});
