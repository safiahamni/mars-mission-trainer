# Mars Mission Trainer · Science Lab

Run `npm.cmd run dev` in PowerShell and open http://127.0.0.1:5173. Run `npm.cmd test` to verify route reachability, the initial completion gate, insufficient power and one-time rewards. Node.js is the only dependency for this isolated browser prototype.

Chapter 1 is playable using a keyboard or on-screen buttons. Chapters 2–6 have chapter cards and source entries. The demo starts at 80 Power and resets when the page reloads. The scoring adapter only handles Chapter 1. The remaining chapters, seven-Sol lifecycle, other stations, and shared-state integration belong to subsequent team work.

## Integration and GitHub

Member 1 owns the team repository, Phaser map and PR review. Member 2 owns shared resource state. Once the team checkout and base branch are identified, create a feature branch from the team base. Adapt the demo controller calls to the team's shared controller and connect the Science Lab interaction to the board. Port the route/rendering layer to the team's Phaser scene as needed. Submit the Science change in a PR for Members 1 and 2, with Chapter 1's playtest and its Source links in the description.

The shared controller should check Power at launch, then recheck and atomically apply -10 Power, +15 Science, +1 Star, the completed mission ID and MOXIE eligibility on first successful completion. Confirm how the controller handles a major activity slot. The later one-star decision supersedes the older three-star mockup for this prototype. Ask Member 2 to align the Life Support wording when integrating.

## Scientific sources

Each fact in src/scienceFacts.js includes its primary NASA or JPL source. Rover Rescue shows three sources directly in its discovery journal. Paths, battery pickup, beacons, points, resource costs and unlock thresholds are game mechanics. The rover is remotely operated in the story. Its route does not deduct crew oxygen or check an astronaut EVA warning. The prototype uses game icons and no NASA photos.
