import { describe, expect, it } from 'vitest';
import { createBattleResultSummary, getBattleResultSummaryText, resolveWinningSquadId, type BattleResultInput } from './BattleResultSummary';
import type { BattleSetup } from './BattleSetup';

const setup: BattleSetup = {
  version: 1,
  source: 'local-setup',
  missionTemplateId: 'coop_boss_kill',
  boss: { enabled: true },
  squads: [
    {
      id: 0,
      name: 'Alpha',
      control: 'human',
      units: [
        { id: 'a-1', label: 'A1', chassisId: 'vanguard', tile: { x: 2, y: 5 }, moduleIds: ['slash'] },
        { id: 'a-2', label: 'A2', chassisId: 'support', tile: { x: 3, y: 4 }, moduleIds: ['heal'] },
      ],
    },
    {
      id: 1,
      name: 'Bravo',
      control: 'ai',
      units: [
        { id: 'b-1', label: 'B1', chassisId: 'skirmisher', tile: { x: 13, y: 5 }, moduleIds: ['slash'] },
        { id: 'b-2', label: 'B2', chassisId: 'controller', tile: { x: 12, y: 4 }, moduleIds: ['heal'] },
      ],
    },
  ],
};

const makeInput = (): BattleResultInput => ({
  setup,
  durationSeconds: 187,
  objectiveCompleted: true,
  extractedUnitIds: ['a-1'],
  survivingUnitIds: ['a-1', 'a-2', 'b-2'],
  winningSquadId: 0,
  extractionPayout: {
    conversionRate: 0.5,
    partialRetention: 0.25,
    minimumPayout: 10,
  },
});

describe('BattleResultSummary', () => {
  it('summarizes both squads with survival, extraction, objective, and payout conversion', () => {
    const summary = createBattleResultSummary(makeInput());

    expect(summary.objectiveCompleted).toBe(true);
    expect(summary.durationSeconds).toBe(187);
    expect(summary.squads).toHaveLength(2);
    expect(summary.squads[0]).toMatchObject({
      squadId: 0,
      survivingUnits: 2,
      extractedUnits: 1,
      eliminatedUnits: 0,
      convertedScrap: 35,
      retainedScrap: 0,
      outcome: 'victory',
    });
    expect(summary.squads[1]).toMatchObject({
      squadId: 1,
      survivingUnits: 1,
      extractedUnits: 0,
      eliminatedUnits: 1,
      convertedScrap: 0,
      retainedScrap: 10,
      outcome: 'defeat',
    });
  });

  it('renders a concise summary text block for the overlay', () => {
    const text = getBattleResultSummaryText(createBattleResultSummary(makeInput()));
    expect(text).toContain('对局结算');
    expect(text).toContain('任务目标：完成');
    expect(text).toContain('Alpha');
    expect(text).toContain('Bravo');
    expect(text).toContain('转化');
    expect(text).toContain('撤离');
  });

  it('keeps extracted squads eligible when resolving the winner', () => {
    expect(resolveWinningSquadId(setup, ['a-1'])).toBe(0);
    expect(resolveWinningSquadId(setup, ['b-2'])).toBe(1);
    expect(resolveWinningSquadId(setup, ['a-1', 'b-2'])).toBe(null);
    expect(resolveWinningSquadId(setup, [])).toBe(null);
  });

  it('falls back to retention when the objective fails', () => {
    const summary = createBattleResultSummary({
      ...makeInput(),
      objectiveCompleted: false,
      extractedUnitIds: [],
      survivingUnitIds: ['b-2'],
      winningSquadId: 1,
    });

    expect(summary.squads[0].convertedScrap).toBe(0);
    expect(summary.squads[0].retainedScrap).toBe(0);
    expect(summary.squads[1].convertedScrap).toBe(0);
    expect(summary.squads[1].retainedScrap).toBe(2);
  });

  it('requires an extracted unit before awarding converted scrap', () => {
    const summary = createBattleResultSummary({
      ...makeInput(),
      extractedUnitIds: [],
      survivingUnitIds: ['a-1', 'a-2', 'b-2'],
      winningSquadId: 0,
    });

    expect(summary.squads[0].convertedScrap).toBe(0);
    expect(summary.squads[0].retainedScrap).toBe(12);
  });
});
