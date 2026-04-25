import { describe, expect, it } from 'vitest';
import { resolveActorProfile } from './ActorProfileResolver';
import type { BotBattleState, BotUnitSnapshot } from './BotTurnPlanner';

const makeUnit = (overrides: Partial<BotUnitSnapshot> = {}): BotUnitSnapshot => ({
  id: 'bot-1',
  role: 'squad',
  chassis: 'skirmisher',
  squad: 1,
  tileX: 8,
  tileY: 5,
  hp: 90,
  maxHp: 90,
  attack: 12,
  facing: 'west',
  canMove: true,
  canAct: true,
  canUseTool: true,
  move: 4,
  jump: 1,
  activeModules: [],
  comboModules: [],
  toolModules: [],
  ...overrides,
});

const makeState = (overrides: Partial<BotBattleState> = {}): BotBattleState => ({
  actorId: 'bot-1',
  squadId: 1,
  turnNumber: 1,
  units: [makeUnit()],
  reachableTiles: [],
  objectiveTiles: [],
  mission: null,
  hasLineOfSight: () => true,
  getHeightDifference: () => 0,
  ...overrides,
});

describe('resolveActorProfile', () => {
  it('selects coop_squad for the cooperative boss mission', () => {
    const profile = resolveActorProfile(makeState({
      mission: {
        id: 'coop_boss_kill',
        isRevealed: true,
        bossUnitId: 'boss-1',
        pressureStage: 1,
      },
    }));

    expect(profile.id).toBe('coop_squad');
  });

  it('selects aggressive_rival for relic contest runs', () => {
    const profile = resolveActorProfile(makeState({
      mission: {
        id: 'relic_contest',
        isRevealed: true,
        relicHolderUnitId: 'unit-a1',
        extractionUnlocked: true,
        pressureStage: 0,
      },
    }));

    expect(profile.id).toBe('aggressive_rival');
  });

  it('switches from coop_squad to reversal_squad when the mission enters reversal', () => {
    const before = resolveActorProfile(makeState({
      mission: {
        id: 'coop_then_reversal',
        isRevealed: true,
        isReversalPhase: false,
        extractionUnlocked: false,
        pressureStage: 0,
      },
    }));
    const after = resolveActorProfile(makeState({
      mission: {
        id: 'coop_then_reversal',
        isRevealed: true,
        isReversalPhase: true,
        extractionUnlocked: true,
        pressureStage: 0,
      },
    }));

    expect(before.id).toBe('coop_squad');
    expect(after.id).toBe('reversal_squad');
  });

  it('routes boss actors to the shared boss profile layer', () => {
    const profile = resolveActorProfile(makeState({
      actorId: 'boss-1',
      squadId: 2,
      units: [makeUnit({ id: 'boss-1', role: 'boss', squad: 2, chassis: 'vanguard', hp: 260, maxHp: 260 })],
      mission: {
        id: 'coop_boss_kill',
        isRevealed: true,
        bossUnitId: 'boss-1',
        extractionUnlocked: false,
        pressureStage: 3,
      },
    }));

    expect(profile.id).toBe('boss_guardian');
  });
});
