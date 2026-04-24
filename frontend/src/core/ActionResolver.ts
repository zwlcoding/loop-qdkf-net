import type { ChassisType, FacingDirection } from '../entities/Unit';
import type { ModuleDefinition, ModuleEffect } from '../data/ModuleTypes';
import type { StatusType } from '../entities/StatusEffect';

export interface ActionResolverDeps {
  hasLineOfSight?: (fromX: number, fromY: number, toX: number, toY: number) => boolean;
  getHeightDifference?: (fromX: number, fromY: number, toX: number, toY: number) => number;
  calculateDamage?: (attacker: UnitActionState, defender: TargetActionState, baseDamage: number) => number;
}

export interface UnitActionState {
  id: string;
  chassis?: ChassisType;
  squad: number;
  tileX: number;
  tileY: number;
  hp?: number;
  maxHp?: number;
  attack: number;
  facing?: FacingDirection;
  canAct: boolean;
  canUseTool: boolean;
  activeModules: ModuleDefinition[];
  comboModules: ModuleDefinition[];
  toolModules: ModuleDefinition[];
}

export interface TargetActionState {
  id: string;
  squad: number;
  tileX: number;
  tileY: number;
  hp: number;
  maxHp: number;
}

export type ActionOptionType = 'basic-attack' | 'module' | 'combo' | 'tool';

export interface ActionOption {
  type: ActionOptionType;
  label: string;
  targetId: string;
  moduleId?: string;
  comboCost?: number;
}

export interface ComboParticipant {
  id: string;
  tileX: number;
  tileY: number;
  attack: number;
}

export interface ActionResolution {
  success: boolean;
  consumesPrimaryAction: boolean;
  consumesToolOpportunity: boolean;
  appliedDamage?: number;
  appliedHealing?: number;
  appliedStatuses?: StatusApplication[];
  knockbackDistance?: number;
  comboCostSpent?: number;
  remainingComboResource?: number;
  participants?: ComboParticipant[];
  participantCount?: number;
  summary: string;
}

export interface StatusApplication {
  type: StatusType;
  duration: number;
  magnitude: number;
}

export interface UnitLoadout {
  active: ModuleDefinition[];
  combo: ModuleDefinition[];
  tool: ModuleDefinition[];
}

const getDistance = (fromX: number, fromY: number, toX: number, toY: number): number => {
  return Math.abs(fromX - toX) + Math.abs(fromY - toY);
};

const defaultHeightDifference = (): number => 0;
const defaultHasLineOfSight = () => true;

const defaultCalculateDamage = (attacker: UnitActionState, _defender: TargetActionState, baseDamage: number): number => {
  return Math.max(1, Math.round(baseDamage + attacker.attack));
};

const isHostileTarget = (actor: UnitActionState, target: TargetActionState): boolean => actor.squad !== target.squad;

const isHelpfulStatus = (status: string | undefined): boolean => {
  return status === 'shield';
};

const collectStatuses = (effects: ModuleEffect[]): StatusApplication[] => {
  return effects
    .filter((effect) => effect.type === 'status' && typeof effect.status === 'string')
    .map((effect) => ({
      type: effect.status as StatusType,
      duration: Math.max(1, effect.duration ?? 1),
      magnitude: Math.max(1, effect.value ?? 1),
    }));
};

const resolveModuleNumbers = (
  actor: UnitActionState,
  target: TargetActionState,
  module: ModuleDefinition,
  deps?: ActionResolverDeps
): Pick<ActionResolution, 'appliedDamage' | 'appliedHealing' | 'appliedStatuses' | 'knockbackDistance'> => {
  const calculateDamage = deps?.calculateDamage ?? defaultCalculateDamage;
  let appliedDamage = 0;
  let appliedHealing = 0;
  let knockbackDistance = 0;

  for (const effect of module.effects) {
    if (effect.type === 'damage') {
      const multiplier = typeof effect.power === 'number' ? effect.power : 1;
      const baseDamage = actor.attack * multiplier;
      appliedDamage += calculateDamage(actor, target, baseDamage);
    }

    if (effect.type === 'heal') {
      const amount = typeof effect.power === 'number' ? effect.power : 0;
      appliedHealing += Math.max(0, Math.round(amount));
    }

    if (effect.type === 'knockback') {
      knockbackDistance = Math.max(knockbackDistance, effect.distance ?? 0);
    }
  }

  return {
    appliedDamage: appliedDamage > 0 ? appliedDamage : undefined,
    appliedHealing: appliedHealing > 0 ? appliedHealing : undefined,
    appliedStatuses: collectStatuses(module.effects),
    knockbackDistance: knockbackDistance > 0 ? knockbackDistance : undefined,
  };
};

export class ActionResolver {
  static getPrimaryActionOptions(
    actor: UnitActionState,
    targets: TargetActionState[],
    deps?: ActionResolverDeps
  ): ActionOption[] {
    if (!actor.canAct) {
      return [];
    }

    const hasLineOfSight = deps?.hasLineOfSight ?? defaultHasLineOfSight;
    const options: ActionOption[] = [];

    for (const target of targets) {
      const distance = getDistance(actor.tileX, actor.tileY, target.tileX, target.tileY);
      const hostile = isHostileTarget(actor, target);

      if (hostile && distance <= 1) {
        options.push({
          type: 'basic-attack',
          label: 'Basic Attack',
          targetId: target.id,
        });
      }

      for (const module of actor.activeModules) {
        const range = module.targeting?.range ?? 1;
        const requiresLos = module.targeting?.lineOfSight ?? false;
        const hasHelpfulEffect = module.effects.some((effect) => effect.type === 'heal' || (effect.type === 'status' && isHelpfulStatus(effect.status)));
        const hasHarmfulEffect = module.effects.some((effect) => effect.type === 'damage' || effect.type === 'knockback' || (effect.type === 'status' && !isHelpfulStatus(effect.status)));
        const validTarget = (hostile && hasHarmfulEffect) || (!hostile && hasHelpfulEffect);

        if (!validTarget || distance > range) {
          continue;
        }

        if (requiresLos && !hasLineOfSight(actor.tileX, actor.tileY, target.tileX, target.tileY)) {
          continue;
        }

        options.push({
          type: 'module',
          label: module.name,
          targetId: target.id,
          moduleId: module.id,
        });
      }
    }

    return options;
  }

  static getToolOptions(actor: UnitActionState, targets: TargetActionState[]): ActionOption[] {
    if (!actor.canUseTool) {
      return [];
    }

    const options: ActionOption[] = [];

    for (const module of actor.toolModules) {
      const isHelpful = module.effects.some((effect) => effect.type === 'heal');
      const eligibleTargets = isHelpful
        ? targets.filter((target) => target.squad === actor.squad)
        : targets.filter((target) => target.squad !== actor.squad);

      for (const target of eligibleTargets) {
        options.push({
          type: 'tool',
          label: module.name,
          targetId: target.id,
          moduleId: module.id,
        });
      }
    }

    return options;
  }

  static getComboInitiationOptions(
    actor: UnitActionState,
    targets: TargetActionState[],
    availableComboResource: number,
    deps?: ActionResolverDeps
  ): ActionOption[] {
    if (!actor.canAct) {
      return [];
    }

    const hasLineOfSight = deps?.hasLineOfSight ?? defaultHasLineOfSight;
    const options: ActionOption[] = [];

    for (const module of actor.comboModules) {
      const comboCost = Math.max(1, module.comboCost ?? 1);
      if (availableComboResource < comboCost) {
        continue;
      }

      const range = module.targeting?.range ?? 1;
      const requiresLos = module.targeting?.lineOfSight ?? false;

      for (const target of targets) {
        if (!isHostileTarget(actor, target)) {
          continue;
        }

        const distance = getDistance(actor.tileX, actor.tileY, target.tileX, target.tileY);
        if (distance > range) {
          continue;
        }

        if (requiresLos && !hasLineOfSight(actor.tileX, actor.tileY, target.tileX, target.tileY)) {
          continue;
        }

        options.push({
          type: 'combo',
          label: module.name,
          targetId: target.id,
          moduleId: module.id,
          comboCost,
        });
      }
    }

    return options;
  }

  static resolvePrimaryAction(
    actor: UnitActionState,
    target: TargetActionState,
    action: ActionOption,
    deps?: ActionResolverDeps
  ): ActionResolution {
    if (!actor.canAct) {
      return {
        success: false,
        consumesPrimaryAction: false,
        consumesToolOpportunity: false,
        summary: 'Primary action already spent this turn.',
      };
    }

    if (action.type === 'basic-attack') {
      const heightDiff = (deps?.getHeightDifference ?? defaultHeightDifference)(actor.tileX, actor.tileY, target.tileX, target.tileY);
      const baseDamage = actor.attack + Math.max(-1, heightDiff);
      const appliedDamage = (deps?.calculateDamage ?? defaultCalculateDamage)(actor, target, baseDamage);

      return {
        success: true,
        consumesPrimaryAction: true,
        consumesToolOpportunity: false,
        appliedDamage,
        summary: `Basic attack hits for ${appliedDamage} damage.`,
      };
    }

    const module = actor.activeModules.find((candidate) => candidate.id === action.moduleId);
    if (!module) {
      return {
        success: false,
        consumesPrimaryAction: false,
        consumesToolOpportunity: false,
        summary: 'Selected skill is unavailable.',
      };
    }

    const resolved = resolveModuleNumbers(actor, target, module, deps);

    return {
      success: true,
      consumesPrimaryAction: true,
      consumesToolOpportunity: false,
      ...resolved,
      summary: `${module.name} resolved.`,
    };
  }

  static resolveToolUse(
    actor: UnitActionState,
    target: TargetActionState,
    module: ModuleDefinition
  ): ActionResolution {
    if (!actor.canUseTool) {
      return {
        success: false,
        consumesPrimaryAction: false,
        consumesToolOpportunity: false,
        summary: 'Tool opportunity already spent this turn.',
      };
    }

    const resolved = resolveModuleNumbers(actor, target, module);

    return {
      success: true,
      consumesPrimaryAction: false,
      consumesToolOpportunity: true,
      ...resolved,
      summary: `${module.name} resolved.`,
    };
  }

  static getEligibleComboParticipants(
    actor: UnitActionState,
    target: TargetActionState,
    potentialParticipants: UnitActionState[],
    module: ModuleDefinition,
    deps?: ActionResolverDeps
  ): UnitActionState[] {
    const participationRules = module.participationRules;
    if (!participationRules) {
      return [];
    }

    const hasLineOfSight = deps?.hasLineOfSight ?? defaultHasLineOfSight;
    const maxAllies = participationRules.maxAllies ?? 0;
    const requiredRange = participationRules.range ?? 3;
    const requiresLos = participationRules.lineOfSight ?? false;

    const eligible: UnitActionState[] = [];

    for (const candidate of potentialParticipants) {
      // Skip self
      if (candidate.id === actor.id) {
        continue;
      }

      // Must be same squad
      if (candidate.squad !== actor.squad) {
        continue;
      }

      // Must be usable (alive and can act)
      if (!candidate.canAct) {
        continue;
      }

      // Must have at least one combo module equipped (combo capability)
      if (candidate.comboModules.length === 0) {
        continue;
      }

      // Check range from initiator
      const distanceFromInitiator = getDistance(actor.tileX, actor.tileY, candidate.tileX, candidate.tileY);
      if (distanceFromInitiator > requiredRange) {
        continue;
      }

      // Check line of sight to target if required
      if (requiresLos && !hasLineOfSight(candidate.tileX, candidate.tileY, target.tileX, target.tileY)) {
        continue;
      }

      eligible.push(candidate);

      // Respect max allies limit
      if (eligible.length >= maxAllies) {
        break;
      }
    }

    return eligible;
  }

  static resolveComboInitiation(
    actor: UnitActionState,
    target: TargetActionState,
    module: ModuleDefinition,
    availableComboResource: number,
    potentialParticipants: UnitActionState[],
    deps?: ActionResolverDeps
  ): ActionResolution {
    if (!actor.canAct) {
      return {
        success: false,
        consumesPrimaryAction: false,
        consumesToolOpportunity: false,
        summary: '本回合主行动已经用过了。',
      };
    }

    if (!actor.comboModules.some((candidate) => candidate.id === module.id)) {
      return {
        success: false,
        consumesPrimaryAction: false,
        consumesToolOpportunity: false,
        summary: '当前单位没有装备这个连携模块。',
      };
    }

    if (!isHostileTarget(actor, target)) {
      return {
        success: false,
        consumesPrimaryAction: false,
        consumesToolOpportunity: false,
        summary: '连携目标必须是敌方单位。',
      };
    }

    const comboCost = Math.max(1, module.comboCost ?? 1);
    if (availableComboResource < comboCost) {
      return {
        success: false,
        consumesPrimaryAction: false,
        consumesToolOpportunity: false,
        summary: `连携值不足，${module.name} 需要 ${comboCost} 点。`,
      };
    }

    const range = module.targeting?.range ?? 1;
    const requiresLos = module.targeting?.lineOfSight ?? false;
    const hasLineOfSight = deps?.hasLineOfSight ?? defaultHasLineOfSight;
    const distance = getDistance(actor.tileX, actor.tileY, target.tileX, target.tileY);

    if (distance > range || (requiresLos && !hasLineOfSight(actor.tileX, actor.tileY, target.tileX, target.tileY))) {
      return {
        success: false,
        consumesPrimaryAction: false,
        consumesToolOpportunity: false,
        summary: '目标超出连携范围，或者被视线挡住了。',
      };
    }

    const eligibleParticipants = ActionResolver.getEligibleComboParticipants(
      actor,
      target,
      potentialParticipants,
      module,
      deps
    );

    const allParticipants = [actor, ...eligibleParticipants];
    const resolved = ActionResolver.resolveComboModuleNumbers(allParticipants, target, module, deps);

    const participantLabels = allParticipants.map((p) => p.id);
    const participantCount = allParticipants.length;

    let summary: string;
    if (eligibleParticipants.length === 0) {
      summary = `连携发起：${module.name}（无队友符合条件，仅发起者出手）`;
    } else {
      summary = `连携发起：${module.name}（${participantCount}人参与${participantLabels.length > 0 ? '：' + participantLabels.join('、') : ''}）`;
    }

    return {
      success: true,
      consumesPrimaryAction: true,
      consumesToolOpportunity: false,
      comboCostSpent: comboCost,
      remainingComboResource: availableComboResource - comboCost,
      participants: allParticipants.map((p) => ({
        id: p.id,
        tileX: p.tileX,
        tileY: p.tileY,
        attack: p.attack,
      })),
      participantCount,
      ...resolved,
      summary,
    };
  }

  static resolveComboModuleNumbers(
    participants: UnitActionState[],
    target: TargetActionState,
    module: ModuleDefinition,
    deps?: ActionResolverDeps
  ): Pick<ActionResolution, 'appliedDamage' | 'appliedHealing' | 'appliedStatuses' | 'knockbackDistance'> {
    const calculateDamage = deps?.calculateDamage ?? defaultCalculateDamage;
    let appliedDamage = 0;
    let appliedHealing = 0;
    let knockbackDistance = 0;
    const allStatuses: StatusApplication[] = [];

    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      const isInitiator = i === 0;

      for (const effect of module.effects) {
        // Non-perParticipant effects only apply from initiator
        if (!effect.perParticipant && !isInitiator) {
          continue;
        }

        if (effect.type === 'damage') {
          const multiplier = typeof effect.power === 'number' ? effect.power : 1;
          const baseDamage = participant.attack * multiplier;
          appliedDamage += calculateDamage(participant, target, baseDamage);
        }

        if (effect.type === 'heal') {
          const amount = typeof effect.power === 'number' ? effect.power : 0;
          appliedHealing += Math.max(0, Math.round(amount));
        }

        if (effect.type === 'knockback') {
          knockbackDistance = Math.max(knockbackDistance, effect.distance ?? 0);
        }

        if (effect.type === 'status' && typeof effect.status === 'string') {
          allStatuses.push({
            type: effect.status as StatusType,
            duration: Math.max(1, effect.duration ?? 1),
            magnitude: Math.max(1, effect.value ?? 1),
          });
        }
      }
    }

    return {
      appliedDamage: appliedDamage > 0 ? appliedDamage : undefined,
      appliedHealing: appliedHealing > 0 ? appliedHealing : undefined,
      appliedStatuses: allStatuses.length > 0 ? allStatuses : undefined,
      knockbackDistance: knockbackDistance > 0 ? knockbackDistance : undefined,
    };
  }

  static getFallbackLoadout(chassis: ChassisType, modules: ModuleDefinition[]): UnitLoadout {
    const moduleById = new Map(modules.map((module) => [module.id, module]));

    const perChassisActive: Record<ChassisType, string[]> = {
      vanguard: ['slash', 'shield_bash'],
      skirmisher: ['slash'],
      caster: ['slash', 'fireball'],
      support: ['slash', 'heal'],
      controller: ['slash', 'fireball'],
    };

    const toolIds = ['potion'];
    const comboIds = ['team_strike'];

    return {
      active: (perChassisActive[chassis] ?? ['slash'])
        .map((id) => moduleById.get(id))
        .filter((module): module is ModuleDefinition => Boolean(module)),
      combo: (chassis === 'vanguard' || chassis === 'caster' || chassis === 'support' ? comboIds : [])
        .map((id) => moduleById.get(id))
        .filter((module): module is ModuleDefinition => Boolean(module)),
      tool: toolIds
        .map((id) => moduleById.get(id))
        .filter((module): module is ModuleDefinition => Boolean(module)),
    };
  }
}
