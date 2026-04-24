import { describe, expect, it } from 'vitest';
import { SquadComboResource } from './SquadComboResource';

describe('SquadComboResource', () => {
  it('tracks combo resource independently per squad', () => {
    const resource = new SquadComboResource(3, [0, 1]);

    expect(resource.getState(0)).toEqual({ current: 3, max: 3 });
    expect(resource.getState(1)).toEqual({ current: 3, max: 3 });

    expect(resource.spend(0, 2)).toBe(true);

    expect(resource.getState(0)).toEqual({ current: 1, max: 3 });
    expect(resource.getState(1)).toEqual({ current: 3, max: 3 });
  });

  it('refuses to overspend a squad combo pool', () => {
    const resource = new SquadComboResource(2, [0]);

    expect(resource.spend(0, 3)).toBe(false);
    expect(resource.getState(0)).toEqual({ current: 2, max: 2 });
  });
});
