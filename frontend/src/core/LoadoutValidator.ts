import { ChassisDefinition } from '../data/ChassisTypes';
import { ModuleDefinition, ModuleCategory } from '../data/ModuleTypes';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  status: string;
}

export interface UnitLoadoutInput {
  chassisId: string;
  modules: ModuleDefinition[];
}

export class LoadoutValidator {
  private chassisMap: Map<string, ChassisDefinition>;

  constructor(chassisList: ChassisDefinition[]) {
    this.chassisMap = new Map(chassisList.map((c) => [c.id, c]));
  }

  validateUnit(input: UnitLoadoutInput): ValidationResult {
    const errors: ValidationError[] = [];

    const chassis = this.chassisMap.get(input.chassisId);
    if (!chassis) {
      errors.push({ field: 'chassis', message: `未知机体：${input.chassisId}` });
      return {
        valid: false,
        errors,
        status: '无效：未找到机体定义',
      };
    }

    const counts: Record<ModuleCategory, number> = {
      active: 0,
      passive: 0,
      combo: 0,
      tool: 0,
    };

    for (const mod of input.modules) {
      counts[mod.category]++;
    }

    const categories: ModuleCategory[] = ['active', 'passive', 'combo', 'tool'];
    for (const cat of categories) {
      const limit = chassis.slotBias[cat];
      const count = counts[cat];
      if (count > limit) {
        errors.push({
          field: `modules.${cat}`,
          message: `${chassis.name} 的 ${this.categoryLabel(cat)} 槽位上限为 ${limit}，当前装备了 ${count} 个`,
        });
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors,
        status: `无效：${errors.map((e) => e.message).join('；')}`,
      };
    }

    return {
      valid: true,
      errors: [],
      status: `${chassis.name} 装备合法（${this.summaryCounts(counts)}）`,
    };
  }

  validateSquad(units: UnitLoadoutInput[]): ValidationResult {
    if (units.length === 0) {
      return {
        valid: false,
        errors: [{ field: 'squad', message: '小队不能为空' }],
        status: '无效：小队至少需要一个单位',
      };
    }

    const allErrors: ValidationError[] = [];
    for (let i = 0; i < units.length; i++) {
      const unitResult = this.validateUnit(units[i]);
      if (!unitResult.valid) {
        allErrors.push(
          ...unitResult.errors.map((e) => ({
            field: `units[${i}].${e.field}`,
            message: `单位 ${i + 1}：${e.message}`,
          }))
        );
      }
    }

    if (allErrors.length > 0) {
      return {
        valid: false,
        errors: allErrors,
        status: `小队装备无效：${allErrors.map((e) => e.message).join('；')}`,
      };
    }

    return {
      valid: true,
      errors: [],
      status: `小队装备合法（共 ${units.length} 个单位）`,
    };
  }

  private categoryLabel(cat: ModuleCategory): string {
    const labels: Record<ModuleCategory, string> = {
      active: '主动技能',
      passive: '被动',
      combo: '连携',
      tool: '道具',
    };
    return labels[cat];
  }

  private summaryCounts(counts: Record<ModuleCategory, number>): string {
    const parts = [
      `主动${counts.active}`,
      `被动${counts.passive}`,
      `连携${counts.combo}`,
      `道具${counts.tool}`,
    ];
    return parts.join(' / ');
  }
}
