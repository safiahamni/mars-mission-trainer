import Phaser from 'phaser';
import './style.css';
import { createGreenhouseDemoController } from './features/greenhouse/greenhouseDemoController.js';
import { mountGreenhousePanel } from './features/greenhouse/GreenhousePanel.js';
import "./features/greenhouse/greenhouse.css";

class HabitatBackdrop extends Phaser.Scene {
  constructor() {
    super('HabitatBackdrop');
  }

  create() {
    this.cameras.main.setBackgroundColor('#b9573f');
    const art = this.add.graphics();
    art.fillStyle(0x9e4938, 0.45);
    art.fillCircle(190, 160, 260);
    art.fillCircle(1230, 740, 320);
    art.lineStyle(4, 0xf7d6ac, 0.25);
    art.strokeRoundedRect(85, 70, 1238, 700, 44);
    art.lineStyle(2, 0xffe1b6, 0.2);
    for (let x = 130; x < 1320; x += 72) {
      art.lineBetween(x, 88, x, 752);
    }
    for (let y = 130; y < 760; y += 72) {
      art.lineBetween(105, y, 1300, y);
    }
    this.add.text(102, 100, 'MARS HABITAT  ·  GREENHOUSE', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '14px',
      color: '#ffe1c7',
      letterSpacing: 2,
    }).setAlpha(0.45);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1408,
  height: 840,
  backgroundColor: '#b9573f',
  scene: [HabitatBackdrop],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});

const demoController = createGreenhouseDemoController();
mountGreenhousePanel(document.querySelector('#ui-root'), demoController);
