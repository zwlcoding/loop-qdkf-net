import { describe, expect, it } from 'vitest';
import {
  generateLoot,
  getRarityWeight,
  type Rarity,
  type LootResult,
} from './LootSystem';
import type { ModuleDefinition } from '../data/ModuleTypes';

function makeModule(id: string, rarity: Rarity): ModuleDefinition {
  return {
    id,
    name: id,
    category: 'active',
    rarity,
    description: 'Test module',
    effects: [{ type: 'damage' }],
  };
}

describe('getRarityWeight', () => {
  it('returns correct weights for each rarity', () => {
    expect(getRarityWeight('common')).toBe(50);
    expect(getRarityWeight('uncommon')).toBe(30);
    expect(getRarityWeight('rare')).toBe(15);
    expect(getRarityWeight('epic')).toBe(5);
  });
});

describe('generateLoot', () => {
  it('returns exactly 3 items by default', () => {
    const modules: ModuleDefinition[] = [
      makeModule('a', 'common'),
      makeModule('b', 'common'),
      makeModule('c', 'common'),
      makeModule('d', 'uncommon'),
    ];
    const result = generateLoot(modules);
    expect(result.drops).toHaveLength(3);
  });

  it('returns empty drops when module list is empty', () => {
    const result = generateLoot([]);
    expect(result.drops).toHaveLength(0);
  });

  it('returns no more drops than available modules', () => {
    const modules: ModuleDefinition[] = [
      makeModule('a', 'common'),
      makeModule('b', 'uncommon'),
    ];
    const result = generateLoot(modules, 5);
    expect(result.drops.length).toBeLessThanOrEqual(modules.length);
  });

  it('has no duplicate moduleIds in a single drop', () => {
    const modules: ModuleDefinition[] = [
      makeModule('a', 'common'),
      makeModule('b', 'common'),
      makeModule('c', 'common'),
      makeModule('d', 'common'),
      makeModule('e', 'common'),
      makeModule('f', 'common'),
    ];
    const result = generateLoot(modules);
    const ids = result.drops.map((d) => d.moduleId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('roughly matches rarity distribution over many rolls', () => {
    // Use equal counts per rarity so aggregate weight ratios match per-item weights
    const modules: ModuleDefinition[] = [
      makeModule('c1', 'common'),
      makeModule('c2', 'common'),
      makeModule('u1', 'uncommon'),
      makeModule('u2', 'uncommon'),
      makeModule('r1', 'rare'),
      makeModule('r2', 'rare'),
      makeModule('e1', 'epic'),
      makeModule('e2', 'epic'),
    ];

    const counts: Record<Rarity, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
    };

    const totalRolls = 5000;
    for (let i = 0; i < totalRolls; i++) {
      const result: LootResult = generateLoot(modules);
      for (const drop of result.drops) {
        counts[drop.rarity]++;
      }
    }

    const totalDrops =
      counts.common + counts.uncommon + counts.rare + counts.epic;

    const commonRatio = counts.common / totalDrops;
    const uncommonRatio = counts.uncommon / totalDrops;
    const rareRatio = counts.rare / totalDrops;
    const epicRatio = counts.epic / totalDrops;

    // Allow ±10% tolerance around target per-item weights
    expect(commonRatio).toBeGreaterThan(0.40);
    expect(commonRatio).toBeLessThan(0.60);

    expect(uncommonRatio).toBeGreaterThan(0.20);
    expect(uncommonRatio).toBeLessThan(0.40);

    expect(rareRatio).toBeGreaterThan(0.05);
    expect(rareRatio).toBeLessThan(0.25);

    expect(epicRatio).toBeGreaterThan(0.0);
    expect(epicRatio).toBeLessThan(0.15);
  });
});
