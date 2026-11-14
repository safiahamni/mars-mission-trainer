import Phaser from 'phaser';
import { MAP, STATIONS, PATH_WIDTH, SPAWN, doorOf } from '../config/stations.js';
import { WALK_LINES, moveOnPath } from '../systems/walkPath.js';
import { openPanel, isPanelOpen } from '../ui/panels.js';
import { DAILY_TASKS } from '../config/dailyTasks.js';
import { wasVisited } from '../state/missionTempStore.js';
import { createAvatar } from '../ui/avatar.js';

const SPEED = 180;          // walking speed in pixels per second
const INTERACT_RANGE = 60;  // how close to a door you must be to press E

export default class MainMapScene extends Phaser.Scene {
  constructor() {
    super('MainMapScene');
  }

  create() {
    this.drawGround();
    STATIONS.forEach((s) => this.drawStation(s));

    // player position (invisible marker); walkPath.js keeps it on the sandy paths
    this.player = this.add.circle(SPAWN.x, SPAWN.y, 14, 0x5b8def).setAlpha(0);

    // the SVG avatar (src/ui/avatar.js) is drawn at the player's position
    const holder = document.createElement('div');
    holder.style.cssText = 'position:relative;width:34px;height:46px;';
    this.avatar = createAvatar(holder);
    this.avatar.moveTo(17, 44);
    this.avatarDom = this.add.dom(SPAWN.x, SPAWN.y + 14, holder).setOrigin(0.5, 1);

    // controls: arrows + WASD, E to interact
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E');
    this.keys.E.on('down', () => this.tryInteract());

    // "Press E" hint above the nearest door
    this.hint = this.add.text(0, 0, '', {
      fontSize: '18px', color: '#1f2430', backgroundColor: '#ffffff', padding: { x: 10, y: 6 },
    }).setOrigin(0.5, 1).setDepth(20).setVisible(false);

    this.nearest = null;
    this.createObjectiveMarkers();
  }

  // objective markers: bouncing arrows over stations with a task today
  createObjectiveMarkers() {
    this.markers = DAILY_TASKS.map((task) => {
      const s = STATIONS.find((st) => st.id === task.station);
      const x = s.x + s.w - 20;
      const y = s.y - 30;
      const arrow = this.add.triangle(x, y, 0, 0, 26, 0, 13, 18, 0xffe066)
        .setStrokeStyle(3, 0x1f2430)
        .setDepth(15);
      this.tweens.add({ targets: arrow, y: y - 10, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return { station: task.station, arrow };
    });
  }

  updateObjectiveMarkers() {
    for (const m of this.markers) m.arrow.setVisible(!wasVisited(m.station));
  }

  // drawing: placeholders, replaced by the real map image later
  drawGround() {
    const g = this.add.graphics();
    g.fillStyle(0xc65a2e).fillRect(0, 0, MAP.width, MAP.height);
    // draw exactly the lines the player can walk on (main paths + door stubs)
    g.fillStyle(0xe8b98a);
    for (const [[x1, y1], [x2, y2]] of WALK_LINES) {
      const half = PATH_WIDTH / 2;
      g.fillRoundedRect(Math.min(x1, x2) - half, Math.min(y1, y2) - half,
        Math.abs(x2 - x1) + PATH_WIDTH, Math.abs(y2 - y1) + PATH_WIDTH, 10);
    }
    // trail to the Mars Exploration Zone
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
    openPanel(this.nearest);
    this.game.events.emit('station:open', this.nearest.id);
  }

  flashHint(text, pos) {
    this.hint.setText(text).setPosition(pos.x, pos.y - 20).setVisible(true);
    this.hintLocked = true;
    this.time.delayedCall(1500, () => { this.hintLocked = false; });
  }

  // runs every frame
  update(time, delta) {
    this.updateObjectiveMarkers();

    // pause movement while a station panel is open
    if (isPanelOpen()) { this.avatar.setWalking(false); return; }

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;

    const vx = (right ? 1 : 0) - (left ? 1 : 0);
    const vy = (down ? 1 : 0) - (up ? 1 : 0);
    const v = new Phaser.Math.Vector2(vx, vy).normalize().scale(SPEED * (delta / 1000));
    const pos = moveOnPath({ x: this.player.x, y: this.player.y }, v.x, v.y);
    this.player.setPosition(pos.x, pos.y);

    // move the avatar with the player, face the walking direction, animate legs
    this.avatarDom.setPosition(this.player.x, this.player.y + 14);
    this.avatar.setWalking(vx !== 0 || vy !== 0);
    this.avatar.faceToward(vx, vy);

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