import { ChassisData, ChassisDefinition } from './ChassisTypes';
import { ModuleData, ModuleDefinition } from './ModuleTypes';
import { MissionTemplateData, MissionTemplate } from './MissionTypes';
import { MapEventData, MapEventDefinition } from './MapEventTypes';

export class ContentLoader {
  private chassisData: ChassisData | null = null;
  private moduleData: ModuleData | null = null;
  private missionData: MissionTemplateData | null = null;
  private mapEventData: MapEventData | null = null;

  loadChassis(data: ChassisData): void {
    this.chassisData = data;
  }

  loadModules(data: ModuleData): void {
    this.moduleData = data;
  }

  loadMissionTemplates(data: MissionTemplateData): void {
    this.missionData = data;
  }

  loadMapEvents(data: MapEventData): void {
    this.mapEventData = data;
  }

  getChassis(id: string): ChassisDefinition | undefined {
    return this.chassisData?.chassis.find(c => c.id === id);
  }

  getAllChassis(): ChassisDefinition[] {
    return this.chassisData?.chassis ?? [];
  }

  getModule(id: string): ModuleDefinition | undefined {
    return this.moduleData?.modules.find(m => m.id === id);
  }

  getModulesByCategory(category: string): ModuleDefinition[] {
    return this.moduleData?.modules.filter(m => m.category === category) ?? [];
  }

  getAllModules(): ModuleDefinition[] {
    return this.moduleData?.modules ?? [];
  }

  getMissionTemplate(id: string): MissionTemplate | undefined {
    return this.missionData?.templates.find(t => t.id === id);
  }

  getAllMissionTemplates(): MissionTemplate[] {
    return this.missionData?.templates ?? [];
  }

  getRandomMissionTemplate(): MissionTemplate | undefined {
    const templates = this.getAllMissionTemplates();
    if (templates.length === 0) return undefined;
    return templates[Math.floor(Math.random() * templates.length)];
  }

  getMapEvent(id: string): MapEventDefinition | undefined {
    return this.mapEventData?.events.find(e => e.id === id);
  }

  getAllMapEvents(): MapEventDefinition[] {
    return this.mapEventData?.events ?? [];
  }

  getMapEventsByType(type: string): MapEventDefinition[] {
    return this.mapEventData?.events.filter(e => e.type === type) ?? [];
  }
}

export const contentLoader = new ContentLoader();
