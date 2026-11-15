# Shared game state: one set of numbers for every room

Every room reads and changes the **same** sol, power, water, oxygen, food and chapter.
They all live in `src/state/gameStore.js`. Please don't keep your own copies
(`powerTempStore.js`, `missionTempStore.js`, a demo controller with its own power), because then
each room shows different numbers.

## The numbers

| Name | Starts at | Goes up | Goes down |
|---|---|---|---|
| `power` (battery 0–100) | 60 | Sun every morning: +55 clean panels, +20 dusty, +5 dust storm | Systems, EVA trips, chapters, night reserve 20 |
| `water` | 48 | Water recycler +15 | Crew drinks 10 every night, watering plants |
| `oxygen` | 55 | MOXIE +15 | Crew breathes 10 every night |
| `food` | 40 | Greenhouse harvests | Crew eats 10 every night |
| `sol` | 1 | Only when the crew **sleeps in the Command Center** | Never |

Rooms never end the sol themselves. There should be no "End Sol" button outside the Command Center.

## A day

1. Morning: the sun charges the battery.
2. Chores in any room (they cost power / water).
3. Today's Science Lab chapter. When it's finished, the sun sets.
4. Night: sleep in the Command Center. The crew uses 20 power, 10 water, 10 oxygen and 10 food.

## Code for rooms that can `import` (Greenhouse, Life Support, …)

```js
import { getResources, usePower, addResource, onGameChange } from '../../state/gameStore.js';

getResources();
// -> { sol, phase: 'day' | 'night', power, water, oxygen, food, stars, chapter }

const r = usePower(5, 'Grow lights');      // pay power
if (!r.ok) showMessage(r.message);          // "Grow lights needs 5 power. Need 2 more."

addResource('water', -5, 'Watering');       // use water (ok: false if there isn't enough)
addResource('food', 20, 'Harvest');         // add food

onGameChange(() => redrawMyHud());          // redraw when any room changes the numbers
```

## Code for the Science Lab (it runs in an iframe)

The iframe is on the same site, so it can use the game through `window.parent.MarsGame`:

```js
const game = window.parent.MarsGame;

game.resources();      // { sol, phase, power, water, oxygen, food, stars, chapter }
                       // chapter = the chapter that is open TODAY (1–6)

const r = game.start(); // when today's chapter opens: checks the gate and pays the cost
if (!r.ok) showMessage(r.message);   // e.g. "Not enough to start Chapter 2. Need: oxygen 60."

game.finish();          // when the chapter is complete: sunset, "head back and sleep"
```

Chapter numbers, gates and costs are the Lab's `missions.js` values:

| Chapter | Lab id | Needs | Costs |
|---|---|---|---|
| 1 | `rover-rescue` | power 15 | 10 |
| 2 | `mystery-rocks` | power 25, oxygen 60 | 15 |
| 3 | `cosmic-claw` | power 35, water 40 | 20 |
| 4 | `snapshot-safari` | power 30, food 50 | 15 |
| 5 | `lost-lake` | power 45, oxygen 65, water 50 | 25 |
| 6 | `message-earth` | power 50, oxygen 60, food 40, water 40 | 30 |

`start()` pays the cost when the chapter **opens**, so the Lab shouldn't take power off again at the end.

## Testing in the browser

Open the console (F12) while the game runs:

```js
MarsGame.resources()          // see all the numbers
MarsGame.usePower(5, 'Test')
MarsGame.addResource('food', 20, 'Test harvest')
MarsGame.start(); MarsGame.finish()   // play today's chapter instantly
```
