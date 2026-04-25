import { RunProgression, type ExtractionPayout } from './RunProgression';
import type { BattleSetup } from './BattleSetup';

export interface BattleResultInput {
  setup: BattleSetup;
  durationSeconds: number;
  objectiveCompleted: boolean;
  extractedUnitIds: string[];
  survivingUnitIds: string[];
  winningSquadId: number | null;
  extractionPayout: ExtractionPayout;
}

export interface BattleResultSquadSummary {
  squadId: number;
  squadName: string;
  totalUnits: number;
  survivingUnits: number;
  extractedUnits: number;
  eliminatedUnits: number;
  scrapEarned: number;
  convertedScrap: number;
  retainedScrap: number;
  outcome: 'victory' | 'defeat' | 'draw';
}

export interface BattleResultSummary {
  durationSeconds: number;
  objectiveCompleted: boolean;
  squads: BattleResultSquadSummary[];
}

const EMPTY_UNLOCKS: [] = [];

export const resolveWinningSquadId = (
  setup: BattleSetup,
  survivingOrExtractedUnitIds: string[],
): number | null => {
  const activeSquadIds = setup.squads
    .filter((squad) => squad.units.some((unit) => survivingOrExtractedUnitIds.includes(unit.id)))
    .map((squad) => squad.id);

  const squad0Active = activeSquadIds.includes(0);
  const squad1Active = activeSquadIds.includes(1);

  if (squad0Active === squad1Active) {
    return null;
  }

  return squad0Active ? 0 : 1;
};

const calculateSquadScrap = (survivingUnits: number, extractedUnits: number, objectiveCompleted: boolean): number => {
  return survivingUnits * 10 + extractedUnits * 20 + (objectiveCompleted ? 30 : 0);
};

export const createBattleResultSummary = (input: BattleResultInput): BattleResultSummary => {
  const squads = input.setup.squads.map<BattleResultSquadSummary>((squad) => {
    const squadUnitIds = squad.units.map((unit) => unit.id);
    const survivingUnits = squadUnitIds.filter((unitId) => input.survivingUnitIds.includes(unitId)).length;
    const extractedUnits = squadUnitIds.filter((unitId) => input.extractedUnitIds.includes(unitId)).length;
    const totalUnits = squadUnitIds.length;
    const eliminatedUnits = totalUnits - survivingUnits;
    const scrapEarned = calculateSquadScrap(survivingUnits, extractedUnits, input.objectiveCompleted);
    const progression = new RunProgression(input.extractionPayout, EMPTY_UNLOCKS);
    progression.earn(scrapEarned, 0);
    const extractionSucceeded = extractedUnits > 0 && input.objectiveCompleted;
    const payout = progression.resolveExtraction(extractionSucceeded);

    return {
      squadId: squad.id,
      squadName: squad.name,
      totalUnits,
      survivingUnits,
      extractedUnits,
      eliminatedUnits,
      scrapEarned,
      convertedScrap: payout.convertedScrap,
      retainedScrap: payout.retainedScrap,
      outcome: input.winningSquadId === null ? 'draw' : input.winningSquadId === squad.id ? 'victory' : 'defeat',
    };
  });

  return {
    durationSeconds: input.durationSeconds,
    objectiveCompleted: input.objectiveCompleted,
    squads,
  };
};

export const getBattleResultSummaryText = (summary: BattleResultSummary): string => {
  const durationMinutes = Math.floor(summary.durationSeconds / 60);
  const durationRemainder = summary.durationSeconds % 60;
  const lines = [
    '对局结算',
    `时长：${durationMinutes}分${durationRemainder.toString().padStart(2, '0')}秒`,
    `任务目标：${summary.objectiveCompleted ? '完成' : '未完成'}`,
  ];

  summary.squads.forEach((squad) => {
    lines.push(
      `${squad.squadName}｜${squad.outcome === 'victory' ? '胜利' : squad.outcome === 'defeat' ? '失败' : '平局'}`,
      `生存 ${squad.survivingUnits}/${squad.totalUnits} ｜ 撤离 ${squad.extractedUnits} ｜ 击坠 ${squad.eliminatedUnits}`,
      `废料 ${squad.scrapEarned} ｜ 转化 ${squad.convertedScrap} ｜ 保留 ${squad.retainedScrap}`,
    );
  });

  lines.push('按 R 返回设置');
  return lines.join('\n');
};
