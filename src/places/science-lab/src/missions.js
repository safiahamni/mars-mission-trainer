export const roverCosts = {safe: 10, rocky: 8};
export const missions = [
  {id:'rover-rescue', title:'Rover Rescue: The Lost Signal', points:15, power:10, minimumPower:15, objective:'Jump over rocks, pick up the battery, and activate three beacons.'},
  {id:'mystery-rocks', title:'Mystery Rocks: The Secret Scanner', points:10, power:15, minimumPower:25, objective:'Find three rocks and investigate them with a scanner.'},
  {id:'cosmic-claw', title:'Cosmic Claw: Grab the Sample!', points:15, power:20, minimumPower:35, objective:'Align the sampler and collect a rock core.'},
  {id:'snapshot-safari', title:'Snapshot Safari', points:10, power:15, minimumPower:30, objective:'Photograph the features on PIP’s list.'},
  {id:'lost-lake', title:'The Lost Lake Mystery', points:15, power:25, minimumPower:45, objective:'Combine evidence to reconstruct Jezero’s ancient lake.'},
  {id:'message-earth', title:'Message to Earth: The Grand Discovery', points:10, power:30, minimumPower:50, objective:'Assemble the evidence and send your report.'}
];
export const totalPoints = missions.reduce((sum, mission) => sum + mission.points, 0);

