/** Additional practical models: analytic where possible, with an energy-accounted
 * RK4 thermal lamp model. No rendering or experimental measurements live here. */
export const PRACTICAL_RANGES = {
  hydraulics: {
    inputArea: [5e-4, 1e-4, 2e-3],
    outputArea: [5e-3, 1e-3, 0.02],
    force: [100, 10, 500],
    stroke: [0.12, 0.02, 0.25],
  },
  hooke: {
    k1: [50, 10, 200],
    k2: [80, 10, 200],
    load: [10, 1, 30],
    mode: [0, 0, 2],
  },
  sensors: {
    voltage: [6, 1, 12],
    fixed: [10000, 1000, 100000],
    reference: [10000, 1000, 100000],
    temperature: [25, 0, 80],
    lux: [100, 1, 1000],
    beta: [3950, 3000, 4500],
    threshold: [3, 0.5, 10],
    mode: [0, 0, 1],
    orientation: [0, 0, 1],
  },
  radiation: {
    alphaEnergy: [5e6, 1e6, 8e6],
    betaEnergy: [3e5, 1e4, 1e6],
    gammaEnergy: [5e5, 1e5, 2e6],
    field: [0.1, -0.5, 0.5],
  },
  rectifier: {
    peak: [10, 1, 24],
    frequency: [2, 0.5, 50],
    resistance: [100, 10, 1000],
    mode: [0, 0, 1],
  },
  filament: {
    voltage: [9, 0, 12],
    coldResistance: [1.5, 0.5, 5],
    capacity: [0.01, 0.002, 0.05],
    area: [3e-5, 1e-5, 1e-4],
  },
  cooling: {
    mass: [0.2, 0.1, 2],
    specific: [4180, 400, 5000],
    conductance: [2, 0.2, 10],
    initial: [90, 40, 150],
    ambient: [20, 0, 30],
  },
  resonance: {
    length: [0.8, 0.3, 2],
    speed: [343, 300, 380],
    count: [1, 1, 5],
    amplitude: [0.004, 0.001, 0.01],
    probe: [0.5, 0, 1],
    mode: [0, 0, 1],
  },
  photoelectric: {
    frequency: [8e14, 3e14, 1.5e15],
    work: [2.2, 1.5, 5.5],
    power: [1e-6, 1e-8, 1e-5],
    efficiency: [0.1, 0.01, 1],
  },
  bragg: {
    voltage: [5000, 500, 20000],
    spacing: [2.15e-10, 5e-11, 5e-10],
    order: [1, 1, 5],
  },
  polarisation: {
    intensity: [100, 1, 1000],
    angle: [45, 0, 180],
    thirdAngle: [90, 0, 180],
    mode: [0, 0, 1],
  },
  selector: {
    electricField: [10000, 1000, 20000],
    field: [0.05, 0.01, 0.1],
    speed: [200000, 20000, 2000000],
    length: [0.2, 0.05, 0.5],
  },
  driven: {
    mass: [1, 0.2, 3],
    k: [40, 5, 150],
    damping: [1, 0.3, 8],
    force: [0.2, 0.05, 1],
    drive: [1, 0.1, 3.1],
  },
  gasprocess: {
    amount: [1, 0.1, 2],
    initial: [300, 200, 500],
    volume: [0.024, 0.005, 0.05],
    ratio: [2, 0.5, 3],
    mode: [0, 0, 2],
  },
  blackbody: {
    temperature: [5800, 500, 10000],
    area: [1, 0.01, 10],
    emissivity: [1, 0.1, 1],
  },
  materials: {
    young: [200e9, 50e9, 300e9],
    area: [1e-6, 1e-6, 5e-6],
    length: [1, 0.2, 3],
    force: [80, 10, 100],
  },
};
export const PRACTICAL_IDS = Object.keys(PRACTICAL_RANGES);
export const LAMP_AMBIENT = 293.15,
  LAMP_ALPHA = 0.0045,
  LAMP_EMISSIVITY = 0.35,
  SIGMA = 5.670374419e-8;
const E_CHARGE = 1.602176634e-19,
  C = 299792458;
export const PLANCK = 6.62607015e-34,
  ELECTRON_MASS = 9.1093837139e-31,
  PROTON_MASS = 1.67262192595e-27;
export function planckSpectrum(wavelength, temperature) {
  const x = (PLANCK * C) / (wavelength * 1.380649e-23 * temperature);
  return x > 700 ? 0 : (2 * PLANCK * C * C) / (wavelength ** 5 * Math.expm1(x));
}
export function selectorPosition(p, t) {
  const omega = (E_CHARGE * p.field) / PROTON_MASS,
    drift = p.electricField / p.field,
    diff = p.speed - drift,
    a = omega * t;
  return {
    x: drift * t + (diff * Math.sin(a)) / omega,
    y: (2 * diff * Math.sin(a / 2) ** 2) / omega,
    vx: drift + diff * Math.cos(a),
    vy: diff * Math.sin(a),
  };
}
export function selectorPath(p, t) {
  return Array.from({ length: 251 }, (_, i) =>
    selectorPosition(p, (t * i) / 250),
  );
}
export function createPractical(id) {
  return id === "filament"
    ? { t: 0, temperature: LAMP_AMBIENT, input: 0, loss: 0 }
    : { t: 0 };
}
export function lampRates(s, p) {
  const resistance =
    p.coldResistance * (1 + LAMP_ALPHA * (s.temperature - LAMP_AMBIENT));
  const power = p.voltage ** 2 / resistance;
  const loss =
    LAMP_EMISSIVITY *
      SIGMA *
      p.area *
      (s.temperature ** 4 - LAMP_AMBIENT ** 4) +
    15 * p.area * (s.temperature - LAMP_AMBIENT);
  return { temperature: (power - loss) / p.capacity, input: power, loss };
}
/** Integrate T and both energy integrals with the same RK4 stages. Internal
 * step <= 1/4000 s resolves the fastest supported thermal transient. */
export function stepPractical(id, s, p, h) {
  if (id !== "filament") return { ...s, t: s.t + h };
  const count = Math.ceil(h * 4000),
    dt = h / count,
    keys = ["temperature", "input", "loss"];
  let state = { ...s };
  const shift = (base, rate, step) =>
    Object.fromEntries(keys.map((k) => [k, base[k] + rate[k] * step]));
  for (let i = 0; i < count; i++) {
    const a = lampRates(state, p),
      b = lampRates(shift(state, a, dt / 2), p),
      c = lampRates(shift(state, b, dt / 2), p),
      d = lampRates(shift(state, c, dt), p);
    for (const key of keys)
      state[key] += (dt * (a[key] + 2 * b[key] + 2 * c[key] + d[key])) / 6;
  }
  state.t = s.t + h;
  return state;
}
/** Relativistic momentum from kinetic energy. This keeps beta rays physically
 * below c while using the same magnetic rigidity r = p/|qB| as alpha rays. */
export function particleReference(energyEV, mass, charge, field) {
  const kinetic = energyEV * E_CHARGE,
    rest = mass * C * C;
  const momentum = Math.sqrt(kinetic * (kinetic + 2 * rest)) / C;
  const speed = (momentum * C * C) / (kinetic + rest);
  const omega = (-charge * field * speed) / momentum;
  return {
    kinetic,
    momentum,
    speed,
    omega,
    radius: field === 0 ? null : momentum / Math.abs(charge * field),
  };
}
export function particlePosition(ref, t) {
  const angle = ref.omega * t;
  if (ref.omega === 0) return { x: ref.speed * t, y: 0 };
  // Stable small-angle forms avoid cancellation at a weak field or early time.
  const sinc =
    Math.abs(angle) < 1e-5 ? 1 - (angle * angle) / 6 : Math.sin(angle) / angle;
  const halfSinc =
    Math.abs(angle) < 1e-5
      ? 1 - (angle * angle) / 24
      : Math.sin(angle / 2) / (angle / 2);
  return {
    x: ref.speed * t * sinc,
    y: 0.5 * ref.speed * ref.omega * t * t * halfSinc ** 2,
  };
}
export function radiationReferences(p) {
  return {
    alpha: particleReference(
      p.alphaEnergy,
      6.644657345e-27,
      2 * E_CHARGE,
      p.field,
    ),
    beta: particleReference(p.betaEnergy, 9.1093837139e-31, -E_CHARGE, p.field),
  };
}
export function samplePractical(id, s, p) {
  const q = { t: s.t };
  switch (id) {
    case "hydraulics": {
      const inputTravel = p.stroke * Math.min(s.t / 4, 1),
        outputTravel = (inputTravel * p.inputArea) / p.outputArea,
        outputForce = (p.force * p.outputArea) / p.inputArea;
      return {
        ...q,
        pressure: p.force / p.inputArea,
        outputForce,
        inputTravel,
        outputTravel,
        inputWork: p.force * inputTravel,
        outputWork: outputForce * outputTravel,
        advantage: p.outputArea / p.inputArea,
      };
    }
    case "hooke": {
      const stiffness =
          p.mode === 0
            ? p.k1
            : p.mode === 1
              ? 1 / (1 / p.k1 + 1 / p.k2)
              : p.k1 + p.k2,
        force = p.load * 0.5 * (1 - Math.cos(Math.PI * Math.min(s.t / 4, 1))),
        extension = force / stiffness;
      return {
        ...q,
        stiffness,
        force,
        extension,
        x1: p.mode === 2 ? extension : force / p.k1,
        x2: p.mode === 0 ? 0 : p.mode === 2 ? extension : force / p.k2,
        energy: 0.5 * stiffness * extension ** 2,
        f1: p.mode === 2 ? p.k1 * extension : force,
        f2: p.mode === 0 ? 0 : p.mode === 2 ? p.k2 * extension : force,
      };
    }
    case "sensors": {
      const resistance =
          p.mode === 0
            ? p.reference * (p.lux / 100) ** -0.7
            : p.reference *
              Math.exp(p.beta * (1 / (p.temperature + 273.15) - 1 / 298.15)),
        current = p.voltage / (p.fixed + resistance),
        output =
          (p.voltage * (p.orientation === 0 ? resistance : p.fixed)) /
          (p.fixed + resistance);
      return {
        ...q,
        resistance,
        current,
        output,
        on: output >= p.threshold ? 1 : 0,
        power: p.voltage * current,
        sensorPower: current ** 2 * resistance,
      };
    }
    case "radiation": {
      const r = radiationReferences(p),
        a = particlePosition(r.alpha, s.t),
        b = particlePosition(r.beta, s.t);
      return {
        ...q,
        alphaRadius: r.alpha.radius,
        betaRadius: r.beta.radius,
        betaSpeed: r.beta.speed,
        alphaSpeed: r.alpha.speed,
        alphaX: a.x,
        alphaY: a.y,
        betaX: b.x,
        betaY: b.y,
        gammaX: C * s.t,
        gammaY: 0,
        gammaEnergy: p.gammaEnergy * E_CHARGE,
      };
    }
    case "rectifier": {
      const input = p.peak * Math.sin(2 * Math.PI * p.frequency * s.t),
        output = p.mode ? Math.abs(input) : Math.max(0, input),
        mean = (p.peak * (p.mode ? 2 : 1)) / Math.PI,
        rms = p.peak / (p.mode ? Math.SQRT2 : 2);
      return {
        ...q,
        input,
        output,
        current: output / p.resistance,
        mean,
        rms,
        power: rms ** 2 / p.resistance,
        rippleFrequency: p.frequency * (p.mode ? 2 : 1),
      };
    }
    case "filament": {
      const rates = lampRates(s, p),
        resistance =
          p.coldResistance * (1 + LAMP_ALPHA * (s.temperature - LAMP_AMBIENT)),
        current = p.voltage / resistance;
      return {
        ...q,
        temperature: s.temperature,
        celsius: s.temperature - 273.15,
        resistance,
        current,
        power: rates.input,
        lossPower: rates.loss,
        input: s.input,
        loss: s.loss,
        thermal: p.capacity * (s.temperature - LAMP_AMBIENT),
        balance: s.input - s.loss - p.capacity * (s.temperature - LAMP_AMBIENT),
      };
    }
    case "cooling": {
      const capacity = p.mass * p.specific,
        tau = capacity / p.conductance,
        temperature =
          p.ambient + (p.initial - p.ambient) * Math.exp(-s.t / tau),
        power = p.conductance * (temperature - p.ambient);
      return {
        ...q,
        temperature,
        power,
        tau,
        released: capacity * (p.initial - temperature),
        remaining: capacity * (temperature - p.ambient),
        capacity,
      };
    }
    case "resonance": {
      const harmonic = p.mode ? 2 * p.count - 1 : p.count,
        wavelength = ((p.mode ? 4 : 2) * p.length) / harmonic,
        frequency = p.speed / wavelength,
        k = (2 * Math.PI) / wavelength,
        phase = 2 * Math.PI * frequency * s.t,
        x = p.probe * p.length,
        shape = p.mode ? Math.sin(k * x) : Math.cos(k * x),
        pressureShape = p.mode ? -Math.cos(k * x) : Math.sin(k * x);
      return {
        ...q,
        frequency,
        wavelength,
        harmonic,
        fundamental: p.speed / ((p.mode ? 4 : 2) * p.length),
        displacement: p.amplitude * shape * Math.cos(phase),
        pressure: pressureShape * Math.cos(phase),
        phase,
        position: x,
      };
    }
    case "photoelectric": {
      const photon = PLANCK * p.frequency,
        threshold = (p.work * E_CHARGE) / PLANCK,
        emission = photon > p.work * E_CHARGE ? 1 : 0,
        kinetic = emission ? photon - p.work * E_CHARGE : 0,
        photons = p.power / photon;
      return {
        ...q,
        photon,
        photonEV: photon / E_CHARGE,
        threshold,
        emission,
        kinetic,
        kineticEV: kinetic / E_CHARGE,
        stopping: kinetic / E_CHARGE,
        photons,
        current: emission * photons * p.efficiency * E_CHARGE,
      };
    }
    case "bragg": {
      const ref = particleReference(p.voltage, ELECTRON_MASS, -E_CHARGE, 0),
        wavelength = PLANCK / ref.momentum,
        arg = (p.order * wavelength) / (2 * p.spacing);
      return {
        ...q,
        wavelength,
        angle: arg <= 1 ? (Math.asin(arg) * 180) / Math.PI : null,
        speed: ref.speed,
        momentum: ref.momentum,
        kinetic: p.voltage * E_CHARGE,
        permitted: arg <= 1 ? 1 : 0,
      };
    }
    case "polarisation": {
      const first = p.intensity / 2,
        second = first * Math.cos((p.angle * Math.PI) / 180) ** 2,
        output = p.mode
          ? second * Math.cos(((p.thirdAngle - p.angle) * Math.PI) / 180) ** 2
          : second;
      return {
        ...q,
        first,
        second,
        output,
        transmission: output / p.intensity,
      };
    }
    case "selector": {
      const pos = selectorPosition(p, s.t),
        selected = p.electricField / p.field;
      return {
        ...q,
        ...pos,
        selected,
        deflection: pos.y,
        electric: E_CHARGE * p.electricField,
        magnetic: E_CHARGE * p.field * Math.hypot(pos.vx, pos.vy),
        netY: E_CHARGE * (p.field * pos.vx - p.electricField),
        kinetic: 0.5 * PROTON_MASS * (pos.vx ** 2 + pos.vy ** 2),
      };
    }
    case "driven": {
      const w = 2 * Math.PI * p.drive,
        w0 = Math.sqrt(p.k / p.mass),
        amplitude = p.force / Math.hypot(p.k - p.mass * w * w, p.damping * w),
        lag = Math.atan2(p.damping * w, p.k - p.mass * w * w),
        phase = w * s.t - lag,
        displacement = amplitude * Math.cos(phase),
        velocity = -w * amplitude * Math.sin(phase);
      return {
        ...q,
        natural: w0 / (2 * Math.PI),
        amplitude,
        phaseLag: (lag * 180) / Math.PI,
        displacement,
        velocity,
        power: 0.5 * p.damping * w * w * amplitude ** 2,
        energy: 0.5 * p.mass * velocity ** 2 + 0.5 * p.k * displacement ** 2,
      };
    }
    case "gasprocess": {
      const progress = Math.min(s.t / 6, 1),
        r = 1 + (p.ratio - 1) * progress,
        volume = p.volume * r,
        initialPressure = (p.amount * 8.314462618 * p.initial) / p.volume,
        gamma = 5 / 3,
        temperature =
          p.mode === 0
            ? p.initial
            : p.mode === 1
              ? p.initial * r
              : p.initial * r ** (1 - gamma),
        pressure = (p.amount * 8.314462618 * temperature) / volume,
        internal = 1.5 * p.amount * 8.314462618 * (temperature - p.initial),
        work =
          p.mode === 0
            ? p.amount * 8.314462618 * p.initial * Math.log(r)
            : p.mode === 1
              ? initialPressure * (volume - p.volume)
              : -internal;
      return {
        ...q,
        volume,
        temperature,
        pressure,
        internal,
        work,
        heat: internal + work,
        initialPressure,
        ratio: r,
      };
    }
    case "blackbody": {
      const peak = 2.897771955e-3 / p.temperature,
        power = p.emissivity * SIGMA * p.area * p.temperature ** 4;
      return {
        ...q,
        peak,
        power,
        flux: power / p.area,
        peakRadiance: p.emissivity * planckSpectrum(peak, p.temperature),
      };
    }
    case "materials": {
      const force =
          p.force * 0.5 * (1 - Math.cos(Math.PI * Math.min(s.t / 4, 1))),
        stress = force / p.area,
        strain = stress / p.young,
        extension = strain * p.length;
      return {
        ...q,
        force,
        stress,
        strain,
        extension,
        energy: 0.5 * force * extension,
        stiffness: (p.young * p.area) / p.length,
      };
    }
    default:
      throw new RangeError("Unknown practical model.");
  }
}
