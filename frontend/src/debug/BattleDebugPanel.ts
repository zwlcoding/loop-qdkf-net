import { Scene, GameObjects } from 'phaser';
import { TurnManager } from '../core/TurnManager';
import { MissionManager } from '../core/MissionManager';
import { SquadComboResource } from '../core/SquadComboResource';
import { GridMap } from '../core/GridMap';
import { Unit } from '../entities/Unit';
import { ActionResolver } from '../core/ActionResolver';

export interface DebugPanelDeps {
  scene: Scene;
  turnManager: TurnManager;
  missionManager: MissionManager;
  squadComboResource: SquadComboResource;
  gridMap: GridMap;
  getSelectedUnit: () => Unit | null;
  getHoveredTile: () => { x: number; y: number } | null;
  getUnits: () => Unit[];
}

export class BattleDebugPanel {
  private deps: DebugPanelDeps;
  private visible = false;
  private container!: GameObjects.Container;
  private bg!: GameObjects.Rectangle;
  private text!: GameObjects.Text;
  private toggleKey!: Phaser.Input.Keyboard.Key;

  constructor(deps: DebugPanelDeps) {
    this.deps = deps;
    this.createElements();
    this.setupToggle();
  }

  private createElements(): void {
    const { scene } = this.deps;
    const w = 420;
    const h = 520;
    const x = scene.scale.width - w - 12;
    const y = 12;

    this.bg = scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0x0a0e1a, 0.92)
      .setStrokeStyle(1, 0x334155)
      .setScrollFactor(0)
      .setDepth(30)
      .setVisible(false);

    this.text = scene.add.text(x + 10, y + 10, '', {
      color: '#e2e8f0',
      fontFamily: 'monospace',
      fontSize: '12px',
      lineSpacing: 4,
      wordWrap: { width: w - 20 },
    }).setScrollFactor(0).setDepth(31).setVisible(false);

    this.container = scene.add.container(0, 0, [this.bg, this.text])
      .setScrollFactor(0)
      .setDepth(30)
      .setVisible(false);
  }

  private setupToggle(): void {
    const keyboard = this.deps.scene.input.keyboard;
    if (!keyboard) return;

    this.toggleKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACK_SLASH);
    this.toggleKey.on('down', () => {
      this.visible = !this.visible;
      this.container.setVisible(this.visible);
    });
  }

  update(): void {
    if (!this.visible) return;
    this.text.setText(this.buildLines().join('\n'));
  }

  isVisible(): boolean {
    return this.visible;
  }

  setVisible(value: boolean): void {
    this.visible = value;
    this.container.setVisible(value);
  }

  destroy(): void {
    this.toggleKey?.off('down');
    this.container.destroy();
  }

  private buildLines(): string[] {
    const lines: string[] = [];
    lines.push('[调试面板 — 按 \\ 切换]');
    lines.push('');

    lines.push(...this.buildTurnOrderLines());
    lines.push('');
    lines.push(...this.buildMissionStateLines());
    lines.push('');
    lines.push(...this.buildSelectedUnitLines());
    lines.push('');
    lines.push(...this.buildTileLines());
    lines.push('');
    lines.push(...this.buildComboLines());
    lines.push('');
    lines.push(...this.buildExtractionLines());

    return lines;
  }

  private buildTurnOrderLines(): string[] {
    const { turnManager } = this.deps;
    const order = turnManager.getTurnOrder();
    const active = turnManager.getActiveUnit();
    const lines: string[] = ['【回合顺序】'];

    if (order.length === 0) {
      lines.push('  无单位');
      return lines;
    }

    order.forEach((unit, index) => {
      const marker = unit === active ? '▶' : ' ';
      const alive = unit.isAlive() ? '' : '[阵亡]';
      lines.push(`  ${marker} ${index + 1}. ${unit.getId()} 速${unit.getSpeed()} ${alive}`);
    });

    return lines;
  }

  private buildMissionStateLines(): string[] {
    const { missionManager } = this.deps;
    const state = missionManager.getState();
    const lines: string[] = ['【任务状态】'];

    if (!state) {
      lines.push('  未启动');
      return lines;
    }

    lines.push(`  任务：${missionManager.getMissionName()}`);
    lines.push(`  类型：${missionManager.getMissionType()}`);
    lines.push(`  已进行：${missionManager.getElapsedSeconds()}秒`);
    lines.push(`  揭晓：${state.isRevealed ? '已揭晓' : `侦察中（剩${missionManager.getRemainingRevealSeconds()}秒）`}`);
    lines.push(`  当前目标：${missionManager.getCurrentObjectiveText()}`);
    lines.push(`  压迫阶段：${missionManager.getPressureStage()}`);
    lines.push(`  区域崩溃：${missionManager.isCollapsed() ? '是' : '否'}`);

    return lines;
  }

  private buildSelectedUnitLines(): string[] {
    const unit = this.deps.getSelectedUnit();
    const lines: string[] = ['【选中单位】'];

    if (!unit) {
      lines.push('  未选中');
      return lines;
    }

    lines.push(`  ID：${unit.getId()}`);
    lines.push(`  机体：${unit.getChassis()}`);
    lines.push(`  队伍：${unit.getSquad() === 0 ? 'A' : 'B'}`);
    lines.push(`  坐标：(${unit.getTileX()}, ${unit.getTileY()})`);
    lines.push(`  朝向：${this.facingLabel(unit.getFacing())}`);
    lines.push(`  HP：${unit.getHp()}/${unit.getMaxHp()}`);
    lines.push(`  攻击：${unit.getAttack()}  防御：${unit.getDefense()}`);
    lines.push(`  移动力：${unit.getMove()}  跳跃：${unit.getJump()}  速度：${unit.getSpeed()}`);
    lines.push(`  可移动：${unit.canMove() ? '是' : '否'}  可行动：${unit.canAct() ? '是' : '否'}  可用道具：${unit.canUseTool() ? '是' : '否'}`);

    const statuses = unit.getStatusSummary();
    lines.push(`  状态：${statuses.length ? statuses.join('，') : '无'}`);

    const modules = unit.getEquippedModules();
    lines.push(`  模块：主动${modules.active.length} 被动${modules.passive.length} 连携${modules.combo.length} 道具${modules.tool.length}`);

    return lines;
  }

  private buildTileLines(): string[] {
    const { gridMap, getHoveredTile, getSelectedUnit } = this.deps;
    const hovered = getHoveredTile();
    const selectedUnit = getSelectedUnit();
    const lines: string[] = ['【地块信息】'];

    const reportTile = (label: string, x: number, y: number) => {
      const tile = gridMap.getTile(x, y);
      if (!tile) {
        lines.push(`  ${label}：无效坐标`);
        return;
      }
      lines.push(`  ${label}：(${x},${y}) 高度${tile.height} ${tile.walkable ? '可通行' : '不可通行'} ${tile.terrain}${tile.hazardType ? ' 危险:' + tile.hazardType : ''}${tile.objectiveId ? ' 目标点' : ''}`);
    };

    if (hovered) {
      reportTile('悬停', hovered.x, hovered.y);
    } else {
      lines.push('  悬停：无');
    }

    if (selectedUnit) {
      reportTile('选中单位脚下', selectedUnit.getTileX(), selectedUnit.getTileY());
    } else {
      lines.push('  选中单位脚下：无');
    }

    return lines;
  }

  private buildComboLines(): string[] {
    const { turnManager, squadComboResource, getSelectedUnit, getUnits } = this.deps;
    const lines: string[] = ['【连携资格】'];
    const activeUnit = turnManager.getActiveUnit();
    const selectedUnit = getSelectedUnit();

    if (!selectedUnit) {
      lines.push('  未选中单位');
      return lines;
    }

    const squad = selectedUnit.getSquad();
    const comboState = squadComboResource.getState(squad);
    lines.push(`  队伍${squad === 0 ? 'A' : 'B'}连携值：${comboState.current}/${comboState.max}`);

    const comboModules = selectedUnit.getComboModules();
    if (comboModules.length === 0) {
      lines.push('  未装备连携模块');
      return lines;
    }

    comboModules.forEach((mod) => {
      const cost = Math.max(1, mod.comboCost ?? 1);
      const affordable = comboState.current >= cost;
      lines.push(`  ${mod.name}：消耗${cost} ${affordable ? '可支付' : '不足'}`);
    });

    if (selectedUnit !== activeUnit) {
      lines.push('  提示：仅当前回合单位可发起连携');
      return lines;
    }

    // Show eligible participants for each enemy target
    const potentialParticipants = getUnits()
      .filter((u) => u.isAlive() && u.getId() !== selectedUnit.getId())
      .map((u) => this.buildUnitActionState(u));

    const enemies = getUnits().filter((u) => u.isAlive() && u.getSquad() !== squad);
    if (enemies.length === 0) {
      lines.push('  场上无敌方单位');
      return lines;
    }

    const actorState = this.buildUnitActionState(selectedUnit);
    enemies.forEach((enemy) => {
      const targetState = {
        id: enemy.getId(),
        squad: enemy.getSquad(),
        tileX: enemy.getTileX(),
        tileY: enemy.getTileY(),
        hp: enemy.getHp(),
        maxHp: enemy.getMaxHp(),
      };
      comboModules.forEach((mod) => {
        const eligible = ActionResolver.getEligibleComboParticipants(
          actorState,
          targetState,
          potentialParticipants,
          mod,
          { hasLineOfSight: (fx, fy, tx, ty) => this.deps.gridMap.hasLineOfSight(fx, fy, tx, ty) }
        );
        lines.push(`  → ${enemy.getId()}(${mod.name}) 可参与者：${eligible.length}人${eligible.map((e) => e.id).join('、') ? '：' + eligible.map((e) => e.id).join('、') : ''}`);
      });
    });

    return lines;
  }

  private buildExtractionLines(): string[] {
    const { missionManager, getSelectedUnit } = this.deps;
    const lines: string[] = ['【撤离条件】'];

    if (!missionManager.isExtractionUnlocked()) {
      lines.push('  撤离点：锁定');
      lines.push(`  解锁条件：${missionManager.getCurrentObjectiveText()}`);
      return lines;
    }

    lines.push(`  撤离点：已解锁`);
    lines.push(`  状态文本：${missionManager.getExtractionStatusText()}`);
    lines.push(`  剩余名额：${missionManager.getExtractionCapacityRemaining() === Infinity ? '无限制' : missionManager.getExtractionCapacityRemaining()}`);
    lines.push(`  剩余时间：${Math.ceil(missionManager.getExtractionTimeRemainingMs() / 1000)}秒`);

    const selectedUnit = getSelectedUnit();
    if (selectedUnit) {
      const canExtract = missionManager.canUnitExtract(selectedUnit.getId(), selectedUnit.getSquad());
      lines.push(`  选中单位(${selectedUnit.getId()})：${canExtract ? '可撤离' : '不可撤离'}`);
    }

    const extracted = missionManager.getExtractedUnitIds();
    lines.push(`  已撤离单位：${extracted.length ? extracted.join('、') : '无'}`);

    return lines;
  }

  private facingLabel(facing: string): string {
    const map: Record<string, string> = {
      north: '北',
      south: '南',
      east: '东',
      west: '西',
    };
    return map[facing] ?? facing;
  }

  private buildUnitActionState(unit: Unit): Parameters<typeof ActionResolver.getEligibleComboParticipants>[0] {
    return {
      id: unit.getId(),
      squad: unit.getSquad(),
      tileX: unit.getTileX(),
      tileY: unit.getTileY(),
      attack: unit.getAttack(),
      canAct: unit.canAct(),
      canUseTool: unit.canUseTool(),
      activeModules: unit.getActiveModules(),
      comboModules: unit.getComboModules(),
      toolModules: unit.getToolModules(),
    };
  }
}
