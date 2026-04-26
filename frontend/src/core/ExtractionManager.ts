import { Mission, Reward } from "../data/MissionTypes";
import { Unit } from "../entities/Unit";

export interface ExtractionResult {
  success: boolean;
  rewards: Reward[];
  reason: string;
}

export class ExtractionManager {
  private mission: Mission;
  private currentTurn: number = 0;

  constructor(mission: Mission) {
    this.mission = mission;
  }

  incrementTurn(): void {
    this.currentTurn++;
  }

  isExtractionAvailable(): boolean {
    return this.currentTurn >= this.mission.extractionTurn;
  }

  getCurrentTurn(): number {
    return this.currentTurn;
  }

  evaluateExtraction(survivingUnits: Unit[]): ExtractionResult {
    if (survivingUnits.length === 0) {
      return {
        success: false,
        rewards: [],
        reason: "No surviving units — extraction failed.",
      };
    }

    return {
      success: true,
      rewards: this.calculateRewards(survivingUnits, survivingUnits.length),
      reason: `${survivingUnits.length} unit(s) extracted successfully.`,
    };
  }

  calculateRewards(survivingUnits: Unit[], totalUnits: number): Reward[] {
    const difficultyMultiplier: Record<Mission["difficulty"], number> = {
      easy: 1.0,
      normal: 1.5,
      hard: 2.0,
    };

    const multiplier = difficultyMultiplier[this.mission.difficulty];
    const survivalRatio =
      totalUnits > 0 ? survivingUnits.length / totalUnits : 0;
    const survivalBonus = survivalRatio * 0.5;
    const totalMultiplier = multiplier + survivalBonus;

    return this.mission.rewards.map((reward) => {
      if (reward.type === "unlock") {
        // Unlock rewards are not scaled by difficulty or survival;
        // they are granted once when extraction succeeds.
        return { ...reward };
      }
      return {
        ...reward,
        amount: Math.round(reward.amount * totalMultiplier),
      };
    });
  }
}
