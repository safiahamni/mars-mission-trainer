// shelter.js — the RADIATION SHELTER (Member 3): puts all of this place's pieces onto the main map.
//   1. the Command Center (storm shelter core inside), airlock, solar panel, rover (in <g id="place-shelter">)
//   2. the top bar: hazard meter, mission clock, solar storm bar (in <div id="mm-topbar">)
//   3. the "Which way?" route chooser
//   4. the "Shield the Shelter" pop-up you see inside during a solar storm
// Load it AFTER main.js and BEFORE shelter-game.js (shelter-game.js makes it all work).
// Its look is in shelter.css.

(function addRadiationShelter() {
  // one water tank picture, used everywhere
  const TANK = '<svg width="44" height="56" viewBox="0 0 44 56" aria-hidden="true"><rect x="3" y="6" width="38" height="47" rx="12" fill="#3EC6F0" stroke="#2B2A3A" stroke-width="3"/><rect x="14" y="1.5" width="16" height="7" rx="2" fill="#9AA3AE" stroke="#2B2A3A" stroke-width="2.5"/><path d="M22 18 C15 28 15 34 22 38 C29 34 29 28 22 18 Z" fill="#FFFFFF" stroke="#2B2A3A" stroke-width="2"/></svg>';


  // ---------- 1. on the map: Command Center (storm shelter core inside), airlock, solar panel, rover ----------
  // Drawn in the map's small "design" numbers (main.html scales the whole map up 1.6x).
  const MINI_TANK = (x, y) => `<rect x="${x}" y="${y}" width="8" height="12" rx="3" fill="#3EC6F0" stroke="#F4F2EE" stroke-width="1.2"/>`;
  const BUILDING = `
<g id="rs-shelter" transform="translate(319 287) scale(0.7) translate(-319 -287)">
    <!-- solar panel: empty spot for now, straight under the airlock (+ a short straight power cable) -->
        <path d="M268 416 V550" fill="none" stroke="#F28C3A" stroke-width="3" stroke-dasharray="6 5"/>
    <rect x="340" y="575" width="78" height="22" rx="6" fill="#2B2A3A"/><text x="379" y="590" font-size="12" text-anchor="middle" fill="#FFFFFF">Solar panel</text>
    <rect x="202" y="550" width="132" height="70" rx="12" fill="#FFFFFF" fill-opacity="0.14" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="2" stroke-dasharray="6 4"/>
    <!-- rover (seen from above) -->
      <g transform="translate(0 45)">
  <g stroke="#2B2A3A" stroke-linejoin="round">
    <!-- wheels -->
    <rect x="76" y="482" width="10" height="17" rx="3" fill="#45445A" stroke-width="2.5"/><rect x="118" y="482" width="10" height="17" rx="3" fill="#45445A" stroke-width="2.5"/>
    <rect x="76" y="516" width="10" height="17" rx="3" fill="#45445A" stroke-width="2.5"/><rect x="118" y="516" width="10" height="17" rx="3" fill="#45445A" stroke-width="2.5"/>
    <!-- body -->
    <rect x="83" y="475" width="38" height="66" rx="9" fill="#F4F2EE" stroke-width="3"/>
    <!-- windshield -->
    <rect x="89" y="480" width="26" height="15" rx="4" fill="#86C9F2" stroke-width="2"/>
    <!-- vent -->
    <rect x="89" y="500" width="26" height="13" rx="3" fill="#45445A" stroke-width="2"/>
    <path d="M95 503 V510 M100 503 V510 M105 503 V510 M110 503 V510" stroke="#F4F2EE" stroke-width="1.6" stroke-linecap="round"/>
    <!-- orange dial -->
    <circle cx="102" cy="527" r="8" fill="#F28C3A" stroke-width="2"/>
    <circle cx="102" cy="527" r="3.5" fill="#F4F2EE" stroke-width="1.5"/><path d="M102 527 L105 524" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="115" y="535" width="8" height="6" rx="1.5" fill="#F28C3A" stroke-width="1.5"/>
  </g>
  <rect x="136" y="497" width="54" height="22" rx="7" fill="#2B2A3A"/><text x="163" y="512" font-size="12" text-anchor="middle" fill="#FFFFFF">Rover</text>
  </g>
    <!-- AIRLOCK: on the bottom edge of the Command Center, the door to the outside (and the solar panel) -->
  <rect x="180" y="384" width="56" height="20" rx="7" fill="#2B2A3A"/><text x="208" y="398" font-size="11" text-anchor="middle" fill="#FFFFFF">Airlock</text>
  <rect x="240" y="368" width="56" height="48" rx="9" fill="#E6E4EA" stroke="#2B2A3A" stroke-width="3"/>
  <rect x="244" y="378" width="7" height="24" rx="3" fill="#F28C3A" stroke="#2B2A3A" stroke-width="1.5"/><rect x="285" y="378" width="7" height="24" rx="3" fill="#F28C3A" stroke="#2B2A3A" stroke-width="1.5"/>
  <rect x="255" y="380" width="26" height="16" rx="4" fill="#F4F2EE" stroke="#2B2A3A" stroke-width="2"/><rect x="260" y="386" width="16" height="4" rx="2" fill="#5CE0B5" stroke="#2B2A3A" stroke-width="1"/>
  <rect x="250" y="404" width="36" height="7" rx="1.5" fill="#FFD84A" stroke="#2B2A3A" stroke-width="1.5"/>
  <path d="M255 411 l4 -7 M263 411 l4 -7 M271 411 l4 -7 M279 411 l4 -7" stroke="#2B2A3A" stroke-width="2.2"/>



  <!-- COMMAND CENTER -->
  <rect x="206" y="202" width="164" height="26" rx="7" fill="#2B2A3A"/><circle cx="221" cy="215" r="5" fill="#5CE0B5" stroke="#FFFFFF" stroke-width="1.5"/>
  <text x="296" y="220" font-size="14" text-anchor="middle" fill="#FFFFFF">Command Center</text>
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
  <!-- STORM SHELTER CORE: the dashed blue line = water around the crew -->
  <rect x="314" y="248" width="104" height="96" rx="10" fill="#2B2A3A" stroke="#2B2A3A" stroke-width="2"/>
  <rect class="cc-core-border" x="320" y="254" width="92" height="66" rx="8" fill="none" stroke="#3EC6F0" stroke-width="4" stroke-dasharray="9 5"/>
  <rect x="330" y="264" width="34" height="12" rx="3" fill="#F4F2EE"/><rect x="330" y="264" width="9" height="12" rx="2" fill="#FF5A5A"/>
  <rect x="330" y="282" width="34" height="12" rx="3" fill="#F4F2EE"/><rect x="330" y="282" width="9" height="12" rx="2" fill="#FF5A5A"/>
  <path d="M392 268 L402 272 L402 282 Q402 290 392 294 Q382 290 382 282 L382 272 Z" fill="#3EC6F0" stroke="#F4F2EE" stroke-width="1.5"/>
  <!-- water tanks: wait on the floor, then go onto the shelves (kept in sync with the pop-up by shelter-game.js) -->
  <g data-map-shelf="back"><g class="cc-shelf-tank">${MINI_TANK(362, 249)}</g></g>
  <g data-map-shelf="left"><g class="cc-shelf-tank">${MINI_TANK(316, 281)}</g></g>
  <g data-map-shelf="right"><g class="cc-shelf-tank">${MINI_TANK(408, 281)}</g></g>
  <g data-map-tank="0">${MINI_TANK(342, 302)}</g>
  <g data-map-tank="1">${MINI_TANK(354, 302)}</g>
  <g data-map-tank="2">${MINI_TANK(366, 302)}</g>
  <text x="366" y="336" font-size="11" text-anchor="middle" fill="#FFFFFF">Storm shelter core</text>
  <rect x="228" y="350" width="182" height="22" rx="7" fill="#FFE38A" stroke="#2B2A3A" stroke-width="2"/>
  <text x="319" y="365" font-size="12" text-anchor="middle" fill="#2B2A3A">Missions · switches · sleep</text>
  <!-- "Crew safe" badge (shows while you are inside) -->
  <g class="cc-badge"><rect x="384" y="226" width="56" height="18" rx="7" fill="#5CE0B5" stroke="#2B2A3A" stroke-width="2"/><text x="412" y="239" font-size="10" text-anchor="middle" fill="#2B2A3A">Crew safe</text></g>
</g>`;

  // ---------- 2. the top bar ----------
  const TOP_BAR = `
<div class="rs-hud">
  <div>
    <div class="rs-lbl">Hazard <span id="rs-hazNum">0</span> / 100</div>
    <div class="rs-meter" role="meter" aria-label="Hazard" aria-valuemin="0" aria-valuemax="100" id="rs-hazMeter"><div class="rs-needle" id="rs-hazNeedle" style="left:0%"></div></div>
  </div>
  <div><div class="rs-lbl">Mission clock</div><div class="rs-big" id="rs-clock">Sol 3 · 10:00</div></div>
  <div><div class="rs-lbl">Hazard rate</div><div class="rs-big" id="rs-rate">+2.0 per min</div></div>
  <div class="rs-shade-badge" id="rs-shadeBadge">Cliff shade: −10%</div>
</div>
<div class="rs-storm-bar rs-calm" id="rs-stormBar"><span class="rs-dot"></span><span id="rs-stormText">Calm skies · normal background radiation.</span></div>`;

  // ---------- 3. route chooser ----------

  const CHOOSER = `
<!-- ===== ROUTE CHOOSER (Dora-style): pops up at the fork ===== -->
<div class="rs-chooser" id="rs-chooser" hidden role="dialog" aria-modal="true" aria-labelledby="rs-chooserTitle">
  <div class="rs-chooser-card">
    <h2 id="rs-chooserTitle">Which way to the Science Lab?</h2>
    <p class="rs-chooser-sub">There's a solar storm. Pick the route that keeps you safest!</p>

    <div class="rs-routes">
      <button type="button" class="rs-route" data-route="open">
        <span class="rs-route-icon"><svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="9" fill="#FFD84A" stroke="#2B2A3A" stroke-width="2.5"/><g stroke="#FFD84A" stroke-width="3.5" stroke-linecap="round"><line x1="22" y1="3" x2="22" y2="8"/><line x1="22" y1="36" x2="22" y2="41"/><line x1="3" y1="22" x2="8" y2="22"/><line x1="36" y1="22" x2="41" y2="22"/><line x1="8.5" y1="8.5" x2="12" y2="12"/><line x1="32" y1="32" x2="35.5" y2="35.5"/><line x1="8.5" y1="35.5" x2="12" y2="32"/><line x1="32" y1="12" x2="35.5" y2="8.5"/></g></svg></span>
        <span class="rs-route-name">Normal path</span>
        <span class="rs-route-row"><span>Time</span><b id="rs-openTime">10 min</b></span>
        <span class="rs-route-row"><span>Radiation</span><b id="rs-openRate">+2.0 per min</b></span>
        <span class="rs-route-row rs-total"><span>Total</span><b id="rs-openTotal">+20.0</b></span>
        <span class="rs-route-note">Short and near, but no shade at all.</span>
        <span class="rs-route-key">Press 1</span>
      </button>
      <button type="button" class="rs-route rs-route-cliff" data-route="cliff">
        <span class="rs-route-icon"><svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><polygon points="2,40 15,12 24,26 30,18 42,40" fill="#9C3E22" stroke="#2B2A3A" stroke-width="2.5" stroke-linejoin="round"/><polygon points="15,12 19,21 13,20" fill="#E07A52"/><polygon points="30,18 34,25 28,24" fill="#E07A52"/></svg></span>
        <span class="rs-route-name">Cliff route</span>
        <span class="rs-route-row"><span>Time</span><b id="rs-cliffTime">11 min</b></span>
        <span class="rs-route-row"><span>Radiation</span><b id="rs-cliffRate">+1.8 per min</b></span>
        <span class="rs-route-row rs-total"><span>Total</span><b id="rs-cliffTotal">+19.8</b></span>
        <span class="rs-route-note">Long and far, but the cliffs block some radiation.</span>
        <span class="rs-route-key">Press 2</span>
      </button>
    </div>

    <button type="button" class="rs-info-btn" id="rs-infoBtn" aria-expanded="false" aria-controls="rs-info">ⓘ Why do cliffs help?</button>
    <div class="rs-info" id="rs-info" hidden>
      <p>Radiation on Mars comes from space, from almost every direction in the sky.
         A tall cliff blocks part of the sky, so fewer particles can reach you.</p>
      <p><b>Real science:</b> when NASA's Curiosity rover parked next to a butte (a small cliff hill)
         that blocked 19% of the sky, its radiation dose dropped by about 4%.
         Our game uses 10% so it's easier to see.</p>
    </div>

    <button type="button" class="rs-walk-self" id="rs-walkSelf">I'll walk myself</button>
  </div>
</div>
<div class="rs-route-banner" id="rs-routeBanner" hidden></div>`;

  // ---------- 4. the pop-up inside the shelter ----------
  const SHIELD_POPUP = `
<!-- ===== SHIELD THE SHELTER mini-game: opens when you enter the shelter during a storm ===== -->
<div class="rs-shield" id="rs-shield" hidden role="dialog" aria-modal="true" aria-labelledby="rs-shieldTitle">
  <div class="rs-shield-card">
    <h2 id="rs-shieldTitle">Shield the Shelter!</h2>
    <p class="rs-shield-msg" id="rs-shieldMsg">Walk to a water tank to pick it up, then put it on a shelf.</p>
    <div class="rs-shield-body">
      <div class="rs-room" id="rs-room" aria-label="Shelter seen from above. Use the arrow keys or tap the floor to walk.">
        <div class="rs-slot rs-slot-back" data-slot="back" role="img" aria-label="Place a water tank on the back shelf"><span>Back shelf</span>${TANK}</div>
        <div class="rs-slot rs-slot-left" data-slot="left" role="img" aria-label="Place a water tank on the left shelf"><span>Left shelf</span>${TANK}</div>
        <div class="rs-slot rs-slot-right" data-slot="right" role="img" aria-label="Place a water tank on the right shelf"><span>Right shelf</span>${TANK}</div>
        <!-- water tanks on the floor: walk onto one to pick it up -->
        <div class="rs-floor-tank rs-ft-0" data-tank="0">${TANK}</div>
        <div class="rs-floor-tank rs-ft-1" data-tank="1">${TANK}</div>
        <div class="rs-floor-tank rs-ft-2" data-tank="2">${TANK}</div>
        <div class="rs-carried" id="rs-carried" hidden>${TANK}</div>
        <!-- your avatar is added here by shelter-game.js -->
      </div>
      <div class="rs-shield-stats">
        <div class="rs-stat"><span>Outside rate</span><b class="rs-out-rate" id="rs-outRate">+2.0 / min</b></div>
        <div class="rs-stat"><span>Inside rate</span><b id="rs-inRate">+1.0 / min</b>
          <div class="rs-in-bar"><div id="rs-inBar" style="width:100%"></div></div></div>
        <div class="rs-stat"><span>Water tanks</span><b id="rs-tankCount">0 / 3</b></div>
        <p class="rs-shield-fact">Water is great at stopping solar storm particles. That's why real shelter plans put water around the crew.</p>
      </div>
    </div>
    <button type="button" class="rs-go-out" id="rs-goOut" hidden>Go back outside</button>
  </div>
</div>`;

  // put everything on the main map
  // the Command Center goes into the main map's drawing, in the spot <g id="place-shelter">
  document.getElementById('place-shelter').innerHTML = BUILDING;
  document.getElementById('mm-topbar').insertAdjacentHTML('beforeend', TOP_BAR);
  const toastEl = document.getElementById('mm-toast');           // pop-ups go under the toast
  toastEl.insertAdjacentHTML('beforebegin', CHOOSER);
  toastEl.insertAdjacentHTML('beforebegin', SHIELD_POPUP);
})();