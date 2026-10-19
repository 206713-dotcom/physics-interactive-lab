/** Pure SI-unit models, shared by the browser and Node tests. No rendering code. */
export const G = 6.6743e-11; // m³ kg⁻¹ s⁻² (CODATA 2022)
export const EARTH_MASS = 5.9722e24;
export const SPRING_LIMITS = {
  mass: [0.2, 5],
  k: [1, 100],
  displacement: [-0.8, 0.8],
  damping: [0, 10],
};
export const ORBIT_LIMITS = {
  centralMass: [1e24, 2e25],
  bodyMass: [100, 1e23],
  distance: [8e6, 4e7],
  velocity: [0, 25000],
};
export const SPRING_DEFAULTS = {
  mass: 1,
  k: 20,
  displacement: 0.5,
  damping: 0,
};
export const ORBIT_DEFAULTS = {
  centralMass: EARTH_MASS,
  bodyMass: 1000,
  distance: 1.5e7,
  velocity: 5154.967,
};

export function validate(params, limits) {
  for (const [key, [min, max]] of Object.entries(limits)) {
    if (
      !Number.isFinite(params[key]) ||
      params[key] < min ||
      params[key] > max
    ) {
      throw new RangeError(
        `${key} must be a finite number from ${min} to ${max}.`,
      );
    }
  }
  return { ...params };
}

export function springInfo(p) {
  const omega = Math.sqrt(p.k / p.mass);
  const beta = p.damping / (2 * p.mass);
  const dampedOmega = Math.sqrt(Math.max(0, omega * omega - beta * beta));
  return {
    omega,
    frequency: omega / (2 * Math.PI),
    period: (2 * Math.PI) / omega,
    beta,
    zeta: beta / omega,
    dampedOmega,
    dampedPeriod: dampedOmega > 0 ? (2 * Math.PI) / dampedOmega : Infinity,
  };
}
export function springAcceleration(s, p) {
  return -(p.k * s.x + p.damping * s.v) / p.mass;
}
export function springEnergy(s, p) {
  const kinetic = 0.5 * p.mass * s.v ** 2,
    potential = 0.5 * p.k * s.x ** 2;
  return { kinetic, potential, total: kinetic + potential };
}
export function createSpring(params = SPRING_DEFAULTS) {
  const p = validate(params, SPRING_LIMITS);
  return { params: p, state: { x: p.displacement, v: 0, t: 0 } };
}
/** Fixed-step fourth-order Runge–Kutta; h ≤ 1/240 s in the application. */
export function stepSpring(s, p, h) {
  const a1 = springAcceleration(s, p),
    v1 = s.v;
  const v2 = s.v + (a1 * h) / 2,
    a2 = springAcceleration({ x: s.x + (v1 * h) / 2, v: v2 }, p);
  const v3 = s.v + (a2 * h) / 2,
    a3 = springAcceleration({ x: s.x + (v2 * h) / 2, v: v3 }, p);
  const v4 = s.v + a3 * h,
    a4 = springAcceleration({ x: s.x + v3 * h, v: v4 }, p);
  return {
    x: s.x + (h * (v1 + 2 * v2 + 2 * v3 + v4)) / 6,
    v: s.v + (h * (a1 + 2 * a2 + 2 * a3 + a4)) / 6,
    t: s.t + h,
  };
}

export function circularSpeed(p) {
  return Math.sqrt((G * (p.centralMass + p.bodyMass)) / p.distance);
}
export function escapeSpeed(p) {
  return Math.SQRT2 * circularSpeed(p);
}
/** A finite absorbing surface prevents the point-mass singularity. Constant Earth-like density. */
export function centralRadius(p) {
  return 6.371e6 * Math.cbrt(p.centralMass / EARTH_MASS);
}
export function gravityForce(M, m, r) {
  if (![M, m, r].every(Number.isFinite) || M <= 0 || m <= 0 || r <= 0)
    throw new RangeError("Masses and separation must be positive and finite.");
  return (G * M * m) / (r * r);
}
export function orbitAcceleration(s, p) {
  const r = Math.hypot(s.x, s.y);
  if (!(r > 0)) throw new RangeError("Separation must be positive.");
  const scale = (-G * (p.centralMass + p.bodyMass)) / r ** 3;
  return { x: scale * s.x, y: scale * s.y };
}
export function orbitEnergy(s, p) {
  const reducedMass =
    p.centralMass * (p.bodyMass / (p.centralMass + p.bodyMass));
  const kinetic = 0.5 * reducedMass * (s.vx ** 2 + s.vy ** 2);
  const potential = (-G * p.centralMass * p.bodyMass) / Math.hypot(s.x, s.y);
  return { kinetic, potential, total: kinetic + potential };
}
export function orbitInfo(s, p) {
  const r = Math.hypot(s.x, s.y),
    speed = Math.hypot(s.vx, s.vy);
  const mu = G * (p.centralMass + p.bodyMass),
    specificEnergy = 0.5 * speed ** 2 - mu / r;
  const angularMomentum = s.x * s.vy - s.y * s.vx;
  const eccentricity = Math.sqrt(
    Math.max(0, 1 + (2 * specificEnergy * angularMomentum ** 2) / mu ** 2),
  );
  return {
    r,
    speed,
    eccentricity,
    specificEnergy,
    angularMomentum,
    kind:
      Math.abs(specificEnergy / (mu / r)) < 1e-7
        ? "Parabolic escape"
        : specificEnergy > 0
          ? "Hyperbolic escape"
          : eccentricity < 0.002
            ? "Circular orbit"
            : "Elliptical orbit",
  };
}
export function createOrbit(params = ORBIT_DEFAULTS) {
  const p = validate(params, ORBIT_LIMITS);
  if (p.distance <= centralRadius(p))
    throw new RangeError("Initial distance must be outside the central body.");
  return {
    params: p,
    state: {
      x: p.distance,
      y: 0,
      vx: 0,
      vy: p.velocity,
      t: 0,
      collided: false,
    },
  };
}
/** Velocity Verlet in relative coordinates; both masses contribute to μ.
 * Resolve an absorbing-surface hit on the drift segment, then stop before singular acceleration. */
export function stepOrbit(s, p, h) {
  if (s.collided) return s;
  const a = orbitAcceleration(s, p);
  const next = {
    x: s.x + s.vx * h + 0.5 * a.x * h * h,
    y: s.y + s.vy * h + 0.5 * a.y * h * h,
    t: s.t + h,
    collided: false,
  };
  const dx = next.x - s.x,
    dy = next.y - s.y,
    radius = centralRadius(p);
  const A = dx * dx + dy * dy,
    B = 2 * (s.x * dx + s.y * dy),
    C = s.x ** 2 + s.y ** 2 - radius ** 2;
  const discriminant = B * B - 4 * A * C;
  const fraction =
    A > 0 && discriminant >= 0
      ? (-B - Math.sqrt(discriminant)) / (2 * A)
      : Infinity;
  if (fraction >= 0 && fraction <= 1) {
    return {
      x: s.x + fraction * dx,
      y: s.y + fraction * dy,
      vx: s.vx + fraction * h * a.x,
      vy: s.vy + fraction * h * a.y,
      t: s.t + fraction * h,
      collided: true,
    };
  }
  const b = orbitAcceleration(next, p);
  return {
    ...next,
    vx: s.vx + 0.5 * (a.x + b.x) * h,
    vy: s.vy + 0.5 * (a.y + b.y) * h,
  };
}
