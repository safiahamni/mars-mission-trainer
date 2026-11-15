# MARTIANAUTS · mars-mission-trainer
An interactive Mars survival and science game for children aged 7–12, developed for NASA Space Apps Challenge 2026.

**Play it online:** https://safiahamni.github.io/mars-mission-trainer/ (laptop or desktop, keyboard)

## Run the game

```bash
npm install      # once
npm run dev      # then open the link it prints (http://localhost:5173)
npm test         # run the game-logic tests
```

On Windows PowerShell use `npm.cmd install`, `npm.cmd run dev` and `npm.cmd test`.
(VS Code **Live Server** on `index.html` works too.)

## How to play

Press **PLAY** on the MARTIANAUTS start screen. A spaceship lands and drops the astronaut at the
Command Center, then a short tour shows every place on the base.

- **Walk** with the arrow keys or **WASD**. Walk to the end of a road to go inside a place.
- **6 Sols (Mars days):** do the missions in each place, then sleep in the bunks of the radiation shelter
  (inside the Command Center) to start the next Sol.
- **Radiation:** the hazard meter in the side panel goes up while you are outside on the roads and stops
  inside buildings. In the Command Center the needle slides back into the green.
  - EVA status: **GO** (green, under 50) · **CAUTION** (yellow, 50–79) · **NO GO** (red, 80+ or a storm)
  - The **Cliff route** (canyon) to the Science Lab gives 10% shade from radiation.
  - If the meter is full: **Mission failed**. Try again starts over from Sol 1.
- **Solar storm:** sometimes a storm hits while you are outside. Go to the **radiation shelter** inside the
  Command Center: walking into it opens **Shield the Shelter!**. Put all 3 water tanks on the shelves
  (water blocks radiation) and the storm is over.

```
                     cliff route (canyon)
                        /    \________  Science Lab
                   FORK  \_ normal path _/
                     |
  Greenhouse ---- COMMAND CENTER ----+
                     |               |
                  airlock        Life Support
                     |
              solar panel yard + rover
```

From the Command Center: ◀ Greenhouse · ▲ Science Lab · ▶ Life Support · ▼ airlock (solar panels).
At the fork you choose the Normal path or the Cliff route; the astronaut then walks there by itself.

## Online version (automatic)

Every pull request is checked (`npm test`, `npm run build`). Every merge into `main` is published to
GitHub Pages automatically: the link above updates 1–2 minutes later (refresh the page to see it).
Pushing to another branch does **not** change the website until it is merged into `main`.

## Where things are

| File | What it is |
|---|---|
| `index.html` | the page and the **map drawing**, with one group per place; every CSS file is linked here |
| `src/main.js` | starts the game: loads the map, then every place |
| `src/map/map.js` | roads, walking, doors, keyboard; gives you `MarsMap` |
| `src/map/avatar.js` | the player character (`createAvatar`) |
| `src/map/mars-scenery.js` | the ground (mesa, craters, dunes) and the cliff / clear zones |
| `src/map/route-chooser.js` | "Which way to the Science Lab?" at the fork, and the automatic walk |
| `src/hud/hud.js` | side panel: mission clock, hazard meter, solar storm, EVA status, alarms, Mission failed (`MarsHUD`) |
| `src/ui/start-screen/` | MARTIANAUTS start screen, spaceship landing and the tour of the base |
| `src/ui/rooms/commandCenter.js` | the Command Center room (switchboard, battery, wardrobe, radiation shelter, bunks) |
| `src/places/<place>/` | each place's code and CSS |
| `src/state/gameStore.js` | the shared game state (Sol, resources, stars) |
| `src/systems/` | game logic with tests (Command Center, power, end of Sol, room walking) |
| `src/config/` | layout numbers for the Command Center room |

`src/map/` and `index.html` are shared: please don't change them without telling the team.

## The places

| Place | Folder | Group in `index.html` | Name in `enter` events | CSS prefix |
|---|---|---|---|---|
| Greenhouse   | `src/places/greenhouse/` (+ `src/features/greenhouse/`) | `place-greenhouse` | `'greenhouse'` | `gh-` |
| Science Lab  | `src/places/science-lab/` | `place-lab` | `'lab'` | `lab-` |
| Life Support | `src/places/life-support/` | `place-life` | `'life'` | `ls-` |
| Command Center (Member 1) | `src/places/command-center/` | `place-shelter` | `'shelter'` | `cc-` |
| Radiation Shelter, solar panels, HUD (Member 3) | `src/places/radiation-shelter/`, `src/hud/` | `place-shelter` | `'shelter'` | `rs-`, `sd-`, `hud-` |

### Radiation Shelter (Member 3)

- `shield-shelter.js` / `.css`: **Shield the Shelter!** In a solar storm, walking into the radiation shelter
  inside the Command Center room opens the water-tank game. Each tank on a shelf lowers the radiation
  inside (+0.5 → 0.3 → 0.2 → 0.1 per minute). With all 3 tanks the storm ends and you go back to the room.
  The tanks and the shelf are also drawn in the room's shelter.
- `solar-panel.js` / `.css`: **Clean solar dust.** ▼ from the Command Center goes through the airlock to
  the solar panel yard and the rover. Walk up to a panel and wipe the dust off all 3 panels.
- `src/hud/hud.js`: the clock, hazard meter, storms and alarms (see "How to play").
  Demo links: `?storm` (a storm will come), `?alarm` (red alarm now), `?fail` (Mission failed now).

## Adding to your place

1. **Your folder:** keep your JS and CSS in `src/places/<your-place>/`.
2. **Switch on your lines:** your JS in `src/main.js`, your CSS as a `<link>` in `index.html`.
3. **Draw only inside your own group** in the map (see the table above).
4. **Talk to the map through `MarsMap`** (the full list is at the bottom of `src/map/map.js`).

Starter for a place's JS file:

```js
const map = MarsMap;

// your game: runs when the player walks into your place
map.on('enter', place => {
  if (place === 'greenhouse') map.toast('Welcome to the Greenhouse!');
});
```

## Rules so nothing clashes

- Each place's JS file is its own module, so your names stay yours. Don't create globals called
  `MarsMap`, `MarsHUD`, `createAvatar` or `RadiationShelter`.
- **Start your CSS classes and ids with your prefix** (see the table). The map uses `mm-`.
- **Arrow keys / WASD:** don't add your own arrow-key listener on the map. Use `MarsMap.on('key', dir => ...)`
  and `return true` **only** while your own game is using the key (otherwise `return false`).
- **Pop-ups:** call `MarsMap.pause(true)` when your pop-up opens and `MarsMap.pause(false)` when it closes.
- **Top bar:** add your meters into `<div id="mm-topbar">` with `insertAdjacentHTML('beforeend', ...)`.
- **Radiation:** ask the HUD, don't keep your own meter: `MarsHUD.getHazard()`, `MarsHUD.isStorm()`,
  `MarsHUD.addHazard(n)`, `MarsHUD.status()` (`'go'` | `'caution'` | `'nogo'`).
- **Science Lab:** the roads to the lab (route chooser at the fork, and "Which way back?" when you leave
  the lab) belong to the Radiation Shelter game. The inside of the lab is all yours.
- Work on your own branch and open a pull request into `main`. Run `npm test` and `npm run build` first.
