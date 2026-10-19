/** Additional pure SI models. Analytic solutions are used where available;
 * nonlinear motion uses fixed-step RK4, independent of the display camera. */
import { validate } from "./physics.js";
export const DEG = Math.PI / 180;
export const K_E = 8.9875517923e9;
export const C_LIGHT = 299792458;

export const LIMITS = {
  pendulum: {
    length: [0.3, 3],
    angle: [-120, 120],
    g: [1, 20],
    damping: [0, 1],
    mass: [0.2, 5],
  },
  projectile: {
    speed: [5, 60],
    angle: [5, 85],
    height: [0, 20],
    g: [1, 20],
    drag: [0, 0.08],
  },
  collisions: {
    m1: [0.2, 5],
    m2: [0.2, 5],
    u1: [-5, 5],
    u2: [-5, 5],
    restitution: [0, 1],
  },
  waves: {
    amplitude: [0.05, 0.6],
    wavelength: [0.5, 4],
    speed: [0.2, 4],
    reflection: [0, 1],
    probe: [0, 8],
  },
  interference: {
    wavelength: [400e-9, 700e-9],
    separation: [0.15e-3, 0.8e-3],
    screenDistance: [0.5, 4],
    slitWidth: [0.01e-3, 0.1e-3],
  },
  refraction: {
    angle: [0, 85],
    n1: [1, 2.4],
    n2: [1, 2.4],
    wavelength: [400e-9, 700e-9],
  },
  circuits: {
    voltage: [1, 24],
    resistance: [100, 10000],
    capacitance: [100e-6, 2000e-6],
    discharge: [0, 1],
  },
  fields: {
    q1: [-5e-6, 5e-6],
    q2: [-5e-6, 5e-6],
    separation: [1, 4],
    probeX: [-4, 4],
    probeY: [-3, 3],
  },
};
export const DEFAULTS = {
  pendulum: { length: 1.5, angle: 35, g: 9.81, damping: 0, mass: 1 },
  projectile: { speed: 25, angle: 45, height: 0, g: 9.81, drag: 0 },
  collisions: { m1: 1, m2: 1, u1: 2, u2: 0, restitution: 1 },
  waves: { amplitude: 0.25, wavelength: 2, speed: 2, reflection: 1, probe: 1 },
  interference: {
    wavelength: 550e-9,
    separation: 0.3e-3,
    screenDistance: 2,
    slitWidth: 0.04e-3,
  },
  refraction: { angle: 40, n1: 1, n2: 1.5, wavelength: 550e-9 },
  circuits: {
    voltage: 12,
    resistance: 1000,
    capacitance: 1000e-6,
    discharge: 0,
  },
  fields: { q1: 2e-6, q2: -2e-6, separation: 2, probeX: 0, probeY: 1 },
};

export function createExtra(type, params = DEFAULTS[type]) {
  const p = validate(params, LIMITS[type]);
  if (type === "circuits" && ![0, 1].includes(p.discharge))
    throw new RangeError(
      "Switch mode must be charging (0) or discharging (1).",
    );
  let state = { t: 0 };
  if (type === "pendulum") state = { ...state, theta: p.angle * DEG, omega: 0 };
  if (type === "projectile")
    state = {
      ...state,
      x: 0,
      y: p.height,
      vx: p.speed * Math.cos(p.angle * DEG),
      vy: p.speed * Math.sin(p.angle * DEG),
      landed: false,
    };
  if (type === "collisions")
    state = { ...state, x1: -2, x2: 2, v1: p.u1, v2: p.u2, hit: false };
  return { params: p, state };
}
function rk4(values, h, derivative) {
  const a = derivative(values),
    b = derivative(values.map((v, i) => v + (h * a[i]) / 2)),
    c = derivative(values.map((v, i) => v + (h * b[i]) / 2)),
    d = derivative(values.map((v, i) => v + h * c[i]));
  return values.map(
    (v, i) => v + (h * (a[i] + 2 * b[i] + 2 * c[i] + d[i])) / 6,
  );
}
export function pendulumEnergy(s, p) {
  const kinetic = 0.5 * p.mass * (p.length * s.omega) ** 2,
    potential = p.mass * p.g * p.length * (1 - Math.cos(s.theta));
  return { kinetic, potential, total: kinetic + potential };
}
export function projectileReference(p) {
  const vy = p.speed * Math.sin(p.angle * DEG),
    vx = p.speed * Math.cos(p.angle * DEG);
  const flightTime = (vy + Math.sqrt(vy * vy + 2 * p.g * p.height)) / p.g;
  return {
    flightTime,
    range: vx * flightTime,
    maxHeight: p.height + (vy * vy) / (2 * p.g),
  };
}
export function collisionVelocities(m1, m2, u1, u2, e) {
  return {
    v1: (m1 * u1 + m2 * u2 - m2 * e * (u1 - u2)) / (m1 + m2),
    v2: (m1 * u1 + m2 * u2 + m1 * e * (u1 - u2)) / (m1 + m2),
  };
}
export function waveAt(x, t, p) {
  const k = (2 * Math.PI) / p.wavelength,
    omega = k * p.speed;
  const incident = p.amplitude * Math.sin(k * x - omega * t),
    reflected = p.reflection * p.amplitude * Math.sin(k * x + omega * t);
  return { incident, reflected, resultant: incident + reflected };
}
export function interferenceAt(y, p) {
  const sinTheta = y / Math.hypot(p.screenDistance, y);
  const beta = (Math.PI * p.slitWidth * sinTheta) / p.wavelength;
  const envelope = Math.abs(beta) < 1e-10 ? 1 : (Math.sin(beta) / beta) ** 2;
  const carrier =
    Math.cos((Math.PI * p.separation * sinTheta) / p.wavelength) ** 2;
  return { intensity: envelope * carrier, envelope };
}
export function refractionInfo(p, angle = p.angle) {
  const i = angle * DEG,
    ratio = (p.n1 * Math.sin(i)) / p.n2;
  const critical = p.n1 > p.n2 ? Math.asin(p.n2 / p.n1) / DEG : null;
  if (ratio > 1)
    return { refracted: null, critical, reflectance: 1, tir: true };
  const r = Math.asin(Math.min(1, ratio)),
    ci = Math.cos(i),
    cr = Math.cos(r);
  const rs = (p.n1 * ci - p.n2 * cr) / (p.n1 * ci + p.n2 * cr);
  const rp = (p.n2 * ci - p.n1 * cr) / (p.n2 * ci + p.n1 * cr);
  return {
    refracted: r / DEG,
    critical,
    reflectance: (rs * rs + rp * rp) / 2,
    tir: false,
  };
}
export function circuitAt(t, p) {
  const tau = p.resistance * p.capacitance,
    decay = Math.exp(-t / tau);
  const voltage = p.voltage * (p.discharge ? decay : 1 - decay);
  const current = (((p.discharge ? -1 : 1) * p.voltage) / p.resistance) * decay;
  return {
    voltage,
    current,
    charge: p.capacitance * voltage,
    energy: 0.5 * p.capacitance * voltage ** 2,
    tau,
  };
}
/** Ideal point charges: the small visual exclusion disks are not softened charges.
 * Return an explicit invalid probe instead of evaluating at the singularity. */
export function fieldAt(x, y, p) {
  let ex = 0,
    ey = 0,
    potential = 0;
  for (const [cx, q] of [
    [-p.separation / 2, p.q1],
    [p.separation / 2, p.q2],
  ]) {
    if (q === 0) continue;
    const dx = x - cx,
      r = Math.hypot(dx, y);
    if (r < 0.16)
      return {
        ex: null,
        ey: null,
        magnitude: null,
        potential: null,
        valid: false,
      };
    ex += (K_E * q * dx) / r ** 3;
    ey += (K_E * q * y) / r ** 3;
    potential += (K_E * q) / r;
  }
  return { ex, ey, magnitude: Math.hypot(ex, ey), potential, valid: true };
}
export function fieldLines(p) {
  const lines = [];
  for (const [cx, q] of [
    [-p.separation / 2, p.q1],
    [p.separation / 2, p.q2],
  ]) {
    if (q === 0) continue;
    for (let i = 0; i < 16; i++) {
      let x = cx + 0.18 * Math.cos((i * Math.PI) / 8),
        y = 0.18 * Math.sin((i * Math.PI) / 8);
      const points = [];
      const sign = q > 0 ? 1 : -1;
      for (let j = 0; j < 300; j++) {
        const f = fieldAt(x, y, p);
        if (
          !f.valid ||
          f.magnitude < 1e-6 ||
          Math.abs(x) > 6 ||
          Math.abs(y) > 4
        )
          break;
        points.push([x, y]);
        // Midpoint integration of the unit field direction (geometric streamlines).
        const h = 0.035 * sign,
          m = fieldAt(
            x + (h * f.ex) / f.magnitude / 2,
            y + (h * f.ey) / f.magnitude / 2,
            p,
          );
        if (!m.valid || m.magnitude < 1e-6) break;
        x += (h * m.ex) / m.magnitude;
        y += (h * m.ey) / m.magnitude;
      }
      lines.push({ points, sign });
    }
  }
  return lines;
}
export function stepExtra(type, s, p, h) {
  if (type === "pendulum") {
    const [theta, omega] = rk4([s.theta, s.omega], h, ([a, w]) => [
      w,
      (-p.g / p.length) * Math.sin(a) - p.damping * w,
    ]);
    return { theta, omega, t: s.t + h };
  }
  if (type === "projectile") {
    if (s.landed) return s;
    const [x, y, vx, vy] = rk4([s.x, s.y, s.vx, s.vy], h, ([x, y, vx, vy]) => {
      const speed = Math.hypot(vx, vy);
      return [vx, vy, -p.drag * speed * vx, -p.g - p.drag * speed * vy];
    });
    if (y < 0) {
      const f = s.y / (s.y - y);
      return {
        x: s.x + f * (x - s.x),
        y: 0,
        vx: s.vx + f * (vx - s.vx),
        vy: s.vy + f * (vy - s.vy),
        t: s.t + f * h,
        landed: true,
      };
    }
    return { x, y, vx, vy, t: s.t + h, landed: false };
  }
  if (type === "collisions") {
    const closing = s.v1 - s.v2,
      gap = s.x2 - s.x1 - 0.8,
      hitTime = closing > 0 ? Math.max(0, gap) / closing : Infinity;
    if (!s.hit && hitTime <= h) {
      const v = collisionVelocities(p.m1, p.m2, s.v1, s.v2, p.restitution);
      return {
        x1: s.x1 + s.v1 * hitTime + v.v1 * (h - hitTime),
        x2: s.x2 + s.v2 * hitTime + v.v2 * (h - hitTime),
        ...v,
        hit: true,
        t: s.t + h,
      };
    }
    return { ...s, x1: s.x1 + s.v1 * h, x2: s.x2 + s.v2 * h, t: s.t + h };
  }
  return { t: s.t + h };
}
export function sampleExtra(type, s, p) {
  if (type === "pendulum")
    return {
      t: s.t,
      theta: s.theta,
      omega: s.omega,
      x: p.length * Math.sin(s.theta),
      y: -p.length * Math.cos(s.theta),
      ...pendulumEnergy(s, p),
    };
  if (type === "projectile")
    return {
      ...s,
      speed: Math.hypot(s.vx, s.vy),
      kinetic: 0.5 * (s.vx * s.vx + s.vy * s.vy),
      potential: p.g * s.y,
      total: 0.5 * (s.vx * s.vx + s.vy * s.vy) + p.g * s.y,
    };
  if (type === "collisions")
    return {
      ...s,
      momentum: p.m1 * s.v1 + p.m2 * s.v2,
      kinetic: 0.5 * p.m1 * s.v1 ** 2 + 0.5 * p.m2 * s.v2 ** 2,
    };
  if (type === "waves") return { t: s.t, ...waveAt(p.probe, s.t, p) };
  if (type === "circuits") return { t: s.t, ...circuitAt(s.t, p) };
  if (type === "refraction") return { t: s.t, ...refractionInfo(p) };
  if (type === "fields") return { t: s.t, ...fieldAt(p.probeX, p.probeY, p) };
  return { t: s.t, spacing: (p.wavelength * p.screenDistance) / p.separation };
}
