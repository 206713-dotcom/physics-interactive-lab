import test from "node:test";
import assert from "node:assert/strict";
import * as P from "../js/physics.js";

function near(actual, expected, tolerance, message) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message}: ${actual} vs ${expected} (tolerance ${tolerance})`,
  );
}
const circularParams = () => {
  const p = { ...P.ORBIT_DEFAULTS };
  p.velocity = P.circularSpeed(p);
  return p;
};

test("spring frequency, period and SI energies agree with known values", () => {
  const p = { mass: 0.5, k: 20, displacement: 0.5, damping: 0 },
    info = P.springInfo(p);
  near(info.period, 0.99345882658, 1e-10, "T in seconds");
  near(info.frequency * info.period, 1, 1e-14, "fT");
  near(P.springEnergy({ x: 0.5, v: 0 }, p).total, 2.5, 1e-14, "joules");
  near(
    P.springAcceleration({ x: 0.5, v: 0 }, p),
    -20,
    1e-14,
    "restoring acceleration",
  );
});
test("RK4 follows the analytic undamped spring solution for 30 seconds", () => {
  const { params: p, state: initial } = P.createSpring();
  let s = initial,
    maxError = 0;
  for (let i = 0; i < 7200; i++) {
    s = P.stepSpring(s, p, 1 / 240);
    maxError = Math.max(
      maxError,
      Math.abs(s.x - p.displacement * Math.cos(Math.sqrt(p.k / p.mass) * s.t)),
    );
  }
  assert.ok(maxError < 1e-6, `max displacement error ${maxError} m`);
});
test("undamped spring approximately conserves mechanical energy for 120 seconds", () => {
  const { params: p, state: initial } = P.createSpring();
  let s = initial,
    maxRelativeError = 0;
  const E = P.springEnergy(s, p).total;
  for (let i = 0; i < 28800; i++) {
    s = P.stepSpring(s, p, 1 / 240);
    maxRelativeError = Math.max(
      maxRelativeError,
      Math.abs(P.springEnergy(s, p).total / E - 1),
    );
  }
  assert.ok(maxRelativeError < 1e-7, `relative drift ${maxRelativeError}`);
});
test("worst supported spring frequency conserves energy within 0.04% over 120 seconds", () => {
  const p = { mass: 0.2, k: 100, displacement: 0.8, damping: 0 };
  let s = P.createSpring(p).state;
  const E = P.springEnergy(s, p).total;
  for (let i = 0; i < 28800; i++) s = P.stepSpring(s, p, 1 / 240);
  assert.ok(Math.abs(P.springEnergy(s, p).total / E - 1) < 0.0004);
});
test("damped spring loses mechanical energy and tends towards equilibrium", () => {
  const p = { ...P.SPRING_DEFAULTS, damping: 2 };
  let s = P.createSpring(p).state,
    previous = P.springEnergy(s, p).total;
  for (let i = 0; i < 7200; i++) {
    s = P.stepSpring(s, p, 1 / 240);
    const next = P.springEnergy(s, p).total;
    assert.ok(next <= previous + 1e-11);
    previous = next;
  }
  assert.ok(Math.abs(s.x) < 1e-10);
  assert.ok(previous < 1e-20);
});
test("critical and overdamped releases do not cross equilibrium", () => {
  for (const b of [4, 6]) {
    const p = { mass: 1, k: 4, displacement: 0.5, damping: b };
    let s = P.createSpring(p).state;
    for (let i = 0; i < 4800; i++) {
      s = P.stepSpring(s, p, 1 / 240);
      assert.ok(s.x >= 0);
    }
    assert.ok(s.x < 1e-6);
  }
});
test("spring stays finite and dissipative at all supported parameter corners", () => {
  for (const mass of [0.2, 5])
    for (const k of [1, 100])
      for (const displacement of [-0.8, 0, 0.8])
        for (const damping of [0, 10]) {
          const p = { mass, k, displacement, damping };
          let s = P.createSpring(p).state;
          const E = P.springEnergy(s, p).total;
          for (let i = 0; i < 7200; i++) {
            s = P.stepSpring(s, p, 1 / 240);
            assert.ok(Number.isFinite(s.x) && Number.isFinite(s.v));
            assert.ok(P.springEnergy(s, p).total <= E + 1e-8);
          }
        }
});
test("natural period scales as square root of mass and inverse square root of stiffness", () => {
  const p = P.SPRING_DEFAULTS,
    base = P.springInfo(p).period;
  near(
    P.springInfo({ ...p, mass: p.mass * 4 }).period,
    2 * base,
    1e-14,
    "quadruple mass",
  );
  near(
    P.springInfo({ ...p, k: p.k * 4 }).period,
    base / 2,
    1e-14,
    "quadruple stiffness",
  );
});
test("gravitational force obeys inverse-square law and scales with both masses", () => {
  const F = P.gravityForce(6e24, 1000, 1.5e7);
  near(P.gravityForce(6e24, 1000, 3e7) / F, 0.25, 1e-14, "double separation");
  near(
    P.gravityForce(6e24, 1000, 4.5e7) / F,
    1 / 9,
    1e-14,
    "triple separation",
  );
  near(P.gravityForce(12e24, 3000, 1.5e7) / F, 6, 1e-14, "mass product");
});
test("acceleration points towards central body, including both masses", () => {
  const p = circularParams(),
    a = P.orbitAcceleration({ x: 3e7, y: 4e7 }, p);
  assert.ok(a.x < 0 && a.y < 0);
  near(a.x / a.y, 0.75, 1e-14, "radial direction");
  near(
    Math.hypot(a.x, a.y),
    (P.G * (p.centralMass + p.bodyMass)) / 5e7 ** 2,
    1e-14,
    "relative acceleration",
  );
});
test("circular orbital radius and energy remain stable for ten orbital periods", () => {
  const p = circularParams();
  let s = P.createOrbit(p).state;
  const E = P.orbitEnergy(s, p).total;
  const period = (2 * Math.PI * p.distance) / p.velocity;
  let radiusError = 0,
    energyError = 0;
  for (let i = 0; i < Math.ceil((10 * period) / 2); i++) {
    s = P.stepOrbit(s, p, 2);
    radiusError = Math.max(
      radiusError,
      Math.abs(Math.hypot(s.x, s.y) / p.distance - 1),
    );
    energyError = Math.max(
      energyError,
      Math.abs(P.orbitEnergy(s, p).total / E - 1),
    );
  }
  assert.ok(!s.collided);
  assert.ok(radiusError < 1e-6, `radius drift ${radiusError}`);
  assert.ok(energyError < 1e-9, `energy drift ${energyError}`);
});
test("elliptical trajectory conserves angular momentum and energy", () => {
  const p = circularParams();
  p.velocity *= 0.8;
  let s = P.createOrbit(p).state;
  const E = P.orbitEnergy(s, p).total,
    L = P.orbitInfo(s, p).angularMomentum;
  let maxEnergy = 0,
    minRadius = p.distance;
  for (let i = 0; i < 50000; i++) {
    s = P.stepOrbit(s, p, 2);
    assert.ok(!s.collided);
    maxEnergy = Math.max(
      maxEnergy,
      Math.abs(P.orbitEnergy(s, p).total / E - 1),
    );
    minRadius = Math.min(minRadius, Math.hypot(s.x, s.y));
  }
  near(P.orbitInfo(s, p).angularMomentum / L, 1, 1e-11, "angular momentum");
  assert.ok(maxEnergy < 1e-5);
  assert.ok(minRadius < 0.6 * p.distance);
});
test("escape threshold has zero energy and super-escape launch moves outward", () => {
  const p = circularParams();
  p.velocity = P.escapeSpeed(p);
  let s = P.createOrbit(p).state;
  near(
    P.orbitEnergy(s, p).total / Math.abs(P.orbitEnergy(s, p).potential),
    0,
    1e-14,
    "parabolic energy",
  );
  p.velocity = 1.5 * P.circularSpeed(p);
  s = P.createOrbit(p).state;
  assert.ok(P.orbitEnergy(s, p).total > 0);
  for (let i = 0; i < 30000; i++) s = P.stepOrbit(s, p, 2);
  assert.ok(Math.hypot(s.x, s.y) > 10 * p.distance);
  assert.equal(P.orbitInfo(s, p).kind, "Hyperbolic escape");
});
test("radial fall stops exactly at absorbing surface with finite state", () => {
  const p = { ...circularParams(), velocity: 0 };
  let s = P.createOrbit(p).state;
  for (let i = 0; i < 20000 && !s.collided; i++) s = P.stepOrbit(s, p, 2);
  assert.ok(s.collided);
  near(Math.hypot(s.x, s.y), P.centralRadius(p), 1e-7, "surface contact");
  assert.ok(
    Object.values(s).every((v) => typeof v !== "number" || Number.isFinite(v)),
  );
  assert.equal(P.stepOrbit(s, p, 2), s);
});
test("orbital integration stays finite across supported corners, including massive satellites", () => {
  for (const centralMass of [1e24, P.EARTH_MASS, 2e25])
    for (const bodyMass of [100, 1e23])
      for (const distance of [8e6, 1.5e7, 4e7])
        for (const velocity of [0, 25000]) {
          const p = { centralMass, bodyMass, distance, velocity };
          if (distance <= P.centralRadius(p)) continue;
          let s = P.createOrbit(p).state;
          for (let i = 0; i < 10000 && !s.collided; i++) {
            s = P.stepOrbit(s, p, 2);
            for (const key of ["x", "y", "vx", "vy", "t"])
              assert.ok(Number.isFinite(s[key]));
          }
        }
});
test("invalid, nonfinite, out-of-range and inside-surface inputs are rejected", () => {
  for (const value of [NaN, Infinity, -1, 0])
    assert.throws(
      () => P.createSpring({ ...P.SPRING_DEFAULTS, mass: value }),
      RangeError,
    );
  assert.throws(
    () => P.createSpring({ ...P.SPRING_DEFAULTS, k: 101 }),
    RangeError,
  );
  assert.throws(
    () =>
      P.createOrbit({ ...P.ORBIT_DEFAULTS, centralMass: 2e25, distance: 8e6 }),
    RangeError,
  );
  assert.throws(
    () => P.createOrbit({ ...P.ORBIT_DEFAULTS, velocity: Infinity }),
    RangeError,
  );
  assert.throws(() => P.gravityForce(1, 1, 0), RangeError);
});
