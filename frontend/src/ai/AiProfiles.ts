import type { ScoreWeights } from './ScoreWeights';

export interface AiProfile {
  id: string;
  description: string;
  weights: ScoreWeights;
}

export const AiProfiles = {
  coop_squad: {
    id: 'coop_squad',
    description: 'Balances mission progress, support, and staying power.',
    weights: {
      objective: 2,
      support: 1.5,
      threat: 1.5,
      position: 1,
      escape: 0.5,
      survival: 3,
    },
  },
  aggressive_rival: {
    id: 'aggressive_rival',
    description: 'Pressures contested objectives and favors threat removal.',
    weights: {
      objective: 2.75,
      support: 0.5,
      threat: 2,
      position: 1,
      escape: 0.25,
      survival: 1.5,
    },
  },
  reversal_squad: {
    id: 'reversal_squad',
    description: 'Shifts toward extraction denial and self-preservation after reversal.',
    weights: {
      objective: 2.5,
      support: 0.75,
      threat: 1.75,
      position: 1,
      escape: 1.5,
      survival: 2.25,
    },
  },
  boss_guardian: {
    id: 'boss_guardian',
    description: 'Anchors the objective space, creates pressure, and preserves itself at danger thresholds.',
    weights: {
      objective: 2.5,
      support: 0,
      threat: 2.5,
      position: 1.25,
      escape: 1.5,
      survival: 3,
    },
  },
} satisfies Record<string, AiProfile>;

export type AiProfileId = keyof typeof AiProfiles;
