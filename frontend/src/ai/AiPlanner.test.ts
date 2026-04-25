import { describe, expect, it } from 'vitest';
import type { ActionOption } from '../core/ActionResolver';
import { AiPlanner } from './AiPlanner';
import { AiProfiles } from './AiProfiles';
import type { ActionCandidate } from './ActionCandidate';
import type { DecisionContext } from './DecisionContext';

const makeContext = (overrides: Partial<DecisionContext> = {}): DecisionContext => ({
  actorId: 'unit-bot-1',
  squadId: 1,
  profileId: 'coop_squad',
  turnNumber: 3,
  ...overrides,
});

const makeAction = (overrides: Partial<ActionOption> = {}): ActionOption => ({
  type: 'basic-attack',
  label: 'Basic Attack',
  targetId: 'target-1',
  ...overrides,
});

const makeCandidate = (overrides: Partial<ActionCandidate<ActionOption>> = {}): ActionCandidate<ActionOption> => ({
  id: 'candidate-1',
  action: makeAction(),
  legal: true,
  summary: 'Attack the closest threat',
  scores: {
    objective: 0,
    support: 0,
    threat: 0,
    position: 0,
    escape: 0,
    survival: 0,
  },
  ...overrides,
});

describe('AiPlanner', () => {
  it('aggregates weighted scores and exposes a reviewable breakdown', () => {
    const decision = AiPlanner.chooseAction(makeContext(), [
      makeCandidate({
        id: 'attack-boss',
        summary: 'Focus fire on the mission target',
        scores: {
          objective: 4,
          threat: 1,
          survival: 1,
        },
      }),
      makeCandidate({
        id: 'fallback-reposition',
        action: makeAction({ type: 'tool', label: 'Smoke', moduleId: 'smoke' }),
        summary: 'Use smoke to reposition',
        scores: {
          objective: 1,
          position: 2,
          survival: 2,
          escape: 1,
        },
      }),
    ], AiProfiles.coop_squad);

    expect(decision).not.toBeNull();
    expect(decision?.candidate.id).toBe('attack-boss');
    expect(decision?.totalScore).toBe(12.5);
    expect(decision?.breakdown).toEqual({
      objective: 8,
      support: 0,
      threat: 1.5,
      position: 0,
      escape: 0,
      survival: 3,
    });
    expect(decision?.explanation).toContain('objective: 4 × 2 = 8');
    expect(decision?.explanation).toContain('survival: 1 × 3 = 3');
  });

  it('breaks ties deterministically using tie-break keys and candidate ids', () => {
    const tiedDecision = AiPlanner.chooseAction(makeContext({ profileId: 'test-profile' }), [
      makeCandidate({
        id: 'zeta-attack',
        tieBreaker: '02-zeta',
        scores: {
          objective: 3,
          threat: 1,
        },
      }),
      makeCandidate({
        id: 'alpha-attack',
        tieBreaker: '01-alpha',
        scores: {
          objective: 3,
          threat: 1,
        },
      }),
    ], {
      id: 'test-profile',
      description: 'Tie-break validation profile',
      weights: {
        objective: 1,
        support: 0,
        threat: 1,
        position: 0,
        escape: 0,
        survival: 0,
      },
    });

    expect(tiedDecision).not.toBeNull();
    expect(tiedDecision?.candidate.id).toBe('alpha-attack');
    expect(tiedDecision?.totalScore).toBe(4);

    const idFallbackDecision = AiPlanner.chooseAction(makeContext({ profileId: 'test-profile' }), [
      makeCandidate({
        id: 'beta-attack',
        scores: {
          objective: 3,
          threat: 1,
        },
      }),
      makeCandidate({
        id: 'alpha-attack-no-tiebreak',
        scores: {
          objective: 3,
          threat: 1,
        },
      }),
    ], {
      id: 'test-profile',
      description: 'Tie-break validation profile',
      weights: {
        objective: 1,
        support: 0,
        threat: 1,
        position: 0,
        escape: 0,
        survival: 0,
      },
    });

    expect(idFallbackDecision).not.toBeNull();
    expect(idFallbackDecision?.candidate.id).toBe('alpha-attack-no-tiebreak');

    const duplicateTieBreakerDecision = AiPlanner.chooseAction(makeContext({ profileId: 'test-profile' }), [
      makeCandidate({
        id: 'beta-id-fallback',
        tieBreaker: 'shared-slot',
        scores: {
          objective: 3,
          threat: 1,
        },
      }),
      makeCandidate({
        id: 'alpha-id-fallback',
        tieBreaker: 'shared-slot',
        scores: {
          objective: 3,
          threat: 1,
        },
      }),
    ], {
      id: 'test-profile',
      description: 'Tie-break validation profile',
      weights: {
        objective: 1,
        support: 0,
        threat: 1,
        position: 0,
        escape: 0,
        survival: 0,
      },
    });

    expect(duplicateTieBreakerDecision).not.toBeNull();
    expect(duplicateTieBreakerDecision?.candidate.id).toBe('alpha-id-fallback');
  });

  it('returns null when every candidate is illegal', () => {
    const decision = AiPlanner.chooseAction(makeContext(), [
      makeCandidate({
        id: 'illegal-move',
        legal: false,
        scores: {
          objective: 5,
        },
      }),
      makeCandidate({
        id: 'illegal-attack',
        legal: false,
        scores: {
          threat: 5,
        },
      }),
    ], AiProfiles.coop_squad);

    expect(decision).toBeNull();
  });

  it('throws when context and profile ids disagree', () => {
    expect(() => {
      AiPlanner.chooseAction(makeContext({ profileId: 'coop_squad' }), [makeCandidate()], AiProfiles.aggressive_rival);
    }).toThrow('DecisionContext profileId "coop_squad" does not match planner profile "aggressive_rival".');
  });

  it('filters illegal candidates before choosing the best action', () => {
    const decision = AiPlanner.chooseAction(makeContext({ profileId: 'aggressive_rival' }), [
      makeCandidate({
        id: 'illegal-finisher',
        legal: false,
        summary: 'This would break range or action limits',
        scores: {
          objective: 10,
          threat: 10,
          survival: 10,
        },
      }),
      makeCandidate({
        id: 'legal-advance',
        summary: 'Advance while staying inside legal limits',
        scores: {
          objective: 2,
          position: 1,
          survival: 1,
        },
      }),
    ], AiProfiles.aggressive_rival);

    expect(decision).not.toBeNull();
    expect(decision?.candidate.id).toBe('legal-advance');
    expect(decision?.excludedCandidateIds).toEqual(['illegal-finisher']);
    expect(decision?.evaluatedCandidateIds).toEqual(['legal-advance']);
  });
});
