import test from "node:test";
import assert from "node:assert/strict";
import * as E from "../js/physics-extra.js";
import { SIMULATIONS, spatialRows } from "../js/simulations.js";
import { LESSONS } from "../js/content.js";
import { EXTRA_LESSONS } from "../js/content-extra.js";
import { ADVANCED_LESSONS } from "../js/content-advanced.js";
import { CURRICULUM_LESSONS } from "../js/content-curriculum.js";
const near = (a, b, t = 1e-9) =>
  assert.ok(Math.abs(a - b) <= t, `${a} differs from ${b} by more than ${t}`);
function run(type, p, duration, h = 1 / 240) {
  let s = E.createExtra(type, p).state;
  for (let i = 0; i < Math.ceil(duration / h); i++)
    s = E.stepExtra(type, s, p, h);
  return s;
}

test("all 57 laboratories have valid defaults, three presets and complete lesson resources", () => {
  assert.equal(Object.keys(SIMULATIONS).length, 57);
  for (const [id, d] of Object.entries(SIMULATIONS)) {
    const model = d.create(d.defaults),
      l = {
        ...LESSONS,
        ...EXTRA_LESSONS,
        ...ADVANCED_LESSONS,
        ...CURRICULUM_LESSONS,
      }[id];
    assert.ok(model.state);
    assert.equal(d.presets.length, 3);
    assert.equal(l.experiments.length, 3);
    assert.equal(l.questions.length, 5);
    assert.ok(l.objectives.length >= 3);
    assert.ok(l.equations.length >= 3);
    for (const [name, p] of d.presets)
      assert.doesNotThrow(() => d.create(p), `${id}: ${name}`);
  }
});
test("nonlinear pendulum conserves mechanical energy at a large angle", () => {
  const p = { ...E.DEFAULTS.pendulum, angle: 100 };
  let s = E.createExtra("pendulum", p).state;
  const initial = E.pendulumEnergy(s, p).total;
  for (let i = 0; i < 240 * 60; i++) s = E.stepExtra("pendulum", s, p, 1 / 240);
  near(E.pendulumEnergy(s, p).total / initial, 1, 1e-7);
});
test("pendulum approaches analytic small-angle motion at tiny release angles", () => {
  const p = { ...E.DEFAULTS.pendulum, angle: 0.1 },
    s = run("pendulum", p, 2);
  near(
    s.theta,
    p.angle * E.DEG * Math.cos(Math.sqrt(p.g / p.length) * s.t),
    2e-9,
  );
});
test("wide pendulum swings have a longer period than small swings", () => {
  function firstBottom(angle) {
    const p = { ...E.DEFAULTS.pendulum, angle };
    let s = E.createExtra("pendulum", p).state;
    for (let i = 0; i < 2400; i++) {
      const next = E.stepExtra("pendulum", s, p, 1 / 240);
      if (s.theta > 0 && next.theta <= 0)
        return s.t + ((next.t - s.t) * s.theta) / (s.theta - next.theta);
      s = next;
    }
    throw Error("No crossing");
  }
  assert.ok(firstBottom(100) > firstBottom(10) * 1.15);
});
test("pendulum mass cancels from motion and damping dissipates energy", () => {
  const a = run("pendulum", { ...E.DEFAULTS.pendulum, mass: 0.2 }, 10),
    b = run("pendulum", { ...E.DEFAULTS.pendulum, mass: 5 }, 10);
  near(a.theta, b.theta, 1e-14);
  const p = { ...E.DEFAULTS.pendulum, damping: 0.6 },
    initial = E.pendulumEnergy(E.createExtra("pendulum", p).state, p).total;
  assert.ok(
    E.pendulumEnergy(run("pendulum", p, 20), p).total < initial * 0.001,
  );
});
test("vacuum projectile matches exact range and flight time at ground contact", () => {
  const p = E.DEFAULTS.projectile,
    ref = E.projectileReference(p),
    s = run("projectile", p, 20);
  assert.ok(s.landed);
  near(s.y, 0);
  near(s.x, ref.range, 5e-5);
  near(s.t, ref.flightTime, 5e-6);
});
test("projectile vacuum energy is conserved and drag reduces range", () => {
  const p = { ...E.DEFAULTS.projectile, height: 5 },
    s = run("projectile", p, 1);
  near(
    E.sampleExtra("projectile", s, p).total,
    0.5 * p.speed ** 2 + p.g * p.height,
    1e-8,
  );
  const drag = { ...p, drag: 0.03 },
    d = run("projectile", drag, 20),
    v = run("projectile", p, 20);
  assert.ok(d.x < v.x);
  assert.ok(
    E.sampleExtra("projectile", d, drag).total <
      0.5 * p.speed ** 2 + p.g * p.height,
  );
});
test("complementary ground-level vacuum launch angles have equal range", () => {
  const p = E.DEFAULTS.projectile;
  near(
    E.projectileReference({ ...p, angle: 30 }).range,
    E.projectileReference({ ...p, angle: 60 }).range,
    1e-10,
  );
});
test("collision solutions conserve momentum and obey restitution over parameter corners", () => {
  for (const m1 of [0.2, 1, 5])
    for (const m2 of [0.2, 1, 5])
      for (const u1 of [-1, 0, 5])
        for (const u2 of [-5, 0, 1])
          for (const e of [0, 0.5, 1]) {
            const { v1, v2 } = E.collisionVelocities(m1, m2, u1, u2, e);
            near(m1 * v1 + m2 * v2, m1 * u1 + m2 * u2, 1e-12);
            near(v2 - v1, e * (u1 - u2), 1e-12);
            const loss =
                0.5 * m1 * u1 * u1 +
                0.5 * m2 * u2 * u2 -
                (0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2),
              expected =
                ((0.5 * m1 * m2) / (m1 + m2)) * (1 - e * e) * (u1 - u2) ** 2;
            near(loss, expected, 1e-11);
          }
});
test("collision event is solved inside a step without penetration or wall impulses", () => {
  const p = { ...E.DEFAULTS.collisions, u1: 5, u2: -5, restitution: 0.3 };
  let s = E.createExtra("collisions", p).state;
  for (let i = 0; i < 600; i++) {
    s = E.stepExtra("collisions", s, p, 0.01);
    assert.ok(s.x2 - s.x1 >= 0.8 - 1e-12);
  }
  assert.ok(s.hit);
  const away = run("collisions", { ...p, u1: -5, u2: 5 }, 2);
  assert.equal(away.hit, false);
});
test("standing-wave nodes remain zero and antinodes reach twice component amplitude", () => {
  const p = E.DEFAULTS.waves;
  for (let t = 0; t < 5; t += 0.031)
    near(E.waveAt(p.wavelength / 2, t, p).resultant, 0, 1e-14);
  near(E.waveAt(p.wavelength / 4, 0, p).resultant, 2 * p.amplitude, 1e-14);
});
test("travelling wave translates at its specified speed and superposes exactly", () => {
  const p = { ...E.DEFAULTS.waves, reflection: 0 };
  near(
    E.waveAt(1, 0, p).incident,
    E.waveAt(1 + p.speed * 0.13, 0.13, p).incident,
    1e-14,
  );
  const q = E.waveAt(0.37, 0.19, { ...p, reflection: 0.7 });
  near(q.resultant, q.incident + q.reflected, 1e-14);
});
test("double-slit intensity is normalised, symmetric and bounded by its envelope", () => {
  const p = E.DEFAULTS.interference;
  near(E.interferenceAt(0, p).intensity, 1);
  for (let y = -0.02; y < 0.02; y += 0.0001) {
    const a = E.interferenceAt(y, p),
      b = E.interferenceAt(-y, p);
    near(a.intensity, b.intensity);
    assert.ok(
      a.intensity >= 0 &&
        a.intensity <= a.envelope + 1e-14 &&
        a.envelope <= 1 + 1e-14,
    );
  }
});
test("double-slit dark interference and diffraction minima occur at correct angles", () => {
  const p = E.DEFAULTS.interference;
  const sinDark = p.wavelength / (2 * p.separation),
    yDark = (p.screenDistance * sinDark) / Math.sqrt(1 - sinDark ** 2);
  assert.ok(E.interferenceAt(yDark, p).intensity < 1e-25);
  const sinEnvelope = p.wavelength / p.slitWidth,
    yEnvelope =
      (p.screenDistance * sinEnvelope) / Math.sqrt(1 - sinEnvelope ** 2);
  assert.ok(E.interferenceAt(yEnvelope, p).envelope < 1e-25);
});
test("refraction obeys Snell law and normal-incidence Fresnel reflectance", () => {
  const p = E.DEFAULTS.refraction,
    q = E.refractionInfo(p);
  near(
    p.n1 * Math.sin(p.angle * E.DEG),
    p.n2 * Math.sin(q.refracted * E.DEG),
    1e-14,
  );
  near(E.refractionInfo(p, 0).reflectance, 0.04, 1e-14);
});
test("critical angle and total internal reflection have no fabricated transmitted ray", () => {
  const p = { ...E.DEFAULTS.refraction, n1: 1.5, n2: 1, angle: 55 },
    q = E.refractionInfo(p);
  near(q.critical, 41.8103148958, 1e-9);
  assert.equal(q.tir, true);
  assert.equal(q.refracted, null);
  near(q.reflectance, 1);
  assert.equal(E.refractionInfo({ ...p, n1: 1, n2: 1.5 }).tir, false);
});
test("identical-index media have zero reflection and unchanged ray direction", () => {
  for (const angle of [0, 20, 65, 85]) {
    const q = E.refractionInfo({
      ...E.DEFAULTS.refraction,
      n1: 1.7,
      n2: 1.7,
      angle,
    });
    near(q.refracted, angle, 1e-12);
    near(q.reflectance, 0, 1e-24);
  }
});
test("RC charging and discharging reach the correct one-time-constant fractions", () => {
  const p = E.DEFAULTS.circuits,
    tau = p.resistance * p.capacitance;
  near(E.circuitAt(tau, p).voltage / p.voltage, 1 - Math.exp(-1));
  near(
    E.circuitAt(tau, { ...p, discharge: 1 }).voltage / p.voltage,
    Math.exp(-1),
  );
});
test("RC current equals C dV/dt, with a negative sign during discharge", () => {
  for (const discharge of [0, 1]) {
    const p = { ...E.DEFAULTS.circuits, discharge },
      h = 1e-5,
      t = 0.7,
      dv =
        (E.circuitAt(t + h, p).voltage - E.circuitAt(t - h, p).voltage) /
        (2 * h);
    near(p.capacitance * dv, E.circuitAt(t, p).current, 1e-12);
  }
});
test("RC stored energy and charge agree with capacitor definitions over all corners", () => {
  for (const resistance of [100, 10000])
    for (const capacitance of [100e-6, 2000e-6])
      for (const voltage of [1, 24])
        for (const discharge of [0, 1]) {
          const p = { resistance, capacitance, voltage, discharge };
          for (const f of [0, 1, 6]) {
            const q = E.circuitAt(f * resistance * capacitance, p);
            near(q.charge, capacitance * q.voltage);
            near(q.energy, 0.5 * capacitance * q.voltage ** 2);
            assert.ok(q.voltage >= 0 && q.voltage <= voltage);
          }
        }
});
test("point-charge field obeys inverse square while potential obeys inverse distance", () => {
  const p = { ...E.DEFAULTS.fields, q1: 1e-6, q2: 0, separation: 2 },
    a = E.fieldAt(0, 0, p),
    b = E.fieldAt(1, 0, p);
  near(b.magnitude / a.magnitude, 0.25);
  near(b.potential / a.potential, 0.5);
});
test("dipole potential cancels at midpoint but field does not", () => {
  const p = E.DEFAULTS.fields,
    q = E.fieldAt(0, 0, p);
  near(q.potential, 0, 1e-12);
  assert.ok(q.ex > 0);
  near(q.ey, 0);
});
test("like-charge field cancels at midpoint but potential does not", () => {
  const q = E.fieldAt(0, 0, { ...E.DEFAULTS.fields, q2: 2e-6 });
  near(q.magnitude, 0);
  assert.ok(q.potential > 0);
});
test("charge singularities are explicitly excluded without softening and zero charges vanish", () => {
  const p = E.DEFAULTS.fields,
    q = E.fieldAt(-1, 0, p);
  assert.equal(q.valid, false);
  assert.equal(q.magnitude, null);
  assert.equal(E.fieldAt(1, 0, { ...p, q2: 0 }).valid, true);
});
test("electric field agrees with negative potential gradient away from charges", () => {
  const p = E.DEFAULTS.fields,
    x = 0.4,
    y = 0.7,
    h = 1e-5,
    q = E.fieldAt(x, y, p),
    dx =
      (E.fieldAt(x + h, y, p).potential - E.fieldAt(x - h, y, p).potential) /
      (2 * h),
    dy =
      (E.fieldAt(x, y + h, p).potential - E.fieldAt(x, y - h, p).potential) /
      (2 * h);
  near(q.ex, -dx, 1e-4);
  near(q.ey, -dy, 1e-4);
});
test("all computed spatial datasets remain finite or explicitly contain null exclusions", () => {
  for (const [type, p] of [
    ["wave", E.DEFAULTS.waves],
    ["interference", E.DEFAULTS.interference],
    ["refraction", { ...E.DEFAULTS.refraction, n1: 1.5, n2: 1 }],
    ["field", { ...E.DEFAULTS.fields, probeY: 0 }],
  ])
    for (const row of spatialRows(type, { t: 0.3 }, p))
      for (const value of Object.values(row))
        assert.ok(
          value === null ||
            typeof value === "boolean" ||
            Number.isFinite(value),
        );
});
test("expanded dynamic model parameter corners remain finite throughout observation", () => {
  for (const type of ["pendulum", "projectile", "collisions"]) {
    const entries = Object.entries(E.LIMITS[type]);
    for (let mask = 0; mask < 2 ** entries.length; mask++) {
      const p = Object.fromEntries(
        entries.map(([key, bounds], i) => [key, bounds[(mask >> i) & 1]]),
      );
      let s = E.createExtra(type, p).state;
      for (let i = 0; i < 240 * 10; i++) {
        s = E.stepExtra(type, s, p, 1 / 240);
        for (const value of Object.values(s))
          assert.ok(typeof value !== "number" || Number.isFinite(value));
      }
    }
  }
});
test("all new models reject invalid numeric parameters and illegal switch positions", () => {
  for (const type of Object.keys(E.DEFAULTS)) {
    const key = Object.keys(E.DEFAULTS[type])[0];
    for (const value of [NaN, Infinity, -Infinity])
      assert.throws(
        () => E.createExtra(type, { ...E.DEFAULTS[type], [key]: value }),
        RangeError,
      );
  }
  assert.throws(
    () => E.createExtra("circuits", { ...E.DEFAULTS.circuits, discharge: 0.5 }),
    RangeError,
  );
});
test("unit-converted slider endpoints tolerate round-off without admitting invalid log masses", () => {
  const p = E.createExtra("interference", {
    ...E.DEFAULTS.interference,
    wavelength: 700 * 1e-9,
  }).params;
  assert.equal(p.wavelength, 700e-9);
  assert.throws(
    () =>
      SIMULATIONS.gravity.create({
        ...SIMULATIONS.gravity.defaults,
        bodyMass: 0,
      }),
    RangeError,
  );
  assert.throws(
    () =>
      E.createExtra("interference", {
        ...E.DEFAULTS.interference,
        wavelength: 701e-9,
      }),
    RangeError,
  );
});
