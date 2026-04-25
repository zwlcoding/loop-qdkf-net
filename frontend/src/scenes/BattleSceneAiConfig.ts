import type { ChassisType } from '../entities/Unit';

export interface BattleSceneBossConfig {
  unitId: string;
  squadId: number;
  spawnTile: { x: number; y: number };
  chassis: ChassisType;
  label: string;
}

export interface BattleSceneAiConfig {
  boss: BattleSceneBossConfig | null;
}

export const isBattleSceneAutoControlledSquad = (squadId: number): boolean => {
  return squadId !== 0;
};

export const getBattleSceneAiConfig = (missionId: string | null | undefined): BattleSceneAiConfig => {
  if (missionId === 'coop_boss_kill') {
    return {
      boss: {
        unitId: 'boss-1',
        squadId: 2,
        spawnTile: { x: 14, y: 5 },
        chassis: 'vanguard',
        label: 'Boss 核心',
      },
    };
  }

  return {
    boss: null,
  };
};
