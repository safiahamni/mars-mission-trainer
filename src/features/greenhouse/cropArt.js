// Sol-by-sol crop artwork for the greenhouse beds.
// Each Sol of growth is a new picture: seeds -> sprouts -> leaves -> ready to harvest.
//
// The picture is drawn at a fixed pixel size (see crops.css: 64px tall) so a plant never
// grows bigger than the walking character (46px). Full-grown heights at that size:
//   leafy greens ~23px, potato ~31px, millet ~41px (the tallest crop).

const GROUND = 62; // y of the soil / water line inside the 300x84 viewBox
const LINE = "#355d37";
const SOIL_LINE = "#513d31";
const fx = (n) => Number(n.toFixed(1));

export const STAGE_NAMES = {
  greens: ["Seeds planted", "Young leaves", "Ready to harvest"],
  millet: ["Seeds planted", "Sprouting", "Growing tall", "Ready to harvest"],
  potato: ["Seed potato", "Sprouting", "Leafy plant", "Tubers forming", "Ready to harvest"],
};

/** Growth stage 0..n (n = number of growth stages for the crop). growth/required are in seconds. */
export function stageOf(cropId, growth, required) {
  const n = (STAGE_NAMES[cropId]?.length || 3) - 1;
  if (growth >= required) return n;
  return Math.max(0, Math.min(n - 1, Math.floor((growth / required) * n)));
}

export const stageName = (cropId, growth, required) =>
  STAGE_NAMES[cropId]?.[stageOf(cropId, growth, required)] ?? "Growing";

/* ---------- leafy greens (hydroponic lettuce) ---------- */
function lettuce(x, t, i) {
  const k = 0.12 + t * 0.88;
  const n = t === 0 ? 2 : 3 + Math.round(t * 6);
  const ry = 3 + k * 13;
  const rx = 2 + k * 6.5;
  const cy = GROUND - ry * 0.9;
  const leaves = Array.from({ length: n }, (_, j) => ({
    a: -66 + (132 * j) / (n - 1),
    fill: j % 2 ? "#9bd86a" : "#78c85b",
  })).sort((p, q) => Math.abs(q.a) - Math.abs(p.a));
  const art = leaves
    .map((l) => `<ellipse cx="${x}" cy="${fx(cy)}" rx="${fx(rx)}" ry="${fx(ry)}" fill="${l.fill}" stroke="${LINE}" stroke-width="1.2" transform="rotate(${fx(l.a)} ${x} ${GROUND})"/>`)
    .join("");
  const heart = t > 0
    ? `<ellipse cx="${x}" cy="${fx(GROUND - ry * 0.7)}" rx="${fx(rx * 0.6)}" ry="${fx(ry * 0.55)}" fill="#c4f08a" stroke="${LINE}" stroke-width="1"/>`
    : "";
  return `<g class="cr-plant" style="--d:${fx(i * 0.35)}s">${art}${heart}</g>`;
}

function greens(t) {
  const xs = [50, 100, 150, 200, 250];
  const seeds = t === 0
    ? xs.map((x) => `<ellipse cx="${x - 8}" cy="${GROUND + 3}" rx="2.2" ry="1.3" fill="#d6b27a" stroke="${SOIL_LINE}" stroke-width=".8"/><ellipse cx="${x + 8}" cy="${GROUND + 3}" rx="2.2" ry="1.3" fill="#d6b27a" stroke="${SOIL_LINE}" stroke-width=".8"/>`).join("")
    : "";
  const roots = xs.map((x) => [-9, -3, 3, 9].map((dx, j) => {
    const d = 6 + t * (10 + (j % 2) * 4);
    return `<path d="M${x} ${GROUND} q ${dx / 2} ${fx(d / 2)} ${dx} ${fx(d)}" fill="none" stroke="#f4f1e7" stroke-width="1.4" stroke-linecap="round"/>`;
  }).join("")).join("");
  return {
    band: '<rect x="6" y="62" width="288" height="20" rx="4" fill="#3f9fb5" opacity=".45"/>',
    under: roots + seeds,
    over: xs.map((x, i) => lettuce(x, t, i)).join(""),
  };
}

/* ---------- millet ---------- */
function blade(x, y, side, len) {
  const d = `M${x} ${fx(y)} Q${x + side * 9} ${fx(y - 9)} ${x + side * len} ${fx(y - 5)}`;
  return `<path d="${d}" fill="none" stroke="${LINE}" stroke-width="4.4" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#78c85b" stroke-width="2.4" stroke-linecap="round"/>`;
}

function milletStalk(x, t, i) {
  const h = 7 + t * (32 + (i % 2) * 4);
  const top = GROUND - h;
  const ripe = t === 1;
  const lean = ripe ? 4 : 0;
  const stalk = `M${x} ${GROUND} Q${x - 2} ${fx(GROUND - h * 0.5)} ${x + lean} ${fx(top)}`;
  const blades = t > 0
    ? blade(x, GROUND - h * 0.35, -1, 15) + blade(x, GROUND - h * 0.35 - 1, 1, 15) + (t >= 0.66 ? blade(x, GROUND - h * 0.62, -1, 11) + blade(x, GROUND - h * 0.62, 1, 11) : "")
    : "";
  let head = "";
  if (t >= 0.66) {
    const hx = x + lean;
    const fill = ripe ? "#e8c545" : "#b7d46a";
    const grain = ripe ? "#f8e28a" : "#d9ec96";
    const dots = [-8, -4, 0, 4].map((dy, r) => `<circle cx="${fx(hx + (r % 2 ? 1.8 : -1.8))}" cy="${fx(top - 2 + dy)}" r="1.4" fill="${grain}"/>`).join("");
    head = `<g transform="rotate(${ripe ? 14 : 0} ${hx} ${fx(top + 8)})"><ellipse cx="${hx}" cy="${fx(top - 2)}" rx="4.2" ry="9.5" fill="${fill}" stroke="${LINE}" stroke-width="1.4"/>${dots}</g>`;
  }
  return `<g class="cr-plant" style="--d:${fx(i * 0.3)}s"><path d="${stalk}" fill="none" stroke="${LINE}" stroke-width="4.4" stroke-linecap="round"/><path d="${stalk}" fill="none" stroke="${ripe ? "#cdbf62" : "#8fcf6a"}" stroke-width="2.4" stroke-linecap="round"/>${blades}${head}</g>`;
}

function millet(t) {
  const xs = [50, 90, 130, 170, 210, 250];
  const roots = xs.map((x) => [-8, 0, 8].map((dx, j) => {
    const d = 5 + t * (9 + (j % 2) * 4);
    return `<path d="M${x} ${GROUND} q ${dx / 2} ${fx(d / 2)} ${dx} ${fx(d)}" fill="none" stroke="#d8b98d" stroke-width="1.3" stroke-linecap="round"/>`;
  }).join("")).join("");
  const seeds = t === 0
    ? xs.map((x) => `<ellipse cx="${x}" cy="${GROUND + 4}" rx="2" ry="1.3" fill="#e0c07a" stroke="${SOIL_LINE}" stroke-width=".8"/>`).join("")
    : "";
  return {
    band: '<rect x="6" y="62" width="288" height="20" rx="4" fill="#4a2f22" opacity=".4"/>',
    under: roots + seeds,
    over: xs.map((x, i) => milletStalk(x, t, i)).join(""),
  };
}

/* ---------- potato ---------- */
const leafy = (cx, cy, rot, s, fill) =>
  `<ellipse cx="${fx(cx)}" cy="${fx(cy)}" rx="${fx(5.2 * s)}" ry="${fx(2.8 * s)}" fill="${fill}" stroke="${LINE}" stroke-width="1" transform="rotate(${rot} ${fx(cx)} ${fx(cy)})"/>`;

function potatoPlant(x, t, i) {
  if (t === 0) return "";
  const h = 5 + t * 28;
  const top = GROUND - h;
  const col = t === 1 ? "#a8c95a" : "#6fc15a"; // potato plants yellow as the tubers finish
  const s = 0.6 + 0.4 * t;
  const m = Math.max(1, Math.ceil(t * 4));
  let leaves = "";
  for (let c = 0; c < m; c += 1) {
    const frac = m === 1 ? 1 : (c + 1) / m;
    const y = GROUND - h * frac;
    const side = c % 2 ? 1 : -1;
    leaves += leafy(x + side * 8 * s, y, side * 10, s, col) + leafy(x + side * 5 * s, y - 4 * s, side * -35, s, col) + leafy(x + side * 5 * s, y + 4 * s, side * 50, s, col);
  }
  const stem = `M${x} ${GROUND} Q${x + 1} ${fx(GROUND - h / 2)} ${x} ${fx(top)}`;
  return `<g class="cr-plant" style="--d:${fx(i * 0.4)}s"><path d="${stem}" fill="none" stroke="${LINE}" stroke-width="4.2" stroke-linecap="round"/><path d="${stem}" fill="none" stroke="#8fcf6a" stroke-width="2.2" stroke-linecap="round"/>${leaves}<ellipse cx="${x}" cy="${fx(top - 3)}" rx="3" ry="5" fill="${col}" stroke="${LINE}" stroke-width="1"/></g>`;
}

function potatoUnder(x, t) {
  if (t === 0) {
    return `<ellipse cx="${x}" cy="${GROUND + 8}" rx="7.5" ry="5.5" fill="#c9a06a" stroke="${SOIL_LINE}" stroke-width="1.5"/><circle cx="${x - 2}" cy="${GROUND + 7}" r="1" fill="#8a6a45"/><circle cx="${x + 3}" cy="${GROUND + 10}" r="1" fill="#8a6a45"/>`;
  }
  const count = t >= 1 ? 4 : t >= 0.75 ? 3 : t >= 0.5 ? 2 : 0;
  const sc = t >= 1 ? 1 : t >= 0.75 ? 0.65 : 0.3;
  const slots = [[-12, 11], [12, 13], [1, 17], [-3, 8]].slice(0, count);
  const lines = slots.map(([dx, dy]) => `<path d="M${x} ${GROUND + 2} L${x + dx} ${GROUND + dy}" stroke="#d9c9a0" stroke-width="1.2" fill="none"/>`).join("");
  const tubers = slots.map(([dx, dy]) => `<ellipse cx="${x + dx}" cy="${GROUND + dy}" rx="${fx(7 * sc)}" ry="${fx(5 * sc)}" fill="#d1a86d" stroke="${SOIL_LINE}" stroke-width="1.5"/>${sc >= 0.65 ? `<circle cx="${x + dx - 2}" cy="${GROUND + dy - 1}" r=".9" fill="#8a6a45"/>` : ""}`).join("");
  const roots = [-6, 6].map((dx) => `<path d="M${x} ${GROUND} q ${dx / 2} 5 ${dx} 9" fill="none" stroke="#d8b98d" stroke-width="1.2" stroke-linecap="round"/>`).join("");
  return roots + lines + tubers;
}

function potato(t) {
  const xs = [75, 150, 225];
  return {
    band: '<rect x="6" y="62" width="288" height="20" rx="4" fill="#4a2f22" opacity=".4"/>',
    under: xs.map((x) => potatoUnder(x, t)).join(""),
    over: xs.map((x, i) => potatoPlant(x, t, i)).join(""),
  };
}

/* ---------- ready-to-harvest sparkles ---------- */
const spark = (x, y, d) => `<path class="cr-spark" style="--d:${d}s" d="M${x} ${y - 4} l1.2 2.8 l2.8 1.2 l-2.8 1.2 l-1.2 2.8 l-1.2 -2.8 l-2.8 -1.2 l2.8 -1.2 Z" fill="#fff3a0" stroke="#d9a82f" stroke-width=".8"/>`;
const SPARKLES = spark(30, 22, 0) + spark(150, 8, 0.4) + spark(270, 22, 0.8);

const BUILDERS = { greens, millet, potato };

/** Returns the bed picture for the crop at its current Sol of growth. */
export function cropArt(cropId, growth, required, name = "Crop") {
  const n = (STAGE_NAMES[cropId]?.length || 3) - 1;
  const stage = stageOf(cropId, growth, required);
  const t = stage / n;
  const ripe = stage >= n;
  const parts = BUILDERS[cropId]?.(t);
  if (!parts) return "";
  const label = `${name}: ${stageName(cropId, growth, required)}`;
  return `<svg class="gm-crop-art" viewBox="0 0 300 84" preserveAspectRatio="xMidYMax meet" role="img" aria-label="${label}">${parts.band}${parts.under}<path class="gm-soil-line" d="M6 62h288"/>${parts.over}${ripe ? SPARKLES : ""}</svg>`;
}