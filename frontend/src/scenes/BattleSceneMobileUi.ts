export type BattleSceneActionMode = 'move' | 'basic' | 'skill' | 'combo' | 'tool';

export interface BattleSceneMobileContext {
  isPortrait: boolean;
  activeUnitLabel: string;
  selectedUnitLabel: string | null;
  actionMode: BattleSceneActionMode;
  canMove: boolean;
  hasPrimaryActionRemaining: boolean;
  hasToolOpportunityRemaining: boolean;
  hasComboModule: boolean;
  hasSkillModule: boolean;
  hasToolModule: boolean;
  extractionAvailable?: boolean;
}

export interface BattleSceneActionBarAction {
  id: 'move' | 'basic' | 'skill' | 'tool' | 'combo' | 'cancel' | 'endTurn' | 'extract';
  label: string;
  enabled: boolean;
  selected: boolean;
}

export interface BattleSceneLayoutResult {
  hud: {
    position: { x: number; y: number };
    wrapWidth: number;
    compact: boolean;
    fontSize: number;
  };
  log: {
    position: { x: number; y: number };
    wrapWidth: number;
    maxLines: number;
    fontSize: number;
  };
  debug: {
    position: { x: number; y: number };
    wrapWidth: number;
  };
  actionBar: {
    position: { x: number; y: number };
    width: number;
    buttonHeight: number;
    gap: number;
    visible: boolean;
  };
  battleViewport: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export function getBattleSceneActionBarState(context: BattleSceneMobileContext): BattleSceneActionBarAction[] {
  const hasSelection = Boolean(context.selectedUnitLabel);
  return [
    { id: 'move', label: '移动', enabled: hasSelection && context.canMove, selected: context.actionMode === 'move' },
    { id: 'basic', label: '普攻', enabled: hasSelection && context.hasPrimaryActionRemaining, selected: context.actionMode === 'basic' },
    {
      id: 'skill',
      label: '技能',
      enabled: hasSelection && context.hasPrimaryActionRemaining && context.hasSkillModule,
      selected: context.actionMode === 'skill',
    },
    {
      id: 'tool',
      label: '道具',
      enabled: hasSelection && context.hasToolOpportunityRemaining && context.hasToolModule,
      selected: context.actionMode === 'tool',
    },
    {
      id: 'combo',
      label: '连携',
      enabled: hasSelection && context.hasPrimaryActionRemaining && context.hasComboModule,
      selected: context.actionMode === 'combo',
    },
    { id: 'cancel', label: '取消', enabled: hasSelection, selected: false },
    { id: 'endTurn', label: '结束', enabled: hasSelection, selected: false },
    { id: 'extract', label: '提取', enabled: Boolean(context.extractionAvailable), selected: false },
  ];
}

export function getBattleSceneGuidanceText(context: BattleSceneMobileContext): string {
  if (context.isPortrait) {
    if (!context.selectedUnitLabel) {
      return `轮到 ${context.activeUnitLabel} 了，先轻点它，再从下方按钮里选移动、普攻、技能、道具、连携或结束回合。`;
    }

    switch (context.actionMode) {
      case 'move':
        return `${context.selectedUnitLabel} 已选中，轻点蓝色可达格移动；不想走位就直接点下方按钮继续行动。`;
      case 'basic':
        return `已切到普攻，轻点红色高亮敌人出手；想换别的操作就点下方按钮。`;
      case 'skill':
        return `已切到技能，轻点能命中的目标释放；如果想重选，点“取消”回到移动。`;
      case 'tool':
        return `已切到道具，轻点合法目标使用；不合适就点“取消”重新选。`;
      case 'combo':
        return `已切到连携，轻点可连携的目标发起；拿不准时点“取消”回到移动。`;
    }
  }

  if (!context.selectedUnitLabel) {
    return `先点当前回合单位 ${context.activeUnitLabel}，再用 M / 1 / 2 / 3 / 4 / C / E 切换操作。`;
  }

  return `已选中 ${context.selectedUnitLabel}，可用 M移动、1普攻、2技能、3道具、4/C连携、E结束回合。`;
}

export function getBattleSceneLayout(args: {
  width: number;
  height: number;
  isPortrait: boolean;
  debugVisible: boolean;
}): BattleSceneLayoutResult {
  const { width, height, isPortrait } = args;
  if (isPortrait) {
    const hudWrapWidth = Math.max(248, width - 24);
    const actionBarWidth = Math.max(248, width - 24);
    const actionBarY = Math.max(0, height - 164);
    const logY = Math.max(96, actionBarY - 94);
    const battleTop = 184;
    const battleBottom = Math.max(battleTop + 240, logY - 14);
    return {
      hud: {
        position: { x: 12, y: 12 },
        wrapWidth: hudWrapWidth,
        compact: true,
        fontSize: 12,
      },
      log: {
        position: { x: 12, y: logY },
        wrapWidth: hudWrapWidth,
        maxLines: 3,
        fontSize: 11,
      },
      debug: {
        position: { x: 12, y: Math.min(height - 224, logY - 140) },
        wrapWidth: Math.max(220, width - 32),
      },
      actionBar: {
        position: { x: 12, y: actionBarY },
        width: actionBarWidth,
        buttonHeight: 42,
        gap: 8,
        visible: true,
      },
      battleViewport: {
        x: 0,
        y: battleTop,
        width,
        height: Math.max(240, battleBottom - battleTop),
      },
    };
  }

  return {
    hud: {
      position: { x: 16, y: 16 },
      wrapWidth: 460,
      compact: false,
      fontSize: 14,
    },
    log: {
      position: { x: 16, y: 128 },
      wrapWidth: 460,
      maxLines: 6,
      fontSize: 13,
    },
    debug: {
      position: { x: 500, y: 16 },
      wrapWidth: 280,
    },
    actionBar: {
      position: { x: 0, y: height },
      width: 0,
      buttonHeight: 0,
      gap: 0,
      visible: false,
    },
    battleViewport: {
      x: 0,
      y: 0,
      width,
      height,
    },
  };
}

export function calculateBattleMapTileSize(args: {
  viewportWidth: number;
  viewportHeight: number;
  gridWidth: number;
  gridHeight: number;
  isPortrait: boolean;
}): number {
  const { viewportWidth, viewportHeight, gridWidth, gridHeight, isPortrait } = args;
  const fitByWidth = (viewportWidth / (gridWidth + gridHeight)) * 2;
  const fitByHeight = (viewportHeight / ((gridWidth + gridHeight) / 2)) * 2;
  const fitSize = Math.min(fitByWidth, fitByHeight) * 0.92;

  if (!isPortrait) {
    return Math.max(fitSize, 24);
  }

  return Math.min(Math.max(fitSize, 56), 72);
}
