// COMMAND CENTER ROOM (Member 1)
// Follows the "Command Center · room interior" design + the team's Power Budget:
//   top HUD: battery cells with the night line, power to spend, water tank
//   1 Switchboard (levers with prices), 2 Battery bank, W Wardrobe (crew shirt / spacesuit), ! Radiation shelter (bunks to sleep).
// Radiation (hazard meter, solar storm, Shield the Shelter) is Member 3's, on the base map:
//   src/places/radiation-shelter/  (window.RadiationShelter)
// The player walks on the tan paths with WASD or the arrow keys.
// The room is drawn on a fixed 1512 x 1032 stage that scales to fit any screen.
//
// Use it:  renderCommandCenter(element, { onExit })   (onExit runs when the player walks out the door)
// Later the new base map can open it as a room:
//   registerPanel('command-center', (room, close) => renderCommandCenter(room, { onExit: close }), { room: true });
import './commandCenter.css';
import { icon } from '../icons.js';
import { createAvatar } from '../avatar.js';
import { dressAvatar } from '../outfit.js';
import {
  SWITCHES, POWER_CONFIG, COSTS, spendable, shortForNight, powerStatus,
} from '../../systems/power.js';
import {
  CC_CONFIG, WATER_CONFIG, SHIRT_COLORS,
  enterShelter, leaveShelter, sleep, isDay, spentToday, setOutfit, setShirt,
  chapterCheck, endDayEarly,
} from '../../systems/commandCenter.js';
import { runEndSol } from '../../systems/endSol.js';
import { makeWalker, isNear } from '../../systems/roomWalk.js';
import {
  ROOM_STAGE, ROOM_PATHS, SHELTER_PATHS, ROOM_PATH_WIDTH, SHELTER_DOOR_Y, ROOM_SPAWN, ROOM_SPOTS, EXITS,
} from '../../config/commandCenterLayout.js';
import { getGame, setGame, onGameChange } from '../../state/gameStore.js';

const STAGE_W = ROOM_STAGE.width;
const STAGE_H = ROOM_STAGE.height;
const SPEED = 200;   // how fast the player walks (stage pixels per second)
const CELLS = 10;    // battery cells in the HUD, 10 power each

const KEYS = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
};

const SHIRT_HEX = { blue: '#5A8FE0', teal: '#3dbba5', purple: '#9b7be8', orange: '#f0913a', red: '#e0566a' };

const CORRIDOR_X_HALF = 700;   // the shelter is on the right half of the room
const PATH_D = ROOM_PATHS.map(([x1, y1, x2, y2]) => `M${x1} ${y1} L${x2} ${y2}`).join(' ');

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function fmtSec(s) {
  return `${Math.max(0, Math.ceil(s))}s`;
}

// small switchboard prop on the wall: 5 lamps + 5 mini levers (Switchboard Kit)
function propSvg(switches) {
  const cols = SWITCHES.map((sw, i) => {
    const x = 80 - ((SWITCHES.length - 1) * 23) / 2 + i * 23;   // levers centred on the box
    const on = switches[sw.id];
    return `<circle cx="${x}" cy="44" r="6" fill="${on ? '#4cd07d' : '#1e2129'}" stroke="${on ? '#2b2a3a' : '#6b7080'}" stroke-width="2"/>
      ${on
        ? `<line x1="${x}" y1="76" x2="${x}" y2="63" stroke="#eef0f5" stroke-width="4" stroke-linecap="round"/><circle cx="${x}" cy="61" r="4.5" fill="#fff"/>`
        : `<line x1="${x}" y1="67" x2="${x}" y2="82" stroke="#eef0f5" stroke-width="4" stroke-linecap="round"/><circle cx="${x}" cy="84" r="4.5" fill="#fff"/>`}`;
  }).join('');
  return `<svg viewBox="0 0 160 120" width="110" height="83" aria-hidden="true">
    <rect x="62" y="2" width="36" height="20" rx="5" fill="#ffd23f" stroke="#2b2a3a" stroke-width="3"/>
    <path d="M82 6 L74 13 H80 L77 19 L86 11 H80 Z" fill="#2b2a3a"/>
    <rect x="6" y="18" width="148" height="98" rx="16" fill="#eef0f5" stroke="#2b2a3a" stroke-width="4"/>
    <rect x="16" y="28" width="128" height="78" rx="9" fill="#323848" stroke="#2b2a3a" stroke-width="3"/>
    ${cols}
  </svg>`;
}

// one big lever for the pop-up: ON at the top, OFF at the bottom
const LEVER_SVG = `<svg viewBox="0 0 70 110" width="60" height="94" aria-hidden="true">
  <rect x="2" y="2" width="66" height="106" rx="12" fill="#c9ccd6" stroke="#2b2a3a" stroke-width="4"/>
  <text x="35" y="20" text-anchor="middle" font-size="12" font-weight="900" fill="#2b2a3a">ON</text>
  <text x="35" y="100" text-anchor="middle" font-size="12" font-weight="900" fill="#2b2a3a">OFF</text>
  <circle cx="35" cy="57" r="16" fill="#5a5f6e" stroke="#2b2a3a" stroke-width="3"/>
  <g class="cc-lever">
    <rect x="30" y="30" width="10" height="28" rx="5" fill="#eef0f5" stroke="#2b2a3a" stroke-width="3"/>
    <circle cx="35" cy="30" r="9" fill="#fff" stroke="#2b2a3a" stroke-width="3"/>
  </g>
</svg>`;

// wardrobe prop: a tall locker with a shirt window and a helmet window
const WARDROBE_SVG = `<svg viewBox="0 0 96 150" width="96" height="150" aria-hidden="true">
  <rect x="4" y="6" width="88" height="140" rx="12" fill="#eef0f5" stroke="#2b2a3a" stroke-width="4"/>
  <line x1="48" y1="10" x2="48" y2="142" stroke="#2b2a3a" stroke-width="3"/>
  <rect x="12" y="18" width="28" height="34" rx="6" fill="#323848" stroke="#2b2a3a" stroke-width="3"/>
  <path d="M18 30 l5 -5 h6 l5 5 l-3 3 v12 h-10 v-12 Z" fill="#5A8FE0" stroke="#2b2a3a" stroke-width="2" stroke-linejoin="round" class="cc-wr-shirt"/>
  <rect x="56" y="18" width="28" height="34" rx="6" fill="#323848" stroke="#2b2a3a" stroke-width="3"/>
  <circle cx="70" cy="35" r="10" fill="#fbfbfd" stroke="#2b2a3a" stroke-width="2"/>
  <ellipse cx="70" cy="36" rx="6.5" ry="4.5" fill="#8fd3c8" stroke="#2b2a3a" stroke-width="1.6"/>
  <circle cx="40" cy="86" r="3.5" fill="#9aa0ad" stroke="#2b2a3a" stroke-width="2"/>
  <circle cx="56" cy="86" r="3.5" fill="#9aa0ad" stroke="#2b2a3a" stroke-width="2"/>
  <rect x="12" y="120" width="72" height="8" rx="4" fill="#c9ccd6"/>
</svg>`;

const EARTH_SVG = `<svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true">
  <circle cx="20" cy="20" r="16" fill="#4f8fe8"/>
  <path d="M11 13 q6 -4 9 2 q-2 6 -8 4 z M22 22 q6 -3 8 3 q-3 6 -8 3 z" fill="#5fd38a"/>
</svg>`;

export function renderCommandCenter(room, { onExit } = {}) {
  let message = '';
  let preview = null;   // { cost, label, water } while pointing at something with a price

  room.classList.add('cc-root');
  room.innerHTML = `
  <div class="cc-stage">
    <!-- top -->
    <div class="cc-title">${icon('shield', 24)} Command Center</div>

    <!-- HUD: power cells (10 power each) with the night line + water tank -->
    <div class="cc-hud" data-b="hud">
      <span class="cc-hud-bolt">${icon('zap', 24)}</span>
      <div>
        <div class="cc-night-lbl">${icon('moon', 13)} night</div>
        <div class="cc-batt">
          <div class="cc-batt-cells">${Array.from({ length: CELLS }, () => '<span class="c"></span>').join('')}</div>
          <span class="cc-batt-nub"></span>
        </div>
      </div>
      <div class="cc-hud-num">
        <div class="cc-big" data-b="pnum"></div>
        <span class="cc-chip" data-b="pchip"></span>
      </div>
      <span class="cc-hud-sep"></span>
      <div class="cc-tank"><i class="gain" data-b="tank-gain"></i><i class="level" data-b="tank"></i><b class="tick" style="bottom:${WATER_CONFIG.target}%"></b></div>
      <div class="cc-hud-num">
        <div class="cc-big">${icon('droplet', 17)} <span data-b="wnum"></span></div>
        <span class="cc-wlbl" data-b="wlbl"></span>
      </div>
    </div>

    <div class="cc-status" data-b="status"></div>

    <!-- the room -->
    <div class="cc-room"></div>
    <div class="cc-floor" data-b="floor"></div>

    <svg class="cc-svg" viewBox="0 0 ${STAGE_W} ${STAGE_H}" aria-hidden="true">
      <path d="M66 760 H249 M249 640 H120 V178 H340 V222 H372" stroke="#2b2a3a" stroke-width="16" fill="none" stroke-linejoin="round"/>
      <path d="M66 760 H249 M249 640 H120 V178 H340 V222 H372" stroke="#f5c84c" stroke-width="9" fill="none" stroke-linejoin="round"/>
      <path d="${PATH_D}" stroke="#f7ecd9" stroke-width="${ROOM_PATH_WIDTH + 6}" stroke-dasharray="7 6" fill="none"/>
      <path d="${PATH_D}" stroke="#e8c49a" stroke-width="${ROOM_PATH_WIDTH}" fill="none"/>
    </svg>
    <div class="cc-chip-dark" style="left:80px;top:772px">From solar field</div>

    <!-- 3 battery bank -->
    <div class="cc-bank" data-b="bank">
      <div class="cc-cells"><span><i data-b="cell"></i></span><span><i data-b="cell"></i></span><span><i data-b="cell"></i></span></div>
      <div class="cc-line-night"></div>
      <div class="cc-hazard"></div>
    </div>
    <div class="cc-tag" style="left:236px;top:824px"><b>2</b> Battery bank <small data-b="pct"></small></div>
    <div class="cc-tip cc-tip-battery" data-b="battery-tip"></div>

    <!-- W wardrobe -->
    <button class="cc-wardrobe" data-b="wardrobe" aria-label="Wardrobe">${WARDROBE_SVG}</button>
    <div class="cc-tip cc-tip-wardrobe"><strong>Wardrobe</strong><br>Change your shirt colour, and put on the spacesuit before going outside. Walk up to it to open it.</div>
    <div class="cc-tag" style="left:184px;top:380px"><b class="purple">W</b> Wardrobe</div>

    <!-- 1 switchboard on the wall -->
    <div class="cc-mount"></div>
    <button class="cc-prop" data-b="prop" aria-label="Switchboard"></button>
    <div class="cc-tip cc-tip-switch"><strong>Switchboard</strong><br>Shows which of the base's machines are on. A lock means MOXIE still needs to be unlocked in Life Support.</div>
    <div class="cc-tag" style="left:360px;top:314px"><b>1</b> Switchboard</div>

    <!-- ! radiation shelter -->
    <div class="cc-shelter" data-b="shelter">
      <i class="t" style="left:17px;top:15px;width:65px"></i><i class="t" style="left:95px;top:15px;width:65px"></i>
      <i class="t" style="left:173px;top:15px;width:65px"></i><i class="t" style="left:251px;top:15px;width:84px"></i>
      <i class="t" style="left:17px;top:330px;width:65px"></i><i class="t" style="left:95px;top:330px;width:65px"></i>
      <i class="t" style="left:173px;top:330px;width:65px"></i><i class="t" style="left:251px;top:330px;width:84px"></i>
      <i class="t v" style="left:15px;top:55px;height:110px"></i><i class="t v" style="left:15px;top:245px;height:75px"></i>
      <i class="t v" style="left:310px;top:55px;height:80px"></i><i class="t v" style="left:310px;top:150px;height:80px"></i>
      <i class="t v" style="left:310px;top:243px;height:75px"></i>
      <div class="cc-bunk" style="left:172px;top:65px"><span></span><em class="cyan"></em></div>
      <div class="cc-bunk" style="left:172px;top:133px"><span></span><em class="yellow"></em></div>
      <div class="cc-shield">${icon('shield-check', 70)}</div>
      <span class="cc-lamp"></span>
    </div>
    <div class="cc-door"></div>
    <div class="cc-tag" style="left:858px;top:528px"><b class="red">!</b> Radiation shelter</div>
    <div class="cc-tip cc-tip-shelter"><strong>Radiation shelter</strong><br>A safe room with thick walls and water tanks that block space radiation. The crew sleeps here.</div>

    <!-- mission control: just part of the room now (no pop-up, no checklist) -->
    <div class="cc-tag" style="left:716px;top:356px">Mission control</div>
    <div class="cc-screens" data-b="screens" aria-hidden="true">
      <span class="cc-screen" style="left:0;top:9px;width:96px;height:72px">${EARTH_SVG}</span>
      <span class="cc-screen" style="left:110px;top:0;width:101px;height:82px">
        <svg viewBox="0 0 80 40" width="72" height="36" aria-hidden="true"><path d="M2 22 H22 L30 6 L40 34 L48 18 H78" stroke="#5fd38a" stroke-width="4" fill="none" stroke-linejoin="round" stroke-linecap="round"/></svg>
      </span>
      <span class="cc-screen" data-b="alert-screen" style="left:225px;top:9px;width:96px;height:72px">
        <svg viewBox="0 0 60 40" width="56" height="36" aria-hidden="true"><path d="M8 10 H52 M14 20 H46 M8 30 H52" stroke="#f0a04b" stroke-width="4" stroke-linecap="round"/></svg>
      </span>
    </div>
    <svg class="cc-console" viewBox="0 0 336 110" width="336" height="110" aria-hidden="true">
      <path d="M4 10 Q168 -6 332 10 L312 70 Q168 58 24 70 Z" fill="#e8e8ee" stroke="#2b2a3a" stroke-width="4"/>
      <circle cx="84" cy="32" r="7" fill="#e0605a" stroke="#2b2a3a" stroke-width="2.5"/>
      <circle cx="106" cy="28" r="7" fill="#ffd23f" stroke="#2b2a3a" stroke-width="2.5"/>
      <circle cx="128" cy="24" r="7" fill="#4cd07d" stroke="#2b2a3a" stroke-width="2.5"/>
      <rect x="188" y="21" width="76" height="9" rx="4.5" fill="#9aa0ad"/>
      <rect x="137" y="70" width="62" height="35" rx="12" fill="#5b8de8" stroke="#2b2a3a" stroke-width="4"/>
    </svg>

    <div class="cc-tip cc-tip-mission"><strong>Mission control</strong><br>Screens that talk to Earth. A message takes 4 to 24 minutes to travel between Earth and Mars!</div>
    <!-- four doors: left = Greenhouse, up = Science Lab, right = Life Support, down = Airlock / solar panels -->
    <div class="cc-exit-door cc-exit-down" data-b="exit-down" aria-hidden="true"></div>
    <div class="cc-suit-lock" data-b="suit-lock" aria-hidden="true">${icon('lock', 22)}</div>
    <div class="cc-suit-pop" data-b="suit-pop" role="alert" hidden>${icon('shirt', 28)}<div><strong>Wear your spacesuit first!</strong><span>Then you can go outside. The Wardrobe (W) is at the top left.</span></div></div>
    <div class="cc-exit-door cc-exit-up" data-b="exit-up" aria-hidden="true"></div>
    <div class="cc-exit-door cc-exit-left" data-b="exit-left" aria-hidden="true"></div>
    <div class="cc-exit-door cc-exit-right" data-b="exit-right" aria-hidden="true"></div>

    <div class="cc-player" data-b="player"></div>

    <!-- right: tasks in this room -->
    <aside class="cc-side">
      <h2>Tasks in this room</h2>
      <div class="cc-task"><b>1</b><div><h4>Switchboard</h4><p>Shows which machines are on. MOXIE and the water recycler are run in Life Support.</p></div></div>
      <div class="cc-task"><b>2</b><div><h4>Battery bank</h4><p>Your power. Keep <strong>${POWER_CONFIG.nightReserve}</strong> for the night, or the crew gets cold.</p></div></div>
      <div class="cc-task"><b class="purple">W</b><div><h4 class="purple">Wardrobe</h4><p>Put on the spacesuit before going outside.</p></div></div>
      <div class="cc-task"><b class="teal">Z</b><div><h4 class="teal">Bunks</h4><p>After today's chapter, sleep here to start the next sol. ${icon('star', 16)} for a warm night.</p></div></div>
      <div class="cc-goal">${icon('star', 24)}<div><small>TODAY'S GOAL</small><strong data-b="goal"></strong></div></div>
    </aside>

    <div class="cc-msg" data-b="msg" aria-live="polite"></div>

    <!-- pop-up: switchboard -->
    <div class="cc-pop cc-pop-switch" data-pop="switchboard" role="dialog" aria-label="Power switchboard" hidden>
      <div class="cc-pop-in">
        <div class="cc-pop-head">
          <h3>${icon('zap', 24)} Power switchboard</h3>
          <button class="cc-x" data-close="switchboard" aria-label="Close">${icon('close', 22)}</button>
        </div>
        <div class="cc-levers">
          ${SWITCHES.map((sw) => `
            <div class="cc-col" data-switch="${sw.id}" role="img">
              <span class="cc-lamp-big"></span>${LEVER_SVG}<span class="cc-plate">${sw.plate}</span>
              ${sw.id === 'moxie' ? `<span class="cc-lock" data-b="moxie-lock">${icon('lock', 34)}</span>` : ''}
            </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- pop-up: wardrobe -->
    <div class="cc-pop cc-pop-wardrobe" data-pop="wardrobe" role="dialog" aria-label="Wardrobe" hidden>
      <div class="cc-pop-in">
        <div class="cc-pop-head">
          <h3>${icon('shirt', 24)} Wardrobe</h3>
          <button class="cc-x" data-close="wardrobe" aria-label="Close">${icon('close', 22)}</button>
        </div>
        <div class="cc-outfits">
          <button class="cc-outfit" data-outfit="crew"><span class="cc-outfit-pic" data-b="pic-crew"></span><strong>Crew shirt</strong><small>Inside the base</small></button>
          <button class="cc-outfit" data-outfit="suit"><span class="cc-outfit-pic suit-bg" data-b="pic-suit"></span><strong>Mars spacesuit</strong><small>For EVA outside</small></button>
        </div>
        <p class="cc-wr-lbl">Shirt colour</p>
        <div class="cc-swatches">
          ${SHIRT_COLORS.map((c) => `<button class="cc-swatch" data-shirt="${c}" style="background:${SHIRT_HEX[c]}" aria-label="${c} shirt"></button>`).join('')}
        </div>
        <p class="cc-pop-foot">Outfit rule: crew shirt inside the base. Put on the spacesuit before you go outside for an EVA (${COSTS.eva} power per trip).</p>
      </div>
    </div>

    <!-- pop-up: bunks -->
    <div class="cc-pop cc-pop-bunks" data-pop="bunks" role="dialog" aria-label="Bunks" hidden>
      <div class="cc-pop-in">
        <div class="cc-pop-head">
          <h3>${icon('bed', 24)} Bunks</h3>
          <button class="cc-x" data-close="bunks" aria-label="Close">${icon('close', 22)}</button>
        </div>
        <div data-b="bunks-body"></div>
      </div>
    </div>

    <!-- end of sol summary -->
    <div class="cc-summary" data-b="summary" hidden></div>
  </div>`;

  const stage = room.querySelector('.cc-stage');
  const $ = (name) => room.querySelector(`[data-b="${name}"]`);

  // ---- scale the stage to fit the screen ----
  function fit() {
    const w = room.clientWidth;     // the room's space (next to the left column of cards)
    const h = room.clientHeight;
    const s = Math.min(w / STAGE_W, h / STAGE_H);
    stage.style.transform = `translate(${(w - STAGE_W * s) / 2}px, ${(h - STAGE_H * s) / 2}px) scale(${s})`;
  }

  // ---- the HUD (battery cells + water tank) ----
  function renderHud() {
    const g = getGame();
    const b = g.power.battery;
    const low = b < POWER_CONFIG.nightReserve;
    const cost = preview ? preview.cost : 0;
    const after = Math.max(0, b - cost);
    const tooMuch = preview && cost > b;

    $('hud').classList.toggle('low', low);
    room.querySelectorAll('.cc-batt-cells .c').forEach((c, i) => {
      const lo = i * 10;
      const now = clamp((b - lo) / 10, 0, 1);
      const left = clamp((after - lo) / 10, 0, 1);
      c.className = 'c';
      if (i < POWER_CONFIG.nightReserve / 10) c.classList.add('rs');
      if (preview && !tooMuch && now > left) c.classList.add('cost');
      else if (now > 0) c.classList.add(low ? 'low' : 'on');
      if (now > 0 && now < 1 && !c.classList.contains('cost')) c.classList.add('half');
    });

    if (preview && !tooMuch && cost > 0) {
      $('pnum').innerHTML = `${b} <span class="arrow">→ ${after}</span>`;
      $('pchip').className = `cc-chip ${after < POWER_CONFIG.nightReserve ? 'bad' : 'cost'}`;
      $('pchip').textContent = `−${cost} ${preview.label}`;
    } else if (tooMuch) {
      $('pnum').innerHTML = `${b}<small>/100</small>`;
      $('pchip').className = 'cc-chip bad';
      $('pchip').textContent = `Need ${cost - b} more`;
    } else {
      $('pnum').innerHTML = `${b}<small>/100</small>`;
      const short = shortForNight(g.power);
      $('pchip').className = `cc-chip ${short ? 'bad' : spendable(g.power) ? 'good' : 'warn'}`;
      $('pchip').textContent = short ? `${short} short for night` : `${spendable(g.power)} to spend`;
    }

    const gain = preview && !tooMuch ? preview.water || 0 : 0;
    $('tank').style.height = `${g.water}%`;
    $('tank-gain').style.height = `${Math.min(100, g.water + gain)}%`;
    $('wnum').textContent = gain ? `${g.water} → ${Math.min(100, g.water + gain)}` : g.water;
    $('wlbl').textContent = g.water < WATER_CONFIG.target ? 'low' : 'water';
    $('wlbl').className = `cc-wlbl ${g.water < WATER_CONFIG.target ? 'low' : ''}`;
  }

  // the morning pop-up's one line: what to do today
  // the "Today's goal" box in the side panel
  function goalText(g) {
    if (!isDay(g)) return 'Night: sleep in the bunks';
    if (g.done.chapter) return 'Done! Go sleep in the bunks';
    const ch = chapterCheck(g);
    if (ch.reason === 'dust-storm') return 'Dust storm! No chapter. Rest when ready';
    if (ch.reason === 'all-done') return 'All chapters done. Rest when ready';
    return `Chapter ${ch.chapter.n} in the Science Lab`;
  }

  function todayText(g) {
    const ch = chapterCheck(g);
    if (ch.reason === 'dust-storm') return 'dust storm! No chapter. Look after the base and rest.';
    if (ch.reason === 'all-done') return 'all chapters done. Enjoy Mars!';
    return `Chapter ${ch.chapter.n}, ${ch.chapter.name}, in the Science Lab`;
  }

  // ---- draw everything ----
  let dressed = '';
  function update() {
    const g = getGame();
    const p = g.power;
    const day = isDay(g);
    renderHud();
    $('suit-lock').hidden = g.outfit === 'suit';
    if (g.outfit === 'suit') $('suit-pop').hidden = true;
    $('goal').textContent = goalText(g);

    // top status
    const ch = chapterCheck(g);
    const today = ch.reason === 'dust-storm' ? 'dust storm, rest day'
      : ch.reason === 'all-done' ? 'all chapters done'
      : g.done.chapter ? 'chapter done' : `Chapter ${ch.chapter.n}: ${ch.chapter.name}`;
    const time = day ? `${icon('sun', 18)} Day · ${today}` : `${icon('moon', 18)} Night`;
    $('status').innerHTML = `Sol ${g.sol} of ${CC_CONFIG.maxSols} · ${time} · ${icon('star', 18)} ${g.stars}`;
    stage.classList.toggle('night', !day);

    // battery bank
    room.querySelectorAll('[data-b="cell"]').forEach((c) => {
      c.style.height = `${p.battery}%`;
      c.className = powerStatus(p);
    });
    $('pct').textContent = `· ${p.battery}`;
    $('battery-tip').innerHTML = `<strong>Battery bank</strong><br>Stores the power from the solar panels.<br><strong>Battery ${p.battery}/100</strong><br>${spendable(p)} to spend today. ${POWER_CONFIG.nightReserve} is kept for heaters and life support at night.<br><span class="dim">Panels: ${p.panels}. The sun adds +${POWER_CONFIG.solar[p.panels]} every morning.</span>`;

    // switchboard
    $('prop').innerHTML = propSvg(p.switches);
    // the switchboard only SHOWS what is running (Life Support runs MOXIE and the recycler)
    room.querySelectorAll('[data-switch]').forEach((t) => {
      const id = t.dataset.switch;
      t.setAttribute('aria-checked', String(!!p.switches[id]));
      const locked = id === 'moxie' && !p.moxieUnlocked;
      t.classList.toggle('locked', locked);
      t.setAttribute('aria-label', `${SWITCHES.find((s) => s.id === id).name}: ${locked ? 'locked' : p.switches[id] ? 'on' : 'off'}`);
    });

    // shelter
    $('shelter').classList.toggle('occupied', g.inShelter);

    // bunks
    $('bunks-body').innerHTML = day
      ? (ch.ok || g.inChapter
        ? `<p>The sun sets when you finish today's chapter in the Science Lab. Then come back here to sleep.</p>
           <button class="cc-btn" disabled>${icon('moon', 20)} Sleep · end sol ${g.sol}</button>`
        : `<p>${ch.reason === 'dust-storm' ? 'A dust storm is blocking the sky, so there is no chapter today.'
            : ch.reason === 'all-done' ? 'All the chapters are done.'
            : `Not enough to start Chapter ${ch.chapter.n} (need ${ch.missing.join(', ')}). Rest today and the sun will recharge the battery.`}</p>
           <p class="cc-dim">Finish your chores first, then end the day.</p>
           <button class="cc-btn" data-act="rest">${icon('moon', 20)} Rest · end the day early</button>`)
      : `<p>Tonight the heaters and life support use ${POWER_CONFIG.nightReserve} power${p.battery < POWER_CONFIG.nightReserve ? `, but you only have ${p.battery}. The crew will be cold` : ''}.</p>
         <button class="cc-btn" data-act="sleep">${icon('moon', 20)} Sleep · end sol ${g.sol}</button>`;

    // wardrobe + player outfit
    room.querySelectorAll('[data-outfit]').forEach((b) => b.classList.toggle('picked', b.dataset.outfit === g.outfit));
    room.querySelectorAll('[data-shirt]').forEach((b) => b.classList.toggle('picked', b.dataset.shirt === g.shirt));
    const look = `${g.outfit}-${g.shirt}`;
    if (look !== dressed) {
      dressed = look;
      dressAvatar(player, g);
      dressAvatar(picCrew, { outfit: 'crew', shirt: g.shirt });
      room.querySelector('.cc-wr-shirt').setAttribute('fill', SHIRT_HEX[g.shirt]);
    }

    $('msg').textContent = message;
    $('msg').classList.toggle('show', !!message);
  }

  function say(text) {
    message = text || '';
    update();
  }

  // ---- pop-ups: open when you walk up to (or hover / tap) the thing ----
  const pops = {};
  ['switchboard', 'wardrobe', 'bunks'].forEach((name) => {
    pops[name] = { el: room.querySelector(`[data-pop="${name}"]`), open: false, dismissed: false, near: false };
  });
  function openPop(name) {
    const p = pops[name];
    if (p.open) return;
    Object.keys(pops).forEach((n) => n !== name && closePop(n));
    p.open = true;
    p.el.hidden = false;
  }
  function closePop(name, byX = false) {
    const p = pops[name];
    if (byX) p.dismissed = true;
    if (!p.open) return;
    p.open = false;
    p.el.hidden = true;
    preview = null;
    renderHud();
  }
  function nearPop(name, near) {
    const p = pops[name];
    if (near && !p.near && !p.dismissed) openPop(name);
    if (!near && p.near) {
      p.dismissed = false;
      closePop(name);
    }
    p.near = near;
  }


  // ---- sleeping and the end-of-sol summary ----
  function doSleep() {
    const r = sleep(getGame());
    if (!r.ok) return say(r.message);
    // Member 3's hazard meter: the side-panel HUD (MarsHUD) and, when it's switched on, the shelter game
    const rad = window.RadiationShelter || window.MarsHUD;
    const hazard = rad ? Math.floor(rad.getHazard()) : null;
    window.MarsHUD?.newSol();                          // a new sol: hazard meter and storm reset
    window.RadiationShelter?.newSol();
    const others = runEndSol({ sol: r.report.sol });   // other stations' end-of-sol steps
    setGame(r.game);
    closePop('bunks');
    const g = r.game;
    const rep = r.report;
    $('summary').innerHTML = `
      <div class="cc-summary-in">
        <h2>${g.over ? 'Mission complete!' : `Sol ${rep.sol} complete`}</h2>
        <p class="cc-stars">${icon('star', 34)} ${rep.earned} of ${rep.total} stars</p>
        ${rep.stars.map((s) => `<p>${icon(s.earned ? 'check' : 'circle', 18)} ${s.text}</p>`).join('')}
        <p>${icon('moon', 18)} Night: heaters and life support used ${POWER_CONFIG.nightReserve}. Battery ${rep.bedtime} → ${rep.afterNight}.</p>
        ${rep.cold ? '<p class="bad">The battery was below the night line, so the crew got cold.</p>' : ''}
        ${g.over ? '' : `<p>${icon('sun', 18)} Morning: the solar field added +${rep.gained}${rep.dustStorm ? ' (a dust storm is blocking the sun!)' : ''}. Battery ${rep.morning}.</p>`}
        ${rep.waterFrom !== rep.waterTo ? `<p>${icon('droplet', 18)} The crew drank water: ${rep.waterFrom} → ${rep.waterTo}.</p>` : ''}
        ${rep.oxygenFrom !== rep.oxygenTo ? `<p>${icon('wind', 18)} The crew breathed oxygen: ${rep.oxygenFrom} → ${rep.oxygenTo}.</p>` : ''}
        ${rep.foodFrom !== rep.foodTo ? `<p>${icon('carrot', 18)} The crew ate food: ${rep.foodFrom} → ${rep.foodTo}.</p>` : ''}
        ${hazard === null ? '' : `<p>${icon('radiation', 18)} Radiation today: ${hazard} / 100. The meter resets for the new sol.</p>`}
        ${others.map((t) => `<p>${t}</p>`).join('')}
        ${g.over ? `<p><strong>Your crew earned ${g.stars} stars in ${CC_CONFIG.maxSols} sols.</strong></p>` : ''}
        ${g.over ? '' : `<p class="cc-today">${icon('flask', 18)} <strong>Today: ${todayText(g)}</strong></p>`}
        <button class="cc-btn" data-act="wake">${g.over ? 'Play again' : `${icon('sun', 20)} Wake up · Sol ${g.sol}`}</button>
      </div>`;
    $('summary').hidden = false;
    message = '';
    update();
  }

  // ---- clicks ----
  room.addEventListener('click', (e) => {
    const outfit = e.target.closest('[data-outfit]');
    if (outfit) {
      setGame(setOutfit(getGame(), outfit.dataset.outfit));
      return say(outfit.dataset.outfit === 'suit' ? 'Spacesuit on! You are ready for an EVA outside.' : 'Crew shirt on. Comfy for inside the base.');
    }
    const shirt = e.target.closest('[data-shirt]');
    if (shirt) {
      setGame(setShirt(getGame(), shirt.dataset.shirt));
      return update();
    }
    const x = e.target.closest('[data-close]');
    if (x) return closePop(x.dataset.close, true);
    if (e.target.closest('[data-b="prop"]')) return openPop('switchboard');

    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'sleep') return doSleep();
    if (a === 'rest') {
      const r = endDayEarly(getGame());
      if (!r.ok) return say(r.message);
      setGame(r.game, r.events);   // sunset: the night line message shows, then the bunks unlock
      return;
    }
    if (a === 'wake') {
      $('summary').hidden = true;
      if (getGame().over) location.reload();
    }
  });

  // ---- the player walks on the paths (WASD or arrow keys) ----
  const walk = makeWalker([...ROOM_PATHS, ...SHELTER_PATHS], ROOM_PATH_WIDTH);
  const player = createAvatar($('player'));
  player.moveTo(17, 44);   // feet at the bottom-middle of the holder
  const picCrew = createAvatar($('pic-crew'));
  const picSuit = createAvatar($('pic-suit'));
  picCrew.moveTo(17, 44);
  picSuit.moveTo(17, 44);
  dressAvatar(picSuit, { outfit: 'suit' });
  let pos = { ...ROOM_SPAWN };
  const held = new Set();

  function placePlayer() {
    $('player').style.left = `${pos.x - 17}px`;
    $('player').style.top = `${pos.y - 44}px`;
  }

  function afterMove() {
    const g = getGame();
    const inside = pos.y >= SHELTER_DOOR_Y && pos.x > CORRIDOR_X_HALF;
    if (inside && !g.inShelter) {
      setGame(enterShelter(g));
      say('You are inside the radiation shelter. The bunks are here.');
    }
    if (!inside && g.inShelter) setGame(leaveShelter(g).game);

    nearPop('switchboard', isNear(pos, ROOM_SPOTS.switchboard));
    nearPop('wardrobe', isNear(pos, ROOM_SPOTS.wardrobe));
    nearPop('bunks', isNear(pos, ROOM_SPOTS.bunks));
    stage.classList.toggle('near-battery', isNear(pos, ROOM_SPOTS.battery));
    $('exit-left').classList.toggle('near', pos.x < EXITS.left.x + 40);
    $('exit-right').classList.toggle('near', pos.x > EXITS.right.x - 40);
    $('exit-up').classList.toggle('near', pos.y < EXITS.up.y + 40);
    $('exit-down').classList.toggle('near', pos.y > EXITS.down.y - 40);
  }

  // walking through one of the four doors leaves the Command Center that way
  // (left = Greenhouse road, up = Science Lab road, right = Life Support road, down = airlock / solar panels)
  function leaveRoom(dir) {
    if (onExit) return onExit(dir);
    pos = { ...ROOM_SPAWN };   // no base map (testing the room on its own): back to the middle
    placePlayer();
  }
  // the airlock (▼) leads outside: only in the spacesuit
  let suitPopTimer = 0;
  function blockAirlock() {
    pos = { ...pos, y: EXITS.down.y - 34 };   // step back from the door
    placePlayer();
    $('suit-pop').hidden = false;
    clearTimeout(suitPopTimer);
    suitPopTimer = setTimeout(() => { $('suit-pop').hidden = true; }, 3500);
  }

  function doorCrossed() {
    if (pos.x <= EXITS.left.x) return 'left';
    if (pos.x >= EXITS.right.x) return 'right';
    if (pos.y <= EXITS.up.y) return 'up';
    if (pos.y >= EXITS.down.y) return 'down';
    return null;
  }

  function onKeyDown(e) {
    if (!room.isConnected) return cleanup();
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (KEYS[k]) {
      e.preventDefault();
      held.add(k);
    }
  }
  function onKeyUp(e) {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    held.delete(k);
  }

  let last = performance.now();
  function frame(now) {
    if (!room.isConnected) return cleanup();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    let dx = 0;
    let dy = 0;
    if ($('summary').hidden) held.forEach((k) => { dx += KEYS[k][0]; dy += KEYS[k][1]; });
    dx = Math.sign(dx);
    dy = Math.sign(dy);
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      pos = walk.move(pos, (dx / len) * SPEED * dt, (dy / len) * SPEED * dt);
      placePlayer();
      player.faceToward(dx, dy);
      afterMove();
      const door = doorCrossed();
      if (door === 'down' && getGame().outfit !== 'suit') blockAirlock();
      else if (door) leaveRoom(door);
    }
    player.setWalking(!!(dx || dy));
    requestAnimationFrame(frame);
  }

  // ---- every second the game clock ticks: redraw and show what happened ----
  const stopListening = onGameChange((g, events) => {
    if (!room.isConnected) return cleanup();
    for (const ev of events) {
      if (ev === 'sunset-safe') message = `Sunset! You spent ${spentToday(g)} of ${Math.max(0, g.startBattery - POWER_CONFIG.nightReserve)}. Great planning!`;
      if (ev === 'sunset-low') message = `Sunset! The battery is ${shortForNight(g.power)} below the night line. The crew will be cold tonight.`;
    }
    update();
  });

  let cleaned = false;
  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    stopListening();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', fit);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', fit);
  fit();
  placePlayer();
  update();
  requestAnimationFrame(frame);
  return cleanup;
}