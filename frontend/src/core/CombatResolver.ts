import { Unit, FacingDirection } from '../entities/Unit';
import { GridMap } from './GridMap';

export type AttackArc = 'front' | 'side' | 'rear';

export interface CombatModifiers {
  hitBonus: number;
  damageBonus: number;
  defenseBonus: number;
}

export interface KnockbackOutcome {
  finalX: number;
  finalY: number;
  travelled: number;
  collided: boolean;
  collisionDamage: number;
  fallDistance: number;
  fallDamage: number;
  hazardDamage: number;
  hazardType?: string;
  blockedBy?: 'edge' | 'impassable';
}

export class CombatResolver {
  private static readonly COLLISION_DAMAGE = 8;
  private static readonly FALL_DAMAGE_PER_LEVEL = 5;
  private static readonly HAZARD_DAMAGE = 6;

  private gridMap: GridMap;

  constructor(gridMap: GridMap) {
    this.gridMap = gridMap;
  }

  getAttackArc(attacker: Unit, defender: Unit): AttackArc {
    const dx = attacker.getTileX() - defender.getTileX();
    const dy = attacker.getTileY() - defender.getTileY();

    const defenderFacing = defender.getFacing();

    let relativeDx = dx;
    let relativeDy = dy;

    switch (defenderFacing) {
      case 'north':
        relativeDx = dx;
        relativeDy = -dy;
        break;
      case 'south':
        relativeDx = -dx;
        relativeDy = dy;
        break;
      case 'east':
        relativeDx = dy;
        relativeDy = -dx;
        break;
      case 'west':
        relativeDx = -dy;
        relativeDy = dx;
        break;
    }

    if (relativeDy > 0 && Math.abs(relativeDx) <= relativeDy) {
      return 'front';
    }

    if (relativeDy < 0 && Math.abs(relativeDx) <= Math.abs(relativeDy)) {
      return 'rear';
    }

    return 'side';
  }

  calculateCombatModifiers(attacker: Unit, defender: Unit): CombatModifiers {
    const arc = this.getAttackArc(attacker, defender);
    const heightDiff = this.getHeightDifference(attacker, defender);

    const modifiers: CombatModifiers = {
      hitBonus: 0,
      damageBonus: 0,
      defenseBonus: 0,
    };

    switch (arc) {
      case 'side':
        modifiers.hitBonus += 10;
        modifiers.damageBonus += 2;
        break;
      case 'rear':
        modifiers.hitBonus += 20;
        modifiers.damageBonus += 5;
        modifiers.defenseBonus -= 3;
        break;
      default:
        break;
    }

    if (heightDiff > 0) {
      modifiers.hitBonus += heightDiff * 3;
      modifiers.damageBonus += heightDiff * 2;
    } else if (heightDiff < 0) {
      modifiers.hitBonus += heightDiff * 2;
      modifiers.damageBonus += heightDiff;
    }

    return modifiers;
  }

  getHeightDifference(unitA: Unit, unitB: Unit): number {
    const heightA = this.gridMap.getHeight(unitA.getTileX(), unitA.getTileY());
    const heightB = this.gridMap.getHeight(unitB.getTileX(), unitB.getTileY());
    return heightA - heightB;
  }

  calculateDamage(attacker: Unit, defender: Unit, baseDamage: number): number {
    const modifiers = this.calculateCombatModifiers(attacker, defender);
    const damage = Math.max(1, baseDamage + modifiers.damageBonus - (defender.getDefense() + modifiers.defenseBonus));
    return damage;
  }

  calculateHitChance(attacker: Unit, defender: Unit, baseHitChance: number = 80): number {
    const modifiers = this.calculateCombatModifiers(attacker, defender);
    return Math.max(5, Math.min(95, baseHitChance + modifiers.hitBonus));
  }

  resolveHit(attacker: Unit, defender: Unit, baseHitChance: number = 80): boolean {
    const hitChance = this.calculateHitChance(attacker, defender, baseHitChance);
    return Math.random() * 100 < hitChance;
  }

  getDirection(from: Unit, to: Unit): FacingDirection {
    const dx = to.getTileX() - from.getTileX();
    const dy = to.getTileY() - from.getTileY();

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'east' : 'west';
    }

    return dy > 0 ? 'south' : 'north';
  }

  resolveKnockback(attacker: Unit, defender: Unit, distance: number): KnockbackOutcome {
    const direction = this.getDirection(attacker, defender);
    const step = this.facingToVector(direction);

    let currentX = defender.getTileX();
    let currentY = defender.getTileY();
    let travelled = 0;
    let collided = false;
    let collisionDamage = 0;
    let fallDistance = 0;
    let fallDamage = 0;
    let blockedBy: KnockbackOutcome['blockedBy'];

    for (let i = 0; i < distance; i++) {
      const nextX = currentX + step.dx;
      const nextY = currentY + step.dy;
      const currentTile = this.gridMap.getTile(currentX, currentY);
      const nextTile = this.gridMap.getTile(nextX, nextY);

      if (!nextTile) {
        collided = true;
        collisionDamage += CombatResolver.COLLISION_DAMAGE;
        blockedBy = 'edge';
        break;
      }

      if (!nextTile.walkable) {
        collided = true;
        collisionDamage += CombatResolver.COLLISION_DAMAGE;
        blockedBy = 'impassable';
        break;
      }

      if (currentTile) {
        const drop = Math.max(0, currentTile.height - nextTile.height);
        if (drop >= 2) {
          fallDistance += drop;
          fallDamage += drop * CombatResolver.FALL_DAMAGE_PER_LEVEL;
        }
      }

      currentX = nextX;
      currentY = nextY;
      travelled += 1;
    }

    const landingTile = this.gridMap.getTile(currentX, currentY);
    const onObjective = Boolean(landingTile?.objectiveId);
    const inHazard = landingTile?.terrainFlags.includes('hazard') || Boolean(landingTile?.hazardType);
    const hazardType = landingTile?.hazardType ?? (onObjective ? 'objective-zone' : undefined);
    const hazardDamage = inHazard ? CombatResolver.HAZARD_DAMAGE : 0;

    return {
      finalX: currentX,
      finalY: currentY,
      travelled,
      collided,
      collisionDamage,
      fallDistance,
      fallDamage,
      hazardDamage,
      hazardType,
      blockedBy,
    };
  }

  private facingToVector(direction: FacingDirection): { dx: number; dy: number } {
    switch (direction) {
      case 'north':
        return { dx: 0, dy: -1 };
      case 'south':
        return { dx: 0, dy: 1 };
      case 'east':
        return { dx: 1, dy: 0 };
      case 'west':
        return { dx: -1, dy: 0 };
    }
  }
}
