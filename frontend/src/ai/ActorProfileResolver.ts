import { AiProfiles, type AiProfile } from './AiProfiles';
import type { BotBattleState } from './BotTurnPlanner';

export const resolveActorProfile = (state: BotBattleState): AiProfile => {
  const actor = state.units.find((unit) => unit.id === state.actorId);
  if (!actor) {
    throw new Error(`resolveActorProfile actor "${state.actorId}" was not found.`);
  }

  if (actor.role === 'boss') {
    return AiProfiles.boss_guardian;
  }

  const mission = state.mission;
  if (!mission) {
    return AiProfiles.coop_squad;
  }

  if (mission.id === 'relic_contest') {
    return AiProfiles.aggressive_rival;
  }

  if (mission.id === 'coop_then_reversal' && mission.isReversalPhase) {
    return AiProfiles.reversal_squad;
  }

  return AiProfiles.coop_squad;
};
