import {createAvatar} from './avatar.js';
import {missions, totalPoints, roverCosts, greenhouseRequirement} from './missions.js';
import {facts} from './scienceFacts.js';
import {createDemoController} from './science.js';
import {directions} from './rover.js';

const sharedResources = window.parent !== window && new URLSearchParams(location.search).has('embedded')
  ? window.parent.MarsScienceResources : undefined;
const controller = createDemoController(80, { sharedResources });
window.addEventListener('mars-science:refresh', () => renderBoard());
const byId = id => document.getElementById(id);

let labAudio;
let muted = false;
try { muted = localStorage.getItem('mars-science-muted') === 'true'; } catch {}
const soundToggle = document.createElement('button');
soundToggle.className = 'lab-sound';
soundToggle.type = 'button';
function updateSoundToggle() {
  soundToggle.textContent = muted ? 'Sound off' : 'Sound on';
  soundToggle.setAttribute('aria-label', 'Science Lab sound');
  soundToggle.setAttribute('aria-pressed', String(!muted));
}
updateSoundToggle();
document.querySelector('.journal-launcher').append(soundToggle);
soundToggle.onclick = () => {
  muted = !muted;
  try { localStorage.setItem('mars-science-muted', String(muted)); } catch {}
  updateSoundToggle();
  if (!muted) void labSound('discovery');
};

const labCues = {
  tap:[440], page:[260,320,245], photo:[880,660],
  discovery:[523,659,784], match:[659,784], jump:[310,530], bump:[190,135]
};
async function labSound(cue) {
  if (muted || !window.AudioContext) return;
  try {
    labAudio ??= new AudioContext();
    if (labAudio.state !== 'running') await labAudio.resume();
    if (muted) return;
    labCues[cue].forEach((pitch, index) => {
      const tone = labAudio.createOscillator();
      const gain = labAudio.createGain();
      const start = labAudio.currentTime + index * .09;
      tone.frequency.value = pitch;
      gain.gain.setValueAtTime(.105, start);
      gain.gain.exponentialRampToValueAtTime(.001, start + .13);
      tone.connect(gain).connect(labAudio.destination);
      tone.start(start);
      tone.stop(start + .14);
    });
  } catch {}
}

document.addEventListener('click', event => {
  if (!event.isTrusted) return;
  const control = event.target.closest('button, summary, input[type="radio"]');
  if (!control || control.disabled || control === soundToggle) return;
  if (control.id === 'scan' || control.closest('.signal-console')) return;
  labSound(control.matches('#science-collection, #journal-prev, #journal-next, #journal-trail button, .journal-sheet .keepsake-print, #keepsakes form button, #keepsake-view form button') ? 'page' : 'tap');
}, {capture:true});

const chapter = missions[0];
const avatar = createAvatar(byId('base-map'));
avatar.el.setAttribute('aria-hidden', 'true');
let walkTimer;
let route;
const embedded = window.parent !== window && new URLSearchParams(location.search).has('embedded');
let area = embedded ? 'lab' : 'base';
let enteringLab = false;
const baseSpawn = {x:5, y:5};
let astronaut = {...baseSpawn};
const rooms = [
  ['Power',1,1], ['Med / Fitness',5,1], ['Radiation Shelter',9,1],
  ['Central Habitat',1,4], ['Start Hub',5,4], ['Science Lab',9,4],
  ['Greenhouse',1,7], ['EVA / Airlock',5,7], ['Life Support',9,7]
];

function drawWorld() {
  const base = area === 'base';
  byId('hud-location').textContent = base ? 'Mars Base' : 'Science Lab';
  byId('base').hidden = !base;
  byId('leave-lab').hidden = base;
  byId('lab').hidden = base;
  if (base && !byId('base-map').querySelector('.building')) {
    byId('base-map').replaceChildren(...rooms.map(([name,x,y], index) => {
      const room = element(index === 5 ? 'button' : 'div', name);
      if (index === 5) room.onclick = enterLab;
      room.className = 'building building-' + index;
      room.style.setProperty('--x', x);
      room.style.setProperty('--y', y);
      return room;
    }));
  }
  const scene = byId('base-map');
  if (avatar.el.parentElement !== scene) scene.append(avatar.el);
  avatar.el.style.left = ((astronaut.x + .5) * 100 / 11) + '%';
  avatar.el.style.top = ((astronaut.y + .65) * 100 / 9) + '%';
  const near = nearInteraction();
  byId('objective').textContent = base
    ? near ? 'E · Enter Science Lab' : 'PIP: Select the purple Science Lab.'
    : '';
  byId('interact').hidden = !base;
  byId('interact').disabled = !near;
}

function nearInteraction() {
  return area === 'base' && astronaut.x === 9 && astronaut.y === 5;
}

function enterLab() {
  if (enteringLab || area !== 'base') return;
  enteringLab = true;
  astronaut = {x:9,y:5};
  avatar.faceToward(0,-1);
  drawWorld();
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function open() {
    area = 'lab';
    enteringLab = false;
    avatar.el.classList.remove('entering-lab');
    avatar.setWalking(false);
    drawWorld();
    byId('stations').firstElementChild.focus();
  }
  if (reduceMotion) { open(); return; }
  avatar.setWalking(true);
  requestAnimationFrame(() => {
    avatar.el.classList.add('entering-lab');
    setTimeout(open, 360);
  });
}

function interact() {
  if (nearInteraction() && !route) enterLab();
}

byId('leave-lab').onclick = () => {
  if (embedded) {
    window.parent.postMessage('mars-science:leave', location.origin);
    return;
  }
  area = 'base';
  drawWorld();
  byId('base-map').querySelector('button').focus();
};

function walk(direction) {
  if (area !== 'base' || enteringLab) return;
  const [dx,dy] = directions[direction];
  const x = astronaut.x + dx;
  const y = astronaut.y + dy;
  if (x < 0 || x > 10 || y < 0 || y > 8) return;
  if (area === 'base' && !([2,5,8].includes(y) || [3,7].includes(x))) return;
  avatar.faceToward(dx, dy);
  avatar.setWalking(true);
  clearTimeout(walkTimer);
  walkTimer = setTimeout(() => avatar.setWalking(false), 200);
  astronaut = {x,y};
  drawWorld();
}

byId('interact').onclick = interact;

function element(tag, value) {
  const node = document.createElement(tag);
  node.textContent = value;
  return node;
}

const chapterIcons = ['🛞', '🪨', '🦾', '📷', '💧', '📡'];
const chapterTopics = ['Rover navigation and terrain mapping', 'Rover instruments study rocks', 'Careful positioning and sampling', 'Rover cameras document Mars', 'Evidence of ancient rivers and lakes', 'Scientists share their findings'];

// Shared resource targets for the planned chapters.
const readiness = [
  [['power','Power to launch',null]],
  [['power','Power to launch',null], ['oxygen','Oxygen','60+']],
  [['power','Power to launch',null], ['water','Water','40+']],
  [['power','Power to launch',null], ['food','Food','50+']],
  [['power','Power to launch',null], ['oxygen','Oxygen','65+'], ['water','Water','50+'], ['radiation','Radiation','EVA clearance if needed']],
  [['power','Power to launch',null], ['oxygen','Oxygen','60+'], ['food','Food','40+'], ['water','Water','40+'], ['science','Science','Required discoveries']]
];
const resourceShapes = {
  power:'<path d="M13 2 5 14h6l-1 8 9-13h-7z"/>',
  oxygen:'<rect x="6" y="5" width="12" height="16" rx="5"/><path d="M10 3h4M9 13h6"/>',
  water:'<path d="M12 3c-3 5-7 8-7 12a7 7 0 0 0 14 0c0-4-4-7-7-12z"/>',
  food:'<path d="M12 21v-9m0 4C5 16 4 11 4 7c6 0 8 4 8 7 0-6 3-9 8-10 0 7-2 10-8 10"/>',
  radiation:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/>',
  science:'<path d="M9 3h6m-5 0v7l-5 9a1 1 0 0 0 1 2h12a1 1 0 0 0 1-2l-5-9V3M8 15h8"/>'
};
const statShapes = {
  science: resourceShapes.science,
  power: resourceShapes.power,
  star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>'
};

function statIcon(kind) {
  const icon = element('span', '');
  icon.className = 'stat-icon';
  icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">' + statShapes[kind] + '</svg>';
  return icon;
}

function readinessBadge([kind, name, value, current]) {
  const item = element('li', '');
  item.dataset.resource = kind;
  const icon = element('span', '');
  icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + resourceShapes[kind] + '</svg>';
  const heading = element('div', '');
  heading.className = 'readiness-heading';
  heading.append(icon, element('strong', name));
  item.append(heading);
  if (typeof current === 'number') {
    const target = Number.parseInt(value, 10);
    const meter = element('progress', '');
    meter.max = 100;
    meter.value = current;
    const track = element('div', '');
    track.className = 'readiness-track';
    track.style.setProperty('--minimum', target + '%');
    track.append(meter);
    meter.setAttribute('aria-label', name + ' reserve out of 100');
    const ready = current >= target;
    item.dataset.ready = ready;
    item.append(track, element('small', current + ' now / ' + target + ' needed'),
      element('strong', ready ? '\u2713 Ready' : '+' + (target - current) + ' needed'));
  } else {
    item.append(element('small', value.endsWith('+') ? value.slice(0, -1) + ' required' : value));
  }
  return item;
}

const chapterBriefings = [
  ["Three research relays have lost their signals near Jezero Crater! Guide our rover across the rocky terrain, restore the signals, and keep an eye out for exciting discoveries.", "Beep beep! Three missing signals and a whole planet to explore! Let's go, Commander!"],
  ["Remember the unusual rock we discovered during our rover expedition? We've identified two more interesting rock targets! Use our scientific instruments to investigate all three and find clues for our next sampling mission.", "Three mysterious rocks?! Detective PIP is ready! Let's uncover their secrets!"],
  ["Your rock investigation helped us identify promising sampling targets! Prepare the habitat's water supply and power the robotic equipment, then carefully collect and secure a rock core.", "Steady hands, Commander! We've found our rock, and now it's time to collect a sample!"],
  ["We've collected our rock sample, but we still need to investigate the surrounding landscape! Prepare the crew's food supplies, restore the rover's photographs, and search for geological clues.", "Say cheeeeese, Mars! Let's put those pictures together and discover what they're hiding!"],
  ["Your discoveries suggest that Jezero Crater once held an ancient lake! Check the habitat's resources and radiation conditions, then connect your evidence to reconstruct what Mars may have looked like billions of years ago.", "Wait... a LAKE on Mars?! Let's connect our clues and bring ancient Jezero back to life!"],
  ["You've completed an incredible scientific journey! Organize your discoveries, prepare the Mars Base, restore our communication terminal, and send your final research report to Earth.", "WE DID IT! One last mission, Commander! Let's send our amazing discoveries all the way to Earth!"]
];

let selectedChapter;
function previewChapter(mission, index, availability) {
  selectedChapter = mission;
  const [message, reaction] = chapterBriefings[index];
  byId('preview-brief').textContent = 'Dear Junior Astronaut, ' + message;
  byId('preview-pip').textContent = reaction;
  const preview = byId('chapter-preview');
  byId('lake-prep').hidden = embedded || availability !== 'Prepare habitat';
  byId('greenhouse-prep').hidden = embedded || availability !== 'Harvest food first';
  byId('recycle-water').hidden = embedded || availability !== 'Run the Water Recycler';
  byId('run-moxie').hidden = embedded || availability !== 'Refill Oxygen with MOXIE';
  byId('preview-number').textContent = chapterIcons[index] + ' · Chapter ' + (index + 1);
  byId('preview-title').textContent = mission.title;
  const objectiveIcon = element('span', chapterIcons[index]);
  objectiveIcon.setAttribute('aria-hidden', 'true');
  byId('preview-objective').replaceChildren(objectiveIcon, element('span', mission.objective));
  byId('preview-science').textContent = 'NASA science · ' + chapterTopics[index];
  byId('preview-reward').textContent = '+' + mission.points + ' Science';
  const state = controller.snapshot();
  const requirements = readiness[index].map(([kind, name, value]) => {
    if (kind === 'power') value = mission.minimumPower + '+';
    if (index > 5 || !String(value).endsWith('+')) return [kind, name, value];
    return [kind, name, value, kind === 'water' ? controller.water : kind === 'food' ? controller.food : state[kind]];
  });
  if (sharedResources) {
    for (const [kind, cost] of Object.entries(mission.supplies)) {
      if (!requirements.some(([resource]) => resource === kind)) {
        const label = kind[0].toUpperCase() + kind.slice(1);
        requirements.push([kind, label, cost + '+', controller.status[kind]]);
      }
    }
  }
  if (index > 0 && controller.availability(missions[index - 1].id) !== 'Completed') {
    requirements.unshift(['science', 'Prerequisite', 'Finish Chapter ' + index]);
  }
  byId('chapter-requirements').replaceChildren(...requirements.map(readinessBadge));
  const reminder = byId('readiness-message');
  reminder.hidden = availability === 'Completed';
  const tasks = [];
  const greenhouseTask = sharedResources && greenhouseRequirement(mission.id, controller.status.greenhouseProgress);
  if (greenhouseTask && availability !== 'Completed') tasks.push(greenhouseTask);
  const stationDirections = {
    power: 'Clean all three solar panels, then use the Command Center bunks to recharge the battery the next morning.',
    oxygen: 'Visit Life Support and run the oxygen challenge or MOXIE.',
    water: 'Visit Life Support and repair the Water Recycler.',
    food: 'Visit Greenhouse and harvest crops.'
  };
  for (const [kind, name, required, current] of requirements) {
    if (kind === 'science') tasks.push(required + ' first.');
    if (current < Number(String(required).replace('+', '')) && stationDirections[kind]) {
      tasks.push(name + ' needs ' + (Number.parseInt(required, 10) - current) + ' more. ' + stationDirections[kind]);
    }
  }
  if (index === 4) tasks.push('Check the base map radiation alert before going outside.');
  const advice = [
    'The rover is ready to launch.', 'Scanner ready! Your crew has enough oxygen and power.',
    'Charge the sampler and run the Water Recycler before heading out.',
    'Recharge the rover camera and harvest food in the Greenhouse.',
    'Stock the habitat and check the radiation alert before any EVA.',
    'Stock the habitat, gather your discoveries, and power the transmitter.'
  ];
  byId('readiness-copy').textContent = tasks.length ? tasks.join(' ') : advice[index];
  const costs = byId('mission-costs');
  costs.hidden = !sharedResources || availability === 'Completed';
  costs.replaceChildren();
  if (!costs.hidden) {
    const powerCost = index === 0 ? roverCosts.rocky + '\u2013' + roverCosts.safe : mission.power;
    const tiles = element('ul', '');
    for (const [kind, cost] of Object.entries({ power: powerCost, ...mission.supplies })) {
      const tile = element('li', '');
      tile.dataset.resource = kind;
      const icon = element('span', '');
      icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + resourceShapes[kind] + '</svg>';
      tile.append(icon, element('strong', '\u2212' + cost), element('small', kind));
      tiles.append(tile);
    }
    costs.append(element('h4', 'Used on completion'), tiles);
  }
  byId('preview-status').textContent = availability === 'Ready' ? '' :
    availability === 'In development' ? 'Chapter preview' : availability;
  preview.dataset.state = availability;
  byId('preview-play').hidden = availability !== 'Ready';
  if (index === 2 && controller.samplingTarget) {
    byId('readiness-copy').textContent += ' Your field target will be shown at launch.';
  }
  preview.showModal();
}

byId('preview-play').onclick = () => {
  if (controller.availability(selectedChapter.id) !== 'Ready') return;
  byId('chapter-preview').close();
  if (selectedChapter.id === 'mystery-rocks') startScanner();
  else if (selectedChapter.id === 'cosmic-claw') startClaw();
  else if (selectedChapter.id === 'snapshot-safari') startSafari();
  else if (selectedChapter.id === 'message-earth') startEarth();
  else if (selectedChapter.id === 'lost-lake') startLake();
  else byId('prep').showModal();
};

function powerSpent(mission) {
  return '-' + mission.power + ' Power (' + controller.snapshot().power + ' left)';
}

function renderBoard() {
  const state = controller.snapshot();
  byId('stations').replaceChildren(...missions.map((mission, index) => {
    const button = element('button', '');
    button.className = 'chapter-choice';
    const icon = element('span', chapterIcons[index]);
    icon.className = 'chapter-icon';
    icon.setAttribute('aria-hidden', 'true');
    const availability = controller.availability(mission.id);
    button.dataset.state = availability;
    const status = availability === 'Completed' ? '✓ Done' : availability === 'In development' ? 'Locked' : availability;
    const number = element('small', 'Chapter ' + (index + 1));
    number.className = 'chapter-number';
    const reward = element('span', '+' + mission.points + ' Science');
    reward.className = 'chapter-reward';
    const badge = element('small', status === 'Ready' ? 'Ready to play' : status === 'Unlocked - in development' ? 'Unlocked' : status);
    badge.className = 'chapter-badge';
    const star = element('span', '');
    star.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.5 3 6.1 6.7 1-4.8 4.7 1.1 6.7-6-3.2-6 3.2 1.1-6.7-4.8-4.7 6.7-1z"/></svg>';
    star.setAttribute('role', 'img');
    star.className = 'chapter-star';
    star.setAttribute('aria-label', availability === 'Completed' ? 'Star earned' : 'Star not earned');
    button.append(number, reward, star, icon, element('strong', mission.title.split(': ')[0]), badge);
    button.onclick = () => previewChapter(mission, index, availability);
    return button;
  }));
  const meter = element('progress', '');
  meter.max = totalPoints;
  meter.value = state.science;
  meter.setAttribute('aria-label', 'Science progress');
  const dots = element('span', '');
  dots.className = 'chapter-dots';
  for (const [index, mission] of missions.entries()) {
    const dot = element('span', index + 1);
    const availability = controller.availability(mission.id);
    dot.dataset.state = availability;
    dot.setAttribute('aria-label', 'Chapter ' + (index + 1) + ' ' + availability);
    dots.append(dot);
  }
  const scienceLabel = element('strong', state.science + ' / ' + totalPoints);
  const stars = element('strong', String(state.stars));
  stars.prepend(statIcon('star'));
  stars.setAttribute('aria-label', state.stars + ' stars earned');
  byId('hud').replaceChildren(statIcon('science'), scienceLabel, stars, meter, dots);
  const status = controller.status;
  const bar = byId('base-status');
  const sol = element('div', '');
  sol.className = 'hud-sol';
  sol.append(element('span', 'Sol'), element('strong', status.sol + ' / ' + status.maxSols));
  bar.replaceChildren(sol);
  for (const name of ['power','oxygen','water','food']) {
    const card = element('div', '');
    card.dataset.resource = name;
    const gauge = element('progress', '');
    gauge.max = 100;
    gauge.value = status[name];
    gauge.setAttribute('aria-label', name + ' reserve');
    const label = element('div', '');
    label.className = 'hud-resource-label';
    const icon = element('span', '');
    icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + resourceShapes[name] + '</svg>';
    label.append(icon, element('span', name), element('strong', status[name]));
    card.append(label, gauge);
    if (name === 'oxygen') {
      const moxie = element('small', state.moxieUnlocked ? 'MOXIE on hand' : 'MOXIE locked');
      card.append(moxie);
    }
    bar.append(card);
  }
  const hazard = element('div', '');
  hazard.dataset.resource = 'radiation';
  const hazardLabel = element('span', 'Radiation');
  const hazardValue = element('strong', typeof status.radiation === 'number' ? Math.round(status.radiation) : '\u2014');
  hazardValue.title = typeof status.radiation === 'number' ? 'Radiation level' : 'Radiation data unavailable';
  hazard.append(hazardLabel, hazardValue);
  bar.append(hazard);
}

const sectors = [
  {start:0, name:'Jezero approach', speed:112},
  {start:1450, name:'Crater rim', speed:128},
  {start:2850, name:'Delta channels', speed:140},
  {start:4250, name:'Research traverse', speed:152}
];
const course = [
  {x:230, kind:'rock'}, {x:440, kind:'rock'}, {x:685, kind:'battery'},
  {x:900, kind:'rock'}, {x:1030, kind:'rock'}, {x:1370, kind:'beacon'},
  {x:1610, kind:'rock'}, {x:1745, kind:'rock'}, {x:1950, kind:'rock'},
  {x:2085, kind:'rock'}, {x:2320, kind:'rock'}, {x:2480, kind:'rock'},
  {x:2770, kind:'beacon'},
  {x:3010, kind:'rock'}, {x:3150, kind:'rock'}, {x:3290, kind:'rock'},
  {x:3500, kind:'rock'}, {x:3650, kind:'rock'}, {x:3790, kind:'rock'},
  {x:4100, kind:'beacon'},
  {x:4450, kind:'rock'}, {x:4595, kind:'rock'}, {x:4740, kind:'rock'},
  {x:4970, kind:'rock'}, {x:5115, kind:'rock'}, {x:5260, kind:'rock'},
  {x:5600, kind:'site'}
];
const relayClues = [
  'Map the terrain. Images taken from orbit help rover teams spot steep slopes and plan safer routes.',
  'Read the rock layers. Stacked sediment helps scientists work out how the landscape changed over time.',
  'Find the ancient delta. Its fan shape and layered deposits are clues that a river once flowed into Jezero’s lake.'
];
const finishX = course.at(-1).x;
const stormStart = 3260;
const stormEnd = 3960;

let frame;
const routeSpeed = {safe: .8, rocky: 1};
const captureTime = {shield:850, battery:1500, signal:2300};
let driveSeconds = 0;
function driveEstimate(routeName) {
  return Math.round(sectors.reduce((seconds, sector, index) =>
    seconds + ((sectors[index + 1]?.start ?? finishX) - sector.start) / sector.speed, 0) / routeSpeed[routeName]);
}
for (const badge of document.querySelectorAll('[data-drive-time]')) {
  badge.textContent = '~' + driveEstimate(badge.dataset.driveTime) + ' s / ' + roverCosts[badge.dataset.driveTime] + ' Power';
}
function hideCaptureRing() {
  byId('capture-ring').hidden = true;
}
let lastTime;
let checkpoint;
let plan;
let scan;
let scanTimer;
let relayHighlightTimer;
let learnedJump = false;
let resumeOnClose = false;
const scanSites = [1160, 2200, 3570];
let nextScanSite;
let scannedRock;
const rockSamples = [
  {id:'skinner-ridge', name:'Skinner Ridge', photo:'PIA24927', credit:'NASA/JPL-Caltech/ASU/MSSS', alt:'Two cylindrical rock cores inside Perseverance’s drill', slug:'rock-cores-from-skinner-ridge', fact:'Perseverance drilled two chalk-sized cores here. Scientists think water carried some of the material into Jezero from far away.'},
  {id:'berea', name:'Berea', photo:'PIA25688', credit:'NASA/JPL-Caltech', alt:'Berea outcrop with a drill hole and a circular abrasion patch', slug:'perseverance-samples-berea', fact:'Look for the drill hole and the flat circular patch. Perseverance drilled out a core and wore away the surface at a nearby spot to expose fresh rock.'},
  {id:'rockytop', name:'Rockytop', photo:'PIA24925', credit:'NASA/JPL-Caltech/ASU/MSSS', alt:'Layered cliff face at Skinner Ridge photographed by Perseverance', slug:'perseverance-workspace-at-skinner-ridge', fact:'Rockytop is a layered rock unit above Skinner Ridge. Its sedimentary layers are part of the ancient delta where a river once flowed into a lake.'}
];

function bypass(item) {
  return plan.route === 'safe' && item.kind === 'rock'
    && [1030,1745,2085,3150,3650,4595,5115].includes(item.x);
}


const floor = 177;

function renderRoute() {
  byId('drive-clock').textContent = Math.floor(driveSeconds) + ' s driving / ~' + driveEstimate(plan.route) + ' s route';
  const ctx = byId('maze').getContext('2d');
  const target = course.find(item => item.x >= route.x && item.x - route.x < 105 && !bypass(item));
  const hint = byId('float-hint');
  const labels = {rock:'↑ Jump over the rock!', battery:'⚡ Collect energy!', beacon:'Restore the relay!'};
  const label = route.running ? labels[target?.kind] || (!learnedJump ? 'SPACE · Jump!' : '') : 'SPACE · Drive!';
  hint.textContent = scan === 'offered' || scan === 'scanning' ? '' : label;
  hint.style.left = Math.max(25, Math.min(78, target && route.running ? (target.x - route.x + 64) / 3.52 : 26)) + '%';

  function box(color,x,y,w,h) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x),Math.round(y),w,h);
  }
  const sector = sectors.findLast(entry => route.x >= entry.start);
  const storm = route.x >= stormStart && route.x < stormEnd;
  box(storm ? '#604779' : '#403758',0,0,352,240);
  box('#895573',0,42,352,65);
  box('#e89377',0,95,352,55);
  box('#e99874',245,42,42,42);
  box('#ffcf88',252,48,28,30);
  box('#ffcf88',258,43,16,40);
  for (let i=0;i<12;i++) {
    const x = ((i*83-route.x*.25)%498+498)%498-73;
    box('#b46469',x,122-(i%3)*7,72,60);
    box('#b46469',x+12,111-(i%3)*7,48,18);
  }
  box('#8f4a4c',0,floor,352,63);
  box('#ffb27d',0,floor,352,4);
  for (let i=0;i<20;i++) {
    const x = ((i*39-route.x)%390+390)%390-18;
    box('#c6725d',x,185+(i%4)*9,10,3);
  }
  for (const item of course) {
    if (route.collected.has(item.x) || bypass(item)) continue;
    const x=item.x-route.x+64;
    if (x < -24 || x > 370) continue;
    if (item.kind === 'rock') {
      box('#67394a',x-9,floor-17,18,17);
      box('#e08b70',x-6,floor-20,11,7);
    } else if (item.kind === 'site') {
      box('#e7dbc7',x,floor-48,3,48);
      box('#71f7cd',x+3,floor-48,22,13);
    } else {
      box('#452e47',x-8,floor-21,16,21);
      box(item.kind === 'battery' ? '#ffda66' : '#79f5dc',x-5,floor-18,10,12);
      box('#fff1ae',x-2,floor-24,4,4);
    }
  }
  const y=floor-route.height;
  box('#34283e',52,y-8,25,8);
  box('#ffe2ac',56,y-18,18,13);
  box('#47647b',58,y-16,14,7);
  box('#a1f8ff',60,y-14,3,3);
  box('#a1f8ff',67,y-14,3,3);
  box('#ffa456',55,y-8,21,3);
  if (storm) {
    for (let i = 0; i < 20; i++) {
      const x = Math.floor((i * 91 + route.x * 0.4) % 352);
      box('#ebc0ee', x, (i * 47) % 145, 2, 1);
    }
  }
  const alert = storm ? 'Solar storm · crew sheltering' : route.x >= 2860 && route.x < stormStart ? 'Solar alert ahead' : 'Remote rover';
  byId('sector').textContent = sector.name + ' · ' + alert;
  byId('distance').value = Math.floor(route.x / finishX * 100);
  const battery = byId('battery-icon');
  const batteryLabel = route.battery ? 'Battery collected' : 'Battery missing';
  battery.classList.toggle('online', route.battery);
  battery.setAttribute('aria-label', batteryLabel);
  battery.title = batteryLabel;

  const relays = byId('relay-icons');
  const relayLabel = route.beacons.length + ' of 3 relays online';
  relays.setAttribute('aria-label', relayLabel);
  relays.title = relayLabel;
  Array.from(relays.children).forEach((light, index) => {
    light.classList.toggle('online', index < route.beacons.length);
  });
}

function start() {
  driveSeconds = 0;
  hideCaptureRing();
  nextScanSite = 0;
  scannedRock = false;
  clearTimeout(relayHighlightTimer);
  byId('game-hint').classList.remove('relay-highlight');
  clearTimeout(scanTimer);
  hideCaptureRing();
  scan = 'pending';
  byId('scan').hidden = true;
  byId('scan').disabled = false;
  byId('skip').hidden = true;
  byId('skip').disabled = false;
  cancelAnimationFrame(frame);
  checkpoint = {x:0, battery:false, beacons:[], collected:new Set()};
  resetRunner();
  byId('lab').hidden = true;
  byId('world-controls').hidden = true;
  if (!byId('mission').open) byId('mission').showModal();
  byId('game-hint').textContent = 'PIP: Press Space or tap Jump to start. Jump over rocks and roll through signals.';
  byId('pause-menu').hidden = true;
  byId('jump').focus();
}

function resetRunner() {
  route = {...checkpoint, collected:new Set(checkpoint.collected), height:0, velocity:0, running:false, started:false, finished:false};
  lastTime = undefined;
  renderRoute();
}

function showBoard() {
  clearTimeout(scanTimer);
  hideCaptureRing();
  cancelAnimationFrame(frame);
  byId('pause-menu').hidden = true;
  route = undefined;
  byId('mission').close();
  byId('world-controls').hidden = false;
  renderBoard();
  drawWorld();
}

function jump() {
  if (!route || !byId('pause-menu').hidden || scan === 'offered' || scan === 'scanning') return;
  if (!route.running) {
    route.running = true;
    if (route.started) lastTime = undefined;
    route.started = true;
    byId('pause-menu').hidden = true;
    byId('game-hint').textContent = 'PIP: Keep an eye on the rocks ahead!';
    frame = requestAnimationFrame(tick);
    return;
  }
  if (route.height === 0) {
    route.velocity = 197;
    labSound('jump');
    learnedJump = true;
  }
}

function recover(hint) {
  resetRunner();
  byId('game-hint').textContent = 'PIP: ' + hint + ' Press Jump to try from your checkpoint.';
}

function tick(now) {
  if (!route?.running) return;
  const dt = Math.min((now-(lastTime ?? now))/1000,.035);
  lastTime = now;
  driveSeconds += dt;
  const previousX = route.x;
  route.x += sectors.findLast(entry => route.x >= entry.start).speed * dt * routeSpeed[plan.route];
  if (previousX < 2860 && route.x >= 2860) byId('game-hint').textContent = 'PIP: Solar alert ahead. The crew is indoors. Keep driving the rover remotely.';
  if (previousX < stormStart && route.x >= stormStart) byId('game-hint').textContent = 'PIP: See the specks in the camera view? Keep watching the track.';
  if (previousX < stormEnd && route.x >= stormEnd) byId('game-hint').textContent = 'PIP: Solar storm cleared. The third beacon is just ahead.';
  route.height = Math.max(0,route.height+route.velocity*dt);
  route.velocity = route.height > 0 ? route.velocity-490*dt : 0;
  for (const item of course) {
    if (bypass(item)) continue;
    if (item.kind === 'rock' && Math.abs(item.x-route.x)<16 && route.height<19) {
      labSound('bump');
      recover('That rock caught our wheels!');
      return;
    }
    if (item.x <= previousX || item.x > route.x || item.kind === 'rock') continue;
    if (item.kind === 'site') {
      if (!route.battery || route.beacons.length !== 3) {
        recover('We still need the battery and all three signals.');
        return;
      }
      route.finished = true;
      finishRunner();
      return;
    }
    if (route.height > (item.kind === 'beacon' && plan.tool === 'signal' ? 32 : 15)) {
      recover('Stay on the ground to collect the ' + item.kind + '.');
      return;
    }
    route.collected.add(item.x);
    if (item.kind === 'battery') route.battery = true;
    else route.beacons = [...route.beacons,item.x];
    if (item.kind === 'beacon') {
      const hint = byId('game-hint');
      hint.classList.add('relay-highlight');
      clearTimeout(relayHighlightTimer);
      relayHighlightTimer = setTimeout(() => hint.classList.remove('relay-highlight'), 6000);
    }
    checkpoint = {x:item.x, battery:route.battery, beacons:[...route.beacons], collected:new Set(route.collected)};
    byId('game-hint').textContent = item.kind === 'battery' ? 'PIP: Battery collected. Find the three beacons!'
      : 'PIP: Relay ' + route.beacons.length + ' online. ' + relayClues[route.beacons.length - 1];
  }
  renderRoute();
  if (previousX < scanSites[nextScanSite] && route.x >= scanSites[nextScanSite]) {
    nextScanSite += 1;
    byId('scan').disabled = false;
    byId('skip').disabled = false;
    scan = 'offered';
    byId('float-hint').textContent = '';
    route.running = false;
    checkpoint = {x:route.x, battery:route.battery, beacons:route.beacons, collected:new Set(route.collected)};
    byId('scan').hidden = false;
    byId('skip').hidden = false;
    byId('game-hint').textContent = 'PIP: Layered rock ahead! Take a close-up for the lab or keep driving.';
    byId('scan').focus();
    return;
  }
  frame = requestAnimationFrame(tick);
}

function finishRunner() {
  const awarded = controller.complete(chapter.id, {...route, routeName: plan.route});
  showBoard();
  if (!awarded) return;
  byId('status').textContent = 'Rover Rescue complete!';
  byId('facts').replaceChildren(...[...facts[chapter.id], ...(scannedRock ? [[
    'Field note · Layered rocks',
    'Layers of sedimentary rock give scientists clues about how sediment built up at Jezero’s ancient delta. The rover’s scan is a simulated observation.',
    'NASA Science · Jezero Crater Delta',
    'https://science.nasa.gov/resource/perseverance-explores-the-jezero-crater-delta/'
  ]] : [])].map(([title, explanation, label, url]) => {
    const card = element('article', '');
    const source = element('a', label);
    source.href = url;
    source.target = '_blank';
    source.rel = 'noopener';
    card.append(element('h3', title), element('p', explanation), source);
    return card;
  }));
  byId('clues').replaceChildren(...relayClues.map(clue => element('li', clue)));
  unlockKeepsake(byId('debrief'), 'signal', roverCosts[plan.route]);
  byId('discovery').showModal();
}

byId('cancel-plan').onclick = () => byId('prep').close();
byId('plan').onsubmit = event => {
  event.preventDefault();
  plan = Object.fromEntries(new FormData(event.currentTarget));
  scan = 'pending';
  if (controller.availability(chapter.id) !== 'Ready') {
    byId('plan-note').textContent = 'Choose a route within your Power budget.';
    return;
  }
  byId('plan-note').textContent = '';
  byId('prep').close();
  start();
};

function readyAfterScan(message) {
  byId('scan').hidden = true;
  byId('skip').hidden = true;
  byId('game-hint').textContent = message;
  byId('jump').focus();
}

byId('skip').onclick = () => {
  scan = 'skipped';
  readyAfterScan('PIP: Press Jump when ready to continue.');
};
byId('scan').onclick = () => {
  labSound('photo');
  scan = 'scanning';
  const ring = byId('capture-ring');
  ring.style.setProperty('--capture-time', captureTime[plan.tool] + 'ms');
  ring.hidden = false;
  byId('scan').disabled = true;
  byId('skip').disabled = true;
  byId('game-hint').textContent = 'PIP: Taking a close-up through solar interference…';
  scanTimer = setTimeout(() => {
    hideCaptureRing();
    scan = 'complete';
    scannedRock = true;
    const rock = rockSamples[[2, 1, 0][nextScanSite - 1]];
    fieldPhotos.add(rock.id);
    const isNew = !collectedRocks.has(rock.id);
    collectedRocks.add(rock.id);
    try {
      localStorage.setItem('mars-rock-collection', JSON.stringify([...collectedRocks]));
    } catch {}
    readyAfterScan('PIP: Observation saved. Press Jump to continue.');
    showRock(rock, true, isNew);
  }, captureTime[plan.tool]);
};

const specimens = [
  {id:'layers', name:'Layers', target:32, clue:'Thin bands record how sediment piled up over time. The layers are a clue to investigate for deposition.', topic:'Mastcam-Z can zoom in on rock textures.'},
  {id:'crystals', name:'Crystals', target:67, clue:'The visible crystals make mineral composition worth investigating.', topic:'SuperCam can study a rock’s chemistry and minerals from a distance.'},
  {id:'spots', name:'Spots', target:43, clue:'Comparing the spots with the surrounding rock can reveal differences in elemental composition.', topic:'PIXL identifies chemical elements in tiny areas.'}
];
let identified;
const scanner = byId('scanner');
const answerTray = byId('sample-answers');
const pipHint = byId('sample-hint');
const stage = byId('scan-stage');


byId('run-moxie').onclick = () => {
  if (!controller.runMoxie()) return;
  renderBoard();
  const dialog = byId('chapter-preview');
  dialog.close();
  previewChapter(selectedChapter, 1, controller.availability('mystery-rocks'));
};

function startScanner() {
  byId('sample-name').classList.remove('mystery-finale');
  identified = new Set();
  pulses = 3;
  sweepStart = performance.now();
  pulseTargets = [25 + Math.random()*8, 67 + Math.random()*8];
  readings = new Set();
  mapped = new Set();
  focusTarget = 35 + Math.floor(Math.random() * 51);
  stage.style.setProperty('--rock-angle', (155 + Math.floor(Math.random() * 40)) + 'deg');
  dominant = symbols[Math.floor(Math.random() * symbols.length)];
  elements = [...symbols.flatMap(symbol => Array(symbol === dominant ? 7 : 3).fill(symbol))];
  shuffle(elements);
  showSpecimen(specimens[0]);
  pipHint.textContent = fieldPhotos.has('rockytop')
    ? 'Remember your striped-rock photo? Rock A is ready on the lab screen. Compare it with two nearby records!'
    : 'The rover team sent three digital rock records. Let’s see which one we should study next!';
  byId('scanner').querySelector('.keepsake-toast')?.remove();
  scanner.showModal();
}

let pulses;
let sweepStart;
let pulseTargets;
let readings;
let mapped;
const symbols = ['Fe', 'Si', 'Mg', 'Ca'];
const elementNames = {Fe:'Iron', Si:'Silicon', Mg:'Magnesium', Ca:'Calcium'};
let elements, dominant, focusTarget;
const modes = ['Mastcam-Z', 'SuperCam', 'PIXL'];

function action(label, handler, parent = answerTray) {
  const button = element('button', label);
  button.onclick = handler;
  parent.append(button);
  return button;
}

function showSpecimen(sample) {
  pipHint.closest('.scanner-pip').classList.toggle('clue-collected', identified.has(sample.id));
  stage.hidden = false;
  stage.dataset.specimen = sample.id;
  stage.classList.remove('scanning', 'aligned');
  stage.style.setProperty('--beam', '50%');
  byId('sample-name').textContent = modes[specimens.indexOf(sample)] + ' / ' + sample.name;
  byId('sample-progress').textContent = '';
  answerTray.replaceChildren();
  const steps = byId('specimen-tray');
  steps.replaceChildren(...specimens.map((specimen, index) => {
    const step = element('span', ['\u25ce', '\u26a1', '\u25a6'][index]);
    step.title = modes[index] + (identified.has(specimen.id) ? ' evidence collected' : ' evidence pending');
    step.setAttribute('aria-label', step.title);
    step.setAttribute('role', 'img');
    step.dataset.done = identified.has(specimen.id);
    if (specimen === sample) step.setAttribute('aria-current', 'step');
    return step;
  }));
  byId('specimen-art').style.filter = '';
  byId('specimen-art').style.transform = '';

  function record() {
    identified.add(sample.id);
    showSpecimen(sample);

  }

  if (identified.has(sample.id)) {
    pipHint.replaceChildren(element('strong', 'Clue collected!'), element('span', sample.clue), element('small', sample.topic));
    const next = specimens.find(specimen => !identified.has(specimen.id));
    action(next ? 'Next clue' : 'Open Photo Hunt', () => {
      if (next) showSpecimen(next);
      else compareClues();
    }).focus();
    return;
  }

  if (sample.id === 'layers') {
    const label = element('label', 'Focus the camera');
    label.className = 'camera-focus';
    const focus = element('input', '');
    focus.type = 'range';
    focus.min = '0';
    focus.max = '100';
    focus.value = '0';
    const instruction = element('small', 'Drag the yellow knob left or right. You can also use the arrow keys.');
    instruction.className = 'control-hint';
    label.append(focus, instruction);
    answerTray.append(label);
    const capture = action('Capture observation', record);
    const adjust = () => {
      const amount = Number(focus.value);
      const distance = Math.abs(amount - focusTarget);
      const ready = distance <= 7;
      stage.classList.toggle('aligned', ready);
      byId('specimen-art').style.filter = 'blur(' + (ready ? 0 : Math.min(9, (distance - 7) / 5)) + 'px)';
      pipHint.textContent = ready ? 'Click! Those layers look sharp. Grab your first clue!' : 'PIP: Drag the yellow knob left or right until the stripes look sharp.';
      capture.disabled = !ready;
    };
    focus.oninput = adjust;
    adjust();
    return;
  }

  byId('specimen-art').style.filter = '';
  byId('specimen-art').style.transform = '';
  if (sample.id === 'crystals') {
    const targets = byId('pulse-targets');
    const labels = ['Dust patch', 'Crystal'];
    targets.replaceChildren(...labels.map((label, index) => {
      const marker = element('span', readings.has(index) ? '\u2713 ' + label : label);
      marker.dataset.logged = readings.has(index);
      marker.style.left = pulseTargets[index] + '%';
      marker.title = label;
      return marker;
    }));
    pipHint.textContent = 'Tap Fire pulse when the beam crosses a colored zone. ' + pulses + ' left!';
    if (readings.size === 2) {
      action('Save the readings', record);
      return;
    }
    if (!pulses) {
      action('Recharge pulses', () => {
        pulses = 3;
        showSpecimen(sample);
      });
      return;
    }
    const pulse = action('\u26a1 Fire pulse', () => {
      const beam = byId('scan-beam');
      const beamX = Number.parseFloat(getComputedStyle(beam).left) / stage.clientWidth * 100;
      const hit = pulseTargets.findIndex((target, index) => !readings.has(index) && Math.abs(beamX - target) <= 10);
      pulses -= 1;
      if (hit !== -1) readings.add(hit);
      showSpecimen(sample);
      pipHint.textContent = (hit === -1 ? 'Oops! Wait for the beam to enter an unfinished zone.' : hit === 0 ? 'Dust patch: mixed surface signal.' : 'Crystal: stronger mineral signal.') + ' ' + pulses + ' pulses left.';
      answerTray.querySelector('button').focus();
    });
    pulse.className = 'pulse-button';
    byId('scan-beam').style.animationDelay = -((performance.now() - sweepStart) % 3600) + 'ms';
    return;
  }

  pipHint.textContent = mapped.size + '/16 mapped. Tap each tile to reveal it, then count which symbol appears most.';
  const grid = element('div', '');
  grid.className = 'element-grid';
  answerTray.append(grid);
  elements.forEach((symbol, index) => {
    const tile = action(mapped.has(index) ? symbol : '\u25c8', () => {
      mapped.add(index);
      showSpecimen(sample);
      answerTray.querySelectorAll('.element-grid button')[index].focus();
    }, grid);
    tile.dataset.element = mapped.has(index) ? symbol : '';
    tile.setAttribute('aria-label', 'Cell ' + (index + 1) + (mapped.has(index) ? ': ' + symbol : ': unrevealed'));
  });
  if (mapped.size === elements.length) {
    const interpret = action('Open pattern report', () => {
      const report = byId('pixel-report');
      const options = byId('pixel-options');
      const feedback = byId('pixel-feedback');
      feedback.textContent = '';
      options.replaceChildren();
      const order = [...symbols];
      shuffle(order);
      for (const symbol of order) {
        const badge = action(elementNames[symbol], () => {
          if (symbol !== dominant) {
            feedback.textContent = 'Almost! Peek back at the map and count the symbols.';
            return;
          }
          report.close();
          record();
        }, options);
        badge.dataset.element = symbol;
        const token = element('strong', symbol);
        badge.prepend(token);
      }
      report.showModal();
    });
    interpret.className = 'pattern-report-button';
  }
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [items[index], items[other]] = [items[other], items[index]];
  }
}

let detectiveAdvance;

function compareClues() {
  pipHint.closest('.scanner-pip').classList.remove('clue-collected');
  stage.hidden = true;
  scanner.classList.add('photo-hunt');
  const matches = [
    ['Which rock has stacked layers that may record sediment building up?', 'rockytop'],
    ['Which outcrop shows a drill hole next to a round patch of exposed rock?', 'berea'],
    ['Which photo shows two chalk-sized rock cores?', 'skinner-ridge']
  ];
  const rochette = {
    id:'rochette', name:'Rochette', photo:'PIA24840', credit:'NASA/JPL-Caltech',
    alt:'Two drill holes in a Martian rock',
    slug:'rochette-after-perseverance-sampling'
  };
  const choices = [...rockSamples, rochette];
  matches[1][0] = 'Which photo shows one drill hole on the right and a circular abrasion patch on the left?';
  matches.push(['Which rock has two drill holes from Perseverance\u2019s first core samples?', 'rochette']);
  shuffle(matches);
  const details = {rockytop:'Stacked bands along the cliff', berea:'One drill hole and a round patch', 'skinner-ridge':'Two cores inside the drill', rochette:'Two drill holes in the rock'};
  const features = {
    rockytop:['\u2261', 'Stacked stripes', 'Look for bands stacked like a layer cake.'],
    berea:['\u25cf \u25cb', 'One hole + one flat circle', 'Find one dark hole and a flatter round patch beside it.'],
    'skinner-ridge':['\u25ce \u25ce', 'Two cores in a drill', 'Look for two pieces of rock inside metal rings.'],
    rochette:['\u25cf \u25cf', 'Two holes in one rock', 'Find two dark drill holes on the same flat rock.']
  };
  let index = 0;
  shuffle(choices);

  function drawMatch() {
    const id = matches[index][1];
    const [symbol, title, hint] = features[id];
    byId('sample-name').textContent = 'Photo Hunt with PIP';
    byId('sample-progress').textContent = index + ' / ' + matches.length + ' matches';
    pipHint.textContent = 'Pick the photo with the feature on your clue card.';
    const clue = element('div', '');
    clue.className = 'detective-clue';
    clue.append(element('strong', symbol + '  ' + title), element('small', hint));
    const photos = element('div', '');
    photos.className = 'match-photos';
    answerTray.replaceChildren(clue, photos);
    for (const rock of choices) {
      const card = element('div', '');
      card.className = 'match-card';
      photos.append(card);
      const button = action(rock.name, () => {
        if (rock.id !== id) {
          pipHint.textContent = 'Good try! ' + hint;
          return;
        }
        index += 1;
        byId('sample-progress').textContent = index + ' / ' + matches.length + ' matches';
        for (const option of photos.querySelectorAll('button')) option.disabled = true;
        labSound('match');
        button.classList.add('correct-match');
        button.append(element('strong', '\u2713 You found it!'));
        pipHint.textContent = 'Nice match! ' + rock.name + ' shows ' + title.toLowerCase() + '.';
        clearTimeout(detectiveAdvance);
        detectiveAdvance = setTimeout(() => {
          if (!scanner.open || !button.isConnected) return;
          if (index < matches.length) drawMatch();
          else showLakeDiscovery();
        }, 1200);
        button.scrollIntoView({block:'nearest'});
      }, card);
      button.className = 'match-rock';
      const image = element('img', '');
      image.src = rockImage(rock);
      image.alt = rock.alt;
      button.prepend(image);
      const tag = element('small', features[rock.id][1]);
      tag.className = 'rock-detail';
      button.append(tag);
      addPhotoCredit(card, rock);
    }
    photos.querySelector('button').focus();
  }
  drawMatch();
}

function addPhotoCredit(container, rock) {
  const link = element('a', rock.credit);
  link.href = 'https://science.nasa.gov/photojournal/' + rock.slug + '/';
  link.target = '_blank';
  link.rel = 'noopener';
  container.append(link);
}

function showLakeDiscovery() {
  scanner.classList.remove('photo-hunt');
  if (!controller.completeMysteryRocks(identified)) return;
  renderBoard();
  byId('specimen-tray').querySelector('[aria-current]')?.removeAttribute('aria-current');
  byId('sample-name').textContent = 'Mystery solved!';
  byId('sample-name').classList.add('mystery-finale');
  byId('sample-progress').textContent = '';
  pipHint.textContent = 'Nice work, detective! Those rock layers are our first clue to Jezero\u2019s ancient lake!';
  const lake = {
    photo:'PIA24485', credit:'NASA/JPL-Caltech/ASU/MSSS',
    alt:'Dark delta rock above the floor of Jezero Crater',
    slug:'perseverance-view-of-the-delta-in-jezero-crater'
  };
  const gallery = element('div', '');
  gallery.className = 'lake-discovery';
  const card = element('article', '');
  const image = element('img', '');
  image.src = rockImage(lake);
  image.alt = lake.alt;
  card.append(
    element('strong', 'Did you know?'),
    element('h4', 'Jezero Crater once held a lake'),
    image,
    element('p', 'Scientists think a river carried sand and mud into the lake. As the sediment piled up, it formed a fan-shaped delta that Perseverance can study today.')
  );
  addPhotoCredit(card, lake);
  gallery.append(card);
  const sources = element('details', '');
  sources.className = 'lake-sources';
  const instrumentSource = element('a', 'NASA\u2019s Perseverance science instruments');
  instrumentSource.href = 'https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/';
  instrumentSource.target = '_blank';
  instrumentSource.rel = 'noopener';
  sources.append(element('summary', 'Science sources'), instrumentSource);
  answerTray.replaceChildren(gallery, sources);
  unlockKeepsake(byId('sample-progress'), 'lake');
  byId('status').textContent = 'Mystery Rocks complete. Lost Lake clue logged!';
  byId('sample-name').scrollIntoView({block:'start'});
  byId('scanner-close').focus({preventScroll:true});
}
scanner.addEventListener('close', () => {
  clearTimeout(detectiveAdvance);
  scanner.classList.remove('photo-hunt');
  byId('specimen-art').style.filter = '';
  byId('specimen-art').style.transform = '';
  stage.classList.remove('scanning');
});

function rockImage(rock) {
  const id = rock.photo.toLowerCase();
  return 'https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/' + id.slice(0,5) + '/' + id + '/' + rock.photo + '.jpg';
}

const fieldPhotos = new Set();
const collectedRocks = new Set();
try {
  const saved = JSON.parse(localStorage.getItem('mars-rock-collection') || '[]');
  for (const sample of rockSamples) {
    if (Array.isArray(saved) && saved.includes(sample.id)) collectedRocks.add(sample.id);
  }
  if (localStorage.getItem('mars-skinner-ridge') === '1') collectedRocks.add('skinner-ridge');
} catch {}

const rockCard = byId('rock-card');
function renderRock(rock) {
  byId('rock-title').textContent = rock.name;
  byId('rock-fact').textContent = rock.fact;
  const img = byId('rock-img');
  img.alt = rock.alt;
  img.src = 'https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/' + rock.photo.slice(0,5).toLowerCase() + '/' + rock.photo.toLowerCase() + '/' + rock.photo + '.jpg';
  byId('rock-credit').textContent = rock.credit;
  byId('rock-source').href = 'https://science.nasa.gov/photojournal/' + rock.slug + '/';
  for (const button of byId('rock-picker').children) {
    button.setAttribute('aria-pressed', String(button.dataset.rock === rock.id));
  }
}
function showRock(rock, duringRun, isNew = false) {
  byId('rock-banner').textContent = duringRun ? (isNew ? 'Field photo saved!' : 'Observation logged') : 'Rock collection';
  byId('rock-close').textContent = duringRun ? 'Back to rover' : 'Close collection';
  byId('rock-picker').replaceChildren(...rockSamples.filter(sample => collectedRocks.has(sample.id)).map(sample => {
    const button = element('button', sample.name);
    button.dataset.rock = sample.id;
    button.onclick = () => renderRock(sample);
    return button;
  }));
  renderRock(rock);
  byId('rock-fact-label').hidden = duringRun;
  byId('rock-context').hidden = duringRun;
  if (duringRun) {
    byId('rock-picker').replaceChildren();
    const features = {rockytop:'Thin, dark stripes stacked in layers.', berea:'One dark hole beside a flat, round patch.', 'skinner-ridge':'Two round pieces of rock inside metal rings.'};
    byId('rock-title').textContent = 'Field photo';
    byId('rock-fact').textContent = features[rock.id];
  }
  rockCard.showModal();
}
rockCard.addEventListener('close', () => {
  if (route) byId('jump').focus();
});

byId('jump').onclick = jump;
byId('maze').onclick = jump;
function togglePause() {
  const menu = byId('pause-menu');
  if (!menu.hidden) {
    menu.hidden = true;
    byId('pause-title').textContent = 'Paused';
    byId('back').textContent = 'Exit to lab';
    if (resumeOnClose) jump();
    byId('pause').focus();
    return;
  }
  resumeOnClose = route.running;
  route.running = false;
  cancelAnimationFrame(frame);
  menu.hidden = false;
  byId('resume').focus();
}
byId('pause').onclick = togglePause;
byId('resume').onclick = togglePause;
const keys = {arrowup:'up', w:'up', arrowdown:'down', s:'down', arrowleft:'left', a:'left', arrowright:'right', d:'right'};
window.addEventListener('keydown', event => {
  if (byId('earth-game').open || byId('lost-lake-game').open || byId('keepsake-view').open || byId('keepsakes').open || byId('safari').open || byId('claw-game').open || byId('pixel-report').open || scanner.open || rockCard.open || byId('chapter-preview').open) return;
  if (route) {
    if (event.key === 'Escape') {
      event.preventDefault();
      togglePause();
    } else if (event.key.toLowerCase() === 's' && scan === 'offered' && byId('pause-menu').hidden) {
      event.preventDefault();
      byId('scan').click();
    } else if (byId('pause-menu').hidden && [' ', 'ArrowUp', 'w', 'W'].includes(event.key) && (event.key !== ' ' || event.target.tagName !== 'BUTTON' || event.target.id === 'jump')) {
      event.preventDefault();
      if (!event.repeat) jump();
    }
    return;
  }
  const direction = keys[event.key.toLowerCase()];
  if (byId('prep').open || byId('discovery').open) return;

  if (event.key.toLowerCase() === 'e') interact();
  if (!direction) return;
  event.preventDefault();

  walk(direction);
});
byId('mission').addEventListener('cancel', event => { event.preventDefault(); togglePause(); });
byId('retry').onclick = () => {
  byId('pause-title').textContent = 'Paused';
  byId('back').textContent = 'Exit to lab';
  start();
};
byId('back').onclick = () => {
  if (byId('back').textContent !== 'Confirm exit') {
    byId('pause-title').textContent = 'Leave this run?';
    byId('back').textContent = 'Confirm exit';
    return;
  }
  byId('pause-title').textContent = 'Paused';
  byId('back').textContent = 'Exit to lab';
  byId('status').textContent = 'Returned to the lab.';
  showBoard();
  byId('stations').firstElementChild.focus();
};
renderBoard();
 drawWorld();















const clawDialog = byId('claw-game');
const clawStage = byId('claw-stage');
const clawActions = byId('claw-actions');
const clawHint = byId('claw-hint');
let rushTimer;

byId('recycle-water').onclick = () => {
  if (!controller.recycleWater()) return;
  renderBoard();
  byId('chapter-preview').close();
  previewChapter(selectedChapter, 2, controller.availability('cosmic-claw'));
};

clawDialog.addEventListener('close', () => clearInterval(rushTimer));

function clawStep(title, message) {
  byId('claw-step').textContent = title;
  clawHint.textContent = message;
  clawStage.replaceChildren();
  clawActions.replaceChildren();
}

function startClaw() {
  clawDialog.querySelector('.keepsake-toast')?.remove();
  clawDialog.showModal();
  const patterns = [
    {texture:'layers', label:'striped'},
    {texture:'spots', label:'dotted'},
    {texture:'crystals', label:'crystal'}
  ];
  shuffle(patterns);
  const [sample] = patterns;
  clawStep('1 / 3 - Rock Target Rush', 'PIP: Find the ' + sample.label + ' rock! Tap the matching rock each time it appears.');
  const grid = element('div', '');
  grid.className = 'claw-grid';
  clawStage.append(grid);
  let hits = 0;
  let target = -1;
  const tiles = Array.from({length: 6}, (_, index) => action('', () => {
    if (index !== target) {
      clawHint.textContent = 'PIP: Look for the ' + sample.label + ' rock!';
      return;
    }
    hits += 1;
    if (hits === 3) {
      clearInterval(rushTimer);
      coreRock(sample);
      return;
    }
    nextTarget();
  }, grid));
  function nextTarget() {
    target = (target + 1 + Math.floor(Math.random() * 5)) % 6;
    const decoys = Array.from({length:5}, (_, index) => patterns[1 + index % 2]);
    shuffle(decoys);
    tiles.forEach((tile, index) => {
      const {texture, label} = index === target ? sample : decoys.pop();
      const rock = element('span', '');
      rock.className = 'sample-sticker';
      rock.dataset.texture = texture;
      tile.replaceChildren(rock);
      tile.setAttribute('aria-label', 'Rock ' + (index + 1) + ': ' + label);
    });
    byId('claw-step').textContent = '1 / 3 - Find the ' + sample.label + ' rock (' + hits + '/3)';
  }
  nextTarget();
  rushTimer = setInterval(nextTarget, 1900);
}

function coreRock(sample) {
  clawStep('2 / 3 - Cosmic Claw', 'PIP: Line up the drill. Watch the moving drill. Tap Lower drill when it enters the mint zone!');
  const track = element('div', '');
  track.className = 'claw-track';
  const arm = element('span', '');
  arm.className = 'claw-arm';
  arm.innerHTML = '<svg viewBox="0 0 80 62" aria-hidden="true"><g stroke="#21192e" stroke-width="3" stroke-linejoin="round"><path fill="#c6a2ee" d="M8 3h20v11H8z"/><path stroke="#21192e" stroke-width="12" stroke-linecap="round" d="m18 14 30 12-8 12"/><path stroke="#eee0ff" stroke-width="6" stroke-linecap="round" d="m18 14 30 12-8 12"/><circle fill="#ffd84a" cx="48" cy="26" r="6"/><rect fill="#ffd84a" x="30" y="33" width="20" height="11" rx="3"/><path fill="#a5e5e2" d="M36 44h8v13l-2 3h-4l-2-3z"/><path fill="none" d="M36 48h8m-8 5h8"/></g></svg>';
  const rock = element('span', '');
  rock.className = 'sample-sticker';
  rock.dataset.texture = sample.texture;
  const scale = element('div', '');
  scale.className = 'claw-scale';
  for (let i = 0; i < 9; i++) scale.append(element('span', ''));
  track.append(scale, arm, rock);
  clawStage.append(track);
  action('Lower drill', () => {
    const distance = Math.abs(arm.getBoundingClientRect().x - rock.getBoundingClientRect().x
      + (arm.offsetWidth - rock.offsetWidth) / 2);
    if (distance > track.clientWidth / 6) {
      clawHint.textContent = 'PIP: A little closer! Wait until the drill is over the mint zone.';
      return;
    }
    sortCore();
  }, clawActions).focus();
}

function sortCore() {
  clawStep('3 / 3 - Sample Sorter', 'PIP: Tap a tube, then tap the slot with the same symbol.');
  const tubes = [['A', '\u25c6'], ['B', '\u2605'], ['C', '\u25cf']];
  const slots = [...tubes];
  shuffle(tubes);
  shuffle(slots);
  const stored = new Set();
  let selected;
  const tray = element('div', '');
  const rack = element('div', '');
  tray.className = rack.className = 'tube-rack';
  clawStage.append(element('h3', 'Sample tray'), tray, element('h3', 'Storage rack'), rack);
  const tubeButtons = tubes.map(([code, symbol]) => {
    const button = action(code, () => {
      selected = code;
      tubeButtons.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
      clawHint.textContent = 'PIP: Tube ' + code + ' inspected! Find the slot with its matching symbol.';
    }, tray);
    const tube = element('span', symbol);
    tube.className = 'core-tube';
    tube.dataset.code = code;
    button.prepend(tube);
    button.setAttribute('aria-label', 'Inspect tube ' + code);
    button.setAttribute('aria-pressed', 'false');
    return button;
  });
  for (const [code, symbol] of slots) {
    const slot = action(symbol + '  Slot ' + code, () => {
      if (selected !== code) {
        clawHint.textContent = selected ? 'PIP: Try the slot with the same symbol and letter.' : 'PIP: Pick a tube from the tray first!';
        return;
      }
      stored.add(code);
      selected = undefined;
      const tube = tubeButtons[tubes.findIndex(([letter]) => letter === code)];
      tube.disabled = true;
      tube.setAttribute('aria-pressed', 'false');
      slot.disabled = true;
      slot.classList.add('tube-stored');
      slot.textContent = '\u2713 Slot ' + code;
      clawHint.textContent = 'PIP: Click! ' + stored.size + '/3 tubes stored.';
      if (stored.size < tubes.length) {
        tray.querySelector('button:not(:disabled)').focus();
        return;
      }
      action('Seal all tubes', () => {
        if (controller.completeCosmicClaw({target:'rockytop', cored:true, sealed:true})) showCoreDiscovery();
        else clawHint.textContent = 'Check the Power and Water requirements in the lab.';
      }, clawActions).focus();
    }, rack);
  }
  tubeButtons[0].focus();
}

const coreDiscoveries = [
  {title:'A core the size of chalk', photo:'PIA25690', alt:'Berea core inside the drill',
    slug:'perseverances-rock-core-from-berea-outcrop', credit:'NASA/JPL-Caltech/ASU/MSSS',
    fact:'Perseverance cuts a cylinder of rock about as long as a piece of classroom chalk. This one came from the Berea outcrop.'},
  {title:'A camera inside the rover', photo:'PIA24927', alt:'Two views of rock cores in Perseverance\u2019s drill',
    slug:'rock-cores-from-skinner-ridge', credit:'NASA/JPL-Caltech/ASU/MSSS',
    fact:'Perseverance has a camera called CacheCam that photographs samples in their tubes. The two photos shown here were taken with Mastcam-Z while the cores were in the drill.',
    source:['NASA: CacheCam and sampling equipment', 'https://science.nasa.gov/mission/mars-2020-perseverance/rover-components/']},
  {title:'A sample depot on Mars', photo:'PIA25681', alt:'Perseverance beside a sample tube at Three Forks',
    slug:'perseverances-three-forks-sample-depot-selfie', credit:'NASA/JPL-Caltech/MSSS',
    fact:'Perseverance placed ten sealed tubes on the ground at Three Forks. In this selfie, look for the tube in front of the rover.'},
  {title:'A tube that checks for contamination', photo:'PIA25681', alt:'Perseverance at the Three Forks sample depot',
    slug:'perseverances-three-forks-sample-depot-selfie', credit:'NASA/JPL-Caltech/MSSS',
    fact:'Special witness tubes catch stray particles or chemicals near sampling sites. They help scientists check whether material from Earth got into the sampling environment.',
    source:['NASA: Witness tubes', 'https://science.nasa.gov/mission/mars-2020-perseverance/mars-rock-samples/#witness-tubes']}
];
let lastCoreDiscovery;

function showCoreDiscovery() {
  renderBoard();
  clawStep('Chapter 3 complete', 'PIP: Sample secured! Next chapter: Snapshot Safari.');
  const choices = coreDiscoveries.filter(card => card !== lastCoreDiscovery);
  const photo = choices[Math.floor(Math.random() * choices.length)];
  lastCoreDiscovery = photo;
  const card = element('article', '');
  const image = element('img', '');
  image.src = rockImage(photo);
  image.alt = photo.alt;
  card.append(element('strong', 'Did you know?'), element('h3', photo.title), image, element('p', photo.fact));
  addPhotoCredit(card, photo);
  if (photo.source) {
    const [label, url] = photo.source;
    const link = element('a', label);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    card.append(element('br', ''), link);
  }
  clawStage.append(card);
  unlockKeepsake(byId('claw-step'), 'core');
  clawDialog.querySelector('form button').focus();
}

const safari = byId('safari');
const safariStage = byId('safari-stage');
const safariActions = byId('safari-actions');
const safariHint = byId('safari-hint');
const safariScenes = [
  {id:'delta', name:'Dark delta ledge', photo:'PIA24485', credit:'NASA/JPL-Caltech/ASU/MSSS',
    slug:'perseverance-view-of-the-delta-in-jezero-crater', alt:'A dark raised ledge beyond a rocky plain',
    target:4, hint:'Find the dark, flat-topped ledge above the rocky foreground.',
    fact:'Mastcam-Z photographed this delta remnant from the landing site. A wide view shows where the outcrop sits in the surrounding landscape.'},
  {id:'layers', name:'Kodiak layers', photo:'PIA24802', credit:'NASA/JPL-Caltech/ASU/MSSS', slug:'perseverance-captures-image-of-kodiak', alt:'A flat-topped hill called Kodiak with visible layers',
    target:4, hint:'Look for bands in the flat-topped hill called Kodiak.',
    fact:'NASA scientists interpret the layers at Kodiak as sediments that built up in a delta, followed by floods.'},
  {id:'ripples', name:'Wind ripples', photo:'PIA20755', credit:'NASA/JPL-Caltech/MSSS',
    slug:'two-sizes-of-ripples-on-surface-of-martian-sand-dune', alt:'Wind-shaped ridges in sand at Gale Crater',
    target:4, hint:'Find the wavy ridges across the middle of the sand dune.',
    fact:'Curiosity photographed two sizes of wind-shaped ripples at Gale Crater. This is a comparison photo from a different crater.'}
];

byId('greenhouse-prep').onclick = () => {
  byId('chapter-preview').close();
  safariStage.replaceChildren(element('h3', 'Greenhouse harvest'));
  safariActions.replaceChildren();
  safariHint.textContent = 'PIP: Pick the three ripe greens to restock crew meals.';
  const tray = element('div', '');
  tray.className = 'safari-crops';
  safariStage.append(tray);
  let picked = 0;
  for (let i = 0; i < 3; i++) {
    const crop = action('\u{1f96c} Pick greens', () => {
      crop.disabled = true;
      crop.textContent = '\u2713 Harvested';
      picked++;
      if (picked < 3) return;
      controller.harvestFood();
      renderBoard();
      safariHint.textContent = 'PIP: Fresh veggies for the crew! Food: ' + controller.food + '.';
      action('Check camera readiness', () => {
        safari.close();
        previewChapter(missions[3], 3, controller.availability('snapshot-safari'));
      }, safariActions).focus();
    }, tray);
  }
  safari.showModal();
};

function startSafari() {
  const photos = new Set();
  const itinerary = [...safariScenes];
  shuffle(itinerary);
  function frameScene(index) {
    const scene = itinerary[index];
    safariStage.replaceChildren(element('h3', '2 / 3 - Mars I-Spy | Shot ' + (index + 1) + ' of ' + safariScenes.length));
    safariActions.replaceChildren();
    safariHint.textContent = 'PIP: ' + scene.hint + ' Zoom in first, tap the outlined box, then take your photo.';
    const checklist = element('p', '');
    checklist.className = 'safari-checklist';
    checklist.append(element('strong', 'Photo checklist'), element('span', scene.name));
    safariStage.append(checklist);
    const frame = element('div', '');
    frame.className = 'safari-frame';
    frame.dataset.scene = scene.id;
    const photo = element('img', '');
    photo.src = rockImage(scene);
    photo.alt = scene.alt;
    const grid = element('div', '');
    grid.className = 'safari-grid';
    const lens = element('span', '');
    lens.className = 'safari-reticle';
    lens.setAttribute('aria-hidden', 'true');
    const display = element('span', '1.0x');
    display.className = 'camera-display';
    display.textContent = '1.00x';
    frame.append(photo, grid, lens, display);
    safariStage.append(frame);
    addPhotoCredit(safariStage, scene);
    let selected = -1;
    const zoomLabel = element('label', '1. Drag the zoom slider right to 1.25x or higher');
    zoomLabel.className = 'safari-zoom';
    const zoom = element('input', '');
    zoom.type = 'range';
    zoom.min = 100;
    zoom.max = 180;
    zoom.value = 100;
    zoomLabel.append(zoom);
    const aimStep = element('p', '2. Tap the outlined box on the photo.');
    aimStep.className = 'safari-zoom';
    frame.before(zoomLabel, aimStep);
    const cells = Array.from({length:9}, (_, cell) => {
      const button = action('', () => {
        selected = cell;
        lens.style.setProperty('--frame-x', (cell % 3) * 33.333 + '%');
        lens.style.setProperty('--frame-y', Math.floor(cell / 3) * 33.333 + '%');
        lens.classList.add('framed');
        cells.forEach((tile, at) => tile.setAttribute('aria-pressed', String(at === cell)));
      }, grid);
      button.setAttribute('aria-label', ['Top', 'Middle', 'Bottom'][Math.floor(cell / 3)] + ' ' + ['left', 'center', 'right'][cell % 3]);
      button.setAttribute('aria-pressed', 'false');
      return button;
    });
    zoom.oninput = () => {
      frame.style.setProperty('--zoom', Number(zoom.value) / 100);
      display.textContent = (Number(zoom.value) / 100).toFixed(2) + 'x';
    };
    cells[scene.target].classList.add('hint-cell');
    action('\u25ce  3. Take photo', () => {
      if (selected !== scene.target || Number(zoom.value) < 125) {
        const tip = Number(zoom.value) < 125
          ? 'First, drag the zoom slider right to 1.25x or higher.'
          : 'Now tap the outlined box on the photo.';
        safariHint.textContent = 'PIP: ' + tip;
        return;
      }
      frame.classList.add('photo-captured');
      labSound('photo');
      photos.add(scene.id);
      safariHint.textContent = 'Snap! Saved to your album.';
      const print = element('figure', '');
      print.className = 'safari-shot-print';
      const preview = photo.cloneNode();
      print.append(preview, element('figcaption', scene.name));
      addPhotoCredit(print, scene);
      frame.replaceWith(print);
      zoomLabel.remove();
      aimStep.remove();
      const fact = element('p', '');
      fact.className = 'safari-fact';
      fact.append(element('strong', 'Did you know?'), element('span', scene.fact));
      safariStage.append(fact);
      safariActions.replaceChildren();
      action(index + 1 < safariScenes.length ? 'Next photo' : 'Compare evidence', () => {
        if (index + 1 < safariScenes.length) frameScene(index + 1);
        else showPhotoDetective(photos);
      }, safariActions).focus();
    }, safariActions);
    zoom.focus();
  }
  safari.showModal();
  startPanorama(() => frameScene(0));
}

function showSafariAlbum() {
  renderBoard();
  safariStage.replaceChildren(element('h3', 'Mars Photographer'));
  safariActions.replaceChildren();
  unlockKeepsake(safariStage.firstElementChild, 'album');
  safariHint.textContent = 'PIP: Album complete! Next chapter: The Lost Lake Mystery.';
  const album = element('div', '');
  album.className = 'safari-album';
  const page = element('article', '');
  page.hidden = true;
  safariStage.append(album, page);
  const clueLabels = {delta:'River deposits', layers:'Layers of sediment', ripples:'Shaped by wind'};
  for (const scene of safariScenes) {
    const tab = action('', () => {
      for (const button of album.children) button.setAttribute('aria-pressed', String(button === tab));
      page.hidden = false;
      const image = element('img', '');
      image.src = rockImage(scene);
      image.alt = scene.alt;
      page.replaceChildren(element('h4', scene.name), image, element('p', scene.fact));
      addPhotoCredit(page, scene);
      page.scrollIntoView({block:'nearest'});
    }, album);
    tab.setAttribute('aria-pressed', 'false');
    const thumbnail = element('img', '');
    thumbnail.src = rockImage(scene);
    thumbnail.alt = '';
    const caption = element('span', scene.name);
    caption.className = 'safari-print-caption';
    const clue = element('small', clueLabels[scene.id]);
    clue.className = 'safari-clue-label';
    clue.dataset.kind = scene.id === 'ripples' ? 'wind' : 'water';
    tab.append(thumbnail, caption, clue);
  }
  const instruction = element('p', 'Tap a photo to open its field notes.');
  instruction.className = 'safari-album-instruction';
  safariStage.append(instruction);
  byId('safari-back').focus();
}

function startPanorama(next) {
  safariStage.replaceChildren(element('h3', '1 / 3 - Fix the panorama'));
  safariActions.replaceChildren();
  safariHint.textContent = 'PIP: Put all four photo pieces in the numbered slots. Drag a piece into a slot, or tap a piece first and then tap a number. Use Peek at the panorama to see the finished picture.';
  const mosaics = [
    {photo:'PIA24921', slug:'detailed-panorama-of-mars-jezero-crater-delta', credit:'NASA/JPL-Caltech/ASU/MSSS', note:'NASA stitched 1,118 Mastcam-Z frames to make this mosaic.'},
    {...safariScenes.find(scene => scene.id === 'ripples'), note:'The Curiosity Mastcam team combined several photos to show these wind-shaped ripples.'},
    {...safariScenes.find(scene => scene.id === 'layers'), note:'This enhanced-color view helps scientists see the layers in Kodiak.'}
  ];
  const mosaic = mosaics[Math.floor(Math.random() * mosaics.length)];
  const image = rockImage(mosaic) + '?w=1400';
  const tray = element('div', '');
  const board = element('div', '');
  tray.className = 'panorama-tray';
  board.className = 'panorama-board';
  const progress = element('p', '0 of 4 pieces placed');
  progress.setAttribute('role', 'status');
  safariStage.append(element('h4', 'Numbered slots'), board, progress, element('h4', 'Photo pieces'), tray);
  addPhotoCredit(safariStage, mosaic);
  const order = [0,1,2,3];
  shuffle(order);
  let selected;
  let placed = 0;
  const pieces = new Map();
  function paint(tile, piece) {
    tile.style.backgroundImage = 'url("' + image + '")';
    tile.style.backgroundPosition = (piece % 2 ? '100%' : '0%') + ' ' + (piece >= 2 ? '100%' : '0%');
  }
  for (const piece of order) {
    const button = action('', () => {
      selected = piece;
      for (const [id, tile] of pieces) tile.setAttribute('aria-pressed', String(id === selected));
    }, tray);
    button.setAttribute('aria-label', 'Choose puzzle piece ' + (order.indexOf(piece) + 1));
    button.setAttribute('aria-pressed', 'false');
    paint(button, piece);
    button.draggable = true;
    button.ondragstart = event => {
      event.dataTransfer.setData('text/plain', String(piece));
      button.click();
    };
    pieces.set(piece, button);
  }
  for (let slot = 0; slot < 4; slot++) {
    const square = action(String(slot + 1), () => {
      if (selected === undefined) {
        safariHint.textContent = 'PIP: Pick a photo piece below the numbered slots first.';
        return;
      }
      if (selected !== slot) {
        safariHint.textContent = 'PIP: Try another spot. Match the lines where the pieces meet!';
        return;
      }
      paint(square, slot);
      square.textContent = '';
      square.disabled = true;
      pieces.get(slot).hidden = true;
      selected = undefined;
      placed += 1;
      progress.textContent = placed + ' of 4 pieces placed';
      safariHint.textContent = 'PIP: That piece fits! Choose another from Photo pieces.';
      if (placed === 4) {
        tray.previousElementSibling.hidden = true;
        tray.hidden = true;
        safariHint.textContent = 'PIP: Picture restored! Ready to start the photo hunt?';
        const fact = element('p', '');
        fact.className = 'safari-fact';
        fact.append(element('strong', 'Did you know?'), element('span', mosaic.note));
        safariStage.append(fact);
        safariActions.replaceChildren();
        action('Start Mars I-Spy', next, safariActions).focus();
      } else {
        tray.querySelector('button:not([hidden])').focus();
      }
    }, board);
    square.setAttribute('aria-label', 'Place piece in square ' + (slot + 1));
    square.ondragover = event => event.preventDefault();
    square.ondrop = event => {
      event.preventDefault();
      square.click();
    };
  }
  action('Peek at the panorama', eventlessPreview, safariActions);
  function eventlessPreview() {
    board.style.setProperty('--preview', 'url("' + image + '")');
    board.classList.toggle('panorama-preview');
  }
}

function showPhotoDetective(photos) {
  const selected = new Set();
  safariStage.replaceChildren(element('h3', '3 / 3 - Photo Detective'));
  safariActions.replaceChildren();
  safariHint.textContent = 'PIP: Tap two photos that show what ancient water left behind at Jezero. Read the captions for clues, then tap Check my picks. Tap a selected photo again to swap it out.';
  const board = element('div', '');
  board.className = 'match-photos';
  safariStage.append(board);
  const count = element('p', '0 of 2 photos selected');
  count.setAttribute('role', 'status');
  safariStage.insertBefore(count, board);
  const evidence = [...safariScenes];
  shuffle(evidence);
  for (const scene of evidence) {
    const card = element('div', '');
    card.className = 'match-card';
    board.append(card);
    const button = action(scene.name, () => {
      if (selected.has(scene.id)) selected.delete(scene.id);
      else if (selected.size < 2) selected.add(scene.id);
      else safariHint.textContent = 'PIP: You already picked two. Tap one of your picks again to make room.';
      button.setAttribute('aria-pressed', String(selected.has(scene.id)));
      count.textContent = selected.size + ' of 2 photos selected';
      submit.disabled = selected.size !== 2;
    }, card);
    button.className = 'match-rock';
    button.setAttribute('aria-pressed', 'false');
    const photo = element('img', '');
    photo.src = rockImage(scene);
    photo.alt = scene.alt;
    button.prepend(photo);
    button.append(element('small', scene.id === 'ripples' ? 'Wind-shaped sand at Gale Crater' : scene.id === 'layers' ? 'Sedimentary layers at Jezero' : 'River deposits at Jezero'));
    addPhotoCredit(card, scene);
  }
  const submit = action('Check my picks', () => {
    if (!selected.has('delta') || !selected.has('layers')) {
      safariHint.textContent = 'PIP: Wind made the ripples. Try the Jezero photos that show sediment piling up.';
      return;
    }
    explainWaterEvidence(photos);
  }, safariActions);
  submit.disabled = true;
  board.querySelector('button').focus();
}

function explainWaterEvidence(photos) {
  safariStage.replaceChildren(element('h3', 'Connect the clues'));
  safariActions.replaceChildren();
  safariHint.textContent = 'PIP: Kodiak and the delta ledge show layers of sand and mud. Tap one answer that explains what carried the sand and mud to Jezero and where it settled.';
  const choices = [['Wind pushed sand into ripples', false], ['A river carried sediment into a lake', true], ['The rover piled up the rocks', false]];
  shuffle(choices);
  for (const [label, correct] of choices) {
    action(label, () => {
      if (!correct) {
        safariHint.textContent = 'PIP: Think about what happens when a river slows down as it enters a lake.';
        return;
      }
      if (controller.completeSnapshotSafari(photos)) showSafariAlbum();
    }, safariActions);
  }
  safariActions.firstElementChild.focus();
}

const modernJezero = {name:'Jezero from above',photo:'PIA24310',slug:'angle-on-jezero-crater-illustration',credit:'NASA/JPL-Caltech/USGS',alt:'Orbital-data view of Jezero\u2019s valley, delta and crater floor',fact:'Orbital images help scientists see how the valley connects to the crater.'};
const ancientJezero = {name:'Ancient Jezero',photo:'PIA24172',slug:'ancient-jezero-crater-illustration',credit:'NASA/JPL-Caltech',alt:'Artist\u2019s reconstruction of a lake and river flowing into Jezero',fact:'An artist\u2019s reconstruction based on geological evidence.'};
const keepsakes = {
  signal:{name:'Lost Signal Field Badge', photos:[safariScenes.find(scene => scene.id === 'delta')]},
  lake:{name:'Ancient Lake Clue', photos:[safariScenes.find(scene => scene.id === 'layers')]},
  core:{name:'Sealed Core Badge', photos:[coreDiscoveries[0]]},
  album:{name:'Mars Photographer Album', photos:safariScenes},
  reconstruction:{name:'Ancient Jezero Reconstruction', photos:[ancientJezero]},
  report:{name:'Junior Mars Scientist / Mission Report', photos:[modernJezero, ...safariScenes, coreDiscoveries[0], ancientJezero]}
};
const earnedKeepsakes = new Set();
try {
  const saved = JSON.parse(localStorage.getItem('mars-keepsakes') || '[]');
  if (Array.isArray(saved)) Object.keys(keepsakes).forEach(id => {
    if (saved.includes(id)) earnedKeepsakes.add(id);
  });
} catch {}

function unlockKeepsake(anchor, id, spentPower) {
  labSound('discovery');
  earnedKeepsakes.add(id);
  try {
    localStorage.setItem('mars-keepsakes', JSON.stringify([...earnedKeepsakes]));
  } catch {}
  const mission = missions[Object.keys(keepsakes).indexOf(id)];
  const banner = element('section', '');
  banner.className = 'keepsake-toast discovery-summary';
  banner.append(element('h3', 'Discovery unlocked!'), element('p', keepsakes[id].name));
  const rewards = element('div', '');
  rewards.className = 'discovery-rewards';
  for (const [kind, value, label] of [
    ['science', '+' + mission.points, 'Science Points'],
    ['star', '+1', 'Science Star'],
    ['power', '\u2212' + (spentPower ?? mission.power), 'Power']
  ]) {
    const chip = element('span', '');
    const description = value + ' ' + label;
    chip.dataset.stat = kind;
    chip.title = description;
    chip.setAttribute('role', 'img');
    chip.setAttribute('aria-label', description);
    chip.append(statIcon(kind), element('strong', value));
    rewards.append(chip);
  }
  banner.append(rewards);
  if (anchor.nextElementSibling?.classList.contains('keepsake-toast')) anchor.nextElementSibling.replaceWith(banner);
  else anchor.after(banner);
}

function renderReportScrapbook(content) {
  const cover = element('header', '');
  const title = element('h3', 'My Mars Mission Report');
  title.id = 'keepsake-detail-title';
  cover.append(element('small', 'JUNIOR MARS SCIENTIST'), title,
    element('p', 'Five field notes from Jezero Crater'));
  const notes = element('div', '');
  notes.className = 'report-notes';
  const [delta, layers] = ['delta', 'layers'].map(id => safariScenes.find(scene => scene.id === id));
  const entries = [
    ['Rover Rescue', 'Mapped the research site', modernJezero, 'The orbital view shows a valley cutting through the crater rim toward the delta.'],
    ['Mystery Rocks', 'Read the layers', layers, 'At Kodiak, layers show how sediment built up over time.'],
    ['Cosmic Claw', 'Secured a core', coreDiscoveries[0], 'A sealed tube preserves a rock sample for future study. This real example is from Berea.'],
    ['Snapshot Safari', 'Put the clues in context', delta, 'The wide view shows where the delta sits in the surrounding landscape.'],
    ['The Lost Lake', 'Pieced together ancient Jezero', ancientJezero, 'This artist?s reconstruction shows what the crater may have looked like when it held a lake.']
  ];
  entries.forEach(([chapter, heading, photo, note], index) => {
    const card = element('article', '');
    const print = element('figure', '');
    const image = element('img', '');
    image.src = rockImage(photo);
    image.alt = photo.alt;
    image.loading = 'lazy';
    print.append(image, element('figcaption', photo.name || 'Berea rock core'));
    addPhotoCredit(print, photo);
    card.append(element('small', String(index + 1) + ' / ' + chapter), element('h4', heading), print, element('p', note));
    notes.append(card);
  });
  const conclusion = element('aside', '');
  conclusion.className = 'report-finding';
  conclusion.append(element('strong', 'Finding sent to Earth'),
    element('p', 'The valley, layered rocks, and delta deposits support the idea that a river once carried sediment into a lake in Jezero Crater.'));
  content.replaceChildren(cover, notes, conclusion);
}

function viewKeepsake(id) {
  const item = keepsakes[id];
  const content = byId('keepsake-content');
  content.classList.toggle('report-scrapbook', id === 'report');
  if (id === 'report') {
    renderReportScrapbook(content);
    return;
  }
  const title = element('h3', item.name);
  title.id = 'keepsake-detail-title';
  content.replaceChildren(title);
  for (const photo of item.photos) {
    const figure = element('figure', '');
    const image = element('img', '');
    image.src = rockImage(photo);
    image.alt = photo.alt;
    figure.append(image, element('figcaption', photo.name || photo.title));
    addPhotoCredit(figure, photo);
    content.append(figure, element('p', photo.fact));
  }
}

let journalPage = 0;

function drawJournal() {
  const ids = Object.keys(keepsakes);
  byId('journal-discoveries').replaceChildren(
    element('span', '\u2726'), element('strong', earnedKeepsakes.size + ' / ' + missions.length), element('small', 'Discoveries saved')
  );
  const {science, stars} = controller.snapshot();
  const meter = element('progress', '');
  meter.max = totalPoints;
  meter.value = science;
  meter.setAttribute('aria-label', 'Science Points');
  const stat = (kind, value, label) => {
    const sticker = element('div', '');
    sticker.className = 'journal-stat';
    sticker.dataset.stat = kind;
    sticker.append(statIcon(kind), element('strong', value), element('small', label));
    return sticker;
  };
  byId('journal-stats').replaceChildren(
    stat('science', science + ' / ' + totalPoints, 'Science'),
    stat('star', stars + ' / ' + missions.length, 'Stars'),
    meter
  );
  byId('journal-trail').replaceChildren(...missions.map((mission, index) => {
    const stop = element('li', '');
    const button = action('', () => {
      journalPage = index + 1;
      drawJournal();
      byId('journal-trail').children[index].firstElementChild.focus();
    }, stop);
    const symbol = element('span', chapterIcons[index]);
    symbol.setAttribute('aria-hidden', 'true');
    button.append(symbol, element('small', index + 1));
    const saved = earnedKeepsakes.has(ids[index]);
    button.dataset.saved = saved;
    if (journalPage === index + 1) button.setAttribute('aria-current', 'page');
    button.setAttribute('aria-label', mission.title + (saved ? ', discovery saved' : ', discovery locked'));
    return stop;
  }));
  const sheet = element('section', '');
  sheet.className = 'journal-sheet';
  if (journalPage === 0) {
    sheet.classList.add('journal-cover');
    sheet.append(element('span', '\u2726'), element('h3', 'Discovery album'),
      element('p', 'Choose a chapter bookmark to open its page.'));
  } else {
    const id = ids[journalPage - 1];
    const item = keepsakes[id];
    const mission = missions[journalPage - 1];
    const label = element('small', chapterIcons[journalPage - 1] + '  Chapter ' + journalPage);
    label.className = 'journal-chapter-label';
    sheet.append(label, element('h3', mission.title));
    if (earnedKeepsakes.has(id)) {
      const print = action(item.name, () => {
        viewKeepsake(id);
        byId('keepsake-view').showModal();
      }, sheet);
      print.className = 'keepsake-print';
      const picture = element('img', '');
      picture.className = 'keepsake-thumbnail';
      picture.src = rockImage(item.photos[0]);
      picture.alt = '';
      print.prepend(picture);
    } else {
      const empty = element('div', '');
      empty.className = 'journal-empty';
      empty.append(element('span', '\u2727'), element('p', 'Finish this chapter to fill this page.'));
      sheet.append(empty);
    }
  }
  byId('journal-page').replaceChildren(sheet);
  byId('journal-page-number').textContent = journalPage ? journalPage + ' / ' + missions.length : 'Cover';
  byId('journal-prev').disabled = journalPage === 0;
  byId('journal-next').disabled = journalPage === missions.length;
}

byId('journal-prev').onclick = () => {
  journalPage--;
  drawJournal();
  if (byId('journal-prev').disabled) byId('journal-next').focus();
};
byId('journal-next').onclick = () => {
  journalPage++;
  drawJournal();
  if (byId('journal-next').disabled) byId('journal-prev').focus();
};
byId('science-collection').onclick = () => {
  journalPage = 0;
  drawJournal();
  byId('keepsakes').showModal();
};


const lakeDialog = byId('lost-lake-game');
const lakeStage = byId('lake-stage');
const lakeActions = byId('lake-actions');
const lakeHint = byId('lake-hint');

byId('lake-prep').onclick = () => {
  if (!controller.prepareLostLake()) return;
  renderBoard();
  byId('chapter-preview').close();
  previewChapter(missions[4], 4, controller.availability('lost-lake'));
};

function lakeRound(title, hint) {
  lakeStage.replaceChildren(element('h3', title));
  lakeActions.replaceChildren();
  lakeHint.textContent = hint;
}

function lakePhoto(photo) {
  const card = element('figure', '');
  const image = element('img', '');
  image.src = rockImage(photo);
  image.alt = photo.alt;
  card.append(image, element('figcaption', photo.name), element('p', photo.fact));
  addPhotoCredit(card, photo);
  lakeStage.append(card);
}

function startLake() {
  lakeRound('1 / 3 - Trace the river', 'PIP: Solar alert! Stay inside and use orbital images to map the old river.');
  lakeDialog.showModal();
  lakePhoto(modernJezero);
  const trek = element('a', 'Explore the real terrain in Mars Trek');
  trek.href = 'https://trek.nasa.gov/mars/';
  trek.target = '_blank';
  trek.rel = 'noopener';
  lakeStage.append(trek);
  const grid = element('div', '');
  grid.className = 'lake-grid';
  const endpoints = element('div', '');
  endpoints.className = 'river-endpoints';
  endpoints.append(element('span', 'Inlet: upper left'), element('span', 'Basin: lower right'));
  const progress = element('p', '');
  progress.className = 'river-progress';
  progress.setAttribute('role', 'status');
  lakeStage.append(endpoints, grid, progress);
  const layouts = [
    {pipes:[10,12,3,6,3,12,9,5,3], bends:[1,5]},
    {pipes:[12,6,9,3,12,6,5,3,10], bends:[3,7]}
  ];
  const {pipes, bends} = layouts[Math.floor(Math.random() * layouts.length)];
  const movable = new Set(bends);
  const turns = pipes.map((_, i) => movable.has(i) ? 2 + Math.floor(Math.random() * 2) : 0);
  const tiles = [];
  let solved = false;
  const mask = i => ((pipes[i] << turns[i]) | (pipes[i] >> (4-turns[i]))) & 15;
  function redraw() {
    const wet = new Set();
    if (mask(0) & 8) {
      const queue = [0];
      wet.add(0);
      for (const i of queue) {
        const neighbors = [i>=3 ? i-3 : -1, i%3<2 ? i+1 : -1, i<6 ? i+3 : -1, i%3 ? i-1 : -1];
        neighbors.forEach((n,d) => {
          if (n<0 || wet.has(n) || !(mask(i)&(1<<d)) || !(mask(n)&(1<<((d+2)%4)))) return;
          wet.add(n);
          queue.push(n);
        });
      }
    }
    tiles.forEach((tile,i) => {
      const directions = ['north','east','south','west'].filter((_,d) => mask(i)&(1<<d));
      tile.replaceChildren(...directions.map(direction => {
        const branch = element('span','');
        branch.className = 'river-' + direction;
        return branch;
      }));
      if (i === 0 || i === 8) {
        const arrow = element('b', '\u2192');
        arrow.className = 'river-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        tile.append(arrow);
      }
      tile.dataset.wet = wet.has(i);
      tile.setAttribute('aria-label',(i===0?'Inlet':i===8?'Basin':'Tile '+(i+1))+': '+directions.join(', '));
    });
    if (wet.has(8) && (mask(8)&2)) progress.textContent = 'Connected! Water reached the basin.';
    else if (!wet.size) progress.textContent = 'Open the upper-left tile toward the left to let water in.';
    else if (wet.has(8)) progress.textContent = 'The basin tile needs an opening on the right.';
    else progress.textContent = 'Water is flowing. Rotate the next bend so the two channels meet.';
    if (!solved && wet.has(8) && (mask(8)&2)) {
      solved = true;
      tiles.forEach(tile => tile.disabled = true);
      lakeHint.textContent = 'PIP: The river reaches the basin! The orbital view shows a valley cutting through the crater rim.';
      action('Connect the evidence',lakeEvidence,lakeActions).focus();
    }
  }
  lakeHint.textContent = 'PIP: We can map from indoors during the solar alert. Tap the two yellow bends to rotate them and guide water from the inlet arrow to the basin.';
  pipes.forEach((_,i) => {
    const tile = action('', () => { turns[i] = (turns[i]+1)%4; redraw(); },grid);
    tile.className = 'river-tile';
    tile.disabled = !movable.has(i);
    if (i === 0 || i === 8) tile.dataset.endpoint = i === 0 ? 'inlet' : 'basin';
    tiles.push(tile);
  });
  redraw();
  tiles[bends[0]].focus();
}

function lakeEvidence() {
  lakeRound('2 / 3 - Build an evidence chain','PIP: Pick an observation, then connect it to what it tells us.');
  const cards = [
    ['Ancient channel map','A route a river could follow into the crater',modernJezero],
    ['Kodiak layers','Sediment built up over time',safariScenes.find(scene => scene.id === 'layers')],
    ['Delta photo','Sediment piled up where the river slowed',safariScenes.find(scene => scene.id === 'delta')]
  ];
  const board = element('div','');
  board.className = 'lake-chain';
  const left = element('div','');
  const right = element('div','');
  const strings = document.createElementNS('http://www.w3.org/2000/svg','svg');
  strings.setAttribute('viewBox','0 0 100 100');
  strings.setAttribute('preserveAspectRatio','none');
  strings.setAttribute('aria-hidden','true');
  strings.classList.add('lake-strings');
  board.append(left,strings,right);
  lakeStage.append(board);
  let picked = -1;
  const linked = new Set();
  const observations = cards.map(([label,,photo],i) => {
    const tile = action(label, () => {
      picked = i;
      observations.forEach((button,index) => button.setAttribute('aria-pressed',String(index===i)));
      lakeHint.textContent = photo.fact;
    },left);
    tile.setAttribute('aria-pressed','false');
    const img = element('img','');
    img.src = rockImage(photo);
    img.alt = '';
    tile.prepend(img);
    addPhotoCredit(left,photo);
    return tile;
  });
  const order = [0,1,2];
  shuffle(order);
  for (const i of order) {
    const tile = action(cards[i][1], () => {
      if (picked!==i) {
        lakeHint.textContent = 'PIP: Look for the explanation that fits your selected picture.';
        return;
      }
      labSound('match');
      linked.add(i);
      const start = (i + .5) * 100 / cards.length;
      const end = (order.indexOf(i) + .5) * 100 / cards.length;
      const string = document.createElementNS(strings.namespaceURI,'path');
      string.setAttribute('d', 'M0 ' + start + ' C45 ' + start + ' 55 ' + end + ' 100 ' + end);
      strings.append(string);
      observations[i].disabled = tile.disabled = true;
      observations[i].className = tile.className = 'lake-traced';
      observations[i].setAttribute('aria-pressed','false');
      picked = -1;
      lakeHint.textContent = 'PIP: Link restored! '+linked.size+'/3 clues connected.';
      if (linked.size===cards.length) {
        lakeHint.textContent = 'PIP: A channel, layers, and a delta. What story fits all three?';
        const conclusion = element('section','');
        conclusion.className = 'lake-conclusion';
        conclusion.append(element('strong','Three clues connected'),element('p','What story do they tell together?'));
        lakeActions.append(conclusion);
        action('A river flowed into a lake',rebuildLake,conclusion).focus();
        action('Wind alone made all three',() => {
          lakeHint.textContent = 'PIP: Wind can make ripples. Look at where this valley meets the delta.';
        },conclusion);
      }
    },right);
  }
}

function rebuildLake() {
  lakeRound('3 / 3 - Rebuild ancient Jezero', 'PIP: Find a way for the river to enter the crater.');
  const map = element('div', '');
  map.className = 'lake-model';
  lakeStage.append(map);
  const terrain = element('div','');
  terrain.className = 'lake-terrain';
  terrain.innerHTML = '<span class="model-river"></span><span class="model-delta"></span><span class="model-water"></span><span class="model-shore"></span>';
  map.append(terrain);
  const places = ['Valley through the rim', 'Mouth of the river', 'Crater basin'];
  const pieces = ['River channel', 'Sediment delta', 'Ancient lake'];
  const hints = ['Where would sediment pile up as the river slows down?', 'Where could water collect?'];
  let step = 0;
  const markers = places.map((place, index) => action(place, () => {
    if (index !== step) {
      lakeHint.textContent = 'PIP: Try another spot for the ' + pieces[step].toLowerCase() + '.';
      return;
    }
    const marker = markers[index];
    terrain.dataset.phase = step + 1;
    marker.className = 'lake-placed';
    marker.textContent = pieces[index];
    marker.disabled = true;
    if (++step === pieces.length) {
      lakeHint.textContent = 'PIP: The clues fit together!';
      action('Reveal ancient Jezero', finishLake, lakeActions).focus();
    } else {
      lakeHint.textContent = 'PIP: ' + hints[step - 1];
      markers[step].focus();
    }
  }, map));
  markers[0].focus();
}

function finishLake() {
  if (!controller.completeLostLake({mapped:true, matched:3, rebuilt:true})) {
    lakeHint.textContent = 'Check mission readiness and try again.';
    return;
  }
  renderBoard();
  lakeRound('Chapter 5 complete', 'PIP: We rebuilt an ancient lake! Next chapter: Message to Earth.');
  unlockKeepsake(lakeStage.firstElementChild, 'reconstruction');
  lakePhoto(modernJezero);
  lakePhoto(ancientJezero);

}

const earthDialog = byId('earth-game');
const earthStage = byId('earth-stage');
const earthHint = byId('earth-hint');
let delivery;

earthDialog.addEventListener('close', () => clearTimeout(delivery));

function earthRound(title, hint) {
  earthStage.replaceChildren(element('h3', title));
  earthHint.textContent = hint;
  return earthStage;
}

let draggedEarthItem;

function earthDraggable(button) {
  button.draggable = true;
  button.ondragstart = event => {
    if (button.disabled) { event.preventDefault(); return; }
    draggedEarthItem = button;
    event.dataTransfer.setData('text/plain', button.textContent);
    button.click();
  };
  button.ondragend = () => { draggedEarthItem = undefined; };
}

function earthDropTarget(target, button) {
  target.ondragover = event => {
    if (draggedEarthItem) event.preventDefault();
  };
  target.ondrop = event => {
    if (!draggedEarthItem) return;
    event.preventDefault();
    button.click();
    draggedEarthItem = undefined;
  };
}

function startEarth() {
  const page = earthRound('1 / 3 - Assemble the scrapbook', 'PIP: Drag a Polaroid into a scrapbook pocket, or tap the photo and then the pocket.');
  earthDialog.showModal();
  const records = [['signal',0], ['lake',1], ['core',1], ['album',1], ['reconstruction',2]];
  shuffle(records);
  const shelf = element('div', '');
  shelf.className = 'earth-records';
  const sections = element('div', '');
  sections.className = 'earth-sections';
  page.append(shelf, sections);
  let selected;
  let placed = 0;
  const buttons = records.map(([id, section]) => {
    const item = keepsakes[id];
    const button = action(item.name, () => {
      selected = {button, section, item};
      for (const record of buttons) record.setAttribute('aria-pressed', String(record === button));
      earthHint.textContent = 'PIP: Which page should hold this record?';
    }, shelf);
    button.setAttribute('aria-pressed', 'false');
    const image = element('img', '');
    image.src = rockImage(item.photos[0]);
    image.alt = '';
    image.draggable = false;
    button.prepend(image);
    earthDraggable(button);
    return button;
  });
  ['Where we explored', 'What we found', 'What it suggests'].forEach((title, index) => {
    const section = element('section', '');
    sections.append(section);
    const pocket = action(title, () => {
      if (selected?.section !== index) {
        earthHint.textContent = 'PIP: Choose a record and look for the page that describes it.';
        return;
      }
      const saved = element('p', '\u2713 ' + selected.item.name);
      saved.className = 'earth-filed';
      saved.prepend(selected.button.querySelector('img').cloneNode());
      section.append(saved);
      selected.button.hidden = true;
      selected.button.setAttribute('aria-pressed', 'false');
      selected = undefined;
      if (++placed === records.length) {
        earthHint.textContent = 'PIP: Our river channel, rock layers, and delta are clues. What story do they tell together?';
        const board = element('section', '');
        board.className = 'report-conclusion';
        board.append(element('h4', 'Choose your report conclusion'));
        const options = [
          ['life', 'Ancient life', 'We proved life existed on Mars.'],
          ['lake', 'An ancient lake', 'Jezero once held a lake and river delta.'],
          ['dry', 'Always dry', 'Mars has always been dry.']
        ];
        shuffle(options);
        for (const [kind, title, claim] of options) {
          const card = action('', () => {
            if (kind === 'lake') {
              board.querySelectorAll('button').forEach(button => button.disabled = true);
              card.dataset.correct = 'true';
              earthHint.textContent = 'PIP: Exactly! The channel, layers, and delta support an ancient river and lake.';
              action('Stamp report and continue', repairEarth, board).focus();
            } else {
              earthHint.textContent = kind === 'life'
                ? 'PIP: These clues tell us about water. We would need more evidence to say life existed.'
                : 'PIP: Look at the delta. What could have carried the sediment into the crater?';
            }
          }, board);
          card.className = 'conclusion-card';
          const icon = element('span', {life:'\u273f', lake:'\u224b', dry:'\u263c'}[kind]);
          icon.setAttribute('aria-hidden', 'true');
          card.append(icon, element('strong', title), element('small', claim));
        }
        page.append(board);
        board.querySelector('button').focus();
      }
    }, section);
    earthDropTarget(section, pocket);
  });
}

function repairEarth() {
  const page = earthRound('2 / 3 - Signal Sequence', 'PIP: Watch the lights, then tap them in the same order!');
  const status = element('strong', 'OFFLINE');
  status.className = 'sequence-status';
  const console = element('div', '');
  console.className = 'signal-console';
  const progress = element('p', '');
  progress.setAttribute('role', 'status');
  page.append(status, console, progress);
  const sequence = [];
  let entered = 0;
  let listening = false;
  let timer;
  let audio;
  const stop = () => {
    clearTimeout(timer);
    if (audio) void audio.close();
  };
  earthDialog.addEventListener('close', stop, {once:true});

  function flash(index) {
    pads.forEach((pad, at) => pad.classList.toggle('lit', index === at));
    if (muted || !audio || audio.state !== 'running' || index < 0) return;
    const tone = audio.createOscillator();
    const volume = audio.createGain();
    tone.frequency.value = [330,440,550][index];
    volume.gain.value = .045;
    tone.connect(volume).connect(audio.destination);
    tone.start();
    tone.stop(audio.currentTime + .13);
  }

  function watch() {
    clearTimeout(timer);
    console.classList.remove('sequence-oops');
    listening = false;
    entered = 0;
    progress.textContent = 'Watch ' + sequence.length + ' flashes';
    pads.forEach(pad => pad.disabled = true);
    function play(index) {
      if (!earthDialog.open || !console.isConnected) return;
      if (index === sequence.length) {
        listening = true;
        progress.textContent = 'Your turn: 0 / ' + sequence.length;
        pads.forEach(pad => pad.disabled = false);
        pads[0].focus();
        return;
      }
      flash(sequence[index]);
      timer = setTimeout(() => {
        flash(-1);
        timer = setTimeout(() => play(index + 1), 230);
      }, 430);
    }
    flash(-1);
    timer = setTimeout(() => play(0), 550);
  }

  const pads = ['Power','Data','Radio'].map((name,index) => {
    const pad = action(name, () => {
      if (!listening) return;
      clearTimeout(timer);
      flash(index);
      if (sequence[entered] !== index) {
        listening = false;
        pads.forEach(button => button.disabled = true);
        console.classList.add('sequence-oops');
        earthHint.textContent = 'PIP: Little hiccup! Let\u2019s watch that same pattern again.';
        timer = setTimeout(watch, 850);
        return;
      }
      entered++;
      progress.textContent = 'Correct taps: ' + entered + ' / ' + sequence.length;
      earthHint.textContent = 'PIP: Beep! You got it!';
      if (entered < sequence.length) {
        timer = setTimeout(() => flash(-1), 220);
        return;
      }
      listening = false;
      pads.forEach(button => button.disabled = true);
      timer = setTimeout(() => {
        if (sequence.length < 5) {
          sequence.push(Math.floor(Math.random() * pads.length));
          earthHint.textContent = 'PIP: Nice! One more light this time.';
          watch();
        } else {
          flash(-1);
          status.textContent = 'ONLINE';
          status.classList.add('online');
          earthHint.textContent = 'PIP: BEEP BEEP! The terminal is back online!';
          const fact = element('article', '');
          fact.className = 'report-conclusion';
          const source = element('a', 'NASA Mars Relay Network');
          source.href = 'https://science.nasa.gov/mars/mars-relay-network/';
          source.target = '_blank';
          source.rel = 'noopener';
          fact.append(element('strong', 'Did you know?'), element('p', 'Mars rovers can send data to orbiters, which relay it to Earth antennas such as NASA\u2019s Deep Space Network. This startup puzzle is fictional.'), source);
          page.append(fact);
          action('Send our discoveries', () => {
            earthDialog.removeEventListener('close', stop);
            stop();
            packEarth();
          }, fact).focus();
        }
      }, 450);
    }, console);
    pad.dataset.cable = name;
    pad.disabled = true;
    pad.prepend(element('span', ['\u26a1','\u25a6','\u25ce'][index]));
    return pad;
  });
  const start = action('Watch the lights', () => {
    if (window.AudioContext) {
      try { audio = new AudioContext(); void audio.resume().catch(() => {}); } catch {}
    }
    sequence.push(...Array.from({length:3}, () => Math.floor(Math.random() * pads.length)));
    start.remove();
    watch();
  }, page);
  start.focus();
}

function packEarth() {
  const page = earthRound('3 / 3 - Catch the satellite', 'PIP: Drag the slider left or right to follow the satellite. Keep the dish underneath it to upload!');
  const sky = element('div', '');
  sky.className = 'relay-sky';
  const satellite = element('span', '\u{1f6f0}');
  satellite.innerHTML = '<svg viewBox="0 0 76 48" aria-hidden="true"><g stroke="#2b2a3a" stroke-width="2.5"><rect x="2" y="19" width="24" height="16" rx="3" fill="#9bdaff"/><rect x="50" y="19" width="24" height="16" rx="3" fill="#9bdaff"/><path d="M10 20v14m8-14v14m40-14v14m8-14v14M3 27h23m24 0h23"/><rect x="26" y="14" width="24" height="26" rx="6" fill="#ffd84a"/><path d="M30 6q8 10 16 0" fill="#fff1c9"/><path d="M38 9v7"/><circle cx="38" cy="27" r="5" fill="#a6f3dc"/></g></svg>';
  satellite.className = 'relay-satellite';
  const dish = element('span', '\u{1f4e1}');
  dish.className = 'relay-dish';
  sky.append(satellite, dish);
  sky.setAttribute('aria-hidden', 'true');
  const label = element('label', 'Aim the dish');
  const aim = element('input', '');
  aim.type = 'range';
  aim.value = '50';
  label.append(aim);
  const packets = element('div', '');
  packets.className = 'relay-packets';
  const lights = ['Location','Findings','Conclusion'].map(name => element('span', name));
  packets.append(...lights);
  const meter = element('progress', '');
  meter.max = 3;
  meter.value = 0;
  meter.setAttribute('aria-label', 'Report packets uploaded');
  const status = element('p', 'Searching for a link');
  status.setAttribute('role', 'status');
  page.append(sky, label, packets, meter, status);
  let uploaded = 0;
  let last = performance.now();
  let aligned;
  function track(now) {
    if (!earthDialog.open || !sky.isConnected) return;
    const position = 50 + 34 * Math.sin(now / 2350);
    const direction = Number(aim.value);
    satellite.style.left = position + '%';
    dish.style.left = direction + '%';
    const locked = Math.abs(position - direction) <= 12;
    if (aligned !== locked) {
      aligned = locked;
      sky.classList.toggle('linked', locked);
      status.textContent = locked ? 'Link aligned - uploading!' : 'Adjust the dish to regain the link';
    }
    if (locked) uploaded += Math.min(50, now - last) / 1050;
    last = now;
    meter.value = Math.min(uploaded, 3);
    lights.forEach((light, index) => light.classList.toggle('sent', uploaded >= index + 1));
    if (uploaded >= 3) animateDelivery();
    else requestAnimationFrame(track);
  }
  aim.focus();
  requestAnimationFrame(track);
}

function animateDelivery() {
  const page = earthRound('Report uploaded', 'Mars Base to Orbiter to Earth. Delivery is sped up for the game.');
  const flight = element('div', '');
  flight.className = 'earth-flight';
  flight.append(element('span', 'Mars'), element('span', 'Orbiter'), element('span', 'Earth'));
  ['Location', 'Findings', 'Conclusion'].forEach((name, index) => {
    const packet = element('b', name);
    packet.style.animationDelay = index * .28 + 's';
    flight.append(packet);
  });
  page.append(flight);
  delivery = setTimeout(finishEarth, 2400);
}

function finishEarth() {
  if (!earthDialog.open || !controller.completeEarth({report:true,repaired:true,received:true})) return;
  renderBoard();
  const page = earthRound('Message received!', 'PIP: Earth got our report! Junior Mars Scientist badge unlocked!');
  unlockKeepsake(page.firstElementChild, 'report');
  const {science, stars} = controller.snapshot();
  const celebration = element('div', '');
  celebration.className = 'earth-celebration';
  const badge = element('div', '\u2605');
  badge.className = 'earth-medal';
  badge.setAttribute('aria-hidden', 'true');
  celebration.append(badge);
  celebration.append(element('small', 'Mars Mission Control'), element('strong', 'Certificate of Appreciation'),
    element('h4', 'Junior Mars Scientist'),
    element('p', stars === missions.length ? 'For exploring Mars and sharing your discoveries with Earth.' : 'For sending a successful test transmission to Earth.'));
  for (const [i, mission] of missions.entries()) {
    const star = element('span', controller.availability(mission.id) === 'Completed' ? '\u2605' : '\u2606');
    star.title = mission.title;
    star.style.animationDelay = i * .09 + 's';
    celebration.append(star);
  }
  page.append(celebration);
  const totals = element('div', '');
  totals.className = 'earth-totals';
  for (const [kind, value, label, detail] of [
    ['science', science + ' / ' + totalPoints, 'Science', ''],
    ['star', String(stars), stars === 1 ? 'Star earned' : 'Stars earned', ''],
    ['power', '\u2212' + missions[5].power, 'Power used', controller.snapshot().power + ' left']
  ]) {
    const tile = element('div', '');
    tile.dataset.stat = kind;
    tile.append(statIcon(kind), element('strong', value), element('small', label));
    if (detail) tile.append(element('small', detail));
    totals.append(tile);
  }
  page.append(totals,
    element('p', 'Mars orbiters can relay rover data to Earth. A radio signal takes roughly 3 to 22 minutes one way, depending on how far apart the planets are.'));
  const source = element('a', 'NASA Mars Relay Network');
  source.href = 'https://science.nasa.gov/mars/mars-relay-network/';
  source.target = '_blank';
  source.rel = 'noopener';
  page.append(source);
  const memories = element('section', '');
  memories.className = 'earth-memories';
  memories.append(element('h4', 'Mission memories'));
  const prints = element('div', '');
  prints.className = 'earth-memory-prints';
  for (const photo of [modernJezero, coreDiscoveries[0], ancientJezero]) {
    const print = element('figure', '');
    const image = element('img', '');
    image.src = rockImage(photo);
    image.alt = photo.alt;
    print.append(image, element('figcaption', photo.name || 'Sample collected'));
    addPhotoCredit(print, photo);
    prints.append(print);
  }
  memories.append(prints);
  const footer = element('div', '');
  footer.className = 'earth-report-actions';
  page.append(memories, footer);
  action('View my mission report', () => {
    viewKeepsake('report');
    byId('keepsake-view').showModal();
  }, footer).focus({preventScroll:true});
}
