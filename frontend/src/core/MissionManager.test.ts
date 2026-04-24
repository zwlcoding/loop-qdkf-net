import { describe, it, expect, vi } from 'vitest';
import { MissionManager } from './MissionManager';
import type { MissionTemplate } from '../data/MissionTypes';

function makeTemplate(revealDelay = 30): MissionTemplate {
  return {
    id: 'coop_boss_kill',
    name: 'Boss Elimination',
    type: 'cooperative',
    description: 'Defeat the boss together',
    revealDelay,
    objectives: [{ type: 'defeat', target: 'boss', count: 1 }],
    extractionRules: {
      type: 'shared',
      trigger: 'objective_complete',
      timeout: 120,
      partialRetention: 0.5,
    },
    endgamePressure: {
      startTime: 600,
      escalationInterval: 60,
      collapseMechanic: 'corruption_spread',
    },
  };
}

function makeRelicTemplate(revealDelay = 0): MissionTemplate {
  return {
    id: 'relic_contest',
    name: 'Relic Contest',
    type: 'competitive',
    description: 'Capture and hold the relic',
    revealDelay,
    objectives: [{ type: 'capture', target: 'relic', count: 1 }],
    extractionRules: {
      type: 'priority',
      trigger: 'relic_carrier',
      timeout: 90,
      partialRetention: 0.3,
    },
    endgamePressure: {
      startTime: 600,
      escalationInterval: 45,
      collapseMechanic: 'zone_collapse',
    },
  };
}

function makeReversalTemplate(revealDelay = 0): MissionTemplate {
  return {
    id: 'coop_then_reversal',
    name: 'Coop Then Reversal',
    type: 'reversal',
    description: 'Cooperate then betray',
    revealDelay,
    phases: [
      {
        name: 'cooperation',
        objectives: [{ type: 'hold', target: 'extract', duration: 60 }],
      },
      {
        name: 'reversal',
        objectives: [{ type: 'extract', target: 'extract_point', capacity: 3 }],
      },
    ],
    extractionRules: {
      type: 'capacity_limited',
      trigger: 'phase_complete',
      timeout: 90,
      partialRetention: 0.4,
    },
    endgamePressure: {
      startTime: 600,
      escalationInterval: 60,
      collapseMechanic: 'boss_escalation',
    },
  };
}

describe('MissionManager', () => {
  it('starts in reconnaissance phase', () => {
    const manager = new MissionManager();
    manager.startMission(makeTemplate());

    expect(manager.isInReconnaissancePhase()).toBe(true);
    expect(manager.isMissionRevealed()).toBe(false);
    expect(manager.getRemainingRevealSeconds()).toBe(30);
  });

  it('counts down remaining reveal seconds', () => {
    const manager = new MissionManager();
    manager.startMission(makeTemplate());

    manager.update(5000); // 5 seconds
    expect(manager.getRemainingRevealSeconds()).toBe(25);
    expect(manager.isInReconnaissancePhase()).toBe(true);
  });

  it('reveals mission after delay expires', () => {
    const manager = new MissionManager();
    manager.startMission(makeTemplate());

    manager.update(30000); // 30 seconds
    expect(manager.isMissionRevealed()).toBe(true);
    expect(manager.isInReconnaissancePhase()).toBe(false);
    expect(manager.getRemainingRevealSeconds()).toBe(0);
  });

  it('reveals mission when crossing threshold across multiple updates', () => {
    const manager = new MissionManager();
    manager.startMission(makeTemplate());

    manager.update(10000);
    expect(manager.isMissionRevealed()).toBe(false);

    manager.update(15000);
    expect(manager.isMissionRevealed()).toBe(false);

    manager.update(5000);
    expect(manager.isMissionRevealed()).toBe(true);
  });

  it('calls onReveal callback once when mission is revealed', () => {
    const manager = new MissionManager();
    const onReveal = vi.fn();
    manager.onReveal(onReveal);
    manager.startMission(makeTemplate());

    manager.update(10000);
    expect(onReveal).not.toHaveBeenCalled();

    manager.update(30000);
    expect(onReveal).toHaveBeenCalledTimes(1);

    // Should not call again
    manager.update(5000);
    expect(onReveal).toHaveBeenCalledTimes(1);
  });

  it('exposes mission metadata in Chinese', () => {
    const manager = new MissionManager();
    manager.startMission(makeTemplate());

    expect(manager.getMissionId()).toBe('coop_boss_kill');
    expect(manager.getMissionName()).toBe('Boss Elimination');
    expect(manager.getMissionType()).toBe('合作');
    expect(manager.getMissionDescription()).toBe('Defeat the boss together');
  });

  it('tracks elapsed seconds', () => {
    const manager = new MissionManager();
    manager.startMission(makeTemplate());

    manager.update(5000);
    expect(manager.getElapsedSeconds()).toBe(5);

    manager.update(25000);
    expect(manager.getElapsedSeconds()).toBe(30);
  });

  it('returns null state before start', () => {
    const manager = new MissionManager();
    expect(manager.getState()).toBeNull();
    expect(manager.isMissionRevealed()).toBe(false);
    expect(manager.isInReconnaissancePhase()).toBe(false);
  });

  describe('coop_boss_kill objective text', () => {
    it('shows boss hp and completed text', () => {
      const manager = new MissionManager();
      manager.startMission(makeTemplate(0));
      manager.update(0);

      expect(manager.getCurrentObjectiveText()).toBe('合作击杀首领（500/500）');

      manager.applyBossDamage(150);
      expect(manager.getCurrentObjectiveText()).toBe('合作击杀首领（350/500）');

      manager.applyBossDamage(350);
      expect(manager.getCurrentObjectiveText()).toBe('[完成] 首领已被击败 — 撤离点：解锁（剩余 120 秒） | 全员可撤离');
    });
  });

  describe('relic_contest objective text', () => {
    it('shows holder text after capture and dropped text after clear', () => {
      const manager = new MissionManager();
      manager.startMission(makeRelicTemplate(0));
      manager.update(0);

      expect(manager.getCurrentObjectiveText()).toBe('夺取并持有遗物');

      manager.setRelicHolder('unit-1', 0);
      expect(manager.getCurrentObjectiveText()).toBe('遗物持有者：unit-1（队伍A） — 撤离点：解锁（剩余 90 秒） | 优先：unit-1（队伍A）');

      manager.setRelicHolder('unit-2', 1);
      expect(manager.getCurrentObjectiveText()).toBe('遗物持有者：unit-2（队伍B） — 撤离点：解锁（剩余 90 秒） | 优先：unit-2（队伍B）');

      manager.clearRelicHolder();
      expect(manager.getCurrentObjectiveText()).toBe('遗物已掉落——重新争夺');
    });
  });

  describe('coop_then_reversal objective text', () => {
    it('shows countdown text during cooperation phase', () => {
      const manager = new MissionManager();
      manager.startMission(makeReversalTemplate(0));
      manager.update(0);

      expect(manager.getCurrentObjectiveText()).toBe('合作阶段：坚守撤离点（剩余 60 秒）');

      manager.update(15000);
      expect(manager.getCurrentObjectiveText()).toBe('合作阶段：坚守撤离点（剩余 45 秒）');

      manager.update(44000);
      expect(manager.getCurrentObjectiveText()).toBe('合作阶段：坚守撤离点（剩余 1 秒）');
    });

    it('transitions to reversal phase and updates text', () => {
      const manager = new MissionManager();
      manager.startMission(makeReversalTemplate(0));
      manager.update(0);

      expect(manager.isInReversalPhase()).toBe(false);
      expect(manager.getCurrentObjectiveText()).toContain('合作阶段');

      manager.update(60000);
      expect(manager.isInReversalPhase()).toBe(true);
      expect(manager.getCurrentObjectiveText()).toBe('[反转] 撤离点：解锁（剩余 90 秒） | 剩余名额：3');
    });

    it('calls onPhaseChange callback when reversal triggers', () => {
      const manager = new MissionManager();
      const onPhaseChange = vi.fn();
      manager.onPhaseChange(onPhaseChange);
      manager.startMission(makeReversalTemplate(0));

      manager.update(30000);
      expect(onPhaseChange).not.toHaveBeenCalled();

      manager.update(30000);
      expect(onPhaseChange).toHaveBeenCalledTimes(1);
      expect(onPhaseChange).toHaveBeenCalledWith('reversal');

      // Should not call again
      manager.update(5000);
      expect(onPhaseChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('extraction gating', () => {
    it('coop_boss_kill: extraction locked until boss defeated, then shared unlock', () => {
      const manager = new MissionManager();
      manager.startMission(makeTemplate(0));
      manager.update(0);

      expect(manager.isExtractionUnlocked()).toBe(false);
      expect(manager.canUnitExtract('unit-a1', 0)).toBe(false);
      expect(manager.getExtractionStatusText()).toBe('撤离点：锁定');

      manager.applyBossDamage(500);
      expect(manager.isExtractionUnlocked()).toBe(true);
      expect(manager.canUnitExtract('unit-a1', 0)).toBe(true);
      expect(manager.canUnitExtract('unit-b1', 1)).toBe(true);
      expect(manager.getExtractionStatusText()).toBe('撤离点：解锁（剩余 120 秒） | 全员可撤离');

      expect(manager.extractUnit('unit-a1')).toBe(true);
      expect(manager.canUnitExtract('unit-a1', 0)).toBe(false);
      expect(manager.getExtractedUnitIds()).toContain('unit-a1');
    });

    it('relic_contest: extraction priority belongs to relic holder squad/unit', () => {
      const manager = new MissionManager();
      manager.startMission(makeRelicTemplate(0));
      manager.update(0);

      expect(manager.isExtractionUnlocked()).toBe(false);

      manager.setRelicHolder('unit-relic', 1);
      expect(manager.isExtractionUnlocked()).toBe(true);
      expect(manager.canUnitExtract('unit-relic', 1)).toBe(true);
      expect(manager.canUnitExtract('unit-other', 0)).toBe(false);
      expect(manager.getExtractionStatusText()).toBe('撤离点：解锁（剩余 90 秒） | 优先：unit-relic（队伍B）');

      // Changing holder shifts priority
      manager.setRelicHolder('unit-other', 0);
      expect(manager.canUnitExtract('unit-other', 0)).toBe(true);
      expect(manager.canUnitExtract('unit-relic', 1)).toBe(false);
    });

    it('coop_then_reversal: extraction locked before reversal, then capacity-limited after reversal', () => {
      const manager = new MissionManager();
      manager.startMission(makeReversalTemplate(0));
      manager.update(0);

      expect(manager.isExtractionUnlocked()).toBe(false);
      expect(manager.canUnitExtract('unit-a1', 0)).toBe(false);
      expect(manager.getExtractionCapacityRemaining()).toBe(3);

      manager.update(60000); // trigger reversal
      expect(manager.isInReversalPhase()).toBe(true);
      expect(manager.isExtractionUnlocked()).toBe(true);
      expect(manager.canUnitExtract('unit-a1', 0)).toBe(true);
      expect(manager.canUnitExtract('unit-b1', 1)).toBe(true);
      expect(manager.getExtractionCapacityRemaining()).toBe(3);

      expect(manager.extractUnit('unit-a1')).toBe(true);
      expect(manager.extractUnit('unit-a2')).toBe(true);
      expect(manager.extractUnit('unit-b1')).toBe(true);
      expect(manager.getExtractionCapacityRemaining()).toBe(0);
      expect(manager.canUnitExtract('unit-b2', 1)).toBe(false);
      expect(manager.extractUnit('unit-b2')).toBe(false);
    });
  });

  describe('endgame pressure transitions', () => {
    it('warns once threshold reached and escalates stage over time', () => {
      const manager = new MissionManager();
      const onWarning = vi.fn();
      manager.onPressureWarning(onWarning);
      manager.startMission(makeTemplate(0));

      // Before threshold
      manager.update(599000);
      expect(manager.getPressureStage()).toBe(0);
      expect(onWarning).not.toHaveBeenCalled();
      expect(manager.getEndgamePressureText()).toBe('区域稳定（距离压迫开始：1 秒）');

      // At threshold
      manager.update(1000);
      expect(manager.getPressureStage()).toBe(1);
      expect(onWarning).toHaveBeenCalledTimes(1);
      expect(manager.getEndgamePressureText()).toBe('[警告] 腐化蔓延 开始扩散');

      // First escalation
      manager.update(60000);
      expect(manager.getPressureStage()).toBe(2);
      expect(manager.getEndgamePressureText()).toBe('[压迫阶段 2] 腐化蔓延 加剧中');

      // Second escalation
      manager.update(60000);
      expect(manager.getPressureStage()).toBe(3);
      expect(manager.getEndgamePressureText()).toBe('[压迫阶段 3] 腐化蔓延 加剧中');
    });

    it('collapses after max stages and fires callback', () => {
      const manager = new MissionManager();
      const onCollapse = vi.fn();
      manager.onCollapse(onCollapse);
      manager.startMission(makeTemplate(0));

      // Advance to collapse: start 600s + 4 intervals of 60s = 840s to reach stage 5
      manager.update(840000);
      expect(manager.isCollapsed()).toBe(true);
      expect(onCollapse).toHaveBeenCalledTimes(1);
      expect(manager.getEndgamePressureText()).toBe('[区域崩溃] 腐化蔓延 — 任务即将强制结束');

      // Stage should not increase beyond collapse
      manager.update(60000);
      expect(manager.isCollapsed()).toBe(true);
      expect(manager.getPressureStage()).toBe(5);
    });

    it('uses correct Chinese labels for different collapse mechanics', () => {
      const relicTemplate = makeRelicTemplate(0);
      const manager = new MissionManager();
      manager.startMission(relicTemplate);
      manager.update(600000);
      expect(manager.getEndgamePressureText()).toContain('区域崩塌');

      const reversalTemplate = makeReversalTemplate(0);
      const manager2 = new MissionManager();
      manager2.startMission(reversalTemplate);
      manager2.update(600000);
      expect(manager2.getEndgamePressureText()).toContain('首领狂暴');
    });
  });
});
