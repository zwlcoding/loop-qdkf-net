export type ScoreDimension = 'objective' | 'support' | 'threat' | 'position' | 'escape' | 'survival';

export type ScoreWeights = Record<ScoreDimension, number>;

export type ScoreBreakdown = Record<ScoreDimension, number>;

export const SCORE_DIMENSIONS: ScoreDimension[] = [
  'objective',
  'support',
  'threat',
  'position',
  'escape',
  'survival',
];

export const createZeroBreakdown = (): ScoreBreakdown => ({
  objective: 0,
  support: 0,
  threat: 0,
  position: 0,
  escape: 0,
  survival: 0,
});
