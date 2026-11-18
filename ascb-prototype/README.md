# SIM prototype — visual-first revision

Open `index.html` in a modern browser, or reload the existing local page. This revision focuses on SIM only. The original dark Light Pattern Lab palette and typography are used throughout. There is no landing page, timed 90-second slideshow, modal lesson, or duplicate explainer.

## Page structure

1. Pattern on a real cell image → nine synthetic camera frames → a draggable widefield/SIM comparison.
2. The reconstruction directly below: select zero, one, two, or three orientations and inspect the separated band, shifted spectrum and recovered image.
3. Optional inline experiments for Fourier filtering and SLM/two-beam interference.
4. Source attribution and model assumptions.

Playback defaults to 400 ms per frame and can be changed to 200 or 800 ms. It loops through nine frames; step, scrub, select a thumbnail, or reset. Playback starts automatically unless reduced motion is requested. It pauses when the page is hidden, the acquisition leaves view, or a deeper section is opened. There is no audio narration.

## Image provenance

The reference is the same published actin image used in the earlier lab: Mo et al. (2023), “Quantitative structured illumination microscopy via a physical model-based background filtering algorithm reveals actin dynamics,” Figure 1b, DOI 10.1038/s41467-023-38808-8. LifeAct-EGFP-labeled actin in a COS-7 cell. CC BY 4.0.

https://pmc.ncbi.nlm.nih.gov/articles/PMC10227022/

The existing green-channel crop, resized to 256 × 256, is embedded in `lessons/sim/cell-data.js`. The original image and attribution remain in `lessons/sim/media/`. It is a published reconstructed image used as a synthetic specimen; it is not a CSR raw acquisition.

## Model

`sim-model.js` multiplies the reference by sinusoidal patterns with modulation 0.9, three phases and three integer-bin direction vectors: (24,0), (12,21), (-12,21). These approximate 0°, 60°, 120°. Each modulated image is passed through a circular detection transfer function with radius 24 cycles/crop and a two-bin cosine edge taper. This ideal low-pass filter is educational, not a calibrated microscope OTF.

The nine frames are demodulated using known phases. The resulting complex bands are shifted back to the specimen frequency coordinates and combined with transfer-function weights and small regularization (10^-6). Reconstruction uses the synthetic measurements, not the reference coefficients. Uniform illumination through the same detector generates the widefield control. The optional Fourier filtering experiment does use the reference coefficients and is labeled separately.

Display: fixed linear intensity scaling for the reference, widefield and reconstructed images; a shared 0.6 multiplier for modulated sample/camera frames; grayscale clipping for display only. The solver uses unclipped floating-point arrays. No noise, aberration, motion, bleaching, raw-data calibration or physical resolution estimate is modeled.

## Replacing the synthetic example

The user will provide the nine acquired frames later. Their ordering, orientation/phase metadata and matched reconstruction will be needed. Real acquisitions require their own pattern/OTF calibration; do not pass them through the ideal synthetic solver unchanged. The overview can display acquired frames and an independently reconstructed result while the ideal model remains an explicitly educational experiment.

## Files

- `index.html`: continuous SIM page.
- `sim.css`: shared dark presentation and responsive layout.
- `sim.js`: canvas drawing and interaction.
- `sim-model.js`: synthetic acquisition and reconstruction.
- `tests/sim-model.test.cjs`: checks phase averaging, directional recovery, inaccessible frequencies, brightness preservation and frame ordering.

Earlier prototype files remain available but are not loaded by the current entry page. The original `github-playground` source has not been edited.

## Run and verify

```sh
python3 -m http.server 8766 --bind 127.0.0.1
node --test tests/sim-model.test.cjs
```

Open http://127.0.0.1:8766/ . Stop the server with Control-C.

Checked via loopback HTTP: 1280 × 720 desktop composition, narrow-screen flow, exposure selection, speed selection, comparison divider, orientation reconstruction controls, beam toggles and optics reset. Numerical tests pass. Direct file URL automation is unavailable in the in-app browser; all runtime scripts and images are local and require no fetch or build step. Source links require Internet access.

The SPIN lesson now includes interactive focused/defocused ray paths with adjustable pinhole radius, matched synthetic widefield/confocal views linked to the focus slider, a layered z-stack, and a 1-versus-8-point scan comparison at equal illustrative dwell. Disk timing uses 4,000 rpm (15 ms per turn) divided by a logarithmic 100–10,000× display slowdown, default 1,000× (15 s per turn on screen). The illustrative 10 ms exposure and 5 ms hold use the same slowed simulation clock. The stationary dichroic composites after the lower disk so the lower surface cannot occlude it.

## Modality navigation

The top selector links SIM → SPIN → ODT using relative local paths, with the active modality highlighted. `modalities.css` supplies the shared icon navigation. SIM remains the default entry page. SPIN uses the prepared `lessons/spin/` simulation unchanged; ODT links to the existing `lessons/odt/` lesson. Legacy entry hashes `#spin` and `#odt` redirect to those lessons. All three pages also work as local HTML files.

Verified navigation SIM → SPIN → ODT → SIM, SPIN pause and focus-depth controls, and absence of browser console errors after integration.

ODT now opens with a compact live overview. `lessons/odt/overview.css` styles the visual-first layout; `tabs.js` switches Overview, Phase delay, Reconstruction, Real cells, and Optics & model panels, with keyboard navigation and hash links. The underlying optical simulations are unchanged. Browser checks covered overview rendering, tab switching, 3D reconstruction selection, phase-slider response, and console errors.
