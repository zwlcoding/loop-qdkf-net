export interface SquadComboState {
  current: number;
  max: number;
}

export class SquadComboResource {
  private readonly states = new Map<number, SquadComboState>();

  constructor(initialAmount: number, squads: number[]) {
    const normalizedAmount = Math.max(0, Math.round(initialAmount));

    squads.forEach((squad) => {
      this.states.set(squad, {
        current: normalizedAmount,
        max: normalizedAmount,
      });
    });
  }

  getState(squad: number): SquadComboState {
    return this.states.get(squad) ?? { current: 0, max: 0 };
  }

  spend(squad: number, amount: number): boolean {
    const state = this.states.get(squad);
    const cost = Math.max(0, Math.round(amount));

    if (!state || cost > state.current) {
      return false;
    }

    state.current -= cost;
    return true;
  }
}
