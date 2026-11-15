/** Temporary feature-local game state until the shared controller is integrated. */
import { advanceGreenhouseSol, createGreenhouseState, harvestCrop, plantCrop, CROP_CATALOG } from "./food.js";

const definedOnly = (o = {}) => Object.fromEntries(Object.entries(o).filter(([, v]) => Number.isFinite(v)));
const cap = (n) => Math.max(0, Math.min(100, n));
const fail = (message, code = "invalid-action") => ({ ok: false, code, message });

export function createGreenhouseDemoController({ readResources, chargeSupplies, readSol, readRadiation, readChapterStars, maxSols = 6, onEvent } = {}) {
  let state = {
    sol: 1,
    resources: { water: 67, power: 64, food: 30 },
    waterUsed: 0,
    powerUsed: 0,
    nutrients: 32,
    organicMatter: 24,
    cropHealth: 0,
    soilPerchlorate: 100,
    climate: { temperature: 20, light: 45 },
    climateHealthy: false,
    powerOutage: false,
    radiationAlert: false,
    radiationOn: false,
    radiationLevel: 0,
    hazard: 0,
    pests: false,
    greenhouse: createGreenhouseState(),
  };
  const listeners = new Set();
  const hasCrops = () => Object.values(state.greenhouse.plots).some((p) => p.cropId);

  // ---- things that come from the shared game (the base map) ----
  // readSol(): the shared game's sol.  readRadiation(): true while a solar storm / radiation warning is on outside.
  // The wiring emergency is a random event: once or twice during the mission, some seconds after a sol starts.
  const rnd = (a, b) => a + Math.random() * (b - a);
  const firstOutage = 2 + Math.floor(Math.random() * (maxSols - 1));    // sol 2..last sol
  const outageSols = new Set([firstOutage]);
  if (Math.random() < 0.5) {                                          // sometimes a second one, not on the next sol
    const others = [2, 3, 4, 5, 6, 7].filter((n) => n <= maxSols && Math.abs(n - firstOutage) > 1);
    if (others.length) outageSols.add(others[Math.floor(Math.random() * others.length)]);
  }
  let outageDueAt = 0;           // when the next scheduled outage hits (ms)
  let dirty = false;             // something changed that the panel has not drawn yet
  let shielded = false;          // shields locked during the current storm
  let radiationSeconds = 0;      // seconds of unshielded radiation (hurts the plants)
  function syncExternal() {
    let changed = false;
    const sol = readSol?.();
    if (Number.isFinite(sol) && sol !== state.sol) {
      const elapsed = Math.max(0, sol - state.sol);
      const plots = Object.fromEntries(Object.entries(state.greenhouse.plots).map(([id, plot]) => {
        const crop = CROP_CATALOG[plot.cropId];
        return [id, crop ? { ...plot, growthSols: Math.min(crop.growthSols, plot.growthSols + elapsed) } : plot];
      }));
      state = { ...state, sol, greenhouse: { ...state.greenhouse, plots } };
      changed = true;
      if (outageSols.has(sol)) outageDueAt = Date.now() + rnd(8000, 30000);
    }
    if (outageDueAt && Date.now() >= outageDueAt) {
      outageDueAt = 0;
      if (!state.powerOutage) {
        state = { ...state, powerOutage: true, climateHealthy: false, climate: { ...state.climate, light: 0 } };
        changed = true;
        onEvent?.("Power outage in the Greenhouse! The lights and pumps are off: fix the wiring before your plants get hurt.");
      }
    }
    if (readRadiation) {
      const raw = readRadiation();                       // false/0 none · 1 caution (yellow) · true/2 danger (red)
      const level = raw === true ? 2 : Math.max(0, Math.min(2, Number(raw) || 0));
      const on = level > 0;
      if (level !== state.radiationLevel) { state = { ...state, radiationLevel: level }; changed = true; }
      if (!on) shielded = false;
      const alert = on && !shielded;
      if (alert !== state.radiationAlert) { state = { ...state, radiationAlert: alert }; changed = true; }
      if (on !== state.radiationOn) { state = { ...state, radiationOn: on }; changed = true; }   // the warning outside, even after the shields are up
    }
    if (changed) dirty = true;
    return changed;
  }

  // Crop health drops ONCE per problem (only when something is planted):
  //   · power outage: the climate can't be controlled           -5, once per outage
  //   · RED radiation (hazard 80+ / storm), shields not up      -8, once per red warning
  // Runs from refresh() every second, so it also works while the player is away from the greenhouse.
  let outageHit = false, radHit = false;
  function tickDamage() {
    let loss = 0;
    if (!state.powerOutage) outageHit = false;
    else if (!outageHit && hasCrops()) { outageHit = true; loss += 5; }
    if (state.radiationLevel !== 2) radHit = false;
    else if (!radHit && state.radiationAlert && hasCrops()) { radHit = true; loss += 8; }
    if (loss && state.cropHealth > 0) { state = { ...state, cropHealth: cap(state.cropHealth - loss) }; dirty = true; }
  }

  const snapshot = () => (syncExternal(), { ...state, maxSols, soilLabUnlocked: !readChapterStars || readChapterStars() >= 2, resources: { ...state.resources, ...definedOnly(readResources?.()), food: state.resources.food }, climate: { ...state.climate }, greenhouse: { ...state.greenhouse, plots: Object.fromEntries(Object.entries(state.greenhouse.plots).map(([id, plot]) => [id, { ...plot }])) } });
  const notify = () => { dirty = false; listeners.forEach((listener) => listener(snapshot())); };
  const refresh = () => { syncExternal(); tickDamage(); if (dirty) notify(); };   // dirty: a change another call already picked up
  const charge = ({ water = 0, power = 0, nutrients = 0 } = {}) => {
    if (state.resources.water < water || state.resources.power < power || state.nutrients < nutrients) return false;
    if (chargeSupplies && !chargeSupplies({ water, power })) return false;
    state = { ...state, resources: { ...state.resources, water: state.resources.water - water, power: state.resources.power - power }, nutrients: state.nutrients - nutrients, waterUsed: state.waterUsed + water, powerUsed: state.powerUsed + power };
    return true;
  };

  function dispatch(action) {
    if (readResources) state = { ...state, soilLabUnlocked: !readChapterStars || readChapterStars() >= 2, resources: { ...state.resources, ...definedOnly(readResources()) } };
    syncExternal();
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
      state = { ...state, climateHealthy: good, cropHealth: good && hasCrops() ? cap(state.cropHealth + 10) : state.cropHealth };
      notify();
      return { ok: true, success: good, message: good ? "Climate locked in! Crop health +10." : "Outside the crop's target band. Growth will be 25% slower until climate is fixed." };
    }

    if (action.type === "plant") {
      const crop = CROP_CATALOG[action.cropId];
      if (crop && state.sol + crop.growthSols > maxSols) {
        return fail(`${crop.name} needs ${crop.growthSols} overnight growth steps and won?t be ready by Sol ${maxSols}.`, "harvest-too-late");
      }
      if ((action.cropId === "potato" || action.cropId === "millet") && state.soilPerchlorate >= 30) return fail("Treat the soil below 30 before planting this crop.", "soil-locked");
      const result = plantCrop(state.greenhouse, { plotId: action.plotId, cropId: action.cropId, sol: state.sol });
      if (!result.ok) return result;
      if (!charge(result.resourceCost)) return fail("There is not enough water or power for that seedling.", "low-resources");
      const hadCrops = Object.values(state.greenhouse.plots).some((p) => p.cropId);
      // crop health starts at 0; the first seedling gives it a small start
      state = { ...state, greenhouse: result.nextState, cropHealth: hadCrops ? state.cropHealth : Math.max(state.cropHealth, 10) };
      notify();
      return result;
    }

    if (action.type === "soil-fail") {
      if (!charge({ water: 4, nutrients: 8 })) return fail("The failed batch used water and nutrients, but there are not enough supplies left.", "low-resources");
      notify();
      return { ok: true, message: "The batch was wasted. Water −4 L and nutrients −8." };
    }
    if (action.type === "soil-treat") {
      if (readChapterStars && readChapterStars() < 2) return fail("Earn two Science Stars to unlock the Soil Lab.", "soil-lab-locked");
      if (!charge({ water: 5, nutrients: 5 })) return fail("The soil lab needs 5 L of water and 5 nutrients for this batch.", "low-resources");
      const previous = state.soilPerchlorate;
      state = { ...state, soilPerchlorate: cap(previous - 20), nutrients: cap(state.nutrients + 3) };
      const unlocked = previous >= 30 && state.soilPerchlorate < 30;
      notify();
      return { ok: true, unlocked, message: unlocked ? "Perchlorate is below 30. Potato and millet beds unlocked!" : `Soil treated. Perchlorate −20 to ${state.soilPerchlorate}.` };
    }
    if (action.type === "compost-success") {
      state = { ...state, organicMatter: cap(state.organicMatter + 20), nutrients: cap(state.nutrients + 20), pests: false, soilPerchlorate: cap(state.soilPerchlorate - 2), cropHealth: hasCrops() ? cap(state.cropHealth + 4) : state.cropHealth };
      notify();
      return { ok: true, message: hasCrops() ? "Great sorting! Organic matter +20, nutrients +20, crop health +4." : "Great sorting! Organic matter +20, nutrients +20." };
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
      shielded = true;
      radiationSeconds = 0;
      state = { ...state, radiationAlert: false, cropHealth: hasCrops() ? cap(state.cropHealth + 10) : state.cropHealth };
      notify();
      return { ok: true, message: "All beds shielded. Radiation blocked; crop health +10." };
    }

    if (action.type === "end-sol") {
      if (readSol) return fail("Sleep in the Command Center to advance the Sol.", "shared-sol");
      if (state.sol >= maxSols) return fail("The greenhouse mission has reached its final Sol.", "final-sol");
      const growing = Object.values(state.greenhouse.plots).some((plot) => plot.cropId && plot.growthSols < CROP_CATALOG[plot.cropId].growthSols);
      const lightCost = state.powerOutage ? 0 : Math.ceil(state.climate.light / 25);
      // End Sol charges the daily upkeep and triggers events.
      const result = advanceGreenhouseSol(state.greenhouse, { sol: state.sol, waterAvailable: state.resources.water, powerAvailable: state.resources.power, nutrientAvailable: state.nutrients, climateOkay: !state.powerOutage, growthRate: 1, extraPower: lightCost });
      if (!result.ok) return result;
      const fullCost = result.resourceCost;
      if (!charge(fullCost)) return fail("Supplies are low for this Sol. Sort compost, reduce the light setting, or harvest food.", "low-resources");
      let cropHealth = state.cropHealth;
      if (state.powerOutage) cropHealth -= 8;
      if (state.pests) cropHealth -= 6;
      if (state.radiationLevel === 2 && state.radiationAlert) cropHealth -= 12;
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
      const result = harvestCrop(state.greenhouse, action.plotId);
      if (!result.ok) return result;
      const cropId = state.greenhouse.plots[action.plotId].cropId;
      const storedFood = Math.min(result.foodReward, Math.max(0, 100 - state.resources.food));
      state = {
        ...state,
        resources: { ...state.resources, food: state.resources.food + storedFood },
        advancedCropHarvested: state.advancedCropHarvested || cropId === "potato" || cropId === "millet",
        greenhouse: result.nextState,
      };
      notify();
      const message = storedFood === result.foodReward ? result.message
        : `${result.message} ${storedFood} Food stored. The pantry is full.`;
      return { ...result, foodReward: storedFood, message };
    }
    return fail("That greenhouse action is not available.");
  }

  return { getSnapshot: snapshot, dispatch, refresh, syncFood(food) {
    state = { ...state, resources: { ...state.resources, food } };
  }, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } };
}

export { CROP_CATALOG };