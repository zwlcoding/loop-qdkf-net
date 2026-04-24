export interface ChassisDefinition {
  id: string;
  name: string;
  role: string;
  baseStats: {
    hp: number;
    move: number;
    jump: number;
    speed: number;
    attack: number;
    defense: number;
  };
  slotBias: {
    active: number;
    passive: number;
    combo: number;
    tool: number;
  };
}

export interface ChassisData {
  chassis: ChassisDefinition[];
}
