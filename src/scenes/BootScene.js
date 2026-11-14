import Phaser from 'phaser';

// Loads images and sounds before the game starts.
// When Member 4's art is ready, load it here, for example:
//   this.load.image('map', 'assets/map.png');
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const w = this.scale.width;
    const h = this.scale.height;
    const bar = this.add.rectangle(w / 2 - 200, h / 2, 0, 16, 0xffffff).setOrigin(0, 0.5);
    this.add.text(w / 2, h / 2 - 40, 'Loading Mars base…', { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5);
    this.load.on('progress', (p) => { bar.width = 400 * p; });
  }

  create() {
    this.scene.start('MainMapScene');
  }
}