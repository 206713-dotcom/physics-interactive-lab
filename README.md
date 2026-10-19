# Physics Interactive Lab

**Turn equations into experiments.** A browser-only physics laboratory built for IGCSE and A Level students, with two working numerical simulations, live Chart.js graphs and classroom investigations.

[Open the lab](https://206713-dotcom.github.io/physics-interactive-lab/) · [Source](https://github.com/206713-dotcom/physics-interactive-lab)

An independent student prototype prepared for discussion with the Head of Physics and as a proposed contribution to [FocusPhysics](https://focusphysics.com). It is not an official FocusPhysics product or endorsed integration.

## Run locally

Install Node.js 22 or newer, then run:

```sh
git clone https://github.com/206713-dotcom/physics-interactive-lab.git
cd physics-interactive-lab
npm run dev
```

Open <http://127.0.0.1:4173/physics-interactive-lab/>. No package installation, build step, account, API key or backend is required. Chart.js 4.5.1 and its MIT licence are included in `vendor/`, so runtime graphs do not require a CDN. Use an HTTP server instead of opening `index.html` directly, because the source uses JavaScript modules.

## The simulations

### Simple harmonic motion

A horizontal ideal spring and mass, released from rest. Adjust mass (0.2–5 kg), stiffness (1–100 N/m), signed initial displacement (−0.8–0.8 m) and linear damping (0–10 kg/s). Watch the animated spring alongside independent displacement, velocity and acceleration plots, or switch to energy traces. The natural period, natural frequency and angular frequency are always labelled as undamped reference values. The damped period is shown for underdamped motion.

### Newton’s law of gravitation

A Newtonian two-body orbital model with adjustable central mass (10²⁴–2×10²⁵ kg), satellite mass (10²–10²³ kg), centre-to-centre launch separation (8–40 million metres, outside the central surface) and initial tangential relative speed (0–25 km/s). Circular, elliptical and escape presets make useful comparisons. The satellite-mass slider is logarithmic; its numeric input is in kg. Charts show relative speed, separation or energy. A calibrated distance bar and calculated trail accompany the animation.

### Teaching tools

- Pause, resume, reset and 0.25×–4× playback speed.
- Toggle velocity vectors and orbital trails.
- Each parameter change resets the run to prevent mixing different experiments.
- Three guided investigations, five questions with worked answers, learning objectives, equations, assumptions and applications **per simulation**.
- Share a URL containing the current initial parameters. Opening it creates a fresh run.
- Export up to 600 recent calculated samples as CSV in SI units. The first line records the initial parameters; the second contains column headers. No synthetic experimental results are added.
- Hash navigation and relative asset paths work under a GitHub Pages repository subdirectory.
- Responsive desktop, tablet and phone layouts; keyboard controls, labelled inputs and accessible learning tabs. Reduced-motion preference starts simulations paused. Background tabs do not accumulate simulation time.

## Physics and numerical methods

All calculations use SI units. Display conversions are explicitly labelled.

### Spring

The equation of motion is

```text
m x″ + b x′ + kx = 0
a = −(kx + bv)/m
ω₀ = √(k/m),  f₀ = ω₀/(2π),  T₀ = 2π√(m/k)
K = ½mv²,  U = ½kx²,  E = K + U
dE/dt = −bv²
ζ = b/(2√(km))
ωd = √(k/m − (b/2m)²)   when ζ < 1
```

Fourth-order Runge–Kutta advances position and velocity at a fixed **1/240 s** step. The mass begins at the selected displacement with zero velocity. The spring is massless and linear, on a horizontal frictionless support. The block and spring length are illustrative; the ruler maps displacement linearly in metres. Damped motion is not exact SHM. For critical or overdamping there is no oscillation period.

At 1× playback one real second advances one simulated second. Accumulated time is subdivided into fixed integration steps; changing animation speed never changes the physics step. A long frame is capped at 0.1 real seconds, so a slow or background device can advance less simulation time than wall time instead of taking unstable large steps.

### Gravitation

```text
G = 6.67430 × 10⁻¹¹ m³ kg⁻¹ s⁻²
F = GMm/r²
r″ = −G(M + m) r / |r|³
vc = √(G(M + m)/r₀),  ve = √2 vc
μ = Mm/(M + m)
K = ½μv²,  U = −GMm/r,  E = K + U
T_circular = 2π√(r³/[G(M + m)])
```

Velocity Verlet advances the relative position and relative velocity at a fixed **2 s** step. Including both masses makes the dynamics meaningful even at the largest supported satellite mass. Mechanical energy uses reduced mass and belongs to the **centre-of-mass frame**; speed and separation are relative quantities. The visual camera follows the central body, whose rest frame is not inertial for non-negligible satellite mass.

The central sphere has fixed Earth-like mean density:

```text
R = 6.371 × 10⁶ × (M/[5.9722 × 10²⁴])^(1/3) metres
```

Runs stop at the first surface intersection, interpolated on the Verlet drift segment. This absorbing boundary avoids the point-mass singularity; there is no gravitational softening. Energy interpretation and conservation tests apply before impact. The satellite is treated as a point object for collision, even when its mass is large. Drag, thrust, other celestial bodies, deformation and relativistic effects are omitted.

At 1× playback one real second advances **one simulated hour**. The scene uses a common linear distance scale and automatically zooms out. The satellite marker and velocity vector are enlarged for visibility. Trail points are numerically calculated positions, limited to 2,000 recent samples. An escaping trajectory pauses at 100 initial separations; this is a display limit, not a physical edge of gravity.

## Tests and accuracy

```sh
npm test
npm run check
```

The Node built-in test runner exercises the same pure physics functions used in the browser. No test dependencies are required. The 16 tests cover:

| Check | Acceptance criterion |
| --- | --- |
| Default spring against analytic cosine, 30 s | Maximum position error < 10⁻⁶ m |
| Undamped default spring energy, 120 s | Relative drift < 10⁻⁷ |
| Highest supported spring frequency, 120 s | Relative energy drift < 0.04% |
| Damped release | Mechanical energy decreases, tends to equilibrium |
| Critical and overdamping | No crossing of equilibrium from rest |
| All spring parameter corners | Finite state and no energy increase |
| Inverse-square law | Doubling r gives ¼F; tripling r gives F/9 |
| Circular orbit, 10 periods | Radius error < 10⁻⁶; relative energy drift < 10⁻⁹ |
| Elliptical orbit, 100,000 s | Energy drift < 10⁻⁵; relative angular momentum error < 10⁻¹¹ |
| Escape | Zero energy at threshold; outward unbound path above threshold |
| Surface collision | Finite state, stops at model radius |
| Supported orbital corners | Finite states, including massive satellites |
| Invalid input | Nonfinite, out-of-range and inside-surface setups rejected |

Other assertions check units, known periods, restoring acceleration and mass/stiffness scaling. These numerical bounds are regression thresholds for the documented durations and setups, not claims of exact or indefinite conservation. GitHub Actions runs the checks on pushes and pull requests. `npm run check` verifies required files, vendored Chart.js and subdirectory-safe asset paths.

Manual browser checks: open both routes, pause and resume, edit sliders and numeric inputs, reset, select each launch preset and graph, open the learning tabs and answers, export data and reopen a shared setup link. Resize to a tablet or phone viewport. Use `?` parameters after a route, for example `#/spring?mass=1&k=20&displacement=0.5&damping=0`.

## Deploy to GitHub Pages

The project is static and publishes directly from the repository root.

1. Create a **public** repository named `physics-interactive-lab` in your GitHub account if it does not already exist.
2. Commit and push the project:

   ```sh
   git init -b main
   git add .
   git commit -m "Build interactive physics laboratory"
   git remote add origin https://github.com/YOUR-USERNAME/physics-interactive-lab.git
   git push -u origin main
   ```

   Skip `git init` or `git remote add` if already configured. Use your own account name.

3. Open **Settings → Pages → Build and deployment**.
4. Select **Deploy from a branch**, choose **main** and **/ (root)**, then **Save**.
5. Wait for the Pages deployment to complete and open `https://YOUR-USERNAME.github.io/physics-interactive-lab/`.
6. Check `#/spring` and `#/gravity` on the published URL and confirm that the live graphs and controls work. The included `.nojekyll` bypasses Jekyll processing.

The CI workflow checks physics but does not require a deployment token. Branch-based GitHub Pages supplies its own deployment workflow. See [GitHub’s publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## File structure

```text
index.html                 Semantic app shell and navigation
styles.css                 Responsive design and accessibility styling
assets/favicon.svg         Original vector identity
js/app.js                  Routes, controls, graphs, lessons and data export
js/physics.js              Pure numerical models and validation
js/canvas.js               High-DPI simulation drawing
js/content.js              Lesson copy, experiments, questions and equations
vendor/                    Chart.js 4.5.1 and its MIT licence
tests/physics.test.mjs      Physics regression tests
scripts/serve.mjs          Dependency-free local static server
scripts/check.mjs          Asset and packaging checks
.github/workflows/test.yml Continuous integration
.nojekyll                  GitHub Pages static publishing
```

## References

- [OpenStax: simple harmonic motion](https://openstax.org/books/university-physics-volume-1/pages/15-1-simple-harmonic-motion)
- [OpenStax: damped oscillations](https://openstax.org/books/university-physics-volume-1/pages/15-5-damped-oscillations)
- [OpenStax: Newton’s law of universal gravitation](https://openstax.org/books/university-physics-volume-1/pages/13-1-newtons-law-of-universal-gravitation)
- [OpenStax: satellite orbits and energy](https://openstax.org/books/university-physics-volume-1/pages/13-4-satellite-orbits-and-energy)
- [NIST: Newtonian constant of gravitation](https://physics.nist.gov/cgi-bin/cuu/Value?bg)
- [Chart.js documentation](https://www.chartjs.org/docs/latest/)

## Licence

Original source is distributed under the MIT licence; see [LICENSE](LICENSE). Chart.js retains its separate MIT licence in `vendor/Chart.LICENSE.md`.