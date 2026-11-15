// COMMAND CENTER BUILDING on the base map (Member 1).
// The drawing is Member 3's (it was in radiation-shelter/shelter.js): the console and desk,
// the sleep pods, and the storm shelter core with its water line and water tanks.
// The airlock, rover and solar panels are drawn by radiation-shelter/solar-panel.js.
// Load it BEFORE solar-panel.js (it replaces the empty box in <g id="place-shelter">).
// Everything here starts with cc- so it can't clash with other places. Its look is in ccBuilding.css.
import './ccBuilding.css';

const map = window.MarsMap;

const MINI_TANK = (x, y) => `<rect x="${x}" y="${y}" width="8" height="12" rx="3" fill="#3EC6F0" stroke="#F4F2EE" stroke-width="1.2"/>`;

const BUILDING = `
<g id="cc-building" transform="translate(319 287) scale(0.7) translate(-319 -287)">
  <!-- name tag -->
  <rect x="206" y="202" width="164" height="26" rx="7" fill="#2B2A3A"/><circle cx="221" cy="215" r="5" fill="#5CE0B5" stroke="#FFFFFF" stroke-width="1.5"/>
  <text x="296" y="220" font-size="14" text-anchor="middle" fill="#FFFFFF">Command Center</text>
  <!-- walls + tiled floor -->
  <rect class="cc-wall" x="206" y="234" width="226" height="128" rx="16" fill="#E6E4EA" stroke="#2B2A3A" stroke-width="3"/>
  <rect x="213" y="241" width="212" height="114" rx="10" fill="url(#ctile)" stroke="#2B2A3A" stroke-width="2.5"/>
  <!-- console (the switches) + desk -->
  <rect x="224" y="250" width="80" height="22" rx="6" fill="#F4F2EE" stroke="#2B2A3A" stroke-width="2"/>
  <circle cx="236" cy="261" r="6" fill="#3E7BD6" stroke="#2B2A3A" stroke-width="1.5"/>
  <rect x="247" y="254" width="22" height="14" rx="3" fill="#2B2A3A"/><path d="M249 262 h4 l3 -5 l3 8 l3 -3 h5" fill="none" stroke="#5CE0B5" stroke-width="1.8" stroke-linejoin="round"/>
  <rect x="274" y="254" width="22" height="14" rx="3" fill="#2B2A3A"/><path d="M278 258 h14 M278 261 h14 M278 264 h10" stroke="#F2A623" stroke-width="1.6"/>
  <path d="M224 286 Q264 274 304 286 L302 294 Q264 283 226 294 Z" fill="#F4F2EE" stroke="#2B2A3A" stroke-width="2" stroke-linejoin="round"/>
  <!-- sleep pods -->
  <rect x="228" y="302" width="72" height="40" rx="8" fill="#F4F2EE" stroke="#2B2A3A" stroke-width="2"/>
  <rect x="236" y="309" width="15" height="26" rx="5" fill="#5CE0B5" stroke="#2B2A3A" stroke-width="2"/><rect x="257" y="309" width="15" height="26" rx="5" fill="#5CE0B5" stroke="#2B2A3A" stroke-width="2"/><rect x="278" y="309" width="15" height="26" rx="5" fill="#5CE0B5" stroke="#2B2A3A" stroke-width="2"/>
  <!-- storm shelter core: the dashed blue line = water around the crew -->
  <rect x="314" y="248" width="104" height="96" rx="10" fill="#2B2A3A" stroke="#2B2A3A" stroke-width="2"/>
  <rect class="cc-core-border" x="320" y="254" width="92" height="66" rx="8" fill="none" stroke="#3EC6F0" stroke-width="4" stroke-dasharray="9 5"/>
  <rect x="330" y="264" width="34" height="12" rx="3" fill="#F4F2EE"/><rect x="330" y="264" width="9" height="12" rx="2" fill="#FF5A5A"/>
  <rect x="330" y="282" width="34" height="12" rx="3" fill="#F4F2EE"/><rect x="330" y="282" width="9" height="12" rx="2" fill="#FF5A5A"/>
  <path d="M392 268 L402 272 L402 282 Q402 290 392 294 Q382 290 382 282 L382 272 Z" fill="#3EC6F0" stroke="#F4F2EE" stroke-width="1.5"/>
  ${MINI_TANK(342, 302)}${MINI_TANK(354, 302)}${MINI_TANK(366, 302)}
  <text x="366" y="336" font-size="11" text-anchor="middle" fill="#FFFFFF">Storm shelter core</text>
  <rect x="228" y="350" width="182" height="22" rx="7" fill="#FFE38A" stroke="#2B2A3A" stroke-width="2"/>
  <text x="319" y="365" font-size="12" text-anchor="middle" fill="#2B2A3A">missions · switches · sleep</text>
  <!-- "Crew safe" badge (shows while the crew is inside) -->
  <g class="cc-badge"><rect x="384" y="226" width="56" height="18" rx="7" fill="#5CE0B5" stroke="#2B2A3A" stroke-width="2"/><text x="412" y="239" font-size="10" text-anchor="middle" fill="#2B2A3A">Crew safe</text></g>
</g>`;

// put the building into the map, in place of the empty box
document.getElementById('place-shelter').innerHTML = BUILDING;
const building = document.getElementById('cc-building');

// green outline + "Crew safe" while the crew is inside; red water line during a solar storm
map.on('enter', (place) => building.classList.toggle('cc-inside', place === 'shelter'));
map.on('leave', () => building.classList.remove('cc-inside'));
map.on('update', () => building.classList.toggle('cc-storm', !!window.MarsHUD?.isStorm()));
building.classList.toggle('cc-inside', map.isInside() === 'shelter');