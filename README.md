# Simulations Playground

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
- `tools/slm-to-sample/index.html`: SLM diffraction, Fourier filtering, and objective illumination.
- `tools/pbs-slm-polarization/index.html`: polarization routing through a PBS and reflective FLC SLM.
- `source/`: editable visualization fragments.

To add a tool, put its standalone page in `tools/TOOL_NAME/index.html` and add a link on the homepage. The existing exports include the simulator code and styles and require no server-side code.

These are geometric mask-plane models with illustrative normalized dimensions, rather than wave-optics predictions of the downstream screen image.

Commit and push changes to `main` to update the website. No build or package installation is required.

The wave-plate tool models an ideal lossless retarder. Input/output field traces use the plate’s fast and slow axes; advancing time shows a field oscillation at a fixed point, not a photon trajectory.

The SLM-to-sample tool uses schematic equivalent thin lenses and selectable diffraction orders. It illustrates field and pupil conjugates; it is not a quantitative wave-optics simulation.

The PBS–SLM tool models an ideal reflective ferroelectric pixel as a round-trip half-wave retarder. Binary phase mode uses axes ±22.5° about incident s; amplitude mode uses 45°/0°. The PBS reflects s and transmits p. Power is relative to the incident laser, before diffraction and component losses. The input HWP controls coupling; the downstream QWP controls the selected output polarization. This PBS layout is a variant: the HIT-SIM paper separates paths using a small SLM incidence angle.

The PBS–SLM diagram places the laser below the PBS, the SLM on the right, and the Fourier-filter output on the left. Presets set HWP=45° for maximum input coupling. SIM phase mode uses QWP=45° and transmits 50% in either pixel state with opposite phase. Maximum-output presets use amplitude mode, pixel A, and QWP=0° (linear) or 45° (circular), yielding 100% ideal power at the output port; pixel B is dark. These are not predictions of useful diffraction-order power at the sample.

The compact PBS view uses one preset selector and a pixel A/B switch. Polarization glyphs sit on the optical path; the input HWP remains at 45° in all presets. The standalone page is sized for laptop displays, without separate field plots or angle sliders.

## Spike Studio

`tools/spike-studio/` contains a dependency-free neural spike explorer with synchronized audio, neuron selection, schematic sleep activity, and WAV/JSON/PNG export. All data and voltage-like traces are simulated; the population rate is not EEG. Playback starts paused and pauses when the page is hidden.

## Light Pattern Lab

The SLM-to-sample page is now an interactive binary-phase-grating lab with order selection, analytic two-beam interference, phase/orientation/density controls, and a single-screen nine-exposure acquisition animation. It is an idealized 2D-SIM illumination model, not a reconstruction. The previous diagram remains at `tools/slm-to-sample/classic.html`.

### Acquisition and Fourier lesson

Five illustrative grating presets (2D-SIM1–5) drive a looping nine-frame acquisition with play/pause/step/rewind and a fixed 400 ms display interval. Preset frequencies are 0.40, 0.55, 0.70, 0.85, 1.00 times the fluorescence detection cutoff, assuming equal excitation/emission wavelengths; these are not calibrated hardware settings.

The cell lesson uses LifeAct-EGFP actin from Mo et al. (2023), CC BY 4.0. It includes an interactive frequency-to-pattern map, an actual 2D FFT / inverse FFT filtering experiment, and a same-image demonstration that adds the six shifted Fourier regions cumulatively. This is an ideal frequency-coverage illustration, not an end-to-end SIM reconstruction. The published reference is not raw measurement data or a calibrated NA simulation. See `tools/slm-to-sample/media/ATTRIBUTION.md` for provenance and processing.

Run `node --test tests/slm-lab.test.cjs tests/fourier-math.test.cjs` for acquisition timing, mixing, coverage, and numerical transform checks.
