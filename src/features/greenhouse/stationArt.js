// Greenhouse map station artwork: climate console, soil lab line, compost bins, electricity box.
// Pure markup builders: GreenhousePanel.js passes in live values and drops the result into render().

const INK = "#2b2a3a";
const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const FONT = "Trebuchet MS,Segoe UI,sans-serif";
const pct = (v, min, max) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));

const label = (num, text, urgent = false) =>
  `<span class="st-label"><i class="st-num ${urgent ? "urgent" : ""}">${num}</i>${text}</span>`;

/* ---------- 1 · Climate control ---------- */
export function climateStation({ temperature, light, band, needsTuning = false }) {
  const [t0, t1, l0, l1] = band;
  const tp = pct(temperature, 10, 34), lp = pct(light, 0, 100);
  const X0 = 36, W = 64;
  const bar = (y, from, to, val) => {
    const a = X0 + (W * from) / 100, b = X0 + (W * to) / 100, m = X0 + (W * val) / 100;
    return `<rect x="${X0}" y="${y}" width="${W}" height="6" rx="3" fill="#4f5b66"/><rect x="${a.toFixed(1)}" y="${y}" width="${(b - a).toFixed(1)}" height="6" rx="3" fill="#52d5ae"/><circle cx="${m.toFixed(1)}" cy="${y + 3}" r="5" fill="#ffd84a" stroke="${INK}" stroke-width="1.8"/>`;
  };
  const ang = (v) => (-120 + v * 2.4).toFixed(1);
  const dial = (cx, v, color) => `<circle cx="${cx}" cy="70" r="12" fill="#f4f2f6" ${S} stroke-width="2.5"/><circle cx="${cx}" cy="70" r="8.5" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="2 3"/><g transform="rotate(${ang(v)} ${cx} 70)"><line x1="${cx}" y1="70" x2="${cx}" y2="61.5" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></g><circle cx="${cx}" cy="70" r="2.6" fill="${INK}"/>`;
  const ok = !needsTuning;
  const art = `<svg class="cp-art" viewBox="0 0 120 92" aria-hidden="true">
    <rect x="4" y="4" width="112" height="84" rx="11" fill="#d7d5df" ${S}/>
    <path d="M14 11 H44 M14 15 H44 M14 19 H44" stroke="#9a98a8" stroke-width="2" stroke-linecap="round"/>
    <circle cx="104" cy="14" r="4.2" fill="${ok ? "#52d5ae" : "#ff5e5b"}" stroke="#fff" stroke-width="1.2"/>
    <rect x="12" y="24" width="96" height="32" rx="6" fill="#283640" ${S} stroke-width="2.5"/>
    <rect x="19" y="29" width="4.4" height="12" rx="2.2" fill="#fff"/><circle cx="21.2" cy="43.5" r="4.2" fill="#ff6d67"/>
    <circle cx="21.2" cy="50" r="0" fill="none"/>
    ${bar(29, pct(t0, 10, 34), pct(t1, 10, 34), tp)}
    <circle cx="21.2" cy="49" r="3.2" fill="#ffd84a"/><path d="M21.2 43.3v1.6M21.2 53.1v1.6M15.5 49h1.6M25.3 49h1.6M17.2 45l1.1 1.1M24.1 51.9l1.1 1.1M17.2 53l1.1-1.1M24.1 46.1l1.1-1.1" stroke="#ffd84a" stroke-width="1.3" stroke-linecap="round"/>
    ${bar(46, l0, l1, lp)}
    ${dial(34, tp, "#ff9068")}${dial(86, lp, "#ffd84a")}
    <rect x="50" y="64" width="20" height="12" rx="3" fill="#283640" ${S} stroke-width="2"/>
    <circle cx="56" cy="70" r="2.2" fill="${ok ? "#52d5ae" : "#ff5e5b"}"/><circle cx="64" cy="70" r="2.2" fill="#ffd84a"/>
  </svg>`;
  return `<button class="gm-station climate-station" data-action="station" data-station="climate" aria-label="Climate control settings">
    ${art}
    ${label("⚙", "Climate settings")}
    ${needsTuning ? '<span class="st-warn">NEEDS TUNING</span>' : ""}
  </button>`;
}

/* ---------- 2 · Soil lab ---------- */
const VB = 'viewBox="0 0 100 84" preserveAspectRatio="xMidYMax meet" aria-hidden="true"';

const hopper = `<svg ${VB}>
  <polygon points="8,14 92,14 70,58 30,58" fill="#e6e4ea" ${S}/>
  <polygon points="17,22 83,22 67,46 33,46" fill="#b85a34" ${S} stroke-width="2"/>
  <circle cx="38" cy="32" r="2.5" fill="#7a3a22"/><circle cx="56" cy="28" r="2.5" fill="#7a3a22"/><circle cx="66" cy="36" r="2.5" fill="#e0a07a"/><circle cx="46" cy="39" r="2" fill="#e0a07a"/>
  <rect x="40" y="58" width="20" height="14" fill="#8d8b99" ${S}/>
  <rect x="26" y="72" width="48" height="9" rx="4" fill="#e6e4ea" ${S}/>
</svg>`;

const tray = `<svg ${VB}>
  <rect x="42" y="2" width="16" height="7" rx="2" fill="${INK}"/>
  <rect x="35" y="8" width="30" height="26" rx="8" fill="#a8e6d6" ${S}/>
  <circle cx="45" cy="19" r="3.2" fill="#fff" stroke="${INK}" stroke-width="1.5"/><circle cx="55" cy="25" r="3.2" fill="#fff" stroke="${INK}" stroke-width="1.5"/><circle cx="53" cy="15" r="2" fill="#fff" stroke="${INK}" stroke-width="1.2"/>
  <rect x="5" y="46" width="90" height="34" rx="9" fill="#e6e4ea" ${S}/>
  <rect x="14" y="54" width="72" height="18" rx="5" fill="#b85a34" ${S} stroke-width="2.5"/>
</svg>`;

const oven = (progress) => `<svg ${VB}>
  <rect x="10" y="8" width="80" height="72" rx="11" fill="#e6e4ea" ${S}/>
  <rect x="20" y="18" width="60" height="34" rx="6" fill="${INK}"/>
  <rect x="27" y="26" width="46" height="18" rx="3" fill="#b85a34"/>
  <rect x="20" y="58" width="60" height="12" rx="6" fill="${INK}"/>
  <rect x="24" y="62" width="${(52 * progress / 100).toFixed(1)}" height="4" rx="2" fill="#52d5ae"/>
</svg>`;

const tester = `<svg ${VB}>
  <rect x="66" y="8" width="7" height="38" rx="3.5" fill="#ff6d67" ${S} stroke-width="2.2"/>
  <rect x="75" y="8" width="7" height="38" rx="3.5" fill="#ffd84a" ${S} stroke-width="2.2"/>
  <rect x="84" y="8" width="7" height="38" rx="3.5" fill="#52d5ae" ${S} stroke-width="2.2"/>
  <rect x="62" y="40" width="34" height="40" rx="7" fill="#e6e4ea" ${S}/>
  <rect x="3" y="24" width="60" height="56" rx="10" fill="#e6e4ea" ${S}/>
  <rect x="11" y="33" width="44" height="34" rx="6" fill="${INK}"/>
  <path d="M21 50 L29 58 L45 41" fill="none" stroke="#52d5ae" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export function soilStation({ locked = false, waitProgress = 0, ready = false, running = false, remaining = 0 }) {
  const machine = (art, tag) => `<span class="sl-machine">${art}<span class="sl-tag">${tag}</span></span>`;
  const arrow = '<i class="sl-arrow" aria-hidden="true"></i>';
  return `<button class="gm-station soil-station${locked ? ' is-locked' : ''}" data-action="station" data-station="soil" aria-label="Soil lab${locked ? ', locked' : ''}">
    ${label("🧪", "Soil lab")}
    ${locked ? '<span class="st-lock" aria-hidden="true">🔒</span>' : ""}
    ${ready ? '<span class="st-ready">✔ SOIL READY · TAP TO TEST</span>' : running ? `<span class="st-timer" data-soil-badge>⏳ ${remaining} min</span>` : ""}
    <span class="sl-row">${machine(hopper, "1. Scoop")}${arrow}${machine(tray, "2. Microbes")}${arrow}${machine(oven(waitProgress), "3. Wait")}${arrow}${machine(tester, "4. Test")}</span>
  </button>`;
}

/* ---------- 3 · Compost sort ---------- */
const bin = (fill, text) => `<svg class="cs-bin" viewBox="0 0 60 84" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
  <path d="M7 14 H53 L49 78 Q49 81 46 81 H14 Q11 81 11 78 Z" fill="${fill}" ${S}/>
  <rect x="2" y="3" width="56" height="12" rx="5" fill="#f4f2f6" ${S}/>
  <text x="30" y="52" text-anchor="middle" font-size="8" font-weight="900" fill="#fff" font-family="${FONT}">${text}</text>
</svg>`;

const crate = `<svg class="cs-crate" viewBox="0 0 72 62" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
  <path d="M13 26 Q9 8 28 9 Q31 26 13 26 Z" fill="#7dd06a" ${S} stroke-width="2.5"/>
  <rect x="44" y="12" width="13" height="14" rx="3" fill="#f4f2f6" ${S} stroke-width="2.5"/>
  <rect x="4" y="24" width="64" height="34" rx="7" fill="#e0c293" ${S}/>
  <rect x="4" y="24" width="64" height="10" rx="5" fill="#c9a56f" ${S}/>
  <ellipse cx="38" cy="46" rx="10" ry="6.5" fill="#8c5a3c" ${S} stroke-width="2.5"/>
</svg>`;

export function compostStation() {
  return `<button class="gm-station compost-station" data-action="station" data-station="compost" aria-label="Compost sort">
    <span class="cs-row">${bin("#5fb35a", "COMPOST")}${bin("#3a93d6", "REUSE")}${bin("#8a8a96", "DISCARD")}${crate}</span>
    ${label("♻️", "Compost sort")}
  </button>`;
}

/* ---------- 4 · Electricity box (fix wiring) ---------- */
const WIRE_HEX = { red: "#ff5555", blue: "#3ec6f0", yellow: "#ffd84a", purple: "#bc86ff" };
const LEFT_ORDER = ["red", "blue", "yellow", "purple"];
const RIGHT_ORDER = ["purple", "yellow", "blue", "red"];

export function wiringStation({ outage = false }) {
  const row = (i) => 30 + i * 10;
  const lamp = outage ? "#ff5e5b" : "#52d5ae";
  const hole = (x, c, i) => `<circle cx="${x}" cy="${row(i)}" r="3.6" fill="${WIRE_HEX[c]}" stroke="${INK}" stroke-width="1.6"/>`;
  const holes = LEFT_ORDER.map((c, i) => hole(24, c, i)).join("") + RIGHT_ORDER.map((c, i) => hole(76, c, i)).join("");
  let wires;
  if (outage) {
    // broken wires: short stubs on each side and a spark in the gap
    wires = LEFT_ORDER.map((c, i) => `<path d="M27 ${row(i)} H40" stroke="${INK}" stroke-width="4.2" stroke-linecap="round"/><path d="M27 ${row(i)} H40" stroke="${WIRE_HEX[c]}" stroke-width="2.4" stroke-linecap="round"/>`).join("")
      + RIGHT_ORDER.map((c, i) => `<path d="M73 ${row(i)} H60" stroke="${INK}" stroke-width="4.2" stroke-linecap="round"/><path d="M73 ${row(i)} H60" stroke="${WIRE_HEX[c]}" stroke-width="2.4" stroke-linecap="round"/>`).join("")
      + `<path class="ws-spark" d="M52 24 L45 42 H51 L47 58 L58 38 H52 Z" fill="#ffd84a" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
  } else {
    wires = LEFT_ORDER.map((c, i) => {
      const j = RIGHT_ORDER.indexOf(c);
      const d = `M27 ${row(i)} C50 ${row(i)} 50 ${row(j)} 73 ${row(j)}`;
      return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="4.2" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${WIRE_HEX[c]}" stroke-width="2.4" stroke-linecap="round"/>`;
    }).join("");
  }
  const art = `<svg class="ws-art" viewBox="0 0 100 84" aria-hidden="true">
    <rect x="6" y="4" width="88" height="74" rx="10" fill="#d7d5df" ${S}/>
    <rect x="14" y="9" width="72" height="9" rx="4.5" fill="${INK}"/>
    <path d="M20 10.5 L17 14.5 H19.5 L18.5 17 L22 13 H19.6 Z" fill="#ffd84a"/>
    <circle class="ws-lamp ${outage ? "out" : ""}" cx="78" cy="13.5" r="3.4" fill="${lamp}" stroke="#fff" stroke-width="1"/>
    <rect x="14" y="22" width="72" height="46" rx="6" fill="#283640" ${S} stroke-width="2.5"/>
    ${wires}${holes}
    <rect x="14" y="71" width="72" height="4" rx="2" fill="#ffd84a" stroke="${INK}" stroke-width="1.2"/>
  </svg>`;
  return `<button class="gm-station wiring-station ${outage ? "urgent" : ""}" data-action="station" data-station="wiring" aria-label="Fix wiring${outage ? ", power is out" : ""}">
    ${art}
    ${label(outage ? "!" : "⚡", "Fix wiring", outage)}
    ${outage ? '<span class="st-warn">POWER OUT</span>' : ""}
  </button>`;
}

/* ---------- 5 · Shield alignment (glass shield) ---------- */
export function shieldStation({ urgent = false }) {
  const art = `<svg class="sh-art" viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <linearGradient id="glassG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9fbff" stop-opacity=".95"/><stop offset=".55" stop-color="#8fd8f5" stop-opacity=".7"/><stop offset="1" stop-color="#4aa3d8" stop-opacity=".75"/></linearGradient>
    </defs>
    <path d="M50 5 L90 19 V50 C90 74 72 90 50 97 C28 90 10 74 10 50 V19 Z" fill="url(#glassG)" ${S}/>
    <path d="M50 14 L81 25 V50 C81 68 67 81 50 87 C33 81 19 68 19 50 V25 Z" fill="none" stroke="#ffffff" stroke-opacity=".75" stroke-width="2.5"/>
    <path d="M24 30 L44 22 L26 62 Z" fill="#ffffff" fill-opacity=".55"/>
    <path d="M52 70 L72 40 L76 44 L58 76 Z" fill="#ffffff" fill-opacity=".35"/>
  </svg>`;
  return `<button class="gm-station shield-station ${urgent ? "urgent" : ""}" data-action="station" data-station="shield" aria-label="Shield alignment${urgent ? ", radiation alert" : ""}">
    ${art}
    ${label(urgent ? "!" : "🛡", "Shield alignment", urgent)}
    ${urgent ? '<span class="st-warn">RADIATION!</span>' : ""}
  </button>`;
}