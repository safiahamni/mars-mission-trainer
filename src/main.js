// main.js — starts the game: loads the shared map first, then every place.
// The map drawing is in index.html, and every CSS file is linked there too.

// ===== THE SHARED MAP (everyone uses it; please don't change without telling the team) =====
import './map/avatar.js';   // the player character (createAvatar)
import './ui/footsteps.js'; // walking sound: a crunch on the Mars roads, a tap indoors (press M to switch off)
import './map/map.js';      // roads, walking, doors, keyboard (MarsMap)
import './map/mars-scenery.js'; // the ground (mesa, craters, dunes, tracks) + cliff zone / clear zone
import './hud/hud.js';           // side panel: clock, hazard meter, solar storm, EVA, red alarm, Mission failed (MarsHUD)
import './map/route-chooser.js'; // "Which way to the Science Lab?" pop-up at the fork + auto-walk (Normal path / Cliff route)
import './ui/start-screen/start-screen.js'; // MARTIANOUTS start screen: PLAY -> spaceship landing -> tour of the base (load before the places)
import './places/greenhouse/greenhouse.js';

// ===== PLACES: each teammate adds their place here (take away the // in front of your lines) =====
// (your CSS goes in index.html, in the <head>)
// Command Center room: switchboard, Mission control, battery, wardrobe, storm shelter core (Member 1)
import './places/command-center/commandCenterPlace.js';
import './places/command-center/ccBuilding.js';
// Radiation Shelter + Command Center (Member 3)
// import './places/radiation-shelter/shelter.js';
// import './places/radiation-shelter/shelter-game.js';
import './places/radiation-shelter/shield-shelter.js'; // solar storm: "Shield the Shelter!" water-tank game in the Command Center  (before solar-panel: it uses the arrow keys first while open)
import './places/radiation-shelter/solar-panel.js';   // solar panels yard + rover (outside the airlock: ▼)

// Greenhouse
import './places/greenhouse/greenhouse.js';

// Science Lab
import './places/science-lab/lab.js';

// Life Support
import './places/life-support/life.js';
