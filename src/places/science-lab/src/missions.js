export const roverCosts = {safe: 10, rocky: 8};
export const missions = [
  {id:'rover-rescue', title:'Rover Rescue: The Lost Signal', points:15, power:10, minimumPower:15, supplies:{oxygen:10, water:5, food:5}, objective:'Jump over rocks, pick up the battery, and activate three beacons.'},
  {id:'mystery-rocks', title:'Mystery Rocks: The Secret Scanner', points:10, power:15, minimumPower:25, supplies:{oxygen:8, water:4, food:4}, objective:'Find three rocks and investigate them with a scanner.'},
  {id:'cosmic-claw', title:'Cosmic Claw: Grab the Sample!', points:15, power:20, minimumPower:35, supplies:{oxygen:6, water:10, food:5}, objective:'Align the sampler and collect a rock core.'},
  {id:'snapshot-safari', title:'Snapshot Safari', points:10, power:15, minimumPower:30, supplies:{oxygen:5, water:5, food:10}, objective:'Photograph the features on PIP’s list.'},
  {id:'lost-lake', title:'The Lost Lake Mystery', points:15, power:25, minimumPower:45, supplies:{oxygen:12, water:8, food:6}, objective:'Combine evidence to reconstruct Jezero’s ancient lake.'},
  {id:'message-earth', title:'Message to Earth: The Grand Discovery', points:10, power:30, minimumPower:50, supplies:{oxygen:8, water:6, food:6}, objective:'Assemble the evidence and send your report.'}
];
export function greenhouseRequirement(id, progress = {}) {
  if (id === 'snapshot-safari' && !progress.bedsUnlocked) return 'Use the Greenhouse Soil Lab to lower perchlorate below 30 and unlock the potato and millet beds.';
  if (id === 'message-earth' && !progress.advancedCropHarvested) return 'Grow and harvest potatoes or millet in the Greenhouse.';
  return '';
}

export const totalPoints = missions.reduce((sum, mission) => sum + mission.points, 0);

