import { Unit } from '../entities/Unit';

export class TurnManager {
  private units: Unit[] = [];
  private turnOrder: Unit[] = [];
  private currentTurnIndex: number = -1;
  private activeUnit: Unit | null = null;

  addUnit(unit: Unit): void {
    this.units.push(unit);
    this.calculateTurnOrder();
  }

  removeUnit(unit: Unit): void {
    const index = this.units.indexOf(unit);
    if (index >= 0) {
      this.units.splice(index, 1);
      this.calculateTurnOrder();
    }
  }

  private calculateTurnOrder(): void {
    // Sort by speed/initiative
    this.turnOrder = [...this.units].sort((a, b) => {
      return b.getSpeed() - a.getSpeed();
    });
  }

  startNextTurn(): Unit | null {
    this.currentTurnIndex++;
    
    if (this.currentTurnIndex >= this.turnOrder.length) {
      this.currentTurnIndex = 0;
      this.calculateTurnOrder(); // Recalculate for dynamic initiative
    }
    
    this.activeUnit = this.turnOrder[this.currentTurnIndex];
    if (this.activeUnit && this.activeUnit.isAlive()) {
      this.activeUnit.startTurn();
      return this.activeUnit;
    } else if (this.activeUnit) {
      // Skip dead units
      return this.startNextTurn();
    }
    
    return null;
  }

  getActiveUnit(): Unit | null {
    return this.activeUnit;
  }

  getTurnOrder(): Unit[] {
    return [...this.turnOrder];
  }

  endCurrentTurn(): void {
    if (this.activeUnit) {
      this.activeUnit.endTurn();
    }
    this.startNextTurn();
  }
}
