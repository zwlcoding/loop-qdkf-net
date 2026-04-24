import { describe, expect, it, vi } from 'vitest';
import type { Scene } from 'phaser';
import { Unit } from './Unit';
import { StatusEffect } from './StatusEffect';

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

describe('Unit status behavior', () => {
  it('reduces initiative-relevant speed while slowed', () => {
    const unit = new Unit(makeScene(), 1, 1, 'skirmisher', 0);

    unit.addStatus(new StatusEffect('slow', 2, 1));

    expect(unit.getSpeed()).toBe(8);
  });

  it('blocks movement when rooted but still allows actions', () => {
    const unit = new Unit(makeScene(), 1, 1, 'skirmisher', 0);
    unit.addStatus(new StatusEffect('root', 2));

    unit.startTurn();

    expect(unit.canMove()).toBe(false);
    expect(unit.canAct()).toBe(true);
  });

  it('skips actions for a stunned unit during its turn', () => {
    const unit = new Unit(makeScene(), 1, 1, 'support', 0);
    unit.addStatus(new StatusEffect('stun', 1));

    unit.startTurn();

    expect(unit.canMove()).toBe(false);
    expect(unit.canAct()).toBe(false);
  });

  it('applies poison damage at turn start and then expires', () => {
    const unit = new Unit(makeScene(), 1, 1, 'vanguard', 0);
    const hpBefore = unit.getHp();
    unit.addStatus(new StatusEffect('poison', 1, 2));

    unit.startTurn();

    expect(unit.getHp()).toBe(hpBefore - 10);
    expect(unit.getStatuses()).toHaveLength(0);
  });

  it('reduces incoming damage with shield before hp is lost', () => {
    const unit = new Unit(makeScene(), 1, 1, 'vanguard', 0);
    const hpBefore = unit.getHp();
    unit.addStatus(new StatusEffect('shield', 2, 2));

    unit.applyResolvedDamage(12);

    expect(unit.getHp()).toBe(hpBefore - 2);
    expect(unit.getStatuses()[0]?.getMagnitude()).toBe(0);
  });

  it('increases incoming resolved damage when vulnerable', () => {
    const unit = new Unit(makeScene(), 1, 1, 'vanguard', 0);
    const hpBefore = unit.getHp();
    unit.addStatus(new StatusEffect('vulnerable', 2, 1));

    unit.applyResolvedDamage(10);

    expect(unit.getHp()).toBe(hpBefore - 15);
  });

  it('surfaces readable chinese status summaries', () => {
    const unit = new Unit(makeScene(), 1, 1, 'controller', 0);
    unit.addStatus(new StatusEffect('slow', 2, 1));
    unit.addStatus(new StatusEffect('poison', 3, 2));

    expect(unit.getStatusSummary()).toEqual(['迟缓 2回合', '中毒 3回合(每回合10)']);
  });
});
