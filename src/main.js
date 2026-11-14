import Phaser from 'phaser';
import './style.css';

// Temporary test scene: replaced by the real scenes in Step 2
class TestScene extends Phaser.Scene {
  constructor() {
    super('TestScene');
  }
  create() {
    this.add.text(60, 60, 'Phaser is working! 🚀', {
      fontSize: '40px',
      color: '#ffffff',
    });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1408,          // same size as Member 4's base map design
  height: 840,
  backgroundColor: '#c65a2e',
  scene: [TestScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
