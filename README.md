# Physics Interactive Lab — 3D Studio

**Ten experiments. Three dimensions. A clearer way to understand physics.**

[Open the live laboratory](https://206713-dotcom.github.io/physics-interactive-lab/) · [Browse the source](https://github.com/206713-dotcom/physics-interactive-lab) · [Automated checks](https://github.com/206713-dotcom/physics-interactive-lab/actions)

A browser-only laboratory for IGCSE and A Level exploration. Rotate a real WebGL scene, compare a calibrated diagram, change parameters, and follow the calculated graphs. Each experiment includes **three guided investigations, five worked questions, learning objectives, equations, assumptions and applications**: 30 investigations and 50 questions in total.

This is an independent student prototype and a proposed contribution to [FocusPhysics](https://focusphysics.com), not an official or endorsed FocusPhysics integration.

## What is in the laboratory?

| Experiment         | Explore                                                                               | Model                                             |
| ------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Mass & spring      | Mass, stiffness, displacement, damping, displacement/velocity/acceleration and energy | Linear spring with RK4                            |
| Orbital mechanics  | Both masses, separation, launch velocity, circular/elliptical/escape paths            | Relative two-body velocity Verlet                 |
| Nonlinear pendulum | Length, release angle, gravity, damping, bob mass                                     | Full sine equation with RK4                       |
| Projectile motion  | Launch speed, angle, height, gravity, quadratic drag                                  | RK4 with vacuum reference and ground contact      |
| Collisions         | Two masses and velocities, restitution, momentum, kinetic energy                      | Exact 1D contact event and impulse equations      |
| Wave studio        | Travelling/standing waves, superposition, wavelength, speed, probe position           | Analytic counter-propagating waves                |
| Double slit        | Wavelength, slit separation and width, screen distance, fringe intensity              | Fraunhofer interference with diffraction envelope |
| Bending light      | Two refractive indices, angle, wavelength, TIR and reflected power                    | Snell's law and unpolarised Fresnel reflectance   |
| RC circuits        | Supply, resistance, capacitance, charging/discharging, current and stored energy      | Exact exponential solutions                       |
| Electric fields    | Two charges, separation, movable probe, field and potential profiles                  | Coulomb superposition and geometric streamlines   |

## Run locally

Install Node.js 22 or newer:

```sh
git clone https://github.com/206713-dotcom/physics-interactive-lab.git
cd physics-interactive-lab
npm run dev
```

Open <http://localhost:4173/physics-interactive-lab/>. No install or build step, account, API key, backend or external runtime CDN is required. Chart.js 4.5.1 and Three.js 0.180.0 are vendored with their licences. Use HTTP rather than opening `index.html` directly, because the source uses JavaScript modules.

## Using the studio

- **3D:** drag / touch to rotate and scroll to zoom. With the canvas focused, arrow keys rotate, `+` / `−` zoom, and `0` resets the camera. A reset-camera button is also provided.
- **2D diagram:** switch at any time without restarting the physics. Diagram mode also serves browsers without working WebGL2.
- **Playback:** pause/resume, reset, single-step, 0.25×–4× speed and fullscreen. Space toggles playback when focus is not in a form control.
- **Parameters:** sliders and editable numbers use explicit units. Enter or blur commits a numeric edit. Invalid inputs show an explanation and restore the valid value. Parameters and presets start a fresh run.
- **Graphs:** choose time histories or explicitly labelled spatial/parameter curves. Zero is included to avoid visually magnifying tiny round-off changes in a circular orbit. Wave components use the same colours in the scene and graph.
- **Notebook:** record actual readings to compare different setups. Up to 12 readings per experiment are kept in this device's browser storage, with their numerical state and initial parameters. Nothing is uploaded. Clear readings from the notebook when needed.
- **CSV:** export up to 1,200 recent calculated time samples, or the selected calculated spatial/parameter curve. The first line gives the parameters, and headers label the units. Missing values near an excluded point charge or beyond a critical angle stay blank. No fabricated detections or experimental measurements are added.
- **Share:** copy a link that contains the current initial parameters, graph and camera mode. It opens a fresh run; it does not include the notebook or elapsed state.
- **Library:** search by topic or filter by subject. The experiment selector makes it easy to move between studios.

Reduced-motion preference starts experiments paused and keeps the home orbit preview still. Background tabs do not accumulate simulation time. Very small numerical readouts may display `≈ 0`; CSV exports retain their full numerical values.

## Physics and numerical methods

Models calculate in SI units. Interface conversions such as km, nm, µC, µF, mA and millimetres are labelled; angles in degrees are explicitly identified. Exported angles are labelled radians or degrees as appropriate. The physics modules are shared by the browser and tests.

### Mass–spring system

```text
m x″ + b x′ + kx = 0
ω₀ = √(k/m), f₀ = ω₀/(2π), T₀ = 2π√(m/k)
K = ½mv², U = ½kx², E = K + U
dE/dt = −bv²
```

Fixed RK4 step: **1/240 s**. A point mass starts at rest on a horizontal, frictionless support with a massless Hookean spring and optional linear damping. Period/frequency are undamped reference values. The spring ruler is in metres; block size and coil geometry are illustrative. Supported ranges: mass 0.2–5 kg, stiffness 1–100 N/m, initial displacement −0.8–0.8 m, damping 0–10 kg/s.

### Orbital mechanics

```text
G = 6.67430 × 10⁻¹¹ m³ kg⁻¹ s⁻²
F = GMm/r²
r″ = −G(M + m)r / |r|³
vc = √(G(M + m)/r₀), ve = √2 vc
μ = Mm/(M + m)
E = ½μv² − GMm/r
```

Fixed velocity-Verlet step: **2 s**. Both masses contribute to relative acceleration. Speed and separation are relative; energy is in the centre-of-mass frame. The camera follows the central body. Its absorbing surface has Earth-like mean density, `R = 6.371×10⁶ (M/5.9722×10²⁴)^(1/3) m`. Surface intersection is resolved on the drift segment before a singular acceleration can occur. There is no softening, atmosphere, thrust or relativistic correction. The satellite is treated as a point for collision.

At 1×, one real second represents one simulated hour. Orbits remain planar in the 3D scene. Linear distance scale adjusts to keep the trajectory visible; the spacecraft is an enlarged illustrative point marker. The faint grid identifies the orbital plane, rather than a physical ground. The cyan trail contains calculated positions and fades toward older samples. The planet grid and atmospheric rim are illustrative; no planetary rotation or atmospheric force is modelled. A run pauses at 100 initial separations, an explicit display limit. Supported ranges: central mass 10²⁴–2×10²⁵ kg, satellite mass 10²–10²³ kg, launch separation 8–40 million metres outside the surface, launch speed 0–25 km/s.

Gold **v** shows relative velocity; coral **a** shows relative acceleration. Their directions come from the state and inverse-square law. Arrow lengths use separate linear display scales with caps: in 3D, 1 scene unit per 6,000 m/s for velocity (maximum 2 units), and 0.38 scene units per m/s² for acceleration (maximum 2 units). In 2D, the scales are 1 px per 150 m/s (maximum 85 px) and 22 px per m/s² (maximum 75 px). They do not share units and should not be compared by length. Both vanish at impact, where the run stops. `r` marks centre-to-centre separation; altitude is `r − R`.

Scenario buttons preserve the chosen masses and launch separation and recalculate the launch speed. The interpretation panel shows circular and escape thresholds for that setup, the ideal Kepler period for a non-intersecting bound orbit, and a warning for trajectories that cross the absorbing surface. These predictions use the initial conic; the trail and graphs use the integrated state. Eccentricity is computed from its vector to avoid cancellation near a circle:

```text
κ = G(M + m), ε = v²/2 − κ/r, h = x vy − y vx
e⃗ = [(v² − κ/r)r⃗ − (r⃗ · v⃗)v⃗] / κ
e = |e⃗|, a = −κ/(2ε), rp = h²/[κ(1 + e)]
T = 2π√(a³/κ)  (bound trajectories)
```

The energy diagnostic reports `(E(t) − E(0))/|U(0)|`, so a zero-energy escape does not produce a meaningless division by zero. Orbital-element references: [Bryan Weber's derivation](https://orbital-mechanics.space/classical-orbital-elements/orbital-elements-and-the-state-vector.html) and [NASA/JPL eccentricity glossary](https://ssd.jpl.nasa.gov/glossary/eccentricity.html).

### Nonlinear pendulum

```text
θ″ = −(g/L) sin θ − βθ′
E = ½mL²θ′² + mgL(1 − cos θ)
Tsmall ≈ 2π√(L/g)
```

Fixed RK4 step: **1/240 s**. The model uses a rigid massless link and point bob; a flexible string could go slack at large release angles. The full sine term is retained, so the small-angle period is labelled as an approximation. Mass changes energy, not angular motion. β is angular damping in s⁻¹.

### Projectile motion

```text
v′ = (0, −g) − β|v|v
x′ = vx, y′ = vy
Evacuum/m = ½|v|² + gy
```

Fixed RK4 step: **1/240 s**. Uniform gravity, flat ground and constant quadratic drag coefficient per unit mass β (m⁻¹). Ground contact is interpolated within the final step and stops the run. The dashed reference is the analytic zero-drag prediction from the same initial conditions. Energy is **specific energy in J/kg**, not joules. Lift, spin, wind and changing atmospheric density are omitted. The 3D scene shows the same planar trajectory.

### Collisions

```text
m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂
v₂ − v₁ = e(u₁ − u₂)
Kloss = ½[m₁m₂/(m₁ + m₂)](1 − e²)(u₁ − u₂)²
```

Both carts translate exactly between events. The model solves contact time within a display step and applies the simultaneous conservation/restitution equations once. The rail has no external horizontal force or wall collision. Cart length is 0.8 m, initial centre positions are −2 and +2 m, and the observation ends after 10 s. The camera may zoom as carts separate. Restitution is limited to 0–1.

### Waves and superposition

```text
y(x,t) = A sin(kx − ωt) + RA sin(kx + ωt)
k = 2π/λ, ω = kv, f = v/λ
For R = 1: y = 2A sin(kx) cos(ωt)
```

An exact analytic model on an extended linear medium. The displayed 0–8 m segment does not impose endpoint boundary conditions. Equal counter-waves produce fixed nodes spaced λ/2 apart. The 3D ribbon is a visual representation with exaggerated transverse scale; no tension or energy measurement is inferred from its width or shading.

### Double-slit interference

```text
sin θ = y/√(L² + y²)
I/I₀ = sinc²(πa sin θ/λ) cos²(πd sin θ/λ)
sinc(z) = sin(z)/z, sinc(0) = 1
Central fringe spacing ≈ λL/d
Envelope first minimum ≈ λL/a
```

Coherent monochromatic illumination, identical slits and the Fraunhofer approximation. The screen graph shows **time-averaged normalised intensity**, including finite slit-width diffraction. The two spacing readouts are small-angle approximations. Screen brightness uses a square-root display mapping for visibility; colour is an approximate wavelength palette. Apparatus and wavefront spacing/propagation are schematic, enlarged and slowed. No photons or detections are generated.

### Refraction and reflection

```text
n₁ sin i = n₂ sin r
critical angle = asin(n₂/n₁), only for n₁ > n₂
v = c/n, λmedium = λvacuum/n
Rs = [(n₁ cos i − n₂ cos r)/(n₁ cos i + n₂ cos r)]²
Rp = [(n₂ cos i − n₁ cos r)/(n₂ cos i + n₁ cos r)]²
Runpolarised = (Rs + Rp)/2
```

Lossless, homogeneous, non-dispersive media with a flat interface. No propagating transmitted ray is drawn during TIR. Ray brightness is illustrative; the reflected-power readout uses the Fresnel equations. Pulses are slowed for visibility and retain the incident wavelength colour. Evanescent fields, absorption, multilayer interference and dispersion are omitted.

### RC circuits

```text
τ = RC
Charging: Vc = V₀(1 − e^(−t/τ)), I = (V₀/R)e^(−t/τ)
Discharging: Vc = V₀e^(−t/τ), I = −(V₀/R)e^(−t/τ)
Q = CVc, U = ½CVc²
```

Exact analytic solutions for an ideal circuit. Charging starts at zero voltage; discharge starts at V₀ with the source disconnected. Changing mode starts a new run, not a live switching transient. The clock uses steps of 1/2400 s, and sampling scales with τ. Short time constants play more slowly, with the time scaling stated below the scene. The run ends at six time constants. Moving dots indicate **conventional-current direction and relative magnitude**, not electron drift speed; dots do not traverse the capacitor dielectric.

### Electric fields

```text
k = 8.9875517923 × 10⁹ N m²/C²
E = Σ kqᵢrᵢ / |rᵢ|³
V = Σ kqᵢ/|rᵢ|
```

Fixed ideal point charges and a passive probe. Points within 0.16 m of a non-zero charge are explicitly excluded, without softening Coulomb's law. Field lines use midpoint integration of the normalised field direction; line count is illustrative. The 3D representation rotates representative meridional streamlines around the charge axis. Lines are geometric maps, not particle trajectories. Spatial profiles are cuts at the probe's current y position and contain gaps at excluded points.

### Shared display and clock rules

The camera never changes the numerical state or graph data. Most systems are intentionally planar even when viewed in 3D. Object size, grid spacing, glow and arrows may be illustrative; calibrated quantities are explicitly labelled. Fixed substeps are independent of animation speed. A long frame is capped at 0.1 real seconds to avoid an unstable catch-up step; on a slow device, simulated time can therefore advance less than wall time. Unit-converted slider endpoints tolerate a few floating-point rounding units, while genuinely invalid values remain rejected.

## Accuracy and testing

```sh
npm test
npm run check
```

There are **50 tests** using Node's built-in runner. They exercise the same functions used by the website, including:

- Default spring position against the analytic solution over 30 s, with maximum error below 10⁻⁶ m; default undamped energy drift below 10⁻⁷ over 120 s.
- Worst supported spring frequency with energy drift below 0.04% over 120 s; damping and critical/overdamped behaviour.
- Orbital inverse-square force, circular radius/energy over ten periods, elliptical energy/angular momentum, escape, surface contact and supported corners.
- Circular eccentricity at arbitrary phases, analytical conic elements, a complete Kepler period, surface-crossing classification and setup-preserving scenario speeds.
- Nonlinear pendulum energy conservation, small-angle agreement, large-angle period increase and mass independence.
- Projectile vacuum range/flight time, energy, drag effects and complementary angles.
- Collision momentum, restitution, energy loss and contact resolution across parameter combinations.
- Standing-wave nodes, antinode amplitude, propagation and superposition.
- Interference symmetry, intensity bounds, dark fringes and diffraction minima.
- Snell's law, Fresnel reflection, critical angle, TIR and equal-index media.
- RC one-time-constant fractions, current/charge derivative and stored energy over supported corners.
- Field/potential scaling, dipole and like-charge cancellation, singularity handling and E = −∇V.
- All ten catalogue entries, 30 valid presets, 30 investigations and 50 questions; finite dynamic parameter corners and spatial datasets; invalid inputs and converted endpoints.

These are bounded regression checks for the stated scenarios, not claims of exact or indefinite numerical conservation. `npm run check` verifies assets, every relative JavaScript module import, vendored libraries and GitHub Pages subdirectory compatibility. GitHub Actions runs both commands on pushes and pull requests.

Browser verification covers all ten 3D scenes and all ten 2D views, camera controls, graph selection, pause/reset/step, presets, editable inputs, notebook, lesson resources, CSV/share actions and responsive layouts. WebGL failure has an explicit diagram fallback rather than an empty experiment.

## GitHub Pages deployment

This project publishes from **main → / (root)**. It has no build step and includes `.nojekyll`.

1. Push source to `206713-dotcom/physics-interactive-lab` (or fork to your account).
2. In **Settings → Pages → Build and deployment**, select **Deploy from a branch**.
3. Choose **main** and **/ (root)**, then save.
4. Wait for the **pages-build-deployment** workflow to succeed.
5. Open `https://YOUR-USERNAME.github.io/physics-interactive-lab/` and verify both assets and hash routes such as `#/pendulum`.

All runtime assets are relative, including Three.js's core import, so the repository subdirectory works. For a fork, update the repository/footer links to your own account. See [GitHub's publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Source structure

```text
index.html                   Semantic shell, experiment selector and local assets
styles.css                   Base layout, controls and lesson styles
studio.css                   Responsive v2 catalogue and 3D studio design
js/app.js                    Small application bootstrap
js/studio-app.js             Routes, playback, controls, Chart.js, notebook, export
js/simulations.js            Declarative catalogue and graph/parameter configuration
js/physics.js                Spring and orbital models, shared validation
js/physics-extra.js          Eight additional pure physics models
js/canvas.js                 Original calibrated spring/orbit diagram renderers
js/render2d.js               Additional diagram renderers
js/scene3d.js                Three.js scenes, camera controls and GPU lifecycle
js/content.js                Spring/orbit teaching resources
js/content-extra.js          Eight additional lesson packages
tests/physics.test.mjs        Original 16 physics regression tests
tests/expanded.test.mjs       29 expansion, catalogue and validation tests
tests/orbit-refinement.test.mjs Five focused orbital elements/scenario regressions
scripts/serve.mjs            Dependency-free local static server
scripts/check.mjs            Required assets and relative-import checks
vendor/                      Pinned Chart.js and Three.js modules and licences
.github/workflows/test.yml   Continuous physics and asset checks
```

To add an experiment, implement a pure model, register its parameters, presets, samples and graphs in `simulations.js`, add a renderer and teaching package, and test its invariants. Avoid advancing physics inside a rendering function.

## References and licences

Each lesson links to the relevant [OpenStax University Physics](https://openstax.org/subjects/science) chapter. Further references: [NIST gravitational constant](https://physics.nist.gov/cgi-bin/cuu/Value?bg), [Chart.js](https://www.chartjs.org/docs/latest/), [Three.js](https://threejs.org/docs/).

Original source is MIT licensed; see [LICENSE](LICENSE). Chart.js and Three.js retain their separate MIT licences in `vendor/Chart.LICENSE.md` and `vendor/Three.LICENSE.txt`.
