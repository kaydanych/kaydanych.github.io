# Interactive tools

A portable static website hosted with GitHub Pages. The site uses a dark background, and each tool has its own subpage.

Website: https://kaydanych.github.io/

## Open locally

Open `index.html` in your browser. All links are relative, so the folder also works offline or under a GitHub Pages repository URL.

## GitHub Pages

Repository: `kaydanych/kaydanych.github.io`. Pages publishes the root directory of the `main` branch. Keep `.nojekyll` in the publishing root so these HTML files are served directly.

A personal homepage uses a repository named `YOUR_USERNAME.github.io`; a project repository uses a URL such as `YOUR_USERNAME.github.io/animation-tools/`. A custom domain can be added later.

## Directory layout

- `index.html`: collection homepage.
- `assets/site.css`: shared dark appearance and navigation.
- `assets/previews/`: lightweight SVG previews for the collection homepage.
- `tools/sim-mask-alignment/index.html`: equal-hole clipping comparison tool.
- `tools/waveplates/index.html`: quarter-wave and half-wave polarization simulator.
- `source/`: editable visualization fragments.

To add a tool, put its standalone page in `tools/TOOL_NAME/index.html` and add a link on the homepage. The existing exports include the simulator code and styles and require no server-side code.

These are geometric mask-plane models with illustrative normalized dimensions, rather than wave-optics predictions of the downstream screen image.

Commit and push changes to `main` to update the website. No build or package installation is required.

The wave-plate tool models an ideal lossless retarder. Input/output field traces use the plate’s fast and slow axes; advancing time shows a field oscillation at a fixed point, not a photon trajectory.
