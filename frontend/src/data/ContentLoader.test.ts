import { describe, expect, it } from 'vitest';
import { ContentLoader } from './ContentLoader';
import type { ChassisData, ChassisDefinition } from './ChassisTypes';
import type { ModuleData, ModuleDefinition } from './ModuleTypes';
import type { MissionTemplateData, MissionTemplate } from './MissionTypes';
import type { MapEventData, MapEventDefinition } from './MapEventTypes';

const makeChassisData = (): ChassisData => ({
  chassis: [
    {
      id: 'chassis-a',
      name: 'Chassis A',
      role: 'attacker',
      baseStats: { hp: 100, move: 3, jump: 1, speed: 8, attack: 10, defense: 5 },
      slotBias: { active: 2, passive: 1, combo: 1, tool: 1 },
    },
    {
      id: 'chassis-b',
      name: 'Chassis B',
      role: 'defender',
      baseStats: { hp: 150, move: 2, jump: 1, speed: 5, attack: 8, defense: 12 },
      slotBias: { active: 1, passive: 2, combo: 1, tool: 1 },
    },
  ],
});

const makeModuleData = (): ModuleData => ({
  modules: [
    {
      id: 'mod-a',
      name: 'Module A',
      category: 'active',
      rarity: 'common',
      description: 'Test module A',
      effects: [{ type: 'damage', power: 1 }],
    },
    {
      id: 'mod-b',
      name: 'Module B',
      category: 'passive',
      rarity: 'rare',
      description: 'Test module B',
      effects: [{ type: 'stat_mod', stat: 'defense', value: 2 }],
    },
  ],
});

const makeMissionData = (): MissionTemplateData => ({
  templates: [
    {
      id: 'mission-a',
      name: 'Mission A',
      type: 'cooperative',
      description: 'Test mission A',
      revealDelay: 0,
      extractionRules: { type: 'standard', trigger: 'turn', timeout: 10, partialRetention: 0.5 },
      endgamePressure: { startTime: 0, escalationInterval: 5, collapseMechanic: 'fog' },
    },
    {
      id: 'mission-b',
      name: 'Mission B',
      type: 'competitive',
      description: 'Test mission B',
      revealDelay: 1,
      extractionRules: { type: 'timed', trigger: 'objective', timeout: 15, partialRetention: 0.25 },
      endgamePressure: { startTime: 5, escalationInterval: 3, collapseMechanic: 'storm' },
    },
  ],
});

const makeMapEventData = (): MapEventData => ({
  events: [
    {
      id: 'event-a',
      name: 'Event A',
      type: 'reward',
      description: 'Test event A',
      spawnRules: { minDistanceFromSpawn: 2 },
      rewards: [{ type: 'resource', itemId: 'gold', quantity: 10 }],
    },
    {
      id: 'event-b',
      name: 'Event B',
      type: 'hazard',
      description: 'Test event B',
      spawnRules: { minDistanceFromSpawn: 3 },
      effects: [{ type: 'damage', power: 5 }],
    },
  ],
});

describe('ContentLoader', () => {
  it('loads chassis data and retrieves by id', () => {
    const loader = new ContentLoader();
    const data = makeChassisData();

    loader.loadChassis(data);

    expect(loader.getChassis('chassis-a')).toEqual(data.chassis[0]);
    expect(loader.getChassis('chassis-b')).toEqual(data.chassis[1]);
  });

  it('loads module data and retrieves by id', () => {
    const loader = new ContentLoader();
    const data = makeModuleData();

    loader.loadModules(data);

    expect(loader.getModule('mod-a')).toEqual(data.modules[0]);
    expect(loader.getModule('mod-b')).toEqual(data.modules[1]);
  });

  it('loads mission templates and retrieves by id', () => {
    const loader = new ContentLoader();
    const data = makeMissionData();

    loader.loadMissionTemplates(data);

    expect(loader.getMissionTemplate('mission-a')).toEqual(data.templates[0]);
    expect(loader.getMissionTemplate('mission-b')).toEqual(data.templates[1]);
  });

  it('loads map events and retrieves by id', () => {
    const loader = new ContentLoader();
    const data = makeMapEventData();

    loader.loadMapEvents(data);

    expect(loader.getMapEvent('event-a')).toEqual(data.events[0]);
    expect(loader.getMapEvent('event-b')).toEqual(data.events[1]);
  });

  it('returns undefined for missing chassis id', () => {
    const loader = new ContentLoader();
    loader.loadChassis(makeChassisData());

    expect(loader.getChassis('nonexistent')).toBeUndefined();
  });

  it('returns undefined for missing module id', () => {
    const loader = new ContentLoader();
    loader.loadModules(makeModuleData());

    expect(loader.getModule('nonexistent')).toBeUndefined();
  });

  it('returns undefined for missing mission template id', () => {
    const loader = new ContentLoader();
    loader.loadMissionTemplates(makeMissionData());

    expect(loader.getMissionTemplate('nonexistent')).toBeUndefined();
  });

  it('returns undefined for missing map event id', () => {
    const loader = new ContentLoader();
    loader.loadMapEvents(makeMapEventData());

    expect(loader.getMapEvent('nonexistent')).toBeUndefined();
  });

  it('returns undefined when data has not been loaded', () => {
    const loader = new ContentLoader();

    expect(loader.getChassis('any')).toBeUndefined();
    expect(loader.getModule('any')).toBeUndefined();
    expect(loader.getMissionTemplate('any')).toBeUndefined();
    expect(loader.getMapEvent('any')).toBeUndefined();
  });

  it('filters chassis by role', () => {
    const loader = new ContentLoader();
    const data = makeChassisData();

    loader.loadChassis(data);

    const attackers = loader.getAllChassis().filter((c) => c.role === 'attacker');
    const defenders = loader.getAllChassis().filter((c) => c.role === 'defender');

    expect(attackers).toHaveLength(1);
    expect(attackers[0].id).toBe('chassis-a');
    expect(defenders).toHaveLength(1);
    expect(defenders[0].id).toBe('chassis-b');
  });

  it('returns all items via getAll* methods', () => {
    const loader = new ContentLoader();

    loader.loadChassis(makeChassisData());
    loader.loadModules(makeModuleData());
    loader.loadMissionTemplates(makeMissionData());
    loader.loadMapEvents(makeMapEventData());

    expect(loader.getAllChassis()).toHaveLength(2);
    expect(loader.getAllModules()).toHaveLength(2);
    expect(loader.getAllMissionTemplates()).toHaveLength(2);
    expect(loader.getAllMapEvents()).toHaveLength(2);
  });

  it('filters modules by category', () => {
    const loader = new ContentLoader();
    loader.loadModules(makeModuleData());

    expect(loader.getModulesByCategory('active')).toHaveLength(1);
    expect(loader.getModulesByCategory('passive')).toHaveLength(1);
    expect(loader.getModulesByCategory('combo')).toHaveLength(0);
  });

  it('filters map events by type', () => {
    const loader = new ContentLoader();
    loader.loadMapEvents(makeMapEventData());

    expect(loader.getMapEventsByType('reward')).toHaveLength(1);
    expect(loader.getMapEventsByType('hazard')).toHaveLength(1);
    expect(loader.getMapEventsByType('vendor')).toHaveLength(0);
  });

  it('returns a random mission template from loaded data', () => {
    const loader = new ContentLoader();
    const data = makeMissionData();

    loader.loadMissionTemplates(data);

    const random = loader.getRandomMissionTemplate();
    expect(random).toBeDefined();
    expect(data.templates).toContainEqual(random);
  });

  it('returns undefined for random mission when no templates loaded', () => {
    const loader = new ContentLoader();

    expect(loader.getRandomMissionTemplate()).toBeUndefined();
  });
});
