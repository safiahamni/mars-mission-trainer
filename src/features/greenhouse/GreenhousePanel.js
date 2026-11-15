import { CROP_CATALOG } from "./food.js";
import { ghIcon, watchIcons } from "./ghIcons.js";
import { PATH, drawPath, moveOnPath } from "./path.js";
// The player avatar is the team's shared one (src/map/avatar.js puts createAvatar on window).
const createAvatar = (container) => {
  if (typeof window.createAvatar !== "function") throw new Error("Shared avatar not loaded: import './map/avatar.js' in main.js before the greenhouse.");
  return window.createAvatar(container);
};
import { climateStation, soilStation, compostStation, wiringStation, shieldStation } from "./stationArt.js";
import { cropArt, stageOf } from "./cropArt.js";
import "./stations.css";
import "./crops.css";

const BANDS = { greens: [16, 24, 35, 65], potato: [14, 22, 30, 60], millet: [20, 30, 40, 80] };
const COMPOST_POOL = [
  { name: "Leaf trimmings", icon: "🍃", bin: "compost" },
  { name: "Wilted lettuce", icon: "🥬", bin: "compost" },
  { name: "Potato peels", icon: "🥔", bin: "compost" },
  { name: "Root clippings", icon: "🌿", bin: "compost" },
  { name: "Old plant stems", icon: "🌱", bin: "compost" },
  { name: "Spent millet husks", icon: "🌾", bin: "compost" },
  { name: "Clean packaging", icon: "📦", bin: "reuse" },
  { name: "Water container", icon: "🧴", bin: "reuse" },
  { name: "Metal tool", icon: "🔧", bin: "reuse" },
  { name: "Glass jar", icon: "🫙", bin: "reuse" },
  { name: "Grow-light cover", icon: "💡", bin: "reuse" },
  { name: "Sealed seed tray", icon: "🧰", bin: "reuse" },
  { name: "Contaminated plant matter", icon: "☣️", bin: "discard" },
  { name: "Moldy leaves", icon: "🍄", bin: "discard" },
  { name: "Broken glove", icon: "🧤", bin: "discard" },
  { name: "Pest-infested stem", icon: "🐛", bin: "discard" },
  { name: "Cracked plastic", icon: "🥤", bin: "discard" },
];
// 5 random items per round, always a mix of all three bins
function pickCompostItems(n = 5) {
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const by = (b) => shuffle(COMPOST_POOL.filter((x) => x.bin === b));
  const picked = [by("compost")[0], by("reuse")[0], by("discard")[0]];
  const rest = shuffle(COMPOST_POOL.filter((x) => !picked.includes(x)));
  return shuffle([...picked, ...rest.slice(0, n - 3)]);
}
const WIRE_COLORS = ["red", "blue", "yellow", "purple"];
const WIRE_SOCKETS = ["purple", "yellow", "blue", "red"];

// The soil lab keeps running while the player is away: its state is saved here when the panel closes
// and restored when the greenhouse is opened again.
let soilSaved = null;
let soilAwayTimer = null;

export function mountGreenhousePanel(root, controller, { onExit, dressAvatar } = {}) {
  if (!root || !controller) throw new TypeError("A root element and greenhouse controller are required.");
  const stopIcons = watchIcons(root); // emoji -> Lucide icons (see ghIcons.js)
  let snapshot = controller.getSnapshot();
  let modal = "";
  let note = "";
  let toastNote = "";
  let toastActive = false;
  let toastFresh = false;
  let toastForce = false;
  let toastErr = false;
  let toastErrForce = false;
  let toastTimer = null;
  let player = { ...PATH.start };
  let avatar = null;
  let movementFrame = 0;
  let previousFrameTime = 0;
  const movementKeys = new Set();
  let selectedClimateCrop = "greens";
  let climateTemperature = snapshot.climate.temperature;
  let climateLight = snapshot.climate.light;
  let climateHold = 0;
  let climateHoldTimer = null;
  let soilStep = 0;
  let soilScoops = 0;
  let soilProgress = 0;
  let soilWaitTimer = null;
  let soilActiveTool = "";
  let soilSweepFromPile = false;
  const SOIL_SECONDS = 30; // 30 game minutes (the game clock runs 1 real second = 1 game minute)
  let soilDoses = 0;
  let soilRemaining = SOIL_SECONDS;
  let soilTests = {};
  let soilResult = null;
  const resetSoil = () => { clearInterval(soilWaitTimer); soilWaitTimer = null; soilStep = 0; soilScoops = 0; soilDoses = 0; soilProgress = 0; soilRemaining = SOIL_SECONDS; soilTests = {}; soilResult = null; };
  let compostStarted = false;
  let compostIndex = 0;
  let compostWin = false;
  let outageFxDone = false;
  let outageStart = 0;
  let compostDoneSol = 0;
  let wiringFixedSol = 0;
  let shieldDoneSol = 0;
  let compostItems = pickCompostItems();
  let compostCorrect = 0;
  let taskTimer = 0;
  let taskTimerId = null;
  let wirePicked = "";
  let wireConnected = new Set();
  let wireSockets = [...WIRE_SOCKETS];
  let wireMiss = false;
  let taskTotal = 0;
  let panels = Object.fromEntries(Object.keys(snapshot.greenhouse.plots).map((id) => [id, { rotation: 0, position: 70 }]));
  let shieldStage = 0;
  const SH_DIRS = [{ k: "north", arrow: "⬆" }, { k: "east", arrow: "➡" }, { k: "south", arrow: "⬇" }, { k: "west", arrow: "⬅" }];
  let shieldDir = 3;
  let shieldFacing = {};
  let shieldMsg = "";
  let shieldIdentified = new Set();
  let plantBed = "";
  const growFx = new Set(); // beds that just planted or grew, used for the pop animation

  const stationMap = { climate: [14, 14], soil: [78, 14], compost: [15, 80], wiring: [86, 80], shield: [9, 48] };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, v));
  const doAction = (action) => controller.dispatch(action);
  const cropFor = (id) => CROP_CATALOG[snapshot.greenhouse.plots[id]?.cropId];
  const activeCrop = () => Object.values(snapshot.greenhouse.plots).find((p) => p.cropId)?.cropId || "greens";
  const timersClear = () => { clearInterval(taskTimerId); taskTimerId = null; clearInterval(climateHoldTimer); climateHoldTimer = null; };
  const climateInBand = () => { const [t0,t1,l0,l1]=BANDS[selectedClimateCrop]; return !snapshot.powerOutage&&climateTemperature>=t0&&climateTemperature<=t1&&climateLight>=l0&&climateLight<=l1; };

  function vital(name, icon, value, sub, kind, mark) {
    return `<div class="gm-vital ${kind}"><div class="gm-vital-top"><span>${icon} ${name}</span><b>${value}<small>/100</small></b></div><div class="gm-vital-track"><i style="width:${clamp(value)}%"></i>${(mark||[]).map(m=>`<u style="left:${m}%"></u>`).join("")}</div><em>${sub}</em></div>`;
  }
  function resource(name, icon, value, sub, width) {
    return `<div class="gm-stat"><div><span>${icon} ${name}</span><b>${value}</b></div><small>${sub}</small><i><em style="width:${clamp(width)}%"></em></i></div>`;
  }
  const bedTime = (plot, crop) => plot.growthSols >= crop.growthSols
    ? "Ready! Tap to harvest"
    : `Ready Sol ${snapshot.sol + crop.growthSols - plot.growthSols}`;
  function bed(id, title, cropId) {
    const plot = snapshot.greenhouse.plots[id];
    if ((cropId === "potato" || cropId === "millet") && snapshot.soilPerchlorate >= 30) {
      return `<button class="gm-bed locked" data-action="locked-bed"><span class="gm-bed-icon">🔒</span><b>Locked bed</b><small>Tap to learn why</small></button>`;
    }
    if (!plot?.cropId) return `<button class="gm-bed empty ${cropId==="greens"?"hydroponic":""}" data-action="plant" data-plot="${id}" data-crop="${cropId}"><span class="gm-bed-icon">＋</span><b>${title}</b><small>${cropId==="greens"?"Hydroponic grow channel · tap to plant":"Treated soil · tap to plant"}</small></button>`;
    const crop = cropFor(id);
    const ready = plot.growthSols >= crop.growthSols;
    const pctDone = Math.min(100, plot.growthSols / crop.growthSols * 100);
    const dots = `<i class="grown" data-bed-bar="${id}" style="flex:none;width:${pctDone}%"></i><i style="flex:1"></i>`;
    const caption = bedTime(plot, crop);
    return `<button class="gm-bed planted ${crop.id==="greens"?"hydroponic":""} ${ready ? "ripe" : ""} ${growFx.has(id) ? "grew" : ""}" data-action="${ready ? "harvest" : "inspect-bed"}" data-plot="${id}">${cropArt(crop.id, plot.growthSols, crop.growthSols, crop.name)}<b>${crop.name}</b><span class="gm-growth">${dots}</span><small data-bed-time="${id}">${caption}</small></button>`;
  }
  function modalShell(title, sub, inner, width) {
    return `<div class="gm-scrim" data-action="close"><section class="gm-modal" ${width?`style="width:min(${width}px,calc(100vw - 28px))"`:""} role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="gm-modal-cap"><span>MISSION STATION</span><button class="gm-x" data-action="close" aria-label="Close">×</button></div><div class="gm-modal-title"><span class="gm-modal-icon">${({climate:"🌡️",soil:"🧪",compost:"♻️",wiring:"⚡",shield:"🛡️",plant:"🌱"})[modal] || "🪴"}</span><div><h2>${title}</h2><p>${sub}</p></div></div>${inner}</section></div>`;
  }
  // ---------- Climate control: arcade catcher ----------
  // Move the basket to catch light / heat orbs and bring both gauges into the crop's green band, then keep them there.
  const CG_TIME = 45, CG_HOLD = 4;
  const CG_TYPES = {
    sun: { icon: "☀️", axis: "light", d: 9 }, shade: { icon: "🌑", axis: "light", d: -9 },
    heat: { icon: "🔥", axis: "temp", d: 1 }, cold: { icon: "❄️", axis: "temp", d: -1 },
    dust: { icon: "🌪️", axis: "both", d: 0 },
  };
  let cg = { state: "play", x: 0.5, items: [], temp: 20, light: 45, hold: 0, timeLeft: CG_TIME, spawn: 0, caught: 0, last: 0, arena: null, msg: "", keys: new Set() };
  let cgRaf = 0;
  // One shared target band that suits every crop currently planted
  const cgBand = () => {
    const ids = [...new Set(Object.values(snapshot.greenhouse.plots).map((p) => p.cropId).filter(Boolean))];
    const list = (ids.length ? ids : ["greens"]).map((id) => BANDS[id]);
    const t0 = Math.max(...list.map((b) => b[0])), t1 = Math.min(...list.map((b) => b[1]));
    const l0 = Math.max(...list.map((b) => b[2])), l1 = Math.min(...list.map((b) => b[3]));
    return [t0, Math.max(t0, t1), l0, Math.max(l0, l1)];
  };
  const cgInBand = () => { const [t0, t1, l0, l1] = cgBand(); return cg.temp >= t0 && cg.temp <= t1 && cg.light >= l0 && cg.light <= l1; };
  function startClimateGame() {
    cancelAnimationFrame(cgRaf); cgRaf = 0;
    cg.items.forEach((i) => i.node?.remove());
    cg = { ...cg, state: snapshot.powerOutage ? "blocked" : "intro", items: [], hold: 0, timeLeft: CG_TIME, arena: null, msg: "" };
    render();
  }
  function beginClimatePlay() {
    cancelAnimationFrame(cgRaf); cgRaf = 0;
    cg.items.forEach((i) => i.node?.remove());
    const [t0, t1, l0, l1] = cgBand();
    cg = { ...cg, state: "play", x: 0.5, items: [], temp: clamp(Math.random() < 0.5 ? t1 + 6 : t0 - 6, 10, 34), light: clamp(Math.random() < 0.5 ? l1 + 22 : l0 - 22, 0, 100), hold: 0, timeLeft: CG_TIME, spawn: 1, caught: 0, last: 0, arena: null, msg: "Catch the right orbs to bring both gauges into the green band, then hold them there." };
    render();
    cgRaf = requestAnimationFrame(cgFrame);
  }
  function cgSpawn(arena) {
    const [t0, t1, l0, l1] = cgBand();
    const roll = Math.random();
    let type;
    if (roll < 0.14) type = "dust";
    else if (roll < 0.57) { const want = cg.temp < (t0 + t1) / 2 ? "heat" : "cold"; type = Math.random() < 0.7 ? want : (want === "heat" ? "cold" : "heat"); }
    else { const want = cg.light < (l0 + l1) / 2 ? "sun" : "shade"; type = Math.random() < 0.7 ? want : (want === "sun" ? "shade" : "sun"); }
    const node = document.createElement("div");
    node.className = `cg-item ${type}`; node.textContent = CG_TYPES[type].icon;
    arena.appendChild(node);
    cg.items.push({ type, x: 0.08 + Math.random() * 0.84, y: -40, vy: 80 + Math.random() * 50, node });
  }
  function cgCatch(it) {
    const t = CG_TYPES[it.type];
    if (t.axis === "light") cg.light = clamp(cg.light + t.d, 0, 100);
    else if (t.axis === "temp") cg.temp = clamp(cg.temp + t.d, 10, 34);
    else { cg.light = clamp(cg.light - 14, 0, 100); cg.temp = clamp(cg.temp + (Math.random() < 0.5 ? 2.5 : -2.5), 10, 34); cg.msg = "Dust storm! The gauges got knocked around."; }
    cg.caught++;
    it.node.classList.add("pop"); it.dead = true;
    setTimeout(() => it.node.remove(), 220);
  }
  function cgFrame(now) {
    const arena = root.querySelector(".cg-field");
    if (modal !== "climate" || cg.state !== "play" || !arena) { cgRaf = 0; return; }
    if (!cg.last) cg.last = now;
    const dt = Math.min(0.05, (now - cg.last) / 1000); cg.last = now;
    if (arena !== cg.arena) { cg.arena = arena; cg.items.forEach((i) => arena.appendChild(i.node)); }
    const W = arena.clientWidth, H = arena.clientHeight;
    const dir = (cg.keys.has("arrowright") || cg.keys.has("d") ? 1 : 0) - (cg.keys.has("arrowleft") || cg.keys.has("a") ? 1 : 0);
    if (dir) cg.x = clamp(cg.x + dir * dt * 0.9, 0.08, 0.92);
    cg.spawn -= dt;
    if (cg.spawn <= 0) { cgSpawn(arena); cg.spawn = 0.7 + Math.random() * 0.4; }
    const px = cg.x * W, py = H - 52;
    for (const it of cg.items) {
      if (it.dead) continue;
      it.y += it.vy * dt;
      it.node.style.transform = `translate(${it.x * W - 18}px,${it.y}px)`;
      if (it.y >= py - 16 && it.y <= py + 18 && Math.abs(it.x * W - px) < 54) cgCatch(it);
      else if (it.y > H) { it.dead = true; it.node.remove(); }
    }
    cg.items = cg.items.filter((i) => !i.dead);
    cg.temp = clamp(cg.temp + (Math.random() - 0.5) * dt * 0.8, 10, 34);
    cg.light = clamp(cg.light + (Math.random() - 0.5) * dt * 6, 0, 100);
    cg.timeLeft -= dt;
    cg.hold = cgInBand() ? cg.hold + dt : Math.max(0, cg.hold - dt * 2);
    const q = (sel) => root.querySelector(sel);
    const paddle = q(".cg-paddle"); if (paddle) paddle.style.left = `${cg.x * 100}%`;
    const [t0, t1, l0, l1] = cgBand();
    const set = (id, val, text, ok) => { const m = q(`[data-cg-mark="${id}"]`); if (m) { m.style.left = `${val}%`; m.classList.toggle("ok", ok); } const v = q(`[data-cg-val="${id}"]`); if (v) v.textContent = text; };
    set("temp", (cg.temp - 10) / 24 * 100, `${Math.round(cg.temp)}°C`, cg.temp >= t0 && cg.temp <= t1);
    set("light", cg.light, `${Math.round(cg.light)}%`, cg.light >= l0 && cg.light <= l1);
    const tf = q("[data-cg-fill]"); if (tf) tf.style.width = `${Math.max(0, cg.timeLeft) / CG_TIME * 100}%`;
    const tt = q("[data-cg-time]"); if (tt) tt.textContent = Math.max(0, Math.ceil(cg.timeLeft));
    const hf = q("[data-cg-hold]"); if (hf) hf.style.width = `${Math.min(1, cg.hold / CG_HOLD) * 100}%`;
    const hl = q("[data-cg-holdlabel]"); if (hl) hl.textContent = cgInBand() ? `HOLD STEADY · ${Math.max(0, CG_HOLD - cg.hold).toFixed(1)}s` : "BOTH GAUGES MUST BE IN THE GREEN";
    if (cg.hold >= CG_HOLD) { cgFinish(true); return; }
    if (cg.timeLeft <= 0) { cgFinish(false); return; }
    cgRaf = requestAnimationFrame(cgFrame);
  }
  function cgFinish(win) {
    cgRaf = 0; cg.state = win ? "win" : "lose";
    cg.items.forEach((i) => i.node?.remove()); cg.items = [];
    const temperature = Math.round(cg.temp), light = Math.round(cg.light);
    climateTemperature = temperature; climateLight = light;
    doAction({ type: "set-climate", climate: { temperature, light } });
    const res = doAction({ type: "climate-test", cropId: selectedClimateCrop });
    note = res.message; cg.msg = res.message;
    render();
  }
  function onClimatePointer(event) {
    if (modal !== "climate" || cg.state !== "play") return;
    const field = event.target.closest?.(".cg-field"); if (!field) return;
    const rect = field.getBoundingClientRect();
    cg.x = clamp((event.clientX - rect.left) / rect.width, 0.08, 0.92);
  }
  function onClimateKey(event) {
    if (modal !== "climate") return;
    const k = event.key.toLowerCase();
    if (!["arrowleft", "arrowright", "a", "d"].includes(k)) return;
    event.preventDefault();
    if (event.type === "keydown") cg.keys.add(k); else cg.keys.delete(k);
  }
  function climateModal() {
    const [t0, t1, l0, l1] = cgBand();
    const planted = [...new Set(Object.values(snapshot.greenhouse.plots).map((p) => p.cropId).filter(Boolean))];
    const crops = (planted.length ? planted : ["greens"]).map((id) => CROP_CATALOG[id].icon).join(" ");
    const sub = "Catch the glowing orbs to tune the habitat for all your crops.";
    if (cg.state === "blocked") return modalShell("Temperature & lighting", sub, `<div class="sh-result bad"><div>⚡</div><b>POWER OUTAGE</b><p>The grow lights are off. Repair the wiring first, then come back to tune the climate.</p></div>`);
    if (cg.state === "intro") {
      return modalShell("Temperature & lighting", sub, `<div class="cgd">
        <div class="cgd-demo"><div class="cgd-field"><i class="cgd-item a">☀️</i><i class="cgd-item b">🌪️</i><i class="cgd-item c">🔥</i><span class="cgd-basket">🧺</span><span class="cgd-hand">👆</span></div>
          <div class="cgd-gauge"><div class="cg-bar"><i class="cg-band" style="left:45%;width:25%"></i><em class="cgd-mark"></em></div><small>The gauge moves into the green band as you catch the right orbs</small></div></div>
        <ol class="cgd-steps">
          <li><b>Move the basket</b> by dragging, or with ← → / A D.</li>
          <li><b>☀️ Sunbeam</b> and <b>🔥 Heater</b> turn the light and temperature up. <b>🌑 Shade cloth</b> and <b>❄️ Coolant</b> turn them down.</li>
          <li><b>Dodge 🌪️ dust storms.</b> They knock both gauges around.</li>
          <li>Get both gauges into the <b class="cgd-green">green band</b> and hold for <b>${CG_HOLD} seconds</b> before the ${CG_TIME}s timer ends.</li>
        </ol>
        <div class="cgd-target">TARGET FOR ${crops} · 🌡 ${t0}–${t1}°C · ☀ ${l0}–${l1}% light</div>
        <button class="sl2-btn" data-action="climate-start">▶ START GAME</button></div>`);
    }
    if (cg.state === "win" || cg.state === "lose") {
      const ok = cg.state === "win";
      return modalShell("Temperature & lighting", sub, `<div class="sh-result ${ok ? "ok" : "bad"}"><div>${ok ? "🌡️" : "⚠️"}</div><b>${ok ? "CLIMATE LOCKED IN" : "OUT OF THE GREEN"}</b><p>${esc(cg.msg)}</p><button class="sl2-btn" data-action="${ok ? "shield-close" : "climate-start"}">${ok ? "RETURN TO GREENHOUSE" : "↻ TRY AGAIN"}</button></div>`);
    }
    const gauge = (id, name, a, b, val, text) => `<div class="cg-gauge"><span>${name} <b data-cg-val="${id}">${text}</b></span><div class="cg-bar"><i class="cg-band" style="left:${a}%;width:${b - a}%"></i><em data-cg-mark="${id}" style="left:${val}%"></em></div></div>`;
    return modalShell("Temperature & lighting", sub, `<div class="eb-timer cg-timer"><span>🌡 CLIMATE</span><i><em data-cg-fill style="width:${Math.max(0, cg.timeLeft) / CG_TIME * 100}%"></em></i><b data-cg-time>${Math.max(0, Math.ceil(cg.timeLeft))}</b></div>
      <div class="cg-gauges">${gauge("temp", "🌡 TEMPERATURE", (t0 - 10) / 24 * 100, (t1 - 10) / 24 * 100, (cg.temp - 10) / 24 * 100, `${Math.round(cg.temp)}°C`)}${gauge("light", "☀ GROW LIGHT", l0, l1, cg.light, `${Math.round(cg.light)}%`)}
      <div class="cg-hold"><span data-cg-holdlabel>BOTH GAUGES MUST BE IN THE GREEN</span><i><em data-cg-hold style="width:${Math.min(1, cg.hold / CG_HOLD) * 100}%"></em></i></div></div>
      <div class="cg-legend"><span>☀️ Sunbeam: more light</span><span>🌑 Shade cloth: less light</span><span>🔥 Heater: warmer</span><span>❄️ Coolant: colder</span><span>🌪️ Dust storm: dodge it!</span></div>
      <div class="cg-field" data-cg-field><div class="cg-paddle" style="left:${cg.x * 100}%">🧺</div></div>
      <div class="sh-msg">${esc(cg.msg)} Drag, or use ← → / A D to move the basket.</div>`);
  }
  const fmtTime = (t) => `${t} min`; // game minutes, same clock as the base map
  function soilModal() {
    const names = ["Collect regolith", "Add microbe mix", "Incubate", "Test soil"];
    const steps = names.map((n, i) => `<div class="sl2-step ${i < soilStep ? "complete" : ""} ${i === soilStep ? "current" : ""}"><span>${i < soilStep ? "✓" : i + 1}</span><b>${n}</b></div>`).join("");
    const level = soilStep === 0 ? soilScoops / 3 * 55 : 55;
    const bugs = soilDoses > 0 ? Array.from({ length: soilDoses * 3 }, (_, i) => `<i class="sl2-bug" style="--i:${i}"></i>`).join("") : "";
    const running = !!soilWaitTimer;
    const bubbles = soilStep === 2 && running ? Array.from({ length: 6 }, (_, i) => `<u class="sl2-bubble" style="--i:${i}"></u>`).join("") : "";
    const pour = soilPour; soilPour = false;
    const jar = `<div class="sl2-jar ${soilStep >= 4 ? "done" : ""} ${running ? "working" : ""} ${pour ? "pour" : ""}" data-sl-jar><div class="sl2-soil" style="height:${soilStep >= 4 ? 70 : level}%"></div>${bugs}${bubbles}<span class="sl2-jar-tag">${soilStep >= 4 ? "TREATED SOIL" : "TREATMENT CHAMBER"}</span></div>`;
    const dots = (n) => Array.from({ length: 3 }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("");
    const source = soilStep === 0
      ? `<div class="sl2-source"><div class="sl2-pile" data-sl-drag="scoop" style="--left:${1 - soilScoops / 3 * 0.55}"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><em>🥄</em></div><b>MARS REGOLITH</b><small>Drag the scoop to the chamber</small></div>`
      : soilStep === 1
        ? `<div class="sl2-source"><div class="sl2-bottle" data-sl-drag="microbe" style="--left:${1 - soilDoses / 3 * 0.7}"><span>🧫</span><em></em></div><b>MICROBE MIX</b><small>Drag the bottle to the chamber</small></div>`
        : "";
    let panel = "";
    if (soilStep === 0) panel = `<p class="sl2-hint">Press and hold the scoop on the regolith pile, drag it over the chamber and let go to pour. Do it 3 times.</p><div class="sl2-dots">${dots(soilScoops)}</div><b class="sl2-count">${soilScoops}/3 scoops</b>`;
    else if (soilStep === 1) panel = `<p class="sl2-hint">Drag the microbe bottle over the chamber and let go to add a dose. Three doses; the microbes eat the perchlorate.</p><div class="sl2-dots">${dots(soilDoses)}</div><b class="sl2-count">${soilDoses}/3 doses</b>`;
    else if (soilStep === 2) {
      const started = soilRemaining < SOIL_SECONDS;
      const label = running ? "⏸ Pause" : started ? "▶ Resume" : "▶ Start incubation";
      panel = `<p class="sl2-hint">${running ? "Microbes are working. You can close this window and do other tasks, and the timer keeps running." : started ? "Paused. Press resume when you are ready." : "A full incubation takes 30 minutes of game time. Start it, then do other tasks while you wait."}</p><div class="sl2-timer"><i><em data-sl-fill style="width:${soilProgress}%"></em></i><b data-sl-time>${fmtTime(soilRemaining)}</b></div><button class="sl2-btn ${running ? "alt" : ""}" data-action="sl-toggle">${label}</button>`;
    } else if (soilStep === 3) {
      const tests = [["nutrients", "🧬", "Nutrient level"], ["bio", "🦠", "Bioactivity"], ["water", "💧", "Water retention"]];
      panel = `<p class="sl2-hint">Incubation complete! Run all three tests.</p><div class="sl2-tests">${tests.map(([id, ic, nm]) => soilTests[id] != null ? `<div class="sl2-gauge done"><span>${ic} ${nm}</span><i><em style="width:${soilTests[id]}%"></em></i><b>${soilTests[id]}%</b></div>` : `<button class="sl2-btn small" data-action="sl-test" data-test="${id}">${ic} Test ${nm.toLowerCase()}</button>`).join("")}</div>`;
    } else {
      const r = soilResult || { nutrients: 0, bio: 0, water: 0, before: 0, after: snapshot.soilPerchlorate };
      panel = `<div class="sl2-success"><b>✅ Soil treatment successful!</b><small>${esc(note)}</small></div><div class="sl2-tests">${[["🧬 Nutrient level", r.nutrients], ["🦠 Bioactivity", r.bio], ["💧 Water retention", r.water]].map(([nm, v]) => `<div class="sl2-gauge done"><span>${nm}</span><i><em style="width:${v}%"></em></i><b>${v}%</b></div>`).join("")}</div><div class="sl2-perc">☣ Perchlorate <b>${r.before}</b> → <b>${r.after}</b> / 100</div><button class="sl2-btn" data-action="sl-restart">🔁 Restart and replay</button>`;
    }
    return modalShell("Soil treatment", "Scoop regolith, add microbes, incubate, then test the soil.", `<div class="sl2-steps">${steps}</div><div class="sl2-body ${source ? "with-source" : ""}">${source}${jar}<div class="sl2-panel">${panel}</div></div><div class="sl2-foot"><span>☣ Perchlorate ${snapshot.soilPerchlorate}/100 · below 30 unlocks potato + millet</span>${soilStep < 4 ? '<button data-action="sl-restart" class="sl2-reset">↺ Restart</button>' : ""}</div>`);
  }

  function compostModal() {
    const item = compostItems[compostIndex] || compostItems[0];
    return modalShell("Compost sorting", "Drag each item into the right bin before the 20-second timer runs out.", `<div class="gm-countdown"><span>⏱ TIME LEFT</span><b data-timer-readout>${taskTimer}s</b></div><div class="cm-stage"><div class="cm-dots">${compostItems.map((_,i)=>`<i class="${i<compostIndex?"done":i===compostIndex?"now":""}"></i>`).join("")}</div><div class="gm-item-card cm-item" draggable="true" data-action="drag-item"><span>${item.icon}</span><b>${item.name}</b><small>DRAG TO A BIN<br>or tap a bin</small></div></div><div class="gm-sort-bins cm-bins"><button class="bin-compost" data-action="sort" data-bin="compost" data-drop="compost"><i class="cm-lid"></i><em>🌱</em><b>COMPOST</b><small>Plant scraps</small></button><button class="bin-reuse" data-action="sort" data-bin="reuse" data-drop="reuse"><i class="cm-lid"></i><em>♻️</em><b>REUSE</b><small>Clean materials</small></button><button class="bin-discard" data-action="sort" data-bin="discard" data-drop="discard"><i class="cm-lid"></i><em>🗑️</em><b>DISCARD</b><small>Contaminated</small></button></div><div class="gm-sort-meter">ITEM ${compostIndex+1} / ${compostItems.length} <span>✓ ${compostCorrect} correct</span></div>`);
  }
  function wireModal() {
    const rowY=(i)=>(22+56*i).toFixed(2);
    const paths=WIRE_COLORS.map((c,i)=>{if(!wireConnected.has(c))return"";const j=wireSockets.indexOf(c);return `<path class="eb-wire ${c}" d="M0 ${rowY(i)} C50 ${rowY(i)} 50 ${rowY(j)} 100 ${rowY(j)}"/>`;}).join("");
    const plugs=WIRE_COLORS.map(c=>`<button class="eb-end ${c} ${wirePicked===c?"picked":""} ${wireConnected.has(c)?"done":""}" data-action="wire-pick" data-color="${c}" aria-label="${c} plug"><i></i><span>${c.toUpperCase()}</span></button>`).join("");
    const sockets=wireSockets.map(c=>`<button class="eb-end right ${c} ${wireConnected.has(c)?"done":""}" data-action="wire-socket" data-color="${c}" aria-label="${c} socket"><span>${c.toUpperCase()}</span><i></i></button>`).join("");
    return modalShell("Fix the electricity box", "The power is out! Connect each plug to the socket of the same color before time runs out.", `<div class="eb-timer"><span>⚡ POWER OUT</span><i><em data-timer-fill style="width:${taskTotal?taskTimer/taskTotal*100:100}%"></em></i><b data-timer-readout>${taskTimer}</b></div><div class="eb-box ${wireMiss?"miss":""}"><div class="eb-head"><span>⚡ MAIN POWER PANEL</span><i class="eb-lamp"></i></div><div class="eb-panel"><div class="eb-col">${plugs}</div><svg class="eb-wires" viewBox="0 0 100 212" preserveAspectRatio="none" aria-hidden="true">${paths}</svg><div class="eb-col">${sockets}</div></div></div><div class="gm-wire-status">${wireConnected.size}/4 WIRES CONNECTED · <span>${wirePicked?"Now tap the socket with the same color":"Tap a plug, then its matching socket"}</span></div>${note?`<div class="eb-note">${esc(note)}</div>`:""}<div class="eb-risk">If time runs out, the power stays off and your plants stop growing.</div>`);
  }
  function shieldTargets() {
    const ids = Object.keys(snapshot.greenhouse.plots);
    const planted = ids.filter((id) => snapshot.greenhouse.plots[id].cropId);
    return planted.length ? planted : ids;
  }
  function shieldModal() {
    const ids = Object.keys(snapshot.greenhouse.plots);
    const names = ["Northwest bed", "Northeast bed", "Southwest bed", "Southeast bed"];
    const targets = shieldTargets();
    const dir = SH_DIRS[shieldDir];
    const aligned = targets.filter((id) => shieldFacing[id] === shieldDir).length;
    if (shieldStage >= 4) {
      const ok = note.includes("All beds shielded");
      return modalShell("Solar storm shield", "Emergency radiation protection", `<div class="sh-result ${ok ? "ok" : "bad"}"><div>${ok ? "🛡️" : "⚠️"}</div><b>${ok ? "GREENHOUSE PROTECTED" : "PROTECTION INCOMPLETE"}</b><p>${esc(note)}</p><button class="sl2-btn" data-action="shield-facts">CONTINUE ▶</button></div>`);
    }
    const cards = targets.map((id) => {
      const plot = snapshot.greenhouse.plots[id];
      const f = SH_DIRS[shieldFacing[id]];
      const ok = shieldFacing[id] === shieldDir;
      return `<button class="sh-card ${ok ? "ok" : ""}" data-action="shield-turn" data-plot="${id}" aria-label="Turn shield for ${names[ids.indexOf(id)]}"><span class="sh-bed">${plot.cropId ? CROP_CATALOG[plot.cropId].icon : "🌱"} ${names[ids.indexOf(id)]}</span><span class="sh-dial"><i>🛡️</i><em>${f.arrow}</em></span><small>${ok ? "✓ FACING THE STORM" : "TAP TO TURN"}</small></button>`;
    }).join("");
    const msg = shieldStage === 3 ? "All shields are facing the storm. Activating protection…" : (shieldMsg || `Tap each shield to turn it until its arrow points toward the radiation. ${aligned}/${targets.length} aligned.`);
    return modalShell("Solar storm shield", "Turn every shield to face the radiation before the timer runs out.", `<div class="eb-timer sh-timer"><span>☢ SOLAR STORM</span><i><em data-timer-fill style="width:${taskTotal ? taskTimer / taskTotal * 100 : 100}%"></em></i><b data-timer-readout>${taskTimer}</b></div><div class="sh-source">☢ RADIATION COMING FROM THE <b>${dir.k.toUpperCase()}</b> <span>${dir.arrow}</span></div><div class="sh-grid">${cards}</div><div class="sh-msg">${esc(msg)}</div>`);
  }
  function plantModal() {
    const hydro = Object.keys(snapshot.greenhouse.plots).indexOf(plantBed) < 2;
    const crops = Object.values(CROP_CATALOG).filter((c) => (c.id === "greens") === hydro);
    return modalShell("Choose a crop", hydro ? "Plant a seedling in this hydroponic bed." : "Plant a crop in this treated Martian soil.", `<div class="gm-crop-choices">${crops.map(c=>`<button data-action="plant-choice" data-crop="${c.id}" ${snapshot.sol + c.growthSols > snapshot.maxSols ? "disabled" : ""}><span>${c.icon}</span><b>${c.name}</b><small>⏳ ${snapshot.sol + c.growthSols > snapshot.maxSols ? "Too late to harvest" : "Harvest Sol " + (snapshot.sol + c.growthSols)} · 🥣 ${c.foodReward} meals</small></button>`).join("")}</div><div class="gm-inventory">Water ${snapshot.resources.water} L · Power ${snapshot.resources.power} kWh</div>`, hydro ? 340 : 470);
  }
  function shieldFactsModal() {
    const facts = [["🧬", "Damages plant cells", "Radiation can break up the DNA inside plant cells."], ["🐌", "Slows plant growth", "Damaged plants grow more slowly and stay smaller."], ["🥬", "Affects food quality", "Stressed plants can make less food and less nutritious food."], ["🔧", "Damages greenhouse equipment", "Radiation can harm sensors, lights, pumps and computers."]];
    return modalShell("Did you know?", "Why radiation shielding matters", `<div class="sh-result ok lk"><div>☢️</div><b>Radiation is a big problem on Mars</b><p>Mars has a very thin atmosphere and no global magnetic field, so much more radiation reaches the surface than on Earth.</p><ul class="dyk-list">${facts.map(([ic, h, p]) => `<li><span>${ic}</span><div><b>${h}</b><small>${p}</small></div></li>`).join("")}</ul><button class="sl2-btn" data-action="facts-close">BACK TO GREENHOUSE</button></div>`);
  }
  function compostFactsModal() {
    const facts = [["♻️", "Nothing is wasted", "Every kilogram sent from Earth is expensive, so astronauts recycle as much as they can."], ["🌱", "Compost feeds new plants", "Plant scraps break down into nutrients that grow the next crop."], ["🔧", "Clean items get reused", "Reusing containers and materials means fewer supplies to launch."], ["☣️", "Contaminated waste is discarded", "In a sealed greenhouse, germs and pests could spread, so they must be thrown away."]];
    return modalShell("Did you know?", "Why sorting waste matters in space", `<div class="sh-result ${compostWin ? "ok" : "bad"} lk"><div>${compostWin ? "♻️" : "⚠️"}</div><b>${compostWin ? "GREAT SORTING!" : "SORTING INCOMPLETE"}</b><p>${esc(note)}</p><ul class="dyk-list">${facts.map(([ic, h, p]) => `<li><span>${ic}</span><div><b>${h}</b><small>${p}</small></div></li>`).join("")}</ul><button class="sl2-btn" data-action="facts-close">BACK TO GREENHOUSE</button></div>`);
  }
  function lockedModal() {
    return modalShell("Did you know?", "Why this bed is locked", `<div class="sh-result ok lk"><div>🪐</div><b>Mars soil is not ready for plants</b><p>Mars regolith, the surface material of Mars, is <b>sterile</b> (it has no living microbes) and contains toxic <b>perchlorate salts</b>, roughly 0.5–1% of the soil according to NASA missions like Phoenix and Curiosity. Perchlorates can harm plants and people, so we have to treat the soil first.</p><p>Treat the regolith in the Soil lab until perchlorate drops below 30 to unlock this bed.</p><button class="sl2-btn" data-action="station" data-station="soil">🧪 GO TO THE SOIL LAB</button></div>`);
  }
  function modalMarkup() {
    if(modal==="climate") return climateModal();
    if(modal==="soil") return soilModal();
    if(modal==="compost") return compostModal();
    if(modal==="wiring") return wireModal();
    if(modal==="shield") return shieldModal();
    if(modal==="plant") return plantModal();
    if(modal==="locked") return lockedModal();
    if(modal==="shieldfacts") return shieldFactsModal();
    if(modal==="compostfacts") return compostFactsModal();
    return "";
  }
  function taskItem(id, title, detail, state) {
    return `<button class="gm-ck ${state}" data-action="station" data-station="${id}"><span class="gm-box">${state==="done"?"✓":state==="urgent"?"!":""}</span><span class="gm-ck-copy"><b>${title}</b><small>${detail}</small></span><i>›</i></button>`;
  }

  function render() {
    if (toastForce) {
      toastForce = false; toastErr = toastErrForce; toastErrForce = false; toastNote = note; toastActive = true; toastFresh = true;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toastActive = false; root.querySelector(".gm-toast-bar")?.classList.remove("visible", "fresh"); }, 3800);
    } else if (modal === "shield" || modal === "wiring" || modal === "climate" || modal === "soil" || modal === "locked" || modal === "shieldfacts" || modal === "compostfacts") {
      toastNote = note; toastActive = false; toastFresh = false;
    } else if (note && note !== toastNote) {
      toastNote = note; toastActive = true; toastFresh = true;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toastActive = false; root.querySelector(".gm-toast-bar")?.classList.remove("visible", "fresh"); }, 3800);
    } else toastFresh = false;
    const s=snapshot;
    const plots=Object.keys(s.greenhouse.plots);
    const outage=s.powerOutage;
    const radiation=s.radiationAlert;                    // shields still need aligning
    const radiationOn=s.radiationOn??s.radiationAlert;
    const radLevel=s.radiationLevel||(radiationOn?2:0);   // 1 = caution (yellow) · 2 = danger (red), same as the base map   // radiation warning is on outside (keeps blinking after the shields are up)
    if(outage&&!outageFxDone)outageStart=Date.now();
    outageFxDone=outage;
    const fxElapsed=Date.now()-outageStart;
    const outageFlicker=outage&&fxElapsed<1100;
    const tempOkay=s.climateHealthy;
    const basicDone=[tempOkay,s.soilPerchlorate<30,compostDoneSol===s.sol].filter(Boolean).length;
    const panelsCovered=plots.every(id=>{const p=panels[id]||{};return p.rotation===90&&p.position>=30&&p.position<=50;});
    const soilFill=soilStep===2?soilProgress:soilStep>2?100:0;
    root.innerHTML=`<div class="gm-game ${outage?"has-outage":""} ${outageFlicker?"outage-flicker":""} ${radiationOn?"has-radiation":""} ${radLevel===1?"rad-caution":""}" style="--fx-delay:-${Math.max(0,fxElapsed)}ms">
      <header class="gm-title-tab">${ghIcon("leaf",26)}<b>Greenhouse · Food</b></header>
      ${outage?'<div class="gm-event-banner power">⚠ POWER OUTAGE · FIX THE WIRING TO RESTORE LIGHTS + PUMPS</div>':""}${radiationOn?(radiation?`<div class="gm-event-banner radiation">${radLevel===1?"RADIATION RISING · ALIGN THE SHIELDS TO PROTECT THE BEDS":"RADIATION DANGER · ALIGN THE SHIELDS OR YOUR CROPS GET HURT"}</div>`:`<div class="gm-event-banner radiation shielded">🛡 SHIELDS ACTIVE · RADIATION IS STILL ${radLevel===1?"RISING":"HIGH"} OUTSIDE</div>`):""}
      <div class="gm-layout"><main class="gm-map-wrap"><div class="gm-map-label"><b>GREENHOUSE MODULE</b><span>WASD / arrows to walk · E to interact · tap stations</span></div><div class="gm-map" tabindex="0" aria-label="Top-down playable greenhouse">
        <div class="gm-floor-grid"></div><div class="gm-wall wall-n"></div><div class="gm-wall wall-s"></div><div class="gm-wall wall-w"></div><div class="gm-wall wall-e"></div><svg class="gm-path-layer" aria-hidden="true"></svg>
        <div class="gm-bed-grid"><div class="gm-bedrow">${bed(plots[0],"Leafy greens","greens")}${bed(plots[1],"Leafy greens","greens")}</div><div class="gm-bedrow">${bed(plots[2],"Soil bed","potato")}${bed(plots[3],"Soil bed","millet")}</div></div>
        ${climateStation({temperature:s.climate.temperature,light:s.climate.light,band:BANDS[activeCrop()],needsTuning:!tempOkay})}
        ${soilStation({locked:!s.soilLabUnlocked,waitProgress:soilFill,ready:soilStep===3,running:!!soilWaitTimer,remaining:soilRemaining})}
        ${shieldStation({urgent:radiation})}
        ${compostStation()}
        ${wiringStation({outage})}
        <div class="gm-exit-door"></div>
      </div></main>
      <aside class="gm-tasks"><div class="gm-task-head"><span>${ghIcon("clipboard-check")}</span><div><b>TASK CHECKLIST</b><small>${basicDone} of 3 basic tasks done</small></div></div>
        <div class="gm-task-group"><h3>BASIC TASKS</h3>
          ${taskItem("climate","Set the climate",tempOkay?"Temperature and light are in the green":"Play the climate game to tune the habitat",tempOkay?"done":"todo")}
          ${taskItem("soil","Treat the soil",s.soilPerchlorate<30?"Perchlorate is low. Potato + millet unlocked":(soilStep===3?"✔ Incubation done! Go test the soil":(soilWaitTimer?`⏳ Incubating · <span data-ck-soil-time>${fmtTime(soilRemaining)}</span> left`:`Perchlorate ${s.soilPerchlorate}. Get it below 30`)),s.soilPerchlorate<30?"done":(soilStep===3?"urgent":"todo"))}
          ${taskItem("compost","Sort the compost",compostDoneSol===s.sol?"Sorted this Sol":"Sort 5 items in 20 seconds",compostDoneSol===s.sol?"done":"todo")}
        </div>
        <div class="gm-task-group emergency"><h3>⚠ EMERGENCY TASKS</h3>
          ${taskItem("wiring","Fix the wiring",outage?"Power is out! Restore lights + pumps":(wiringFixedSol===s.sol?"Power restored":"No power problem right now"),outage?"urgent":(wiringFixedSol===s.sol?"done":"idle"))}
          ${taskItem("shield","Align the shields",radiation?"Radiation warning! Turn the shields":(shieldDoneSol===s.sol?"Greenhouse protected":"No radiation alert right now"),radiation?"urgent":(shieldDoneSol===s.sol?"done":"idle"))}
        </div>
        <div class="gm-vitals"><h3>PLANT &amp; SOIL</h3>
          ${vital("Crop health","💚",s.cropHealth,s.pests?"PEST ALERT":"Plant vitals","crop")}
          ${vital("Perchlorate","🟠",s.soilPerchlorate,s.soilPerchlorate>=30?"High. Treat it in the Soil lab":"Soil is safe","perc",[30])}
        </div>
      </aside></div>${modalMarkup()}
      <div class="gm-toast-bar ${toastActive?"visible":""} ${toastFresh?"fresh":""} ${toastErr?"err":""}" role="status" aria-live="polite">${esc(toastNote)}</div></div>`;
    const scene=root.querySelector(".gm-map");
    drawPath(scene.querySelector(".gm-path-layer"));
    if(avatar?.el?.isConnected)avatar.el.remove();
    avatar=createAvatar(scene);
    dressAvatar?.(avatar);   // same outfit / shirt colour as on the base map
    placeAvatar();
  }

  function placeAvatar(){
    if(!avatar)return;
    const scene=root.querySelector(".gm-map");
    if(!scene)return;
    const point={x:player.x/PATH.width*scene.clientWidth,y:player.y/PATH.height*scene.clientHeight};
    avatar.moveTo(point.x,point.y);
    scene.style.setProperty("--lx",`${point.x}px`);
    scene.style.setProperty("--ly",`${point.y - 18}px`);
    const wst=scene.querySelector(".wiring-station");
    if(wst){scene.style.setProperty("--wx",`${wst.offsetLeft+wst.offsetWidth/2}px`);scene.style.setProperty("--wy",`${wst.offsetTop+wst.offsetHeight/2+6}px`);}
  }

  function startTaskTimer(kind, seconds) {
    if(taskTimerId && modal===kind)return;
    clearInterval(taskTimerId);taskTimer=seconds;taskTotal=seconds;modal=kind;
    taskTimerId=setInterval(()=>{taskTimer--;const readout=root.querySelector("[data-timer-readout]");if(readout)readout.textContent=taskTimer;const tfill=root.querySelector("[data-timer-fill]");if(tfill&&taskTotal)tfill.style.width=`${Math.max(0,taskTimer)/taskTotal*100}%`;if(taskTimer<=0){clearInterval(taskTimerId);taskTimerId=null;if(kind==="compost"){modal="";finishCompost();}else if(kind==="shield"){shieldStage=4;note="Solar storm countdown expired. The shields were not activated; crops remain exposed.";render();}else{modal="";wirePicked="";wireConnected.clear();const fr=doAction({type:"repair-fail"});note=fr.message;render();}}},1000);
    render();
  }
  function finishCompost() {
    const win=compostCorrect/compostItems.length>=0.8;
    const r=doAction({type:win?"compost-success":"compost-fail"});
    note=r.message;compostWin=win;if(win)compostDoneSol=snapshot.sol;compostStarted=false;compostIndex=0;compostCorrect=0;compostItems=pickCompostItems();modal="compostfacts";render();
  }
  function openStation(id) {
    if (id === "soil" && !snapshot.soilLabUnlocked) {
      note = "Earn two Science Stars to unlock the Soil Lab."; render(); return;
    }
    if (snapshot.powerOutage && ["soil", "compost", "climate"].includes(id)) {
      const nm = { soil: "soil lab", compost: "compost sort", climate: "climate settings" }[id];
      modal = ""; note = `⚠ The power is out! You can't use the ${nm} until you fix the wiring.`; toastForce = true; toastErrForce = true; render(); return;
    }
    if(id==="wiring"&&!snapshot.powerOutage){note="The power grid is stable. The emergency panel activates during an outage.";render();return;}
    if(id==="shield"&&!snapshot.radiationAlert){note="No radiation warning right now. The shield console is used when a solar storm hits outside.";render();return;}
    if(id==="compost"&&!compostStarted){compostStarted=true;compostIndex=0;compostCorrect=0;compostItems=pickCompostItems();startTaskTimer("compost",20);return;}
    if(id==="wiring"){note="";wirePicked="";wireMiss=false;wireConnected.clear();wireSockets=[...WIRE_SOCKETS];for(let i=wireSockets.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[wireSockets[i],wireSockets[j]]=[wireSockets[j],wireSockets[i]];}startTaskTimer("wiring",15);return;}
    if(id==="shield"){note="";shieldStage=0;shieldMsg="";shieldDir=Math.floor(Math.random()*4);shieldFacing={};shieldTargets().forEach((pid)=>{let d;do{d=Math.floor(Math.random()*4);}while(d===shieldDir);shieldFacing[pid]=d;});panels=Object.fromEntries(Object.keys(snapshot.greenhouse.plots).map((plotId)=>[plotId,{rotation:0,position:8,placed:false}]));startTaskTimer("shield",30);return;}
    if(id==="climate"){selectedClimateCrop=activeCrop();climateTemperature=snapshot.climate.temperature;climateLight=snapshot.climate.light;modal=id;startClimateGame();return;}
    if(id==="soil"&&soilStep===4)resetSoil();
    if(id==="soil"&&soilStep===0&&soilScoops===0){note="Soil lab test started! Collect 3 scoops of regolith.";toastForce=true;}
    modal=id;render();
  }
  function interact() {
    const nearest=Object.entries(stationMap).map(([id,[x,y]])=>({id,d:Math.hypot(player.x-PATH.width*x/100,player.y-PATH.height*y/100)})).sort((a,b)=>a.d-b.d)[0];
    if(onExit&&nearExit()){onExit();return;}
    if(nearest&&nearest.d<45){openStation(nearest.id);return;}
    note="Walk along the dotted paths and get closer to a station; press E to use it.";render();
  }
  function failSoilBatch(reason) {
    const result=doAction({type:"soil-fail"});
    soilStep=0;soilScoops=0;soilProgress=0;soilSweepFromPile=false;
    clearInterval(soilWaitTimer);soilWaitTimer=null;soilActiveTool="";
    note=`${reason} ${result.message}`;render();
  }
  function beginSoilIncubation() {
    if(soilWaitTimer)return;
    soilStep=2;soilProgress=0;note="The microbes are incubating. You can close the lab and continue another greenhouse task.";
    soilWaitTimer=setInterval(()=>{
      soilProgress=Math.min(100,soilProgress+4);
      const fill=root.querySelector(".soil-incubation em");if(fill)fill.style.width=`${soilProgress}%`;
      const value=root.querySelector(".soil-incubation b");if(value)value.textContent=`${Math.floor(soilProgress)}%`;
      if(soilProgress>=100){clearInterval(soilWaitTimer);soilWaitTimer=null;soilStep=3;note="Incubation complete. Drag the soil probe into the chamber to test the sample.";if(modal==="soil"||modal==="")render();}
    },200);
    render();
  }
  function completeSoilTreatment() {
    const result=doAction({type:"soil-treat"});
    if(!result.ok){note=result.message;render();return;}
    soilStep=4;soilScoops=3;soilProgress=100;soilActiveTool="";note=result.message;render();
  }
  function soilZoneAt(x,y) { return document.elementFromPoint(x,y)?.closest("[data-soil-zone]")?.dataset.soilZone || ""; }
  // Soil lab: drag the scoop (regolith pile) or the microbe bottle into the treatment chamber.
  let slDrag = null;
  let soilPour = false;
  function slGhost(on, x, y, icon) {
    if (!slDrag) return;
    const g = slDrag.ghost;
    if (icon) g.textContent = icon;
    g.style.left = `${x}px`; g.style.top = `${y}px`;
  }
  function slOverJar(x, y) { return !!document.elementFromPoint(x, y)?.closest("[data-sl-jar]"); }
  function onSoilPointerDown(event) {
    if (modal !== "soil") return;
    const src = event.target.closest("[data-sl-drag]"); if (!src) return;
    const kind = src.dataset.slDrag;
    if ((kind === "scoop" && soilStep !== 0) || (kind === "microbe" && soilStep !== 1)) return;
    event.preventDefault();
    const ghost = document.createElement("div");
    ghost.className = "sl2-ghost";
    ghost.innerHTML = ghIcon(kind === "scoop" ? "shovel" : "flask-round");
    document.body.appendChild(ghost);
    slDrag = { kind, ghost };
    slGhost(true, event.clientX, event.clientY);
    src.classList.add("grabbed");
  }
  function onSoilPointerMove(event) {
    if (!slDrag) return;
    slGhost(true, event.clientX, event.clientY);
    root.querySelector("[data-sl-jar]")?.classList.toggle("hot", slOverJar(event.clientX, event.clientY));
  }
  function endSoilDrag(event, drop) {
    if (!slDrag) return;
    const { kind, ghost } = slDrag;
    slDrag = null; ghost.remove();
    root.querySelectorAll(".grabbed").forEach((n) => n.classList.remove("grabbed"));
    root.querySelector("[data-sl-jar]")?.classList.remove("hot");
    if (!drop) return;
    if (!slOverJar(event.clientX, event.clientY)) { note = kind === "scoop" ? "Drop the scoop over the treatment chamber to pour in the regolith." : "Drop the bottle over the treatment chamber to add the microbes."; render(); return; }
    soilPour = true;
    if (kind === "scoop") { soilScoops = Math.min(3, soilScoops + 1); note = soilScoops >= 3 ? "Three scoops of regolith are in the chamber. Now add the microbe mix." : `Scoop ${soilScoops} of 3 poured in.`; if (soilScoops >= 3) soilStep = 1; }
    else { soilDoses = Math.min(3, soilDoses + 1); note = soilDoses >= 3 ? "Microbes added. Start the 30-minute incubation." : `Microbe dose ${soilDoses} of 3 added.`; if (soilDoses >= 3) soilStep = 2; }
    render();
  }
  function onSoilPointerUp(event) { endSoilDrag(event, true); }
  function onSoilPointerCancel(event) { endSoilDrag(event, false); }
  function onClick(event) {
    const el=event.target.closest("[data-action]");if(!el)return;
    const a=el.dataset.action;
    if(a==="shield-close"){clearInterval(taskTimerId);taskTimerId=null;modal="";render();return;}
    if(a==="shield-turn"){
      if(shieldStage!==0)return;
      const id=el.dataset.plot;shieldFacing[id]=((shieldFacing[id]??0)+1)%4;shieldMsg="";
      const targets=shieldTargets();
      if(targets.every((pid)=>shieldFacing[pid]===shieldDir)){
        shieldStage=3;
        setTimeout(()=>{if(modal==="shield"&&shieldStage===3){clearInterval(taskTimerId);taskTimerId=null;const r=doAction({type:"shield-lock",covered:true});shieldDoneSol=snapshot.sol;note=r.message;shieldStage=4;render();}},900);
      }
      render();return;
    }
    if(a==="sl-toggle"){
      if(soilWaitTimer){clearInterval(soilWaitTimer);soilWaitTimer=null;note="Incubation paused.";render();return;}
      runSoilTimer();
      note="Incubation running. You can do other tasks while you wait.";render();return;
    }
    if(a==="sl-test"){
      soilTests[el.dataset.test]=62+Math.floor(Math.random()*34);
      if(Object.keys(soilTests).length===3){
        const before=snapshot.soilPerchlorate;const res=doAction({type:"soil-treat"});
        if(!res.ok){note=res.message;soilTests={};render();return;}
        soilResult={...soilTests,before,after:snapshot.soilPerchlorate};soilStep=4;soilProgress=100;note=res.message;toastForce=true;
      }
      render();return;
    }
    if(a==="sl-restart"){resetSoil();note="Soil lab test restarted! Collect 3 scoops of regolith.";toastForce=true;render();return;}
    if(a==="soil-close"){soilActiveTool="";modal="";render();return;}
    if(a==="close"){if(event.target===el||el.classList.contains("gm-x")){if(modal==="shield"||modal==="wiring"||modal==="compost"){clearInterval(taskTimerId);taskTimerId=null;compostStarted=false;wirePicked="";wireConnected.clear();}modal="";render();}return;}
    if(a==="exit"){onExit?.();return;}
    if(a==="station"){openStation(el.dataset.station);return;}
    if(a==="shield-facts"){modal="shieldfacts";render();return;}
    if(a==="facts-close"){modal="";render();return;}
    if(a==="locked-bed"){modal="locked";render();return;}
    if(a==="plant"){plantBed=el.dataset.plot;modal="plant";render();return;}
    if(a==="plant-choice"){const r=doAction({type:"plant",plotId:plantBed,cropId:el.dataset.crop});note=r.message;modal="";render();return;}
    if(a==="harvest"){const r=doAction({type:"harvest",plotId:el.dataset.plot});note=r.message;render();return;}
    if(a==="inspect-bed"){const p=snapshot.greenhouse.plots[el.dataset.plot];const c=CROP_CATALOG[p.cropId];note=`${c.name} is ready on Sol ${snapshot.sol+c.growthSols-p.growthSols}. Sleep in the Command Center to grow it.`;render();return;}
    if(a==="climate-start"){beginClimatePlay();return;}
    if(a==="climate-hold"){
      doAction({type:"set-climate",climate:{temperature:climateTemperature,light:climateLight}});
      if(!climateInBand()){const r=doAction({type:"climate-test",cropId:selectedClimateCrop});note=r.message;render();return;}
      climateHold=3;render();
      climateHoldTimer=setInterval(()=>{climateHold--;const label=root.querySelector("[data-climate-countdown]");if(label)label.textContent=climateHold>0?`HOLD STEADY · ${climateHold}s`:"SAFE ZONE HELD";const fill=root.querySelector("[data-hold-fill]");if(fill)fill.style.width=`${(3-climateHold)/3*100}%`;if(climateHold<=0){clearInterval(climateHoldTimer);climateHoldTimer=null;doAction({type:"set-climate",climate:{temperature:climateTemperature,light:climateLight}});const r=doAction({type:"climate-test",cropId:selectedClimateCrop});note=r.message;modal="";render();}},1000);return;
    }
    if(a==="soil-scoop"){if(soilStep!==0){const r=doAction({type:"soil-fail"});note=`Wrong step. ${r.message}`;soilStep=0;soilProgress=0;clearInterval(soilWaitTimer);soilWaitTimer=null;}else{soilStep=1;note="Sample in the tray. Add the microbe mix next.";}render();return;}
    if(a==="soil-microbes"){if(soilStep!==1){const r=doAction({type:"soil-fail"});note=`Wrong step. ${r.message}`;soilStep=0;soilProgress=0;clearInterval(soilWaitTimer);soilWaitTimer=null;}else{soilStep=2;note="Microbes added. Start the treatment wait.";}render();return;}
    if(a==="soil-wait"){if(soilStep!==2){const r=doAction({type:"soil-fail"});note=`Wrong step. ${r.message}`;soilStep=0;render();return;}if(!soilWaitTimer){soilProgress=0;const started=Date.now();soilWaitTimer=setInterval(()=>{soilProgress=Math.min(100,(Date.now()-started)/50);if(soilProgress>=100){clearInterval(soilWaitTimer);soilWaitTimer=null;soilStep=3;note="Treatment finished. Run the soil test!";}if(modal==="soil")render();},200);note="Microbes are treating the sample. You can close this and run another task.";}render();return;}
    if(a==="soil-test"){if(soilStep!==3){const r=doAction({type:"soil-fail"});note=`Test too early! ${r.message}`;soilStep=0;soilProgress=0;clearInterval(soilWaitTimer);soilWaitTimer=null;}else{const r=doAction({type:"soil-treat"});note=r.message;soilStep=0;soilProgress=0;clearInterval(soilWaitTimer);soilWaitTimer=null;}render();return;}
    if(a==="sort"){if(!compostStarted)return;const item=compostItems[compostIndex];if(el.dataset.bin===item.bin)compostCorrect++;compostIndex++;if(compostIndex>=compostItems.length){clearInterval(taskTimerId);taskTimerId=null;modal="";finishCompost();}else render();return;}
    if(a==="drag-item"){return;}
    if(a==="wire-pick"){if(wireConnected.has(el.dataset.color))return;wirePicked=el.dataset.color;wireMiss=false;render();return;}
    if(a==="wire-socket"){if(wireConnected.has(el.dataset.color))return;if(!wirePicked){note="Tap a colored plug first, then the socket with the same color.";render();return;}if(wirePicked===el.dataset.color){wireConnected.add(wirePicked);wireMiss=false;note=`${wireConnected.size} of 4 wires connected.`;if(wireConnected.size===4){clearInterval(taskTimerId);taskTimerId=null;const r=doAction({type:"repair-power"});wiringFixedSol=snapshot.sol;modal="";wireConnected.clear();note=r.message;}}else{wireMiss=true;taskTimer=Math.max(0,taskTimer-2);note="Colors do not match. Time −2 seconds.";}wirePicked="";render();return;}
  }

  function onInput(event){
    const slider=event.target.dataset.slider;
    if(slider==="temperature"){climateTemperature=Number(event.target.value);event.target.closest("label").querySelector("b").textContent=`${climateTemperature}°C`;}
    if(slider==="light"){climateLight=Number(event.target.value);event.target.closest("label").querySelector("b").textContent=`${climateLight}%`;}
    if((slider==="temperature"||slider==="light")&&climateHold>0&&!climateInBand()){
      clearInterval(climateHoldTimer);climateHoldTimer=null;climateHold=0;note="The dial left the green band. Hold reset; bring both controls back into range and try again.";
      doAction({type:"set-climate",climate:{temperature:climateTemperature,light:climateLight}});doAction({type:"climate-test",cropId:selectedClimateCrop});render();return;
    }
  }
  function onDragStart(event){const shield=event.target.closest("[data-shield-panel]");if(shield&&event.dataTransfer){event.dataTransfer.setData("text/plain",`shield:${shield.dataset.shieldPanel}`);event.dataTransfer.effectAllowed="move";return;}const item=event.target.closest('[data-action="drag-item"]');if(item&&event.dataTransfer){event.dataTransfer.setData("text/plain","compost-item");event.dataTransfer.effectAllowed="move";}}
  function onDragOver(event){if(event.target.closest("[data-drop], [data-shield-target]")){event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect="move";}}
  function onDrop(event){const target=event.target.closest("[data-shield-target]");if(target){event.preventDefault();const payload=event.dataTransfer?.getData("text/plain")||"";const id=target.dataset.shieldTarget;if(payload===`shield:${id}`){const rect=target.getBoundingClientRect();panels[id].placed=true;panels[id].position=clamp((event.clientX-rect.left)/rect.width*100,5,95);note="Shield moved. Check the marker and adjust its distance if needed.";render();}else if(payload.startsWith("shield:")){note="That shield belongs to a different bed. Match each shield to its marked bed.";render();}return;}const bin=event.target.closest("[data-drop]");if(!bin)return;event.preventDefault();bin.click();}
  let exitArmed=false;
  function nearExit(){return Math.hypot(player.x-PATH.width*.985,player.y-PATH.height*.508)<50;}
  function movePlayerFrame(time){
    if(modal||movementKeys.size===0){movementFrame=0;previousFrameTime=0;avatar?.setWalking(false);return;}
    const elapsed=previousFrameTime?Math.min((time-previousFrameTime)/1000,.05):0;previousFrameTime=time;
    const left=movementKeys.has("a")||movementKeys.has("arrowleft");const right=movementKeys.has("d")||movementKeys.has("arrowright");
    const up=movementKeys.has("w")||movementKeys.has("arrowup");const down=movementKeys.has("s")||movementKeys.has("arrowdown");
    const mapEl=root.querySelector(".gm-map");
    // same walking speed as on the base map: its speed in screen pixels per second, turned into route units
    const outArt=document.querySelector(".mm-art");const outScale=outArt?outArt.getBoundingClientRect().width/1160:1;
    const pxStep=(window.MarsMap?.SPEED||140)*(outScale||1)*elapsed;
    const unitsX=mapEl&&mapEl.clientWidth?PATH.width/mapEl.clientWidth:1,unitsY=mapEl&&mapEl.clientHeight?PATH.height/mapEl.clientHeight:1;
    let dx=(Number(right)-Number(left))*pxStep*unitsX;let dy=(Number(down)-Number(up))*pxStep*unitsY;
    if(dx&&dy){dx*=Math.SQRT1_2;dy*=Math.SQRT1_2;}
    if(onExit&&right&&!left&&nearExit()){movementKeys.clear();movementFrame=0;previousFrameTime=0;avatar?.setWalking(false);onExit();return;}
    if(dx||dy){const previous=player;player=moveOnPath({...player},dx,dy);avatar?.faceToward(dx,dy);const scene=root.querySelector(".gm-map");avatar?.moveTo(player.x/PATH.width*scene.clientWidth,player.y/PATH.height*scene.clientHeight);avatar?.setWalking(Math.abs(player.x-previous.x)+Math.abs(player.y-previous.y)>.1);}
    movementFrame=requestAnimationFrame(movePlayerFrame);
  }
  function onKeyDown(event){const key=event.key.toLowerCase();if(!["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d","e"].includes(key)||event.target instanceof HTMLInputElement)return;if(modal)return;event.preventDefault();if(key==="e"){if(!event.repeat)interact();return;}movementKeys.add(key);if(!movementFrame){previousFrameTime=0;movementFrame=requestAnimationFrame(movePlayerFrame);}}
  function onKeyUp(event){movementKeys.delete(event.key.toLowerCase());if(movementKeys.size===0&&movementFrame){cancelAnimationFrame(movementFrame);movementFrame=0;previousFrameTime=0;avatar?.setWalking(false);}}
  function onWindowBlur(){movementKeys.clear();if(movementFrame){cancelAnimationFrame(movementFrame);movementFrame=0;previousFrameTime=0;}avatar?.setWalking(false);}
  const onResize=()=>placeAvatar();

  root.addEventListener("click",onClick);
  root.addEventListener("pointerdown",onSoilPointerDown);
  root.addEventListener("pointermove",onSoilPointerMove);
  root.addEventListener("pointerup",onSoilPointerUp);
  root.addEventListener("pointercancel",onSoilPointerCancel);
  root.addEventListener("input",onInput);
  root.addEventListener("pointermove",onClimatePointer);
  root.addEventListener("pointerdown",onClimatePointer);
  document.addEventListener("keydown",onClimateKey);
  document.addEventListener("keyup",onClimateKey);
  root.addEventListener("dragstart",onDragStart);
  root.addEventListener("dragover",onDragOver);
  root.addEventListener("drop",onDrop);
  document.addEventListener("keydown",onKeyDown);
  document.addEventListener("keyup",onKeyUp);
  window.addEventListener("blur",onWindowBlur);
  window.addEventListener("resize",onResize);
  function runSoilTimer(){
    clearInterval(soilWaitTimer);
    soilWaitTimer=setInterval(()=>{
      soilRemaining=Math.max(0,soilRemaining-1);soilProgress=(SOIL_SECONDS-soilRemaining)/SOIL_SECONDS*100;
      const f=root.querySelector("[data-sl-fill]");if(f)f.style.width=`${soilProgress}%`;
      const t=root.querySelector("[data-sl-time]");if(t)t.textContent=fmtTime(soilRemaining);
      const bd=root.querySelector("[data-soil-badge]");if(bd)bd.textContent=`⏳ ${fmtTime(soilRemaining)}`;
      const ck=root.querySelector("[data-ck-soil-time]");if(ck)ck.textContent=fmtTime(soilRemaining);
      if(soilRemaining<=0){clearInterval(soilWaitTimer);soilWaitTimer=null;soilStep=3;note="Soil incubation is complete! Open the soil lab to test it.";toastForce=true;render();}
    },1000);
  }
  // coming back to the greenhouse: pick the soil lab up where it was left (the clock kept running)
  if(soilSaved){
    clearTimeout(soilAwayTimer);soilAwayTimer=null;
    const sv=soilSaved;soilSaved=null;
    soilStep=sv.step;soilScoops=sv.scoops;soilDoses=sv.doses;soilTests=sv.tests;soilResult=sv.result;
    soilRemaining=sv.remaining;soilProgress=(SOIL_SECONDS-soilRemaining)/SOIL_SECONDS*100;
    if(sv.endAt){
      soilRemaining=Math.max(0,Math.ceil((sv.endAt-Date.now())/1000));soilProgress=(SOIL_SECONDS-soilRemaining)/SOIL_SECONDS*100;
      if(soilRemaining<=0){soilStep=3;soilWaitTimer=null;note="Soil incubation is complete! Open the soil lab to test it.";toastForce=true;}
      else runSoilTimer();
    }
  }
  render();
  const stageSeen = {};
  const readySeen = new Set();
  function growTick() {
    snapshot = controller.getSnapshot();
    let renderNow = false;
    for (const [id, plot] of Object.entries(snapshot.greenhouse.plots)) {
      if (!plot.cropId) { delete stageSeen[id]; readySeen.delete(id); continue; }
      const crop = CROP_CATALOG[plot.cropId];
      const st = stageOf(crop.id, plot.growthSols, crop.growthSols);
      const ready = plot.growthSols >= crop.growthSols;
      if (stageSeen[id] !== undefined && st !== stageSeen[id]) { growFx.add(id); setTimeout(() => growFx.delete(id), 1400); if (!modal) renderNow = true; }
      stageSeen[id] = st;
      if (ready && !readySeen.has(id)) { readySeen.add(id); note = `${crop.icon} ${crop.name} is ready to harvest!`; toastForce = true; renderNow = true; }
      const bar = root.querySelector(`[data-bed-bar="${id}"]`); if (bar) bar.style.width = `${Math.min(100, plot.growthSols / crop.growthSols * 100)}%`;
      const tm = root.querySelector(`[data-bed-time="${id}"]`); if (tm) tm.textContent = bedTime(plot, crop);
    }
    const cb=root.querySelector(".gm-vital.crop");   // crop health can drop (outage / red radiation) between redraws
    if(cb){const v=Math.round(snapshot.cropHealth);const bar=cb.querySelector(".gm-vital-track i");if(bar)bar.style.width=`${clamp(v)}%`;const nb=cb.querySelector(".gm-vital-top b");if(nb)nb.innerHTML=`${v}<small>/100</small>`;}
    if (renderNow) render();
  }
  const growTimerId = setInterval(growTick, 1000);
  const unsubscribe=controller.subscribe((next)=>{
    for(const [id,plot] of Object.entries(next.greenhouse.plots)){
      const before=snapshot.greenhouse.plots[id];
      if(plot.cropId&&before&&(before.cropId!==plot.cropId||plot.growthSols>before.growthSols)){
        growFx.add(id);
        setTimeout(()=>growFx.delete(id),1400);
      }
    }
    snapshot=next;
    render();
  });
  return ()=>{stopIcons();timersClear();clearInterval(growTimerId);cancelAnimationFrame(cgRaf);root.removeEventListener("pointermove",onClimatePointer);root.removeEventListener("pointerdown",onClimatePointer);document.removeEventListener("keydown",onClimateKey);document.removeEventListener("keyup",onClimateKey);if(soilStep>0||soilWaitTimer){soilSaved={step:soilStep,scoops:soilScoops,doses:soilDoses,tests:soilTests,result:soilResult,remaining:soilRemaining,endAt:soilWaitTimer?Date.now()+soilRemaining*1000:0};if(soilWaitTimer){clearTimeout(soilAwayTimer);soilAwayTimer=setTimeout(()=>{soilAwayTimer=null;window.MarsMap?.toast?.('The greenhouse soil lab is done incubating!');},soilRemaining*1000);}}else soilSaved=null;clearInterval(soilWaitTimer);if(movementFrame)cancelAnimationFrame(movementFrame);root.removeEventListener("pointerdown",onSoilPointerDown);root.removeEventListener("pointermove",onSoilPointerMove);root.removeEventListener("pointerup",onSoilPointerUp);root.removeEventListener("pointercancel",onSoilPointerCancel);window.removeEventListener("blur",onWindowBlur);window.removeEventListener("resize",onResize);document.removeEventListener("keyup",onKeyUp);document.removeEventListener("keydown",onKeyDown);unsubscribe();root.replaceChildren();};
}