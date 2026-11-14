import Phaser from 'phaser';
import './style.css';
import { MAP } from './config/stations.js';
import BootScene from './scenes/BootScene.js';
import MainMapScene from './scenes/MainMapScene.js';
import './ui/panels/powerPanel.js';
import './ui/panels/startHubPanel.js';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: MAP.width,
  height: MAP.height,
  backgroundColor: '#c65a2e',
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [BootScene, MainMapScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
