import { describe, expect, it } from 'vitest';
import {
  calculateBattleMapTileSize,
  getBattleSceneActionBarState,
  getBattleSceneGuidanceText,
  getBattleSceneLayout,
  type BattleSceneMobileContext,
} from './BattleSceneMobileUi';

const baseContext: BattleSceneMobileContext = {
  isPortrait: true,
  activeUnitLabel: 'A1 先锋',
  selectedUnitLabel: null,
  actionMode: 'move',
  canMove: false,
  hasPrimaryActionRemaining: false,
  hasToolOpportunityRemaining: false,
  hasComboModule: false,
  hasSkillModule: false,
  hasToolModule: false,
};

describe('BattleSceneMobileUi', () => {
  it('builds a portrait action bar with all touch-first actions', () => {
    const actions = getBattleSceneActionBarState({
      ...baseContext,
      selectedUnitLabel: 'A1 先锋',
      canMove: true,
      hasPrimaryActionRemaining: true,
      hasToolOpportunityRemaining: true,
      hasComboModule: true,
      hasSkillModule: true,
      hasToolModule: true,
    });

    expect(actions.map((action) => action.id)).toEqual([
      'move',
      'basic',
      'skill',
      'tool',
      'combo',
      'cancel',
      'endTurn',
      'extract',
    ]);
    expect(actions.filter((action) => action.enabled).map((action) => action.id)).toEqual([
      'move',
      'basic',
      'skill',
      'tool',
      'combo',
      'cancel',
      'endTurn',
    ]);
  });

  it('keeps phone guidance tap-first and free of keyboard hints', () => {
    const guidance = getBattleSceneGuidanceText({
      ...baseContext,
      selectedUnitLabel: 'A1 先锋',
      actionMode: 'basic',
      canMove: true,
      hasPrimaryActionRemaining: true,
      hasToolOpportunityRemaining: true,
      hasComboModule: true,
      hasSkillModule: true,
      hasToolModule: true,
    });

    expect(guidance).toContain('轻点');
    expect(guidance).toContain('普攻');
    expect(guidance).not.toMatch(/[1234CEMD]/);
    expect(guidance).not.toContain('按键');
  });

  it('moves portrait log and touch controls away from the top-left battlefield area', () => {
    const layout = getBattleSceneLayout({ width: 390, height: 844, isPortrait: true, debugVisible: false });

    expect(layout.hud.position).toEqual({ x: 12, y: 12 });
    expect(layout.log.position.y).toBeGreaterThan(layout.hud.position.y + 120);
    expect(layout.actionBar.position.y).toBeGreaterThan(layout.log.position.y);
    expect(layout.log.maxLines).toBe(3);
    expect(layout.hud.compact).toBe(true);
    expect(layout.battleViewport.y).toBeGreaterThan(layout.hud.position.y);
    expect(layout.battleViewport.y + layout.battleViewport.height).toBeLessThan(layout.log.position.y);
  });

  it('keeps portrait battle tiles readable for a camera-framed local board view', () => {
    const layout = getBattleSceneLayout({ width: 390, height: 844, isPortrait: true, debugVisible: false });
    const tileSize = calculateBattleMapTileSize({
      viewportWidth: layout.battleViewport.width,
      viewportHeight: layout.battleViewport.height,
      gridWidth: 16,
      gridHeight: 12,
      isPortrait: true,
    });

    expect(tileSize).toBeGreaterThanOrEqual(60);
    expect(tileSize).toBeGreaterThan((layout.battleViewport.width / (16 + 12)) * 2);
  });

  it('uses viewport fit sizing for landscape battle maps', () => {
    const layout = getBattleSceneLayout({ width: 1280, height: 720, isPortrait: false, debugVisible: false });
    const tileSize = calculateBattleMapTileSize({
      viewportWidth: layout.battleViewport.width,
      viewportHeight: layout.battleViewport.height,
      gridWidth: 16,
      gridHeight: 12,
      isPortrait: false,
    });

    expect(tileSize).toBeGreaterThan(70);
  });

  it('disables touch actions that the selected unit cannot use', () => {
    const actions = getBattleSceneActionBarState({
      ...baseContext,
      selectedUnitLabel: 'A1 先锋',
      canMove: false,
      hasPrimaryActionRemaining: false,
      hasToolOpportunityRemaining: false,
      hasComboModule: false,
      hasSkillModule: false,
      hasToolModule: false,
    });

    expect(actions.find((action) => action.id === 'move')?.enabled).toBe(false);
    expect(actions.find((action) => action.id === 'basic')?.enabled).toBe(false);
    expect(actions.find((action) => action.id === 'skill')?.enabled).toBe(false);
    expect(actions.find((action) => action.id === 'tool')?.enabled).toBe(false);
    expect(actions.find((action) => action.id === 'combo')?.enabled).toBe(false);
    expect(actions.find((action) => action.id === 'cancel')?.enabled).toBe(true);
    expect(actions.find((action) => action.id === 'endTurn')?.enabled).toBe(true);
    expect(actions.find((action) => action.id === 'extract')?.enabled).toBe(false);
  });
});
