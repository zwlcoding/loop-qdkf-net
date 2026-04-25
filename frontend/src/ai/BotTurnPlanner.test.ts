import { describe, expect, it } from 'vitest';
import type { ModuleDefinition } from '../data/ModuleTypes';
import { AiProfiles } from './AiProfiles';
import { BotTurnPlanner, type BotBattleState, type BotReachableTile, type BotUnitSnapshot } from './BotTurnPlanner';

const makeReachableTile = (x: number, y: number, path: Array<{ x: number; y: number }>): BotReachableTile => ({ x, y, path });

const strikeModule: ModuleDefinition = {
  id: 'strike-module',
  name: 'Strike Module',
  category: 'active',
  description: 'Simple ranged strike for planner tests.',
  targeting: {
    shape: 'single',
    range: 2,
    lineOfSight: true,
  },
  effects: [
    {
      type: 'damage',
      power: 1.5,
    },
  ],
};

const makeUnit = (overrides: Partial<BotUnitSnapshot> = {}): BotUnitSnapshot => ({
  id: 'unit-bot-1',
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
  move: 3,
  jump: 1,
  activeModules: [strikeModule],
  comboModules: [],
  toolModules: [],
  ...overrides,
});

const makeState = (overrides: Partial<BotBattleState> = {}): BotBattleState => ({
  actorId: 'unit-bot-1',
  squadId: 1,
  turnNumber: 4,
  units: [
    makeUnit(),
    makeUnit({ id: 'enemy-1', squad: 0, tileX: 10, tileY: 5, hp: 80, maxHp: 80, canMove: false, canAct: false }),
  ],
  reachableTiles: [
    makeReachableTile(9, 5, [{ x: 8, y: 5 }, { x: 9, y: 5 }]),
    makeReachableTile(8, 4, [{ x: 8, y: 5 }, { x: 8, y: 4 }]),
    makeReachableTile(8, 6, [{ x: 8, y: 5 }, { x: 8, y: 6 }]),
  ],
  objectiveTiles: [{ x: 13, y: 5 }],
  mission: {
    id: 'coop_boss_kill',
    isRevealed: true,
    bossUnitId: 'boss-1',
    pressureStage: 0,
  },
  hasLineOfSight: () => true,
  getHeightDifference: () => 0,
  ...overrides,
});

describe('BotTurnPlanner', () => {
  it('prefers an immediate legal attack from the current tile when one already exists', () => {
    const decision = BotTurnPlanner.chooseTurn(makeState({
      units: [
        makeUnit({ tileX: 8, tileY: 5, activeModules: [] }),
        makeUnit({ id: 'enemy-1', squad: 0, tileX: 9, tileY: 5, hp: 80, maxHp: 80, canMove: false, canAct: false, activeModules: [] }),
      ],
    }), AiProfiles.coop_squad);

    expect(decision).not.toBeNull();
    expect(decision?.candidate.action.kind).toBe('primary');
    expect(decision?.candidate.action.move).toBeNull();
    expect(decision?.candidate.action.option.type).toBe('basic-attack');
    expect(decision?.candidate.action.option.targetId).toBe('enemy-1');
  });

  it('plans a deterministic move-then-attack sequence when movement unlocks the best legal attack', () => {
    const decision = BotTurnPlanner.chooseTurn(makeState(), AiProfiles.coop_squad);

    expect(decision).not.toBeNull();
    expect(decision?.candidate.action.kind).toBe('primary');
    expect(decision?.candidate.action.move).toEqual({
      x: 9,
      y: 5,
      path: [{ x: 8, y: 5 }, { x: 9, y: 5 }],
    });
    expect(decision?.candidate.action.option.type).toBe('basic-attack');
    expect(decision?.candidate.action.option.targetId).toBe('enemy-1');
  });

  it('falls back to advancing toward the current mission objective when no legal attack exists', () => {
    const decision = BotTurnPlanner.chooseTurn(makeState({
      units: [
        makeUnit({ activeModules: [] }),
        makeUnit({ id: 'enemy-1', squad: 0, tileX: 2, tileY: 2, hp: 80, maxHp: 80, canMove: false, canAct: false, activeModules: [] }),
      ],
      mission: {
        id: 'relic_contest',
        isRevealed: true,
        relicHolderUnitId: null,
        extractionUnlocked: false,
        pressureStage: 0,
      },
      objectiveTiles: [{ x: 13, y: 5 }],
      reachableTiles: [
        makeReachableTile(9, 5, [{ x: 8, y: 5 }, { x: 9, y: 5 }]),
        makeReachableTile(8, 4, [{ x: 8, y: 5 }, { x: 8, y: 4 }]),
      ],
    }), AiProfiles.coop_squad);

    expect(decision).not.toBeNull();
    expect(decision?.candidate.action.kind).toBe('move');
    expect(decision?.candidate.action.move).toEqual({
      x: 9,
      y: 5,
      path: [{ x: 8, y: 5 }, { x: 9, y: 5 }],
    });
    expect(decision?.candidate.action.option).toBeNull();
  });

  it('treats the boss as the only hostile during cooperative boss pressure so the rival squad attacks the boss instead of A squad', () => {
    const decision = BotTurnPlanner.chooseTurn(makeState({
      units: [
        makeUnit({ tileX: 8, tileY: 5, activeModules: [] }),
        makeUnit({ id: 'ally-a1', squad: 0, tileX: 9, tileY: 5, hp: 90, maxHp: 90, canMove: false, canAct: false, activeModules: [] }),
        makeUnit({ id: 'boss-1', role: 'boss', squad: 2, chassis: 'vanguard', tileX: 10, tileY: 5, hp: 240, maxHp: 240, canMove: false, canAct: false }),
      ],
      mission: {
        id: 'coop_boss_kill',
        isRevealed: true,
        bossUnitId: 'boss-1',
        extractionUnlocked: false,
        pressureStage: 2,
      },
    }), AiProfiles.coop_squad);

    expect(decision).not.toBeNull();
    expect(decision?.candidate.action.kind).toBe('primary');
    expect(decision?.candidate.action.option?.targetId).toBe('boss-1');
  });

  it('uses aggressive rival priorities to pressure the relic carrier during the competition flow', () => {
    const decision = BotTurnPlanner.chooseTurn(makeState({
      objectiveTiles: [{ x: 12, y: 5 }],
      units: [
        makeUnit({ tileX: 8, tileY: 5, activeModules: [] }),
        makeUnit({ id: 'carrier-a1', squad: 0, tileX: 10, tileY: 5, hp: 90, maxHp: 90, canMove: false, canAct: false }),
        makeUnit({ id: 'escort-a2', squad: 0, tileX: 9, tileY: 6, hp: 20, maxHp: 90, canMove: false, canAct: false }),
      ],
      mission: {
        id: 'relic_contest',
        isRevealed: true,
        relicHolderUnitId: 'carrier-a1',
        extractionUnlocked: true,
        pressureStage: 1,
      },
    }), AiProfiles.aggressive_rival);

    expect(decision).not.toBeNull();
    expect(decision?.candidate.action.kind).toBe('primary');
    expect(decision?.candidate.action.option?.targetId).toBe('carrier-a1');
  });

  it('switches reversal behavior to attack the former ally once the reversal phase starts', () => {
    const decision = BotTurnPlanner.chooseTurn(makeState({
      units: [
        makeUnit({ tileX: 8, tileY: 5, activeModules: [] }),
        makeUnit({ id: 'ally-a1', squad: 0, tileX: 9, tileY: 5, hp: 70, maxHp: 90, canMove: false, canAct: false, activeModules: [] }),
      ],
      mission: {
        id: 'coop_then_reversal',
        isRevealed: true,
        isReversalPhase: true,
        extractionUnlocked: true,
        pressureStage: 0,
      },
    }), AiProfiles.reversal_squad);

    expect(decision).not.toBeNull();
    expect(decision?.candidate.action.kind).toBe('primary');
    expect(decision?.candidate.action.option?.targetId).toBe('ally-a1');
  });

  it('keeps pre-reversal cooperative behavior non-hostile and advances toward extraction instead of attacking A squad', () => {
    const decision = BotTurnPlanner.chooseTurn(makeState({
      units: [
        makeUnit({ tileX: 8, tileY: 5, activeModules: [] }),
        makeUnit({ id: 'ally-a1', squad: 0, tileX: 9, tileY: 5, hp: 70, maxHp: 90, canMove: false, canAct: false, activeModules: [] }),
      ],
      objectiveTiles: [{ x: 13, y: 5 }],
      mission: {
        id: 'coop_then_reversal',
        isRevealed: true,
        isReversalPhase: false,
        extractionUnlocked: false,
        pressureStage: 0,
      },
    }), AiProfiles.coop_squad);

    expect(decision).not.toBeNull();
    expect(decision?.candidate.action.kind).toBe('move');
    expect(decision?.candidate.action.move?.x).toBe(9);
    expect(decision?.candidate.action.option).toBeNull();
  });

  it('lets the boss use the shared planner to hold the objective space while pressure is active', () => {
    const decision = BotTurnPlanner.chooseTurn(makeState({
      actorId: 'boss-1',
      squadId: 2,
      reachableTiles: [
        makeReachableTile(12, 5, [{ x: 11, y: 5 }, { x: 12, y: 5 }]),
        makeReachableTile(10, 5, [{ x: 11, y: 5 }, { x: 10, y: 5 }]),
      ],
      objectiveTiles: [{ x: 12, y: 5 }],
      units: [
        makeUnit({ id: 'boss-1', role: 'boss', squad: 2, chassis: 'vanguard', tileX: 11, tileY: 5, hp: 260, maxHp: 260, attack: 18, activeModules: [] }),
        makeUnit({ id: 'ally-a1', squad: 0, tileX: 12, tileY: 5, hp: 90, maxHp: 90, canMove: false, canAct: false, activeModules: [] }),
        makeUnit({ id: 'rival-b1', squad: 1, tileX: 13, tileY: 5, hp: 90, maxHp: 90, canMove: false, canAct: false, activeModules: [] }),
      ],
      mission: {
        id: 'coop_boss_kill',
        isRevealed: true,
        bossUnitId: 'boss-1',
        extractionUnlocked: false,
        pressureStage: 3,
      },
    }), AiProfiles.boss_guardian);

    expect(decision).not.toBeNull();
    expect(decision?.candidate.action.kind).toBe('primary');
    expect(decision?.candidate.action.option?.targetId).toBe('ally-a1');
  });

  it('shifts the boss toward survival and late-stage extraction denial when low on hp', () => {
    const decision = BotTurnPlanner.chooseTurn(makeState({
      actorId: 'boss-1',
      squadId: 2,
      reachableTiles: [
        makeReachableTile(10, 5, [{ x: 11, y: 5 }, { x: 10, y: 5 }]),
        makeReachableTile(12, 5, [{ x: 11, y: 5 }, { x: 12, y: 5 }]),
      ],
      objectiveTiles: [{ x: 13, y: 5 }],
      units: [
        makeUnit({ id: 'boss-1', role: 'boss', squad: 2, chassis: 'vanguard', tileX: 11, tileY: 5, hp: 60, maxHp: 260, attack: 18, activeModules: [] }),
        makeUnit({ id: 'ally-a1', squad: 0, tileX: 12, tileY: 5, hp: 90, maxHp: 90, canMove: false, canAct: false, activeModules: [] }),
      ],
      mission: {
        id: 'coop_boss_kill',
        isRevealed: true,
        bossUnitId: 'boss-1',
        extractionUnlocked: true,
        pressureStage: 4,
      },
    }), AiProfiles.boss_guardian);

    expect(decision).not.toBeNull();
    expect(decision?.candidate.action.kind).toBe('move');
    expect(decision?.candidate.action.move?.x).toBe(10);
    expect(decision?.candidate.action.option).toBeNull();
  });
});
