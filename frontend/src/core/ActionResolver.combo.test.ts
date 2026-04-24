import { describe, expect, it } from 'vitest';
import { ActionResolver } from './ActionResolver';
import type { ModuleDefinition } from '../data/ModuleTypes';

const makeUnitState = (overrides: Partial<Parameters<typeof ActionResolver.getPrimaryActionOptions>[0]> = {}) => ({
  id: 'unit-a',
  squad: 0,
  tileX: 1,
  tileY: 1,
  attack: 10,
  canAct: true,
  canUseTool: true,
  activeModules: [],
  comboModules: [],
  toolModules: [],
  ...overrides,
});

const makeTargetState = (overrides: Partial<Parameters<typeof ActionResolver.getPrimaryActionOptions>[1][number]> = {}) => ({
  id: 'unit-b',
  squad: 1,
  tileX: 2,
  tileY: 1,
  hp: 20,
  maxHp: 20,
  ...overrides,
});

const teamStrike: ModuleDefinition = {
  id: 'team_strike',
  name: 'Team Strike',
  category: 'combo',
  description: 'Squad combo attack',
  comboCost: 2,
  targeting: {
    range: 1,
    shape: 'single',
    lineOfSight: false,
  },
  participationRules: {
    maxAllies: 2,
    range: 3,
    lineOfSight: true,
  },
  effects: [{ type: 'damage', power: 1.2, perParticipant: true }],
};

describe('ActionResolver combo initiation', () => {
  it('offers combo initiation targets only when squad resource can pay the combo cost', () => {
    const actions = ActionResolver.getComboInitiationOptions(
      makeUnitState({ comboModules: [teamStrike] }),
      [makeTargetState()],
      2
    );

    expect(actions).toEqual([
      {
        type: 'combo',
        label: 'Team Strike',
        targetId: 'unit-b',
        moduleId: 'team_strike',
        comboCost: 2,
      },
    ]);
  });

  it('denies combo initiation when squad resource is insufficient', () => {
    const result = ActionResolver.resolveComboInitiation(
      makeUnitState({ comboModules: [teamStrike] }),
      makeTargetState(),
      teamStrike,
      1,
      []
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('连携值不足');
  });

  it('returns combo cost spending details for an initiator-only combo start when no allies are eligible', () => {
    const result = ActionResolver.resolveComboInitiation(
      makeUnitState({ comboModules: [teamStrike] }),
      makeTargetState(),
      teamStrike,
      3,
      [],
      {
        calculateDamage: (_actor, _target, baseDamage) => Math.round(baseDamage),
      }
    );

    expect(result.success).toBe(true);
    expect(result.consumesPrimaryAction).toBe(true);
    expect(result.comboCostSpent).toBe(2);
    expect(result.remainingComboResource).toBe(1);
    expect(result.participantCount).toBe(1);
    expect(result.summary).toContain('无队友符合条件');
  });
});

describe('ActionResolver combo participation eligibility', () => {
  it('includes allies who are in range, have LOS, and equipped combo modules', () => {
    const actor = makeUnitState({ id: 'actor', comboModules: [teamStrike] });
    const target = makeTargetState();
    const ally = makeUnitState({
      id: 'ally-1',
      squad: 0,
      tileX: 2,
      tileY: 2,
      comboModules: [teamStrike],
    });

    const eligible = ActionResolver.getEligibleComboParticipants(actor, target, [ally], teamStrike, {
      hasLineOfSight: () => true,
    });

    expect(eligible).toHaveLength(1);
    expect(eligible[0].id).toBe('ally-1');
  });

  it('excludes allies from a different squad', () => {
    const actor = makeUnitState({ id: 'actor', comboModules: [teamStrike] });
    const target = makeTargetState();
    const enemyAlly = makeUnitState({
      id: 'enemy-ally',
      squad: 1,
      tileX: 2,
      tileY: 2,
      comboModules: [teamStrike],
    });

    const eligible = ActionResolver.getEligibleComboParticipants(actor, target, [enemyAlly], teamStrike, {
      hasLineOfSight: () => true,
    });

    expect(eligible).toHaveLength(0);
  });

  it('excludes allies who cannot act', () => {
    const actor = makeUnitState({ id: 'actor', comboModules: [teamStrike] });
    const target = makeTargetState();
    const stunnedAlly = makeUnitState({
      id: 'stunned-ally',
      squad: 0,
      tileX: 2,
      tileY: 2,
      canAct: false,
      comboModules: [teamStrike],
    });

    const eligible = ActionResolver.getEligibleComboParticipants(actor, target, [stunnedAlly], teamStrike, {
      hasLineOfSight: () => true,
    });

    expect(eligible).toHaveLength(0);
  });

  it('excludes allies without combo modules', () => {
    const actor = makeUnitState({ id: 'actor', comboModules: [teamStrike] });
    const target = makeTargetState();
    const noComboAlly = makeUnitState({
      id: 'no-combo-ally',
      squad: 0,
      tileX: 2,
      tileY: 2,
      comboModules: [],
    });

    const eligible = ActionResolver.getEligibleComboParticipants(actor, target, [noComboAlly], teamStrike, {
      hasLineOfSight: () => true,
    });

    expect(eligible).toHaveLength(0);
  });

  it('excludes allies outside participation range', () => {
    const actor = makeUnitState({ id: 'actor', comboModules: [teamStrike] });
    const target = makeTargetState();
    const farAlly = makeUnitState({
      id: 'far-ally',
      squad: 0,
      tileX: 10,
      tileY: 10,
      comboModules: [teamStrike],
    });

    const eligible = ActionResolver.getEligibleComboParticipants(actor, target, [farAlly], teamStrike, {
      hasLineOfSight: () => true,
    });

    expect(eligible).toHaveLength(0);
  });

  it('excludes allies without line of sight to target when required', () => {
    const actor = makeUnitState({ id: 'actor', comboModules: [teamStrike] });
    const target = makeTargetState();
    const blockedAlly = makeUnitState({
      id: 'blocked-ally',
      squad: 0,
      tileX: 2,
      tileY: 2,
      comboModules: [teamStrike],
    });

    const eligible = ActionResolver.getEligibleComboParticipants(actor, target, [blockedAlly], teamStrike, {
      hasLineOfSight: () => false,
    });

    expect(eligible).toHaveLength(0);
  });

  it('respects maxAllies limit', () => {
    const actor = makeUnitState({ id: 'actor', comboModules: [teamStrike] });
    const target = makeTargetState();
    const allies = [
      makeUnitState({ id: 'ally-1', squad: 0, tileX: 2, tileY: 1, comboModules: [teamStrike] }),
      makeUnitState({ id: 'ally-2', squad: 0, tileX: 1, tileY: 2, comboModules: [teamStrike] }),
      makeUnitState({ id: 'ally-3', squad: 0, tileX: 2, tileY: 2, comboModules: [teamStrike] }),
    ];

    const eligible = ActionResolver.getEligibleComboParticipants(actor, target, allies, teamStrike, {
      hasLineOfSight: () => true,
    });

    expect(eligible).toHaveLength(2);
  });

  it('calculates total damage from all participants with perParticipant effects', () => {
    const actor = makeUnitState({ id: 'actor', attack: 10, comboModules: [teamStrike] });
    const target = makeTargetState();
    const ally = makeUnitState({
      id: 'ally-1',
      squad: 0,
      tileX: 2,
      tileY: 2,
      attack: 8,
      comboModules: [teamStrike],
    });

    const result = ActionResolver.resolveComboInitiation(
      actor,
      target,
      teamStrike,
      3,
      [ally],
      {
        hasLineOfSight: () => true,
        calculateDamage: (_actor, _target, baseDamage) => Math.round(baseDamage),
      }
    );

    expect(result.success).toBe(true);
    expect(result.participantCount).toBe(2);
    expect(result.appliedDamage).toBe(22); // 10*1.2 + 8*1.2 = 12 + 9.6 = 21.6 -> 22
    expect(result.summary).toContain('2人参与');
    expect(result.summary).toContain('actor');
    expect(result.summary).toContain('ally-1');
  });

  it('falls back to initiator-only when no allies are eligible', () => {
    const actor = makeUnitState({ id: 'actor', attack: 10, comboModules: [teamStrike] });
    const target = makeTargetState();

    const result = ActionResolver.resolveComboInitiation(
      actor,
      target,
      teamStrike,
      3,
      [],
      {
        calculateDamage: (_actor, _target, baseDamage) => Math.round(baseDamage),
      }
    );

    expect(result.success).toBe(true);
    expect(result.participantCount).toBe(1);
    expect(result.appliedDamage).toBe(12); // 10*1.2 = 12
    expect(result.summary).toContain('无队友符合条件');
  });
});
