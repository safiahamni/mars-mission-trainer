import { CROP_CATALOG } from "./food.js";

const NASA_SOURCES = [
  { label: "NASA: Space Gardens", url: "https://www.nasa.gov/humans-in-space/space-gardens/" },
  { label: "NASA: Plant Habitat-02", url: "https://science.nasa.gov/biological-physical/investigations/plant-habitat-02-wvqpm/" },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cropCard(plotId, plot, snapshot) {
  if (!plot.cropId) {
    const options = Object.values(CROP_CATALOG).map((crop) =>
      `<option value="${crop.id}">${crop.name} · ${crop.growthSols} Sols</option>`,
    ).join("");
    return `
      <article class="gh-bed">
        <div class="gh-bed-head"><span class="gh-bed-name">${plotId.replace("-", " ")}</span><span class="gh-pill muted">Empty</span></div>
        <div class="gh-plant-art empty-art" aria-hidden="true">＋</div>
        <p class="gh-bed-note">Pick a crop for this growing bed.</p>
        <label class="gh-sr-only" for="crop-${plotId}">Choose a crop for ${plotId}</label>
        <select id="crop-${plotId}" class="gh-select">${options}</select>
        <button class="gh-button secondary" data-action="plant" data-plot="${plotId}">Plant crop</button>
      </article>`;
  }

  const crop = CROP_CATALOG[plot.cropId];
  const ready = plot.growthSols >= crop.growthSols;
  const progress = clamp(plot.growthSols / crop.growthSols, 0, 1);
  const stages = Array.from({ length: crop.growthSols }, (_, index) =>
    `<span class="gh-stage ${index < plot.growthSols ? "filled" : ""}"></span>`,
  ).join("");

  return `
    <article class="gh-bed">
      <div class="gh-bed-head"><span class="gh-bed-name">${crop.name}</span><span class="gh-pill ${ready ? "ready" : "growing"}">${ready ? "Ready to harvest" : "Growing"}</span></div>
      <div class="gh-plant-art ${ready ? "mature" : ""}" aria-label="${crop.name}">${crop.icon}</div>
      <div class="gh-progress" aria-label="${Math.round(progress * 100)} percent grown">${stages}</div>
      <p class="gh-bed-note">${ready ? `Harvest for +${crop.foodReward} Food` : `Growth stage ${plot.growthSols} of ${crop.growthSols}`}</p>
      <button class="gh-button ${ready ? "harvest" : "secondary"}" data-action="harvest" data-plot="${plotId}" ${ready ? "" : "disabled"}>${ready ? "Harvest crop" : "Keep growing"}</button>
    </article>`;
}

function resourceCard(label, value, icon, kind) {
  return `<div class="gh-resource ${kind}"><div class="gh-resource-top"><span>${icon} ${label}</span><strong>${value}<small> / 100</small></strong></div><div class="gh-meter"><i style="width:${clamp(value, 0, 100)}%"></i></div></div>`;
}

export function mountGreenhousePanel(root, controller, { onExit } = {}) {
  if (!root || !controller) throw new TypeError("A root element and greenhouse controller are required.");
  let message = "Choose a bed to plant your first crop.";

  function render(snapshot = controller.getSnapshot()) {
    const { sol, resources, climate, cropHealth, greenhouse } = snapshot;
    const tempOkay = climate.temperature >= 16 && climate.temperature <= 28;
    const lightOkay = climate.light >= 25 && climate.light <= 75;
    const climateOkay = tempOkay && lightOkay;
    root.innerHTML = `
      <div class="gh-page">
        <header class="gh-topbar"><div class="gh-brand"><span class="gh-logo" aria-hidden="true">✦</span><span>MARS MISSION TRAINER</span></div><span class="gh-sol">SOL ${sol} / 7</span></header>
        <main class="gh-layout">
          <section class="gh-main">
            <div class="gh-hero"><div class="gh-eyebrow">Habitat · Food Systems</div><h1>Greenhouse</h1><p>Grow fresh food for the crew. Healthy plants need light, water, and a little care each Sol.</p>${onExit ? '<button class="gh-back" data-action="exit">← Base map</button>' : ""}</div>
            <section class="gh-resources" aria-label="Greenhouse resources">
              ${resourceCard("Crop health", cropHealth, "🌿", "health")}
              ${resourceCard("Power reserve", resources.power, "⚡", "power")}
              ${resourceCard("Water reserve", resources.water, "💧", "water")}
              ${resourceCard("Food stock", resources.food, "🥣", "food")}
            </section>
            <section class="gh-content">
              <div class="gh-section-heading"><h2>Growing beds</h2><span>Pick a crop, then check back next Sol</span></div>
              <div class="gh-beds">${Object.entries(greenhouse.plots).map(([plotId, plot]) => cropCard(plotId, plot, snapshot)).join("")}</div>
              <div class="gh-lower-grid">
                <section class="gh-card climate-card">
                  <div class="gh-card-title"><h2>Climate control</h2><span class="gh-pill ${climateOkay ? "ready" : "warning"}">${climateOkay ? "In the green zone" : "Needs adjustment"}</span></div>
                  <p>Keep the settings in the green zone. Brighter light uses more power in a real habitat.</p>
                  <div class="gh-controls">
                    <label>Temperature <strong>${climate.temperature}°</strong><input type="range" min="10" max="34" value="${climate.temperature}" data-climate="temperature" aria-label="Greenhouse temperature"></label>
                    <label>Grow light <strong>${climate.light}%</strong><input type="range" min="0" max="100" value="${climate.light}" data-climate="light" aria-label="Grow light level"></label>
                  </div>
                  <div class="gh-range-note">Target game zone: 16–28° and 25–75% light</div>
                </section>
                <section class="gh-card gh-end-card"><div><h2>Ready to end the Sol?</h2><p>${message}</p></div><button class="gh-button primary" data-action="end-sol" ${sol >= 7 ? "disabled" : ""}>End Sol →</button></section>
              </div>
            </section>
          </section>
          <aside class="gh-side">
            <h2>How to grow</h2><p class="gh-side-intro">A few careful choices help the crew build a fresh-food supply.</p>
            <div class="gh-task"><span>🪴</span><div><strong>Plant a crop</strong><p>Each crop takes a different number of Sols and resources.</p></div></div>
            <div class="gh-task"><span>☀️</span><div><strong>Balance the climate</strong><p>Keep temperature and light inside the green zone.</p></div></div>
            <div class="gh-task"><span>💧</span><div><strong>Watch supplies</strong><p>Growing beds use water and power as they grow.</p></div></div>
            <div class="gh-task"><span>🥬</span><div><strong>Harvest when ready</strong><p>A mature crop adds Food to the crew’s supply.</p></div></div>
            <div class="gh-science"><strong>Space-garden science</strong><p>NASA has grown leafy greens and radishes in plant habitats on the International Space Station. A Mars greenhouse would face different conditions.</p><div>${NASA_SOURCES.map((source) => `<a href="${source.url}" target="_blank" rel="noreferrer">${source.label} ↗</a>`).join("")}</div></div>
            <p class="gh-game-note">Crop times and resource costs are simplified game values, not NASA measurements.</p>
          </aside>
        </main>
        <div class="gh-toast" role="status" aria-live="polite">${message}</div>
      </div>`;
  }

  function showMessage(text) {
    message = text;
    const toast = root.querySelector(".gh-toast");
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("visible");
    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(() => toast.classList.remove("visible"), 2600);
    const detail = root.querySelector(".gh-end-card p");
    if (detail) detail.textContent = text;
  }

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "exit") {
      onExit?.();
      return;
    }
    let result;
    if (action === "plant") {
      const select = root.querySelector(`#crop-${CSS.escape(button.dataset.plot)}`);
      result = controller.dispatch({ type: "plant", plotId: button.dataset.plot, cropId: select.value });
    } else if (action === "harvest") {
      result = controller.dispatch({ type: "harvest", plotId: button.dataset.plot });
    } else if (action === "end-sol") {
      result = controller.dispatch({ type: "end-sol" });
    }
    if (result) showMessage(result.message);
  });

  root.addEventListener("change", (event) => {
    if (!event.target.matches("[data-climate]")) return;
    const climateKey = event.target.dataset.climate;
    const value = Number(event.target.value);
    controller.dispatch({ type: "set-climate", climate: { [climateKey]: value } });
  });

  render();
  const unsubscribe = controller.subscribe((snapshot) => render(snapshot));
  return () => {
    unsubscribe();
    root.replaceChildren();
  };
}
