import type { ActionOption, TargetActionState, UnitActionState } from '../core/ActionResolver';
import { ActionResolver } from '../core/ActionResolver';
import type { ModuleDefinition } from '../data/ModuleTypes';
import type { ChassisType, FacingDirection } from '../entities/Unit';
import { AiPlanner, type AiDecision } from './AiPlanner';
import type { ActionCandidate } from './ActionCandidate';
import type { AiProfile } from './AiProfiles';
import type { DecisionContext } from './DecisionContext';

export interface BotReachableTile {
  x: number;
  y: number;
  path: Array<{ x: number; y: number }>;
}

export interface BotUnitSnapshot {
  id: string;
  role?: 'squad' | 'boss';
  chassis: ChassisType;
  squad: number;
  tileX: number;
  tileY: number;
  hp: number;
  maxHp: number;
  attack: number;
  facing: FacingDirection;
  canMove: boolean;
  canAct: boolean;
  canUseTool: boolean;
  move: number;
  jump: number;
  activeModules: ModuleDefinition[];
  comboModules: ModuleDefinition[];
  toolModules: ModuleDefinition[];
}

export interface BotMissionSnapshot {
  id: string;
  isRevealed: boolean;
  bossUnitId?: string | null;
  relicHolderUnitId?: string | null;
  extractionUnlocked?: boolean;
  isReversalPhase?: boolean;
  pressureStage?: number;
}

export interface BotBattleState {
  actorId: string;
  squadId: number;
  turnNumber: number;
  units: BotUnitSnapshot[];
  reachableTiles: BotReachableTile[];
  objectiveTiles: Array<{ x: number; y: number }>;
  mission: BotMissionSnapshot | null;
  hasLineOfSight: (fromX: number, fromY: number, toX: number, toY: number) => boolean;
  getHeightDifference: (fromX: number, fromY: number, toX: number, toY: number) => number;
}

export interface BotPlannedAction {
  kind: 'move' | 'primary';
  move: BotReachableTile | null;
  option: ActionOption | null;
}

export type BotTurnDecision = AiDecision<BotPlannedAction>;

const getDistance = (fromX: number, fromY: number, toX: number, toY: number): number => {
  return Math.abs(fromX - toX) + Math.abs(fromY - toY);
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const toUnitActionState = (unit: BotUnitSnapshot, position?: { x: number; y: number }): UnitActionState => ({
  id: unit.id,
  chassis: unit.chassis,
  squad: unit.squad,
  tileX: position?.x ?? unit.tileX,
  tileY: position?.y ?? unit.tileY,
  hp: unit.hp,
  maxHp: unit.maxHp,
  attack: unit.attack,
  facing: unit.facing,
  canAct: unit.canAct,
  canUseTool: unit.canUseTool,
  activeModules: unit.activeModules,
  comboModules: unit.comboModules,
  toolModules: unit.toolModules,
});

const toTargetState = (unit: BotUnitSnapshot): TargetActionState => ({
  id: unit.id,
  squad: unit.squad,
  tileX: unit.tileX,
  tileY: unit.tileY,
  hp: unit.hp,
  maxHp: unit.maxHp,
});

const estimateActionDamage = (actor: BotUnitSnapshot, action: ActionOption): number => {
  if (action.type === 'basic-attack') {
    return actor.attack;
  }

  const module = actor.activeModules.find((candidate) => candidate.id === action.moduleId);
  if (!module) {
    return 0;
  }

  return module.effects.reduce((total, effect) => {
    if (effect.type !== 'damage') {
      return total;
    }

    return total + Math.round(actor.attack * (effect.power ?? 1));
  }, 0);
};

const getVisibleHostileUnits = (state: BotBattleState, actor: BotUnitSnapshot): BotUnitSnapshot[] => {
  const mission = state.mission;
  const nonSelfUnits = state.units.filter((unit) => unit.id !== actor.id);

  if (actor.role === 'boss') {
    return nonSelfUnits.filter((unit) => unit.squad !== actor.squad);
  }

  if (!mission || !mission.isRevealed) {
    return nonSelfUnits.filter((unit) => unit.squad !== actor.squad);
  }

  if (mission.id === 'coop_boss_kill') {
    if (!mission.bossUnitId) {
      return nonSelfUnits.filter((unit) => unit.squad !== actor.squad);
    }
    const bossOnly = nonSelfUnits.filter((unit) => unit.id === mission.bossUnitId);
    return bossOnly.length > 0 ? bossOnly : nonSelfUnits.filter((unit) => unit.squad !== actor.squad);
  }

  if (mission.id === 'coop_then_reversal' && !mission.isReversalPhase) {
    return nonSelfUnits.filter((unit) => unit.role === 'boss' && unit.squad !== actor.squad);
  }

  return nonSelfUnits.filter((unit) => unit.squad !== actor.squad);
};

const getMissionAnchorTiles = (state: BotBattleState, hostileUnits: BotUnitSnapshot[]): Array<{ x: number; y: number }> => {
  const objectiveTiles = state.objectiveTiles.slice();
  const mission = state.mission;
  if (!mission || !mission.isRevealed) {
    return hostileUnits.map((unit) => ({ x: unit.tileX, y: unit.tileY }));
  }

  if (mission.id === 'coop_boss_kill') {
    const bossUnit = state.units.find((unit) => unit.id === mission.bossUnitId);
    if (bossUnit) {
      return [{ x: bossUnit.tileX, y: bossUnit.tileY }];
    }
    return objectiveTiles.length > 0 ? objectiveTiles : hostileUnits.map((unit) => ({ x: unit.tileX, y: unit.tileY }));
  }

  if (mission.id === 'relic_contest') {
    const relicHolder = state.units.find((unit) => unit.id === mission.relicHolderUnitId);
    if (relicHolder) {
      return [{ x: relicHolder.tileX, y: relicHolder.tileY }];
    }
    return objectiveTiles.length > 0 ? objectiveTiles : hostileUnits.map((unit) => ({ x: unit.tileX, y: unit.tileY }));
  }

  if (mission.id === 'coop_then_reversal') {
    return objectiveTiles.length > 0 ? objectiveTiles : hostileUnits.map((unit) => ({ x: unit.tileX, y: unit.tileY }));
  }

  return objectiveTiles.length > 0 ? objectiveTiles : hostileUnits.map((unit) => ({ x: unit.tileX, y: unit.tileY }));
};

const getNearestDistance = (x: number, y: number, anchors: Array<{ x: number; y: number }>): number => {
  if (anchors.length === 0) {
    return 0;
  }

  return anchors.reduce((best, anchor) => {
    return Math.min(best, getDistance(x, y, anchor.x, anchor.y));
  }, Number.POSITIVE_INFINITY);
};

const getLowestTieBreaker = (action: BotPlannedAction): string => {
  const moveKey = action.move ? `${action.move.x},${action.move.y}` : 'stay';
  const actionKey = action.option ? `${action.option.type}:${action.option.targetId}:${action.option.moduleId ?? 'none'}` : 'move-only';
  return `${moveKey}|${actionKey}`;
};

export class BotTurnPlanner {
  static chooseTurn(state: BotBattleState, profile: AiProfile): BotTurnDecision | null {
    const actor = state.units.find((unit) => unit.id === state.actorId);
    if (!actor) {
      throw new Error(`BotTurnPlanner actor "${state.actorId}" was not found.`);
    }

    const hostileUnits = getVisibleHostileUnits(state, actor);
    const alliedUnits = state.units.filter((unit) => unit.squad === actor.squad && unit.id !== actor.id);
    const anchors = getMissionAnchorTiles(state, hostileUnits);
    const currentEnemyDistance = getNearestDistance(actor.tileX, actor.tileY, hostileUnits.map((unit) => ({ x: unit.tileX, y: unit.tileY })));
    const currentAnchorDistance = getNearestDistance(actor.tileX, actor.tileY, anchors);
    const candidateTiles: BotReachableTile[] = [
      { x: actor.tileX, y: actor.tileY, path: [{ x: actor.tileX, y: actor.tileY }] },
      ...state.reachableTiles,
    ];

    const candidates: Array<ActionCandidate<BotPlannedAction>> = [];
    const currentPrimaryTargetIds = new Set(
      ActionResolver.getPrimaryActionOptions(
        toUnitActionState(actor),
        hostileUnits.map(toTargetState),
        {
          hasLineOfSight: state.hasLineOfSight,
        }
      ).map((option) => `${option.type}:${option.targetId}:${option.moduleId ?? 'none'}`)
    );

    const mission = state.mission;
    const isBossActor = actor.role === 'boss';
    const pressureStage = mission?.pressureStage ?? 0;
    const lowHealth = actor.maxHp > 0 && actor.hp / actor.maxHp <= (isBossActor ? 0.35 : 0.4);

    for (const tile of candidateTiles) {
      const actorAtTile = toUnitActionState(actor, { x: tile.x, y: tile.y });
      const primaryOptions = ActionResolver.getPrimaryActionOptions(
        actorAtTile,
        hostileUnits.map(toTargetState),
        {
          hasLineOfSight: state.hasLineOfSight,
        }
      );

      const tileEnemyDistance = getNearestDistance(tile.x, tile.y, hostileUnits.map((unit) => ({ x: unit.tileX, y: unit.tileY })));
      const tileAnchorDistance = getNearestDistance(tile.x, tile.y, anchors);
      const objectiveProgress = clamp(currentAnchorDistance - tileAnchorDistance, 0, 4);
      const positionalProgress = clamp(currentEnemyDistance - tileEnemyDistance, 0, 3);

      for (const option of primaryOptions) {
        const target = hostileUnits.find((unit) => unit.id === option.targetId);
        if (!target) {
          continue;
        }

        const estimatedDamage = estimateActionDamage(actor, option);
        const lethalBonus = target.hp <= estimatedDamage ? 2 : 0;
        const moved = tile.x !== actor.tileX || tile.y !== actor.tileY;
        const optionKey = `${option.type}:${option.targetId}:${option.moduleId ?? 'none'}`;
        const redundantMovePenalty = moved && currentPrimaryTargetIds.has(optionKey) ? 2 : 0;
        const targetAnchorsObjective = anchors.some((anchor) => anchor.x === target.tileX && anchor.y === target.tileY);
        const relicCarrierBonus = mission?.id === 'relic_contest' && mission.relicHolderUnitId === target.id ? 3 : 0;
        const reversalBonus = mission?.id === 'coop_then_reversal' && mission.isReversalPhase ? 1 : 0;
        const extractionDenyBonus = isBossActor && mission?.extractionUnlocked ? 1 : 0;

        const scores = isBossActor
          ? {
              objective: lowHealth
                ? (targetAnchorsObjective ? 0 : 0) + extractionDenyBonus
                : objectiveProgress + (targetAnchorsObjective ? 3 : 0) + clamp(pressureStage, 0, 3) + extractionDenyBonus,
              support: 0,
              threat: lowHealth ? lethalBonus : 3 + lethalBonus + clamp(pressureStage, 0, 2) + extractionDenyBonus,
              position: lowHealth ? (moved ? 0 : 1) : positionalProgress + (moved ? 0 : 1),
              escape: lowHealth && moved ? clamp(tileEnemyDistance - currentEnemyDistance, 0, 3) : 0,
              survival: lowHealth ? (moved ? 0 : 1) : 0,
            }
          : {
              objective: objectiveProgress + (targetAnchorsObjective ? 2 : 0) + relicCarrierBonus + reversalBonus - redundantMovePenalty,
              support: 0,
              threat: 4 + lethalBonus + (moved ? 0 : 1),
              position: positionalProgress,
              escape: 0,
              survival: 0,
            };

        const move = tile.x === actor.tileX && tile.y === actor.tileY ? null : tile;
        const plannedAction: BotPlannedAction = {
          kind: 'primary',
          move,
          option,
        };

        candidates.push({
          id: `primary:${tile.x},${tile.y}:${option.type}:${option.targetId}:${option.moduleId ?? 'none'}`,
          action: plannedAction,
          legal: true,
          summary: move
            ? `Move to (${tile.x},${tile.y}) then ${option.label} ${target.id}`
            : `${option.label} ${target.id}`,
          scores,
          tieBreaker: getLowestTieBreaker(plannedAction),
        });
      }

      if (tile.x === actor.tileX && tile.y === actor.tileY) {
        continue;
      }

      const adjacentHostiles = hostileUnits.filter((unit) => getDistance(tile.x, tile.y, unit.tileX, unit.tileY) <= 1).length;
      const retreatValue = lowHealth ? clamp(tileEnemyDistance - currentEnemyDistance, 0, isBossActor ? 4 : 3) : 0;
      const survivalValue = lowHealth
        ? clamp((tileEnemyDistance - adjacentHostiles) + (isBossActor && mission?.extractionUnlocked ? 1 : 0), 0, isBossActor ? 4 : 3)
        : 0;
      const anchoredBossPressure = isBossActor && !lowHealth && tileAnchorDistance <= 1 ? 2 : 0;
      const moveAction: BotPlannedAction = {
        kind: 'move',
        move: tile,
        option: null,
      };

      candidates.push({
        id: `move:${tile.x},${tile.y}`,
        action: moveAction,
        legal: actor.canMove,
        summary: `Advance to (${tile.x},${tile.y})`,
        scores: {
          objective: isBossActor
            ? lowHealth
              ? clamp(objectiveProgress - 1, 0, 3)
              : objectiveProgress + anchoredBossPressure
            : objectiveProgress,
          support: alliedUnits.length > 0 ? 0 : 0,
          threat: 0,
          position: isBossActor && !lowHealth ? positionalProgress + (tileAnchorDistance <= 1 ? 1 : 0) : positionalProgress,
          escape: retreatValue,
          survival: survivalValue,
        },
        tieBreaker: getLowestTieBreaker(moveAction),
      });
    }

    const context: DecisionContext = {
      actorId: actor.id,
      squadId: state.squadId,
      profileId: profile.id,
      turnNumber: state.turnNumber,
    };

    return AiPlanner.chooseAction(context, candidates, profile);
  }
}
