# mars-mission-trainer
An interactive Mars survival and science game for children aged 7–12, developed for NASA Space Apps Challenge 2026.

## Run the game

```bash
npm install      # once
npm run dev      # then open the link it prints (http://localhost:5173)
```

(VS Code **Live Server** on `index.html` works too.)

Walk with the arrow keys or WASD. Walk to the end of a road to go inside a place.

```
                     cliff route (canyon)
                        /    \________  Science Lab
                   FORK  \_ normal path _/
                     |
  Greenhouse ---- COMMAND CENTER ----+
                     |               |
                  airlock        Life Support
```

From the Command Center: ◀ Greenhouse · ▲ Science Lab · ▶ Life Support.

Every merge into `main` is checked (`npm test`, `npm run build`) and published to GitHub Pages automatically.

## Where things are

| File | What it is |
|---|---|
| `index.html` | the page and the **map drawing**, with one group per place |
| `src/main.js` | starts the game: loads the map, then every place |
| `src/map/map.js` | roads, walking, doors, keyboard; gives you `MarsMap` |
| `src/map/map.css` | the map's look |
| `src/map/avatar.js` | the player character (`createAvatar`) |
| `src/places/<your-place>/` | **your** place's code and CSS |
| `src/systems/` | game logic with tests (power, end of sol) |

`src/map/` and `index.html` are shared: please don't change them without telling the team.

## Adding your place: 4 steps

1. **Make your folder:** `src/places/greenhouse/`, `src/places/science-lab/` or `src/places/life-support/`,
   with your JS (e.g. `greenhouse.js`) and CSS (e.g. `greenhouse.css`).
2. **Switch on your lines** (they are already there, just take away the comment marks):
   - your JS in `src/main.js`: `import './places/greenhouse/greenhouse.js';`
   - your CSS in `index.html`: `<link rel="stylesheet" href="/src/places/greenhouse/greenhouse.css">`
3. **Draw only inside your own group** in the map:

   | Place | Group in `index.html` | Name in `enter` events | CSS prefix |
   |---|---|---|---|
   | Greenhouse   | `place-greenhouse` | `'greenhouse'` | `gh-` |
   | Science Lab  | `place-lab`        | `'lab'`        | `lab-` |
   | Life Support | `place-life`       | `'life'`       | `ls-` |
   | Command Center + Radiation Shelter (Member 3) | `place-shelter` | `'shelter'` | `rs-`, `cc-` |

   You can replace the dashed spot inside your group from your JS.
4. **Talk to the map through `MarsMap`** (the full list is at the bottom of `src/map/map.js`).

Starter for your JS file:

```js
const map = MarsMap;

// draw your building inside your own group on the map
document.getElementById('place-greenhouse').innerHTML = `
  <!-- your drawing here (SVG, in the map's small "design" numbers) -->
`;

// your game: runs when the player walks into your place
map.on('enter', place => {
  if (place === 'greenhouse') map.toast('Welcome to the Greenhouse!');
});
```

## Rules so nothing clashes

- Each place's JS file is its own module, so your names stay yours. Don't create globals called
  `MarsMap`, `createAvatar` or `RadiationShelter`.
- **Start your CSS classes and ids with your prefix** (see the table). The map uses `mm-`.
- **Arrow keys:** don't add your own arrow-key listener. Use `MarsMap.on('key', dir => ...)` and
  `return true` **only** while your own game is using the key (otherwise `return false`).
- **Pop-ups:** call `MarsMap.pause(true)` when your pop-up opens and `MarsMap.pause(false)` when it closes.
- **Top bar:** add your meters into `<div id="mm-topbar">` with `insertAdjacentHTML('beforeend', ...)`.
- **Science Lab:** the Radiation Shelter game uses the two roads to the lab (route chooser at the fork,
  and "Which way back?" when you leave the lab). The inside of the lab is all yours.
- Work on your own branch and open a pull request into `main`.

## Radiation Shelter (Member 3)

Coming in the next pull request (`src/places/radiation-shelter/`). Until then the Command Center is a
dashed spot; `shelter.js` replaces it with the real building, airlock, solar panel and rover.
