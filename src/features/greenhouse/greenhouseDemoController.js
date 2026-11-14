/** A temporary local adapter for demonstrating the greenhouse before gameController.js exists. */
import {
  advanceGreenhouseSol,
  createGreenhouseState,
  harvestCrop,
  plantCrop,
  CROP_CATALOG,
} from "./food.js";

const MAX_RESOURCE = 100;

export function createGreenhouseDemoController() {
  let state = {
    sol: 1,
    resources: { power: 64, water: 67, food: 72 },
    cropHealth: 92,
    climate: { temperature: 22, light: 70 },
    greenhouse: createGreenhouseState(),
  };
  const listeners = new Set();

  function snapshot() {
    return {
      ...state,
      resources: { ...state.resources },
      climate: { ...state.climate },
      greenhouse: {
        ...state.greenhouse,
        plots: Object.fromEntries(
          Object.entries(state.greenhouse.plots).map(([id, plot]) => [id, { ...plot }]),
        ),
      },
    };
  }

  function notify() {
    const current = snapshot();
    listeners.forEach((listener) => listener(current));
  }

  function dispatch(action) {
    if (action.type === "set-climate") {
      state = { ...state, climate: { ...state.climate, ...action.climate } };
      notify();
      return { ok: true, message: "Climate settings updated." };
    }

    if (action.type === "plant") {
      const result = plantCrop(state.greenhouse, {
        plotId: action.plotId,
        cropId: action.cropId,
        sol: state.sol,
      });
      if (!result.ok) return result;
      if (
        state.resources.water < result.resourceCost.water ||
        state.resources.power < result.resourceCost.power
      ) {
        return { ok: false, code: "insufficient-resources", message: "There is not enough water or power for that crop." };
      }
      state = {
        ...state,
        resources: {
          ...state.resources,
          water: state.resources.water - result.resourceCost.water,
          power: state.resources.power - result.resourceCost.power,
        },
        greenhouse: result.nextState,
      };
      notify();
      return result;
    }

    if (action.type === "end-sol") {
      if (state.sol >= 7) {
        return { ok: false, code: "final-sol", message: "You have reached the final Sol." };
      }
      const climateOkay =
        state.climate.temperature >= 16 &&
        state.climate.temperature <= 28 &&
        state.climate.light >= 25 &&
        state.climate.light <= 75;
      const result = advanceGreenhouseSol(state.greenhouse, {
        sol: state.sol,
        waterAvailable: state.resources.water,
        powerAvailable: state.resources.power,
        climateOkay,
      });
      if (!result.ok) return result;
      const grew = result.growthAdvanced;
      state = {
        ...state,
        sol: state.sol + 1,
        resources: {
          ...state.resources,
          water: state.resources.water - result.resourceCost.water,
          power: state.resources.power - result.resourceCost.power,
        },
        cropHealth: grew ? Math.min(MAX_RESOURCE, state.cropHealth + 2) : Math.max(0, state.cropHealth - 8),
        greenhouse: result.nextState,
      };
      notify();
      return {
        ...result,
        message: grew || Object.values(state.greenhouse.plots).every((plot) => !plot.cropId)
          ? `Sol ${state.sol} begins. ${result.message}`
          : `Sol ${state.sol} begins. ${result.message}`,
      };
    }

    if (action.type === "harvest") {
      const result = harvestCrop(state.greenhouse, action.plotId);
      if (!result.ok) return result;
      if (state.resources.food + result.foodReward > MAX_RESOURCE) {
        return { ok: false, code: "food-storage-full", message: "Food storage is too full for this harvest." };
      }
      state = {
        ...state,
        resources: { ...state.resources, food: state.resources.food + result.foodReward },
        greenhouse: result.nextState,
      };
      notify();
      return result;
    }

    return { ok: false, code: "unknown-action", message: "That greenhouse action is not available." };
  }

  return {
    getSnapshot: snapshot,
    dispatch,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export { CROP_CATALOG };
