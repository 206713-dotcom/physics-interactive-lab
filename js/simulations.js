/** Declarative simulation catalogue. Add a model here without duplicating the UI. */
import * as P from "./physics.js";
import * as E from "./physics-extra.js";
import { ADVANCED_SIMULATIONS } from "./advanced-simulations.js";
import {
  CURRICULUM_SIMULATIONS,
  curriculumRows,
} from "./curriculum-simulations.js";
const control = (key, label, unit, min, max, step, hint, factor = 1) => ({
  key,
  label,
  unit,
  min,
  max,
  step,
  hint,
  factor,
});
const metric = (label, value, unit, note = "") => ({
  label,
  value,
  unit,
  note,
});
const graph = (id, label, keys, unit, extra = {}) => ({
  id,
  label,
  keys,
  unit,
  ...extra,
});
const baseExtra = (id) => ({
  defaults: E.DEFAULTS[id],
  limits: E.LIMITS[id],
  create: (p) => E.createExtra(id, p),
  step: (s, p, h) => E.stepExtra(id, s, p, h),
  sample: (s, p) => E.sampleExtra(id, s, p),
  h: 1 / 240,
  rate: 1,
  sampleEvery: 1 / 30,
  window: 15,
  timeUnit: "s",
  timeFactor: 1,
});
const range = (n, min, max, fn) =>
  Array.from({ length: n }, (_, i) => fn(min + ((max - min) * i) / (n - 1)));
export const SIMULATIONS = {
  ...CURRICULUM_SIMULATIONS,
  ...ADVANCED_SIMULATIONS,
  spring: {
    title: "Simple harmonic motion",
    short: "Mass & spring",
    category: "Oscillations",
    level: "IGCSE · A Level",
    color: "#52ded1",
    formula: "F = −kx",
    summary: "Find the rhythm in a spring. Follow energy as it changes form.",
    defaults: P.SPRING_DEFAULTS,
    limits: P.SPRING_LIMITS,
    create: P.createSpring,
    step: P.stepSpring,
    h: 1 / 240,
    rate: 1,
    sampleEvery: 1 / 30,
    window: 12,
    timeUnit: "s",
    timeFactor: 1,
    controls: [
      control(
        "mass",
        "Mass",
        "kg",
        0.2,
        5,
        0.1,
        "More inertia, a longer period.",
      ),
      control(
        "k",
        "Spring stiffness",
        "N/m",
        1,
        100,
        1,
        "Stronger restoring force.",
      ),
      control(
        "displacement",
        "Initial displacement",
        "m",
        -0.8,
        0.8,
        0.01,
        "Released from rest.",
      ),
      control(
        "damping",
        "Damping",
        "kg/s",
        0,
        10,
        0.1,
        "Transfers mechanical energy to heat.",
      ),
    ],
    presets: [
      ["Ideal", { ...P.SPRING_DEFAULTS }],
      ["Damped", { ...P.SPRING_DEFAULTS, damping: 1 }],
      ["Critical", { ...P.SPRING_DEFAULTS, damping: 2 * Math.sqrt(20) }],
    ],
    sample: (s, p) => ({
      t: s.t,
      x: s.x,
      v: s.v,
      a: P.springAcceleration(s, p),
      ...P.springEnergy(s, p),
    }),
    metrics: (s, p) => {
      const q = P.springInfo(p);
      return [
        metric("Natural period", q.period, "s", "Undamped reference"),
        metric("Natural frequency", q.frequency, "Hz", "f₀ = 1 / T₀"),
        metric(
          "Mechanical energy",
          P.springEnergy(s, p).total,
          "J",
          "Kinetic + elastic potential",
        ),
      ];
    },
    graphs: [
      graph("motion", "Motion", ["x", "v", "a"], "", {
        stacked: true,
        labels: [
          "Displacement / m",
          "Velocity / m s⁻¹",
          "Acceleration / m s⁻²",
        ],
      }),
      graph("energy", "Energy", ["kinetic", "potential", "total"], "J"),
    ],
    caption:
      "Horizontal Hookean spring · ruler in m · block size illustrative · RK4, 1/240 s",
    equation: "m ẍ + b ẋ + kx = 0",
    insight: "Double the mass. Does the period double, or increase by √2?",
    supplementary: (s, p) => {
      const e = P.springEnergy(s, p),
        q = P.springInfo(p);
      return [
        metric("Angular frequency ω₀", q.omega, "rad/s"),
        metric("Kinetic", e.kinetic, "J"),
        metric("Elastic potential", e.potential, "J"),
      ];
    },
  },
  gravity: {
    title: "Newton’s law of gravitation",
    short: "Orbital mechanics",
    category: "Mechanics",
    level: "A Level",
    color: "#7cacf7",
    formula: "F = GMm/r²",
    summary: "A tiny change in launch speed. A completely different journey.",
    defaults: {
      ...P.ORBIT_DEFAULTS,
      velocity: P.circularSpeed(P.ORBIT_DEFAULTS),
    },
    limits: P.ORBIT_LIMITS,
    create: P.createOrbit,
    step: P.stepOrbit,
    h: 2,
    rate: 3600,
    sampleEvery: 120,
    window: 24,
    timeUnit: "h",
    timeFactor: 3600,
    controls: [
      control(
        "centralMass",
        "Central mass",
        "10²⁴ kg",
        1,
        20,
        0.001,
        "Both masses affect relative motion.",
        1e24,
      ),
      {
        ...control(
          "bodyMass",
          "Satellite mass",
          "kg",
          2,
          23,
          0.1,
          "Logarithmic slider: 10²–10²³ kg.",
        ),
        log: true,
      },
      control(
        "distance",
        "Initial separation",
        "10³ km",
        8,
        40,
        0.1,
        "Between centres, outside the sphere.",
        1e6,
      ),
      control(
        "velocity",
        "Tangential launch speed",
        "km/s",
        0,
        25,
        0.01,
        "Circular and escape presets recalculate this.",
        1000,
      ),
    ],
    presets: ["Circular", "Elliptical", "Escape"].map((name, i) => [
      name,
      {
        ...P.ORBIT_DEFAULTS,
        velocity: P.circularSpeed(P.ORBIT_DEFAULTS) * [1, 0.8, 1.5][i],
      },
    ]),
    sample: (s, p) => ({
      t: s.t,
      x: s.x,
      y: s.y,
      vx: s.vx,
      vy: s.vy,
      speed: Math.hypot(s.vx, s.vy),
      distance: Math.hypot(s.x, s.y),
      force: P.gravityForce(p.centralMass, p.bodyMass, Math.hypot(s.x, s.y)),
      ...P.orbitEnergy(s, p),
    }),
    // Retain the student's masses and separation for a controlled comparison.
    presetFor: (index, p) => ({
      ...p,
      velocity: P.circularSpeed(p) * [1, 0.8, 1.5][index],
    }),
    metrics: (s, p) => [
      metric(
        "Relative speed",
        Math.hypot(s.vx, s.vy) / 1000,
        "km/s",
        P.orbitInfo(s, p).kind,
      ),
      metric(
        "Separation",
        Math.hypot(s.x, s.y) / 1000,
        "km",
        "Centre to centre",
      ),
      metric(
        "Mechanical energy",
        P.orbitEnergy(s, p).total,
        "J",
        "Centre-of-mass frame",
      ),
    ],
    graphs: [
      graph("speed", "Speed", ["speed"], "km/s", { factor: 0.001 }),
      graph("distance", "Distance", ["distance"], "km", { factor: 0.001 }),
      graph("energy", "Energy", ["kinetic", "potential", "total"], "J"),
    ],
    caption:
      "1× = 1 hour / real second · central-body camera · planar motion · auto zoom · satellite enlarged; vector lengths use separate capped scales",
    equation: "r̈ = −G(M + m) r / |r|³",
    insight: "Try 0.80× circular speed. Where is the satellite moving fastest?",
    supplementary: (s, p) => [
      metric(
        "Gravity force",
        P.gravityForce(p.centralMass, p.bodyMass, Math.hypot(s.x, s.y)),
        "N",
      ),
      metric("Eccentricity", P.orbitInfo(s, p).eccentricity, ""),
      metric(
        "Altitude above surface",
        Math.max(0, Math.hypot(s.x, s.y) - P.centralRadius(p)) / 1000,
        "km",
      ),
    ],
    ended: (s, p) =>
      s.collided
        ? "Surface impact"
        : Math.hypot(s.x, s.y) > 100 * p.distance
          ? "Display distance limit"
          : null,
  },
  pendulum: {
    ...baseExtra("pendulum"),
    title: "The nonlinear pendulum",
    short: "Pendulum",
    category: "Oscillations",
    level: "IGCSE · A Level",
    color: "#ffa96c",
    formula: "θ̈ = −(g/L) sin θ",
    summary:
      "From gentle swings to wide arcs. Find the limit of the small-angle rule.",
    controls: [
      control(
        "length",
        "Pendulum length",
        "m",
        0.3,
        3,
        0.05,
        "Longer pendulums swing more slowly.",
      ),
      control(
        "angle",
        "Release angle",
        "°",
        -120,
        120,
        1,
        "Large angles depart from SHM.",
      ),
      control(
        "g",
        "Gravity",
        "m/s²",
        1,
        20,
        0.01,
        "Try Earth and Moon presets.",
      ),
      control(
        "damping",
        "Angular damping",
        "s⁻¹",
        0,
        1,
        0.01,
        "Opposes angular velocity.",
      ),
      control(
        "mass",
        "Bob mass",
        "kg",
        0.2,
        5,
        0.1,
        "Changes energy, not the ideal period.",
      ),
    ],
    presets: [
      ["Small angle", { ...E.DEFAULTS.pendulum, angle: 10 }],
      ["Wide swing", { ...E.DEFAULTS.pendulum, angle: 100 }],
      ["Moon", { ...E.DEFAULTS.pendulum, g: 1.62 }],
    ],
    metrics: (s, p) => [
      metric(
        "Angle",
        s.theta / E.DEG,
        "°",
        "Measured from the downward vertical",
      ),
      metric(
        "Bob speed",
        Math.abs(s.omega * p.length),
        "m/s",
        "Speed along the circular arc",
      ),
      metric(
        "Small-angle period",
        2 * Math.PI * Math.sqrt(p.length / p.g),
        "s",
        "Approximation; large swings take longer",
      ),
    ],
    graphs: [
      graph("angle", "Angle", ["theta"], "°", { factor: 1 / E.DEG }),
      graph("energy", "Energy", ["kinetic", "potential", "total"], "J"),
    ],
    supplementary: (s, p) => {
      const e = E.pendulumEnergy(s, p);
      return [
        metric("Kinetic", e.kinetic, "J"),
        metric("Gravitational potential", e.potential, "J"),
        metric("Total energy", e.total, "J"),
      ];
    },
    caption:
      "Nonlinear sin θ model · point bob, rigid massless link · RK4, 1/240 s",
    equation: "θ̈ + βθ̇ + (g/L) sin θ = 0",
    insight: "Compare 10° and 100° releases. Which has the longer period?",
  },
  projectile: {
    ...baseExtra("projectile"),
    title: "Projectile motion",
    short: "Projectile motion",
    category: "Mechanics",
    level: "IGCSE · A Level",
    color: "#a49aff",
    formula: "a = g − β|v|v",
    summary:
      "Launch, predict, and compare. Watch air resistance reshape the arc.",
    controls: [
      control(
        "speed",
        "Launch speed",
        "m/s",
        5,
        60,
        0.5,
        "Changes horizontal and vertical velocity.",
      ),
      control(
        "angle",
        "Launch angle",
        "°",
        5,
        85,
        1,
        "Measured above horizontal.",
      ),
      control(
        "height",
        "Launch height",
        "m",
        0,
        20,
        0.5,
        "The ground is y = 0.",
      ),
      control(
        "g",
        "Gravity",
        "m/s²",
        1,
        20,
        0.01,
        "Uniform downward acceleration.",
      ),
      control(
        "drag",
        "Drag per unit mass",
        "m⁻¹",
        0,
        0.08,
        0.001,
        "Quadratic drag: a_drag = −β|v|v.",
      ),
    ],
    presets: [
      ["Vacuum", { ...E.DEFAULTS.projectile }],
      ["Air resistance", { ...E.DEFAULTS.projectile, drag: 0.025 }],
      ["Moon", { ...E.DEFAULTS.projectile, g: 1.62 }],
    ],
    metrics: (s, p) => [
      metric(
        "Horizontal distance",
        s.x,
        "m",
        s.landed ? "Ground contact" : "From launch position",
      ),
      metric("Height", s.y, "m", "Above the ground"),
      metric("Speed", Math.hypot(s.vx, s.vy), "m/s", "Magnitude of velocity"),
    ],
    graphs: [
      graph("trajectory", "Trajectory", ["y"], "m", { spatial: "trajectory" }),
      graph("velocity", "Velocity", ["vx", "vy"], "m/s"),
      graph(
        "energy",
        "Specific energy",
        ["kinetic", "potential", "total"],
        "J/kg",
      ),
    ],
    supplementary: (s, p) => {
      const r = E.projectileReference(p);
      return [
        metric("Vacuum range", r.range, "m"),
        metric("Vacuum flight time", r.flightTime, "s"),
        metric("Vacuum peak height", r.maxHeight, "m"),
      ];
    },
    caption:
      "Uniform gravity · quadratic drag · dashed arc is the zero-drag prediction · RK4, 1/240 s",
    equation: "v̇ = (0, −g) − β|v|v",
    insight:
      "Why is 45° no longer the best angle when drag or launch height changes?",
    ended: (s) => (s.landed ? "Ground contact" : null),
  },
  collisions: {
    ...baseExtra("collisions"),
    title: "Collisions & momentum",
    short: "Collisions",
    category: "Mechanics",
    level: "IGCSE · A Level",
    color: "#ffce72",
    formula: "Σp before = Σp after",
    summary:
      "Two gliders. One collision. Follow momentum and the missing kinetic energy.",
    controls: [
      control(
        "m1",
        "Mass of cart A",
        "kg",
        0.2,
        5,
        0.1,
        "Cyan cart, initially on the left.",
      ),
      control(
        "m2",
        "Mass of cart B",
        "kg",
        0.2,
        5,
        0.1,
        "Gold cart, initially on the right.",
      ),
      control(
        "u1",
        "Initial velocity A",
        "m/s",
        -5,
        5,
        0.1,
        "Positive is to the right.",
      ),
      control(
        "u2",
        "Initial velocity B",
        "m/s",
        -5,
        5,
        0.1,
        "Negative is to the left.",
      ),
      control(
        "restitution",
        "Restitution e",
        "",
        0,
        1,
        0.05,
        "1 = elastic; 0 = move together after contact.",
      ),
    ],
    presets: [
      ["Elastic", { ...E.DEFAULTS.collisions }],
      ["Stick together", { ...E.DEFAULTS.collisions, restitution: 0 }],
      [
        "Head-on",
        { ...E.DEFAULTS.collisions, m1: 2, u1: 2, u2: -1, restitution: 0.7 },
      ],
    ],
    metrics: (s, p) => [
      metric(
        "System momentum",
        p.m1 * s.v1 + p.m2 * s.v2,
        "kg m/s",
        "Conserved; no external horizontal force",
      ),
      metric(
        "Kinetic energy",
        0.5 * p.m1 * s.v1 ** 2 + 0.5 * p.m2 * s.v2 ** 2,
        "J",
        s.hit ? "After contact" : "Before contact",
      ),
      metric(
        "Restitution",
        p.restitution,
        "",
        "Relative separation / approach speed",
      ),
    ],
    graphs: [
      graph("velocity", "Velocities", ["v1", "v2"], "m/s"),
      graph("momentum", "Momentum", ["momentum"], "kg m/s"),
      graph("energy", "Kinetic energy", ["kinetic"], "J"),
    ],
    supplementary: (s) => [
      metric("Velocity A", s.v1, "m/s"),
      metric("Velocity B", s.v2, "m/s"),
      metric("Collision", s.hit ? "Complete" : "Pending", ""),
    ],
    caption:
      "1D instantaneous collision · 0.8 m cart length · frictionless rail · no wall collisions",
    equation: "m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂",
    insight: "Set equal masses and e = 1. What happens to the velocities?",
    ended: (s) => (s.t >= 10 ? "10 s observation complete" : null),
  },
  waves: {
    ...baseExtra("waves"),
    title: "Waves & superposition",
    short: "Wave studio",
    category: "Waves",
    level: "IGCSE · A Level",
    color: "#57d9ed",
    formula: "y = y₁ + y₂",
    summary:
      "Add two waves and discover travelling patterns, nodes and antinodes.",
    controls: [
      control(
        "amplitude",
        "Incident amplitude",
        "m",
        0.05,
        0.6,
        0.01,
        "Resultant amplitude can reach 2A.",
      ),
      control(
        "wavelength",
        "Wavelength",
        "m",
        0.5,
        4,
        0.1,
        "Sets the distance between crests.",
      ),
      control(
        "speed",
        "Wave speed",
        "m/s",
        0.2,
        4,
        0.1,
        "Frequency f = v / λ.",
      ),
      control(
        "reflection",
        "Counter-wave amplitude ratio",
        "",
        0,
        1,
        0.05,
        "0 = travelling; 1 = pure standing pattern.",
      ),
      control(
        "probe",
        "Probe position x",
        "m",
        0,
        8,
        0.1,
        "Watch this point on the time graph.",
      ),
    ],
    presets: [
      ["Travelling", { ...E.DEFAULTS.waves, reflection: 0 }],
      ["Standing", { ...E.DEFAULTS.waves }],
      ["Partial reflection", { ...E.DEFAULTS.waves, reflection: 0.5 }],
    ],
    metrics: (s, p) => [
      metric(
        "Frequency",
        p.speed / p.wavelength,
        "Hz",
        "Both waves share the same frequency",
      ),
      metric(
        "Node spacing",
        p.wavelength / 2,
        "m",
        "For equal counter-propagating waves",
      ),
      metric(
        "Probe displacement",
        E.waveAt(p.probe, s.t, p).resultant,
        "m",
        "Sum of the two component displacements",
      ),
    ],
    graphs: [
      graph(
        "profile",
        "Spatial profile",
        ["incident", "reflected", "resultant"],
        "m",
        { spatial: "wave" },
      ),
      graph(
        "probe",
        "Probe history",
        ["incident", "reflected", "resultant"],
        "m",
      ),
    ],
    supplementary: (s, p) => [
      metric("Period", p.wavelength / p.speed, "s"),
      metric("Counter amplitude", p.amplitude * p.reflection, "m"),
      metric("Maximum envelope", p.amplitude * (1 + p.reflection), "m"),
    ],
    caption:
      "Analytic counter-propagating waves · x = 0–8 m · transverse displacement exaggerated",
    equation: "y = A sin(kx − ωt) + RA sin(kx + ωt)",
    insight:
      "Move the probe to a node. Can the medium stay still while waves pass through it?",
  },
  interference: {
    ...baseExtra("interference"),
    title: "Double-slit interference",
    short: "Double slit",
    category: "Optics",
    level: "A Level",
    color: "#ce93f6",
    formula: "Δy ≈ λL/d",
    summary: "See interference fringes emerge inside a diffraction envelope.",
    controls: [
      control(
        "wavelength",
        "Wavelength",
        "nm",
        400,
        700,
        5,
        "Visible spectrum; both slits are coherent.",
        1e-9,
      ),
      control(
        "separation",
        "Slit separation d",
        "mm",
        0.15,
        0.8,
        0.01,
        "Wider separation makes fringes closer.",
        0.001,
      ),
      control(
        "screenDistance",
        "Screen distance L",
        "m",
        0.5,
        4,
        0.1,
        "Larger distance widens the pattern.",
      ),
      control(
        "slitWidth",
        "Individual slit width a",
        "mm",
        0.01,
        0.1,
        0.005,
        "Sets the diffraction envelope.",
        0.001,
      ),
    ],
    presets: [
      ["Green light", { ...E.DEFAULTS.interference }],
      ["Red light", { ...E.DEFAULTS.interference, wavelength: 650e-9 }],
      ["Narrow slits", { ...E.DEFAULTS.interference, slitWidth: 0.015e-3 }],
    ],
    metrics: (s, p) => [
      metric(
        "Central fringe spacing",
        ((p.wavelength * p.screenDistance) / p.separation) * 1000,
        "mm",
        "Small-angle approximation λL/d",
      ),
      metric(
        "Envelope first minimum",
        ((p.wavelength * p.screenDistance) / p.slitWidth) * 1000,
        "mm",
        "Small-angle approximation λL/a",
      ),
      metric(
        "Photon energy",
        (6.62607015e-34 * E.C_LIGHT) / p.wavelength / 1.602176634e-19,
        "eV",
        "E = hc / λ",
      ),
    ],
    graphs: [
      graph(
        "intensity",
        "Screen intensity",
        ["intensity", "envelope"],
        "I/I₀",
        { spatial: "interference" },
      ),
    ],
    supplementary: (s, p) => [
      metric("Slit ratio d/a", p.separation / p.slitWidth, ""),
      metric("Screen distance", p.screenDistance, "m"),
      metric("Wavelength", p.wavelength * 1e9, "nm"),
    ],
    caption:
      "Fraunhofer model · time-averaged intensity · apparatus and wavefront spacing schematic",
    equation: "I/I₀ = sinc²(πa sinθ/λ) cos²(πd sinθ/λ)",
    insight: "Double d. Then double L. Which change widens the fringes?",
  },
  refraction: {
    ...baseExtra("refraction"),
    title: "Refraction & total internal reflection",
    short: "Bending light",
    category: "Optics",
    level: "IGCSE · A Level",
    color: "#70c5ff",
    formula: "n₁ sin i = n₂ sin r",
    summary:
      "Bend a beam, find the critical angle, and trap light inside a medium.",
    controls: [
      control(
        "angle",
        "Incident angle",
        "°",
        0,
        85,
        1,
        "Measured from the normal.",
      ),
      control(
        "n1",
        "Index of medium 1",
        "",
        1,
        2.4,
        0.01,
        "The incoming side.",
      ),
      control(
        "n2",
        "Index of medium 2",
        "",
        1,
        2.4,
        0.01,
        "The transmitted side.",
      ),
      control(
        "wavelength",
        "Vacuum wavelength",
        "nm",
        400,
        700,
        5,
        "Frequency stays constant across the boundary.",
        1e-9,
      ),
    ],
    presets: [
      ["Air → glass", { ...E.DEFAULTS.refraction }],
      ["Glass → air", { ...E.DEFAULTS.refraction, n1: 1.5, n2: 1, angle: 35 }],
      [
        "Total reflection",
        { ...E.DEFAULTS.refraction, n1: 1.5, n2: 1, angle: 55 },
      ],
    ],
    metrics: (s, p) => {
      const q = E.refractionInfo(p);
      return [
        metric(
          "Refracted angle",
          q.tir ? "TIR" : q.refracted,
          "°",
          q.tir ? "No propagating transmitted ray" : "Measured from the normal",
        ),
        metric(
          "Critical angle",
          q.critical ?? "—",
          "°",
          q.critical === null
            ? "Only defined when n₁ > n₂"
            : "At the onset of total internal reflection",
        ),
        metric(
          "Reflected power",
          100 * q.reflectance,
          "%",
          "Unpolarised Fresnel reflectance",
        ),
      ];
    },
    graphs: [
      graph("angles", "Angle sweep", ["refracted"], "°", {
        spatial: "refraction",
      }),
    ],
    supplementary: (s, p) => [
      metric("Speed in medium 1", E.C_LIGHT / p.n1 / 1e6, "10⁶ m/s"),
      metric("Speed in medium 2", E.C_LIGHT / p.n2 / 1e6, "10⁶ m/s"),
      metric("Wavelength in medium 2", (p.wavelength / p.n2) * 1e9, "nm"),
    ],
    caption:
      "Angles from the normal · lossless, non-dispersive media · pulses slowed for illustration",
    equation: "n₁ sin i = n₂ sin r",
    insight:
      "Can total internal reflection happen when light travels from air into glass?",
  },
  circuits: {
    ...baseExtra("circuits"),
    title: "RC charging & discharging",
    short: "RC circuits",
    category: "Electricity",
    level: "A Level",
    color: "#f0ba62",
    formula: "τ = RC",
    summary:
      "Watch charge accumulate. Turn an exponential into something you can see.",
    controls: [
      control(
        "voltage",
        "Supply voltage",
        "V",
        1,
        24,
        0.5,
        "Ideal DC voltage source.",
      ),
      control(
        "resistance",
        "Resistance",
        "Ω",
        100,
        10000,
        100,
        "Larger R slows charging and reduces initial current.",
      ),
      control(
        "capacitance",
        "Capacitance",
        "µF",
        100,
        2000,
        50,
        "Larger C stores more charge.",
        1e-6,
      ),
      {
        key: "discharge",
        label: "Switch position",
        unit: "",
        options: [
          ["0", "Charge"],
          ["1", "Discharge"],
        ],
        hint: "Changing the switch starts a fresh run.",
      },
    ],
    presets: [
      ["Charge", { ...E.DEFAULTS.circuits }],
      ["Discharge", { ...E.DEFAULTS.circuits, discharge: 1 }],
      ["Slow charge", { ...E.DEFAULTS.circuits, resistance: 5000 }],
    ],
    metrics: (s, p) => {
      const q = E.circuitAt(s.t, p);
      return [
        metric(
          "Capacitor voltage",
          q.voltage,
          "V",
          "Across the capacitor plates",
        ),
        metric(
          "Conventional current",
          q.current * 1000,
          "mA",
          "Negative during discharge",
        ),
        metric(
          "Time constant τ",
          q.tau,
          "s",
          "After τ: 63.2% charged / 36.8% retained",
        ),
      ];
    },
    graphs: [
      graph("voltage", "Voltage", ["voltage"], "V"),
      graph("current", "Current", ["current"], "mA", { factor: 1000 }),
      graph("charge", "Charge", ["charge"], "mC", { factor: 1000 }),
    ],
    supplementary: (s, p) => {
      const q = E.circuitAt(s.t, p);
      return [
        metric("Stored charge", q.charge * 1000, "mC"),
        metric("Stored energy", q.energy * 1000, "mJ"),
        metric("Elapsed / τ", s.t / q.tau, ""),
      ];
    },
    caption:
      "Exact exponential solution · ideal RC circuit · moving dots show conventional current, not electron speed",
    equation: "Vc = V₀(1 − e^(−t/RC))",
    insight:
      "At t = τ the capacitor is not fully charged. What fraction is still missing?",
    h: 1 / 2400,
    rateFor: (p) => Math.min(1, (p.resistance * p.capacitance) / 1.5),
    sampleEvery: (p) => (p.resistance * p.capacitance) / 60,
    window: (p) => 6 * p.resistance * p.capacitance,
    ended: (s, p) =>
      s.t >= 6 * p.resistance * p.capacitance
        ? "Six-time-constant observation complete"
        : null,
  },
  fields: {
    ...baseExtra("fields"),
    title: "Electric fields & potential",
    short: "Electric fields",
    category: "Electricity",
    level: "A Level",
    color: "#ff8aa8",
    formula: "E = Σ kq r / |r|³",
    summary:
      "Explore an invisible landscape. Trace the field and move a virtual probe.",
    controls: [
      control(
        "q1",
        "Charge A",
        "µC",
        -5,
        5,
        0.1,
        "Positive sources; negative sinks.",
        1e-6,
      ),
      control(
        "q2",
        "Charge B",
        "µC",
        -5,
        5,
        0.1,
        "Fields add as vectors.",
        1e-6,
      ),
      control(
        "separation",
        "Charge separation",
        "m",
        1,
        4,
        0.1,
        "Charges remain fixed on the x axis.",
      ),
      control(
        "probeX",
        "Probe x",
        "m",
        -4,
        4,
        0.1,
        "Move with sliders or click the 2D diagram.",
      ),
      control(
        "probeY",
        "Probe y",
        "m",
        -3,
        3,
        0.1,
        "The probe does not disturb the charges.",
      ),
    ],
    presets: [
      ["Dipole", { ...E.DEFAULTS.fields }],
      [
        "Like charges",
        { ...E.DEFAULTS.fields, q2: 2e-6, probeX: 0, probeY: 0 },
      ],
      ["Single charge", { ...E.DEFAULTS.fields, q2: 0 }],
    ],
    metrics: (s, p) => {
      const q = E.fieldAt(p.probeX, p.probeY, p);
      return [
        metric(
          "Field strength",
          q.magnitude ?? "—",
          "N/C",
          q.valid
            ? "Magnitude of the vector sum"
            : "Probe inside a charge exclusion disk",
        ),
        metric(
          "Electric potential",
          q.potential ?? "—",
          "V",
          "Scalar sum; zero at infinity",
        ),
        metric(
          "Field direction",
          q.valid && q.magnitude > 1e-8 ? Math.atan2(q.ey, q.ex) / E.DEG : "—",
          "°",
          "From +x, anticlockwise",
        ),
      ];
    },
    graphs: [
      graph("field", "Field profile", ["magnitude"], "N/C", {
        spatial: "field",
      }),
      graph("potential", "Potential profile", ["potential"], "V", {
        spatial: "field",
      }),
    ],
    supplementary: (s, p) => {
      const q = E.fieldAt(p.probeX, p.probeY, p);
      return [
        metric("Ex", q.ex ?? "—", "N/C"),
        metric("Ey", q.ey ?? "—", "N/C"),
        metric(
          "Probe distance from origin",
          Math.hypot(p.probeX, p.probeY),
          "m",
        ),
      ];
    },
    caption:
      "Fixed point charges · geometric field lines, not particle paths · probe exclusion radius 0.16 m",
    equation: "V = kq₁/r₁ + kq₂/r₂",
    insight:
      "At the midpoint of a dipole, can V be zero while the electric field is non-zero?",
  },
};
export const CATEGORIES = [
  "All experiments",
  "Astrophysics",
  "Mechanics",
  "Oscillations",
  "Waves",
  "Optics",
  "Electricity",
  "Thermal physics",
  "Magnetism",
  "Nuclear physics",
  "Space physics",
  "Quantum physics",
];
export function spatialRows(type, s, p) {
  if (type.startsWith("curriculum:")) return curriculumRows(type, s, p);
  if (type === "wave")
    return range(321, 0, 8, (x) => ({ x, ...E.waveAt(x, s.t, p) }));
  if (type === "interference")
    return range(601, -0.02, 0.02, (x) => ({ x, ...E.interferenceAt(x, p) }));
  if (type === "refraction")
    return range(171, 0, 85, (x) => ({ x, ...E.refractionInfo(p, x) }));
  if (type === "field")
    return range(401, -4, 4, (x) => ({ x, ...E.fieldAt(x, p.probeY, p) }));
  return null;
}
