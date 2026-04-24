import { Unit } from './Unit';

export type StatusType = 'slow' | 'root' | 'vulnerable' | 'shield' | 'stun' | 'poison';

const STATUS_LABELS: Record<StatusType, string> = {
  slow: '迟缓',
  root: '定身',
  vulnerable: '易伤',
  shield: '护盾',
  stun: '眩晕',
  poison: '中毒',
};

export class StatusEffect {
  private type: StatusType;
  private _duration: number;
  private remaining: number;
  private magnitude: number;

  constructor(type: StatusType, duration: number, magnitude: number = 1) {
    this.type = type;
    this._duration = duration;
    this.remaining = duration;
    this.magnitude = magnitude;
  }

  tick(unit: Unit): void {
    if (!this.isActive()) return;

    switch (this.type) {
      case 'poison':
        unit.applyStatusDamage(this.magnitude * 5);
        break;
      case 'stun':
        // Stun prevents action - handled in turn logic
        break;
    }

    this.remaining--;
  }

  isActive(): boolean {
    return this.remaining > 0;
  }

  getType(): StatusType {
    return this.type;
  }

  getRemaining(): number {
    return this.remaining;
  }

  getMagnitude(): number {
    return this.magnitude;
  }

  getDuration(): number {
    return this._duration;
  }

  adjustIncomingDamage(amount: number): number {
    if (this.type === 'vulnerable') {
      return Math.round(amount * (1 + this.magnitude * 0.5));
    }

    return amount;
  }

  absorbIncomingDamage(amount: number): number {
    if (this.type !== 'shield' || amount <= 0) {
      return amount;
    }

    const shieldValue = this.magnitude * 5;
    const absorbed = Math.min(shieldValue, amount);
    this.magnitude = Math.max(0, (shieldValue - absorbed) / 5);
    return amount - absorbed;
  }

  getSummary(): string {
    const label = `${STATUS_LABELS[this.type]} ${this.remaining}回合`;

    switch (this.type) {
      case 'poison':
        return `${label}(每回合${this.magnitude * 5})`;
      case 'shield':
        return `${label}(吸收${Math.round(this.magnitude * 5)})`;
      default:
        return label;
    }
  }

  // Modifiers applied during combat
  modifySpeed(baseSpeed: number): number {
    if (this.type === 'slow') {
      return Math.max(1, baseSpeed - this.magnitude * 2);
    }
    return baseSpeed;
  }

  canMove(): boolean {
    return this.type !== 'root' && this.type !== 'stun';
  }

  canAct(): boolean {
    return this.type !== 'stun';
  }

  modifyDefense(baseDefense: number): number {
    if (this.type === 'vulnerable') {
      return Math.max(0, baseDefense - this.magnitude * 3);
    }
    if (this.type === 'shield') {
      return baseDefense + this.magnitude * 5;
    }
    return baseDefense;
  }
}
