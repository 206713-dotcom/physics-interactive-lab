# Physics Interactive Lab — IGCSE course & 3D studios

**57 working laboratories. 312 original A Level practice questions. Live calculations you can follow.**

[Open the live laboratory](https://206713-dotcom.github.io/physics-interactive-lab/) · [Browse the source](https://github.com/206713-dotcom/physics-interactive-lab) · [Automated checks](https://github.com/206713-dotcom/physics-interactive-lab/actions)

A browser-only laboratory for IGCSE, A Level and extension exploration. The [IGCSE course navigator](https://206713-dotcom.github.io/physics-interactive-lab/#/course) maps 78 FocusPhysics lesson pages to interactive experiments. All **57 laboratories have WebGL 3D apparatus and a 2D diagram**. Each experiment includes **three guided investigations, five worked questions, learning objectives, equations, assumptions and applications**: 171 investigations and 285 questions. The separate [A Level practice room](https://206713-dotcom.github.io/physics-interactive-lab/#/questions) adds 312 original questions in 26 groups, for **597 questions across the project**.

This is an independent student prototype and a proposed contribution to [FocusPhysics](https://focusphysics.com), not an official or endorsed FocusPhysics integration.

## What is in the laboratory?

### Version 10: particle chambers, magnetic fields & acoustic motion

Three existing laboratories now have detailed apparatus and clearer visual explanations. **Charged particles** move through a framed field chamber with tangent velocity and perpendicular force arrows, dot/cross field symbols and an analytic orbit guide. Zero-field flight moves across a fixed scale instead of jumping to the edge. Both axes use the same position scale, fitted once per setup. The observation clock covers two cyclotron periods, capped at 40 μs, or 20 ns for zero-field flight, then pauses. It takes approximately eight real seconds at 1× for curved motion or four for straight flight; the actual SI clock rate is displayed. The time step resolves at least 600 samples per orbit. A shared half-angle/sinc expression preserves tiny curvature near zero field. Particle size and vector lengths are illustrative; the uniform, nonrelativistic Lorentz model omits radiation losses.

**Magnetism** has a solid copper winding, coil former, terminals, supports, conventional-current markers, closed schematic field loops and N/S labels that reverse with current. Straight-wire mode shows the right-hand-rule field and a reference probe at 5 cm. Zero current removes field arrows, current markers and pole labels. Numerical readings remain `B = μ₀NI/L` or `B = μ₀I/(2πr)` using the selected values. The drawn turn count, field-line spacing, arrow lengths and marker speed are qualitative; end effects are omitted.

**Sound** has a moving speaker cone, a tracked air parcel, compression/rarefaction colours, a metre ruler and a relative-pressure curve. The fixed 2 m window uses the actual wavelength `λ = c/f` throughout the 50–2000 Hz range; spatial cycles are no longer capped for display. The source reading, pressure graph and spatial phase use the same physical clock. Parcel positions oscillate around fixed rest coordinates; displacement is schematic, with a bounded spatial gradient so neighbours cannot cross. Positive relative pressure coincides with compression. The slow-motion clock and air parcels are illustrative; pressure is not calibrated in Pa. Echo time is calculated separately for the chosen reflector distance; reflections are not animated in this travelling-wave view.

The 2D companions use the same sound wavelength, pressure/displacement phase and fixed particle observation scale. Zero current also removes the 2D magnetic field and pole labels.

**209 automated tests** include the fixed straight-flight scale, electron/proton clock resolution, weak-field bounds, trajectory agreement, perpendicular force and constant energy, field reversal/zero-current behaviour, the right-hand rule, sound propagation delay, exact spatial wavelength, compression phase and tracked-parcel motion. Perspective defaults are tailored to each apparatus while manual camera settings survive parameter edits. All 57 existing models remain available in 3D and 2D.

### Version 9: optics, wave superposition & capacitor benches

Four existing laboratories have been rebuilt around detailed apparatus. **Thin lenses** now have shaped converging/diverging glass, machined mounts, two principal rays, focal markers, a real-image screen and dashed virtual back projections. Horizontal distances share a fitted scale; heights share a separate scale that preserves signed magnification. At focus the outgoing rays are parallel. Images beyond six times the larger object/focal distance are explicitly labelled off the bench instead of being drawn at a false position.

The calculation inspector describes non-results explicitly: “Image at infinity” at focus and “No transmitted ray (TIR)” above the critical angle. It retains null numeric results and the original physical equations. Camera presets and manual zoom stay in place when editing parameters in the rebuilt scenes.

**Refraction** now shows a transparent boundary, angle arcs, a dashed normal and the actual reflected/transmitted Fresnel power fractions. TIR removes the transmitted beam; equal refractive indices remove the reflected beam. Ray brightness is boosted for visibility and direction-marker timing is schematic; read the percentages for power. **Superposition** has three solid sampled strings, a common horizontal scale, fixed-x medium beads and a probe displaying the signed addition of both displacements. The three curves are a mathematical comparison, not coupled strings or extra boundary conditions.

**RC charging/discharging** now has an isolated source in discharge mode, a visible resistor and separated capacitor plates. Current-direction markers follow the conductors without crossing the dielectric and reverse correctly on discharge. Charge markers share a voltage-fraction scale; purple arrows show qualitative field direction. The SI circuit equations are unchanged. New tests check lens ray intersections, off-bench/focus cases, Snell geometry/TIR, fixed-position wave motion, current paths/directions and stable apparatus across supported parameter endpoints.

### Version 8: detailed 3D apparatus & Atlas-style studio

The shared renderer now uses bevelled apparatus, a prefiltered studio-light environment, softer shadows, higher-resolution edges, a fading work surface and smooth camera transitions. Star fields are confined to astronomical scenes. Expanded experiments use an Atlas-style dark surround, a larger canvas and a **Scene focus** control; laptop users switch between Parameters and Calculations instead of squeezing the animation between three panels.

Floating/sinking has a clear open-top tank, separate glass panes, a calibrated depth scale, a machined cube and a permeable support. Surface highlights are decorative and driven by actual cube speed; the free surface remains flat and no fluid-wave solver is implied. SHM has a solid helical wire with changing pitch, an engraved displacement scale and kinetic/potential bars calculated on the same release-energy scale. The nonlinear pendulum uses a rigid link, fitted angle scale and actual-state trail. Generator poles, windings, bearings and brushes have more detail; their appearance adds no circuit model or losses.

The gravity studio shares the Atlas's local NASA Blue Marble texture and procedural cloud shell. The solid trail still contains Verlet samples. A separate, dashed analytic Kepler reference stops at the central surface or six release distances; it is not simulation history. Appearance, spacecraft size, atmosphere and camera motion do not affect the SI physics. Dedicated geometry tests check fixed buffers, exact displacement/length transforms, waterline, volume and the reference conic.

Release assets use a local import map to keep independently cached modules on the same version. After adding a module or changing `package.json`'s version, run `npm run refresh-assets` and commit `index.html`. The static check enforces this; no build server or CDN is needed at runtime.

### Version 7: Cambridge learning modes

**[Choose a learning path](https://206713-dotcom.github.io/physics-interactive-lab/#/syllabus)** for Cambridge IGCSE 0625, AS 9702, A2 9702 or enrichment. The 57 physics engines now have **91 teaching profiles**: 40 IGCSE Extended profiles, 48 AS/A Level profiles and three enrichment profiles. Shared models have a level selector that changes objectives, the suggested investigation, a worked question and the highlighted live calculations. Switching preserves the current physical state; “Load recommended setup” explicitly starts a fresh paused experiment. The original resources remain available in a labelled full-model section.

IGCSE means **Core + Supplement (Extended)**. SHM and capacitor-discharge mathematics are A2; Young modulus and projectile components are AS; binary-star, three-body and double-pendulum studios are enrichment. Qualitative IGCSE field and radiation activities do not imply that their extra numerical equations must be learned for 0625. The section map lists missing references and makes no claim of complete outcome-level coverage.

Mappings were checked against the official **0625 2026–2028 version 2**, **9702 2025–2027 version 1** and **9702 2028–2030 version 1** PDFs. A syllabus-edition selector opens the appropriate source pages. Shared and embedded setups preserve the selected level and edition. See [the alignment record and model map](SYLLABUS-ALIGNMENT.md) for all classifications, scope notes, sources and practical-work limitations.

### Version 6.2: actual buoyancy dynamics & the Muon Atlas Solar System

**Dense cubes now sink instead of hanging at the surface.** The upright cube is released at rest with its top 2 cm below the liquid. Its submerged volume changes with its integrated position. Weight, Archimedes upthrust, approximate fluid drag and permeable-support contact determine acceleration. RK4 substeps are bounded by hydrostatic stiffness and drag relaxation. The 15 kg / 1 L case in water-density liquid rests with 147.15 N weight, 9.81 N upthrust and 137.34 N support force. The pressure probe is a separate column; it does not change the 0.50 m motion tank.

The 3D tank and 2D diagram use the same physical state and one length scale. A force dashboard explains the current motion, force bars share a common scale, and graphs record actual centre depth, vertical velocity and resultant force over time. The expanded inspector includes position, velocity, submerged fraction, cube side, tank depth and drag constants. All expanded models now have a taller animation area.

The drag law is a stated teaching approximation: `D = −f(3πμLv + ½ρfluid Cd L²v|v|)`, with effective viscosity 0.10 Pa·s and Cd = 1.05. It represents a viscous liquid, not a calibrated water experiment. The fixed surface represents a large reservoir. The upright-cube model omits added mass, surface tension and fluid waves. A permeable 5 mm support allows liquid underneath; contact is inelastic. [Archimedes reference](https://openstax.org/books/university-physics-volume-1/pages/14-4-archimedes-principle-and-buoyancy).

**[Open the full Solar Atlas](https://206713-dotcom.github.io/physics-interactive-lab/solar-atlas.html)**, imported from the owner's Muography / Muon Atlas project. It includes the actual 20-world explorer: textured planets, rings, selected moons, interior cutaways with separable shells, altitude / escape-speed calculations, satellite orbits and energy-balance experiments. The original JPL approximate planetary model supports dates from 2000–2049 here; Earth denotes the Earth–Moon barycentre. Distances are logarithmically compressed, bodies enlarged independently, and interior boundaries / spin / moon placement schematic. [Source provenance and licences](atlas/PROVENANCE.md). The simpler comparison lab now also shows all eight planets on its shared year clock.

The project serves the Earth map, Three.js, KaTeX and WOFF2 fonts locally. No runtime CDN is required. A device without WebGL can use the existing Solar System 2D laboratory. Share a focused world with `solar-atlas.html?body=earth`, or embed the full explorer with a normal iframe pointing to `solar-atlas.html` (recommended height 850 px).

**177 automated tests** cover the existing models plus sinking, floating convergence, neutral suspension, drag direction, contact force balance, parameter-corner stability, integration convergence, scene/state agreement, the Kepler solver, orbital bounds, inverse-square gravity, escape speed, light delay, thermal balance and interior-shell volume accounting. `npm run check` also verifies nested module imports, local fonts and relative HTML asset paths.

### Version 6.1: a hands-on vector workbench

The vector laboratory now has **draggable A/B tips in both 3D and 2D**, with head-to-tail, parallelogram and component constructions. A live resultant, direction and substituted component equations stay alongside the diagram. Coordinate ticks and arrows share one fitted force scale; zero resultants explicitly have no defined direction. Numeric inputs provide precise values; dragging snaps to 0.1 N and 1°. The supported model still has A along +x and B at 0–180°.

**Animate addition** demonstrates four construction steps with pause, speed, single-step and a progress scrubber. It translates or reveals fixed vectors; it is not physical force evolution, and the calculated forces stay fixed during playback. Shared setup links preserve the construction method and diagram details. The expanded calculation inspector opens on the resultant magnitude. Camera preset transitions are smooth across the lab and respect reduced-motion preferences.

`vector-geometry.js` supplies shared endpoints and inverse pointer mapping; `scene-vectors.js` keeps meshes alive through parameter edits; `render-vectors.js` draws the 2D companion; `vector-studio.js` manages the lesson controls without taking over physics integration. Regression tests check common scales, construction invariance, bounded drag inversion, actual Three.js ray picking, geometry reuse and responsive 2D coordinate inversion.

### Version 6: understand the animation

The existing catalogue now has consistent spatial apparatus: solid force arrows, coils, transparent vessels, pistons, optical benches, particle chambers and astronomical models. **Perspective, Front and Above** camera buttons, a label toggle and mouse/touch/keyboard controls help inspect the same physical model from different angles. Every experiment has a **What to watch → Why it happens → Try a change** walkthrough beside a live reading, with model-specific visual-scale notes.

The expanded workspace keeps the model, parameter controls and substituted calculations together. Fixed-step interpolation smooths drawing between integration steps; pause and single-step show the exact state. Graphs, energy checks, exports and calculation sheets always use the authoritative model state. Dynamic paths reuse GPU buffers rather than replacing geometry every frame.

The 44 curriculum apparatus builders are separated into `scene-mechanics.js`, `scene-thermal.js`, `scene-waves.js`, `scene-electric.js` and `scene-space.js`. `scene-kit.js` supplies shared meshes, labels, arrows and reusable paths; `scene-curriculum.js` reads model samples without advancing them. `scene-guides.js` documents every view. A 3D camera does not make a planar model three-dimensional physics: particle illustrations, magnified extensions, fitted orbits and qualitative storyboards are explicitly labelled. Complete 2D views remain available, including automatic fallback when WebGL is unavailable.

### Version 5: sixteen new practical and A Level instruments

| Laboratory             | What students investigate                                                | Model                                                     |
| ---------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------- |
| Hydraulic lift         | Force advantage, shared pressure, piston travel and equal work           | Ideal quasistatic Pascal coupling                         |
| Spring combinations    | Single, series and parallel extension, force sharing, elastic energy     | Quasistatic Hookean springs                               |
| Sensor circuits        | LDR illumination, NTC temperature, divider orientation and threshold     | Empirical LDR and NTC beta models, ideal unloaded divider |
| Radiation chamber      | Alpha/beta curvature, gamma travel, field reversal                       | Exact relativistic magnetic circular motion; gamma at c   |
| Rectification          | Half/full-wave output, RMS, mean and heating                             | Ideal diode waveform operations                           |
| Filament lamp          | Inrush current, warming resistance, thermal losses and energy accounting | Coupled electrothermal RK4                                |
| Cooling curves         | Mass, heat capacity, insulation and ambient temperature                  | Exact Newton cooling                                      |
| Air-column resonance   | Open/closed ends, pressure/displacement nodes and harmonics              | Analytic standing waves                                   |
| Photoelectric emission | Threshold, electron energy, photon rate and photocurrent                 | Einstein energy equation, ideal quantum efficiency        |
| Electron diffraction   | Accelerating voltage, matter wavelength, permitted orders                | Relativistic momentum and Bragg condition                 |
| Polarisation           | Two/three filters, crossed axes and intensity                            | Ideal Malus projections                                   |
| Velocity selector      | Balanced and deflected proton beams                                      | Exact uniform crossed-field trajectory                    |
| Driven oscillations    | Response amplitude, phase, damping and power                             | Exact linear steady-state forced oscillator               |
| Gas processes          | Isothermal, isobaric and adiabatic expansion/compression                 | Quasistatic monatomic ideal gas and first law             |
| Blackbody spectra      | Wien peak, Planck shape, area and emissivity                             | Planck spectrum and Stefan–Boltzmann law                  |
| Young modulus          | Stress, strain, geometry, wire stiffness and energy                      | Quasistatic uniaxial linear elasticity                    |

All sixteen use the existing sliders, graphs, expanded model/variable/working workspace, notebook, share and embed tools. New IGCSE instruments appear in the course navigator. Extension models are labelled A Level and linked to relevant practice groups. Both views identify enlarged, normalised or independently scaled quantities. Readouts provide the physical measurements calculated by the model.

### A Level practice room

The [practice room](https://206713-dotcom.github.io/physics-interactive-lab/#/questions) has **208 calculations and 104 explanations**, grouped into 26 twelve-question topics. Search, stage/difficulty/type filters, hints, worked solutions, safe numerical checking, bookmarks, self-rated confidence, local progress, JSON progress export/import and printable sets are included. The numerical checker uses ±2% in the requested unit and checks the final number rather than awarding method marks.

The reading shelf references OpenStax **University Physics, Volumes 1–3**. Question wording, numerical scenarios and solutions are original; textbook exercises and exam papers have not been copied. AS/A2/extension labels and suggested marks are study guidance, not an official exam-board specification. See [QUESTION-BANK.md](QUESTION-BANK.md) for all groups, conventions, sources and maintenance details.

### IGCSE course expansion

| Area                      | New working laboratories                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Motion, forces and energy | Measurement/uncertainty; motion/forces/free fall/ticker tape; vectors; moments/stability; density/pressure/floating; energy/power/resources                   |
| Thermal physics           | Particle arrangements/ideal gas; thermal expansion; calorimetry/phase changes; conduction/convection/radiation                                                |
| Waves and optics          | Wavefront reflection/diffraction; plane mirrors; converging/diverging lenses; dispersion; EM spectrum; sound/echoes                                           |
| Electricity and magnetism | Series/parallel circuits/dividers/wire resistance; diode/relay/cut-out; solenoid/wire fields; charged particles; generators/motors; transformers/transmission |
| Nuclear physics           | Atomic/isotope/ion/decay accounting and Rutherford angle; seeded random radioactive decay/half-life/attenuation                                               |
| Space physics             | Earth/seasons/Moon phases; eight-planet orrery; stellar evolution/spectrum; Hubble relation/redshift/CMB                                                      |

The audit inspected both IGCSE year hubs, ten topic hubs and 78 linked lesson pages on **24 October 2026**. The checklist links 324 statements to 62 distinct lessons; topic hubs add three practical/extension lessons and 13 revision/review pages. All 78 pages have model entry points and links to their original resources. [IGCSE-COVERAGE.md](IGCSE-COVERAGE.md) records every mapping.

**A mapped lesson does not mean every syllabus statement has its own quantitative simulation.** Each lab demonstrates selected physical ideas and supplies supporting notes. Resource evaluation, electrical safety, stellar stages and particle arrangements include explicitly qualitative explanations. Hands-on practical work and the teacher's existing notes remain essential. FocusPhysics slides, worksheets and other resources remain on their original pages; they are not republished here. The A Level and Year 9 parts of FocusPhysics are outside this IGCSE audit.

### Original 3D studios

| Experiment         | Explore                                                                               | Model                                             |
| ------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Binary stars       | Mass ratio, barycentre, circular/elliptical/escape motion, both stellar velocities    | Freely moving Newtonian pair, adaptive Verlet     |
| Three-body stars   | Equal-mass figure eight, equilateral triangle, hierarchical triple, perturbations     | Full pairwise gravity, adaptive Verlet            |
| Double pendulum    | Coupled rods, chaotic releases, nearby twin trajectory, energy and separation         | Coupled nonlinear equations with RK4              |
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
- **Playback:** pause/resume, reset, single-step, 0.25×–4× speed and an expanded workspace. Space toggles playback when focus is not in a form control.
- **Expanded calculations:** choose **Expand** on the animation or **Live calculations** beside the page title. Select a calculation to keep its equation, substitution and highlighted result together; all other results and current variable values remain available below. Scientific notation uses readable powers of ten. **Copy this working** captures that calculation and its values at the instant clicked. The original canvas and controls move into this view, so expansion and exit preserve the run. Desktop uses three panes; tablets have Parameters/Calculations inspector buttons, and phones have jump buttons. A header playback button stays accessible while scrolling. Press **Esc** or **Exit expanded view** to return.
- **Parameters:** sliders and editable numbers use explicit units. Enter or blur commits a numeric edit. Invalid inputs show an explanation and restore the valid value. Parameters and presets start a fresh run.
- **Graphs:** choose time histories or explicitly labelled spatial/parameter curves. Zero is included to avoid visually magnifying tiny round-off changes in a circular orbit. Wave components use the same colours in the scene and graph.
- **Readable workspace:** main copy uses 16–17 px text, parameter labels 15 px, editable values 18 px, and larger measurement cards. Graph labels are enlarged too. On the gravitation page, the scene and live measurements sit together; graphs and trajectory interpretation share the next row. Tablet and phone layouts put the scene first and keep measurement values intact.
- **Notebook:** record actual readings to compare different setups. Up to 12 readings per experiment are kept in this device's browser storage, with their numerical state and initial parameters. Nothing is uploaded. Clear readings from the notebook when needed.
- **CSV:** export up to 1,200 recent calculated time samples, or the selected calculated spatial/parameter curve. The first line gives the parameters, and headers label the units. Missing values near an excluded point charge or beyond a critical angle stay blank. No fabricated detections or experimental measurements are added.
- **Share:** copy a link that contains the current initial parameters, graph and camera mode. It opens a fresh run; it does not include the notebook or elapsed state.
- **Embed:** open the [embed generator](https://206713-dotcom.github.io/physics-interactive-lab/integration.html), or choose **Embed** from an experiment to preserve its initial setup. The working iframe preview and copyable HTML make it ready for an existing lesson page. `?embed=1#/gravity` opens a paused, compact model with calculations; **Lessons & notes** reveals its learning resources. See [INTEGRATION.md](INTEGRATION.md) for FocusPhysics handover, host-page checks and self-hosting. No changes to FocusPhysics itself are made by this repository.
- **Library:** search by topic or filter by subject. The experiment selector makes it easy to move between studios.

Reduced-motion preference starts experiments paused and keeps the home orbit preview still. Background tabs do not accumulate simulation time. Tiny nonzero readouts use scientific notation; CSV exports retain their full numerical values. All IGCSE instruments retain their calibrated 2D diagrams alongside the 3D apparatus.

## Physics and numerical methods

Models use documented units, converting to SI for dimensional equations. Interface conversions such as km, nm, µC, µF, mA and millimetres are labelled; angles in degrees are explicitly identified. The new decay attenuation model uses matched cm and cm⁻¹, atomic alpha energy is entered in eV and converted to joules, planetary animation time is in Julian years, and astronomical comparisons use labelled solar/AU/Mpc units. Exports label these units. The physics modules are shared by the browser and tests.

### New IGCSE modelling methods

The pure functions in `js/curriculum-physics.js` are shared by the display, live calculations and tests. Analytic models evaluate at elapsed simulated time, avoiding integration drift:

- Motion: `m dv/dt = F − bv`, with `v = F/b + (u − F/b) exp(−bt/m)` and its exact position integral; the `b = 0` branch uses constant acceleration. In free fall `F = mg`. Equal-time 50 Hz ticker dots use this same position function.
- Vectors: add Cartesian components; moments `M = Fd`; rectangular-body stability `tan θc = width/(2 × COM height)`; hydrostatic gauge pressure `p = ρgh`; upthrust `U = ρfluid g Vdisplaced`.
- Power: `Euseful = mgh`, `Puseful = ηPinput`, with input = useful + dissipated. The lift stops at its target; it does not solve acceleration.
- Gases: `pV = nRT`, `vrms = √(3RT/M)` for a nitrogen reference. Solid/liquid dot modes are schematic and suppress gas-law results. Expansion: `ΔL = αL₀ΔT`.
- Calorimetry: `Q = Pt`, `Q = mcΔT` between transitions and `Q = mL` during transitions. The water model uses piecewise constant properties at 1 atmosphere; insulation is ideal. Heating curves retain a sample every two simulated seconds so both phase plateaus remain visible.
- Transfer: conduction `P = kAΔT/d`, convection comparison `P = hAΔT` with fixed `h = 10 W/(m² K)`, net radiation `P = εσA(Th⁴ − Tc⁴)` in kelvin. Reservoir temperatures are held fixed; fluid circulation is illustrative.
- Optics: plane reflection `i = r`, thin lens `v = fu/(u−f)` and `m = −v/u`; `u = f` returns no finite image. Cauchy dispersion `n = A + B/λ²` uses λ in μm before Snell refraction. Spectrum `f = c/λ`; sound echo `t = 2d/v`. Wavefront spreading is a qualitative construction, not a computed diffraction intensity field.
- Circuits: series/parallel Ohm/Kirchhoff equations, unloaded potential divider and `Rwire = ρL/A`. The diode uses a 0.7 V forward drop; relay and protective cut-out use stated ideal thresholds. No mains construction advice or real fuse trip curve is implied.
- Magnetism: long-solenoid `B = μ₀NI/L`, wire `B = μ₀I/(2πr)` at a fixed 5 cm probe, perpendicular charged-particle `F = qv × B`, `r = mv/|qB|` and constant kinetic energy. These are nonrelativistic analytic circular trajectories; `B = 0` is straight motion.
- Machines: `Φ = BA cos(ωt)`, `ε = NBAω sin(ωt)`, ideal commutated motor `τ = NBIA|sin θ|`; imposed rotation is not a mechanical rotor solver. Transformer `Vs/Vp = Ns/Np`, `VpIp = VsIs`; `Ip²Rline` is a separate comparison estimate.
- Nuclei: `A = Z + N`, ion electron counting, alpha/beta/gamma nuclear accounting, and point-charge Rutherford angle. Impossible daughters return undefined; selecting an equation does not assert that an arbitrary isotope undergoes that decay.
- Decay: each nucleus gets an exponential waiting time `−ln(1−U)/λ`, with `λ = ln2/T½` from a seeded PRNG. The random sample and expected `N₀2^(−t/T½)` are shown separately. Attenuation is `exp(−μx)`; the detector is an expected rate, not experimental data or a Poisson counter.
- Space: circular orbits use `v = √(GM☉/r)` and `T = 2π√(r³/GM☉)`; the orrery screen radii are logarithmic and body sizes enlarged. Daylight uses a geometric declination approximation; Moon illumination `(1−cos phase)/2`. Stellar evolution is a qualitative storyboard with approximate main-sequence scaling, not a stellar structure solver. Low-redshift `v = H₀d`, `z ≈ v/c`, `λobs = λrest(1+z)` and Hubble time `1/H₀` are explicitly approximate.

Supporting references: [Cambridge 0625 syllabus](https://www.cambridgeinternational.org/Images/697209-2026-2028-syllabus.pdf), [NASA planetary fact sheets](https://nssdc.gsfc.nasa.gov/planetary/factsheet/), [OpenStax physics](https://openstax.org/books/university-physics-volume-2/pages/index), and [OpenStax radioactive decay](https://openstax.org/books/university-physics-volume-3/pages/10-3-radioactive-decay). Teaching text and diagram code in this project are original.

### Practical and A Level equations

`js/practical-physics.js` contains pure SI calculations. Most models have analytic solutions, so the rendering never advances a second, inconsistent physical state:

```text
Hydraulics: F₁/A₁ = F₂/A₂; A₁x₁ = A₂x₂; W₁ = W₂
Springs: kseries⁻¹ = k₁⁻¹+k₂⁻¹; kparallel = k₁+k₂; U = ½keq x²
Sensors: VL = Vs RL/(RU+RL)
  LDR: R = R100 (lux/100)^−0.7
  NTC: R = R25 exp[B(1/T−1/298.15)], T in kelvin
Charged beams: K = (energy in eV)e; p = √[K(K+2mc²)]/c
  v = pc²/(K+mc²); r = p/|qB|; angular rate = −qBv/p
Rectifier: Vin = Vp sin(2πft); Vout = max(0,Vin) or |Vin|
  Half-wave: Vmean = Vp/π, Vrms = Vp/2
  Full-wave: Vmean = 2Vp/π, Vrms = Vp/√2; Pmean = Vrms²/R
Lamp: R(T) = R20[1+α(T−293.15)]
  C dT/dt = V²/R(T) − εσA(T⁴−Ta⁴) − hA(T−Ta)
Cooling: T = Ta+(T₀−Ta)e^(−t/τ); τ = mc/H
Air columns: fopen,n = nv/(2L); fclosed,n = (2n−1)v/(4L)
Photoelectric: Kmax = hf−φ when hf>φ; Vs = Kmax/e
  Iideal,sat = ηeP/(hf), zero below threshold
Diffraction: λ = h/p; 2d sinθ = nλ (no angle if nλ>2d)
Polarisation: I₁ = Iincident/2; Ij = Ij−1 cos²(θj−θj−1)
Selector: vd = E/B, ω = eB/mp, Δv = v₀−vd
  x = vd t + Δv sin(ωt)/ω; y = Δv[1−cos(ωt)]/ω
Driven SHM: A = F₀/√[(k−mω²)²+(bω)²]
  δ = atan2(bω,k−mω²); x = A cos(ωt−δ); Pmean = ½bω²A²
Gas paths: pV = nRT; ΔU = 3nRΔT/2; Q = ΔU+Wby-gas
  Isothermal: W = nRT ln(V/V₀); isobaric: W = p₀(V−V₀)
  Monatomic adiabatic: TV^(2/3) = constant; Q = 0; W = −ΔU
Thermal spectrum: Bλ = 2hc²/[λ⁵(exp(hc/λkT)−1)]
  λpeak T = 2.897771955e−3 m K; Pemitted = εσAT⁴
Material: σ = F/A; strain = σ/E; ΔL = FL/(AE); U = ½FΔL
```

The lamp uses **RK4 with internal steps no larger than 1/4000 s**, integrating temperature, electrical input energy and transferred energy with the same stages. Its diagnostic is `Ein − Eout − C(T−Ta)`, so stored heat is accounted for rather than discarded. Adopted teaching coefficients are `α=0.0045 K⁻¹`, `ε=0.35`, `h=15 W/(m² K)` and `Ta=293.15 K`. This is a bounded approximate metallic-filament model, not calibrated tungsten data, a melting model or a lamp life prediction.

Hydraulic, wire and spring loading are prescribed quasistatic ramps, not dynamic loading solvers. Sensors omit self-heating and loading; rectifiers omit diode drops and smoothing. Driven motion starts directly in steady state. The velocity selector uses protons in ideal infinite uniform fields; the finite displayed-window exit pauses observation rather than claiming a slit collision. The radiation chamber ends its observation at 100 ns. Charged beam speed uses relativity where needed and never exceeds c. The normalised thermal spectrum is labelled separately from absolute emitted-power readings. Every lab's **Equations & model** tab details its omissions and visual scaling.

Further reading: [OpenStax hydraulics](https://openstax.org/books/university-physics-volume-1/pages/14-3-pascals-principle-and-hydraulics), [forced oscillations](https://openstax.org/books/university-physics-volume-1/pages/15-6-forced-oscillations), [photoelectric effect](https://openstax.org/books/university-physics-volume-3/pages/6-2-photoelectric-effect), [matter waves](https://openstax.org/books/university-physics-volume-3/pages/6-5-de-broglies-matter-waves), [polarisation](https://openstax.org/books/university-physics-volume-3/pages/1-7-polarization), [first law](https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics), and [TDK NTC thermistor guidance](https://product.tdk.com/en/contact/faq/protection-0009.html).

### Binary and three-body stars

```text
aᵢ = G Σⱼ≠ᵢ mⱼ(rⱼ − rᵢ)/|rⱼ − rᵢ|³
K = Σ ½mᵢ|vᵢ|², U = −Σᵢ<ⱼ Gmᵢmⱼ/rᵢⱼ
R = Σ mᵢrᵢ / Σ mᵢ, P = Σ mᵢvᵢ
Lz = Σ mᵢ(xᵢvᵧᵢ − yᵢvₓᵢ)
Two-body circular reference: T₀ = 2π√[d³/G(m₁ + m₂)]
```

Both/all three masses move in an initially stationary barycentric frame. No central mass is pinned, and no per-frame recentering is applied. Adopted units are `M☉ = 1.98847×10³⁰ kg` (approximate solar mass), exact AU `149597870700 m`, and Julian year `31557600 s`. Binary stars support 0.2–3 M☉ each, separation 0.5–4 AU and tangential launch multiplier 0.55–1.50. The speed multiplier is relative to the two-body circular speed; √2 is the escape threshold.

Three-body masses support 0.2–3 M☉ each, length scale 0.5–3 AU, launch multiplier 0.70–1.30 and a 0–5% +x kick to star C. The kick is measured against `√(GM_A/scale)` before converting velocities into the barycentric frame. Its three layouts are the equal-mass figure-eight reference, an equilateral Lagrange initial configuration, and an inner binary with an outer star initially five length scales away. The figure-eight coordinates and velocities come from [Richard Montgomery's UCSC reference, credited there to Carles Simó](https://people.ucsc.edu/~rmont/NbdyB.html). They are scaled into SI, not enforced as an animation path. Unequal masses or changed velocities generally break that specific choreography. The equilateral equal-mass configuration is unstable to perturbations; the hierarchical launch uses approximate initial circular speeds, followed by full three-body integration.

Velocity Verlet uses an outer step of `0.002τ`, where `τ = √(d³/G(M₁+M₂))` for a binary and `τ = √(d³/GM_A)` for a triple. Each outer step subdivides to at most `0.001√(rᵢⱼ³/G(mᵢ+mⱼ))` for every pair. No gravitational softening is used. A drift-segment check pauses **before** any pair crosses `0.01d`; this is a numerical encounter guard, not a physical stellar radius or merger. An explicit substep-budget limit also pauses unresolved work, and the display stops when a star reaches 100 initial length scales from the barycentre. Numerical energy error is `(E − E₀)/|U₀|`; it remains defined for zero-total-energy escape.

At 1×, one wall second represents `0.6τ` simulated seconds, stated beneath the scene. Auto-fit changes only the common linear distance scale. Star surfaces, colours, apparent radii, corona glow and surface-flow patterns are illustrative, not stellar-structure, radiation or temperature calculations. Velocity arrows use separate capped display lengths, `min(1.8, 0.7v/(d/τ))` scene units in 3D, and cannot be compared with distances by length. Coloured trails are sampled integrated positions, retaining at most 1,200 samples. To preserve star identity where tracks overlap, the figure-eight view shows the most recent 2τ per star and the triangular view 1.1τ per star; binary and hierarchical views use the retained history. Both 2D and 3D use these same trail windows. System-energy charts use 10³⁹ J and separation charts use AU; CSV retains unscaled SI values for all bodies, invariant diagnostics and pair separations.

### Double pendulum and its comparison twin

```text
Δ = θ₁ − θ₂, ωᵢ = dθᵢ/dt, αᵢ = dωᵢ/dt
(m₁+m₂)L₁α₁ + m₂L₂ cosΔ α₂ = −(m₁+m₂)g sinθ₁ − m₂L₂ω₂² sinΔ
L₁ cosΔ α₁ + L₂α₂ = L₁ω₁² sinΔ − g sinθ₂
K = ½(m₁+m₂)L₁²ω₁² + ½m₂L₂²ω₂² + m₂L₁L₂ω₁ω₂ cosΔ
U = (m₁+m₂)gL₁(1−cosθ₁) + m₂gL₂(1−cosθ₂)
```

Two point bobs, massless rigid rods, fixed frictionless pivot, uniform gravity and no driving or damping. Both angles are measured from downward vertical. Supports rod lengths 0.5–2 m, bob masses 0.5–3 kg, release angles −170°–170°, gravity 1–15 m/s² and twin lower-angle difference 0°–1°. Both start at rest; the twin differs only in its lower initial angle, so their initial energies can differ slightly.

The coupled 2×2 equations are solved inside RK4. Each run uses `h = 1/(480N) s`, with `N = max(1, ceil(√[((m₁+m₂)/m₁)g/min(L₁,L₂)] / (5 s⁻¹)))`; faster settings get smaller steps. The default is 1/480 s. Readouts and graphs follow the same two integrated states. The violet twin is visually offset by 0.045 scene units to avoid overlap; both physical systems remain planar. Its on-screen rods, masses and frame are illustrative. The separation graph measures actual lower-tip distance in metres and is **not** a measured Lyapunov exponent. The phase portrait plots lower angular velocity against its unwrapped angle, avoiding jumps at ±π; exports still include time and all SI state values. Main-run energy error is normalised by `(m₁+m₂)gL₁ + m₂gL₂`, avoiding division by zero at rest. Long-term chaotic phases depend on initial precision and numerical error.

Derivation: [myPhysicsLab double pendulum](https://www.myphysicslab.com/pendulum/double-pendulum-en.html). The equations are implemented independently; no external simulation engine is embedded.

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

The 3D planet uses a locally generated, seamless surface illustration with fictional continents, polar ice and stationary cloud patterns. It is not geographic data. Lighting, star positions and atmospheric glow are visual references and do not add forces or rotation to the physical model. The default camera frames the orbit more closely and adapts to narrow screens; the same controls still let students rotate, zoom and reset the view.

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

The camera never changes the numerical state or graph data. Most systems are intentionally planar even when viewed in 3D. Object size, grid spacing, glow and arrows may be illustrative; calibrated quantities are explicitly labelled. Integration steps are independent of animation speed. A long frame is capped at 0.1 real seconds to avoid an unstable catch-up step; on a slow device, simulated time can therefore advance less than wall time. Unit-converted slider endpoints tolerate a few floating-point rounding units, while genuinely invalid values remain rejected.

## Accuracy and testing

```sh
npm test
npm run check
```

There are **162 tests** using Node's built-in runner. They exercise the same functions used by the website, including:

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
- All 57 catalogue entries, 171 valid presets, 171 investigations and 285 in-lab questions; finite dynamic parameter corners and spatial datasets; invalid inputs and converted endpoints.
- Worked calculations for every model: current-state substitutions, SI units, damping and drag signs, approximate period/fringe labels, collision predictions, refraction exclusions, RC discharge current, point-charge exclusions, zero charges and tiny-value formatting. Calculation sheets do not mutate or advance the simulation.
- Embeds for all 57 models, valid parameter round-trips, repository and self-hosted subdirectory paths, clean share links, invalid-model/protocol rejection, escaped iframe attributes and readable scientific notation with safe HTML escaping. Every model supports either 3D or 2D embed selection.
- Binary virial/barycentre/force relations, ten-period circular radius and energy, Kepler return, elliptical angular momentum, escape and physical scaling.
- Pairwise stellar momentum balance and inverse-square scaling, approximate figure-eight return, equilateral rotation, perturbed-triple centre of mass, supported stellar corners and close-encounter guards.
- Independent explicit double-pendulum accelerations, zero instantaneous energy derivative, separate main/twin energy conservation over 60 s, exact-match twins, sensitive dependence, fourth-order convergence and extreme supported settings over 10 s.
- 37 IGCSE checks: every course mapping and model reachability; all slider endpoints and modes over bounded observations; suvat and terminal fall; vector cancellation; moments/stability; Archimedes and hydrostatic scaling; lift energy accounting; Boyle/temperature scaling; all water heating transitions; conduction and fourth-power radiation; mirrors, real/virtual/focal-plane lens cases; dispersion and EM speed; sound echo path; Kirchhoff and wire-resistance relations; diode/relay/cut-out states; solenoid scaling; constant-energy charged-particle motion; Faraday flux derivative; transformer power; nuclear accounting and Rutherford angles; seeded-decay reproducibility and ensemble expectation; daylight/Moon phases; planetary Kepler relations; stellar scaling; Hubble units and low-redshift bounds.
- Nineteen practical/A Level checks: hydraulic work/volume; spring force and energy; sensor reference/threshold/swap behaviour; relativistic beam speed, rigidity, reversal and weak-field limits; rectifier integrated mean/RMS; lamp RK4 convergence, energy budget and parameter corners; exact cooling; pipe boundary conditions; photoelectric thresholds; Bragg order limits; Malus projections; crossed-field differential equations and work; driven-oscillator equation/power; first-law gas invariants; Planck integral and Wien peak; modulus geometry; all sixteen models' presets and actual steps.
- Ten 3D/display checks: finite geometry and transforms across every instrument’s presets and parameter endpoints; complete guides and 3D coverage; no physical-state mutations or frame-by-frame geometry growth; head-to-tail vectors; magnetic-force tangency; seeded decay colours; reusable path buffers; coil/flux orientation; standing-wave phase; bounded immutable interpolation and discrete collision handling.
- Five practice-room checks covering all 312 records and worked-result round trips, independent fixtures for every topic, notation and invalid-input handling, combined filters and defensive progress import.

These are bounded regression checks for the stated scenarios, not claims of exact or indefinite numerical conservation. `npm run check` verifies assets, every relative JavaScript module import, vendored libraries and GitHub Pages subdirectory compatibility. GitHub Actions runs both commands on pushes and pull requests.

Browser verification covers the original studios, the original 28 course instruments and all sixteen practical/A Level additions, their presets, expanded calculations and lesson navigation, plus representative graph, editable-input, export and responsive checks. The practice room is checked for answer feedback, persistence, filters, pagination, solutions and responsive layout. The 78 course links are recorded from inspected public pages. Repeated 2D/3D switching creates a fresh canvas after releasing the previous WebGL context. WebGL failure has an explicit diagram fallback rather than an empty experiment.

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
workbench.css                Readable typography and focused gravitation layout
frontiers.css                Stellar and nonlinear-dynamics workspace details
expanded.css                 Expanded model, variable and calculation panes
curriculum.css               IGCSE course map, lesson links and diagram layouts
questions.css                Practice-room design, responsive layout and printable sheets
js/course-map.js             Audited 78-page FocusPhysics title/link/model inventory
js/course.js                 Searchable six-area course navigator
js/curriculum-physics.js     Original 28 course models and shared validation/dispatch
js/practical-physics.js      Sixteen practical/A Level models, exact solutions and lamp RK4
js/practical-labs.js         Practical controls, equations, presets and authored investigations
js/render-practical.js      State-only scientific instrument drawings and thumbnails
js/curriculum-simulations.js Controls, readouts, calculations, graphs and units
js/render-curriculum.js      Original Canvas instruments and catalogue thumbnails
js/content-curriculum.js     132 investigations, 220 worked/conceptual questions
js/question-data.js          312 original questions, constants, worked values and safe checker
js/question-bank.js          Practice UI, filtering, progress storage/import/export and print
QUESTION-BANK.md             Topic inventory, textbook references and answer conventions
IGCSE-COVERAGE.md            Lesson-by-lesson mappings and scope limitations
js/app.js                    Small application bootstrap
js/studio-app.js             Routes, playback, controls, Chart.js, notebook, export
js/expanded-view.js          Accessible expanded workspace and DOM restoration
js/calculations.js           Pure worked calculations from the current SI state
js/math-display.js           Escaped scientific-notation display formatting
js/integration.js            Validated experiment URLs and iframe snippets
js/embed-builder.js          Embed generator and real iframe preview
integration.html             Teacher-facing embed generator
integration.css              Responsive integration page styles
INTEGRATION.md               FocusPhysics embedding and self-hosting instructions
js/simulations.js            Declarative catalogue and graph/parameter configuration
js/physics.js                Spring and orbital models, shared validation
js/physics-extra.js          Eight additional pure physics models
js/physics-advanced.js       SI N-body and coupled double-pendulum models
js/advanced-simulations.js   Three extension studio definitions and units
js/calculations-advanced.js  Live stellar and double-pendulum working
js/content-advanced.js       Nine investigations and fifteen worked questions
js/scene-advanced.js         Stellar shaders, sampled trails and pendulum rig
js/render-advanced.js        Calibrated extension-lab 2D diagrams
js/canvas.js                 Original calibrated spring/orbit diagram renderers
js/render2d.js               Additional diagram renderers
js/scene3d.js                Three.js scenes, camera controls and GPU lifecycle
js/content.js                Spring/orbit teaching resources
js/content-extra.js          Eight additional lesson packages
tests/physics.test.mjs        Original 16 physics regression tests
tests/expanded.test.mjs       29 expansion, catalogue and validation tests
tests/orbit-refinement.test.mjs Five focused orbital elements/scenario regressions
tests/calculations.test.mjs   Twelve calculation and edge-case regression tests
tests/integration.test.mjs    Six URL, embed and maths-formatting regression tests
tests/practical.test.mjs      Nineteen new instrument and conservation checks
tests/questions.test.mjs      Five question-bank, answer, filter and persistence checks
tests/advanced.test.mjs       Seventeen stellar and nonlinear regression tests
tests/curriculum.test.mjs     37 course, IGCSE physics and bounded-range checks
scripts/serve.mjs            Dependency-free local static server
scripts/check.mjs            Required assets and relative-import checks
vendor/                      Pinned Chart.js and Three.js modules and licences
.github/workflows/test.yml   Continuous physics and asset checks
```

To add an experiment, implement a pure model, register its parameters, presets, samples and graphs in `simulations.js`, add a renderer and teaching package, and test its invariants. Avoid advancing physics inside a rendering function.

## References and licences

Each lesson links to a supporting reference or original derivation. Standard topics use [OpenStax University Physics](https://openstax.org/subjects/science); the advanced references are linked above. Further references: [NIST gravitational constant](https://physics.nist.gov/cgi-bin/cuu/Value?bg), [Chart.js](https://www.chartjs.org/docs/latest/), [Three.js](https://threejs.org/docs/).

Original source is MIT licensed; see [LICENSE](LICENSE). Chart.js and Three.js retain their separate MIT licences in `vendor/Chart.LICENSE.md` and `vendor/Three.LICENSE.txt`.
