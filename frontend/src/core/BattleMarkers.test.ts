import { describe, expect, it } from 'vitest';
import { buildMissionMarkers, type MissionMarkerMission, type MissionMarkerUnit } from './BattleMarkers';

const objectiveTiles = [{ x: 12, y: 5 }];

const units: MissionMarkerUnit[] = [
  { id: 'a-1', tileX: 2, tileY: 5, isAlive: true },
  { id: 'boss-1', tileX: 14, tileY: 5, isAlive: true },
];

describe('buildMissionMarkers', () => {
  it('surfaces the boss location in cooperative boss missions', () => {
    const mission: MissionMarkerMission = {
      id: 'coop_boss_kill',
      bossUnitId: 'boss-1',
      extractionUnlocked: false,
    };

    expect(buildMissionMarkers({ mission, units, objectiveTiles })).toContainEqual({
      x: 14,
      y: 5,
      label: 'BOSS',
      color: 0xff4d6d,
    });
  });

  it('switches objective tiles to extraction markers once extraction is unlocked', () => {
    const mission: MissionMarkerMission = {
      id: 'coop_boss_kill',
      bossUnitId: 'boss-1',
      extractionUnlocked: true,
    };

    expect(buildMissionMarkers({ mission, units, objectiveTiles })).toContainEqual({
      x: 12,
      y: 5,
      label: '撤离',
      color: 0x2ec4b6,
    });
  });
});
