// COMMAND CENTER BUILDING on the base map (Member 1).
// The building is a small copy of the inside of the Command Center room, in the same style as
// the Life Support building: the mint floor, the wardrobe, switchboard, mission control,
// battery bank and the radiation shelter (water wall + 3 sleeping pods). No walkways inside,
// to keep it simple. The airlock is built onto the bottom wall, with its name tag underneath.
// It also draws the GLASS TUNNELS over the roads to every station: the floor of a tunnel goes
// under the player, and the glass + bronze ribs go over the player, so the crew walks inside.
// Load it BEFORE solar-panel.js (it replaces the empty box in <g id="place-shelter">).
// Everything here starts with cc- so it can't clash with other places. Its look is in ccBuilding.css.
import './ccBuilding.css';

const map = window.MarsMap;

const BUILDING = `
<g id="cc-building" transform="translate(319 287) scale(0.7) translate(-319 -287)">
  <defs>
    <pattern id="cc-mfloor" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#9EDFC8"/><path d="M9 0V9H0" fill="none" stroke="#84CBB2" stroke-width="0.8"/></pattern>
    <pattern id="cc-air-floor" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#F1EFF4"/><path d="M8 0V8H0" fill="none" stroke="#D8D6DE" stroke-width="0.8"/></pattern>
    <pattern id="cc-sh-floor" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#3B3F57"/><path d="M6 0V6H0" fill="none" stroke="#34384E" stroke-width="0.7"/></pattern>
  </defs>

  <!-- AIRLOCK: built onto the bottom wall (drawn first, so the Command Center's wall covers its top) -->
  <rect x="234" y="346" width="68" height="76" rx="10" fill="#E6E4EA" stroke="#2B2A3A" stroke-width="3"/>
  <rect x="240" y="362" width="56" height="54" rx="6" fill="url(#cc-air-floor)" stroke="#2B2A3A" stroke-width="2"/>
  <rect x="243" y="368" width="7" height="30" rx="3" fill="#F28C3A" stroke="#2B2A3A" stroke-width="1.5"/>
  <rect x="286" y="368" width="7" height="30" rx="3" fill="#F28C3A" stroke="#2B2A3A" stroke-width="1.5"/>
  <rect x="255" y="372" width="26" height="15" rx="4" fill="#F4F2EE" stroke="#2B2A3A" stroke-width="2"/>
  <rect x="260" y="377.5" width="16" height="4" rx="2" fill="#5CE0B5" stroke="#2B2A3A" stroke-width="1"/>
  <rect x="250" y="404" width="36" height="8" rx="1.5" fill="#FFD84A" stroke="#2B2A3A" stroke-width="1.5"/>
  <path d="M255 412 l4 -8 M263 412 l4 -8 M271 412 l4 -8 M279 412 l4 -8" stroke="#2B2A3A" stroke-width="2.2"/>
  <!-- the airlock's name tag, under the room -->
  <rect x="236" y="427" width="64" height="20" rx="7" fill="#2B2A3A"/>
  <text x="268" y="441.5" font-size="12" text-anchor="middle" fill="#FFFFFF">Airlock</text>

  <!-- name tag -->
  <rect x="206" y="202" width="164" height="26" rx="7" fill="#2B2A3A"/><circle cx="221" cy="215" r="5" fill="#5CE0B5" stroke="#FFFFFF" stroke-width="1.5"/>
  <text x="296" y="220" font-size="14" text-anchor="middle" fill="#FFFFFF">Command Center</text>

  <!-- walls + mint tiled floor (the same as inside) -->
  <rect class="cc-wall" x="206" y="234" width="226" height="128" rx="16" fill="#E6E4EA" stroke="#2B2A3A" stroke-width="3"/>
  <rect x="213" y="241" width="212" height="114" rx="10" fill="url(#cc-mfloor)" stroke="#2B2A3A" stroke-width="2.5"/>

  <!-- doors where the roads arrive: left, top and right go out; the grey bottom one goes into the airlock -->
  <g stroke="#2B2A3A" stroke-width="2">
    <rect x="203" y="323" width="8" height="16" rx="2.5" fill="#E8843F"/>
    <rect x="427" y="297" width="8" height="16" rx="2.5" fill="#E8843F"/>
    <rect x="284" y="231" width="16" height="8" rx="2.5" fill="#E8843F"/>
    <rect x="260" y="357" width="16" height="8" rx="2.5" fill="#9AA0AD"/>
  </g>

  <!-- wardrobe: a white locker with a shirt window and a helmet window -->
  <rect x="223" y="250" width="26" height="40" rx="4" fill="#F4F2EE" stroke="#2B2A3A" stroke-width="2.5"/>
  <path d="M236 252 V288" stroke="#2B2A3A" stroke-width="1.5"/>
  <rect x="226" y="255" width="8" height="10" rx="2" fill="#30384A"/><rect x="238" y="255" width="8" height="10" rx="2" fill="#30384A"/>
  <path d="M228 258 h4 v5 h-4z" fill="#5A8FE0"/><circle cx="242" cy="260" r="2.6" fill="#9EDFC8" stroke="#F4F2EE" stroke-width="0.8"/>

  <!-- switchboard: a white box with lamps and levers -->
  <rect x="256" y="252" width="30" height="20" rx="3" fill="#F4F2EE" stroke="#2B2A3A" stroke-width="2.5"/>
  <g fill="#4CD07D" stroke="#2B2A3A" stroke-width="0.8"><circle cx="262" cy="257" r="1.8"/><circle cx="268.5" cy="257" r="1.8"/><circle cx="275" cy="257" r="1.8"/><circle cx="281" cy="257" r="1.8" fill="#1E2129"/></g>
  <path d="M262 268 v-6 M268.5 268 v-6 M275 268 v-6 M281 268 v-6" stroke="#2B2A3A" stroke-width="1.6" stroke-linecap="round"/>

  <!-- mission control: three screens and a curved desk -->
  <g stroke="#2B2A3A" stroke-width="2"><rect x="306" y="247" width="26" height="18" rx="3" fill="#262A35"/><rect x="335" y="246" width="28" height="20" rx="3" fill="#262A35"/><rect x="366" y="247" width="26" height="18" rx="3" fill="#262A35"/></g>
  <circle cx="319" cy="256" r="5" fill="#3E7BD6"/><path d="M316 255 q2 -3 4 0 q1 3 3 1" fill="none" stroke="#5FD38A" stroke-width="1.4"/>
  <path d="M338 257 h6 l2 -4 l3 7 l2 -3 h8" fill="none" stroke="#5FD38A" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M371 252 h16 M371 256 h16 M371 260 h16" stroke="#F0A04B" stroke-width="1.6"/>
  <path d="M304 270 Q349 264 394 270 L390 281 Q349 276 308 281 Z" fill="#E6E4EA" stroke="#2B2A3A" stroke-width="2" stroke-linejoin="round"/>
  <g stroke="#2B2A3A" stroke-width="0.8"><circle cx="322" cy="275" r="2" fill="#E0605A"/><circle cx="329" cy="275" r="2" fill="#FFD23F"/><circle cx="336" cy="275" r="2" fill="#4CD07D"/></g>

  <!-- battery bank: three tall cells -->
  <rect x="222" y="302" width="34" height="46" rx="4" fill="#F4F2EE" stroke="#2B2A3A" stroke-width="2.5"/>
  <g fill="#30384A" stroke="#2B2A3A" stroke-width="1.2"><rect x="226" y="306" width="8" height="32" rx="2"/><rect x="235" y="306" width="8" height="32" rx="2"/><rect x="244" y="306" width="8" height="32" rx="2"/></g>
  <g fill="#8EDB9C"><rect x="227.5" y="318" width="5" height="18" rx="1.5"/><rect x="236.5" y="318" width="5" height="18" rx="1.5"/><rect x="245.5" y="318" width="5" height="18" rx="1.5"/></g>
  <rect x="225" y="340" width="28" height="5" fill="#FFD23F" stroke="#2B2A3A" stroke-width="1"/>
  <path d="M228 345 l3 -5 M234 345 l3 -5 M240 345 l3 -5 M246 345 l3 -5" stroke="#2B2A3A" stroke-width="1.4"/>

  <!-- radiation shelter: a thick wall of water (blue) round 3 sleeping pods -->
  <rect x="338" y="296" width="76" height="54" rx="8" fill="#5B8DE8" stroke="#2B2A3A" stroke-width="2.5"/>
  <rect class="cc-core-border" x="341.5" y="299.5" width="69" height="47" rx="6" fill="none" stroke="#BFE0FF" stroke-width="1.4" stroke-dasharray="4 3"/>
  <rect x="345" y="303" width="62" height="40" rx="5" fill="url(#cc-sh-floor)" stroke="#2B2A3A" stroke-width="2"/>
  <g stroke="#2B2A3A" stroke-width="1.4"><rect x="350" y="307" width="13" height="27" rx="4" fill="#EEF0F5"/><rect x="369.5" y="307" width="13" height="27" rx="4" fill="#EEF0F5"/><rect x="389" y="307" width="13" height="27" rx="4" fill="#EEF0F5"/></g>
  <g stroke="#2B2A3A" stroke-width="1"><rect x="352" y="316" width="9" height="16" rx="2.5" fill="#5EC8DC"/><rect x="371.5" y="316" width="9" height="16" rx="2.5" fill="#F5C84C"/><rect x="391" y="316" width="9" height="16" rx="2.5" fill="#9B7BE8"/></g>
  <g fill="#FFFFFF" stroke="#2B2A3A" stroke-width="0.8"><rect x="352" y="309.5" width="9" height="5" rx="2"/><rect x="371.5" y="309.5" width="9" height="5" rx="2"/><rect x="391" y="309.5" width="9" height="5" rx="2"/></g>
</g>`;

// put the building into the map, in place of the empty box
document.getElementById('place-shelter').innerHTML = BUILDING;
const building = document.getElementById('cc-building');

// green outline while the crew is inside; red water line during a solar storm
map.on('enter', (place) => building.classList.toggle('cc-inside', place === 'shelter'));
map.on('leave', () => building.classList.remove('cc-inside'));
map.on('update', () => building.classList.toggle('cc-storm', !!window.MarsHUD?.isStorm()));
building.classList.toggle('cc-inside', map.isInside() === 'shelter');

// ================= GLASS TUNNELS: from the Command Center to every station =================
// The same roads as in map.js (ROADS), in the map's design numbers, starting at the Command
// Center's walls: Greenhouse (left), Science Lab (up, then the cliff route and the normal path)
// and Life Support (right). The crew walks inside them.
// Part 1 (under the roads): the shadow and the bronze base strip on both sides.
// Part 2 (over the player): see-through glass, bronze ribs and a shine line, in a second
// drawing on top of the avatar that never blocks walking or clicks.
// If a road is moved in map.js, change it here too.
const TUNNELS = [
  'M240 318 L65 318',                                                              // Greenhouse
  'M300 227 C300 215 299 195 298 178',                                             // Science Lab road, up to the fork
  'M298 178 C300 165 308 154 318 144 C340 122 362 100 384 78 C398 62 410 28 455 28 C500 28 512 62 540 62',   // cliff route
  'M298 178 C304 200 330 205 370 205 C460 205 560 170 575 106',                    // normal path
  'M398 300 L510 300 C522 300 522 320 522 340 C522 420 522 500 540 500',           // Life Support
].join(' ');
const ART = 'translate(90 7) scale(1.6)';   // the map's design numbers (the same as index.html)
const px = (x, y) => [90 + x * 1.6, 7 + y * 1.6];
const FORK = [298, 178];   // where the Science Lab road splits: a round glass hub joins the tunnels here
// the glass stops at each station's wall, so it never covers a building or its name tag
// (design numbers: x, y, width, height)
const BUILDINGS = [
  [-56, 256, 128, 102],    // Greenhouse
  [537, 6, 128, 102],      // Science Lab
  [541, 444, 130, 106],    // Life Support
  [524, 488, 18, 50],      // the last bend into Life Support's door
];

const roads = document.getElementById('mm-roads');
if (roads) {
  roads.insertAdjacentHTML('beforebegin', `
<g id="cc-tunnel-base" fill="none" aria-hidden="true">
  <path d="${TUNNELS}" stroke="rgba(60, 20, 10, 0.3)" stroke-width="38" transform="translate(2 3)"/>
  <path d="${TUNNELS}" stroke="#2B2A3A" stroke-width="38"/>
  <path d="${TUNNELS}" stroke="#8A5A3C" stroke-width="35"/>
  <circle cx="${FORK[0]}" cy="${FORK[1]}" r="24" fill="#2B2A3A"/>
  <circle cx="${FORK[0]}" cy="${FORK[1]}" r="22.5" fill="#8A5A3C"/>
  <circle cx="${FORK[0]}" cy="${FORK[1]}" r="16" fill="url(#mm-dots)"/>
</g>`);
}

const top = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
top.setAttribute('class', 'mm-art cc-tunnel-top');
top.setAttribute('viewBox', '0 0 1160 880');
top.setAttribute('aria-hidden', 'true');
top.innerHTML = `
<defs><mask id="cc-tunnel-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="1160" height="880">
  <rect width="1160" height="880" fill="#FFFFFF"/>
  ${BUILDINGS.map(([x, y, w, h]) => { const [X, Y] = px(x, y); return `<rect x="${X}" y="${Y}" width="${w * 1.6}" height="${h * 1.6}" fill="#000000"/>`; }).join('')}
  <circle cx="${px(...FORK)[0]}" cy="${px(...FORK)[1]}" r="${21 * 1.6}" fill="#000000"/>
</mask></defs>
<g mask="url(#cc-tunnel-cut)"><g transform="${ART}" fill="none">
  <path d="${TUNNELS}" stroke="#BFE6F5" stroke-width="34" opacity="0.14"/>
  <path d="${TUNNELS}" stroke="#2B2A3A" stroke-width="38" stroke-dasharray="3 32"/>
  <path d="${TUNNELS}" stroke="#D9A35A" stroke-width="35.5" stroke-dasharray="1.8 33.2" stroke-dashoffset="-0.6"/>
  <path d="${TUNNELS}" stroke="#FFFFFF" stroke-width="1.3" opacity="0.55" stroke-dasharray="26 12" transform="translate(-3 -5)"/>
</g></g>
<g transform="${ART}" fill="none">
  <circle cx="${FORK[0]}" cy="${FORK[1]}" r="21" fill="#BFE6F5" fill-opacity="0.14" stroke="#2B2A3A" stroke-width="3.5"/>
  <circle cx="${FORK[0]}" cy="${FORK[1]}" r="21" stroke="#D9A35A" stroke-width="2"/>
  <path d="M${FORK[0] - 12} ${FORK[1] - 10} a16 16 0 0 1 14 -7" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>
</g>`;
map.scene.appendChild(top);