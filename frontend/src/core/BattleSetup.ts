import { LoadoutValidator, type ValidationError } from './LoadoutValidator';
import type { ChassisDefinition } from '../data/ChassisTypes';
import type { ModuleDefinition } from '../data/ModuleTypes';
import type { MissionTemplate } from '../data/MissionTypes';
import type { ChassisType } from '../entities/Unit';

export const BATTLE_SETUP_REGISTRY_KEY = 'battleSetup';

export interface BattleSetupUnit {
  id: string;
  label: string;
  chassisId: ChassisType;
  tile: { x: number; y: number };
  moduleIds: string[];
}

export interface BattleSetupSquad {
  id: number;
  name: string;
  control: 'human' | 'ai';
  units: BattleSetupUnit[];
}

export interface BattleSetupBossContext {
  enabled: boolean;
}

export interface BattleSetup {
  version: 1;
  source: 'local-setup' | 'seeded-default';
  squads: [BattleSetupSquad, BattleSetupSquad];
  missionTemplateId?: string;
  boss?: BattleSetupBossContext;
}

export interface BattleSetupValidationContext {
  chassis: ChassisDefinition[];
  modules: ModuleDefinition[];
  missions: MissionTemplate[];
}

export interface BattleSetupValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const DEFAULT_SETUP: BattleSetup = {
  version: 1,
  source: 'seeded-default',
  missionTemplateId: 'coop_boss_kill',
  boss: { enabled: true },
  squads: [
    {
      id: 0,
      name: 'Alpha',
      control: 'human',
      units: [
        { id: 'a-1', label: 'A1 先锋', chassisId: 'vanguard', tile: { x: 2, y: 5 }, moduleIds: ['slash', 'shield_bash', 'iron_skin', 'team_strike', 'potion'] },
        { id: 'a-2', label: 'A2 法师', chassisId: 'caster', tile: { x: 3, y: 4 }, moduleIds: ['fireball', 'heal', 'speed_boost', 'unison_blast', 'stim_pack'] },
        { id: 'a-3', label: 'A3 支援', chassisId: 'support', tile: { x: 2, y: 6 }, moduleIds: ['heal', 'barrier_field', 'vigor', 'rescue_link', 'potion'] },
      ],
    },
    {
      id: 1,
      name: 'Bravo',
      control: 'ai',
      units: [
        { id: 'b-1', label: 'B1 游击', chassisId: 'skirmisher', tile: { x: 13, y: 5 }, moduleIds: ['slash', 'charge', 'adrenaline', 'team_strike', 'smoke_bomb'] },
        { id: 'b-2', label: 'B2 控场', chassisId: 'controller', tile: { x: 12, y: 4 }, moduleIds: ['root_shot', 'toxin_round', 'iron_skin', 'rescue_link', 'flash_bang'] },
        { id: 'b-3', label: 'B3 先锋', chassisId: 'vanguard', tile: { x: 13, y: 6 }, moduleIds: ['slash', 'shield_bash', 'iron_skin', 'team_strike', 'potion'] },
      ],
    },
  ],
};

export const createSeededBattleSetup = (missionTemplateId = 'coop_boss_kill'): BattleSetup => ({
  ...DEFAULT_SETUP,
  missionTemplateId,
  boss: { enabled: missionTemplateId === 'coop_boss_kill' },
  squads: DEFAULT_SETUP.squads.map((squad) => ({
    ...squad,
    units: squad.units.map((unit) => ({ ...unit, tile: { ...unit.tile }, moduleIds: [...unit.moduleIds] })),
  })) as [BattleSetupSquad, BattleSetupSquad],
});

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

export const validateBattleSetup = (
  setup: BattleSetup,
  context: BattleSetupValidationContext,
): BattleSetupValidationResult => {
  const errors: ValidationError[] = [];
  const candidateSetup = setup as unknown;

  if (!isRecord(candidateSetup)) {
    return {
      valid: false,
      errors: [{ field: 'setup', message: '战斗设置数据格式无效。' }],
    };
  }

  if (candidateSetup.version !== 1) {
    errors.push({ field: 'version', message: '战斗设置版本无效。' });
  }

  if (candidateSetup.source !== 'local-setup' && candidateSetup.source !== 'seeded-default') {
    errors.push({ field: 'source', message: '战斗设置来源无效。' });
  }

  const squadsValue = candidateSetup.squads;
  if (!Array.isArray(squadsValue) || squadsValue.length !== 2) {
    errors.push({ field: 'squads', message: '本地战斗设置必须正好包含两个小队。' });
  }

  const missionIds = new Set(context.missions.map((mission) => mission.id));
  if (setup.missionTemplateId && !missionIds.has(setup.missionTemplateId)) {
    errors.push({ field: 'missionTemplateId', message: `未知任务模板：${setup.missionTemplateId}` });
  }

  if (!Array.isArray(squadsValue)) {
    return {
      valid: false,
      errors,
    };
  }

  const validator = new LoadoutValidator(context.chassis);
  const moduleMap = new Map(context.modules.map((module) => [module.id, module]));
  const seenUnitIds = new Set<string>();
  const seenTiles = new Set<string>();

    const seenSquadIds = new Set<number>();

    squadsValue.forEach((squadValue, squadIndex) => {
      if (!isRecord(squadValue)) {
        errors.push({ field: `squads[${squadIndex}]`, message: `小队 ${squadIndex + 1} 数据格式无效。` });
        return;
      }

      if (typeof squadValue.id !== 'number') {
        errors.push({ field: `squads[${squadIndex}].id`, message: '小队缺少有效 ID。' });
      } else {
        if (seenSquadIds.has(squadValue.id)) {
          errors.push({ field: `squads[${squadIndex}].id`, message: `小队 ID 重复：${squadValue.id}` });
        }
        seenSquadIds.add(squadValue.id);
      }

      if (squadValue.control !== 'human' && squadValue.control !== 'ai') {
        errors.push({ field: `squads[${squadIndex}].control`, message: '小队控制类型无效。' });
      }

      const unitsValue = squadValue.units;
if (!Array.isArray(unitsValue) || unitsValue.length === 0) {
      errors.push({ field: `squads[${squadIndex}].units`, message: '每个小队至少需要一个单位。' });
      return;
    }

    unitsValue.forEach((unitValue, unitIndex) => {
      if (!isRecord(unitValue)) {
        errors.push({ field: `squads[${squadIndex}].units[${unitIndex}]`, message: '单位数据格式无效。' });
        return;
      }

      const unitId = typeof unitValue.id === 'string' ? unitValue.id : null;
      if (!unitId) {
        errors.push({ field: `squads[${squadIndex}].units[${unitIndex}].id`, message: '单位缺少有效 ID。' });
        return;
      }

      if (seenUnitIds.has(unitId)) {
        errors.push({ field: `squads[${squadIndex}].units[${unitIndex}].id`, message: `单位 ID 重复：${unitId}` });
      }
      seenUnitIds.add(unitId);

      const tileValue = unitValue.tile;
      if (!isRecord(tileValue) || typeof tileValue.x !== 'number' || typeof tileValue.y !== 'number') {
        errors.push({ field: `squads[${squadIndex}].units[${unitIndex}].tile`, message: '单位出生点格式无效。' });
        return;
      }

      const tileKey = `${tileValue.x},${tileValue.y}`;
      if (seenTiles.has(tileKey)) {
        errors.push({ field: `squads[${squadIndex}].units[${unitIndex}].tile`, message: `出生点重复：${tileKey}` });
      }
      seenTiles.add(tileKey);

      if (tileValue.x < 0 || tileValue.x > 15 || tileValue.y < 0 || tileValue.y > 11) {
        errors.push({ field: `squads[${squadIndex}].units[${unitIndex}].tile`, message: `出生点越界：${tileKey}` });
      }

      const chassisId = typeof unitValue.chassisId === 'string' ? unitValue.chassisId : null;
      if (!chassisId) {
        errors.push({ field: `squads[${squadIndex}].units[${unitIndex}].chassisId`, message: '单位缺少有效机体类型。' });
        return;
      }

      const moduleIdsValue = unitValue.moduleIds;
      if (!Array.isArray(moduleIdsValue)) {
        errors.push({ field: `squads[${squadIndex}].units[${unitIndex}].moduleIds`, message: '单位模块列表格式无效。' });
        return;
      }

      const resolvedModules: ModuleDefinition[] = [];
      moduleIdsValue.forEach((moduleIdValue) => {
        if (typeof moduleIdValue !== 'string') {
          errors.push({ field: `squads[${squadIndex}].units[${unitIndex}].moduleIds`, message: '模块 ID 必须是字符串。' });
          return;
        }
        const module = moduleMap.get(moduleIdValue);
        if (!module) {
          errors.push({ field: `squads[${squadIndex}].units[${unitIndex}].moduleIds`, message: `未知模块：${moduleIdValue}` });
          return;
        }
        resolvedModules.push(module);
      });

      const loadoutResult = validator.validateUnit({
        chassisId: chassisId as ChassisType,
        modules: resolvedModules,
      });

      if (!loadoutResult.valid) {
        loadoutResult.errors.forEach((error) => {
          errors.push({
            field: `squads[${squadIndex}].units[${unitIndex}].moduleIds.${error.field}`,
            message: error.message,
          });
        });
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};
