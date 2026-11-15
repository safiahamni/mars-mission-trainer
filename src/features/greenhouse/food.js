/**
 * Greenhouse crop rules for Mars Mission Trainer.
 *
 * Resource units, crop durations, and food rewards below are proposed game
 * balance values. They are not NASA measurements. This module is deliberately
 * pure: callers send returned water, power, and nutrient costs to the shared
 * controller and only
 * commit nextState after the shared controller approves the action.
 */

const DEFAULT_PLOT_IDS = ["bed-1", "bed-2", "bed-3", "bed-4"];

export const CROP_CATALOG = Object.freeze({
  greens: Object.freeze({
    id: "greens",
    name: "Leafy greens",
    icon: "🥬",
    growthSols: 1,
    foodReward: 22,
    plantingCost: Object.freeze({ water: 2, power: 2, nutrients: 1 }),
    dailyCost: Object.freeze({ water: 1, power: 1, nutrients: 1 }),
  }),
  potato: Object.freeze({
    id: "potato",
    name: "Potato",
    icon: "🥔",
    growthSols: 2,
    foodReward: 24,
    plantingCost: Object.freeze({ water: 3, power: 3, nutrients: 2 }),
    dailyCost: Object.freeze({ water: 2, power: 1, nutrients: 2 }),
    perchlorateUnlock: 30,
  }),
  millet: Object.freeze({
    id: "millet",
    name: "Millet",
    icon: "🌾",
    growthSols: 3,
    foodReward: 24,
    plantingCost: Object.freeze({ water: 2, power: 2, nutrients: 1 }),
    dailyCost: Object.freeze({ water: 1, power: 1, nutrients: 1 }),
    perchlorateUnlock: 30,
  }),
});

function emptyPlot() {
  return { cropId: null, plantedSol: null, growthSols: 0 };
}

function fail(code, message) {
  return { ok: false, code, message };
}

function validSol(sol) {
  return Number.isInteger(sol) && sol >= 1;
}

function sumCosts(plots) {
  return plots.reduce(
    (total, plot) => {
      const crop = CROP_CATALOG[plot.cropId];
      total.water += crop.dailyCost.water;
      total.power += crop.dailyCost.power;
      total.nutrients += crop.dailyCost.nutrients || 0;
      return total;
    },
    { water: 0, power: 0, nutrients: 0 },
  );
}

/** Create feature-local plot state; shared resources remain in gameState.js. */
export function createGreenhouseState(plotIds = DEFAULT_PLOT_IDS) {
  if (!Array.isArray(plotIds) || plotIds.length === 0) {
    throw new TypeError("plotIds must be a non-empty array");
  }
  if (plotIds.some((id) => typeof id !== "string" || id.length === 0)) {
    throw new TypeError("every plot ID must be a non-empty string");
  }
  if (new Set(plotIds).size !== plotIds.length) {
    throw new TypeError("plot IDs must be unique");
  }

  return {
    lastAdvancedSol: 0,
    plots: Object.fromEntries(plotIds.map((id) => [id, emptyPlot()])),
  };
}

/**
 * Prepare a planting transition. The caller checks/charges resourceCost with
 * the shared controller, then stores nextState only when that action succeeds.
 */
export function plantCrop(state, { plotId, cropId, sol }) {
  if (!validSol(sol)) return fail("invalid-sol", "Choose a valid Sol first.");
  if (!Object.hasOwn(state.plots, plotId)) {
    return fail("unknown-plot", "That growing bed does not exist.");
  }
  const crop = CROP_CATALOG[cropId];
  if (!crop) return fail("unknown-crop", "Choose a crop from the crop list.");
  if (state.plots[plotId].cropId) {
    return fail("plot-occupied", "This bed already has a crop growing.");
  }
  if (sol <= state.lastAdvancedSol) {
    return fail("sol-already-advanced", "The growing cycle for this Sol has ended.");
  }

  return {
    ok: true,
    resourceCost: { ...crop.plantingCost },
    nextState: {
      ...state,
      plots: {
        ...state.plots,
        [plotId]: { cropId, plantedSol: sol, growthSols: 0 },
      },
    },
    message: `${crop.name} planted.`,
  };
}

/**
 * Prepare one End Sol transition. All growing crops advance together only when
 * climate is suitable and the crew can afford water, power, and nutrient costs.
 * Call once for each Sol and commit nextState only after the controller accepts
 * resourceCost. Repeating the same Sol is rejected to prevent duplicate growth.
 */
export function advanceGreenhouseSol(
  state,
  { sol, waterAvailable, powerAvailable, nutrientAvailable = Number.POSITIVE_INFINITY, climateOkay = true, growthRate = 1, extraPower = 0 },
) {
  if (!validSol(sol)) return fail("invalid-sol", "Choose a valid Sol first.");
  if (sol <= state.lastAdvancedSol) {
    return fail("sol-already-advanced", "Greenhouse growth already advanced for this Sol.");
  }
  if (typeof climateOkay !== "boolean") {
    return fail("invalid-climate", "Climate status must be true or false.");
  }
  if (!Number.isFinite(growthRate) || growthRate < 0 || growthRate > 1 || !Number.isFinite(extraPower) || extraPower < 0) {
    return fail("Growth rate and light power cost must be valid numbers.", "invalid-cost");
  }
  if (!Number.isFinite(waterAvailable) || !Number.isFinite(powerAvailable) || !(Number.isFinite(nutrientAvailable) || nutrientAvailable === Number.POSITIVE_INFINITY)) {
    return fail("invalid-resources", "Current water, power, and nutrients are required.");
  }

  const growingPlots = Object.entries(state.plots).filter(([plotId, plot]) => {
    const crop = CROP_CATALOG[plot.cropId];
    return crop && plot.growthSols < crop.growthSols;
  });
  const cropCost = sumCosts(growingPlots.map(([, plot]) => plot));
  const affordable = waterAvailable >= cropCost.water && powerAvailable >= cropCost.power + extraPower && nutrientAvailable >= cropCost.nutrients;
  const canGrow = climateOkay && affordable;
  const resourceCost = {
    water: canGrow ? cropCost.water : 0,
    power: (canGrow ? cropCost.power : 0) + extraPower,
    nutrients: canGrow ? cropCost.nutrients : 0,
  };

  const plots = { ...state.plots };
  if (canGrow) {
    for (const [plotId, plot] of growingPlots) {
      plots[plotId] = { ...plot, growthSols: plot.growthSols + growthRate };
    }
  }

  let message = "No crops need care this Sol.";
  if (growingPlots.length > 0 && canGrow) {
    message = "Your growing crops made progress.";
  } else if (growingPlots.length > 0 && !climateOkay) {
    message = "Adjust the greenhouse climate before advancing crop growth.";
  } else if (growingPlots.length > 0 && !affordable) {
    message = "There is not enough water, power, or nutrients for all growing beds.";
  }

  return {
    ok: true,
    resourceCost,
    nextState: { ...state, lastAdvancedSol: sol, plots },
    growthAdvanced: canGrow,
    message,
  };
}

/** Prepare a one-time harvest transition; the controller grants foodReward. */
export function harvestCrop(state, plotId) {
  if (!Object.hasOwn(state.plots, plotId)) {
    return fail("unknown-plot", "That growing bed does not exist.");
  }
  const plot = state.plots[plotId];
  const crop = CROP_CATALOG[plot.cropId];
  if (!crop) return fail("empty-plot", "Plant a crop before harvesting.");
  if (plot.growthSols < crop.growthSols) {
    return fail("not-mature", "This crop needs more time to grow.");
  }

  return {
    ok: true,
    foodReward: crop.foodReward,
    nextState: {
      ...state,
      plots: { ...state.plots, [plotId]: emptyPlot() },
    },
    message: `${crop.name} harvested.`,
  };
}

/** Return display-ready progress without changing state. */
export function getCropProgress(state, plotId) {
  if (!Object.hasOwn(state.plots, plotId)) return null;
  const plot = state.plots[plotId];
  const crop = CROP_CATALOG[plot.cropId];
  if (!crop) return { planted: false, growthSols: 0, requiredSols: 0, progress: 0, ready: false };

  const growthSols = Math.min(plot.growthSols, crop.growthSols);
  return {
    planted: true,
    cropId: crop.id,
    growthSols,
    requiredSols: crop.growthSols,
    progress: growthSols / crop.growthSols,
    ready: growthSols >= crop.growthSols,
  };
}