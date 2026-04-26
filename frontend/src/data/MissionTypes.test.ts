import { describe, expect, it } from 'vitest';
import type { Mission, Reward, UnlockCondition, RunProgress, SquadState } from './MissionTypes';
import missionsJson from './missions.json';

function assertMission(m: unknown): asserts m is Mission {
  if (typeof m !== 'object' || m === null) {
    throw new Error('Expected mission object');
  }
  const mission = m as Record<string, unknown>;
  expect(typeof mission.id).toBe('string');
  expect(typeof mission.name).toBe('string');
  expect(typeof mission.description).toBe('string');
  expect(['easy', 'normal', 'hard']).toContain(mission.difficulty);
  expect(Array.isArray(mission.rewards)).toBe(true);
  expect(typeof mission.extractionTurn).toBe('number');
  expect(typeof mission.mapId).toBe('string');

  if (mission.unlockCondition !== undefined) {
    expect(['mission_complete', 'level_reach']).toContain(
      (mission.unlockCondition as Record<string, unknown>).type
    );
    expect(typeof (mission.unlockCondition as Record<string, unknown>).targetId).toBe('string');
    expect(typeof (mission.unlockCondition as Record<string, unknown>).targetValue).toBe('number');
  }

  for (const r of mission.rewards as unknown[]) {
    const reward = r as Record<string, unknown>;
    expect(['resource', 'experience', 'unlock']).toContain(reward.type);
    expect(typeof reward.itemId).toBe('string');
    expect(typeof reward.amount).toBe('number');
  }
}

describe('Mission data models', () => {
  it('loads exactly three missions from JSON', () => {
    const data = missionsJson as { missions: unknown[] };
    expect(data.missions).toHaveLength(3);
  });

  it('validates grassland-patrol mission structure', () => {
    const data = missionsJson as { missions: unknown[] };
    const mission = data.missions.find(m => (m as Record<string, unknown>).id === 'grassland-patrol');
    expect(mission).toBeDefined();
    assertMission(mission);
    const m = mission as Mission;
    expect(m.difficulty).toBe('easy');
    expect(m.extractionTurn).toBe(3);
    expect(m.mapId).toBe('grassland-01');
    expect(m.unlockCondition).toBeUndefined();
    expect(m.rewards).toHaveLength(2);
  });

  it('validates mountain-assault mission structure', () => {
    const data = missionsJson as { missions: unknown[] };
    const mission = data.missions.find(m => (m as Record<string, unknown>).id === 'mountain-assault');
    expect(mission).toBeDefined();
    assertMission(mission);
    const m = mission as Mission;
    expect(m.difficulty).toBe('normal');
    expect(m.extractionTurn).toBe(5);
    expect(m.mapId).toBe('mountain-01');
    expect(m.unlockCondition).toBeDefined();
    expect(m.unlockCondition!.type).toBe('mission_complete');
    expect(m.unlockCondition!.targetId).toBe('grassland-patrol');
    expect(m.unlockCondition!.targetValue).toBe(1);
    expect(m.rewards).toHaveLength(3);
  });

  it('validates urban-siege mission structure', () => {
    const data = missionsJson as { missions: unknown[] };
    const mission = data.missions.find(m => (m as Record<string, unknown>).id === 'urban-siege');
    expect(mission).toBeDefined();
    assertMission(mission);
    const m = mission as Mission;
    expect(m.difficulty).toBe('hard');
    expect(m.extractionTurn).toBe(7);
    expect(m.mapId).toBe('urban-01');
    expect(m.unlockCondition).toBeDefined();
    expect(m.unlockCondition!.type).toBe('mission_complete');
    expect(m.unlockCondition!.targetId).toBe('mountain-assault');
    expect(m.unlockCondition!.targetValue).toBe(1);
    expect(m.rewards).toHaveLength(3);
  });

  it('has correct difficulty ordering across missions', () => {
    const data = missionsJson as { missions: Mission[] };
    const difficulties = data.missions.map(m => m.difficulty);
    expect(difficulties).toEqual(['easy', 'normal', 'hard']);
  });

  it('has increasing extractionTurn values', () => {
    const data = missionsJson as { missions: Mission[] };
    const turns = data.missions.map(m => m.extractionTurn);
    expect(turns).toEqual([3, 5, 7]);
    for (let i = 1; i < turns.length; i++) {
      expect(turns[i]).toBeGreaterThan(turns[i - 1]);
    }
  });

  it('rewards increase with difficulty', () => {
    const data = missionsJson as { missions: Mission[] };
    const creditRewards = data.missions.map(m => {
      const credit = m.rewards.find(r => r.itemId === 'credits');
      return credit ? credit.amount : 0;
    });
    expect(creditRewards).toEqual([100, 250, 500]);
    for (let i = 1; i < creditRewards.length; i++) {
      expect(creditRewards[i]).toBeGreaterThan(creditRewards[i - 1]);
    }
  });

  it('supports constructing a valid RunProgress object', () => {
    const progress: RunProgress = {
      missionId: 'grassland-patrol',
      currentTurn: 2,
      extractionAvailable: false,
      squadStates: [
        {
          unitId: 'unit-1',
          chassisId: 'vanguard',
          currentHp: 80,
          maxHp: 100,
          modules: ['module_a', 'module_b'],
        },
      ],
      collectedRewards: [],
      chassisUnlocked: [],
      modulesUnlocked: [],
    };

    expect(progress.missionId).toBe('grassland-patrol');
    expect(progress.currentTurn).toBe(2);
    expect(progress.extractionAvailable).toBe(false);
    expect(progress.squadStates).toHaveLength(1);
    expect(progress.squadStates[0].currentHp).toBe(80);
    expect(progress.squadStates[0].maxHp).toBe(100);
    expect(progress.squadStates[0].modules).toEqual(['module_a', 'module_b']);
  });

  it('marks extractionAvailable true when currentTurn >= extractionTurn', () => {
    const data = missionsJson as { missions: Mission[] };
    const mission = data.missions[0];
    const progress: RunProgress = {
      missionId: mission.id,
      currentTurn: mission.extractionTurn,
      extractionAvailable: true,
      squadStates: [],
      collectedRewards: [],
      chassisUnlocked: [],
      modulesUnlocked: [],
    };
    expect(progress.extractionAvailable).toBe(true);
    expect(progress.currentTurn).toBeGreaterThanOrEqual(mission.extractionTurn);
  });

  it('validates Reward type discriminant', () => {
    const resourceReward: Reward = { type: 'resource', itemId: 'credits', amount: 100 };
    const xpReward: Reward = { type: 'experience', itemId: 'squad_xp', amount: 50 };
    const unlockReward: Reward = { type: 'unlock', itemId: 'chassis_x', amount: 1 };

    expect(resourceReward.type).toBe('resource');
    expect(xpReward.type).toBe('experience');
    expect(unlockReward.type).toBe('unlock');
  });

  it('validates UnlockCondition type discriminant', () => {
    const missionCond: UnlockCondition = {
      type: 'mission_complete',
      targetId: 'grassland-patrol',
      targetValue: 1,
    };
    const levelCond: UnlockCondition = {
      type: 'level_reach',
      targetId: 'player_level',
      targetValue: 5,
    };

    expect(missionCond.type).toBe('mission_complete');
    expect(levelCond.type).toBe('level_reach');
  });

  it('validates SquadState structure', () => {
    const state: SquadState = {
      unitId: 'u1',
      chassisId: 'skirmisher',
      currentHp: 45,
      maxHp: 90,
      modules: ['m1'],
    };

    expect(state.unitId).toBe('u1');
    expect(state.chassisId).toBe('skirmisher');
    expect(state.currentHp).toBeLessThanOrEqual(state.maxHp);
    expect(Array.isArray(state.modules)).toBe(true);
  });
});
