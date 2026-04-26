import type { ModuleDefinition } from '../data/ModuleTypes';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';

export interface LootDrop {
  moduleId: string;
  rarity: Rarity;
}

export interface LootResult {
  drops: LootDrop[]; // exactly 3 items
}

const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 50,
  uncommon: 30,
  rare: 15,
  epic: 5,
};

// Simple seeded PRNG (LCG) — same pattern as RiftMap
class SeededRandom {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 2147483647);
  }

  next(): number {
    // LCG parameters from Numerical Recipes
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  range(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
}

export function getRarityWeight(rarity: Rarity): number {
  return RARITY_WEIGHTS[rarity];
}

function pickWeightedModule(
  modules: ModuleDefinition[],
  rng: SeededRandom,
  excludeIds: Set<string>
): LootDrop | null {
  const available = modules.filter((m) => !excludeIds.has(m.id));
  if (available.length === 0) return null;

  const totalWeight = available.reduce(
    (sum, m) => sum + getRarityWeight(m.rarity),
    0
  );
  let roll = rng.next() * totalWeight;

  for (const mod of available) {
    roll -= getRarityWeight(mod.rarity);
    if (roll <= 0) {
      return { moduleId: mod.id, rarity: mod.rarity };
    }
  }

  // Fallback to last item if floating-point rounding leaves roll > 0
  const last = available[available.length - 1];
  return { moduleId: last.id, rarity: last.rarity };
}

export function generateLoot(
  allModules: ModuleDefinition[],
  count: number = 3
): LootResult {
  if (allModules.length === 0) {
    return { drops: [] };
  }

  const rng = new SeededRandom();
  const drops: LootDrop[] = [];
  const pickedIds = new Set<string>();

  const actualCount = Math.min(count, allModules.length);

  for (let i = 0; i < actualCount; i++) {
    const drop = pickWeightedModule(allModules, rng, pickedIds);
    if (!drop) break;
    drops.push(drop);
    pickedIds.add(drop.moduleId);
  }

  return { drops };
}
