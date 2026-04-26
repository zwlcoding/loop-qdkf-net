import { describe, expect, it } from 'vitest';
import { CombatResolver } from './CombatResolver';
import type { FacingDirection } from '../entities/Unit';

const makeUnit = (tileX: number, tileY: number, facing: FacingDirection = 'east') => ({
  getTileX: () => tileX,
  getTileY: () => tileY,
  getFacing: () => facing,
  getDefense: () => 0,
}) as any;

const makeGrid = (tiles: Record<string, { height: number; walkable: boolean; terrain: string; terrainFlags: string[]; hazardType?: string; objectiveId?: string }>) => ({
  getTile: (x: number, y: number) => tiles[`${x},${y}`] ? { x, y, ...tiles[`${x},${y}`] } : null,
  getHeight: (x: number, y: number) => tiles[`${x},${y}`]?.height ?? -1,
}) as any;

describe('CombatResolver knockback', () => {
  it('applies collision damage when knockback hits blocked space', () => {
    const grid = makeGrid({
      '1,1': { height: 1, walkable: true, terrain: 'plain', terrainFlags: [] },
      '2,1': { height: 1, walkable: true, terrain: 'plain', terrainFlags: [] },
      '3,1': { height: 1, walkable: false, terrain: 'water', terrainFlags: ['hazard'] },
    });

    const resolver = new CombatResolver(grid);
    const attacker = makeUnit(1, 1, 'east');
    const defender = makeUnit(2, 1, 'west');

    const outcome = resolver.resolveKnockback(attacker, defender, 2);

    expect(outcome.collided).toBe(true);
    expect(outcome.finalX).toBe(2);
    expect(outcome.collisionDamage).toBeGreaterThan(0);
    expect(outcome.blockedBy).toBe('impassable');
  });

  it('applies fall damage when knockback drops a unit by multiple levels', () => {
    const grid = makeGrid({
      '1,1': { height: 3, walkable: true, terrain: 'plain', terrainFlags: [] },
      '2,1': { height: 1, walkable: true, terrain: 'plain', terrainFlags: [] },
      '3,1': { height: 1, walkable: true, terrain: 'plain', terrainFlags: [] },
    });

    const resolver = new CombatResolver(grid);
    const attacker = makeUnit(0, 1, 'east');
    const defender = makeUnit(1, 1, 'west');

    const outcome = resolver.resolveKnockback(attacker, defender, 1);

    expect(outcome.finalX).toBe(2);
    expect(outcome.fallDistance).toBe(2);
    expect(outcome.fallDamage).toBeGreaterThan(0);
  });

  it('applies hazard damage when knockback lands on a hazard tile', () => {
    const grid = makeGrid({
      '1,1': { height: 1, walkable: true, terrain: 'plain', terrainFlags: [] },
      '2,1': { height: 1, walkable: true, terrain: 'water', terrainFlags: ['hazard'], hazardType: 'spikes' },
      '3,1': { height: 1, walkable: true, terrain: 'plain', terrainFlags: [] },
    });

    const resolver = new CombatResolver(grid);
    const attacker = makeUnit(0, 1, 'east');
    const defender = makeUnit(1, 1, 'west');

    const outcome = resolver.resolveKnockback(attacker, defender, 1);

    expect(outcome.finalX).toBe(2);
    expect(outcome.hazardDamage).toBeGreaterThan(0);
    expect(outcome.hazardType).toBe('spikes');
  });
});

describe('CombatResolver terrain cover', () => {
  // Attacker directly north of defender; defender faces north so arc is front (0 bonus)
  it('reduces hit chance based on defender terrain coverValue', () => {
    const grid = makeGrid({
      '2,0': { height: 0, walkable: true, terrain: 'plain', terrainFlags: [] },
      '2,1': { height: 0, walkable: true, terrain: 'urban', terrainFlags: ['obstacle'] },
    });

    const resolver = new CombatResolver(grid);
    const attacker = makeUnit(2, 0, 'south');
    const defender = makeUnit(2, 1, 'north');

    const hitChance = resolver.calculateHitChance(attacker, defender, 80);
    // urban coverValue is 70, front arc gives 0 bonus, so 80 - 70 = 10
    expect(hitChance).toBe(10);
  });

  it('does not reduce hit chance below minimum of 5', () => {
    const grid = makeGrid({
      '2,0': { height: 0, walkable: true, terrain: 'plain', terrainFlags: [] },
      '2,1': { height: 0, walkable: true, terrain: 'urban', terrainFlags: ['obstacle'] },
    });

    const resolver = new CombatResolver(grid);
    const attacker = makeUnit(2, 0, 'south');
    const defender = makeUnit(2, 1, 'north');

    const hitChance = resolver.calculateHitChance(attacker, defender, 60);
    // 60 - 70 = -10, clamped to 5
    expect(hitChance).toBe(5);
  });

  it('does not modify hit chance when defender is on plain terrain', () => {
    const grid = makeGrid({
      '2,0': { height: 0, walkable: true, terrain: 'plain', terrainFlags: [] },
      '2,1': { height: 0, walkable: true, terrain: 'plain', terrainFlags: [] },
    });

    const resolver = new CombatResolver(grid);
    const attacker = makeUnit(2, 0, 'south');
    const defender = makeUnit(2, 1, 'north');

    const hitChance = resolver.calculateHitChance(attacker, defender, 80);
    expect(hitChance).toBe(80);
  });

  it('applies forest coverValue of 30 correctly', () => {
    const grid = makeGrid({
      '2,0': { height: 0, walkable: true, terrain: 'plain', terrainFlags: [] },
      '2,1': { height: 0, walkable: true, terrain: 'forest', terrainFlags: ['natural', 'rough'] },
    });

    const resolver = new CombatResolver(grid);
    const attacker = makeUnit(2, 0, 'south');
    const defender = makeUnit(2, 1, 'north');

    const hitChance = resolver.calculateHitChance(attacker, defender, 80);
    expect(hitChance).toBe(50);
  });
});
