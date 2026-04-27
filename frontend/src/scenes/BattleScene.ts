import { Input, Scene } from 'phaser';
import { COLORS, FONTS, createPanel } from '../ui/Theme';
import { GridMap } from '../core/GridMap';
import { TurnManager } from '../core/TurnManager';
import { CombatResolver } from '../core/CombatResolver';
import { ActionOption, ActionResolver, TargetActionState, UnitActionState } from '../core/ActionResolver';
import { SquadComboResource } from '../core/SquadComboResource';
import { MissionManager } from '../core/MissionManager';
import { ExtractionManager } from '../core/ExtractionManager';
import { ChassisModuleManager } from '../core/ChassisModuleManager';
import { AudioManager } from '../core/AudioManager';
import { VisualEffects } from '../core/VisualEffects';
import type { Mission } from '../data/MissionTypes';
import { createBattleResultSummary, getBattleResultSummaryText, resolveWinningSquadId } from '../core/BattleResultSummary';
import { BATTLE_SETUP_REGISTRY_KEY, createSeededBattleSetup, validateBattleSetup, type BattleSetup } from '../core/BattleSetup';
import { recordBattle, type RiftRunState } from '../core/RiftRunManager';
import { isMapComplete } from '../core/RiftMap';
import { buildMissionMarkers } from '../core/BattleMarkers';
import { filterReachableTilesByOccupancy, isTileOccupiedByOtherUnit } from '../core/BattleOccupancy';
import { Unit } from '../entities/Unit';
import { HpBar } from './HpBar';
import { DamageText } from './DamageText';
import { StatusEffect } from '../entities/StatusEffect';
import { contentLoader } from '../data/ContentLoader';
import type { ModuleDefinition } from '../data/ModuleTypes';
import { BotTurnPlanner, resolveActorProfile, type BotBattleState, type BotMissionSnapshot } from '../ai';
import { getBattleSceneAiConfig, isBattleSceneAutoControlledSquad } from './BattleSceneAiConfig';
import {
  getBattleSceneActionBarState,
  calculateBattleMapTileSize,
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
  private readonly unitBadges = new Map<string, Phaser.GameObjects.Ellipse>();
  private readonly hpBars = new Map<string, HpBar>();
  private readonly squadControl = new Map<number, 'human' | 'ai'>();
  private lastLoggedPressureStage = -1;
  private lastMissionMarkerSignature = '';
  private resolvingBotTurn = false;
  private activeSetup!: BattleSetup;
  private battleEnded = false;
  private extractionManager: ExtractionManager | null = null;
  private chassisManager = new ChassisModuleManager();
  private riftDamageDealt = 0;
  private riftDamageTaken = 0;
  private readonly activeTweens = new Map<string, Phaser.Tweens.Tween>();
  private readonly originalTints = new Map<string, number>();
  private readonly unitPreviousHp = new Map<string, number>();
  private readonly dyingUnits = new Set<string>();
  private battleTileSize = 48;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(): void {
    this.activeSetup = this.resolveBattleSetup();
    const layout = this.getLayout();
    const tileSize = this.calculateTileSize();
    this.battleTileSize = tileSize;
    this.gridMap = new GridMap(this, 16, 12, tileSize, layout.battleViewport);
    this.registry.set('gridMap', this.gridMap);
    this.scale.on('resize', this.handleSceneResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleSceneResize, this);
    });

    this.turnManager = new TurnManager();
    this.combatResolver = new CombatResolver(this.gridMap);
    this.registry.set('combatResolver', this.combatResolver);

    const missionTemplate = this.activeSetup.missionTemplateId
      ? contentLoader.getMissionTemplate(this.activeSetup.missionTemplateId)
      : contentLoader.getRandomMissionTemplate();
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
    this.createUnitsFromSetup();
    this.syncUnitSpritesToMap();
    this.updateMissionMarkers();
    this.squadComboResource = new SquadComboResource(3, [...new Set(this.units.map((unit) => unit.getSquad()))]);

    const selectedMission = this.registry.get('selectedMission') as Mission | undefined;
    if (selectedMission) {
      this.extractionManager = new ExtractionManager(selectedMission);
    }

    this.turnManager.startNextTurn();
    this.setupInputHandlers();
    this.setupKeyboardShortcuts();
    this.refreshHud();

    AudioManager.getInstance().playBgm('battle-bgm');
  }

  private resolveBattleSetup(): BattleSetup {
    const candidate = this.registry.get(BATTLE_SETUP_REGISTRY_KEY) as BattleSetup | undefined;
    const fallback = createSeededBattleSetup();
    const setup = candidate ?? fallback;
    const validation = validateBattleSetup(setup, {
      chassis: contentLoader.getAllChassis(),
      modules: contentLoader.getAllModules(),
      missions: contentLoader.getAllMissionTemplates(),
    });

    if (!validation.valid) {
      this.registry.set(BATTLE_SETUP_REGISTRY_KEY, fallback);
      return fallback;
    }

    return setup;
  }

  private isPortrait(): boolean {
    return this.scale.height > this.scale.width;
  }

  private calculateTileSize(): number {
    const layout = this.getLayout();
    return calculateBattleMapTileSize({
      viewportWidth: layout.battleViewport.width,
      viewportHeight: layout.battleViewport.height,
      gridWidth: 16,
      gridHeight: 12,
      isPortrait: this.isPortrait(),
    });
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
      extractionAvailable: this.extractionManager?.isExtractionAvailable() ?? false,
    });
  }

  private createHud(): void {
    const layout = this.getLayout();
    this.hudText = this.add.text(layout.hud.position.x, layout.hud.position.y, '', {
      color: FONTS.hud.color,
      fontFamily: FONTS.hud.family,
      fontSize: `${layout.hud.fontSize}px`,
      backgroundColor: '#10162fcc',
      padding: { x: 10, y: 8 },
      wordWrap: { width: layout.hud.wrapWidth },
    }).setScrollFactor(0).setDepth(20);

    this.logText = this.add.text(layout.log.position.x, layout.log.position.y, '', {
      color: COLORS.text.accent,
      fontFamily: FONTS.hud.family,
      fontSize: `${layout.log.fontSize}px`,
      backgroundColor: '#10162fcc',
      padding: { x: 10, y: 8 },
      wordWrap: { width: layout.log.wrapWidth },
    }).setScrollFactor(0).setDepth(20);

    this.debugText = this.add.text(layout.debug.position.x, layout.debug.position.y, '', {
      color: COLORS.text.debug,
      fontFamily: FONTS.hud.family,
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
      const background = this.add.rectangle(0, 0, 80, 42, COLORS.bg.secondary, 0.95)
        .setOrigin(0, 0)
        .setStrokeStyle(2, COLORS.border.medium, 0.35)
        .setScrollFactor(0)
        .setDepth(25)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(0, 0, action.label, {
        color: COLORS.text.primary,
        fontFamily: FONTS.hud.family,
        fontSize: FONTS.hud.size,
        align: 'center',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(26);

      background.on('pointerdown', () => {
        AudioManager.getInstance().playSfx('sfx-click');
        this.handlePortraitAction(action.id);
      });

      return { action: action.id, background, label };
    });

    this.updateResponsiveLayout();
    this.refreshPortraitActionBar();
  }

  private createUnitsFromSetup(): void {
    const seededUnits: Array<{ unit: Unit; label: string }> = [];

    this.activeSetup.squads.forEach((squad) => {
      this.squadControl.set(squad.id, squad.control);
      squad.units.forEach((unitConfig) => {
        const unit = new Unit(this, unitConfig.tile.x, unitConfig.tile.y, unitConfig.chassisId, squad.id, unitConfig.id);
        unitConfig.moduleIds
          .map((moduleId) => contentLoader.getModule(moduleId))
          .filter((module): module is ModuleDefinition => Boolean(module))
          .forEach((module) => unit.equipModule(module));
        seededUnits.push({ unit, label: unitConfig.label });
      });
    });

    const aiConfig = getBattleSceneAiConfig(this.missionManager.getMissionId());

    if (aiConfig.boss && this.activeSetup.boss?.enabled) {
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
      this.squadControl.set(aiConfig.boss.squadId, 'ai');
    }

    seededUnits.forEach(({ unit, label }) => {
      this.units.push(unit);
      this.unitDisplayNames.set(unit.getId(), label);
      this.originalTints.set(unit.getId(), this.getSquadTint(unit.getSquad()));
      this.createUnitBadge(unit);
      this.createUnitHpBar(unit);
      this.applyFallbackLoadout(unit);
      const loadout = this.registry.get('loadout');
      if (loadout) {
        this.chassisManager.applyLoadout(unit, loadout);
      }
      this.turnManager.addUnit(unit);
    });
  }

  private createUnitBadge(unit: Unit): void {
    const pos = unit.getWorldPosition();
    const squad = unit.getSquad();
    const shadowColor = squad === 0 ? 0x112244 : squad === 1 ? 0x441111 : 0x443311;
    const shadow = this.add.ellipse(pos.x, pos.y + 20, 40, 14, shadowColor, 0.3)
      .setDepth(4);
    this.unitBadges.set(unit.getId(), shadow);
  }

  private createUnitHpBar(unit: Unit): void {
    const hpBar = new HpBar(this, unit);
    this.hpBars.set(unit.getId(), hpBar);
    this.unitPreviousHp.set(unit.getId(), unit.getMaxHp());
    const originalTint = this.getSquadTint(unit.getSquad());

    unit.setOnHpChanged((hp, maxHp) => {
      const prevHp = this.unitPreviousHp.get(unit.getId()) ?? maxHp;
      hpBar.update(hp, maxHp);
      this.unitPreviousHp.set(unit.getId(), hp);

      // Hit flash: white flash when HP decreases, then restore original tint
      if (hp < prevHp && unit.isAlive()) {
        const sprite = unit.getSprite();
        sprite.setTint(0xffffff);
        this.time.delayedCall(100, () => {
          if (unit.isAlive()) {
            sprite.setTint(originalTint);
          }
        });
      }
    });

    unit.setOnDeath(() => {
      // Stop any active floating tween
      this.stopActiveTweens(unit.getId());
      this.dyingUnits.add(unit.getId());

      const sprite = unit.getSprite();
      const badge = this.unitBadges.get(unit.getId());

      // Animate sprite: fade out + scale down over 500ms
      this.tweens.add({
        targets: sprite,
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 500,
        ease: 'Power2',
      });

      // Animate shadow badge: fade out simultaneously
      if (badge) {
        this.tweens.add({
          targets: badge,
          alpha: 0,
          duration: 500,
          ease: 'Power2',
          onComplete: () => {
            badge.destroy();
            this.unitBadges.delete(unit.getId());
          },
        });
      }

      // Delay HP bar destruction to match animation
      this.time.delayedCall(500, () => {
        hpBar.destroy();
        this.hpBars.delete(unit.getId());
        this.dyingUnits.delete(unit.getId());
        this.unitPreviousHp.delete(unit.getId());
        this.originalTints.delete(unit.getId());
      });

      AudioManager.getInstance().playSfx('sfx-death');
      const pos = unit.getWorldPosition();
      VisualEffects.spawnParticles(this, pos.x, pos.y, 'death');
    });
  }

  private syncUnitBadges(): void {
    this.units.forEach((unit) => {
      if (this.dyingUnits.has(unit.getId())) return;
      const badge = this.unitBadges.get(unit.getId());
      if (!badge) {
        return;
      }
      const pos = unit.getWorldPosition();
      badge.setPosition(pos.x, pos.y + 20);
      badge.setAlpha(unit.isAlive() ? 0.3 : 0.1);
    });
    this.syncHpBars();
  }

  private syncUnitSpritesToMap(): void {
    const unitSize = this.isPortrait()
      ? Math.min(Math.max(this.battleTileSize * 0.92, 48), 58)
      : 48;
    this.units.forEach((unit) => {
      if (this.dyingUnits.has(unit.getId())) return;
      unit.syncSpriteToWorldPosition();
      unit.getSprite().setDisplaySize(unitSize, unitSize);
    });
  }

  private syncHpBars(): void {
    this.units.forEach((unit) => {
      if (this.dyingUnits.has(unit.getId())) return;
      const hpBar = this.hpBars.get(unit.getId());
      if (!hpBar) {
        return;
      }

      const pos = unit.getWorldPosition();
      hpBar.setPosition(pos.x, pos.y - 42);
      hpBar.setAlpha(unit.isAlive() ? 1 : 0.45);
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
    if (!unit) {
      return false;
    }

    return (this.squadControl.get(unit.getSquad()) ?? (isBattleSceneAutoControlledSquad(unit.getSquad()) ? 'ai' : 'human')) === 'ai';
  }

  private getSquadTint(squad: number): number {
    switch (squad) {
      case 0: return 0xffffff;
      case 1: return 0xffffff;
      case 2: return 0xffffff;
      default: return 0xffffff;
    }
  }

  private stopActiveTweens(unitId: string): void {
    const tween = this.activeTweens.get(unitId);
    if (tween) {
      tween.stop();
      this.activeTweens.delete(unitId);
    }
  }

  private startFloatingAnimation(unit: Unit): void {
    if (!unit.isAlive()) return;
    const sprite = unit.getSprite();
    const originalY = sprite.y;
    const tween = this.tweens.add({
      targets: sprite,
      y: originalY - 4,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.activeTweens.set(unit.getId(), tween);
  }

  private stopFloatingAnimation(unit: Unit): void {
    this.stopActiveTweens(unit.getId());
    const pos = unit.getWorldPosition();
    unit.getSprite().setY(pos.y);
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

  private getAliveUnits(): Unit[] {
    return this.units.filter((candidate) => candidate.isAlive());
  }

  private getReachableTilesForUnit(unit: Unit): Array<{ x: number; y: number; path: { x: number; y: number }[] }> {
    if (!unit.canMove()) {
      return [];
    }

    return filterReachableTilesByOccupancy(
      this.gridMap.findReachableTiles(unit.getTileX(), unit.getTileY(), unit.getMove(), unit.getJump()),
      this.getAliveUnits().map((candidate) => ({
        id: candidate.getId(),
        tileX: candidate.getTileX(),
        tileY: candidate.getTileY(),
        isAlive: candidate.isAlive(),
      })),
      unit.getId(),
    );
  }

  private updateMissionMarkers(): void {
    const markers = buildMissionMarkers({
      mission: this.buildBotMissionSnapshot(),
      units: this.getAliveUnits().map((unit) => ({
        id: unit.getId(),
        tileX: unit.getTileX(),
        tileY: unit.getTileY(),
        isAlive: unit.isAlive(),
      })),
      objectiveTiles: this.gridMap.getObjectiveTiles().map((tile) => ({ x: tile.x, y: tile.y })),
    });
    const signature = JSON.stringify(markers);

    if (signature === this.lastMissionMarkerSignature) {
      return;
    }

    this.lastMissionMarkerSignature = signature;
    this.gridMap.drawMissionMarkers(markers);
  }

  private buildBotBattleState(unit: Unit): BotBattleState {
    const reachableTiles = this.getReachableTilesForUnit(unit);

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
    this.input.keyboard?.on('keydown-R', () => {
      if (this.battleEnded) {
        this.scene.start('SetupScene');
      }
    });
  }

  private handlePortraitAction(action: BattleSceneActionBarAction['id']): void {
    if (this.battleEnded) {
      return;
    }

    const state = this.getPortraitActionState().find((item) => item.id === action);
    if (!state?.enabled) {
      return;
    }

    AudioManager.getInstance().playSfx('sfx-confirm');

    if (action === 'cancel') {
      this.setActionMode('move');
      this.refreshHud('已取消当前操作，回到移动。');
      return;
    }

    if (action === 'endTurn') {
      this.endActiveTurn();
      return;
    }

    if (action === 'extract') {
      this.handleExtract();
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

  private handleSceneResize(): void {
    this.reflowBattleMap();
    this.updateResponsiveLayout();
    this.refreshPortraitActionBar();
  }

  private reflowBattleMap(): void {
    if (!this.gridMap) {
      return;
    }

    const layout = this.getLayout();
    const tileSize = this.calculateTileSize();
    this.battleTileSize = tileSize;
    this.gridMap.setLayout(tileSize, layout.battleViewport);
    this.syncUnitSpritesToMap();
    this.syncUnitBadges();
    this.refreshActionOverlay();
    if (this.pathPreview.length > 0) {
      this.renderPathPreview();
    }
    this.updateMissionMarkers();
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
        meta.selected ? COLORS.accent.teal : meta.enabled ? COLORS.bg.secondary : COLORS.bg.primary,
        meta.selected ? 1 : meta.enabled ? 0.96 : 0.55
      );
      button.background.setStrokeStyle(2, meta.selected ? COLORS.accent.yellow : meta.enabled ? COLORS.border.medium : COLORS.border.dim, meta.enabled ? 0.85 : 0.35);
      button.label.setAlpha(meta.enabled ? 1 : 0.45);
      if (button.background.input) {
        button.background.input.enabled = meta.enabled;
      }
    });
  }

  private handlePointerMove(pointer: Input.Pointer): void {
    if (this.battleEnded) {
      return;
    }

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
    if (this.battleEnded) {
      return;
    }

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

    // Stop floating animation on previously selected unit
    if (this.selectedUnit && this.selectedUnit !== unit) {
      this.stopFloatingAnimation(this.selectedUnit);
    }

    this.selectedUnit = unit;

    // Start floating animation on newly selected unit
    this.startFloatingAnimation(unit);

    if (!unit.hasPrimaryActionRemaining()) {
      this.actionMode = 'move';
    }

    if (unit.canMove()) {
      this.reachableTiles = this.getReachableTilesForUnit(unit);
    } else {
      this.reachableTiles = [];
    }

    this.refreshActionOverlay();
    this.refreshHud();
  }

  private setActionMode(mode: ActionMode): void {
    if (this.battleEnded) {
      return;
    }

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
    if (isTileOccupiedByOtherUnit(
      this.getAliveUnits().map((candidate) => ({
        id: candidate.getId(),
        tileX: candidate.getTileX(),
        tileY: candidate.getTileY(),
        isAlive: candidate.isAlive(),
      })),
      tileX,
      tileY,
      unit.getId(),
    )) {
      this.refreshHud('目标格已有单位，不能重叠站位。');
      return;
    }

    AudioManager.getInstance().playSfx('sfx-move');
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

  private resolveAttackSfx(sourceUnit: Unit, targetUnit: Unit): import('../core/AudioManager').SfxKey | null {
    const dx = sourceUnit.getTileX() - targetUnit.getTileX();
    const dy = sourceUnit.getTileY() - targetUnit.getTileY();
    const distance = Math.max(Math.abs(dx), Math.abs(dy));

    if (this.actionMode === 'basic') {
      return distance > 1 ? 'sfx-ranged' : 'sfx-melee';
    }
    if (this.actionMode === 'skill' || this.actionMode === 'combo') {
      return 'sfx-magic';
    }
    return null;
  }

  private resolveAttackParticleType(): import('../core/VisualEffects').ParticleType | null {
    if (this.actionMode === 'basic') {
      return 'slash';
    }
    if (this.actionMode === 'skill' || this.actionMode === 'combo') {
      return 'magic';
    }
    return null;
  }

  private applyResolution(sourceUnit: Unit, targetUnit: Unit, result: ReturnType<typeof ActionResolver.resolvePrimaryAction>): void {
    const summaries: string[] = [result.summary];
    const targetHpBefore = targetUnit.getHp();

    const attackSfx = this.resolveAttackSfx(sourceUnit, targetUnit);
    if (attackSfx) {
      AudioManager.getInstance().playSfx(attackSfx);
    }

    const targetPos = targetUnit.getWorldPosition();
    const particleType = this.resolveAttackParticleType();
    if (particleType) {
      VisualEffects.spawnParticles(this, targetPos.x, targetPos.y, particleType);
    }

    if (result.appliedDamage) {
      targetUnit.applyResolvedDamage(result.appliedDamage);
      this.spawnDamageText(targetUnit, result.appliedDamage, 'damage');
      if (result.appliedDamage > 20) {
        VisualEffects.screenShake(this);
      }
      if (sourceUnit.getSquad() <= 1) {
        this.riftDamageDealt += result.appliedDamage;
      }
      if (targetUnit.getSquad() <= 1) {
        this.riftDamageTaken += result.appliedDamage;
      }
    }

    if (result.appliedHealing) {
      targetUnit.heal(result.appliedHealing);
      this.spawnDamageText(targetUnit, result.appliedHealing, 'heal');
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

  private isUnitStandingOnObjectiveTile(unit: Unit): boolean {
    return this.gridMap.getObjectiveTiles().some((tile) => tile.x === unit.getTileX() && tile.y === unit.getTileY());
  }

  private removeUnitFromBattle(unit: Unit): void {
    this.stopActiveTweens(unit.getId());
    this.turnManager.removeUnit(unit);
    this.units = this.units.filter((candidate) => candidate.getId() !== unit.getId());
    const badge = this.unitBadges.get(unit.getId());
    if (badge) {
      badge.destroy();
      this.unitBadges.delete(unit.getId());
    }
    const hpBar = this.hpBars.get(unit.getId());
    if (hpBar) {
      hpBar.destroy();
      this.hpBars.delete(unit.getId());
    }
    unit.destroy();
  }

  shutdown(): void {
    this.hpBars.forEach((hpBar) => hpBar.destroy());
    this.hpBars.clear();
    this.activeTweens.forEach((tween) => tween.stop());
    this.activeTweens.clear();
  }

  private handleExtract(): void {
    if (!this.extractionManager) {
      this.refreshHud('当前不是任务模式，无法提取。');
      return;
    }
    if (!this.extractionManager.isExtractionAvailable()) {
      this.refreshHud('提取尚未可用。');
      return;
    }
    const survivingUnits = this.units.filter((unit) => unit.isAlive());
    const result = this.extractionManager.evaluateExtraction(survivingUnits);
    if (result.success) {
      this.refreshLog(`[提取成功] ${result.reason}`);
      this.showExtractionResult(result.rewards);
    } else {
      this.refreshLog(`[提取失败] ${result.reason}`);
    }
  }

  private showExtractionResult(rewards: import('../data/MissionTypes').Reward[]): void {
    this.battleEnded = true;
    const panelWidth = Math.min(760, this.scale.width - 48);
    const panelHeight = Math.min(540, this.scale.height - 48);
    createPanel(this, this.scale.width / 2, this.scale.height / 2, panelWidth, panelHeight, { depth: 40 });
    const rewardText = rewards.map((r) => {
      const label = r.type === 'resource' ? '资源' : r.type === 'experience' ? '经验' : '解锁';
      return `${label} ${r.itemId} x${r.amount}`;
    }).join('\n');
    this.add.text(this.scale.width / 2, this.scale.height / 2, `提取成功！\n\n获得奖励：\n${rewardText}\n\n按 R 返回主菜单。`, {
      color: COLORS.text.primary,
      fontFamily: FONTS.body.family,
      fontSize: FONTS.body.size,
      align: 'left',
      wordWrap: { width: panelWidth - 40 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(41);
    this.refreshLog('提取完成，按 R 返回主菜单。');
  }

  private tryResolveExtraction(unit: Unit): boolean {
    if (!this.missionManager.canUnitExtract(unit.getId(), unit.getSquad())) {
      return false;
    }

    if (!this.isUnitStandingOnObjectiveTile(unit)) {
      return false;
    }

    if (!this.missionManager.extractUnit(unit.getId())) {
      return false;
    }

    this.removeUnitFromBattle(unit);
    this.refreshLog(`[撤离] ${this.getUnitDisplayName(unit)} 已成功撤离。`);
    return true;
  }

  private endActiveTurn(): void {
    if (this.battleEnded || !this.turnManager.getActiveUnit()) {
      return;
    }

    const activeUnit = this.turnManager.getActiveUnit();
    if (!activeUnit) {
      return;
    }

    // Stop floating animation before ending turn
    this.stopFloatingAnimation(activeUnit);

    const extracted = this.tryResolveExtraction(activeUnit);
    this.selectedUnit = null;
    this.actionMode = 'move';
    this.selectedModuleId = null;
    if (!extracted) {
      this.turnManager.endCurrentTurn();
    } else {
      this.turnManager.startNextTurn();
    }
    if (this.extractionManager) {
      this.extractionManager.incrementTurn();
    }
    this.clearReachableTiles();
    this.syncUnitBadges();
    this.refreshHud(extracted ? '单位已撤离，切换到下一回合。' : '回合结束。');
  }

  private spawnDamageText(targetUnit: Unit, value: number, type: 'damage' | 'heal' | 'miss' | 'critical'): void {
    const pos = targetUnit.getWorldPosition();
    const offsetX = (Math.random() - 0.5) * 16; // slight random x offset to avoid overlap
    const damageText = new DamageText(this, pos.x + offsetX, pos.y - 20, value, type);
    damageText.play();
  }

  private isObjectiveCompleted(): boolean {
    return Boolean(
      this.missionManager.getBossKillState()?.isDefeated
      || this.missionManager.getRelicContestState()?.isCaptured
      || this.missionManager.getCoopThenReversalState()?.isReversed
    );
  }

  private maybeShowBattleSummary(): void {
    if (this.battleEnded) {
      return;
    }

    const extractedIds = this.missionManager.getExtractedUnitIds();
    const aliveSquadUnits = this.units.filter((unit) => unit.isAlive() && unit.getSquad() <= 1);
    const aliveSquadIds = aliveSquadUnits.map((unit) => unit.getSquad());
    const squad0Alive = aliveSquadIds.indexOf(0) >= 0;
    const squad1Alive = aliveSquadIds.indexOf(1) >= 0;
    const extractionPending = this.missionManager.isExtractionUnlocked()
      && this.missionManager.getExtractionTimeRemainingMs() > 0
      && aliveSquadUnits.some((unit) => extractedIds.indexOf(unit.getId()) < 0);

    if (!this.missionManager.isCollapsed()) {
      if (!this.isObjectiveCompleted() && squad0Alive && squad1Alive) {
        return;
      }

      if (this.isObjectiveCompleted() && extractionPending) {
        return;
      }
    }

    this.battleEnded = true;
    const survivingOrExtractedUnitIds = new Set([
      ...this.units.filter((unit) => unit.isAlive()).map((unit) => unit.getId()),
      ...extractedIds,
    ]);
    const winningSquadId = resolveWinningSquadId(this.activeSetup, Array.from(survivingOrExtractedUnitIds));

    const riftRunState = this.registry.get('riftRunState') as RiftRunState | undefined;
    if (riftRunState && winningSquadId === 0) {
      const enemiesKilled = this.units.filter((unit) => unit.getSquad() > 1 && !unit.isAlive()).length;
      const updatedState = recordBattle(riftRunState, {
        enemiesKilled,
        damageDealt: this.riftDamageDealt,
        damageTaken: this.riftDamageTaken,
        goldReward: 20,
      });
      this.registry.set('riftRunState', updatedState);

      const currentRoom = updatedState.riftMap.rooms.find((r) => r.id === updatedState.riftMap.currentRoomId);
      if (currentRoom?.type === 'treasure') {
        this.scene.start('LootScene');
        return;
      }

      if (isMapComplete(updatedState.riftMap)) {
        this.scene.start('Result');
        return;
      }

      this.scene.start('RiftMapScene');
      return;
    }

    if (riftRunState && winningSquadId !== 0) {
      this.registry.set('riftRunState', { ...riftRunState, active: false });
      this.scene.start('Result');
      return;
    }

    const summary = createBattleResultSummary({
      setup: this.activeSetup,
      durationSeconds: this.missionManager.getElapsedSeconds(),
      objectiveCompleted: this.isObjectiveCompleted(),
      extractedUnitIds: extractedIds,
      survivingUnitIds: Array.from(survivingOrExtractedUnitIds),
      winningSquadId,
      extractionPayout: {
        conversionRate: 0.5,
        partialRetention: this.missionManager.getTemplate()?.extractionRules.partialRetention ?? 0.25,
        minimumPayout: 10,
      },
    });

    const panelWidth = Math.min(760, this.scale.width - 48);
    const panelHeight = Math.min(540, this.scale.height - 48);
    createPanel(this, this.scale.width / 2, this.scale.height / 2, panelWidth, panelHeight, { depth: 40 });
    this.add.text(this.scale.width / 2, this.scale.height / 2, getBattleResultSummaryText(summary), {
      color: COLORS.text.primary,
      fontFamily: FONTS.body.family,
      fontSize: FONTS.body.size,
      align: 'left',
      wordWrap: { width: panelWidth - 40 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(41);
    this.refreshLog('战斗结束，按 R 返回设置。');
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
    this.updateMissionMarkers();
    this.maybeShowBattleSummary();

    if (this.battleEnded) {
      this.syncUnitBadges();
      this.validatePortraitLayout();
      return;
    }

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
