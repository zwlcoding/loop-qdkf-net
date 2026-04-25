import { Input, Scene } from 'phaser';
import { GridMap } from '../core/GridMap';
import { TurnManager } from '../core/TurnManager';
import { CombatResolver } from '../core/CombatResolver';
import { ActionOption, ActionResolver, TargetActionState, UnitActionState } from '../core/ActionResolver';
import { SquadComboResource } from '../core/SquadComboResource';
import { MissionManager } from '../core/MissionManager';
import { Unit } from '../entities/Unit';
import { StatusEffect } from '../entities/StatusEffect';
import { contentLoader } from '../data/ContentLoader';
import type { ModuleDefinition } from '../data/ModuleTypes';
import { BotTurnPlanner, resolveActorProfile, type BotBattleState, type BotMissionSnapshot } from '../ai';
import { getBattleSceneAiConfig, isBattleSceneAutoControlledSquad } from './BattleSceneAiConfig';
import {
  getBattleSceneActionBarState,
  getBattleSceneGuidanceText,
  getBattleSceneLayout,
  type BattleSceneActionBarAction,
} from './BattleSceneMobileUi';

type ActionMode = 'move' | 'basic' | 'skill' | 'combo' | 'tool';

export class BattleScene extends Scene {
  private gridMap!: GridMap;
  private turnManager!: TurnManager;
  private combatResolver!: CombatResolver;
  private squadComboResource!: SquadComboResource;
  private missionManager!: MissionManager;
  private units: Unit[] = [];
  private selectedUnit: Unit | null = null;
  private reachableTiles: { x: number; y: number; path: { x: number; y: number }[] }[] = [];
  private hoveredTile: { x: number; y: number } | null = null;
  private pathPreview: { x: number; y: number }[] = [];
  private actionMode: ActionMode = 'move';
  private selectedModuleId: string | null = null;
  private hudText!: Phaser.GameObjects.Text;
  private logText!: Phaser.GameObjects.Text;
  private debugText!: Phaser.GameObjects.Text;
  private portraitActionButtons: Array<{
    action: BattleSceneActionBarAction['id'];
    background: Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
  }> = [];
  private showDebugOverlay = false;
  private targetableTiles: { x: number; y: number; color?: number; alpha?: number }[] = [];
  private readonly unitDisplayNames = new Map<string, string>();
  private readonly unitBadges = new Map<string, Phaser.GameObjects.Text>();
  private lastLoggedPressureStage = -1;
  private resolvingBotTurn = false;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(): void {
    this.gridMap = new GridMap(this, 16, 12, 64);
    this.registry.set('gridMap', this.gridMap);

    this.turnManager = new TurnManager();
    this.combatResolver = new CombatResolver(this.gridMap);
    this.registry.set('combatResolver', this.combatResolver);

    const missionTemplate = contentLoader.getRandomMissionTemplate();
    this.missionManager = new MissionManager();
    if (missionTemplate) {
      this.missionManager.startMission(missionTemplate);
      this.missionManager.onReveal(() => {
        this.refreshLog(`[任务揭晓] 主要目标已揭示：${missionTemplate.name}`);
      });
      this.missionManager.onPhaseChange((phase) => {
        this.refreshLog(`[阶段变更] 进入${phase === 'reversal' ? '反转' : phase}阶段`);
      });
      this.missionManager.onPressureWarning(() => {
        this.refreshLog(`[区域警告] ${this.missionManager.getEndgamePressureText()}`);
      });
      this.missionManager.onCollapse(() => {
        this.refreshLog(`[区域崩溃] 任务即将强制结束 — ${this.missionManager.getEndgamePressureText()}`);
      });
    }

    this.createHud();
    this.createPortraitActionBar();
    this.createTestUnits();
    this.squadComboResource = new SquadComboResource(3, [...new Set(this.units.map((unit) => unit.getSquad()))]);

    this.turnManager.startNextTurn();
    this.setupInputHandlers();
    this.setupKeyboardShortcuts();
    this.refreshHud();
  }

  private isPortrait(): boolean {
    return this.scale.height > this.scale.width;
  }

  private getLayout() {
    return getBattleSceneLayout({
      width: this.scale.width,
      height: this.scale.height,
      isPortrait: this.isPortrait(),
      debugVisible: this.showDebugOverlay,
    });
  }

  private getPortraitActionState(): BattleSceneActionBarAction[] {
    return getBattleSceneActionBarState({
      isPortrait: this.isPortrait(),
      activeUnitLabel: this.getUnitDisplayName(this.turnManager?.getActiveUnit?.() ?? null),
      selectedUnitLabel: this.selectedUnit ? this.getUnitDisplayName(this.selectedUnit) : null,
      actionMode: this.actionMode,
      canMove: this.selectedUnit?.canMove() ?? false,
      hasPrimaryActionRemaining: this.selectedUnit?.hasPrimaryActionRemaining() ?? false,
      hasToolOpportunityRemaining: this.selectedUnit?.hasToolOpportunityRemaining() ?? false,
      hasComboModule: (this.selectedUnit?.getComboModules().length ?? 0) > 0,
      hasSkillModule: (this.selectedUnit?.getActiveModules().length ?? 0) > 0,
      hasToolModule: (this.selectedUnit?.getToolModules().length ?? 0) > 0,
    });
  }

  private createHud(): void {
    const layout = this.getLayout();
    this.hudText = this.add.text(layout.hud.position.x, layout.hud.position.y, '', {
      color: '#ffffff',
      fontFamily: 'monospace',
      fontSize: `${layout.hud.fontSize}px`,
      backgroundColor: '#10162fcc',
      padding: { x: 10, y: 8 },
      wordWrap: { width: layout.hud.wrapWidth },
    }).setScrollFactor(0).setDepth(20);

    this.logText = this.add.text(layout.log.position.x, layout.log.position.y, '', {
      color: '#ffd166',
      fontFamily: 'monospace',
      fontSize: `${layout.log.fontSize}px`,
      backgroundColor: '#10162fcc',
      padding: { x: 10, y: 8 },
      wordWrap: { width: layout.log.wrapWidth },
    }).setScrollFactor(0).setDepth(20);

    this.debugText = this.add.text(layout.debug.position.x, layout.debug.position.y, '', {
      color: '#9fe870',
      fontFamily: 'monospace',
      fontSize: this.isPortrait() ? '11px' : '12px',
      backgroundColor: '#081018dd',
      padding: { x: 8, y: 6 },
      wordWrap: { width: layout.debug.wrapWidth },
    }).setScrollFactor(0).setDepth(21).setVisible(false);
  }

  private createPortraitActionBar(): void {
    const actions = getBattleSceneActionBarState({
      isPortrait: true,
      activeUnitLabel: '无',
      selectedUnitLabel: null,
      actionMode: this.actionMode,
      canMove: false,
      hasPrimaryActionRemaining: false,
      hasToolOpportunityRemaining: false,
      hasComboModule: false,
      hasSkillModule: false,
      hasToolModule: false,
    });

    this.portraitActionButtons = actions.map((action) => {
      const background = this.add.rectangle(0, 0, 80, 42, 0x16213e, 0.95)
        .setOrigin(0, 0)
        .setStrokeStyle(2, 0x6ea8fe, 0.35)
        .setScrollFactor(0)
        .setDepth(25)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(0, 0, action.label, {
        color: '#ffffff',
        fontFamily: 'monospace',
        fontSize: '12px',
        align: 'center',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(26);

      background.on('pointerdown', () => {
        this.handlePortraitAction(action.id);
      });

      return { action: action.id, background, label };
    });

    this.updateResponsiveLayout();
    this.refreshPortraitActionBar();
  }

  private createTestUnits(): void {
    const seededUnits: Array<{ unit: Unit; label: string }> = [
      { unit: new Unit(this, 2, 5, 'vanguard', 0), label: 'A1 先锋' },
      { unit: new Unit(this, 3, 4, 'caster', 0), label: 'A2 法师' },
      { unit: new Unit(this, 2, 6, 'support', 0), label: 'A3 支援' },
      { unit: new Unit(this, 13, 5, 'skirmisher', 1), label: 'B1 游击' },
      { unit: new Unit(this, 12, 4, 'controller', 1), label: 'B2 控场' },
      { unit: new Unit(this, 13, 6, 'vanguard', 1), label: 'B3 先锋' },
    ];
    const aiConfig = getBattleSceneAiConfig(this.missionManager.getMissionId());

    if (aiConfig.boss) {
      seededUnits.push({
        unit: new Unit(
          this,
          aiConfig.boss.spawnTile.x,
          aiConfig.boss.spawnTile.y,
          aiConfig.boss.chassis,
          aiConfig.boss.squadId,
          aiConfig.boss.unitId
        ),
        label: aiConfig.boss.label,
      });
    }

    seededUnits.forEach(({ unit, label }) => {
      this.units.push(unit);
      this.unitDisplayNames.set(unit.getId(), label);
      this.createUnitBadge(unit, label);
      this.applyFallbackLoadout(unit);
      this.turnManager.addUnit(unit);
    });
  }

  private createUnitBadge(unit: Unit, label: string): void {
    const pos = unit.getWorldPosition();
    const badgeColor = unit.getSquad() === 0 ? '#1d4ed8cc' : unit.getSquad() === 1 ? '#b91c1ccc' : '#b45309cc';
    const badge = this.add.text(pos.x, pos.y - 34, label, {
      color: '#ffffff',
      fontFamily: 'monospace',
      fontSize: '12px',
      backgroundColor: badgeColor,
      padding: { x: 4, y: 2 },
      align: 'center',
    }).setOrigin(0.5).setDepth(12);

    this.unitBadges.set(unit.getId(), badge);
  }

  private syncUnitBadges(): void {
    this.units.forEach((unit) => {
      const badge = this.unitBadges.get(unit.getId());
      if (!badge) {
        return;
      }

      const pos = unit.getWorldPosition();
      const isActive = unit === this.turnManager.getActiveUnit();
      const label = this.getUnitDisplayName(unit);
      badge.setPosition(pos.x, pos.y - 34);
      badge.setText(isActive ? `▶ ${label}` : label);
      badge.setScale(isActive ? 1.05 : 1);
      badge.setAlpha(unit.isAlive() ? 1 : 0.45);
    });
  }

  private getUnitDisplayName(unit: Unit | null): string {
    if (!unit) {
      return '无';
    }

    return this.unitDisplayNames.get(unit.getId()) ?? unit.getId();
  }

  private getModeLabel(mode: ActionMode): string {
    switch (mode) {
      case 'move':
        return '移动';
      case 'basic':
        return '普攻';
      case 'skill':
        return '技能';
      case 'tool':
        return '道具';
      case 'combo':
        return '连携';
      default:
        return mode;
    }
  }

  private applyFallbackLoadout(unit: Unit): void {
    if (unit.getActiveModules().length > 0 || unit.getToolModules().length > 0) {
      return;
    }

    const loadout = ActionResolver.getFallbackLoadout(unit.getChassis(), contentLoader.getAllModules());
    loadout.active.forEach((module) => unit.equipModule(module));
    loadout.combo.forEach((module) => unit.equipModule(module));
    loadout.tool.forEach((module) => unit.equipModule(module));
  }

  private isBotControlledUnit(unit: Unit | null): boolean {
    return unit ? isBattleSceneAutoControlledSquad(unit.getSquad()) : false;
  }

  private buildBotMissionSnapshot(): BotMissionSnapshot | null {
    const state = this.missionManager.getState();
    if (!state) {
      return null;
    }

    return {
      id: state.template.id,
      isRevealed: state.isRevealed,
      bossUnitId: state.bossKill?.bossUnitId ?? null,
      relicHolderUnitId: state.relicContest?.relicUnitId ?? null,
      extractionUnlocked: state.extraction.isUnlocked,
      isReversalPhase: state.coopThenReversal?.isReversed ?? false,
      pressureStage: state.pressure.stage,
    };
  }

  private buildBotBattleState(unit: Unit): BotBattleState {
    const reachableTiles = unit.canMove()
      ? this.gridMap.findReachableTiles(unit.getTileX(), unit.getTileY(), unit.getMove(), unit.getJump())
      : [];

    return {
      actorId: unit.getId(),
      squadId: unit.getSquad(),
      turnNumber: this.missionManager.getElapsedSeconds(),
      units: this.units.filter((candidate) => candidate.isAlive()).map((candidate) => ({
        id: candidate.getId(),
        role: candidate.getSquad() === 2 ? 'boss' : 'squad',
        chassis: candidate.getChassis(),
        squad: candidate.getSquad(),
        tileX: candidate.getTileX(),
        tileY: candidate.getTileY(),
        hp: candidate.getHp(),
        maxHp: candidate.getMaxHp(),
        attack: candidate.getAttack(),
        facing: candidate.getFacing(),
        canMove: candidate.canMove(),
        canAct: candidate.hasPrimaryActionRemaining(),
        canUseTool: candidate.hasToolOpportunityRemaining(),
        move: candidate.getMove(),
        jump: candidate.getJump(),
        activeModules: candidate.getActiveModules(),
        comboModules: candidate.getComboModules(),
        toolModules: candidate.getToolModules(),
      })),
      reachableTiles,
      objectiveTiles: this.gridMap.getObjectiveTiles().map((tile) => ({ x: tile.x, y: tile.y })),
      mission: this.buildBotMissionSnapshot(),
      hasLineOfSight: (fromX, fromY, toX, toY) => this.gridMap.hasLineOfSight(fromX, fromY, toX, toY),
      getHeightDifference: (fromX, fromY, toX, toY) => this.gridMap.getHeight(fromX, fromY) - this.gridMap.getHeight(toX, toY),
    };
  }

  private applyBotActionMode(option: ActionOption): void {
    if (option.type === 'basic-attack') {
      this.actionMode = 'basic';
      this.selectedModuleId = null;
      return;
    }

    this.actionMode = 'skill';
    this.selectedModuleId = option.moduleId ?? null;
  }

  private resolveBotTurn(unit: Unit): void {
    const battleState = this.buildBotBattleState(unit);
    const decision = BotTurnPlanner.chooseTurn(battleState, resolveActorProfile(battleState));
    this.selectUnit(unit);

    if (!decision) {
      this.refreshLog(`[AI] ${this.getUnitDisplayName(unit)} 没有合法动作，结束回合。`);
      this.endActiveTurn();
      return;
    }

    this.refreshLog(`[AI:${decision.profile.id}] ${decision.candidate.summary}`);
    const plannedMove = decision.candidate.action.move;
    if (plannedMove) {
      this.pathPreview = [...plannedMove.path];
      this.moveUnitTo(unit, plannedMove.x, plannedMove.y);
    }

    const option = decision.candidate.action.option;
    if (!option) {
      this.endActiveTurn();
      return;
    }

    this.applyBotActionMode(option);
    const targetUnit = this.units.find((candidate) => candidate.getId() === option.targetId && candidate.isAlive());
    if (!targetUnit) {
      this.refreshLog(`[B队AI] 目标 ${option.targetId} 已失效，结束回合。`);
      this.endActiveTurn();
      return;
    }

    this.tryResolveUnitTarget(targetUnit);
    this.endActiveTurn();
  }

  private setupInputHandlers(): void {
    this.input.on('pointermove', (pointer: Input.Pointer) => {
      this.handlePointerMove(pointer);
    });

    this.input.on('pointerdown', (pointer: Input.Pointer) => {
      this.handlePointerDown(pointer);
    });
  }

  private setupKeyboardShortcuts(): void {
    this.input.keyboard?.on('keydown-ONE', () => this.setActionMode('basic'));
    this.input.keyboard?.on('keydown-TWO', () => this.setActionMode('skill'));
    this.input.keyboard?.on('keydown-THREE', () => this.setActionMode('tool'));
    this.input.keyboard?.on('keydown-FOUR', () => this.setActionMode('combo'));
    this.input.keyboard?.on('keydown-C', () => this.setActionMode('combo'));
    this.input.keyboard?.on('keydown-M', () => this.setActionMode('move'));
    this.input.keyboard?.on('keydown-E', () => this.endActiveTurn());
    this.input.keyboard?.on('keydown-D', () => {
      this.showDebugOverlay = !this.showDebugOverlay;
      this.debugText.setVisible(this.showDebugOverlay);
      this.refreshHud(this.showDebugOverlay ? '调试面板已开启。' : '调试面板已关闭。');
    });
  }

  private handlePortraitAction(action: BattleSceneActionBarAction['id']): void {
    const state = this.getPortraitActionState().find((item) => item.id === action);
    if (!state?.enabled) {
      return;
    }

    if (action === 'cancel') {
      this.setActionMode('move');
      this.refreshHud('已取消当前操作，回到移动。');
      return;
    }

    if (action === 'endTurn') {
      this.endActiveTurn();
      return;
    }

    this.setActionMode(action);
  }

  private updateResponsiveLayout(): void {
    const layout = this.getLayout();
    this.hudText.setPosition(layout.hud.position.x, layout.hud.position.y);
    this.hudText.setWordWrapWidth(layout.hud.wrapWidth);
    this.hudText.setFontSize(layout.hud.fontSize);

    this.logText.setPosition(layout.log.position.x, layout.log.position.y);
    this.logText.setWordWrapWidth(layout.log.wrapWidth);
    this.logText.setFontSize(layout.log.fontSize);

    this.debugText.setPosition(layout.debug.position.x, layout.debug.position.y);
    this.debugText.setWordWrapWidth(layout.debug.wrapWidth);

    if (!this.portraitActionButtons.length) {
      return;
    }

    const visible = layout.actionBar.visible;
    const columns = 4;
    const buttonWidth = (layout.actionBar.width - layout.actionBar.gap * (columns - 1)) / columns;

    this.portraitActionButtons.forEach((button, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const x = layout.actionBar.position.x + column * (buttonWidth + layout.actionBar.gap);
      const y = layout.actionBar.position.y + row * (layout.actionBar.buttonHeight + layout.actionBar.gap);

      button.background
        .setPosition(x, y)
        .setSize(buttonWidth, layout.actionBar.buttonHeight)
        .setVisible(visible);
      button.label
        .setPosition(x + buttonWidth / 2, y + layout.actionBar.buttonHeight / 2)
        .setVisible(visible);
    });
  }

  private refreshPortraitActionBar(): void {
    const state = this.getPortraitActionState();
    this.portraitActionButtons.forEach((button) => {
      const meta = state.find((item) => item.id === button.action);
      if (!meta) {
        return;
      }

      button.label.setText(meta.label);
      button.background.setFillStyle(
        meta.selected ? 0x2a9d8f : meta.enabled ? 0x16213e : 0x3d405b,
        meta.selected ? 1 : meta.enabled ? 0.96 : 0.55
      );
      button.background.setStrokeStyle(2, meta.selected ? 0xf4d35e : meta.enabled ? 0x6ea8fe : 0x6b7280, meta.enabled ? 0.85 : 0.35);
      button.label.setAlpha(meta.enabled ? 1 : 0.45);
      if (button.background.input) {
        button.background.input.enabled = meta.enabled;
      }
    });
  }

  private handlePointerMove(pointer: Input.Pointer): void {
    const tilePos = this.gridMap.worldToTile(pointer.x, pointer.y);
    if (!tilePos) {
      this.clearPathPreview();
      return;
    }

    if (this.actionMode !== 'move') {
      return;
    }

    if (this.selectedUnit && this.selectedUnit.canMove()) {
      const reachable = this.reachableTiles.find((tile) => tile.x === tilePos.x && tile.y === tilePos.y);
      if (reachable) {
        this.hoveredTile = tilePos;
        this.pathPreview = reachable.path;
        this.renderPathPreview();
      } else {
        this.clearPathPreview();
      }
    }
  }

  private handlePointerDown(pointer: Input.Pointer): void {
    const tilePos = this.gridMap.worldToTile(pointer.x, pointer.y);
    if (!tilePos) return;

    const clickedUnit = this.units.find((unit) => unit.getTileX() === tilePos.x && unit.getTileY() === tilePos.y && unit.isAlive());

    if (clickedUnit) {
      const activeUnit = this.turnManager.getActiveUnit();
      if (clickedUnit === activeUnit) {
        this.selectUnit(clickedUnit);
        return;
      }

      if (this.selectedUnit) {
        this.tryResolveUnitTarget(clickedUnit);
      }

      return;
    }

    if (this.actionMode === 'move' && this.selectedUnit && this.selectedUnit.canMove()) {
      const reachable = this.reachableTiles.find((tile) => tile.x === tilePos.x && tile.y === tilePos.y);
      if (reachable) {
        this.moveUnitTo(this.selectedUnit, tilePos.x, tilePos.y);
      }
    }
  }

  private selectUnit(unit: Unit): void {
    this.clearReachableTiles();
    this.clearPathPreview();
    this.selectedUnit = unit;

    if (!unit.hasPrimaryActionRemaining()) {
      this.actionMode = 'move';
    }

    if (unit.canMove()) {
      this.reachableTiles = this.gridMap.findReachableTiles(
        unit.getTileX(),
        unit.getTileY(),
        unit.getMove(),
        unit.getJump()
      );
    } else {
      this.reachableTiles = [];
    }

    this.refreshActionOverlay();
    this.refreshHud();
  }

  private setActionMode(mode: ActionMode): void {
    if (!this.selectedUnit) {
      return;
    }

    if ((mode === 'basic' || mode === 'skill' || mode === 'combo') && !this.selectedUnit.hasPrimaryActionRemaining()) {
      this.refreshHud('本回合主行动已经用过了。');
      return;
    }

    if (mode === 'tool' && !this.selectedUnit.hasToolOpportunityRemaining()) {
      this.refreshHud('本回合道具机会已经用过了。');
      return;
    }

    if (mode === 'combo') {
      const comboModules = this.selectedUnit.getComboModules();
      if (comboModules.length === 0) {
        this.refreshHud('当前单位没有装备连携模块。');
        return;
      }

      const comboModule = comboModules[0];
      const comboCost = Math.max(1, comboModule.comboCost ?? 1);
      const squadState = this.squadComboResource.getState(this.selectedUnit.getSquad());
      if (squadState.current < comboCost) {
        this.refreshHud(`本队连携值不足，${comboModule.name} 需要 ${comboCost} 点。`);
        return;
      }
    }

    this.actionMode = mode;

    if (mode === 'skill') {
      this.selectedModuleId = this.selectedUnit.getActiveModules()[0]?.id ?? null;
    } else if (mode === 'combo') {
      this.selectedModuleId = this.selectedUnit.getComboModules()[0]?.id ?? null;
    } else if (mode === 'tool') {
      this.selectedModuleId = this.selectedUnit.getToolModules()[0]?.id ?? null;
    } else {
      this.selectedModuleId = null;
    }

    this.refreshActionOverlay();
    this.refreshHud();
  }

  private getSelectedModule(unit: Unit): ModuleDefinition | null {
    if (!this.selectedModuleId) {
      return null;
    }

    const pool = this.actionMode === 'tool'
      ? unit.getToolModules()
      : this.actionMode === 'combo'
        ? unit.getComboModules()
        : unit.getActiveModules();
    return pool.find((module) => module.id === this.selectedModuleId) ?? null;
  }

  private buildUnitState(unit: Unit): UnitActionState {
    return {
      id: unit.getId(),
      chassis: unit.getChassis(),
      squad: unit.getSquad(),
      tileX: unit.getTileX(),
      tileY: unit.getTileY(),
      hp: unit.getHp(),
      maxHp: unit.getMaxHp(),
      attack: unit.getAttack(),
      facing: unit.getFacing(),
      canAct: unit.hasPrimaryActionRemaining(),
      canUseTool: unit.hasToolOpportunityRemaining(),
      activeModules: unit.getActiveModules(),
      comboModules: unit.getComboModules(),
      toolModules: unit.getToolModules(),
    };
  }

  private buildTargetStates(): TargetActionState[] {
    return this.units.filter((unit) => unit.isAlive()).map((unit) => ({
      id: unit.getId(),
      squad: unit.getSquad(),
      tileX: unit.getTileX(),
      tileY: unit.getTileY(),
      hp: unit.getHp(),
      maxHp: unit.getMaxHp(),
    }));
  }

  private refreshActionOverlay(): void {
    if (!this.selectedUnit) {
      this.gridMap.clearHighlights();
      this.targetableTiles = [];
      return;
    }

    if (this.actionMode === 'move') {
      this.targetableTiles = [];
      this.renderReachableTiles();
      return;
    }

    const actor = this.buildUnitState(this.selectedUnit);
    const targets = this.buildTargetStates().filter((target) => target.id !== actor.id);
    let actions: ActionOption[] = [];

    if (this.actionMode === 'tool') {
      actions = ActionResolver.getToolOptions(actor, targets).filter((action) => action.moduleId === this.selectedModuleId);
    } else if (this.actionMode === 'combo') {
      actions = ActionResolver.getComboInitiationOptions(
        actor,
        targets,
        this.squadComboResource.getState(actor.squad).current,
        {
          hasLineOfSight: (fromX, fromY, toX, toY) => this.gridMap.hasLineOfSight(fromX, fromY, toX, toY),
        }
      ).filter((action) => action.moduleId === this.selectedModuleId);
    } else {
      actions = ActionResolver.getPrimaryActionOptions(actor, targets, {
        hasLineOfSight: (fromX, fromY, toX, toY) => this.gridMap.hasLineOfSight(fromX, fromY, toX, toY),
      }).filter((action) => {
        if (this.actionMode === 'basic') return action.type === 'basic-attack';
        if (this.actionMode === 'skill') return action.type === 'module' && action.moduleId === this.selectedModuleId;
        return false;
      });
    }

    this.targetableTiles = actions.reduce<Array<{ x: number; y: number; color?: number; alpha?: number }>>((tiles, action) => {
      const target = this.units.find((unit) => unit.getId() === action.targetId);
      if (!target) {
        return tiles;
      }

      tiles.push({
        x: target.getTileX(),
        y: target.getTileY(),
        color: this.actionMode === 'tool' ? 0x4cc9f0 : this.actionMode === 'combo' ? 0xc77dff : 0xff595e,
        alpha: 0.45,
      });

      return tiles;
    }, []);

    this.gridMap.highlightTiles(this.targetableTiles);
  }

  private renderReachableTiles(): void {
    const tiles = this.reachableTiles.map((tile) => ({
      x: tile.x,
      y: tile.y,
      color: 0x00ff88,
      alpha: 0.3,
    }));
    this.gridMap.highlightTiles(tiles);
  }

  private clearReachableTiles(): void {
    this.reachableTiles = [];
    this.gridMap.clearHighlights();
  }

  private renderPathPreview(): void {
    if (!this.hoveredTile || this.pathPreview.length === 0) return;

    const tiles = this.reachableTiles.map((tile) => ({
      x: tile.x,
      y: tile.y,
      color: 0x00ff88,
      alpha: 0.3,
    }));

    const pathTiles = this.pathPreview.map((point, index) => ({
      x: point.x,
      y: point.y,
      color: index === this.pathPreview.length - 1 ? 0xffd166 : 0x00ff88,
      alpha: index === this.pathPreview.length - 1 ? 0.6 : 0.4,
    }));

    this.gridMap.highlightTiles([...tiles, ...pathTiles]);
  }

  private clearPathPreview(): void {
    this.hoveredTile = null;
    this.pathPreview = [];
    if (this.selectedUnit) {
      this.refreshActionOverlay();
    } else {
      this.gridMap.clearHighlights();
    }
  }

  private moveUnitTo(unit: Unit, tileX: number, tileY: number): void {
    const movementPath = [...this.pathPreview];
    unit.moveTo(tileX, tileY);
    this.syncUnitBadges();
    this.clearReachableTiles();
    this.clearPathPreview();

    if (movementPath.length > 1) {
      const lastPos = movementPath[movementPath.length - 1];
      const prevPos = movementPath[movementPath.length - 2];
      this.updateFacingFromMovement(unit, prevPos.x, prevPos.y, lastPos.x, lastPos.y);
    }

    this.selectUnit(unit);
    this.refreshHud('移动完成。现在可以普攻、放技能、发起连携、用道具或结束回合。');
  }

  private updateFacingFromMovement(unit: Unit, fromX: number, fromY: number, toX: number, toY: number): void {
    const dx = toX - fromX;
    const dy = toY - fromY;

    if (Math.abs(dx) > Math.abs(dy)) {
      unit.setFacing(dx > 0 ? 'east' : 'west');
    } else {
      unit.setFacing(dy > 0 ? 'south' : 'north');
    }
  }

  private tryResolveUnitTarget(targetUnit: Unit): void {
    if (!this.selectedUnit || !targetUnit.isAlive() || this.actionMode === 'move') {
      return;
    }

    const actor = this.buildUnitState(this.selectedUnit);
    const target = {
      id: targetUnit.getId(),
      squad: targetUnit.getSquad(),
      tileX: targetUnit.getTileX(),
      tileY: targetUnit.getTileY(),
      hp: targetUnit.getHp(),
      maxHp: targetUnit.getMaxHp(),
    };

    if (this.actionMode === 'tool') {
      const module = this.getSelectedModule(this.selectedUnit);
      if (!module) {
        this.refreshHud('当前没有可用道具。');
        return;
      }

      const allowed = ActionResolver.getToolOptions(actor, [target]).some((action) => action.moduleId === module.id && action.targetId === target.id);
      if (!allowed) {
        this.refreshHud('这个目标不能使用该道具。');
        return;
      }

      if (!this.selectedUnit.useTool(module)) {
        this.refreshHud('本回合道具机会已经用过了。');
        return;
      }

      const result = ActionResolver.resolveToolUse(actor, target, module);
      this.applyResolution(this.selectedUnit, targetUnit, result);
      this.setActionMode('move');
      return;
    }

    if (this.actionMode === 'combo') {
      const module = this.getSelectedModule(this.selectedUnit);
      if (!module) {
        this.refreshHud('当前单位没有可发起的连携模块。');
        return;
      }

      const squadState = this.squadComboResource.getState(this.selectedUnit.getSquad());
      const potentialParticipants = this.units
        .filter((u) => u.isAlive() && u.getId() !== this.selectedUnit!.getId())
        .map((u) => this.buildUnitState(u));
      const result = ActionResolver.resolveComboInitiation(actor, target, module, squadState.current, potentialParticipants, {
        hasLineOfSight: (fromX, fromY, toX, toY) => this.gridMap.hasLineOfSight(fromX, fromY, toX, toY),
        calculateDamage: (_actor, _target, baseDamage) => this.combatResolver.calculateDamage(this.selectedUnit!, targetUnit, Math.round(baseDamage)),
      });

      if (!result.success) {
        this.refreshHud(result.summary);
        return;
      }

      if (!this.squadComboResource.spend(this.selectedUnit.getSquad(), result.comboCostSpent ?? 0)) {
        this.refreshHud('连携值扣除失败，本次连携已取消。');
        return;
      }

      this.selectedUnit.performAction();
      this.selectedUnit.setFacing(this.combatResolver.getDirection(this.selectedUnit, targetUnit));
      this.applyResolution(this.selectedUnit, targetUnit, result);
      this.setActionMode('move');
      return;
    }

    const matchingAction = ActionResolver.getPrimaryActionOptions(actor, [target], {
      hasLineOfSight: (fromX, fromY, toX, toY) => this.gridMap.hasLineOfSight(fromX, fromY, toX, toY),
    }).find((action) => {
      if (this.actionMode === 'basic') {
        return action.type === 'basic-attack' && action.targetId === target.id;
      }

      return action.type === 'module' && action.targetId === target.id && action.moduleId === this.selectedModuleId;
    });

    if (!matchingAction) {
      this.refreshHud('目标超出范围，或者被视线/规则挡住了。');
      return;
    }

    const result = ActionResolver.resolvePrimaryAction(actor, target, matchingAction, {
      hasLineOfSight: (fromX, fromY, toX, toY) => this.gridMap.hasLineOfSight(fromX, fromY, toX, toY),
      getHeightDifference: (fromX, fromY, toX, toY) => this.gridMap.getHeight(fromX, fromY) - this.gridMap.getHeight(toX, toY),
      calculateDamage: (_actor, _target, baseDamage) => this.combatResolver.calculateDamage(this.selectedUnit!, targetUnit, Math.round(baseDamage)),
    });

    if (!result.success) {
      this.refreshHud(result.summary);
      return;
    }

    this.selectedUnit.performAction();
    this.selectedUnit.setFacing(this.combatResolver.getDirection(this.selectedUnit, targetUnit));
    this.applyResolution(this.selectedUnit, targetUnit, result);
    this.setActionMode('move');
  }

  private applyResolution(sourceUnit: Unit, targetUnit: Unit, result: ReturnType<typeof ActionResolver.resolvePrimaryAction>): void {
    const summaries: string[] = [result.summary];
    const targetHpBefore = targetUnit.getHp();

    if (result.appliedDamage) {
      targetUnit.applyResolvedDamage(result.appliedDamage);
    }

    if (result.appliedHealing) {
      targetUnit.heal(result.appliedHealing);
    }

    if (result.appliedStatuses?.length) {
      result.appliedStatuses.forEach((status) => {
        targetUnit.addStatus(new StatusEffect(status.type, status.duration, status.magnitude));
      });
      summaries.push(`附加状态：${targetUnit.getStatusSummary().join('，')}`);
    }

    if (result.knockbackDistance) {
      const knockback = this.combatResolver.resolveKnockback(sourceUnit, targetUnit, result.knockbackDistance);

      if (knockback.travelled > 0) {
        targetUnit.repositionTo(knockback.finalX, knockback.finalY);
        summaries.push(`击退 ${knockback.travelled} 格。`);
      }

      const extraDamage = knockback.collisionDamage + knockback.fallDamage + knockback.hazardDamage;
      if (extraDamage > 0) {
        targetUnit.applyResolvedDamage(extraDamage);
      }

      if (knockback.collided) {
        summaries.push(`碰撞伤害 ${knockback.collisionDamage}。`);
      }

      if (knockback.fallDamage > 0) {
        summaries.push(`坠落 ${knockback.fallDistance} 层，额外伤害 ${knockback.fallDamage}。`);
      }

      if (knockback.hazardDamage > 0) {
        summaries.push(`落入危险地块${knockback.hazardType ? `（${knockback.hazardType}）` : ''}，额外伤害 ${knockback.hazardDamage}。`);
      }
    }

    const bossState = this.missionManager.getBossKillState();
    if (bossState && targetUnit.getId() === bossState.bossUnitId) {
      const missionDamage = Math.max(0, targetHpBefore - targetUnit.getHp());
      if (missionDamage > 0) {
        this.missionManager.applyBossDamage(missionDamage);
      }
    }

    this.syncUnitBadges();
    this.logText.setText(summaries.join('\n'));
    this.selectUnit(this.selectedUnit!);
    this.refreshHud();
  }

  private endActiveTurn(): void {
    if (!this.turnManager.getActiveUnit()) {
      return;
    }

    this.selectedUnit = null;
    this.actionMode = 'move';
    this.selectedModuleId = null;
    this.turnManager.endCurrentTurn();
    this.clearReachableTiles();
    this.syncUnitBadges();
    this.refreshHud('回合结束。');
  }

  private refreshHud(message?: string): void {
    const activeUnit = this.turnManager.getActiveUnit();
    const module = this.selectedUnit ? this.getSelectedModule(this.selectedUnit) : null;
    const missionState = this.missionManager.getState();
    const isPortrait = this.isPortrait();
    const missionLines: string[] = [];

    if (missionState) {
      const template = missionState.template;
      missionLines.push(`任务：${template.name}`);
      missionLines.push(missionState.isRevealed
        ? `目标：${this.missionManager.getCurrentObjectiveText()}`
        : `侦察中：${this.missionManager.getRemainingRevealSeconds()}秒后揭晓`);
      if (!isPortrait) {
        missionLines.push(`[标记] 黄=目标 红=首领 金=遗物 绿=${this.missionManager.isExtractionUnlocked() ? '可撤离' : '待解锁'}`);
      }
    } else {
      missionLines.push('任务：加载中...');
    }

    if (missionState?.isRevealed) {
      missionLines.push(`环境：${this.missionManager.getEndgamePressureText()}`);
      if (!isPortrait) {
        missionLines.push(`撤离：${this.missionManager.getExtractionStatusText()}`);
      }
    }

    const guidance = getBattleSceneGuidanceText({
      isPortrait,
      activeUnitLabel: this.getUnitDisplayName(activeUnit),
      selectedUnitLabel: this.selectedUnit ? this.getUnitDisplayName(this.selectedUnit) : null,
      actionMode: this.actionMode,
      canMove: this.selectedUnit?.canMove() ?? false,
      hasPrimaryActionRemaining: this.selectedUnit?.hasPrimaryActionRemaining() ?? false,
      hasToolOpportunityRemaining: this.selectedUnit?.hasToolOpportunityRemaining() ?? false,
      hasComboModule: (this.selectedUnit?.getComboModules().length ?? 0) > 0,
      hasSkillModule: (this.selectedUnit?.getActiveModules().length ?? 0) > 0,
      hasToolModule: (this.selectedUnit?.getToolModules().length ?? 0) > 0,
    });
    const squadHint = isPortrait
      ? `连携 A:${this.squadComboResource.getState(0).current}/${this.squadComboResource.getState(0).max} B:${this.squadComboResource.getState(1).current}/${this.squadComboResource.getState(1).max}`
      : `A队连携值：${this.squadComboResource.getState(0).current}/${this.squadComboResource.getState(0).max} ｜ B队连携值：${this.squadComboResource.getState(1).current}/${this.squadComboResource.getState(1).max}`;

    const lines = [
      ...missionLines,
      `回合：${this.getUnitDisplayName(activeUnit)}`,
      `模式：${this.getModeLabel(this.actionMode)}${module ? ` / ${module.name}` : ''}`,
      this.selectedUnit
        ? `行动：移${this.selectedUnit.canMove() ? '✓' : '✗'} 主${this.selectedUnit.hasPrimaryActionRemaining() ? '✓' : '✗'} 道${this.selectedUnit.hasToolOpportunityRemaining() ? '✓' : '✗'}`
        : '行动：先点亮当前回合单位',
      squadHint,
      this.selectedUnit ? `状态：${this.selectedUnit.getStatusSummary().join('，') || '无'}` : '状态：无',
      guidance,
      isPortrait ? '标记：蓝我方 红敌方' : '标签：A队蓝，B队红',
    ];

    this.hudText.setText(lines.join('\n'));
    this.updateResponsiveLayout();
    this.refreshPortraitActionBar();
    this.refreshDebugOverlay();
    if (message) {
      this.refreshLog(message);
    }
  }

  private refreshDebugOverlay(): void {
    if (!this.showDebugOverlay) {
      this.debugText.setText('');
      return;
    }

    const activeUnit = this.turnManager.getActiveUnit();
    const selectedSummary = this.selectedUnit
      ? `${this.getUnitDisplayName(this.selectedUnit)} HP${this.selectedUnit.getHp()}/${this.selectedUnit.getMaxHp()} ATK${this.selectedUnit.getAttack()} DEF${this.selectedUnit.getDefense()} MOV${this.selectedUnit.getMove()} JMP${this.selectedUnit.getJump()}`
      : '无';
    const focusTile = this.hoveredTile ?? (this.selectedUnit ? { x: this.selectedUnit.getTileX(), y: this.selectedUnit.getTileY() } : null);
    const tileSummary = focusTile
      ? `(${focusTile.x},${focusTile.y}) h=${this.gridMap.getHeight(focusTile.x, focusTile.y)}`
      : '无';
    const comboSummary = this.selectedUnit
      ? `模块${this.selectedUnit.getComboModules().length} 连携${this.squadComboResource.getState(this.selectedUnit.getSquad()).current}`
      : '无';
    const turnOrder = this.units
      .filter((unit) => unit.isAlive())
      .map((unit) => `${unit === activeUnit ? '▶' : '·'}${this.getUnitDisplayName(unit)}(${unit.getSpeed()})`)
      .join(' ');

    const debugLines = [
      '[调试]',
      `序列：${turnOrder || '无'}`,
      `任务：${this.missionManager.getCurrentObjectiveText()}`,
      `单位：${selectedSummary}`,
      `地块：${tileSummary}`,
      `连携：${comboSummary}`,
      `撤离：${this.missionManager.getExtractionStatusText()}`,
    ];

    this.debugText.setText(debugLines.join('\n'));
  }

  private refreshLog(message: string): void {
    const layout = this.getLayout();
    const lines = message.split('\n');
    const trimmed = this.isPortrait() ? lines.slice(0, layout.log.maxLines) : lines;
    this.logText.setText(trimmed.join('\n'));
    this.updateResponsiveLayout();
  }

  update(_time: number, delta: number): void {
    this.missionManager.update(delta);

    const currentPressureStage = this.missionManager.getPressureStage();
    if (currentPressureStage > this.lastLoggedPressureStage && currentPressureStage > 1) {
      this.lastLoggedPressureStage = currentPressureStage;
      this.refreshLog(`[环境恶化] ${this.missionManager.getEndgamePressureText()}`);
    }

    const activeUnit = this.turnManager.getActiveUnit();
    if (activeUnit && this.selectedUnit !== activeUnit) {
      this.selectUnit(activeUnit);
    }

    if (activeUnit && this.isBotControlledUnit(activeUnit) && !this.resolvingBotTurn) {
      this.resolvingBotTurn = true;
      try {
        this.resolveBotTurn(activeUnit);
      } finally {
        this.resolvingBotTurn = false;
      }
    }

    this.syncUnitBadges();
    this.validatePortraitLayout();
  }

  private validatePortraitLayout(): void {
    const portrait = this.isPortrait();
    const minReadableWidth = 320;
    this.updateResponsiveLayout();
    this.refreshPortraitActionBar();
    if (portrait && this.scale.width < minReadableWidth) {
      // eslint-disable-next-line no-console
      console.warn(`[BattleScene] Portrait width ${this.scale.width}px is below readable threshold ${minReadableWidth}px`);
    }
  }
}
