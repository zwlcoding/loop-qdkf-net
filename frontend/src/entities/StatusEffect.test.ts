import { describe, expect, it, vi } from 'vitest';
import { StatusEffect } from './StatusEffect';

interface MockUnitStats {
  hp: number;
  maxHp: number;
  speed: number;
  defense: number;
  move: number;
  jump: number;
  attack: number;
}

interface MockUnit {
  stats: MockUnitStats;
  applyStatusDamage: (amount: number) => void;
}

const makeUnit = (): MockUnit => {
  const stats: MockUnitStats = {
    hp: 100,
    maxHp: 100,
    speed: 10,
    defense: 10,
    move: 3,
    jump: 1,
    attack: 15,
  };

  return {
    stats,
    applyStatusDamage: vi.fn((amount: number) => {
      stats.hp = Math.max(0, stats.hp - Math.max(0, Math.round(amount)));
    }),
  };
};

describe('StatusEffect', () => {
  describe('construction', () => {
    it('initializes with correct values', () => {
      const effect = new StatusEffect('slow', 3, 2);

      expect(effect.getType()).toBe('slow');
      expect(effect.getDuration()).toBe(3);
      expect(effect.getRemaining()).toBe(3);
      expect(effect.getMagnitude()).toBe(2);
      expect(effect.isActive()).toBe(true);
    });

    it('defaults magnitude to 1 when omitted', () => {
      const effect = new StatusEffect('root', 2);

      expect(effect.getMagnitude()).toBe(1);
    });
  });

  describe('tick', () => {
    it('decrements remaining duration', () => {
      const effect = new StatusEffect('slow', 3);

      effect.tick(makeUnit() as unknown as import('./Unit').Unit);

      expect(effect.getRemaining()).toBe(2);
      expect(effect.isActive()).toBe(true);
    });

    it('applies poison damage on tick', () => {
      const unit = makeUnit();
      const effect = new StatusEffect('poison', 2, 3);

      effect.tick(unit as unknown as import('./Unit').Unit);

      expect(unit.applyStatusDamage).toHaveBeenCalledWith(15);
      expect(unit.stats.hp).toBe(85);
      expect(effect.getRemaining()).toBe(1);
    });

    it('does nothing for stun except decrement', () => {
      const unit = makeUnit();
      const effect = new StatusEffect('stun', 2);

      effect.tick(unit as unknown as import('./Unit').Unit);

      expect(unit.applyStatusDamage).not.toHaveBeenCalled();
      expect(effect.getRemaining()).toBe(1);
    });

    it('expires when remaining reaches zero after tick', () => {
      const unit = makeUnit();
      const effect = new StatusEffect('slow', 1);

      effect.tick(unit as unknown as import('./Unit').Unit);

      expect(effect.getRemaining()).toBe(0);
      expect(effect.isActive()).toBe(false);
    });

    it('does nothing when already expired', () => {
      const unit = makeUnit();
      const effect = new StatusEffect('poison', 1, 2);

      effect.tick(unit as unknown as import('./Unit').Unit);
      expect(effect.isActive()).toBe(false);

      unit.stats.hp = 100;
      effect.tick(unit as unknown as import('./Unit').Unit);

      expect(unit.applyStatusDamage).toHaveBeenCalledTimes(1);
      expect(unit.stats.hp).toBe(100);
    });
  });

  describe('stat modifiers', () => {
    it('modifies speed for slow', () => {
      const effect = new StatusEffect('slow', 2, 2);

      expect(effect.modifySpeed(10)).toBe(6);
    });

    it('clamps speed to minimum 1', () => {
      const effect = new StatusEffect('slow', 2, 10);

      expect(effect.modifySpeed(10)).toBe(1);
    });

    it('does not modify speed for non-slow effects', () => {
      const effect = new StatusEffect('root', 2);

      expect(effect.modifySpeed(10)).toBe(10);
    });

    it('modifies defense for vulnerable', () => {
      const effect = new StatusEffect('vulnerable', 2, 2);

      expect(effect.modifyDefense(10)).toBe(4);
    });

    it('clamps defense to minimum 0', () => {
      const effect = new StatusEffect('vulnerable', 2, 10);

      expect(effect.modifyDefense(10)).toBe(0);
    });

    it('increases defense for shield', () => {
      const effect = new StatusEffect('shield', 2, 2);

      expect(effect.modifyDefense(10)).toBe(20);
    });

    it('does not modify defense for other effects', () => {
      const effect = new StatusEffect('poison', 2);

      expect(effect.modifyDefense(10)).toBe(10);
    });
  });

  describe('movement and action restrictions', () => {
    it('prevents movement for root', () => {
      const effect = new StatusEffect('root', 2);

      expect(effect.canMove()).toBe(false);
      expect(effect.canAct()).toBe(true);
    });

    it('prevents movement and action for stun', () => {
      const effect = new StatusEffect('stun', 2);

      expect(effect.canMove()).toBe(false);
      expect(effect.canAct()).toBe(false);
    });

    it('allows movement and action for other effects', () => {
      const effect = new StatusEffect('slow', 2);

      expect(effect.canMove()).toBe(true);
      expect(effect.canAct()).toBe(true);
    });
  });

  describe('damage adjustments', () => {
    it('increases incoming damage for vulnerable', () => {
      const effect = new StatusEffect('vulnerable', 2, 1);

      expect(effect.adjustIncomingDamage(10)).toBe(15);
    });

    it('rounds vulnerable damage adjustment', () => {
      const effect = new StatusEffect('vulnerable', 2, 1);

      expect(effect.adjustIncomingDamage(11)).toBe(17);
    });

    it('does not adjust damage for non-vulnerable effects', () => {
      const effect = new StatusEffect('slow', 2);

      expect(effect.adjustIncomingDamage(10)).toBe(10);
    });

    it('absorbs damage with shield', () => {
      const effect = new StatusEffect('shield', 2, 2);

      expect(effect.absorbIncomingDamage(5)).toBe(0);
      expect(effect.getMagnitude()).toBe(1);
    });

    it('partially absorbs damage when shield is weaker', () => {
      const effect = new StatusEffect('shield', 2, 1);

      expect(effect.absorbIncomingDamage(8)).toBe(3);
      expect(effect.getMagnitude()).toBe(0);
    });

    it('does not absorb when shield magnitude is zero', () => {
      const effect = new StatusEffect('shield', 2, 0);

      expect(effect.absorbIncomingDamage(5)).toBe(5);
    });

    it('does not absorb for non-positive damage', () => {
      const effect = new StatusEffect('shield', 2, 2);

      expect(effect.absorbIncomingDamage(0)).toBe(0);
      expect(effect.absorbIncomingDamage(-5)).toBe(-5);
    });

    it('does not absorb for non-shield effects', () => {
      const effect = new StatusEffect('slow', 2);

      expect(effect.absorbIncomingDamage(10)).toBe(10);
    });
  });

  describe('getSummary', () => {
    it('returns correct summary for slow', () => {
      const effect = new StatusEffect('slow', 3, 1);

      expect(effect.getSummary()).toBe('迟缓 3回合');
    });

    it('returns correct summary for poison with damage', () => {
      const effect = new StatusEffect('poison', 2, 3);

      expect(effect.getSummary()).toBe('中毒 2回合(每回合15)');
    });

    it('returns correct summary for shield with absorption', () => {
      const effect = new StatusEffect('shield', 2, 2);

      expect(effect.getSummary()).toBe('护盾 2回合(吸收10)');
    });

    it('returns correct summary for root', () => {
      const effect = new StatusEffect('root', 1);

      expect(effect.getSummary()).toBe('定身 1回合');
    });
  });

  describe('multiple effects stacking', () => {
    it('applies multiple independent effects', () => {
      const slow = new StatusEffect('slow', 3, 1);
      const poison = new StatusEffect('poison', 2, 2);

      expect(slow.modifySpeed(10)).toBe(8);
      expect(poison.modifySpeed(10)).toBe(10);
    });

    it('stacks speed reductions', () => {
      const slow1 = new StatusEffect('slow', 3, 1);
      const slow2 = new StatusEffect('slow', 2, 2);

      let speed = 10;
      speed = slow1.modifySpeed(speed);
      speed = slow2.modifySpeed(speed);

      expect(speed).toBe(4);
    });

    it('stacks defense modifications', () => {
      const vulnerable = new StatusEffect('vulnerable', 2, 1);
      const shield = new StatusEffect('shield', 2, 1);

      let defense = 10;
      defense = vulnerable.modifyDefense(defense);
      defense = shield.modifyDefense(defense);

      expect(defense).toBe(12);
    });

    it('chains damage adjustments', () => {
      const vulnerable = new StatusEffect('vulnerable', 2, 1);
      const shield = new StatusEffect('shield', 2, 1);

      let damage = 10;
      damage = vulnerable.adjustIncomingDamage(damage);
      damage = shield.absorbIncomingDamage(damage);

      expect(damage).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('handles zero duration', () => {
      const effect = new StatusEffect('slow', 0);

      expect(effect.isActive()).toBe(false);
      effect.tick(makeUnit() as unknown as import('./Unit').Unit);
      expect(effect.getRemaining()).toBe(0);
    });

    it('handles negative magnitude for speed (increases speed)', () => {
      const effect = new StatusEffect('slow', 2, -5);

      expect(effect.modifySpeed(10)).toBe(20);
    });

    it('handles negative magnitude for defense (increases defense)', () => {
      const effect = new StatusEffect('vulnerable', 2, -5);

      expect(effect.modifyDefense(10)).toBe(25);
    });

    it('preserves duration after ticks', () => {
      const effect = new StatusEffect('poison', 3, 1);

      effect.tick(makeUnit() as unknown as import('./Unit').Unit);
      effect.tick(makeUnit() as unknown as import('./Unit').Unit);

      expect(effect.getDuration()).toBe(3);
    });

    it('getRemaining returns exact value including zero', () => {
      const effect = new StatusEffect('slow', 1);

      expect(effect.getRemaining()).toBe(1);
      effect.tick(makeUnit() as unknown as import('./Unit').Unit);
      expect(effect.getRemaining()).toBe(0);
    });
  });
});
