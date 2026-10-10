# Focus Finder

A minimal 10-second microscope focus game. Press Start and hold Up/Down to keep a swimming bacterium sharp. Its Z route changes each round, alternating pauses and smooth depth moves. The focus control runs at 48 depth units/second; Z motion is 1.5× its initial randomized speed. XY motion is independent.

The score averages continuous quality `exp(-(depth error / 7)^2)` over the entire round and displays 0–100% with one decimal. Named scores are stored in a top-10 leaderboard in this browser only. Nothing is sent to a server. Localhost and GitHub Pages have separate browser storage. Original threshold-based results remain in a collapsed legacy leaderboard, evaluated against their original 15-second duration.

The bacterium, flexible membrane, flagellum, internal motion and reversing defocus fringes are stylized visual effects, not a calibrated biological or optical simulation. Bright outer fringe suggests Up; dark outer fringe suggests Down.

No build, dependencies, external assets or hardware connection. Open index.html locally or serve the folder. Switching tabs pauses play.
