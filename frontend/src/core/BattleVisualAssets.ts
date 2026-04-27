export interface BattleImageAsset {
  key: string;
  path: string;
}

export const BATTLE_UNIT_ASSETS: BattleImageAsset[] = [
  { key: 'unit-vanguard', path: 'units/unit-vanguard.png' },
  { key: 'unit-skirmisher', path: 'units/unit-skirmisher.png' },
  { key: 'unit-controller', path: 'units/unit-controller.png' },
  { key: 'unit-support', path: 'units/unit-support.png' },
  { key: 'unit-caster', path: 'units/unit-caster.png' },
];

export const BATTLE_TERRAIN_ASSETS: BattleImageAsset[] = [
  { key: 'tile-plain-sprite', path: 'tiles/tile-grass.png' },
  { key: 'tile-mountain-sprite', path: 'tiles/tile-dirt.png' },
  { key: 'tile-urban-sprite', path: 'tiles/tile-stone.png' },
  { key: 'tile-forest-sprite', path: 'tiles/tile-grass.png' },
  { key: 'tile-water-sprite', path: 'tiles/tile-water.png' },
];

export const BATTLE_TERRAIN_TEXTURE_BY_TERRAIN = {
  plain: 'tile-plain-sprite',
  mountain: 'tile-mountain-sprite',
  urban: 'tile-urban-sprite',
  forest: 'tile-forest-sprite',
  water: 'tile-water-sprite',
  grass: 'tile-plain-sprite',
  dirt: 'tile-mountain-sprite',
  stone: 'tile-urban-sprite',
} as const;

export const BATTLE_RUNTIME_IMAGE_ASSETS: BattleImageAsset[] = [
  ...BATTLE_UNIT_ASSETS,
  ...BATTLE_TERRAIN_ASSETS,
];
