import type { ScoreWeights } from './ScoreWeights';

export interface ActionCandidate<TAction = unknown> {
  id: string;
  action: TAction;
  legal: boolean;
  summary: string;
  scores: Partial<ScoreWeights>;
  tieBreaker?: string;
}
