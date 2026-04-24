import { describe, it, expect } from 'vitest';
import { RunProgression } from './RunProgression';
import type { ExtractionPayout, UnlockEntry } from './RunProgression';

function makePayout(overrides?: Partial<ExtractionPayout>): ExtractionPayout {
  return {
    conversionRate: 0.5,
    partialRetention: 0.3,
    minimumPayout: 10,
    ...overrides,
  };
}

function makeUnlocks(): UnlockEntry[] {
  return [
    { id: 'u1', name: '初级补给线', description: '解锁基础商店', requiredRuns: 1, requiredTotalScrap: 0, unlocked: false },
    { id: 'u2', name: '高级情报网', description: '解锁高级选项', requiredRuns: 3, requiredTotalScrap: 100, unlocked: false },
    { id: 'u3', name: '传奇工坊', description: '解锁传奇模块', requiredRuns: 5, requiredTotalScrap: 500, unlocked: false },
  ];
}

describe('RunProgression', () => {
  it('starts with zero temporary run values', () => {
    const rp = new RunProgression(makePayout(), makeUnlocks());
    expect(rp.getRunValues()).toEqual({ scrap: 0, intel: 0 });
    expect(rp.getRunValueStatusText()).toBe('局内资源：废料 0 / 情报 0');
  });

  it('earns scrap and intel', () => {
    const rp = new RunProgression(makePayout(), makeUnlocks());
    rp.earn(50, 5);
    expect(rp.getRunValues()).toEqual({ scrap: 50, intel: 5 });
    expect(rp.getRunValueStatusText()).toBe('局内资源：废料 50 / 情报 5');
  });

  it('ignores negative earn values', () => {
    const rp = new RunProgression(makePayout(), makeUnlocks());
    rp.earn(20, 2);
    rp.earn(-10, -1);
    expect(rp.getRunValues()).toEqual({ scrap: 20, intel: 2 });
  });

  it('spends resources when sufficient', () => {
    const rp = new RunProgression(makePayout(), makeUnlocks());
    rp.earn(30, 3);
    const ok = rp.spend(10, 1);
    expect(ok).toBe(true);
    expect(rp.getRunValues()).toEqual({ scrap: 20, intel: 2 });
  });

  it('refuses spend when scrap insufficient', () => {
    const rp = new RunProgression(makePayout(), makeUnlocks());
    rp.earn(5, 5);
    const ok = rp.spend(10, 1);
    expect(ok).toBe(false);
    expect(rp.getRunValues()).toEqual({ scrap: 5, intel: 5 });
  });

  it('refuses spend when intel insufficient', () => {
    const rp = new RunProgression(makePayout(), makeUnlocks());
    rp.earn(20, 1);
    const ok = rp.spend(5, 2);
    expect(ok).toBe(false);
    expect(rp.getRunValues()).toEqual({ scrap: 20, intel: 1 });
  });

  it('ignores negative spend values', () => {
    const rp = new RunProgression(makePayout(), makeUnlocks());
    rp.earn(20, 2);
    const ok = rp.spend(-5, -1);
    expect(ok).toBe(true);
    expect(rp.getRunValues()).toEqual({ scrap: 20, intel: 2 });
  });

  it('converts scrap on successful extraction with rate and minimum', () => {
    const rp = new RunProgression(makePayout({ conversionRate: 0.5, minimumPayout: 10 }), makeUnlocks());
    rp.earn(100, 5);
    const result = rp.resolveExtraction(true);
    expect(result.convertedScrap).toBe(50);
    expect(result.retainedScrap).toBe(0);
    expect(rp.getRunValues()).toEqual({ scrap: 0, intel: 0 });
    expect(rp.getExtractionResultText()).toContain('成功');
    expect(rp.getExtractionResultText()).toContain('累计完成 1 次');
    expect(rp.getExtractionResultText()).toContain('累计转化 50 废料');
  });

  it('applies minimum payout when converted amount is below minimum', () => {
    const rp = new RunProgression(makePayout({ conversionRate: 0.1, minimumPayout: 10 }), makeUnlocks());
    rp.earn(50, 0);
    const result = rp.resolveExtraction(true);
    expect(result.convertedScrap).toBe(10);
  });

  it('retains partial scrap on failed extraction', () => {
    const rp = new RunProgression(makePayout({ partialRetention: 0.3 }), makeUnlocks());
    rp.earn(100, 4);
    const result = rp.resolveExtraction(false);
    expect(result.convertedScrap).toBe(0);
    expect(result.retainedScrap).toBe(30);
    expect(rp.getRunValues()).toEqual({ scrap: 0, intel: 0 });
    expect(rp.getExtractionResultText()).toContain('失败');
    expect(rp.getExtractionResultText()).toContain('累计完成 1 次');
  });

  it('allows a new run after previous extraction', () => {
    const rp = new RunProgression(makePayout(), makeUnlocks());
    rp.earn(100, 0);
    const first = rp.resolveExtraction(true);
    expect(first.convertedScrap).toBe(50);

    // New run values can be earned and extracted again
    rp.earn(80, 0);
    const second = rp.resolveExtraction(true);
    expect(second.convertedScrap).toBe(40);
    expect(rp.getExtractionResultText()).toContain('累计完成 2 次');
  });

  it('unlocks entries based on runs and total scrap thresholds', () => {
    const rp = new RunProgression(makePayout({ conversionRate: 1.0, minimumPayout: 0 }), makeUnlocks());
    // First run: 50 scrap -> u1 should unlock (requires 1 run, 0 scrap)
    rp.earn(50, 0);
    rp.resolveExtraction(true);
    expect(rp.isUnlocked('u1')).toBe(true);
    expect(rp.isUnlocked('u2')).toBe(false);
    expect(rp.isUnlocked('u3')).toBe(false);

    // Second run: 30 scrap -> total 80, still not enough for u2
    rp.earn(30, 0);
    rp.resolveExtraction(true);
    expect(rp.isUnlocked('u2')).toBe(false);

    // Third run: 50 scrap -> total 130, now meets u2 (3 runs, 100 scrap)
    rp.earn(50, 0);
    rp.resolveExtraction(true);
    expect(rp.isUnlocked('u2')).toBe(true);
    expect(rp.isUnlocked('u3')).toBe(false);
  });

  it('returns correct unlock status text', () => {
    const rp = new RunProgression(makePayout(), makeUnlocks());
    const text = rp.getUnlockStatusText();
    expect(text).toContain('初级补给线');
    expect(text).toContain('高级情报网');
    expect(text).toContain('传奇工坊');
    expect(text).toContain('需完成 1 次 / 累计转化 0 废料');
    expect(text).toContain('需完成 3 次 / 累计转化 100 废料');
    expect(text).toContain('需完成 5 次 / 累计转化 500 废料');
  });

  it('updates unlock status text after unlocking', () => {
    const rp = new RunProgression(makePayout({ conversionRate: 1.0, minimumPayout: 0 }), makeUnlocks());
    rp.earn(10, 0);
    rp.resolveExtraction(true);
    const text = rp.getUnlockStatusText();
    expect(text).toContain('初级补给线：已解锁');
  });

  it('returns empty unlocked list initially', () => {
    const rp = new RunProgression(makePayout(), makeUnlocks());
    expect(rp.getUnlockedEntries()).toEqual([]);
  });

  it('returns unlocked entries after progression', () => {
    const rp = new RunProgression(makePayout({ conversionRate: 1.0, minimumPayout: 0 }), makeUnlocks());
    rp.earn(10, 0);
    rp.resolveExtraction(true);
    const unlocked = rp.getUnlockedEntries();
    expect(unlocked).toHaveLength(1);
    expect(unlocked[0].id).toBe('u1');
  });

  it('preserves state immutability from getters', () => {
    const rp = new RunProgression(makePayout(), makeUnlocks());
    rp.earn(10, 1);
    const state = rp.getState();
    state.runValues.scrap = 9999;
    state.postRunUnlocks[0].unlocked = true;
    expect(rp.getRunValues().scrap).toBe(10);
    expect(rp.isUnlocked('u1')).toBe(false);
  });
});
