import Phaser from 'phaser';
import { GameScene } from './GameScene';

export function bootGame(parent: string) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    transparent: true,
    scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
    scene: [GameScene],
    render: { antialias: true, roundPixels: false, powerPreference: 'high-performance' },
    input: { activePointers: 3, touch: { capture: true } },
    fps: { target: 60, smoothStep: true },
    banner: false,
  });
}
