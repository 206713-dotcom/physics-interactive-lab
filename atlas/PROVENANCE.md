# Solar Atlas source

Adapted, at the project owner's request, from their **Muon Atlas** project in
`Muography/muon-atlas/dist`. Original modules: `astronomy.js`, `astronomy-data.js`,
`astronomy-math.js`, `world-interiors.js`, `visual-detail.js`, `astronomy.css` and
`math-typesetting.js`. This is the actual explorer source, including its 20-world
catalogue, procedural surfaces, ring shader, moon guides, interior cutaways,
altitude calculations and energy-balance experiment.

The host adapter uses this repository's pinned Three.js runtime. Changes include
local module paths, a dedicated accessible page, larger type, responsive layout,
reduced-motion handling, navigation back to this lab, corrected focused-body
placement after date changes, and clearing desktop camera offsets on mobile.
The muon detector, far-future and universe simulations are not bundled here.

- Planet positions: [JPL approximate elements](https://ssd.jpl.nasa.gov/planets/approx_pos.html), restricted here to 2000–2049. UTC approximates dynamical time. Earth represents the Earth–Moon barycentre. These are educational approximations, not navigation ephemerides.
- Planet properties and world guides retain NASA/JPL source links in the explorer.
- Earth texture: the original project's NASA Blue Marble asset; other maps are deterministic illustrations, not measured imagery.
- Distances are logarithmically compressed. Body radii are enlarged separately. Spin, belt dots, moon placements and interior boundaries are schematic.
- KaTeX 0.19.0 is served locally, with its MIT licence in `vendor/katex/LICENSE.txt`. Only WOFF2 fonts are bundled, supported by current browsers.
- OrbitControls is from the original project, using the existing Three.js MIT licence at `../vendor/Three.LICENSE.txt`.
