import { Scene } from 'phaser';
import { contentLoader } from '../data/ContentLoader';
import { AssetIntake } from '../core/AssetIntake';

export class BootScene extends Scene {
  private assetIntake!: AssetIntake;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.assetIntake = new AssetIntake(this);
    this.assetIntake.loadAllAssets();

    // Vite publicDir assets are served from the site root.
    this.load.json('chassis-data', '/data/chassis.json');
    this.load.json('modules-data', '/data/modules.json');
    this.load.json('mission-templates', '/data/mission-templates.json');
    this.load.json('map-events', '/data/map-events.json');
  }

  create(): void {
    // Generate placeholders for missing assets
    this.assetIntake.generatePlaceholders();
    
    // Parse loaded data
    const chassisData = this.cache.json.get('chassis-data');
    const modulesData = this.cache.json.get('modules-data');
    const missionTemplates = this.cache.json.get('mission-templates');
    const mapEvents = this.cache.json.get('map-events');
    
    // Load into content loader
    contentLoader.loadChassis(chassisData);
    contentLoader.loadModules(modulesData);
    contentLoader.loadMissionTemplates(missionTemplates);
    contentLoader.loadMapEvents(mapEvents);
    
    // Store in registry for cross-scene access
    this.registry.set('chassisData', chassisData);
    this.registry.set('modulesData', modulesData);
    this.registry.set('missionTemplates', missionTemplates);
    this.registry.set('mapEvents', mapEvents);
    this.registry.set('contentLoader', contentLoader);
    
    // Transition to local setup flow
    this.scene.start('SetupScene');
  }
}
