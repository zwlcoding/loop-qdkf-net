import { describe, it, expect } from 'vitest';
import {
  createRiftRunState,
  recordBattle,
  recordModuleCollected,
  abandonRun,
  calculateRunReward,
  type RiftRunState,
} from './RiftRunManager';
import type { RiftMap, ModuleDefinition } from './RiftMap';

function makeMap(): RiftMap {
  return {
    rooms: [
      { id: 'room-0-0', layer: 0, type: 'battle', visited: false, connections: ['room-1-0'] },
      { id: 'room-1-0', layer: 1, type: 'battle', visited: false, connections: [] },
    ],
    currentLayer: 0,
    currentRoomId: 'room-0-0',
  };
}

const mockModule: ModuleDefinition = {
  id: 'mod_test',
  name: 'Test Module',
  category: 'active',
  rarity: 'common',
  description: 'A test module.',
  effects: [],
};

describe('createRiftRunState', () => {
  it('initializes with zeroed stats and empty modules', () => {
    const map = makeMap();
    const state = createRiftRunState(map);

    expect(state.riftMap).toBe(map);
    expect(state.active).toBe(true);
    expect(state.gold).toBe(0);
    expect(state.playerModules).toEqual([]);
    expect(state.stats).toEqual({
      roomsCleared: 0,
      enemiesDefeated: 0,
      damageDealt: 0,
      damageTaken: 0,
      modulesCollected: 0,
      goldEarned: 0,
      layersCompleted: 0,
    });
  });
});

describe('recordBattle', () => {
  it('increments roomsCleared, enemiesDefeated, damageDealt, damageTaken, and goldEarned', () => {
    const state = createRiftRunState(makeMap());
    const next = recordBattle(state, {
      enemiesKilled: 3,
      damageDealt: 100,
      damageTaken: 25,
      goldReward: 50,
    });

    expect(next.stats.roomsCleared).toBe(1);
    expect(next.stats.enemiesDefeated).toBe(3);
    expect(next.stats.damageDealt).toBe(100);
    expect(next.stats.damageTaken).toBe(25);
    expect(next.stats.goldEarned).toBe(50);
    expect(next.gold).toBe(50);
    expect(next.active).toBe(true);
  });

  it('accumulates multiple battle results', () => {
    let state = createRiftRunState(makeMap());
    state = recordBattle(state, { enemiesKilled: 2, damageDealt: 50, damageTaken: 10, goldReward: 20 });
    state = recordBattle(state, { enemiesKilled: 1, damageDealt: 30, damageTaken: 5, goldReward: 15 });

    expect(state.stats.roomsCleared).toBe(2);
    expect(state.stats.enemiesDefeated).toBe(3);
    expect(state.stats.damageDealt).toBe(80);
    expect(state.stats.damageTaken).toBe(15);
    expect(state.stats.goldEarned).toBe(35);
    expect(state.gold).toBe(35);
  });

  it('does nothing when state is not active', () => {
    const state: RiftRunState = {
      ...createRiftRunState(makeMap()),
      active: false,
    };
    const next = recordBattle(state, {
      enemiesKilled: 5,
      damageDealt: 200,
      damageTaken: 50,
      goldReward: 100,
    });

    expect(next).toEqual(state);
  });
});

describe('recordModuleCollected', () => {
  it('increments modulesCollected', () => {
    const state = createRiftRunState(makeMap());
    const next = recordModuleCollected(state);

    expect(next.stats.modulesCollected).toBe(1);
    expect(next.active).toBe(true);
  });

  it('accumulates multiple module collections', () => {
    let state = createRiftRunState(makeMap());
    state = recordModuleCollected(state);
    state = recordModuleCollected(state);
    state = recordModuleCollected(state);

    expect(state.stats.modulesCollected).toBe(3);
  });

  it('does nothing when state is not active', () => {
    const state: RiftRunState = {
      ...createRiftRunState(makeMap()),
      active: false,
      stats: { ...createRiftRunState(makeMap()).stats, modulesCollected: 2 },
    };
    const next = recordModuleCollected(state);

    expect(next).toEqual(state);
  });
});

describe('abandonRun', () => {
  it('returns shards based on current stats and deactivates state', () => {
    let state = createRiftRunState(makeMap());
    state = recordBattle(state, { enemiesKilled: 4, damageDealt: 100, damageTaken: 20, goldReward: 40 });
    state = recordModuleCollected(state);
    state = {
      ...state,
      stats: { ...state.stats, layersCompleted: 1 },
    };

    const reward = abandonRun(state);
    // base 10 + rooms 1*5 + enemies 4*2 + layers 1*25 + modules 1*10 = 10+5+8+25+10 = 58
    expect(reward.shards).toBe(58);
  });
});

describe('calculateRunReward', () => {
  it('calculates reward with zero stats', () => {
    const state = createRiftRunState(makeMap());
    const reward = calculateRunReward(state);
    expect(reward.shards).toBe(10);
  });

  it('calculates reward with full stats', () => {
    const state: RiftRunState = {
      ...createRiftRunState(makeMap()),
      stats: {
        roomsCleared: 5,
        enemiesDefeated: 12,
        damageDealt: 500,
        damageTaken: 100,
        modulesCollected: 3,
        goldEarned: 200,
        layersCompleted: 2,
      },
    };
    const reward = calculateRunReward(state);
    // base 10 + rooms 5*5 + enemies 12*2 + layers 2*25 + modules 3*10 = 10+25+24+50+30 = 139
    expect(reward.shards).toBe(139);
  });

  it('does not use gold or damage in shard calculation', () => {
    const state: RiftRunState = {
      ...createRiftRunState(makeMap()),
      stats: {
        roomsCleared: 0,
        enemiesDefeated: 0,
        damageDealt: 9999,
        damageTaken: 9999,
        modulesCollected: 0,
        goldEarned: 9999,
        layersCompleted: 0,
      },
    };
    const reward = calculateRunReward(state);
    expect(reward.shards).toBe(10);
  });
});
