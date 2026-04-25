import type { ActionCandidate } from './ActionCandidate';
import type { AiProfile } from './AiProfiles';
import type { DecisionContext } from './DecisionContext';
import { SCORE_DIMENSIONS, createZeroBreakdown, type ScoreBreakdown } from './ScoreWeights';

export interface AiDecision<TAction = unknown> {
  context: DecisionContext;
  profile: AiProfile;
  candidate: ActionCandidate<TAction>;
  totalScore: number;
  breakdown: ScoreBreakdown;
  explanation: string;
  evaluatedCandidateIds: string[];
  excludedCandidateIds: string[];
}

const compareCandidates = <TAction>(
  left: ActionCandidate<TAction>,
  right: ActionCandidate<TAction>,
  leftScore: number,
  rightScore: number
): number => {
  if (leftScore !== rightScore) {
    return rightScore - leftScore;
  }

  const leftTieBreaker = left.tieBreaker ?? left.id;
  const rightTieBreaker = right.tieBreaker ?? right.id;
  const tieBreakerComparison = leftTieBreaker.localeCompare(rightTieBreaker);
  if (tieBreakerComparison !== 0) {
    return tieBreakerComparison;
  }

  return left.id.localeCompare(right.id);
};

export class AiPlanner {
  static chooseAction<TAction>(
    context: DecisionContext,
    candidates: ActionCandidate<TAction>[],
    profile: AiProfile
  ): AiDecision<TAction> | null {
    if (context.profileId !== profile.id) {
      throw new Error(`DecisionContext profileId "${context.profileId}" does not match planner profile "${profile.id}".`);
    }

    const legalCandidates = candidates.filter((candidate) => candidate.legal);
    if (legalCandidates.length === 0) {
      return null;
    }

    const scoredCandidates = legalCandidates.map((candidate) => ({
      candidate,
      breakdown: this.getScoreBreakdown(candidate, profile),
    }));

    scoredCandidates.sort((left, right) => {
      return compareCandidates(
        left.candidate,
        right.candidate,
        this.getTotalScore(left.breakdown),
        this.getTotalScore(right.breakdown)
      );
    });

    const best = scoredCandidates[0];
    const totalScore = this.getTotalScore(best.breakdown);

    return {
      context,
      profile,
      candidate: best.candidate,
      totalScore,
      breakdown: best.breakdown,
      explanation: this.buildExplanation(best.candidate, profile, best.breakdown, totalScore),
      evaluatedCandidateIds: scoredCandidates.map(({ candidate }) => candidate.id),
      excludedCandidateIds: candidates.filter((candidate) => !candidate.legal).map((candidate) => candidate.id),
    };
  }

  static getScoreBreakdown<TAction>(candidate: ActionCandidate<TAction>, profile: AiProfile): ScoreBreakdown {
    const breakdown = createZeroBreakdown();

    for (const dimension of SCORE_DIMENSIONS) {
      const rawScore = candidate.scores[dimension] ?? 0;
      breakdown[dimension] = rawScore * profile.weights[dimension];
    }

    return breakdown;
  }

  static getTotalScore(breakdown: ScoreBreakdown): number {
    return SCORE_DIMENSIONS.reduce((total, dimension) => total + breakdown[dimension], 0);
  }

  private static buildExplanation<TAction>(
    candidate: ActionCandidate<TAction>,
    profile: AiProfile,
    breakdown: ScoreBreakdown,
    totalScore: number
  ): string {
    const parts = SCORE_DIMENSIONS.map((dimension) => {
      const rawScore = candidate.scores[dimension] ?? 0;
      const weight = profile.weights[dimension];
      return `${dimension}: ${rawScore} × ${weight} = ${breakdown[dimension]}`;
    });

    return `${profile.id} -> ${candidate.id} (${candidate.summary}) => ${totalScore} [${parts.join(', ')}]`;
  }
}
