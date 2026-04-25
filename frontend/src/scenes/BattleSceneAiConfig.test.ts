import { describe, expect, it } from 'vitest';
import { getBattleSceneAiConfig, isBattleSceneAutoControlledSquad } from './BattleSceneAiConfig';

describe('BattleSceneAiConfig', () => {
  it('spawns the boss only for cooperative boss missions', () => {
    expect(getBattleSceneAiConfig('coop_boss_kill').boss).toEqual({
      unitId: 'boss-1',
      squadId: 2,
      spawnTile: { x: 14, y: 5 },
      chassis: 'vanguard',
      label: 'Boss 核心',
    });

    expect(getBattleSceneAiConfig('relic_contest').boss).toBeNull();
    expect(getBattleSceneAiConfig('coop_then_reversal').boss).toBeNull();
  });

  it('keeps A squad manual while automating rival squad and boss turns', () => {
    expect(isBattleSceneAutoControlledSquad(0)).toBe(false);
    expect(isBattleSceneAutoControlledSquad(1)).toBe(true);
    expect(isBattleSceneAutoControlledSquad(2)).toBe(true);
  });
});
