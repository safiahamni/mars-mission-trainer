# Greenhouse game (Member 4)

This feature owns the greenhouse room, food production, plant beds, and greenhouse station challenges. `main.js` currently opens this room directly while the base map and shared game controller are being integrated.

## Files

- `GreenhousePanel.js` renders the room map, room movement, station mini-games, HUD, and task list.
- `path.js` is the single source for walkable-path drawing and avatar collision, using greenhouse room coordinates.
- `avatar.js` draws the shared player character and provides its eight-direction facing and walking animation.
- `food.js` contains pure crop planting, Sol growth, and harvest transitions.
- `greenhouseDemoController.js` provides temporary greenhouse state until it can connect to the shared game controller.
- `prototypes/greenhouse-panel.html` opens the app preview when served by Vite.

## Gameplay loop

- Plant leafy greens in the unlocked beds. Potato and millet unlock after perchlorate falls below 30.
- Temperature and light use crop-specific target bands. Lock both in range for 3 seconds to raise crop health by 10. A failed setting slows growth by 25%; higher light uses more power.
- Soil treatment follows scoop, microbes, wait, and test. The 5-second wait continues while another station is open. A completed batch lowers perchlorate by 20; testing too early wastes water and nutrients.
- Sort five organic items into Compost, Reuse, or Discard in 20 seconds. At least 4 of 5 correct adds organic matter and nutrients. Contamination raises perchlorate and causes pest damage.
- A power outage occurs at Sol 3. Lights and pumps stop until the player matches the colored wires. Leaving it unrepaired drains crop health at each Sol.
- A radiation sweep starts at Sol 5. Slide and rotate a shield panel for each bed, then lock all four to block the beam.
- End Sol advances crops, spends water, power, and nutrients, and may trigger mission events. Water/power used and remaining stores are visible in the HUD.

All crop bands, resource units, durations, yields, and event penalties are proposed game values, not NASA engineering specifications. The temporary adapter should be replaced by Member 2's shared state/controller during integration.
