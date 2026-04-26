import { Scene, GameObjects } from 'phaser';
import { StatusEffect } from './StatusEffect';
import { ModuleDefinition } from '../data/ModuleTypes';

export type ChassisType = 'vanguard' | 'skirmisher' | 'caster' | 'support' | 'controller';
export type FacingDirection = 'north' | 'south' | 'east' | 'west';

export interface UnitStats {
  hp: number;
  maxHp: number;
  move: number;
  jump: number;
  speed: number;
  attack: number;
  defense: number;
}

export interface EquippedModules {
  active: ModuleDefinition[];
  passive: ModuleDefinition[];
  combo: ModuleDefinition[];
  tool: ModuleDefinition[];
}

export class Unit {
  private static nextId = 1;

  private readonly id: string;
  private scene: Scene;
  private sprite: GameObjects.Image;
  private tileX: number;
  private tileY: number;
  private chassis: ChassisType;
  private squad: number;
  private stats: UnitStats;
  private baseStats: UnitStats;
  private facing: FacingDirection = 'south';
  private statuses: StatusEffect[] = [];
  private isTurnActive: boolean = false;
  private hasMoved: boolean = false;
  private hasActed: boolean = false;
  private hasUsedTool: boolean = false;
  private moveBlockedThisTurn: boolean = false;
  private actBlockedThisTurn: boolean = false;
  private equippedModules: EquippedModules = {
    active: [],
    passive: [],
    combo: [],
    tool: [],
  };
  private toolUsesThisTurn: Map<string, number> = new Map();
  private onHpChanged: ((currentHp: number, maxHp: number) => void) | null = null;
  private onDeath: (() => void) | null = null;

  constructor(scene: Scene, tileX: number, tileY: number, chassis: ChassisType, squad: number, id?: string) {
    this.id = id ?? `unit-${Unit.nextId++}`;
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;
    this.chassis = chassis;
    this.squad = squad;
    this.baseStats = this.getBaseStats(chassis);
    this.stats = { ...this.baseStats };
    
    const worldPos = this.getWorldPosition();
    this.sprite = scene.add.image(worldPos.x, worldPos.y, `unit-${chassis}`);
    this.sprite.setDisplaySize(48, 48);
    
    // Tint by squad
    if (squad === 0) {
      this.sprite.setTint(0x6699ff);
    } else if (squad === 1) {
      this.sprite.setTint(0xff6666);
    } else {
      this.sprite.setTint(0xffc857);
    }
  }

  private getBaseStats(chassis: ChassisType): UnitStats {
    const baseStats: Record<ChassisType, UnitStats> = {
      vanguard: { hp: 120, maxHp: 120, move: 3, jump: 1, speed: 8, attack: 15, defense: 12 },
      skirmisher: { hp: 90, maxHp: 90, move: 4, jump: 2, speed: 10, attack: 12, defense: 8 },
      caster: { hp: 70, maxHp: 70, move: 3, jump: 1, speed: 7, attack: 18, defense: 5 },
      support: { hp: 80, maxHp: 80, move: 3, jump: 1, speed: 9, attack: 8, defense: 7 },
      controller: { hp: 85, maxHp: 85, move: 3, jump: 1, speed: 8, attack: 10, defense: 9 },
    };
    return { ...baseStats[chassis] };
  }

  getWorldPosition(): { x: number; y: number } {
    // Get position from grid map via scene registry
    const gridMap = this.scene.registry.get('gridMap');
    if (gridMap) {
      return gridMap.getTileWorldPosition(this.tileX, this.tileY);
    }
    // Fallback
    return { x: this.tileX * 64 + 32, y: this.tileY * 64 + 32 };
  }

  moveTo(tileX: number, tileY: number): void {
    this.tileX = tileX;
    this.tileY = tileY;
    const pos = this.getWorldPosition();
    this.sprite.setPosition(pos.x, pos.y);
    this.hasMoved = true;
  }

  repositionTo(tileX: number, tileY: number): void {
    this.tileX = tileX;
    this.tileY = tileY;
    const pos = this.getWorldPosition();
    this.sprite.setPosition(pos.x, pos.y);
  }

  startTurn(): void {
    this.isTurnActive = true;
    this.resetTurnState();
    
    // Process status effects
    this.processStatusEffects();
  }

  endTurn(): void {
    this.isTurnActive = false;
  }

  processStatusEffects(): void {
    this.moveBlockedThisTurn = false;
    this.actBlockedThisTurn = false;
    this.statuses = this.statuses.filter(status => {
      this.moveBlockedThisTurn = this.moveBlockedThisTurn || !status.canMove();
      this.actBlockedThisTurn = this.actBlockedThisTurn || !status.canAct();
      status.tick(this);
      return status.isActive();
    });
    this.recalculateStats();
  }

  canMove(): boolean {
    if (!this.isTurnActive || this.hasMoved) return false;
    if (this.moveBlockedThisTurn) return false;
    return this.statuses.every(s => s.canMove());
  }

  canAct(): boolean {
    if (!this.isTurnActive || this.hasActed) return false;
    if (this.actBlockedThisTurn) return false;
    return this.statuses.every(s => s.canAct());
  }

  canUseTool(): boolean {
    return this.isTurnActive && !this.hasUsedTool;
  }

  getSlotLimits(): Record<string, number> {
    // Default slot limits; can be overridden by chassis data from ContentLoader
    const defaults: Record<string, number> = {
      active: 2,
      passive: 1,
      combo: 1,
      tool: 1,
    };
    return { ...defaults };
  }

  equipModule(module: ModuleDefinition): boolean {
    const category = module.category;
    const currentCount = this.equippedModules[category].length;
    const limits = this.getSlotLimits();
    const limit = limits[category] ?? 1;

    if (currentCount >= limit) {
      return false;
    }

    this.equippedModules[category].push(module);

    // Apply passive effects immediately
    if (category === 'passive') {
      this.applyPassiveEffects();
    }

    return true;
  }

  unequipModule(moduleId: string, category: string): boolean {
    const modules = this.equippedModules[category as keyof EquippedModules];
    const index = modules.findIndex(m => m.id === moduleId);
    if (index >= 0) {
      modules.splice(index, 1);
      if (category === 'passive') {
        this.recalculateStats();
      }
      return true;
    }
    return false;
  }

  getEquippedModules(): EquippedModules {
    return {
      active: [...this.equippedModules.active],
      passive: [...this.equippedModules.passive],
      combo: [...this.equippedModules.combo],
      tool: [...this.equippedModules.tool],
    };
  }

  getModulesByCategory(category: string): ModuleDefinition[] {
    return [...this.equippedModules[category as keyof EquippedModules]];
  }

  private applyPassiveEffects(): void {
    this.recalculateStats();
  }

  private recalculateStats(): void {
    const currentHp = this.stats.hp;
    // Reset to base stats
    this.stats = { ...this.baseStats, hp: Math.min(currentHp, this.baseStats.maxHp) };
    
    // Apply passive module effects
    for (const module of this.equippedModules.passive) {
      for (const effect of module.effects) {
        if (effect.type === 'stat_mod' && effect.stat && effect.value) {
          const stat = effect.stat as keyof UnitStats;
          if (stat in this.stats) {
            (this.stats[stat] as number) += effect.value;
          }
        }
      }
    }
    
    // Apply status effect modifiers
    for (const status of this.statuses) {
      this.stats.speed = status.modifySpeed(this.stats.speed);
      this.stats.defense = status.modifyDefense(this.stats.defense);
    }
    
    // Ensure HP doesn't exceed maxHp after stat changes
    this.stats.hp = Math.min(this.stats.hp, this.stats.maxHp);
  }

  useTool(module: ModuleDefinition): boolean {
    if (!this.canUseTool()) return false;
    
    const usesThisTurn = this.toolUsesThisTurn.get(module.id) || 0;
    const maxUses = module.usesPerTurn || 1;
    
    if (usesThisTurn >= maxUses) {
      return false;
    }
    
    this.toolUsesThisTurn.set(module.id, usesThisTurn + 1);
    this.hasUsedTool = true;
    return true;
  }

  performAction(): void {
    this.hasActed = true;
  }

  consumeToolOpportunity(): void {
    this.hasUsedTool = true;
  }

  resetTurnState(): void {
    this.hasMoved = false;
    this.hasActed = false;
    this.hasUsedTool = false;
    this.toolUsesThisTurn.clear();
  }

  getTileX(): number { return this.tileX; }
  getTileY(): number { return this.tileY; }
  getId(): string { return this.id; }
  getChassis(): ChassisType { return this.chassis; }
  getSquad(): number { return this.squad; }
  getSpeed(): number { return this.stats.speed; }
  getMove(): number { return this.stats.move; }
  getJump(): number { return this.stats.jump; }
  getFacing(): FacingDirection { return this.facing; }
  isAlive(): boolean { return this.stats.hp > 0; }
  getHp(): number { return this.stats.hp; }
  getMaxHp(): number { return this.stats.maxHp; }
  getAttack(): number { return this.stats.attack; }
  getDefense(): number { return this.stats.defense; }
  hasPrimaryActionRemaining(): boolean { return this.canAct(); }
  hasToolOpportunityRemaining(): boolean { return this.canUseTool(); }
  getActiveModules(): ModuleDefinition[] { return [...this.equippedModules.active]; }
  getComboModules(): ModuleDefinition[] { return [...this.equippedModules.combo]; }
  getToolModules(): ModuleDefinition[] { return [...this.equippedModules.tool]; }
  
  setFacing(direction: FacingDirection): void {
    this.facing = direction;
  }

  setOnHpChanged(callback: ((currentHp: number, maxHp: number) => void) | null): void {
    this.onHpChanged = callback;
  }

  setOnDeath(callback: (() => void) | null): void {
    this.onDeath = callback;
  }

  private notifyHpChanged(): void {
    if (this.onHpChanged) {
      this.onHpChanged(this.stats.hp, this.stats.maxHp);
    }
  }

  private notifyDeath(): void {
    if (this.onDeath) {
      this.onDeath();
    }
  }

  takeDamage(amount: number): void {
    const wasAlive = this.isAlive();
    const actualDamage = Math.max(1, amount - this.stats.defense);
    this.stats.hp = Math.max(0, this.stats.hp - actualDamage);
    this.notifyHpChanged();

    if (wasAlive && this.stats.hp <= 0) {
      this.die();
    }
  }

  heal(amount: number): void {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
    this.notifyHpChanged();
  }

  applyResolvedDamage(amount: number): void {
    const wasAlive = this.isAlive();
    let adjustedDamage = Math.max(0, Math.round(amount));

    for (const status of this.statuses) {
      adjustedDamage = status.adjustIncomingDamage(adjustedDamage);
    }

    for (const status of this.statuses) {
      adjustedDamage = status.absorbIncomingDamage(adjustedDamage);
    }

    this.stats.hp = Math.max(0, this.stats.hp - adjustedDamage);
    this.notifyHpChanged();

    if (wasAlive && this.stats.hp <= 0) {
      this.die();
    }
  }

  applyStatusDamage(amount: number): void {
    const wasAlive = this.isAlive();
    this.stats.hp = Math.max(0, this.stats.hp - Math.max(0, Math.round(amount)));
    this.notifyHpChanged();

    if (wasAlive && this.stats.hp <= 0) {
      this.die();
    }
  }

  private die(): void {
    this.sprite.setAlpha(0.5);
    this.sprite.setTint(0x666666);
    this.notifyDeath();
  }

  addStatus(status: StatusEffect): void {
    this.statuses.push(status);
    this.recalculateStats();
  }

  getStatuses(): StatusEffect[] {
    return [...this.statuses];
  }

  getStatusSummary(): string[] {
    return this.statuses.map((status) => status.getSummary());
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
