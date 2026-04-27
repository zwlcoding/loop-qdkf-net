import { describe, expect, it, vi } from 'vitest';
import type { Scene } from 'phaser';
import { Unit } from './Unit';
import { StatusEffect } from './StatusEffect';

const makeUnit = (chassis: Parameters<typeof Unit.prototype.constructor>[3] = 'vanguard', squad = 0): Unit => {
  return new Unit(makeScene(), 1, 1, chassis, squad);
};

const makeScene = (): Scene => {
  const image = {
    setOrigin: vi.fn(),
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
  it('anchors its sprite near the feet so tile centers match board occupancy', () => {
    const scene = makeScene();

    new Unit(scene, 1, 1, 'vanguard', 0);

    const image = (scene.add.image as any).mock.results[0].value;
    expect(image.setOrigin).toHaveBeenCalledWith(0.5, 0.82);
  });

  it('uses the registered grid map for elevated world positions', () => {
    const scene = makeScene();
    const getTileWorldPosition = vi.fn(() => ({ x: 128, y: 96 }));
    (scene.registry.get as any).mockReturnValue({ getTileWorldPosition });

    const unit = new Unit(scene, 3, 2, 'vanguard', 0);

    expect(unit.getWorldPosition()).toEqual({ x: 128, y: 96 });
    expect(getTileWorldPosition).toHaveBeenCalledWith(3, 2);
  });

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

describe('Unit HP events', () => {
  it('fires onHpChanged when takeDamage is called', () => {
    const unit = makeUnit();
    const hpChanged = vi.fn();
    unit.setOnHpChanged(hpChanged);

    unit.takeDamage(10);

    expect(hpChanged).toHaveBeenCalledTimes(1);
    expect(hpChanged).toHaveBeenLastCalledWith(unit.getHp(), unit.getMaxHp());
  });

  it('fires onHpChanged when heal is called', () => {
    const unit = makeUnit();
    unit.takeDamage(20);
    const hpChanged = vi.fn();
    unit.setOnHpChanged(hpChanged);

    unit.heal(10);

    expect(hpChanged).toHaveBeenCalledTimes(1);
    expect(hpChanged).toHaveBeenLastCalledWith(unit.getHp(), unit.getMaxHp());
  });

  it('fires onHpChanged when applyResolvedDamage is called', () => {
    const unit = makeUnit();
    const hpChanged = vi.fn();
    unit.setOnHpChanged(hpChanged);

    unit.applyResolvedDamage(15);

    expect(hpChanged).toHaveBeenCalledTimes(1);
    expect(hpChanged).toHaveBeenLastCalledWith(unit.getHp(), unit.getMaxHp());
  });

  it('fires onHpChanged when applyStatusDamage is called', () => {
    const unit = makeUnit();
    const hpChanged = vi.fn();
    unit.setOnHpChanged(hpChanged);

    unit.applyStatusDamage(12);

    expect(hpChanged).toHaveBeenCalledTimes(1);
    expect(hpChanged).toHaveBeenLastCalledWith(unit.getHp(), unit.getMaxHp());
  });

  it('fires onDeath when HP reaches 0 via takeDamage', () => {
    const unit = makeUnit();
    const death = vi.fn();
    unit.setOnDeath(death);

    unit.takeDamage(9999);

    expect(death).toHaveBeenCalledTimes(1);
  });

  it('fires onDeath when HP reaches 0 via applyResolvedDamage', () => {
    const unit = makeUnit();
    const death = vi.fn();
    unit.setOnDeath(death);

    unit.applyResolvedDamage(9999);

    expect(death).toHaveBeenCalledTimes(1);
  });

  it('fires onDeath when HP reaches 0 via applyStatusDamage', () => {
    const unit = makeUnit();
    const death = vi.fn();
    unit.setOnDeath(death);

    unit.applyStatusDamage(9999);

    expect(death).toHaveBeenCalledTimes(1);
  });

  it('does not fire onDeath if unit survives', () => {
    const unit = makeUnit();
    const death = vi.fn();
    unit.setOnDeath(death);

    unit.takeDamage(5);

    expect(death).not.toHaveBeenCalled();
  });

  it('does not fire onHpChanged after callback is removed', () => {
    const unit = makeUnit();
    const hpChanged = vi.fn();
    unit.setOnHpChanged(hpChanged);
    unit.setOnHpChanged(null);

    unit.takeDamage(10);

    expect(hpChanged).not.toHaveBeenCalled();
  });

  it('passes correct currentHp and maxHp values in onHpChanged', () => {
    const unit = makeUnit();
    const maxHp = unit.getMaxHp();
    unit.takeDamage(20);
    const currentHp = unit.getHp();

    const hpChanged = vi.fn();
    unit.setOnHpChanged(hpChanged);
    unit.heal(5);

    expect(hpChanged).toHaveBeenLastCalledWith(currentHp + 5, maxHp);
  });

  it('does not fire onDeath more than once when damage is applied multiple times after death', () => {
    const unit = makeUnit();
    const death = vi.fn();
    unit.setOnDeath(death);

    unit.applyResolvedDamage(9999);
    unit.applyResolvedDamage(10);
    unit.applyResolvedDamage(5);

    expect(death).toHaveBeenCalledTimes(1);
  });

  it('does not fire onDeath more than once when takeDamage is called after HP is already 0', () => {
    const unit = makeUnit();
    const death = vi.fn();
    unit.setOnDeath(death);

    unit.takeDamage(9999);
    unit.takeDamage(10);

    expect(death).toHaveBeenCalledTimes(1);
  });
});
