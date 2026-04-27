import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  BATTLE_RUNTIME_IMAGE_ASSETS,
  BATTLE_TERRAIN_ASSETS,
  BATTLE_UNIT_ASSETS,
} from './BattleVisualAssets';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ALPHA_CAPABLE_COLOR_TYPES = new Set([4, 6]);

interface PngInfo {
  width: number;
  height: number;
  colorType: number;
  bitDepth: number;
}

interface RgbaPng extends PngInfo {
  pixels: Buffer;
}

function readAsset(path: string): Buffer {
  return readFileSync(join(process.cwd(), 'assets', path));
}

function readPngInfo(buffer: Buffer): PngInfo {
  expect(buffer.subarray(0, PNG_SIGNATURE.length)).toEqual(PNG_SIGNATURE);
  expect(buffer.subarray(12, 16).toString('ascii')).toBe('IHDR');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
  };
}

function paethPredictor(left: number, up: number, upLeft: number): number {
  const estimate = left + up - upLeft;
  const distanceLeft = Math.abs(estimate - left);
  const distanceUp = Math.abs(estimate - up);
  const distanceUpLeft = Math.abs(estimate - upLeft);

  if (distanceLeft <= distanceUp && distanceLeft <= distanceUpLeft) {
    return left;
  }
  if (distanceUp <= distanceUpLeft) {
    return up;
  }
  return upLeft;
}

function decodeRgbaPng(buffer: Buffer): RgbaPng {
  const info = readPngInfo(buffer);

  expect(info.bitDepth).toBe(8);
  expect(info.colorType).toBe(6);

  const idatChunks: Buffer[] = [];
  let offset = PNG_SIGNATURE.length;

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;

    if (type === 'IDAT') {
      idatChunks.push(buffer.subarray(dataStart, dataEnd));
    }
    if (type === 'IEND') {
      break;
    }

    offset = dataEnd + 4;
  }

  const bytesPerPixel = 4;
  const stride = info.width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  const pixels = Buffer.alloc(stride * info.height);

  for (let y = 0; y < info.height; y += 1) {
    const sourceOffset = y * (stride + 1);
    const filter = inflated[sourceOffset];
    const row = inflated.subarray(sourceOffset + 1, sourceOffset + 1 + stride);
    const previousRowOffset = (y - 1) * stride;
    const targetOffset = y * stride;

    for (let x = 0; x < stride; x += 1) {
      const raw = row[x];
      const left = x >= bytesPerPixel ? pixels[targetOffset + x - bytesPerPixel] : 0;
      const up = y > 0 ? pixels[previousRowOffset + x] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? pixels[previousRowOffset + x - bytesPerPixel] : 0;

      switch (filter) {
        case 0:
          pixels[targetOffset + x] = raw;
          break;
        case 1:
          pixels[targetOffset + x] = (raw + left) & 0xff;
          break;
        case 2:
          pixels[targetOffset + x] = (raw + up) & 0xff;
          break;
        case 3:
          pixels[targetOffset + x] = (raw + Math.floor((left + up) / 2)) & 0xff;
          break;
        case 4:
          pixels[targetOffset + x] = (raw + paethPredictor(left, up, upLeft)) & 0xff;
          break;
        default:
          throw new Error(`Unsupported PNG filter ${filter}`);
      }
    }
  }

  return { ...info, pixels };
}

function getAlphaAt(image: RgbaPng, x: number, y: number): number {
  return image.pixels[(y * image.width + x) * 4 + 3];
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
      const { colorType } = readPngInfo(buffer);

      expect.soft(asset.path.endsWith('.png'), asset.path).toBe(true);
      expect.soft(ALPHA_CAPABLE_COLOR_TYPES.has(colorType), `${asset.key} -> ${asset.path}`).toBe(true);
    }
  });

  it('loads canonical terrain sprite exports at runtime', () => {
    expect(BATTLE_TERRAIN_ASSETS.map((asset) => asset.path)).toEqual([
      'tiles/tile-plain-sprite.png',
      'tiles/tile-mountain-sprite.png',
      'tiles/tile-urban-sprite.png',
      'tiles/tile-forest-sprite.png',
      'tiles/tile-water-sprite.png',
    ]);
  });

  it('keeps terrain sprite corners fully transparent', () => {
    for (const asset of BATTLE_TERRAIN_ASSETS) {
      const image = decodeRgbaPng(readAsset(asset.path));
      const cornerAlphaValues = [
        getAlphaAt(image, 0, 0),
        getAlphaAt(image, image.width - 1, 0),
        getAlphaAt(image, 0, image.height - 1),
        getAlphaAt(image, image.width - 1, image.height - 1),
      ];

      expect.soft(cornerAlphaValues, asset.path).toEqual([0, 0, 0, 0]);
    }
  });
});
