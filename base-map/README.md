# Mars Base Map: how to add your place

Open `main.html` with **Live Server** (VS Code) to play.
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

## Shared files (please don't change them without telling the team)

| File | What it does |
|---|---|
| `main.html` | the page and the map drawing, with one spot for each place |
| `main.css`  | the map's look |
| `main.js`   | roads, walking, doors, keyboard; gives you `MarsMap` |
| `avatar.js` | the player character (`createAvatar`) |

## Adding your place: 4 steps

1. **Make your own folder** next to `main.html`, e.g. `greenhouse/`, `science-lab/`, `life-support/`.
2. **Add your files to `main.html`**: there are ready lines for each place
   (CSS at the top, scripts at the bottom). Just take away the comment marks around yours.
   Your scripts must load **after** `main.js`.
3. **Draw only inside your own group** in the map:

   | Place | Group in `main.html` |
   |---|---|
   | Greenhouse   | `<g id="place-greenhouse">` |
   | Science Lab  | `<g id="place-lab">` |
   | Life Support | `<g id="place-life">` |
   | Command Center (Member 3) | `<g id="place-shelter">` |

   You can replace the dashed spot inside your group from your own JS
   (`document.getElementById('place-greenhouse').innerHTML = '...'`).
4. **Talk to the map through `MarsMap`** (see the list at the bottom of `main.js`).

## Rules so nothing clashes

- **Wrap your JS** in a function so your names stay yours:
  ```js
  (function () {
    const map = MarsMap;
    map.on('enter', place => {
      if (place === 'greenhouse') map.toast('Welcome to the Greenhouse!');
    });
  })();
  ```
  Don't create global names called `MarsMap`, `createAvatar`, `AVATAR_CSS` or `RadiationShelter`.
- **Start your CSS classes and ids with your own prefix**:
  Greenhouse `gh-`, Science Lab `lab-`, Life Support `ls-` (Radiation Shelter uses `rs-` and `cc-`; the map uses `mm-`).
- **Arrow keys:** don't add your own arrow-key listener. Use `MarsMap.on('key', dir => ...)` and
  `return true` **only** while your own game is using the key (otherwise return `false`).
- **Pop-ups:** call `MarsMap.pause(true)` when your pop-up opens and `MarsMap.pause(false)` when it closes.
- **Top bar:** add your meters into `<div id="mm-topbar">` with `insertAdjacentHTML('beforeend', ...)`.
- **Science Lab:** the Radiation Shelter game uses the two roads to the lab (route chooser at the fork,
  and "Which way back?" when you leave the lab). The inside of the lab is all yours.

## Radiation Shelter (Member 3)

Coming in the next push (`radiation-shelter/`). Until then the Command Center is a simple dashed spot;
`shelter.js` replaces it with the real building, airlock, solar panel and rover. Everything else already works.
