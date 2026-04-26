import type { RiftMap } from './RiftMap';
import type { ModuleDefinition } from '../data/ModuleTypes';

export interface RiftRunStats {
  roomsCleared: number;
  enemiesDefeated: number;
  damageDealt: number;
  damageTaken: number;
  modulesCollected: number;
  goldEarned: number;
  layersCompleted: number;
}

export interface RiftRunState {
  riftMap: RiftMap;
  stats: RiftRunStats;
  gold: number;
  playerModules: ModuleDefinition[];
  active: boolean;
}

export function createRiftRunState(map: RiftMap): RiftRunState {
  return {
    riftMap: map,
    stats: {
      roomsCleared: 0,
      enemiesDefeated: 0,
      damageDealt: 0,
      damageTaken: 0,
      modulesCollected: 0,
      goldEarned: 0,
      layersCompleted: 0,
    },
    gold: 0,
    playerModules: [],
    active: true,
  };
}

export function recordBattle(
  state: RiftRunState,
  result: {
    enemiesKilled: number;
    damageDealt: number;
    damageTaken: number;
    goldReward: number;
  }
): RiftRunState {
  if (!state.active) {
    return state;
  }

  return {
    ...state,
    stats: {
      ...state.stats,
      roomsCleared: state.stats.roomsCleared + 1,
      enemiesDefeated: state.stats.enemiesDefeated + result.enemiesKilled,
      damageDealt: state.stats.damageDealt + result.damageDealt,
      damageTaken: state.stats.damageTaken + result.damageTaken,
      goldEarned: state.stats.goldEarned + result.goldReward,
    },
    gold: state.gold + result.goldReward,
  };
}

export function recordModuleCollected(state: RiftRunState): RiftRunState {
  if (!state.active) {
    return state;
  }

  return {
    ...state,
    stats: {
      ...state.stats,
      modulesCollected: state.stats.modulesCollected + 1,
    },
  };
}

export function abandonRun(state: RiftRunState): { shards: number } {
  const inactiveState: RiftRunState = {
    ...state,
    active: false,
  };

  return calculateRunReward(inactiveState);
}

export function calculateRunReward(state: RiftRunState): { shards: number } {
  const baseShards = 10;
  const roomBonus = state.stats.roomsCleared * 5;
  const enemyBonus = state.stats.enemiesDefeated * 2;
  const layerBonus = state.stats.layersCompleted * 25;
  const moduleBonus = state.stats.modulesCollected * 10;

  const totalShards = baseShards + roomBonus + enemyBonus + layerBonus + moduleBonus;

  return { shards: totalShards };
}
