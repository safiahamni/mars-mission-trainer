import {missions, roverCosts} from './missions.js';

export function createDemoController(initialPower = 80, {testMysteryRocks = false, testCosmicClaw = false, testSnapshotSafari = false, testLostLake = false, testEarth = false} = {}) {
  const completed = new Set();
  let power = initialPower;
  let science = 0;
  let oxygen = 50;
  let water = 30;
  let food = 40;
  return {
    snapshot() {
      return {power, oxygen, science, stars: completed.size, moxieUnlocked: completed.has('rover-rescue'), lostLakeClue: completed.has('mystery-rocks')};
    },
    availability(id) {
      if (completed.has(id)) return 'Completed';
      const minimum = missions.find(mission => mission.id === id)?.minimumPower;
      if (id === 'mystery-rocks') {
        if (testMysteryRocks) return 'Ready';
        if (!completed.has('rover-rescue')) return 'Finish Rover Rescue first';
        if (power < minimum) return 'Needs ' + minimum + ' Power';
        return oxygen >= 60 ? 'Ready' : 'Refill Oxygen with MOXIE';
      }
      if (id === 'cosmic-claw') {
        if (testCosmicClaw) return 'Ready';
        if (!this.samplingTarget) return 'Finish Mystery Rocks first';
        if (power < minimum) return 'Needs ' + minimum + ' Power';
        return water >= 40 ? 'Ready' : 'Run the Water Recycler';
      }
      if (id === 'snapshot-safari') {
        if (testSnapshotSafari) return 'Ready';
        if (!completed.has('cosmic-claw')) return 'Finish Cosmic Claw first';
        if (food < 50) return 'Harvest food first';
        return power >= minimum ? 'Ready' : 'Needs ' + minimum + ' Power';
      }
      if (id === 'lost-lake') {
        if (testLostLake) return power >= minimum ? 'Ready' : 'Recharge Power';
        if (!completed.has('snapshot-safari')) return 'Finish Snapshot Safari first';
        return power >= minimum && oxygen >= 65 && water >= 50 ? 'Ready' : 'Prepare habitat';
      }
      if (id === 'message-earth') {
        if (!testEarth && !missions.slice(0, 5).every(mission => completed.has(mission.id))) return 'Finish Chapters 1?5';
        if (power < minimum) return 'Needs ' + minimum + ' Power';
        return testEarth || (oxygen >= 60 && food >= 40 && water >= 40) ? 'Ready' : 'Prepare base resources';
      }
      if (id !== 'rover-rescue') return 'In development';
      return power >= minimum ? 'Ready' : 'Insufficient power';
    },
    prepareLostLake() {
      if (!completed.has('snapshot-safari') || completed.has('lost-lake')) return false;
      power = Math.max(power, 50);
      oxygen = Math.max(oxygen, 70);
      water = Math.max(water, 55);
      return true;
    },
    completeLostLake({mapped, matched, rebuilt} = {}) {
      if (!mapped || matched !== 3 || !rebuilt || this.availability('lost-lake') !== 'Ready') return false;
      const mission = missions.find(mission => mission.id === 'lost-lake');
      completed.add(mission.id);
      power -= mission.power;
      science += mission.points;
      return true;
    },
    completeEarth({report, repaired, received}) {
      if (!report || !repaired || !received || this.availability('message-earth') !== 'Ready') return false;
      const mission = missions[5];
      completed.add(mission.id);
      power -= mission.power;
      science += mission.points;
      return true;
    },
    get samplingTarget() {
      return completed.has('mystery-rocks') ? 'rockytop' : null;
    },
    get status() { return {...this.snapshot(), water, food, sol:1, maxSols:7, radiation:null}; },
    get food() { return food; },
    harvestFood() {
      if (!completed.has('cosmic-claw') || food >= 50) return false;
      food = 55;
      return true;
    },
    completeSnapshotSafari(photos) {
      if (this.availability('snapshot-safari') !== 'Ready'
        || !photos.has('delta') || !photos.has('layers') || !photos.has('ripples')) return false;
      const mission = missions.find(mission => mission.id === 'snapshot-safari');
      if (power < mission.power) return false;
      completed.add(mission.id);
      power -= mission.power;
      science += mission.points;
      return true;
    },
    get water() { return water; },
    recycleWater() {
      if (!this.samplingTarget || water >= 40) return false;
      water = 55;
      return true;
    },
    completeCosmicClaw(sample) {
      if (this.availability('cosmic-claw') !== 'Ready'
        || sample?.target !== (this.samplingTarget ?? (testCosmicClaw ? 'rockytop' : null)) || !sample.cored || !sample.sealed) return false;
      const mission = missions.find(mission => mission.id === 'cosmic-claw');
      if (power < mission.power) return false;
      completed.add(mission.id);
      power -= mission.power;
      science += mission.points;
      return true;
    },
    runMoxie() {
      if (!completed.has('rover-rescue') || oxygen >= 60 || power < 5) return false;
      power -= 5;
      oxygen = 70;
      return true;
    },
    completeMysteryRocks(identified) {
      if (this.availability('mystery-rocks') !== 'Ready' || !['layers', 'crystals', 'spots'].every(id => identified.has(id))) return false;
      const mission = missions.find(mission => mission.id === 'mystery-rocks');
      if (power < mission.power) return false;
      completed.add(mission.id);
      power -= mission.power;
      science += mission.points;
      return true;
    },
    complete(id, route) {
      const cost = route?.routeName === 'rocky' ? roverCosts.rocky : roverCosts.safe;
      if (id !== 'rover-rescue' || completed.has(id) || !route?.finished || this.availability(id) !== 'Ready') return false;
      const mission = missions[0];
      completed.add(id);
      power -= cost;
      science += mission.points;
      return true;
    }
  };
}

