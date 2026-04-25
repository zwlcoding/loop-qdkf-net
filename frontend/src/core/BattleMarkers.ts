export interface MissionMarkerMission {
  id: string;
  bossUnitId?: string | null;
  relicHolderUnitId?: string | null;
  extractionUnlocked?: boolean;
}

export interface MissionMarkerUnit {
  id: string;
  tileX: number;
  tileY: number;
  isAlive: boolean;
}

export interface MissionMarker {
  x: number;
  y: number;
  label: string;
  color: number;
}

export interface BuildMissionMarkersInput {
  mission: MissionMarkerMission | null;
  units: MissionMarkerUnit[];
  objectiveTiles: Array<{ x: number; y: number }>;
}

export const buildMissionMarkers = ({ mission, units, objectiveTiles }: BuildMissionMarkersInput): MissionMarker[] => {
  if (!mission) {
    return [];
  }

  const markers: MissionMarker[] = [];

  if (mission.bossUnitId) {
    const bossUnit = units.find((unit) => unit.isAlive && unit.id === mission.bossUnitId);
    if (bossUnit) {
      markers.push({
        x: bossUnit.tileX,
        y: bossUnit.tileY,
        label: 'BOSS',
        color: 0xff4d6d,
      });
    }
  }

  if (mission.extractionUnlocked) {
    objectiveTiles.forEach((tile) => {
      markers.push({
        x: tile.x,
        y: tile.y,
        label: '撤离',
        color: 0x2ec4b6,
      });
    });
  }

  return markers;
};
