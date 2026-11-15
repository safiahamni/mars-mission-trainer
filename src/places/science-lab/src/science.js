import {missions, roverCosts, greenhouseRequirement} from './missions.js';

export function createDemoController(initialPower = 80, {testMysteryRocks = false, testCosmicClaw = false, testSnapshotSafari = false, testLostLake = false, testEarth = false, sharedResources} = {}) {
  const completed = new Set();
  let power = initialPower;
  let science = 0;
  let oxygen = 50;
  let water = 30;
  let food = 40;
  const resources = () => sharedResources?.read() ?? { power, oxygen, water, food, sol: 1, radiation: null };
  function spendMission(mission, cost = mission.power) {
    if (sharedResources) return sharedResources.spendMission(mission.id, cost, mission.supplies);
    if (power < cost) return false;
    power -= cost;
    return true;
  }
  return {
    snapshot() {
      const { power, oxygen } = resources();
      return {power, oxygen, science, stars: completed.size, moxieUnlocked: completed.has('rover-rescue'), lostLakeClue: completed.has('mystery-rocks')};
    },
    availability(id) {
      const { power, oxygen, water, food } = resources();
      if (completed.has(id)) return 'Completed';
      const mission = missions.find(mission => mission.id === id);
      const minimum = mission?.minimumPower;
      if (sharedResources && resources().phase === 'night') return 'Sleep in Command Center to start the next Sol';
      if (sharedResources && mission && Object.entries(mission.supplies).some(
        ([resource, cost]) => resources()[resource] < cost
      )) return 'Top up mission supplies';
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
        if (sharedResources && greenhouseRequirement(id, resources().greenhouseProgress)) return 'Unlock Greenhouse beds';
        if (food < 50) return 'Harvest food first';
        return power >= minimum ? 'Ready' : 'Needs ' + minimum + ' Power';
      }
      if (id === 'lost-lake') {
        if (testLostLake) return power >= minimum ? 'Ready' : 'Recharge Power';
        if (!completed.has('snapshot-safari')) return 'Finish Snapshot Safari first';
        return power >= minimum && oxygen >= 65 && water >= 50 ? 'Ready' : 'Prepare habitat';
      }
      if (id === 'message-earth') {
        if (!testEarth && !missions.slice(0, 5).every(mission => completed.has(mission.id))) return 'Finish Chapters 1-5';
        if (power < minimum) return 'Needs ' + minimum + ' Power';
        if (!testEarth && sharedResources && greenhouseRequirement(id, resources().greenhouseProgress)) return 'Harvest potatoes or millet';
        return testEarth || (oxygen >= 60 && food >= 40 && water >= 40) ? 'Ready' : 'Prepare base resources';
      }
      if (id !== 'rover-rescue') return 'In development';
      if (resources().roverReady === false) return 'Repair the rover at the solar panel yard';
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
      if (!spendMission(mission)) return false;
      completed.add(mission.id);
      science += mission.points;
      return true;
    },
    completeEarth({report, repaired, received}) {
      if (!report || !repaired || !received || this.availability('message-earth') !== 'Ready') return false;
      const mission = missions[5];
      if (!spendMission(mission)) return false;
      completed.add(mission.id);
      science += mission.points;
      return true;
    },
    get samplingTarget() {
      return completed.has('mystery-rocks') ? 'rockytop' : null;
    },
    get status() { return {...this.snapshot(), maxSols:6, ...resources()}; },
    get food() { return resources().food; },
    harvestFood() {
      if (!completed.has('cosmic-claw') || food >= 50) return false;
      food = 55;
      return true;
    },
    completeSnapshotSafari(photos) {
      if (this.availability('snapshot-safari') !== 'Ready'
        || !photos.has('delta') || !photos.has('layers') || !photos.has('ripples')) return false;
      const mission = missions.find(mission => mission.id === 'snapshot-safari');
      if (!spendMission(mission)) return false;
      completed.add(mission.id);
      science += mission.points;
      return true;
    },
    get water() { return resources().water; },
    recycleWater() {
      if (!this.samplingTarget || water >= 40) return false;
      water = 55;
      return true;
    },
    completeCosmicClaw(sample) {
      if (this.availability('cosmic-claw') !== 'Ready'
        || sample?.target !== (this.samplingTarget ?? (testCosmicClaw ? 'rockytop' : null)) || !sample.cored || !sample.sealed) return false;
      const mission = missions.find(mission => mission.id === 'cosmic-claw');
      if (!spendMission(mission)) return false;
      completed.add(mission.id);
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
      if (!spendMission(mission)) return false;
      completed.add(mission.id);
      science += mission.points;
      return true;
    },
    complete(id, route) {
      const cost = route?.routeName === 'rocky' ? roverCosts.rocky : roverCosts.safe;
      if (id !== 'rover-rescue' || completed.has(id) || !route?.finished || this.availability(id) !== 'Ready') return false;
      const mission = missions[0];
      if (!spendMission(mission, cost)) return false;
      completed.add(id);
      science += mission.points;
      return true;
    }
  };
}

