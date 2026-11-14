// main.js — starts the game: loads the shared map first, then every place.
// The map drawing is in index.html, and every CSS file is linked there too.

// ===== THE SHARED MAP (everyone uses it; please don't change without telling the team) =====
import './map/avatar.js';   // the player character (createAvatar)
import './map/map.js';      // roads, walking, doors, keyboard (MarsMap)
import './map/mars-scenery.js'; // the ground (mesa, craters, dunes, tracks) + cliff zone / clear zone

// ===== PLACES: each teammate adds their place here (take away the // in front of your lines) =====
// (your CSS goes in index.html, in the <head>)
// Radiation Shelter + Command Center (Member 3)
// import './places/radiation-shelter/shelter.js';
// import './places/radiation-shelter/shelter-game.js';
import './places/radiation-shelter/solar-panel.js';   // solar panels yard + rover (outside the airlock: ▼)

// Greenhouse
// import './places/greenhouse/greenhouse.js';

// Science Lab
// import './places/science-lab/lab.js';

// Life Support
// import './places/life-support/life.js';
