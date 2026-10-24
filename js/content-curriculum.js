/** Original teaching text. FocusPhysics links are a course map, not copied lessons. */
import { CURRICULUM_SIMULATIONS, WORK } from "./curriculum-simulations.js";
import { sampleCurriculum } from "./curriculum-physics.js";
const NOTES = {
  measurement: [
    "A reading is an estimate, not an exact truth.",
    "Ruler divisions limit resolution. Timing many oscillations shares the same two endpoint reaction uncertainties across more cycles.",
    "Count complete cycles from the same point and direction. Avoid parallax by looking perpendicular to the scale.",
    "The ruler is rounded to its selected division; ± half a division is a resolution estimate, not a complete uncertainty budget. Timing uses the exact model period and a conservative ±2 reaction-time bound, not fabricated human trials.",
    "Vernier measurements, repeated timing and quality control.",
    "Why time 20 oscillations rather than one?",
    "The total interval is longer while the two endpoint uncertainties are similar. Dividing by 20 reduces the uncertainty per period.",
  ],
  motion: [
    "A resultant force changes velocity.",
    "For a cart, the resultant is F − bv. For a falling object it is mg − bv, with downward positive. Linear drag gives an exponential approach to terminal speed.",
    "A distance–time gradient gives speed only when direction does not change. The gradient of velocity–time gives signed acceleration; the area gives displacement.",
    "Exact constant-force, linear-drag solution. Linear drag is an idealisation; many fast macroscopic objects need quadratic drag. The separate projectile lab includes that model. Ticker marks represent equal time intervals, not equal distances.",
    "Vehicle motion, falling particles and motion sensors.",
    "Is there a resultant force at terminal speed?",
    "No. Drag balances weight, so acceleration is zero while the object continues to move.",
  ],
  vectors: [
    "Direction is part of a vector.",
    "Head-to-tail addition preserves both magnitude and direction. Opposing vectors can cancel even though their individual magnitudes are nonzero.",
    "Resolve each vector into perpendicular components before adding. Scalars such as energy and temperature have magnitude only.",
    "Two force vectors in a plane. A lies along +x. Zero resultant has no physically unique direction; the displayed reference angle is a convention.",
    "Navigation, force diagrams and crossing a river.",
    "Can two nonzero forces have zero resultant?",
    "Yes: equal magnitudes in opposite directions cancel. This does not require each force to be zero.",
  ],
  moments: [
    "A force can turn an object.",
    "Moment equals force times perpendicular lever arm. Rotational equilibrium requires clockwise and anticlockwise moments to balance. Translational equilibrium also requires zero resultant force.",
    "A body topples when the vertical line through its centre of mass passes beyond the support edge. A wider base or lower centre of mass improves stability.",
    "The beam is held level: unequal moments indicate a tendency to turn, not a solved rotation. A separate tilted rectangular block has its centre of mass at the entered height above the base centre.",
    "Cranes, balancing beams, door handles and vehicle stability.",
    "Does zero resultant force guarantee equilibrium?",
    "No. A pair of equal opposing forces can still produce a couple. Resultant force and resultant moment must both be zero.",
  ],
  buoyancy: [
    "Pressure and upthrust have different meanings.",
    "Density is mass divided by volume. A floating object displaces its own weight of liquid. A submerged object experiences upthrust equal to the weight of liquid displaced.",
    "Gauge pressure increases with vertical depth, not container shape. For two immiscible liquids, the less dense layer can lie above the denser layer.",
    "Uniform densities, constant g = 9.81 N/kg and an incompressible liquid. Floating readouts are equilibrium values; a sinking block is shown submerged without integrating its descent. Surface tension and fluid drag are omitted.",
    "Ships, hydrometers, submarines and hydraulic depth measurements.",
    "Does a heavier object always sink?",
    "No. Average density relative to the liquid matters. A large hollow ship can float while a much lighter solid metal piece sinks.",
  ],
  energy: [
    "Account for energy, not just motion.",
    "The useful gravitational transfer is mgh. Useful power is efficiency multiplied by input power. Input energy equals useful energy plus energy dissipated to the surroundings.",
    "Renewable resources are replenished on human timescales. Reliability, environmental impact, location and cost matter alongside efficiency. Nuclear fuel is non-renewable; wind and sunlight vary.",
    "A constant-power ideal lift with no acceleration or kinetic-energy change. Input stops at the chosen height. Resource selection changes the explanatory pathway, not a claim about the real efficiency or emissions of a power station.",
    "Lifts, power generation, home energy use and Sankey diagrams.",
    "Is dissipated energy destroyed?",
    "No. Total energy is conserved. It becomes spread out, often in thermal stores, and is less useful for the intended task.",
  ],
  gases: [
    "Temperature measures particle motion statistically.",
    "Heating a fixed amount of ideal gas raises its pressure at fixed volume. At fixed temperature, doubling volume halves pressure. Temperature must be in kelvin.",
    "Solids vibrate around fixed positions; liquids have close particles that rearrange; gases have widely separated particles. Brownian motion is evidence of collisions with microscopic particles.",
    "Gas readouts use pV = nRT and a nitrogen molar mass of 0.028 kg/mol for RMS speed. The moving dots are an illustrative subset, not a molecular-dynamics solver. Solid and liquid modes deliberately omit gas-law pressure and speed readouts.",
    "Pistons, tyres, gas thermometers and refrigeration.",
    "Why must gas-law temperatures use kelvin?",
    "The proportionality uses absolute temperature. Zero Celsius is not zero thermal motion; 0 °C is 273.15 K.",
  ],
  expansion: [
    "Small particle-spacing changes can move large structures.",
    "For modest temperature changes, extension is approximately proportional to original length and temperature rise. The coefficient depends on the material.",
    "Particles do not themselves grow when a solid is heated. Their average separation changes as their vibrations increase.",
    "Uniform temperature and constant linear expansion coefficient. This is a small-strain approximation. The overlay magnifies extension by ×3000 and caps the drawn difference to fit; the actual numeric extension is never magnified.",
    "Bridge joints, railway gaps, thermostats and fitting metal parts.",
    "Does doubling rod length double its thermal extension?",
    "Yes, within this approximation, if material and temperature change are the same: ΔL = αL₀ΔT.",
  ],
  calorimetry: [
    "Temperature can stay fixed while energy enters.",
    "Within a phase, Q = mcΔT. At melting or boiling, energy changes the material state rather than its temperature, so Q = mL.",
    "Evaporation occurs at a surface at temperatures below boiling. Faster particles can escape, reducing average kinetic energy and cooling the remaining liquid.",
    "Insulated constant-power heating at 1 atmosphere. Water uses cice = 2100, cwater = 4200, csteam = 2000 J/(kg K), fusion 334000 and vaporisation 2260000 J/kg. No heat loss, pressure dependence or evaporation rate is solved. Custom-c mode stays in one phase.",
    "Calorimeters, cooking, thermal storage and evaporative cooling.",
    "Why is the heating curve flat during melting?",
    "Energy increases the potential part of internal energy as the structure changes. Average particle kinetic energy, and therefore temperature, remains approximately constant.",
  ],
  heat: [
    "Three mechanisms, one energy balance.",
    "Conduction transfers energy through matter without bulk material flow. Convection transfers energy with moving fluid. Thermal radiation transfers energy by electromagnetic waves and can cross a vacuum.",
    "Dull dark surfaces are generally better absorbers and emitters than shiny surfaces. Net radiation depends on both surface and surroundings temperatures in kelvin.",
    "Constant-temperature reservoirs. Conduction uses a uniform slab, convection a fixed reference h = 10 W/(m² K), radiation a grey surface exchanging with large surroundings. Convection circulation is schematic; no fluid dynamics is solved. All three comparison powers are available.",
    "Building insulation, radiators, vacuum flasks and cooling electronics.",
    "Can convection occur through a vacuum?",
    "No. Convection requires moving material. Radiation can transfer energy through a vacuum.",
  ],
  wavefronts: [
    "Wave energy changes direction at boundaries.",
    "Reflection returns waves into the original medium. Frequency stays the same. A single gap produces diffraction: spreading becomes more noticeable when its width is comparable to or smaller than a wavelength.",
    "A wavefront joins points at the same phase. Rays are perpendicular to wavefronts. Increasing frequency at fixed speed shortens wavelength.",
    "Huygens-style wavefront construction, not a solved water-wave amplitude field. Circular outgoing fronts illustrate spreading; their drawn amplitude and angular distribution are not diffraction intensity predictions. Use the double-slit lab for quantitative Fraunhofer intensity.",
    "Harbour waves, radio communication and ultrasound.",
    "When is diffraction most noticeable?",
    "When the gap or obstacle size is comparable to or smaller than the wavelength. A large opening relative to wavelength produces less angular spreading.",
  ],
  mirror: [
    "A reflected ray obeys a local angle rule.",
    "The angle of incidence equals the angle of reflection. Both are measured from the normal, not the surface. A plane-mirror image is upright, virtual and the same size as the object.",
    "Backward extensions appear to meet behind the mirror. Light does not actually travel through the virtual image. Object and image distances from the mirror are equal.",
    "Ideal plane mirror and geometric optics. The angle-ray sketch and distance readout are separate constructions: the selected object distance sets the reported image position; the sketch is fitted for visibility.",
    "Periscopes, mirrors and optical alignment.",
    "Can a plane-mirror image be projected onto a screen?",
    "No. Reflected rays do not converge at the apparent image location; the image is virtual.",
  ],
  lenses: [
    "Where do the principal rays meet?",
    "A converging lens can produce an inverted real image when the object is outside the focal length. Inside the focal length it produces an upright virtual magnified image.",
    "A diverging lens produces a virtual upright diminished image for a real object. Signed magnification indicates orientation; negative means inverted.",
    "Paraxial thin-lens approximation in air. u is positive for a real object, f is positive for converging lenses, and v is positive for a real image. At u = f no finite image is reported. Lens thickness and aberrations are omitted.",
    "Cameras, projectors, spectacles and magnifying glasses.",
    "What happens when a converging-lens object is at the focal plane?",
    "The emerging paraxial rays are parallel. The ideal image is at infinity, so the finite-distance formula has no finite result.",
  ],
  dispersion: [
    "Refractive index depends on wavelength.",
    "For the selected transparent material, shorter visible wavelengths have larger refractive index. Different colours therefore refract by different angles. Frequency remains unchanged at the interface.",
    "White light contains a range of wavelengths. A prism has two refracting boundaries; this lab isolates one boundary so each wavelength can be compared clearly.",
    "Cauchy dispersion n = A + B/λ² with λ in micrometres, combined with Snell’s law from air. Only 400–700 nm is supported. Ray angles use the model index; colour is illustrative. No absorption or prism second face is modelled.",
    "Prisms, rainbows, lens colour fringes and spectroscopy.",
    "Does light change frequency when it enters glass?",
    "No. Its speed and wavelength change while frequency is conserved across a stationary boundary.",
  ],
  spectrum: [
    "One wave family spans many scales.",
    "All electromagnetic waves travel at the same vacuum speed. Frequency increases as wavelength decreases. The regions overlap by convention; there are no abrupt physical walls between them.",
    "Radio carries communications, microwaves support cooking and satellite links, infrared transfers thermal radiation, visible light enables vision, UV can fluoresce and damage cells, and X-rays/gamma rays are ionising.",
    "The wavelength ruler is logarithmic. The field sketch is slowed and rescaled independently of wavelength; it is not a literal vacuum wave at screen scale. Photon energy E = hf is an extension beyond the core wave description.",
    "Communications, remote sensing, medical imaging and radiation protection.",
    "Which travels faster in vacuum: radio waves or X-rays?",
    "They travel at the same speed c. They differ in frequency, wavelength and photon energy.",
  ],
  sound: [
    "Sound is a longitudinal pressure wave.",
    "Particles oscillate about their equilibrium positions. Energy propagates while the medium does not flow along with the wave. Higher frequency gives higher pitch; larger pressure amplitude generally gives louder sound.",
    "An echo travels to the reflector and back, so its path is twice the reflector distance. Sound needs a medium and cannot travel through a vacuum.",
    "Dry-air ideal-gas temperature approximation near room temperature. Relative pressure is dimensionless, not a calibrated decibel measurement. The illustrative compression view uses five screen wavelengths; the numeric wavelength and real-time waveform use the selected frequency.",
    "Sonar, echolocation, musical instruments and ultrasound.",
    "A reflector is 30 m away. Why is the echo path 60 m?",
    "The pulse travels 30 m outward and 30 m back before it is detected. Use t = 2d/v.",
  ],
  dc: [
    "Conservation links the whole circuit.",
    "Charge flow is current: I = Q/t. Potential difference is energy transferred per charge. In series, current is common and potential differences add; in parallel, voltage is common and branch currents add.",
    "A potential divider takes an output across one resistor. This model assumes the output is unloaded. Wire resistance grows with length and decreases with cross-sectional area.",
    "Ideal DC voltage source and ohmic resistors. Wire mode places ρL/A in series with R₂. No battery internal resistance, filament heating, thermistor/LDR response or loaded-divider effect is simulated. Those are discussed as component limitations.",
    "Voltage sensing, circuit design and resistance measurements.",
    "Why can a voltmeter change a potential-divider reading?",
    "A real meter draws current. Its finite resistance loads the divider, changing the effective lower resistance; the ideal unloaded equation then needs adjustment.",
  ],
  devices: [
    "A component’s behaviour matters, not just its symbol.",
    "The diode permits forward current using an approximate 0.7 V drop and blocks reverse current. A relay uses a control threshold to operate a separate switch.",
    "A fuse melts when excess current heats it. Earthing provides a low-resistance fault path; double insulation removes the need for an exposed conductive case earth connection. Circuit protection is placed in the live conductor.",
    "Simplified diode and relay threshold models; no reverse breakdown, hysteresis or coil dynamics. The cut-out opens instantly above its rating, an ideal comparison rather than a real fuse time-current curve. The diagram is educational and is not a mains wiring instruction.",
    "Rectifiers, automated control and electrical protection.",
    "Does a fuse protect against every electric shock?",
    "No. A shock current can be dangerous while remaining below a fuse rating. Protection depends on appropriate insulation, earthing and suitable protective devices.",
  ],
  magnetism: [
    "A current produces a magnetic field.",
    "A solenoid combines many current-loop fields to produce a strong field inside. Reversing current reverses the field. An iron core can strengthen an electromagnet, but this lab uses air.",
    "Field lines go from north to south outside a magnet and form closed loops overall. Like poles repel and unlike poles attract; induced magnetisation can attract an initially unmagnetised ferromagnetic object.",
    "Long-solenoid and long-straight-wire reference equations with μ₀ ≈ 4π × 10⁻⁷. Wire probe radius is fixed at 0.05 m. Field lines illustrate direction, not a finite-element field solution. No core saturation or hysteresis is modelled.",
    "Relays, lifting magnets, electric bells and magnetic probes.",
    "How can you reverse an electromagnet’s poles?",
    "Reverse the conventional current direction while keeping the winding orientation fixed.",
  ],
  charged: [
    "A perpendicular magnetic force changes direction.",
    "The Lorentz force is perpendicular to velocity. It can bend the path without changing speed or kinetic energy. With velocity perpendicular to a uniform field the ideal trajectory is circular.",
    "Fleming’s left-hand rule applies to conventional current; a negatively charged particle moves opposite the conventional-current direction. Reversing either charge sign or field reverses curvature.",
    "Analytic nonrelativistic circular motion with initial velocity along +x, uniform field along ±z and elementary charge magnitude. No electric field, radiation loss or collisions. At B = 0 the trajectory is straight and radius has no finite value. Screen length auto-scales.",
    "Electron beams, mass spectrometers and particle accelerators.",
    "Does a magnetic force increase a particle’s kinetic energy?",
    "Not by itself. Its force is perpendicular to the velocity, so F·v = 0 and it does no work.",
  ],
  induction: [
    "Changing flux links mechanical and electrical transfers.",
    "Rotating a coil changes its flux linkage and generates an emf. Increasing turns, field, area or rotation rate increases the peak emf. Lenz’s law gives a direction opposing the change that causes induction.",
    "A current-carrying coil in a magnetic field experiences a turning effect. A DC motor’s split-ring commutator reverses coil current each half-turn to keep the torque in one rotational direction.",
    "Uniform field and imposed angular speed; no rotor acceleration, friction, back-emf load circuit or self-start dynamics are solved. Generator and motor calculations are comparison views, not simultaneous claims about one loaded machine. The motor assumes ideal commutation at zero torque.",
    "Generators, electric motors, microphones and induction sensing.",
    "At maximum flux, is the generated emf maximum?",
    "No. At maximum flux its time derivative is zero. The generated emf is largest as the flux passes through zero.",
  ],
  transformer: [
    "Turns trade voltage for current.",
    "An alternating primary current creates changing flux. An ideal transformer has Vs/Vp = Ns/Np. Ideal input and output powers are equal, so stepping up voltage reduces current for a fixed power transfer.",
    "Transmission loss is I²R. For a given transmitted power, higher voltage means smaller current and reduced heating in the lines. A steady DC supply does not maintain transformer action.",
    "Ideal sinusoidal AC RMS quantities, resistive secondary load, perfect coupling and no internal loss. The separately displayed line loss is Ip²Rline using the ideal current; it is a comparison estimate, not included in the ideal transformer energy balance.",
    "Power grids, adapters and electrical isolation.",
    "Why does a transformer need changing current?",
    "A changing magnetic flux is needed to induce a sustained secondary emf. Steady DC produces no continuing flux change after the transient.",
  ],
  atom: [
    "The nucleus contains most of the atomic mass.",
    "Proton number identifies the element. Mass number counts protons plus neutrons. Isotopes share proton number but have different neutron numbers; ions have gained or lost electrons.",
    "Rutherford scattering supports a tiny concentrated positive nucleus: most alpha particles pass through almost undeflected, while a small proportion scatter through large angles.",
    "Particle sizes and ray paths are schematic; a point-charge Rutherford angle is calculated at the chosen energy and impact parameter. Nuclear accounting conserves charge and nucleon number. Selecting a decay equation does not assert that every chosen isotope really undergoes that decay. Physically impossible daughters return no result.",
    "Isotope identification, nuclear analysis and scattering experiments.",
    "Does beta-minus decay change mass number?",
    "No. A neutron becomes a proton with an electron and electron antineutrino emitted. Proton number increases by one, but total nucleon number is unchanged.",
  ],
  radioactivity: [
    "Random nuclei create a predictable population trend.",
    "Each nucleus has a constant probability per unit time of decay. Its exact decay time is unpredictable, but many nuclei follow an exponential expectation. A half-life halves the expected undecayed population.",
    "Alpha is strongly ionising and weakly penetrating, beta is moderately penetrating, and gamma is less ionising per path and more penetrating. Electric and magnetic fields deflect charged alpha/beta emissions but not gamma photons.",
    "Independent exponential waiting times generated once from a reproducible seed. Cyan dots are one stochastic sample, gold values are expectation. Attenuation is a generic monoenergetic exponential approximation. Detector readout is an expected rate, not a simulated Poisson counter or measured result; geometry and efficiency are unity.",
    "Medical tracers, smoke alarms, sterilisation and thickness monitoring. Reduce exposure time, increase distance and use suitable shielding.",
    "After two half-lives, must exactly one quarter of a small sample remain?",
    "No. One quarter is the expected proportion. A finite random sample fluctuates around it; different seeds give different samples.",
  ],
  earthmoon: [
    "Seasons follow tilt; phases follow viewing geometry.",
    "Earth rotates in about 24 hours and orbits in about a year. Tilt changes solar altitude and daylight duration. Opposite hemispheres experience opposite seasons.",
    "The Moon’s phases arise because we see different fractions of its sunlit hemisphere, not because Earth’s shadow normally covers it. The synodic phase cycle is about 29.53 days.",
    "Circular coplanar orbits and sinusoidal solar declination. Earth year = 365.25 days, lunar synodic month = 29.53059 days. Daylight excludes atmospheric refraction and the Sun’s finite disc. Screen objects are not to scale; phase-disc shading is schematic, while illuminated fraction is geometric. Animation advances 0.2 model day per simulation second.",
    "Calendars, daylight planning, lunar observation and solar energy.",
    "Is summer mainly caused by Earth being closer to the Sun?",
    "No. Axial tilt changes the angle of sunlight and day length. The two hemispheres have opposite seasons at the same Earth–Sun distance.",
  ],
  solarsystem: [
    "One Sun, eight planets, many smaller bodies.",
    "The planetary order is Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune. The inner four are rocky; the outer planets include gas and ice giants. Gravity provides their orbital acceleration.",
    "Real planets, dwarf planets and comets follow approximately elliptical orbits with the Sun at a focus. Planets formed by accretion in a rotating disc of gas and dust; moons orbit planets and asteroids/comets form smaller populations.",
    "Eight adopted approximate mean radii, masses and planet sizes. Circular independent test-particle orbits use GM☉; interactions and eccentricities are omitted. The orrery uses logarithmically spaced screen radii and enlarged bodies. Radius multiplier applies only to the selected numeric comparison; the labelled orbit follows that radius. Use the gravity lab for elliptical energy/speed investigations.",
    "Space missions, light travel delays and planetary comparisons.",
    "Why do distant planets generally orbit more slowly?",
    "Solar gravity weakens with distance. Circular orbital speed is √(GM/r), so it falls as radius increases.",
  ],
  stars: [
    "Gravity and nuclear reactions shape a star’s life.",
    "A collapsing cloud heats into a protostar. A stable main-sequence star balances inward gravity with pressure supported by energy from hydrogen fusion. Later evolution depends strongly on initial mass.",
    "Lower-mass stars become giants and leave white dwarfs in planetary nebulae. Massive stars become supergiants and can explode as supernovae, leaving neutron stars or black holes. Ejected heavy elements enrich future star-forming clouds.",
    "Qualitative stage storyboard. The 8 M☉ branch boundary is a teaching approximation, not a remnant predictor. L ∝ M^3.5 and lifetime ∝ M/L are rough main-sequence estimates, especially outside Sun-like stars. Spectrum temperature is independent; no stellar structure or time evolution is solved. Fusion energy uses an illustrative 0.0287 u mass defect.",
    "Stellar populations, chemical element origins and spectroscopy.",
    "Why do more massive main-sequence stars usually live less long?",
    "They have more fuel, but consume it much faster because luminosity rises steeply with mass. Fuel divided by consumption rate therefore decreases.",
  ],
  universe: [
    "Redshift connects spectra to cosmic expansion.",
    "Light from receding galaxies is shifted to longer wavelengths. At low redshift, v ≈ cz and Hubble’s relation is v = H₀d. A standard-candle supernova can supply a distance estimate from its brightness.",
    "The cosmic microwave background is relic radiation from the early hot Universe. Expansion stretches photon wavelengths and reduces its temperature. Redshift and the CMB together support the hot Big Bang picture.",
    "Linear low-redshift approximation, distances up to 300 Mpc and selected H₀. Hubble time 1/H₀ is an age estimate, not a full cosmological age calculation. CMB scaling assumes adiabatic expansion. Pulsing galaxy positions illustrate expanding separation; they are not measured galaxies or a fitted expansion history.",
    "Galaxy distances, spectra and the history of the Universe.",
    "Is 1/H₀ an exact age of the Universe?",
    "No. It is the expansion timescale extrapolated from the present rate. The actual age depends on how the expansion rate has changed.",
  ],
};
const n = (v) =>
  v === null
    ? "not defined"
    : Math.abs(v) >= 1e5 || (Math.abs(v) > 0 && Math.abs(v) < 0.001)
      ? v.toExponential(3)
      : Number(v.toPrecision(5)).toString();
export const CURRICULUM_LESSONS = Object.fromEntries(
  Object.entries(CURRICULUM_SIMULATIONS).map(([id, d]) => {
    const [
        description,
        intro,
        explanation,
        model,
        applications,
        concept,
        answer,
      ] = NOTES[id],
      p = d.defaults,
      s = d.create(p).state;
    // Fixed textbook calculation questions are explicitly tied to a named setup,
    // unlike the calculation inspector, which always follows the current run.
    s.t = id === "sound" ? 0.001 : id === "charged" ? 1e-9 : 10;
    const q = sampleCurriculum(id, s, p);
    const questions = WORK[id]
      .slice(0, 3)
      .map((r) => [
        `Using “Start here” settings at t = ${s.t} ${id === "solarsystem" ? "yr" : "s"}, calculate: ${r.title.toLowerCase()}.`,
        `${r.formula}. ${r.sub(p, q, n, s)}. Result: ${n(q[r.key])} ${r.unit}. These are fixed model-calculation questions; changing live settings does not change this answer.`,
      ]);
    questions.push(
      [concept, answer],
      [
        "Which assumptions should you check before applying this model to a real experiment?",
        model,
      ],
    );
    const experiments = d.presets.map(([preset, params], i) => ({
      title:
        i === 0
          ? "Establish a reference"
          : i === 1
            ? d.presets[1][0]
            : d.presets[2][0],
      preset,
      text: `Load “${preset}”, inspect the calculation panel, and record the first three readouts. ${
        i === 0
          ? "Identify the input, output and controlled variables."
          : `Compare with “Start here”. Changed settings: ${Object.entries(
              params,
            )
              .filter(([k, v]) => v !== p[k])
              .map(([k, v]) => `${k} = ${n(v)}`)
              .join(", ")} (internal units).`
      }`,
      predict:
        "Predict which reading changes, and explain your prediction with an equation.",
      result: i === 0 ? intro : explanation,
    }));
    return [
      id,
      {
        description,
        intro,
        objectives: [
          `Use ${d.formula} with consistent units.`,
          `Investigate how the controls affect ${d.short.toLowerCase()}.`,
          "Distinguish a calculated model result from an experimental measurement.",
        ],
        principles: [
          ["Connect the model", intro],
          ["Explain the observation", explanation],
        ],
        equations: WORK[id].map((r) => [
          r.title,
          r.formula,
          `${r.unit || "Dimensionless or count"}. Results use the documented model assumptions.`,
        ]),
        experiments,
        questions,
        applications,
        model,
        source: [
          "Cambridge IGCSE Physics 0625 syllabus",
          "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-physics-0625/",
        ],
      },
    ];
  }),
);
