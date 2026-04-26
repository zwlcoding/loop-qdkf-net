import type { TerrainType, MapLayout } from "../data/TerrainTypes";
import { getTerrainType, getAllTerrainTypes } from "../data/TerrainTypes";
import { ProgressManager } from "./ProgressManager";
import mapData from "../data/maps.json";

export class MapManager {
  private readonly maps: MapLayout[];
  private readonly MAP_UNLOCK_KEY = "loop-qdkf-unlocked-maps";

  constructor(_progressManager?: ProgressManager) {
    this.maps = (mapData as { maps: MapLayout[] }).maps;
  }

  getTerrainType(terrainId: string): TerrainType | null {
    const terrain = getTerrainType(terrainId);
    return terrain ?? null;
  }

  getAllTerrainTypes(): TerrainType[] {
    return getAllTerrainTypes();
  }

  getMapLayout(mapId: string): MapLayout | null {
    const mapLayout = this.maps.find((m) => m.id === mapId);
    return mapLayout ?? null;
  }

  getAvailableMaps(): MapLayout[] {
    const unlocked = this.getUnlockedMapIds();
    return this.maps.filter((m) => {
      if (!m.unlockCondition) return true;
      return unlocked.includes(m.id);
    });
  }

  unlockMap(mapId: string): void {
    const list = this.getUnlockedMapIds();
    if (!list.includes(mapId)) {
      list.push(mapId);
      this.saveUnlockedMapIds(list);
    }
  }

  private getUnlockedMapIds(): string[] {
    try {
      const data = globalThis.localStorage.getItem(this.MAP_UNLOCK_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      // ignore
    }
    return [];
  }

  private saveUnlockedMapIds(ids: string[]): void {
    try {
      globalThis.localStorage.setItem(this.MAP_UNLOCK_KEY, JSON.stringify(ids));
    } catch {
      // ignore
    }
  }
}
