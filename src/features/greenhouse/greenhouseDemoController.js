/** Temporary feature-local game state until the shared controller is integrated. */
import { advanceGreenhouseSol, createGreenhouseState, harvestCrop, plantCrop, CROP_CATALOG } from "./food.js";

const cap = (n) => Math.max(0, Math.min(100, n));
const fail = (message, code = "invalid-action") => ({ ok: false, code, message });

export function createGreenhouseDemoController({ readResources, chargeSupplies } = {}) {
  let state = {
    sol: 1,
    resources: { water: 67, power: 64, food: 30 },
    waterUsed: 0,
    powerUsed: 0,
    nutrients: 32,
    organicMatter: 24,
    cropHealth: 0,
    soilPerchlorate: 100,
    advancedCropHarvested: false,
    climate: { temperature: 20, light: 45 },
    climateHealthy: false,
    powerOutage: false,
    radiationAlert: false,
    pests: false,
    greenhouse: createGreenhouseState(),
  };
  const listeners = new Set();

  const snapshot = () => ({ ...state, resources: { ...state.resources, ...readResources?.(), food: state.resources.food }, climate: { ...state.climate }, greenhouse: { ...state.greenhouse, plots: Object.fromEntries(Object.entries(state.greenhouse.plots).map(([id, plot]) => [id, { ...plot }])) } });
  const notify = () => listeners.forEach((listener) => listener(snapshot()));
  const charge = ({ water = 0, power = 0, nutrients = 0 } = {}) => {
    if (state.resources.water < water || state.resources.power < power || state.nutrients < nutrients) return false;
    if (chargeSupplies && !chargeSupplies({ water, power })) return false;
    state = { ...state, resources: { ...state.resources, water: state.resources.water - water, power: state.resources.power - power }, nutrients: state.nutrients - nutrients, waterUsed: state.waterUsed + water, powerUsed: state.powerUsed + power };
    return true;
  };

  function dispatch(action) {
    if (readResources) state = { ...state, resources: readResources() };
    if (action.type === "set-climate") {
      const climate = { ...state.climate, ...action.climate };
      if (!Number.isFinite(climate.temperature) || !Number.isFinite(climate.light)) return fail("Adjust both greenhouse controls first.");
      if (state.powerOutage && climate.light > 0) return fail("The power is out. Repair the wiring before the lights can turn on.", "power-outage");
      state = { ...state, climate };
      notify();
      return { ok: true, message: "Climate controls adjusted." };
    }

    if (action.type === "climate-test") {
      const cropId = action.cropId || Object.values(state.greenhouse.plots).find((p) => p.cropId)?.cropId || "greens";
      const bands = { greens: [16, 24, 35, 65], potato: [14, 22, 30, 60], millet: [20, 30, 40, 80] };
      const [tMin, tMax, lMin, lMax] = bands[cropId] || bands.greens;
      const good = !state.powerOutage && state.climate.temperature >= tMin && state.climate.temperature <= tMax && state.climate.light >= lMin && state.climate.light <= lMax;
      state = { ...state, climateHealthy: good, cropHealth: good ? cap(state.cropHealth + 10) : state.cropHealth };
      notify();
      return { ok: true, success: good, message: good ? "Climate locked in! Crop health +10." : "Outside the crop's target band. Growth will be 25% slower until climate is fixed." };
    }

    if (action.type === "plant") {
      if ((action.cropId === "potato" || action.cropId === "millet") && state.soilPerchlorate >= 30) return fail("Treat the soil below 30 before planting this crop.", "soil-locked");
      const result = plantCrop(state.greenhouse, { plotId: action.plotId, cropId: action.cropId, sol: state.sol });
      if (!result.ok) return result;
      if (!charge(result.resourceCost)) return fail("There is not enough water or power for that seedling.", "low-resources");
      const hadCrops = Object.values(state.greenhouse.plots).some((p) => p.cropId);
      state = { ...state, greenhouse: result.nextState, cropHealth: hadCrops ? state.cropHealth : 70 };
      notify();
      return result;
    }

    if (action.type === "soil-fail") {
      if (!charge({ water: 4, nutrients: 8 })) return fail("The failed batch used water and nutrients, but there are not enough supplies left.", "low-resources");
      notify();
      return { ok: true, message: "The batch was wasted. Water −4 L and nutrients −8." };
    }
    if (action.type === "soil-treat") {
      if (!charge({ water: 5, nutrients: 5 })) return fail("The soil lab needs 5 L of water and 5 nutrients for this batch.", "low-resources");
      const previous = state.soilPerchlorate;
      state = { ...state, soilPerchlorate: cap(previous - 20), nutrients: cap(state.nutrients + 3) };
      const unlocked = previous >= 30 && state.soilPerchlorate < 30;
      notify();
      return { ok: true, unlocked, message: unlocked ? "Perchlorate is below 30. Potato and millet beds unlocked!" : `Soil treated. Perchlorate −20 to ${state.soilPerchlorate}.` };
    }
    if (action.type === "compost-success") {
      state = { ...state, organicMatter: cap(state.organicMatter + 20), nutrients: cap(state.nutrients + 20), pests: false, soilPerchlorate: cap(state.soilPerchlorate - 2) };
      notify();
      return { ok: true, message: "Great sorting! Organic matter +20, nutrients +20." };
    }
    if (action.type === "compost-fail") {
      state = { ...state, soilPerchlorate: cap(state.soilPerchlorate + 10), pests: true, cropHealth: cap(state.cropHealth - 5) };
      notify();
      return { ok: true, message: "Contamination rose. Pest pressure is hurting crop health; sort compost correctly to clear it." };
    }
    if (action.type === "repair-power") {
      if (!state.powerOutage) return { ok: true, message: "The power grid is stable." };
      state = { ...state, powerOutage: false, climate: { ...state.climate, light: 45 }, climateHealthy: false };
      notify();
      return { ok: true, message: "Power restored! Lights and pumps are back. Recalibrate the climate." };
    }
    if (action.type === "repair-fail") {
      state = { ...state, powerOutage: true, climate: { ...state.climate, light: 0 }, climateHealthy: false, cropHealth: cap(state.cropHealth - 5) };
      notify();
      return { ok: true, message: "Repair failed! The power stays off and your plants will not grow until the wiring is fixed. Try again at the electricity box." };
    }
    if (action.type === "shield-lock") {
      if (!action.covered) return fail("Every panel needs to cover its bed from the beam.", "shield-open");
      state = { ...state, radiationAlert: false, cropHealth: cap(state.cropHealth + 10) };
      notify();
      return { ok: true, message: "All beds shielded. Radiation blocked; crop health +10." };
    }

    if (action.type === "grow-tick") {
      // Real-time growth. Does not notify listeners: the panel updates its own countdowns every second.
      const seconds = Number.isFinite(action.seconds) ? action.seconds : 1;
      const rate = state.powerOutage ? 0 : state.climateHealthy ? 1 : 0.75;
      if (rate === 0) return { ok: true, rate, stalled: true };
      const plots = { ...state.greenhouse.plots };
      for (const [id, plot] of Object.entries(plots)) {
        const crop = CROP_CATALOG[plot.cropId];
        if (crop && plot.growthSols < crop.growthSols) plots[id] = { ...plot, growthSols: Math.min(crop.growthSols, plot.growthSols + seconds * rate) };
      }
      state = { ...state, greenhouse: { ...state.greenhouse, plots } };
      return { ok: true, rate, stalled: false };
    }
    if (action.type === "end-sol") {
      if (state.sol >= 7) return fail("The greenhouse mission has reached its final Sol.", "final-sol");
      const growing = Object.values(state.greenhouse.plots).some((plot) => plot.cropId && plot.growthSols < CROP_CATALOG[plot.cropId].growthSols);
      const lightCost = state.powerOutage ? 0 : Math.ceil(state.climate.light / 25);
      // Crops now grow in real time (see grow-tick). End Sol only charges the daily upkeep and triggers events.
      const result = advanceGreenhouseSol(state.greenhouse, { sol: state.sol, waterAvailable: state.resources.water, powerAvailable: state.resources.power, nutrientAvailable: state.nutrients, climateOkay: !state.powerOutage, growthRate: 0, extraPower: lightCost });
      if (!result.ok) return result;
      const fullCost = result.resourceCost;
      if (!charge(fullCost)) return fail("Supplies are low for this Sol. Sort compost, reduce the light setting, or harvest food.", "low-resources");
      let cropHealth = state.cropHealth;
      if (state.powerOutage) cropHealth -= 8;
      if (state.pests) cropHealth -= 6;
      if (state.radiationAlert) cropHealth -= 12;
      else if (growing && !state.powerOutage) cropHealth += 1;
      const stalled = state.powerOutage && growing;
      const nextSol = state.sol + 1;
      const outage = nextSol === 3 || state.powerOutage;
      const radiation = nextSol >= 5 ? true : state.radiationAlert;
      state = { ...state, sol: nextSol, cropHealth: cap(cropHealth), climateHealthy: state.climateHealthy && !outage, powerOutage: outage, radiationAlert: radiation, climate: outage ? { ...state.climate, light: 0 } : state.climate, greenhouse: result.nextState };
      notify();
      const event = outage && nextSol === 3 ? " Power outage! Lights are off; fix the wiring!" : radiation && nextSol === 5 ? " Radiation warning! Align the shields before ending another Sol!" : "";
      return { ...result, message: `Sol ${nextSol} started.${event}${stalled ? " No power: your plants stop growing until the wiring is fixed!" : ""}` };
    }

    if (action.type === "harvest") {
      const cropId = state.greenhouse.plots[action.plotId]?.cropId;
      const result = harvestCrop(state.greenhouse, action.plotId);
      if (!result.ok) return result;
      if (state.resources.food + result.foodReward > 100) return fail("Food storage is full.", "food-full");
      state = { ...state, resources: { ...state.resources, food: state.resources.food + result.foodReward }, advancedCropHarvested: state.advancedCropHarvested || cropId === 'potato' || cropId === 'millet', greenhouse: result.nextState };
      notify();
      return result;
    }
    return fail("That greenhouse action is not available.");
  }

  return { getSnapshot: snapshot, dispatch, syncFood(food) {
    state = { ...state, resources: { ...state.resources, food } };
  }, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } };
}

export { CROP_CATALOG };