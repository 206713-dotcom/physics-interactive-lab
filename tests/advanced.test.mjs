import test from "node:test";
import assert from "node:assert/strict";
import * as A from "../js/physics-advanced.js";
import { G } from "../js/physics.js";
const near = (a, b, t = 1e-10) =>
  assert.ok(Math.abs(a - b) <= t, `${a} vs ${b} (tolerance ${t})`);
function evolveStar(type, p, duration, step = 0.002) {
  let s = A.createStellar(type, p).state;
  const tau = A.stellarTime(type, p),
    end = duration * tau,
    h = step * tau;
  while (s.t < end && !s.halted)
    s = A.stepStellar(s, p, Math.min(h, end - s.t));
  return s;
}
function evolveDouble(p, duration, h = A.doubleStep(p)) {
  let s = A.createDouble(p).state;
  for (let i = 0; i < Math.round(duration / h); i++) s = A.stepDouble(s, p, h);
  return s;
}
test("binary initial conditions obey barycentre, momentum, force and circular virial relations", () => {
  const p = A.ADVANCED_DEFAULTS.binary,
    s = A.createStellar("binary", p).state,
    q = A.stellarInvariants(s),
    a = A.stellarAccelerations(s.bodies),
    [b1, b2] = s.bodies;
  near(q.cx / p.separation, 0, 1e-16);
  near(q.py / (p.m1 * Math.sqrt((G * p.m1) / p.separation)), 0, 1e-16);
  near(Math.hypot(b1.x, b1.y) / Math.hypot(b2.x, b2.y), p.m2 / p.m1);
  near((a[0].x * p.m1) / ((G * p.m1 * p.m2) / p.separation ** 2), 1);
  near((2 * q.kinetic + q.potential) / Math.abs(q.potential), 0, 1e-15);
});
test("a circular binary returns after one Kepler period and conserves energy for ten periods", () => {
  const p = A.ADVANCED_DEFAULTS.binary,
    initial = A.createStellar("binary", p).state;
  let s = initial;
  const tau = A.stellarTime("binary", p),
    h = 0.002 * tau;
  let maxRadius = 0,
    maxEnergy = 0;
  for (let i = 0; i < Math.ceil((20 * Math.PI) / 0.002); i++) {
    s = A.stepStellar(s, p, h);
    const q = A.stellarSample(s);
    maxRadius = Math.max(maxRadius, Math.abs(q.r12 / p.separation - 1));
    maxEnergy = Math.max(maxEnergy, Math.abs(q.energyError));
  }
  assert.ok(maxRadius < 3e-6);
  assert.ok(maxEnergy < 1e-6);
  const one = evolveStar("binary", p, 2 * Math.PI);
  assert.ok(
    Math.hypot(
      one.bodies[0].x - initial.bodies[0].x,
      one.bodies[0].y - initial.bodies[0].y,
    ) /
      p.separation <
      2e-5,
  );
});
test("elliptical and escaping binaries retain the expected energy sign and angular momentum", () => {
  for (const factor of [0.72, 1.5]) {
    const p = { ...A.ADVANCED_DEFAULTS.binary, speedFactor: factor },
      start = A.createStellar("binary", p).state,
      q0 = A.stellarInvariants(start),
      s = evolveStar("binary", p, 12),
      q = A.stellarInvariants(s);
    assert.equal(Math.sign(q.total), factor < Math.SQRT2 ? -1 : 1);
    near(q.angular / q0.angular, 1, 1e-12);
    assert.ok(Math.abs(A.stellarSample(s).energyError) < 0.005);
    if (factor > Math.SQRT2)
      assert.ok(A.stellarSample(s).r12 > p.separation * 3);
  }
});
test("stellar time and velocity scale correctly with length and mass", () => {
  const p = A.ADVANCED_DEFAULTS.binary;
  near(
    A.stellarTime("binary", { ...p, separation: 2 * p.separation }) /
      A.stellarTime("binary", p),
    Math.sqrt(8),
  );
  near(
    A.stellarTime("binary", { ...p, m1: 2 * p.m1, m2: 2 * p.m2 }) /
      A.stellarTime("binary", p),
    1 / Math.sqrt(2),
  );
});
test("three-body pair accelerations satisfy Newton's third law and inverse-square scaling", () => {
  const s = A.createStellar("threebody").state,
    a = A.stellarAccelerations(s.bodies),
    b = A.stellarAccelerations(
      s.bodies.map((q) => ({ ...q, x: 2 * q.x, y: 2 * q.y })),
    );
  const unit = (G * A.SOLAR_MASS) / A.AU ** 2;
  near(
    a.reduce((sum, q, i) => sum + q.x * s.bodies[i].mass, 0) /
      (A.SOLAR_MASS * unit),
    0,
    1e-15,
  );
  a.forEach((q, i) => {
    near(b[i].x / unit, q.x / unit / 4, 1e-14);
    near(b[i].y / unit, q.y / unit / 4, 1e-14);
  });
});
test("the published equal-mass figure-eight approximately repeats instead of tracing a prescribed curve", () => {
  const p = A.ADVANCED_DEFAULTS.threebody,
    start = A.createStellar("threebody", p).state;
  // Known dimensionless period, approximate: 6.3259 in the G=m=1 scaling.
  const s = evolveStar("threebody", p, 6.32591398);
  for (let i = 0; i < 3; i++)
    assert.ok(
      Math.hypot(
        s.bodies[i].x - start.bodies[i].x,
        s.bodies[i].y - start.bodies[i].y,
      ) /
        A.AU <
        2e-4,
    );
  assert.ok(Math.abs(A.stellarSample(s).energyError) < 0.001);
});
test("equal-mass triangular initial data rotates at the Lagrange angular frequency", () => {
  const p = { ...A.ADVANCED_DEFAULTS.threebody, layout: 1 },
    start = A.createStellar("threebody", p).state;
  const s = evolveStar("threebody", p, (2 * Math.PI) / Math.sqrt(3));
  const q = A.stellarSample(s);
  for (const r of [q.r12, q.r13, q.r23]) near(r / p.separation, 1, 2e-5);
  assert.ok(
    Math.hypot(
      s.bodies[0].x - start.bodies[0].x,
      s.bodies[0].y - start.bodies[0].y,
    ) /
      p.separation <
      4e-5,
  );
});
test("a perturbed triple conserves total momentum without forced recentering", () => {
  const p = {
      ...A.ADVANCED_DEFAULTS.threebody,
      m2: 0.7 * A.SOLAR_MASS,
      m3: 1.4 * A.SOLAR_MASS,
      perturbation: 0.01,
    },
    s = evolveStar("threebody", p, 10),
    q = A.stellarInvariants(s);
  const velocity = Math.sqrt((G * p.m1) / p.separation),
    total = p.m1 + p.m2 + p.m3;
  assert.ok(Math.hypot(q.px, q.py) / (total * velocity) < 1e-12);
  assert.ok(Math.hypot(q.cx, q.cy) / p.separation < 1e-11);
});
test("stellar supported corners remain finite or explicitly pause at a close-encounter guard", () => {
  for (const type of ["binary", "threebody"])
    for (const m1 of [0.2, 3])
      for (const m2 of [0.2, 3])
        for (const length of [0.5, type === "binary" ? 4 : 3])
          for (const factor of type === "binary" ? [0.55, 1.5] : [0.7, 1.3])
            for (const layout of type === "binary" ? [0] : [0, 1, 2])
              for (const m3 of type === "binary" ? [0.2] : [0.2, 3])
                for (const perturbation of type === "binary"
                  ? [0]
                  : [0, 0.05]) {
                  const p = {
                    ...A.ADVANCED_DEFAULTS[type],
                    m1: m1 * A.SOLAR_MASS,
                    m2: m2 * A.SOLAR_MASS,
                    separation: length * A.AU,
                    speedFactor: factor,
                    ...(type === "threebody"
                      ? { layout, m3: m3 * A.SOLAR_MASS, perturbation }
                      : {}),
                  };
                  const s = evolveStar(type, p, 4),
                    q = A.stellarSample(s);
                  for (const value of Object.values(q))
                    assert.ok(
                      Number.isFinite(value),
                      `${type}: finite ${value}`,
                    );
                  assert.ok(q.minDistance > 0.0099 * p.separation);
                  assert.ok(
                    Math.abs(q.energyError) < 0.1,
                    `${type} error ${q.energyError}%`,
                  );
                }
});
test("an unresolved stellar encounter pauses before a singular force or fabricated merger", () => {
  const p = A.ADVANCED_DEFAULTS.binary,
    s = A.createStellar("binary", p).state,
    d = 0.011 * p.separation;
  const nearState = {
    ...s,
    bodies: [
      { ...s.bodies[0], x: -d / 2, y: 0, vx: 1e8, vy: 0 },
      { ...s.bodies[1], x: d / 2, y: 0, vx: -1e8, vy: 0 },
    ],
  };
  const result = A.stepStellar(nearState, p, A.stellarStep("binary", p));
  assert.equal(result.halted, "Close-encounter guard");
  assert.ok(
    result.bodies.every((b) => Object.values(b).every(Number.isFinite)),
  );
  assert.ok(A.stellarSample(result).r12 >= 0.01 * p.separation);
});
test("double-pendulum acceleration agrees with the independent explicit formula", () => {
  const p = {
      ...A.ADVANCED_DEFAULTS.doublependulum,
      m1: 2,
      m2: 0.7,
      l1: 1.5,
      l2: 0.8,
    },
    s = { theta1: 1.2, theta2: -0.7, omega1: 2.3, omega2: -1.1 },
    q = A.doubleAcceleration(s, p),
    d = s.theta1 - s.theta2;
  const denominator = 2 * p.m1 + p.m2 - p.m2 * Math.cos(2 * d);
  const a1 =
    (-p.g * (2 * p.m1 + p.m2) * Math.sin(s.theta1) -
      p.m2 * p.g * Math.sin(s.theta1 - 2 * s.theta2) -
      2 *
        Math.sin(d) *
        p.m2 *
        (s.omega2 ** 2 * p.l2 + s.omega1 ** 2 * p.l1 * Math.cos(d))) /
    (p.l1 * denominator);
  const a2 =
    (2 *
      Math.sin(d) *
      (s.omega1 ** 2 * p.l1 * (p.m1 + p.m2) +
        p.g * (p.m1 + p.m2) * Math.cos(s.theta1) +
        s.omega2 ** 2 * p.l2 * p.m2 * Math.cos(d))) /
    (p.l2 * denominator);
  near(q.alpha1, a1, 1e-12);
  near(q.alpha2, a2, 1e-12);
});
test("double-pendulum energy has zero instantaneous derivative along its equations", () => {
  const p = A.ADVANCED_DEFAULTS.doublependulum,
    s = { theta1: 1.2, theta2: -0.7, omega1: 2.3, omega2: -1.1 },
    a = A.doubleAcceleration(s, p),
    eps = 1e-6;
  const offset = (sign) => ({
    theta1: s.theta1 + sign * eps * s.omega1,
    theta2: s.theta2 + sign * eps * s.omega2,
    omega1: s.omega1 + sign * eps * a.alpha1,
    omega2: s.omega2 + sign * eps * a.alpha2,
  });
  const derivative =
    (A.doubleEnergy(offset(1), p).total - A.doubleEnergy(offset(-1), p).total) /
    (2 * eps);
  assert.ok(Math.abs(derivative) < 1e-7);
});
test("main and twin separately conserve energy for a 60-second nonlinear release", () => {
  const p = A.ADVANCED_DEFAULTS.doublependulum,
    start = A.createDouble(p).state,
    twin0 = A.doubleEnergy(start.twin, p).total,
    s = evolveDouble(p, 60);
  assert.ok(Math.abs(A.doubleSample(s, p).energyError) < 1e-5);
  assert.ok(
    Math.abs(A.doubleEnergy(s.twin, p).total - twin0) / s.energyScale < 1e-7,
  );
});
test("identical double-pendulum twins coincide, while a small release difference grows", () => {
  const p = A.ADVANCED_DEFAULTS.doublependulum,
    identical = evolveDouble({ ...p, delta: 0 }, 30),
    perturbed = evolveDouble(p, 30);
  near(A.doubleSample(identical, { ...p, delta: 0 }).divergence, 0, 0);
  assert.ok(A.doubleSample(perturbed, p).divergence > 0.1);
  const resting = evolveDouble({ ...p, angle1: 0, angle2: 0, delta: 0 }, 10);
  near(resting.theta1, 0, 0);
  near(resting.omega2, 0, 0);
});
test("double-pendulum RK4 converges as the step is halved", () => {
  const p = A.ADVANCED_DEFAULTS.doublependulum,
    a = evolveDouble(p, 2, 1 / 120),
    b = evolveDouble(p, 2, 1 / 240),
    ref = evolveDouble(p, 2, 1 / 1920);
  const error = (s) =>
    Math.hypot(
      s.theta1 - ref.theta1,
      s.theta2 - ref.theta2,
      s.omega1 - ref.omega1,
      s.omega2 - ref.omega2,
    );
  assert.ok(error(a) > 8 * error(b));
  assert.ok(error(b) < 1e-5);
});
test("double-pendulum extreme supported lengths, masses and release angles stay finite", () => {
  for (const l1 of [0.5, 2])
    for (const l2 of [0.5, 2])
      for (const m1 of [0.5, 3])
        for (const m2 of [0.5, 3])
          for (const angle of [-170, 170]) {
            const p = {
                ...A.ADVANCED_DEFAULTS.doublependulum,
                l1,
                l2,
                m1,
                m2,
                g: 15,
                angle1: angle,
                angle2: -angle,
                delta: 1,
              },
              s = evolveDouble(p, 10);
            for (const value of Object.values(A.doubleSample(s, p)))
              assert.ok(Number.isFinite(value));
            assert.ok(
              Math.abs(A.doubleSample(s, p).energyError) < 0.005,
              `Energy error ${A.doubleSample(s, p).energyError}%`,
            );
          }
});
test("advanced models reject invalid inputs and their steppers preserve the input state", () => {
  assert.throws(
    () => A.createDouble({ ...A.ADVANCED_DEFAULTS.doublependulum, l1: 0 }),
    RangeError,
  );
  assert.throws(
    () =>
      A.createStellar("threebody", {
        ...A.ADVANCED_DEFAULTS.threebody,
        layout: 0.5,
      }),
    RangeError,
  );
  assert.throws(
    () => A.createStellar("binary", { ...A.ADVANCED_DEFAULTS.binary, m1: NaN }),
    RangeError,
  );
  for (const type of ["binary", "threebody", "doublependulum"]) {
    const p = A.ADVANCED_DEFAULTS[type],
      s = (
        type === "doublependulum" ? A.createDouble(p) : A.createStellar(type, p)
      ).state,
      before = JSON.stringify(s);
    (type === "doublependulum" ? A.stepDouble : A.stepStellar)(
      s,
      p,
      type === "doublependulum" ? 1 / 480 : A.stellarStep(type, p),
    );
    assert.equal(JSON.stringify(s), before);
  }
});
