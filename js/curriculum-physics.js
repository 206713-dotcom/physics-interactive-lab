/** Pure IGCSE models. SI calculations are independent of the Canvas presentation.
 * Analytic models use elapsed simulated time; only radioactive decay is stochastic.
 * Illustrative particle trajectories and stellar storyboards are labelled as such. */
import {
  PRACTICAL_RANGES,
  PRACTICAL_IDS,
  createPractical,
  stepPractical,
  samplePractical,
  particlePosition,
} from "./practical-physics.js";
import {
  createBuoyancy,
  stepBuoyancy,
  buoyancySample,
} from "./buoyancy-physics.js";
export const C = 299792458,
  R = 8.314462618,
  K_B = 1.380649e-23;
export const AU = 149597870700,
  DAY = 86400,
  YEAR = 365.25 * DAY;
export const SIGMA = 5.670374419e-8,
  G = 6.6743e-11,
  SUN = 1.98847e30;
export const DEG = Math.PI / 180;
/** Preserve exact cardinal directions instead of presenting floating-point
 * sin(π) residue as a real perpendicular force. Other angles keep full precision. */
export function vectorComponents(p) {
  const bx = p.b * (p.angle === 90 ? 0 : Math.cos(p.angle * DEG)),
    by = p.b * ([0, 180].includes(p.angle) ? 0 : Math.sin(p.angle * DEG));
  return { bx, by, x: p.a + bx, y: by };
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// Each parameter is [default, minimum, maximum]. Integer/select parameters are validated too.
export const RANGES = {
  ...PRACTICAL_RANGES,
  measurement: {
    length: [0.427, 0.05, 2],
    count: [10, 1, 20],
    resolution: [0.001, 0.0001, 0.01],
    period: [1.4, 0.4, 4],
    reaction: [0.2, 0.05, 0.5],
  },
  motion: {
    mass: [2, 0.2, 10],
    force: [6, -30, 30],
    initial: [0, -10, 20],
    drag: [0.5, 0, 5],
    mode: [0, 0, 1],
    g: [9.81, 1, 15],
  },
  vectors: { a: [8, 0, 20], b: [6, 0, 20], angle: [90, 0, 180] },
  moments: {
    m1: [3, 0.2, 10],
    m2: [2, 0.2, 10],
    d1: [0.8, 0.1, 1.5],
    d2: [1.2, 0.1, 1.5],
    tilt: [10, 0, 60],
    height: [1, 0.3, 2],
    width: [0.8, 0.3, 1.5],
  },
  buoyancy: {
    density: [600, 100, 15000],
    fluid: [1000, 500, 14000],
    volume: [0.001, 0.0002, 0.005],
    depth: [1, 0, 5],
  },
  energy: {
    mass: [5, 0.2, 20],
    height: [4, 0.5, 15],
    power: [100, 10, 1000],
    efficiency: [0.75, 0.1, 1],
    resource: [0, 0, 5],
  },
  gases: {
    temperature: [300, 150, 600],
    volume: [0.024, 0.005, 0.05],
    amount: [1, 0.1, 2],
    state: [2, 0, 2],
  },
  expansion: {
    length: [1, 0.2, 3],
    temperature: [80, 0, 200],
    alpha: [0.000023, 0.000001, 0.00003],
  },
  calorimetry: {
    mass: [0.5, 0.1, 2],
    power: [1000, 100, 3000],
    initial: [-10, -30, 20],
    mode: [0, 0, 1],
    capacity: [4200, 400, 5000],
  },
  heat: {
    hot: [100, 30, 200],
    cold: [20, 0, 25],
    area: [0.02, 0.005, 0.1],
    thickness: [0.05, 0.01, 0.2],
    conductivity: [0.8, 0.02, 400],
    emissivity: [0.9, 0.05, 1],
    mode: [0, 0, 2],
  },
  wavefronts: {
    frequency: [2, 0.5, 5],
    speed: [2, 0.5, 5],
    gap: [1, 0.2, 4],
    mode: [0, 0, 1],
  },
  mirror: { angle: [35, 0, 80], distance: [2, 0.5, 5] },
  lenses: {
    focal: [0.15, 0.05, 0.4],
    object: [0.4, 0.06, 1.5],
    height: [0.04, 0.01, 0.1],
    kind: [1, -1, 1],
  },
  dispersion: {
    wavelength: [550e-9, 400e-9, 700e-9],
    angle: [40, 0, 75],
    a: [1.5046, 1.3, 1.8],
    b: [0.0042, 0.001, 0.01],
  },
  spectrum: { exponent: [-6.3, -12, 4], amplitude: [1, 0.1, 2] },
  sound: {
    frequency: [440, 50, 2000],
    temperature: [20, 0, 40],
    distance: [30, 1, 100],
    amplitude: [0.7, 0.1, 1],
  },
  dc: {
    voltage: [12, 1, 24],
    r1: [100, 10, 1000],
    r2: [200, 10, 1000],
    length: [1, 0.2, 5],
    area: [1e-6, 2e-7, 5e-6],
    rho: [1.68e-8, 1e-8, 1e-6],
    mode: [0, 0, 3],
  },
  devices: {
    voltage: [6, -12, 12],
    resistance: [100, 10, 1000],
    threshold: [3, 1, 10],
    rating: [0.05, 0.01, 1],
    mode: [0, 0, 2],
  },
  magnetism: {
    current: [2, -5, 5],
    turns: [100, 10, 500],
    length: [0.2, 0.1, 0.5],
    mode: [0, 0, 1],
  },
  charged: {
    field: [0.002, -0.01, 0.01],
    speed: [1e6, 1e5, 1e7],
    charge: [-1, -1, 1],
    mass: [9.1093837139e-31, 9.1093837139e-31, 1.67262192595e-27],
  },
  induction: {
    field: [0.2, 0.02, 1],
    area: [0.02, 0.005, 0.1],
    turns: [100, 10, 300],
    frequency: [1, 0.2, 5],
    current: [2, 0.2, 5],
    mode: [0, 0, 1],
  },
  transformer: {
    vp: [230, 10, 250],
    np: [500, 50, 1000],
    ns: [100, 20, 1500],
    load: [20, 5, 200],
    resistance: [2, 0.1, 10],
  },
  atom: {
    protons: [6, 1, 92],
    neutrons: [6, 0, 146],
    charge: [0, -3, 3],
    decay: [0, 0, 3],
    impact: [3e-13, 1e-14, 1e-12],
    energy: [5e6, 1e6, 1e7],
  },
  radioactivity: {
    nuclei: [300, 50, 600],
    halfLife: [5, 1, 20],
    background: [2, 0, 20],
    thickness: [1, 0, 10],
    mu: [0.7, 0.1, 3],
    seed: [42, 1, 99999],
  },
  earthmoon: {
    day: [80, 0, 365],
    latitude: [30, -65, 65],
    tilt: [23.44, 0, 30],
    lunarDay: [7.38, 0, 29.53059],
  },
  solarsystem: { planet: [2, 0, 7], scale: [1, 0.5, 2] },
  stars: {
    mass: [1, 0.2, 30],
    stage: [1, 0, 4],
    temperature: [5800, 2500, 30000],
  },
  universe: {
    distance: [100, 1, 300],
    hubble: [2.2e-18, 1.5e-18, 3e-18],
    wavelength: [500e-9, 400e-9, 700e-9],
    scale: [2, 1, 10],
  },
};
export const CURRICULUM_IDS = Object.keys(RANGES);
export const DEFAULTS = Object.fromEntries(
  CURRICULUM_IDS.map((id) => [
    id,
    Object.fromEntries(Object.entries(RANGES[id]).map(([k, v]) => [k, v[0]])),
  ]),
);
const INTEGERS = new Set([
  "count",
  "mode",
  "state",
  "resource",
  "kind",
  "turns",
  "np",
  "ns",
  "protons",
  "neutrons",
  "charge",
  "decay",
  "nuclei",
  "seed",
  "planet",
  "stage",
  "orientation",
  "order",
]);
export function validate(id, p) {
  if (!RANGES[id]) throw new RangeError("Unknown IGCSE model.");
  for (const [key, [, min, max]] of Object.entries(RANGES[id])) {
    if (
      !Number.isFinite(p[key]) ||
      p[key] < min ||
      p[key] > max ||
      (INTEGERS.has(key) && !Number.isInteger(p[key]))
    )
      throw new RangeError(
        `${key} must be ${min} to ${max}${INTEGERS.has(key) ? " (whole numbers)" : ""}.`,
      );
  }
  if (id === "lenses" && ![-1, 1].includes(p.kind))
    throw new RangeError("Choose a converging or diverging lens.");
  if (id === "charged" && ![-1, 1].includes(p.charge))
    throw new RangeError("Choose a positive or negative elementary charge.");
  if (id === "atom" && p.protons - p.charge < 0)
    throw new RangeError("An ion cannot have a negative number of electrons.");
}
export function randomSequence(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function createCurriculum(id, p = { ...DEFAULTS[id] }) {
  validate(id, p);
  const params = { ...p },
    state = { t: 0 };
  if (PRACTICAL_IDS.includes(id)) return { params, state: createPractical(id) };
  if (id === "buoyancy") return { params, state: createBuoyancy(p) };
  if (id === "radioactivity") {
    const rng = randomSequence(p.seed);
    state.decayTimes = Array.from(
      { length: p.nuclei },
      () => (-Math.log(1 - rng()) * p.halfLife) / Math.LN2,
    );
  }
  return { params, state };
}
export function stepCurriculum(id, s, p, h) {
  if (!Number.isFinite(h) || h <= 0 || h > 60)
    throw new RangeError("Invalid time step.");
  if (PRACTICAL_IDS.includes(id)) return stepPractical(id, s, p, h);
  if (id === "buoyancy") return stepBuoyancy(s, p, h);
  return { ...s, t: s.t + h };
}
export const PLANETS = [
  ["Mercury", 0.387, 3.3011e23, 2439700, "Rocky"],
  ["Venus", 0.723, 4.8675e24, 6051800, "Rocky"],
  ["Earth", 1, 5.9722e24, 6371000, "Rocky"],
  ["Mars", 1.524, 6.4171e23, 3389500, "Rocky"],
  ["Jupiter", 5.203, 1.8982e27, 69911000, "Gas giant"],
  ["Saturn", 9.537, 5.6834e26, 58232000, "Gas giant"],
  ["Uranus", 19.191, 8.681e25, 25362000, "Ice giant"],
  ["Neptune", 30.069, 1.02413e26, 24622000, "Ice giant"],
];
export function heating(p, t) {
  const input = (p.power * t) / p.mass;
  if (p.mode === 1)
    return {
      temperature: p.initial + input / p.capacity,
      melt: 0,
      boil: 0,
      energy: p.power * t,
    };
  const initialIce = Math.max(0, -p.initial) * 2100;
  const initialWater = Math.max(0, p.initial) * 4200;
  let e = input - initialIce;
  if (p.initial > 0) e = input + 334000 + initialWater;
  let temperature,
    melt = 0,
    boil = 0;
  if (e < 0) temperature = e / 2100;
  else if (e < 334000) {
    temperature = 0;
    melt = e / 334000;
  } else if (e < 754000) {
    temperature = (e - 334000) / 4200;
    melt = 1;
  } else if (e < 3014000) {
    temperature = 100;
    melt = 1;
    boil = (e - 754000) / 2260000;
  } else {
    temperature = 100 + (e - 3014000) / 2000;
    melt = 1;
    boil = 1;
  }
  return { temperature, melt, boil, energy: p.power * t };
}
export function sampleCurriculum(id, s, p) {
  if (PRACTICAL_IDS.includes(id)) return samplePractical(id, s, p);
  const t = s.t,
    q = { t };
  switch (id) {
    case "measurement": {
      const elapsed = p.count * p.period;
      Object.assign(q, {
        measured: Math.round(p.length / p.resolution) * p.resolution,
        absolute: p.resolution / 2,
        percent: (100 * p.resolution) / 2 / p.length,
        elapsed,
        period: elapsed / p.count,
        uncertainty: (2 * p.reaction) / p.count,
      });
      break;
    }
    case "motion": {
      const force = p.mode ? p.mass * p.g : p.force,
        b = p.drag,
        u = p.initial,
        a0 = force / p.mass;
      const v = b
        ? force / b + (u - force / b) * Math.exp((-b * t) / p.mass)
        : u + a0 * t;
      const x = b
        ? (force / b) * t +
          (((u - force / b) * p.mass) / b) * -Math.expm1((-b * t) / p.mass)
        : u * t + 0.5 * a0 * t * t;
      Object.assign(q, {
        x,
        v,
        a: (force - b * v) / p.mass,
        net: force - b * v,
        weight: p.mass * p.g,
        momentum: p.mass * v,
        kinetic: 0.5 * p.mass * v * v,
      });
      break;
    }
    case "vectors": {
      const { x, y } = vectorComponents(p);
      Object.assign(q, {
        x,
        y,
        resultant: Math.hypot(x, y),
        direction: x === 0 && y === 0 ? null : Math.atan2(y, x) / DEG,
      });
      break;
    }
    case "moments":
      Object.assign(q, {
        left: p.m1 * 9.81 * p.d1,
        right: p.m2 * 9.81 * p.d2,
        net: 9.81 * (p.m1 * p.d1 - p.m2 * p.d2),
        critical: Math.atan(p.width / (2 * p.height)) / DEG,
        offset: p.height * Math.tan(p.tilt * DEG),
        tipping: p.height * Math.tan(p.tilt * DEG) > p.width / 2 ? 1 : 0,
      });
      break;
    case "buoyancy": {
      Object.assign(q, buoyancySample(s, p));
      break;
    }
    case "energy": {
      const usefulPower = p.power * p.efficiency,
        liftTime = (p.mass * 9.81 * p.height) / usefulPower,
        elapsed = Math.min(t, liftTime),
        y = Math.min(p.height, (usefulPower * t) / (p.mass * 9.81));
      Object.assign(q, {
        height: y,
        potential: p.mass * 9.81 * y,
        input: p.power * elapsed,
        waste: p.power * elapsed * (1 - p.efficiency),
        usefulPower,
        liftTime,
        efficiency: p.efficiency * 100,
      });
      break;
    }
    case "gases":
      Object.assign(q, {
        pressure:
          p.state === 2 ? (p.amount * R * p.temperature) / p.volume : null,
        pv: p.state === 2 ? p.amount * R * p.temperature : null,
        rms: p.state === 2 ? Math.sqrt((3 * R * p.temperature) / 0.028) : null,
        celsius: p.temperature - 273.15,
        temperature: p.temperature,
      });
      break;
    case "expansion":
      Object.assign(q, {
        extension: p.alpha * p.length * p.temperature,
        final: p.length * (1 + p.alpha * p.temperature),
        strain: p.alpha * p.temperature,
      });
      break;
    case "calorimetry":
      Object.assign(q, heating(p, t));
      break;
    case "heat": {
      const conduction =
          (p.conductivity * p.area * (p.hot - p.cold)) / p.thickness,
        radiation =
          p.emissivity *
          SIGMA *
          p.area *
          ((p.hot + 273.15) ** 4 - (p.cold + 273.15) ** 4),
        convection = 10 * p.area * (p.hot - p.cold);
      const power = [conduction, convection, radiation][p.mode];
      Object.assign(q, {
        conduction,
        radiation,
        convection,
        power,
        energy: power * t,
      });
      break;
    }
    case "wavefronts":
      Object.assign(q, {
        wavelength: p.speed / p.frequency,
        ratio: (p.gap * p.frequency) / p.speed,
        frequency: p.frequency,
        speed: p.speed,
        displacement: Math.sin(2 * Math.PI * p.frequency * t),
      });
      break;
    case "mirror":
      Object.assign(q, {
        incident: p.angle,
        reflected: p.angle,
        image: -p.distance,
        magnification: 1,
      });
      break;
    case "lenses": {
      const f = p.focal * p.kind,
        denom = p.object - f,
        v = Math.abs(denom) < 1e-10 ? null : (f * p.object) / denom,
        m = v === null ? null : -v / p.object;
      Object.assign(q, {
        image: v,
        magnification: m,
        imageHeight: m === null ? null : m * p.height,
        power: 1 / f,
      });
      break;
    }
    case "dispersion": {
      const n = p.a + p.b / (p.wavelength * 1e6) ** 2,
        r = Math.asin(Math.sin(p.angle * DEG) / n) / DEG;
      Object.assign(q, {
        index: n,
        refraction: r,
        speed: C / n,
        wavelength: p.wavelength / n,
      });
      break;
    }
    case "spectrum": {
      const wavelength = 10 ** p.exponent;
      Object.assign(q, {
        wavelength,
        frequency: C / wavelength,
        energy: (6.62607015e-34 * C) / wavelength,
      });
      break;
    }
    case "sound": {
      const speed = 331.3 * Math.sqrt((273.15 + p.temperature) / 273.15);
      Object.assign(q, {
        speed,
        wavelength: speed / p.frequency,
        echo: (2 * p.distance) / speed,
        pressure: p.amplitude * Math.sin(2 * Math.PI * p.frequency * t),
      });
      break;
    }
    case "dc": {
      const wire = (p.rho * p.length) / p.area,
        r1 = p.mode === 3 ? wire : p.r1,
        r2 = p.r2;
      const resistance = p.mode === 1 ? (r1 * r2) / (r1 + r2) : r1 + r2;
      const current = p.voltage / resistance,
        v1 = p.mode === 1 ? p.voltage : current * r1,
        v2 = p.mode === 1 ? p.voltage : current * r2;
      Object.assign(q, {
        resistance,
        current,
        i1: v1 / r1,
        i2: v2 / r2,
        v1,
        v2,
        power: p.voltage * current,
        energy: p.voltage * current * t,
        wire,
        charge: current * t,
      });
      break;
    }
    case "devices": {
      const demand = p.voltage / p.resistance,
        current =
          p.mode === 0
            ? Math.max(0, (p.voltage - 0.7) / p.resistance)
            : p.mode === 1
              ? p.voltage >= p.threshold
                ? demand
                : 0
              : Math.abs(demand) > p.rating
                ? 0
                : demand;
      Object.assign(q, {
        current,
        power: p.voltage * current,
        on:
          p.mode === 2
            ? Math.abs(demand) <= p.rating
              ? 1
              : 0
            : current > 0
              ? 1
              : 0,
        rated: p.rating,
      });
      break;
    }
    case "magnetism":
      Object.assign(q, {
        field:
          p.mode === 0
            ? (4e-7 * Math.PI * p.turns * p.current) / p.length
            : (4e-7 * Math.PI * p.current) / (2 * Math.PI * 0.05),
        current: p.current,
        turnDensity: p.turns / p.length,
      });
      break;
    case "charged": {
      const charge = p.charge * 1.602176634e-19,
        omega = (-charge * p.field) / p.mass,
        phase = omega * t,
        radius = omega === 0 ? null : p.speed / Math.abs(omega),
        // The half-angle/sinc form retains tiny curvature near B = 0.
        { x, y } = particlePosition({ speed: p.speed, omega }, t);
      Object.assign(q, {
        force: Math.abs(charge * p.speed * p.field),
        radius,
        frequency: Math.abs(omega) / (2 * Math.PI),
        kinetic: 0.5 * p.mass * p.speed * p.speed,
        x,
        y,
        phase,
      });
      break;
    }
    case "induction": {
      const omega = 2 * Math.PI * p.frequency,
        phase = omega * t,
        flux = p.field * p.area * Math.cos(phase),
        emf = p.turns * p.field * p.area * omega * Math.sin(phase),
        torque =
          p.turns * p.field * p.area * p.current * Math.abs(Math.sin(phase));
      Object.assign(q, {
        phase,
        flux,
        emf,
        peak: p.turns * p.field * p.area * omega,
        torque,
        frequency: p.frequency,
      });
      break;
    }
    case "transformer": {
      const vs = (p.vp * p.ns) / p.np,
        is = vs / p.load,
        ip = (vs * is) / p.vp;
      Object.assign(q, {
        vs,
        is,
        ip,
        input: p.vp * ip,
        output: vs * is,
        loss: ip * ip * p.resistance,
        ratio: p.ns / p.np,
      });
      break;
    }
    case "atom": {
      const a = p.protons + p.neutrons,
        valid =
          p.decay === 1
            ? p.neutrons >= 2 && p.protons >= 3
            : p.decay === 2
              ? p.neutrons >= 1
              : true,
        z = p.protons + (p.decay === 1 ? -2 : p.decay === 2 ? 1 : 0),
        daughterA = a - (p.decay === 1 ? 4 : 0),
        e = p.protons - p.charge;
      const joules = p.energy * 1.602176634e-19,
        k = 8.9875517923e9,
        theta =
          (2 *
            Math.atan(
              (k * 2 * p.protons * 1.602176634e-19 ** 2) /
                (2 * joules * p.impact),
            )) /
          DEG;
      Object.assign(q, {
        massNumber: a,
        electrons: e,
        daughterZ: valid ? z : null,
        daughterA: valid ? daughterA : null,
        angle: theta,
        valid: valid ? 1 : 0,
      });
      break;
    }
    case "radioactivity": {
      const remaining = s.decayTimes.filter((x) => x > t).length,
        expected = p.nuclei * 2 ** (-t / p.halfLife),
        lambda = Math.LN2 / p.halfLife;
      Object.assign(q, {
        remaining,
        expected,
        activity: lambda * expected,
        observedActivity: lambda * remaining,
        detector:
          lambda * remaining * Math.exp(-p.mu * p.thickness) + p.background,
        transmission: Math.exp(-p.mu * p.thickness),
        background: p.background,
      });
      break;
    }
    case "earthmoon": {
      const day = p.day + t / 5,
        longitude = (2 * Math.PI * day) / 365.25,
        declination =
          p.tilt * DEG * Math.sin((2 * Math.PI * (day - 80)) / 365.25),
        cosH = -Math.tan(p.latitude * DEG) * Math.tan(declination),
        daylight = (24 * Math.acos(clamp(cosH, -1, 1))) / Math.PI,
        phase = ((p.lunarDay + t / 5) / 29.53059) * 2 * Math.PI;
      Object.assign(q, {
        longitude,
        declination: declination / DEG,
        daylight,
        phase,
        illumination: (1 - Math.cos(phase)) / 2,
        orbitalSpeed: (2 * Math.PI * AU) / YEAR,
      });
      break;
    }
    case "solarsystem": {
      const planet = PLANETS[p.planet],
        radius = planet[1] * AU * p.scale,
        period = 2 * Math.PI * Math.sqrt(radius ** 3 / (G * SUN)),
        speed = Math.sqrt((G * SUN) / radius);
      Object.assign(q, {
        radius,
        period,
        speed,
        lightTime: radius / C,
        surfaceGravity: (G * planet[2]) / planet[3] ** 2,
        density: planet[2] / ((4 / 3) * Math.PI * planet[3] ** 3),
        phase: (2 * Math.PI * t * YEAR) / period,
      });
      break;
    }
    case "stars": {
      const luminosity = p.mass ** 3.5,
        lifetime = (1e10 * p.mass) / luminosity,
        peak = 0.002897771955 / p.temperature;
      Object.assign(q, {
        luminosity,
        lifetime,
        peak,
        fusionEnergy: 0.0287 * 1.6605390666e-27 * C * C,
        heavy: p.mass >= 8 ? 1 : 0,
      });
      break;
    }
    case "universe": {
      const metres = p.distance * 3.085677581491367e22,
        speed = p.hubble * metres,
        z = speed / C;
      Object.assign(q, {
        speed,
        redshift: z,
        observed: p.wavelength * (1 + z),
        age: 1 / p.hubble / YEAR,
        cmb: 2.7255 / p.scale,
        brightness: 1 / (p.distance * p.distance),
      });
      break;
    }
    default:
      throw new RangeError("Unknown model.");
  }
  return q;
}
