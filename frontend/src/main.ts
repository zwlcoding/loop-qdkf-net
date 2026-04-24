import { AUTO, Game, Scale, Types } from 'phaser';
import { BootScene } from './scenes/BootScene';
import { BattleScene } from './scenes/BattleScene';

function getGameDimensions(): { width: number; height: number } {
  const isPortrait = window.innerHeight > window.innerWidth;
  if (isPortrait) {
    return { width: 720, height: 1280 };
  }
  return { width: 1280, height: 720 };
}

const dims = getGameDimensions();

const config: Types.Core.GameConfig = {
  type: AUTO,
  width: dims.width,
  height: dims.height,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
  },
  render: {
    roundPixels: true,
  },
  scene: [BootScene, BattleScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
};

const game = new Game(config);

function handleResize(): void {
  const newDims = getGameDimensions();
  const scaleManager = game.scale;
  if (scaleManager.width !== newDims.width || scaleManager.height !== newDims.height) {
    scaleManager.setGameSize(newDims.width, newDims.height);
  }
}

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => {
  setTimeout(handleResize, 100);
});
