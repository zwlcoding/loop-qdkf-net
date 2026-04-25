import { describe, expect, it } from 'vitest';
import { resolvePublicAssetPath } from './AssetPath';

describe('resolvePublicAssetPath', () => {
  it('prefixes repo base paths for GitHub Pages assets', () => {
    expect(resolvePublicAssetPath('data/chassis.json', '/loop-qdkf-net/')).toBe('/loop-qdkf-net/data/chassis.json');
    expect(resolvePublicAssetPath('tiles/tile-grass.png', '/loop-qdkf-net/')).toBe('/loop-qdkf-net/tiles/tile-grass.png');
  });

  it('keeps local dev paths rooted at slash', () => {
    expect(resolvePublicAssetPath('data/chassis.json', '/')).toBe('/data/chassis.json');
  });

  it('normalizes duplicate slashes', () => {
    expect(resolvePublicAssetPath('/markers/marker-objective.png', '/loop-qdkf-net/')).toBe('/loop-qdkf-net/markers/marker-objective.png');
  });
});
