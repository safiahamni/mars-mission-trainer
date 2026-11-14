import Phaser from 'phaser';
import { MAP, STATIONS, PATHS, PATH_WIDTH, SPAWN, doorOf } from '../config/stations.js';
import { openPanel, isPanelOpen } from '../ui/panels.js';

const SPEED = 180;          // walking speed in pixels per second
const INTERACT_RANGE = 60;  // how close to a door you must be to press E

export default class MainMapScene extends Phaser.Scene {
  constructor() {
    super('MainMapScene');
  }

  create() {
    this.drawGround();
    this.buildings = this.physics.add.staticGroup();
    STATIONS.forEach((s) => this.drawStation(s));

    // player: placeholder circle until Member 4's astronaut sprite is ready
    this.player = this.add.circle(SPAWN.x, SPAWN.y, 14, 0x5b8def).setStrokeStyle(3, 0x1f2430).setDepth(10);
    this.physics.add.existing(this.player);
    this.player.body.setCircle(14);
    this.player.body.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, MAP.width, MAP.height);
    this.physics.add.collider(this.player, this.buildings);

    // controls: arrows + WASD, E to interact
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E');
    this.keys.E.on('down', () => this.tryInteract());

    // "Press E" hint above the nearest door
    this.hint = this.add.text(0, 0, '', {
      fontSize: '18px', color: '#1f2430', backgroundColor: '#ffffff', padding: { x: 10, y: 6 },
    }).setOrigin(0.5, 1).setDepth(20).setVisible(false);

    this.nearest = null;
  }

  // drawing: placeholders, replaced by the real map image later
  drawGround() {
    const g = this.add.graphics();
    g.fillStyle(0xc65a2e).fillRect(0, 0, MAP.width, MAP.height);
    g.fillStyle(0xe8b98a);
    PATHS.forEach((p) => {
      if (p.y1 === p.y2) g.fillRoundedRect(p.x1, p.y1 - PATH_WIDTH / 2, p.x2 - p.x1, PATH_WIDTH, 10);
      else g.fillRoundedRect(p.x1 - PATH_WIDTH / 2, p.y1, PATH_WIDTH, p.y2 - p.y1, 10);
    });
    g.fillStyle(0xf3e3d0);
    for (let y = 525; y < 770; y += 18) g.fillRect(1298, y, 4, 10);
    this.add.text(1398, 790, 'Mars Exploration Zone', { fontSize: '18px', color: '#ffffff', backgroundColor: '#262a35', padding: { x: 10, y: 6 } }).setOrigin(1, 0.5);
  }

  drawStation(s) {
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    let shape;
    if (s.round) {
      shape = this.add.circle(cx, cy, s.w / 2, s.color).setStrokeStyle(5, 0x1f2430);
    } else {
      shape = this.add.rectangle(cx, cy, s.w, s.h, s.color).setStrokeStyle(5, 0x1f2430);
    }
    this.buildings.add(shape);
    if (s.round) shape.body.setCircle(s.w / 2);

    // name tag above the building
    this.add.text(s.x, s.y - 10, s.name, {
      fontSize: '17px', fontStyle: 'bold', color: '#ffffff', backgroundColor: '#262a35', padding: { x: 10, y: 5 },
    }).setOrigin(0, 1);

    // door marker
    const d = doorOf(s);
    this.add.rectangle(d.x, s.y + s.h + 4, 34, 8, 0xf08a24).setStrokeStyle(2, 0x1f2430);

    // click or tap the building to interact (only when close enough)
    shape.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      if (this.nearest && this.nearest.id === s.id) this.tryInteract();
      else this.flashHint(`Walk to the ${s.name} door first`, d);
    });
    s._shape = shape;
  }

  // interaction
  findNearest() {
    let best = null;
    let bestDist = INTERACT_RANGE;
    for (const s of STATIONS) {
      const d = doorOf(s);
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, d.x, d.y);
      if (dist < bestDist) { best = s; bestDist = dist; }
    }
    return best;
  }

  tryInteract() {
    if (isPanelOpen() || !this.nearest) return;
    this.player.body.setVelocity(0, 0);
    openPanel(this.nearest);
    // teammates can listen: this.game.events.on('station:open', (id) => ...)
    this.game.events.emit('station:open', this.nearest.id);
  }

  flashHint(text, pos) {
    this.hint.setText(text).setPosition(pos.x, pos.y - 20).setVisible(true);
    this.hintLocked = true;
    this.time.delayedCall(1500, () => { this.hintLocked = false; });
  }

  // runs every frame
  update() {
    const body = this.player.body;

    // pause movement while a station panel is open
    if (isPanelOpen()) { body.setVelocity(0, 0); return; }

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;

    const vx = (right ? 1 : 0) - (left ? 1 : 0);
    const vy = (down ? 1 : 0) - (up ? 1 : 0);
    const v = new Phaser.Math.Vector2(vx, vy).normalize().scale(SPEED);
    body.setVelocity(v.x, v.y);

    // highlight the nearest station and show the hint
    const near = this.findNearest();
    if (near !== this.nearest) {
      if (this.nearest) this.nearest._shape.setStrokeStyle(5, 0x1f2430);
      if (near) near._shape.setStrokeStyle(7, 0xffe066);
      this.nearest = near;
    }
    if (this.hintLocked) return;
    if (near) {
      const d = doorOf(near);
      this.hint.setText(`Press E · ${near.name}`).setPosition(d.x, d.y - 22).setVisible(true);
    } else {
      this.hint.setVisible(false);
    }
  }
}