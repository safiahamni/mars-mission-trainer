# Greenhouse feature

`food.js` contains pure crop-state transitions for Member 4. It does not mutate shared Power, Water, or Food values. Every successful planting, End Sol growth, or harvest result includes the resource cost or Food reward that the future `gameController.js` must approve and commit.

The catalog currently proposes three crops: red-leaf lettuce, radish, and dwarf tomato. Sol durations, costs, and Food rewards are game-balance choices, not NASA data. Coordinate the values with Members 2 and 3 before integration.

The greenhouse panel in `../../../prototypes/greenhouse-panel.html` is a standalone visual/interaction reference. It is not wired to Phaser or the shared controller yet; the repo currently has no app scaffold.

## Science notes and source references

The NASA science references support the crop choices, but the game timings and resource values remain fictional balancing values:

- NASA's space-gardening overview describes edible crops grown in ISS plant systems, including lettuces, radishes, tomatoes, and chile peppers: https://www.nasa.gov/humans-in-space/space-gardens/
- NASA's Plant Habitat-02 investigation used radishes as a nutritious edible crop with a short cultivation time: https://science.nasa.gov/biological-physical/investigations/plant-habitat-02-wvqpm/
- NASA's Advanced Plant Habitat description discusses LED lighting, porous clay substrate, water, and nutrients: https://science.nasa.gov/mission/advanced-plant-habitat/

Child-facing explanation: "Plants need light, water, and nutrients. Scientists test which crops and growing systems could help astronauts get some fresh food during long missions."

