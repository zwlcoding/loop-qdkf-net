import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BATTLE_RUNTIME_IMAGE_ASSETS,
  BATTLE_TERRAIN_ASSETS,
  BATTLE_UNIT_ASSETS,
} from './BattleVisualAssets';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ALPHA_CAPABLE_COLOR_TYPES = new Set([4, 6]);

function readAsset(path: string): Buffer {
  return readFileSync(join(process.cwd(), 'assets', path));
}

function getPngColorType(buffer: Buffer): number {
  expect(buffer.subarray(0, PNG_SIGNATURE.length)).toEqual(PNG_SIGNATURE);
  expect(buffer.subarray(12, 16).toString('ascii')).toBe('IHDR');
  return buffer[25];
}

describe('battle visual asset contract', () => {
  it('maps every unit and terrain runtime key to a checked-in asset path', () => {
    expect(BATTLE_UNIT_ASSETS.map((asset) => asset.key)).toEqual([
      'unit-vanguard',
      'unit-skirmisher',
      'unit-controller',
      'unit-support',
      'unit-caster',
    ]);

    expect(BATTLE_TERRAIN_ASSETS.map((asset) => asset.key)).toEqual([
      'tile-plain-sprite',
      'tile-mountain-sprite',
      'tile-urban-sprite',
      'tile-forest-sprite',
      'tile-water-sprite',
    ]);
  });

  it('uses real alpha-capable PNG files for all battle runtime image assets', () => {
    for (const asset of BATTLE_RUNTIME_IMAGE_ASSETS) {
      const buffer = readAsset(asset.path);
      const colorType = getPngColorType(buffer);

      expect.soft(asset.path.endsWith('.png'), asset.path).toBe(true);
      expect.soft(ALPHA_CAPABLE_COLOR_TYPES.has(colorType), `${asset.key} -> ${asset.path}`).toBe(true);
    }
  });

  it('does not map battle runtime assets to generated non-alpha sprite exports', () => {
    for (const asset of BATTLE_RUNTIME_IMAGE_ASSETS) {
      expect(asset.path).not.toMatch(/-sprite\.png$/);
    }
  });
});
