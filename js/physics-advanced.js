/** SI-unit nonlinear models. Rendering never advances these states.
 * Stars: unsoftened Newtonian gravity, adaptive substeps of velocity Verlet.
 * Pendulum: coupled massless rigid rods with fixed-step fourth-order RK. */
import { G, validate } from "./physics.js";
export const AU = 149597870700;
export const SOLAR_MASS = 1.98847e30; // adopted approximate solar mass, kg
export const YEAR = 31557600; // Julian year, s
export const DEG = Math.PI / 180;
export const ADVANCED_IDS = ["binary", "threebody", "doublependulum"];
export const ADVANCED_LIMITS = {
  binary: {
    m1: [0.2 * SOLAR_MASS, 3 * SOLAR_MASS],
    m2: [0.2 * SOLAR_MASS, 3 * SOLAR_MASS],
    separation: [0.5 * AU, 4 * AU],
    speedFactor: [0.55, 1.5],
  },
  threebody: {
    m1: [0.2 * SOLAR_MASS, 3 * SOLAR_MASS],
    m2: [0.2 * SOLAR_MASS, 3 * SOLAR_MASS],
    m3: [0.2 * SOLAR_MASS, 3 * SOLAR_MASS],
    separation: [0.5 * AU, 3 * AU],
    speedFactor: [0.7, 1.3],
    perturbation: [0, 0.05],
    layout: [0, 2],
  },
  doublependulum: {
    l1: [0.5, 2],
    l2: [0.5, 2],
    m1: [0.5, 3],
    m2: [0.5, 3],
    angle1: [-170, 170],
    angle2: [-170, 170],
    delta: [0, 1],
    g: [1, 15],
  },
};
export const ADVANCED_DEFAULTS = {
  binary: {
    m1: SOLAR_MASS,
    m2: 0.65 * SOLAR_MASS,
    separation: 1.5 * AU,
    speedFactor: 1,
  },
  threebody: {
    m1: SOLAR_MASS,
    m2: SOLAR_MASS,
    m3: SOLAR_MASS,
    separation: AU,
    speedFactor: 1,
    perturbation: 0,
    layout: 0,
  },
  doublependulum: {
    l1: 1.2,
    l2: 1.2,
    m1: 1,
    m2: 1,
    angle1: 120,
    angle2: -20,
    delta: 0.01,
    g: 9.81,
  },
};
export const stellarTime = (type, p) =>
  Math.sqrt(p.separation ** 3 / (G * (type === "binary" ? p.m1 + p.m2 : p.m1)));
export const stellarStep = (type, p) => 0.002 * stellarTime(type, p);
// Shorter rods, stronger gravity and a large lower/upper mass ratio require
// smaller RK4 steps. The renderer still consumes exactly the integrated state.
export const doubleStep = (p) =>
  1 /
  (480 *
    Math.max(
      1,
      Math.ceil(
        Math.sqrt((((p.m1 + p.m2) / p.m1) * p.g) / Math.min(p.l1, p.l2)) / 5,
      ),
    ));

/** Pairwise updates apply equal/opposite forces; no centre is held fixed. */
export function stellarAccelerations(bodies) {
  const a = bodies.map(() => ({ x: 0, y: 0 }));
  for (let i = 0; i < bodies.length; i++)
    for (let j = i + 1; j < bodies.length; j++) {
      const dx = bodies[j].x - bodies[i].x,
        dy = bodies[j].y - bodies[i].y,
        r = Math.hypot(dx, dy);
      if (!(r > 0)) throw new RangeError("Point masses cannot coincide.");
      const factor = G / (r * r * r);
      a[i].x += factor * bodies[j].mass * dx;
      a[i].y += factor * bodies[j].mass * dy;
      a[j].x -= factor * bodies[i].mass * dx;
      a[j].y -= factor * bodies[i].mass * dy;
    }
  return a;
}
export function stellarInvariants(s) {
  let kinetic = 0,
    potential = 0,
    px = 0,
    py = 0,
    angular = 0,
    mass = 0,
    cx = 0,
    cy = 0,
    minDistance = Infinity;
  for (let i = 0; i < s.bodies.length; i++) {
    const b = s.bodies[i];
    kinetic += 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy);
    px += b.mass * b.vx;
    py += b.mass * b.vy;
    angular += b.mass * (b.x * b.vy - b.y * b.vx);
    mass += b.mass;
    cx += b.mass * b.x;
    cy += b.mass * b.y;
    for (let j = i + 1; j < s.bodies.length; j++) {
      const other = s.bodies[j],
        r = Math.hypot(b.x - other.x, b.y - other.y);
      potential -= (G * b.mass * other.mass) / r;
      minDistance = Math.min(minDistance, r);
    }
  }
  return {
    kinetic,
    potential,
    total: kinetic + potential,
    px,
    py,
    angular,
    cx: cx / mass,
    cy: cy / mass,
    minDistance,
  };
}
function centre(bodies) {
  const q = stellarInvariants({ bodies }),
    mass = bodies.reduce((sum, b) => sum + b.mass, 0);
  return bodies.map((b) => ({
    ...b,
    x: b.x - q.cx,
    y: b.y - q.cy,
    vx: b.vx - q.px / mass,
    vy: b.vy - q.py / mass,
  }));
}
function star(mass, x, y, vx, vy) {
  return { mass, x, y, vx, vy };
}
export function createStellar(type, params = ADVANCED_DEFAULTS[type]) {
  if (!["binary", "threebody"].includes(type))
    throw new RangeError("Unknown stellar model.");
  const p = validate(params, ADVANCED_LIMITS[type]),
    d = p.separation,
    f = p.speedFactor;
  let bodies;
  if (type === "binary") {
    const total = p.m1 + p.m2,
      v = Math.sqrt((G * total) / d) * f;
    bodies = [
      star(p.m1, (-d * p.m2) / total, 0, 0, (-v * p.m2) / total),
      star(p.m2, (d * p.m1) / total, 0, 0, (v * p.m1) / total),
    ];
  } else {
    if (!Number.isInteger(p.layout))
      throw new RangeError("Choose a supported three-body layout.");
    if (p.layout === 0) {
      // C. Simó reference figure-eight, recorded by R. Montgomery (UCSC).
      // Convert G=m=1 to SI using d and sqrt(G*m1/d); recenter unequal masses.
      const v = Math.sqrt((G * p.m1) / d) * f;
      bodies = [
        star(
          p.m1,
          -0.97000436 * d,
          0.24308753 * d,
          -0.466203685 * v,
          -0.43236573 * v,
        ),
        star(
          p.m2,
          0.97000436 * d,
          -0.24308753 * d,
          -0.466203685 * v,
          -0.43236573 * v,
        ),
        star(p.m3, 0, 0, 0.93240737 * v, 0.86473146 * v),
      ];
    } else if (p.layout === 1) {
      const omega = Math.sqrt((G * (p.m1 + p.m2 + p.m3)) / d ** 3) * f;
      bodies = centre([
        star(p.m1, 0, d / Math.sqrt(3), 0, 0),
        star(p.m2, -d / 2, -d / (2 * Math.sqrt(3)), 0, 0),
        star(p.m3, d / 2, -d / (2 * Math.sqrt(3)), 0, 0),
      ]).map((b) => ({ ...b, vx: -omega * b.y, vy: omega * b.x }));
    } else {
      const inner = p.m1 + p.m2,
        total = inner + p.m3,
        outer = 5 * d;
      const vi = Math.sqrt((G * inner) / d) * f,
        vo = Math.sqrt((G * total) / outer) * f;
      bodies = [
        star(
          p.m1,
          (-d * p.m2) / inner,
          (-outer * p.m3) / total,
          (vo * p.m3) / total,
          (-vi * p.m2) / inner,
        ),
        star(
          p.m2,
          (d * p.m1) / inner,
          (-outer * p.m3) / total,
          (vo * p.m3) / total,
          (vi * p.m1) / inner,
        ),
        star(p.m3, 0, (outer * inner) / total, (-vo * inner) / total, 0),
      ];
    }
    bodies[2].vx += p.perturbation * Math.sqrt((G * p.m1) / d);
  }
  const state = { t: 0, bodies: centre(bodies), halted: null };
  const q = stellarInvariants(state);
  return {
    params: p,
    state: { ...state, energy0: q.total, energyScale: Math.abs(q.potential) },
  };
}
// Minimum separation along a straight drift, so a pair cannot jump across the
// numerical guard in one step. This is NOT a stellar radius or a merger model.
function driftApproach(before, after, i, j) {
  const x = before[i].x - before[j].x,
    y = before[i].y - before[j].y;
  const dx = after[i].x - after[j].x - x,
    dy = after[i].y - after[j].y - y;
  const f =
    dx * dx + dy * dy > 0
      ? Math.max(0, Math.min(1, -(x * dx + y * dy) / (dx * dx + dy * dy)))
      : 0;
  return Math.hypot(x + f * dx, y + f * dy);
}
export function stepStellar(s, p, h) {
  if (s.halted) return s;
  if (!Number.isFinite(h) || h <= 0)
    throw new RangeError("Use a positive finite time step.");
  let bodies = s.bodies,
    elapsed = 0,
    iterations = 0;
  const guard = 0.01 * p.separation;
  while (elapsed < h) {
    if (++iterations > 4096)
      return {
        ...s,
        bodies,
        t: s.t + elapsed,
        halted: "Substep budget reached",
      };
    let dt = h - elapsed;
    for (let i = 0; i < bodies.length; i++)
      for (let j = i + 1; j < bodies.length; j++) {
        const r = Math.hypot(
          bodies[i].x - bodies[j].x,
          bodies[i].y - bodies[j].y,
        );
        if (r <= guard)
          return {
            ...s,
            bodies,
            t: s.t + elapsed,
            halted: "Close-encounter guard",
          };
        dt = Math.min(
          dt,
          0.001 * Math.sqrt(r ** 3 / (G * (bodies[i].mass + bodies[j].mass))),
        );
      }
    const a = stellarAccelerations(bodies);
    let next = bodies.map((b, i) => ({
      ...b,
      x: b.x + b.vx * dt + 0.5 * a[i].x * dt * dt,
      y: b.y + b.vy * dt + 0.5 * a[i].y * dt * dt,
    }));
    for (let i = 0; i < bodies.length; i++)
      for (let j = i + 1; j < bodies.length; j++)
        if (driftApproach(bodies, next, i, j) <= guard)
          return {
            ...s,
            bodies,
            t: s.t + elapsed,
            halted: "Close-encounter guard",
          };
    const a2 = stellarAccelerations(next);
    next = next.map((b, i) => ({
      ...b,
      vx: b.vx + 0.5 * (a[i].x + a2[i].x) * dt,
      vy: b.vy + 0.5 * (a[i].y + a2[i].y) * dt,
    }));
    bodies = next;
    elapsed += dt;
    if (h - elapsed <= h * 1e-13) elapsed = h;
  }
  return { ...s, bodies, t: s.t + h };
}
export function stellarSample(s) {
  const q = stellarInvariants(s),
    b = s.bodies;
  return {
    t: s.t,
    ...q,
    r12: Math.hypot(b[0].x - b[1].x, b[0].y - b[1].y),
    speedA: Math.hypot(b[0].vx, b[0].vy),
    speedB: Math.hypot(b[1].vx, b[1].vy),
    ...(b.length === 3
      ? {
          r13: Math.hypot(b[0].x - b[2].x, b[0].y - b[2].y),
          r23: Math.hypot(b[1].x - b[2].x, b[1].y - b[2].y),
          speedC: Math.hypot(b[2].vx, b[2].vy),
        }
      : {}),
    energyError: (100 * (q.total - s.energy0)) / s.energyScale,
    ...Object.fromEntries(
      b.flatMap((body, i) => [
        [`x${i + 1}`, body.x],
        [`y${i + 1}`, body.y],
        [`vx${i + 1}`, body.vx],
        [`vy${i + 1}`, body.vy],
      ]),
    ),
  };
}
export function doubleAcceleration(s, p) {
  const delta = s.theta1 - s.theta2,
    cosine = Math.cos(delta),
    sine = Math.sin(delta);
  const A = (p.m1 + p.m2) * p.l1,
    B = p.m2 * p.l2 * cosine,
    C = p.l1 * cosine,
    D = p.l2;
  const r1 =
    -(p.m1 + p.m2) * p.g * Math.sin(s.theta1) -
    p.m2 * p.l2 * s.omega2 ** 2 * sine;
  const r2 = p.l1 * s.omega1 ** 2 * sine - p.g * Math.sin(s.theta2),
    det = A * D - B * C;
  return { alpha1: (r1 * D - B * r2) / det, alpha2: (A * r2 - C * r1) / det };
}
export function doublePosition(s, p) {
  const x1 = p.l1 * Math.sin(s.theta1),
    y1 = -p.l1 * Math.cos(s.theta1);
  return {
    x1,
    y1,
    x: x1 + p.l2 * Math.sin(s.theta2),
    y: y1 - p.l2 * Math.cos(s.theta2),
  };
}
export function doubleEnergy(s, p) {
  const kinetic =
    0.5 * (p.m1 + p.m2) * p.l1 ** 2 * s.omega1 ** 2 +
    0.5 * p.m2 * p.l2 ** 2 * s.omega2 ** 2 +
    p.m2 * p.l1 * p.l2 * s.omega1 * s.omega2 * Math.cos(s.theta1 - s.theta2);
  const potential =
    (p.m1 + p.m2) * p.g * p.l1 * (1 - Math.cos(s.theta1)) +
    p.m2 * p.g * p.l2 * (1 - Math.cos(s.theta2));
  return { kinetic, potential, total: kinetic + potential };
}
export function createDouble(params = ADVANCED_DEFAULTS.doublependulum) {
  const p = validate(params, ADVANCED_LIMITS.doublependulum);
  const state = {
    t: 0,
    theta1: p.angle1 * DEG,
    theta2: p.angle2 * DEG,
    omega1: 0,
    omega2: 0,
  };
  const twin = { ...state, theta2: state.theta2 + p.delta * DEG };
  return {
    params: p,
    state: {
      ...state,
      twin,
      energy0: doubleEnergy(state, p).total,
      energyScale: (p.m1 + p.m2) * p.g * p.l1 + p.m2 * p.g * p.l2,
    },
  };
}
function rkDouble(s, p, h) {
  const values = [s.theta1, s.theta2, s.omega1, s.omega2];
  const derivative = ([theta1, theta2, omega1, omega2]) => {
    const a = doubleAcceleration({ theta1, theta2, omega1, omega2 }, p);
    return [omega1, omega2, a.alpha1, a.alpha2];
  };
  const a = derivative(values),
    b = derivative(values.map((v, i) => v + (h * a[i]) / 2)),
    c = derivative(values.map((v, i) => v + (h * b[i]) / 2)),
    d = derivative(values.map((v, i) => v + h * c[i]));
  const out = values.map(
    (v, i) => v + (h * (a[i] + 2 * b[i] + 2 * c[i] + d[i])) / 6,
  );
  return {
    t: s.t + h,
    theta1: out[0],
    theta2: out[1],
    omega1: out[2],
    omega2: out[3],
  };
}
export function stepDouble(s, p, h) {
  if (!Number.isFinite(h) || h <= 0)
    throw new RangeError("Use a positive finite time step.");
  return { ...s, ...rkDouble(s, p, h), twin: rkDouble(s.twin, p, h) };
}
export function doubleSample(s, p) {
  const q = doublePosition(s, p),
    twin = doublePosition(s.twin, p),
    e = doubleEnergy(s, p);
  const vx =
      p.l1 * s.omega1 * Math.cos(s.theta1) +
      p.l2 * s.omega2 * Math.cos(s.theta2),
    vy =
      p.l1 * s.omega1 * Math.sin(s.theta1) +
      p.l2 * s.omega2 * Math.sin(s.theta2);
  return {
    t: s.t,
    ...q,
    ...e,
    theta1: s.theta1,
    theta2: s.theta2,
    omega1: s.omega1,
    omega2: s.omega2,
    speed: Math.hypot(vx, vy),
    divergence: Math.hypot(q.x - twin.x, q.y - twin.y),
    energyError: (100 * (e.total - s.energy0)) / s.energyScale,
  };
}
