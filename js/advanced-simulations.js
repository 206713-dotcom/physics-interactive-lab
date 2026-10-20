import * as A from "./physics-advanced.js";
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
const graph = (id, label, keys, unit, scale = 1) => ({
  id,
  label,
  keys,
  unit,
  scale,
});
const starControls = (triple) => [
  control(
    "m1",
    "Star A mass",
    "M☉",
    0.2,
    3,
    0.05,
    "Adopted solar-mass unit: 1.98847 × 10³⁰ kg.",
    A.SOLAR_MASS,
  ),
  control(
    "m2",
    "Star B mass",
    "M☉",
    0.2,
    3,
    0.05,
    "Both stars move; neither is pinned in place.",
    A.SOLAR_MASS,
  ),
  ...(triple
    ? [
        control(
          "m3",
          "Star C mass",
          "M☉",
          0.2,
          3,
          0.05,
          "Equal masses are required for the exact figure-eight reference.",
          A.SOLAR_MASS,
        ),
      ]
    : []),
  control(
    "separation",
    triple ? "Initial length scale" : "Initial separation",
    "AU",
    0.5,
    triple ? 3 : 4,
    0.05,
    triple
      ? "Figure-eight: initial A–B distance is about twice this scale."
      : "Centre-to-centre distance; 1 AU = 149,597,870,700 m.",
    A.AU,
  ),
  control(
    "speedFactor",
    "Launch speed multiplier",
    "×",
    triple ? 0.7 : 0.55,
    triple ? 1.3 : 1.5,
    0.01,
    triple
      ? "Multiplies the reference initial velocities."
      : "1× is circular; √2× is the escape threshold.",
  ),
  ...(triple
    ? [
        control(
          "perturbation",
          "Star C velocity kick",
          "%",
          0,
          5,
          0.01,
          "Percentage of √(GM_A/scale), added along +x before recentering.",
          0.01,
        ),
        {
          key: "layout",
          label: "Initial arrangement",
          options: [
            [0, "Figure-eight reference"],
            [1, "Equilateral triangle"],
            [2, "Inner binary + outer star"],
          ],
          hint: "A change selects new initial conditions; no orbit is prescribed.",
        },
      ]
    : []),
];
const stellar = (type) => ({
  defaults: A.ADVANCED_DEFAULTS[type],
  limits: A.ADVANCED_LIMITS[type],
  create: (p) => A.createStellar(type, p),
  step: A.stepStellar,
  sample: A.stellarSample,
  h: A.stellarStep(type, A.ADVANCED_DEFAULTS[type]),
  hFor: (p) => A.stellarStep(type, p),
  rateFor: (p) => 0.6 * A.stellarTime(type, p),
  sampleEvery: (p) => A.stellarTime(type, p) / 160,
  timeUnit: "yr",
  timeFactor: A.YEAR,
  window: (p) => (30 * A.stellarTime(type, p)) / A.YEAR,
  trailPoint: (s) => ({
    t: s.t,
    bodies: s.bodies.map(({ x, y }) => ({ x, y })),
  }),
  trailDuration: (p) =>
    type === "threebody" && p.layout !== 2
      ? (p.layout === 0 ? 2 : 1.1) * A.stellarTime(type, p)
      : Infinity,
  controls: starControls(type === "threebody"),
  graphs: [
    graph(
      "separations",
      "Separation",
      type === "binary" ? ["r12"] : ["r12", "r13", "r23"],
      "AU",
      A.AU,
    ),
    graph(
      "speeds",
      "Star speeds",
      type === "binary" ? ["speedA", "speedB"] : ["speedA", "speedB", "speedC"],
      "km/s",
      1000,
    ),
    graph(
      "energy",
      "Energy",
      ["kinetic", "potential", "total"],
      "10³⁹ J",
      1e39,
    ),
  ],
  ended: (s, p) =>
    s.halted ||
    (s.bodies.some((b) => Math.hypot(b.x, b.y) > 100 * p.separation)
      ? "100-scale display limit"
      : null),
  featured: true,
});
export const ADVANCED_SIMULATIONS = {
  binary: {
    ...stellar("binary"),
    title: "Binary stars & the barycentre",
    short: "Binary stars",
    category: "Astrophysics",
    level: "A Level · Extension",
    color: "#f4bc79",
    formula: "r₁ / r₂ = m₂ / m₁",
    summary:
      "Two stars. One shared centre. Watch gravity choreograph their motion.",
    presets: [
      ["Circular", { ...A.ADVANCED_DEFAULTS.binary }],
      ["Elliptical", { ...A.ADVANCED_DEFAULTS.binary, speedFactor: 0.72 }],
      ["Escape", { ...A.ADVANCED_DEFAULTS.binary, speedFactor: 1.5 }],
    ],
    metrics: (s) => {
      const q = A.stellarSample(s);
      return [
        metric("Star separation", q.r12 / A.AU, "AU", "Between centres"),
        metric(
          "Relative speed",
          Math.hypot(
            s.bodies[1].vx - s.bodies[0].vx,
            s.bodies[1].vy - s.bodies[0].vy,
          ) / 1000,
          "km/s",
          "In the orbital plane",
        ),
        metric(
          "Numerical energy error",
          q.energyError,
          "%",
          "Normalised by initial |U|",
        ),
      ];
    },
    supplementary: (s, p) => [
      metric(
        "Star A orbit radius",
        Math.hypot(s.bodies[0].x, s.bodies[0].y) / A.AU,
        "AU",
      ),
      metric(
        "Star B orbit radius",
        Math.hypot(s.bodies[1].x, s.bodies[1].y) / A.AU,
        "AU",
      ),
      metric(
        "Circular reference period",
        (2 * Math.PI * A.stellarTime("binary", p)) / A.YEAR,
        "yr",
      ),
    ],
    caption:
      "Two freely moving point masses · barycentric inertial frame · 1× = 0.6 characteristic time per real second · stellar colours, surfaces and radii illustrative · adaptive Verlet; no gravitational softening",
    equation: "m₁r₁ + m₂r₂ = 0",
    insight:
      "Make star B twice as massive as A. Which star traces the smaller orbit?",
    narrative:
      "The cross marks the fixed centre of mass. The more massive star moves on the smaller orbit; both experience equal gravitational forces.",
  },
  threebody: {
    ...stellar("threebody"),
    title: "The three-body observatory",
    short: "Three-body stars",
    category: "Astrophysics",
    level: "A Level · Extension",
    color: "#c1a2ff",
    formula: "aᵢ = Σ GMⱼ rᵢⱼ / |rᵢⱼ|³",
    summary:
      "A figure-eight ballet, a rotating triangle, or a restless stellar trio.",
    presets: [
      ["Figure eight", { ...A.ADVANCED_DEFAULTS.threebody }],
      ["Triangle", { ...A.ADVANCED_DEFAULTS.threebody, layout: 1 }],
      [
        "Hierarchical",
        {
          ...A.ADVANCED_DEFAULTS.threebody,
          layout: 2,
          m2: 0.7 * A.SOLAR_MASS,
          m3: 0.4 * A.SOLAR_MASS,
        },
      ],
    ],
    metrics: (s) => {
      const q = A.stellarSample(s);
      return [
        metric(
          "Closest pair",
          q.minDistance / A.AU,
          "AU",
          "Across all three separations",
        ),
        metric(
          "System energy",
          q.total,
          "J",
          "Kinetic + all three pair potentials",
        ),
        metric(
          "Numerical energy error",
          q.energyError,
          "%",
          "Normalised by initial |U|",
        ),
      ];
    },
    supplementary: (s) =>
      s.bodies.map((b, i) =>
        metric(`Star ${"ABC"[i]} speed`, Math.hypot(b.vx, b.vy) / 1000, "km/s"),
      ),
    caption:
      "Planar Newtonian three-body integration · all masses attract each other · colours/radii illustrative, not stellar evolution · auto-fit linear distance scale · pauses before pairs approach 0.01 initial length scales",
    equation: "E = Σ ½mᵢvᵢ² − Σᵢ<ⱼ Gmᵢmⱼ/rᵢⱼ",
    insight:
      "Start with the equal-mass figure eight, then add a 1% velocity kick to star C. How long does the pattern remain recognisable?",
    narrative:
      "The figure eight uses Simó’s reference initial conditions. It is a special equal-mass solution, not the path of every triple system. Change a mass or add a kick to explore what breaks the choreography.",
  },
  doublependulum: {
    title: "Double pendulum & sensitive dependence",
    short: "Double pendulum",
    category: "Oscillations",
    level: "A Level · Extension",
    color: "#72e2ce",
    formula: "E = K + U",
    summary:
      "Follow a precision pendulum and a near-identical twin into nonlinear motion.",
    defaults: A.ADVANCED_DEFAULTS.doublependulum,
    limits: A.ADVANCED_LIMITS.doublependulum,
    create: A.createDouble,
    step: A.stepDouble,
    sample: A.doubleSample,
    h: 1 / 480,
    hFor: A.doubleStep,
    rate: 1,
    sampleEvery: 1 / 60,
    timeUnit: "s",
    timeFactor: 1,
    window: 30,
    featured: true,
    controls: [
      control(
        "l1",
        "Upper rod length",
        "m",
        0.5,
        2,
        0.05,
        "Massless rigid rod, pivoted without friction.",
      ),
      control(
        "l2",
        "Lower rod length",
        "m",
        0.5,
        2,
        0.05,
        "Angles of both rods are measured from downward vertical.",
      ),
      control(
        "m1",
        "Upper bob mass",
        "kg",
        0.5,
        3,
        0.1,
        "Mass ratio changes the coupled motion.",
      ),
      control(
        "m2",
        "Lower bob mass",
        "kg",
        0.5,
        3,
        0.1,
        "Both masses contribute to the energy.",
      ),
      control(
        "angle1",
        "Upper release angle",
        "°",
        -170,
        170,
        1,
        "Released from rest; positive angles point to the right.",
      ),
      control(
        "angle2",
        "Lower release angle",
        "°",
        -170,
        170,
        1,
        "Absolute angle, not the angle between the rods.",
      ),
      control(
        "delta",
        "Twin release difference",
        "°",
        0,
        1,
        0.001,
        "Only the twin’s lower initial angle changes.",
      ),
      control(
        "g",
        "Gravitational acceleration",
        "m/s²",
        1,
        15,
        0.01,
        "Uniform gravity; no damping or driving force.",
      ),
    ],
    presets: [
      ["Chaotic release", { ...A.ADVANCED_DEFAULTS.doublependulum }],
      [
        "Small swings",
        { ...A.ADVANCED_DEFAULTS.doublependulum, angle1: 10, angle2: 10 },
      ],
      [
        "Near inverted",
        {
          ...A.ADVANCED_DEFAULTS.doublependulum,
          angle1: 165,
          angle2: 165,
          delta: 0.001,
        },
      ],
    ],
    metrics: (s, p) => {
      const q = A.doubleSample(s, p);
      return [
        metric("Lower bob speed", q.speed, "m/s", "Main pendulum"),
        metric(
          "Twin tip separation",
          q.divergence,
          "m",
          "Actual distance, not a Lyapunov exponent",
        ),
        metric(
          "Numerical energy error",
          q.energyError,
          "%",
          "Main run; gravitational energy scale",
        ),
      ];
    },
    supplementary: (s, p) => [
      metric("Upper angle", s.theta1 / A.DEG, "°"),
      metric("Lower angle", s.theta2 / A.DEG, "°"),
      metric("Initial twin difference", p.delta, "°"),
    ],
    graphs: [
      graph("angles", "Rod angles", ["theta1", "theta2"], "rad"),
      graph("divergence", "Twin separation", ["divergence"], "m"),
      {
        ...graph("phase", "Phase portrait", ["omega2"], "rad/s"),
        phaseX: "theta2",
      },
      graph("energy", "Energy", ["kinetic", "potential", "total"], "J"),
    ],
    trailPoint: (s, p) => {
      const q = A.doublePosition(s, p),
        t = A.doublePosition(s.twin, p);
      return { x: q.x, y: q.y, tx: t.x, ty: t.y };
    },
    caption:
      "Two point masses on massless rigid rods · frictionless fixed pivot · planar motion shown in 3D · RK4, at most 1/480 s with smaller steps for faster settings · violet twin differs only in lower release angle; visual depth offset is illustrative",
    equation:
      "(m₁ + m₂)L₁α₁ + m₂L₂ cos Δ α₂ = −(m₁ + m₂)g sin θ₁ − m₂L₂ω₂² sin Δ",
    insight:
      "Set the twin difference to 0°: the two calculated trajectories should coincide. Restore 0.01° and compare the large-angle release.",
    narrative:
      "Cyan and gold show the main pendulum. Violet is a separate integration with a tiny initial change. Both obey exactly the same equations. Early agreement and later separation make sensitive dependence visible.",
  },
};
