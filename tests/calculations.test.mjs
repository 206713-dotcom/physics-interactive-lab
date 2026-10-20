import test from "node:test";
import assert from "node:assert/strict";
import { calculationSheet, calculationNumber } from "../js/calculations.js";
import { SIMULATIONS } from "../js/simulations.js";
import * as P from "../js/physics.js";
import * as E from "../js/physics-extra.js";

const result = (sheet, id) => sheet.calculations.find((item) => item.id === id);
const close = (a, b, tolerance = 1e-12) =>
  assert.ok(
    Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(b)),
    `${a} vs ${b}`,
  );
const sheetFor = (type, params = SIMULATIONS[type].defaults, state) => {
  const model = SIMULATIONS[type].create(params);
  return calculationSheet(type, state ?? model.state, model.params);
};

test("every expanded model provides stable worked steps, SI values and no state mutations", () => {
  for (const [type, definition] of Object.entries(SIMULATIONS))
    for (const [, preset] of definition.presets) {
      const model = definition.create(preset),
        before = JSON.stringify(model);
      let state = Object.freeze(model.state);
      const params = Object.freeze(model.params);
      const first = calculationSheet(type, state, params);
      for (let i = 0; i < 20; i++)
        state = definition.step(state, params, definition.h);
      const next = calculationSheet(type, state, params);
      assert.deepEqual(
        first.calculations.map((c) => c.id),
        next.calculations.map((c) => c.id),
      );
      assert.ok(first.variables.length >= 4 && first.calculations.length >= 4);
      for (const sheet of [first, next]) {
        for (const item of sheet.calculations) {
          assert.ok(item.formula && item.substitution && item.title);
          assert.ok(item.value === null || Number.isFinite(item.value));
          assert.equal(typeof item.unit, "string");
        }
        for (const item of sheet.variables)
          assert.ok(
            typeof item.value === "string" || Number.isFinite(item.value),
          );
      }
      assert.equal(JSON.stringify(model), before);
    }
});
test("spring working uses current displacement and velocity including damping", () => {
  const sheet = sheetFor(
    "spring",
    { mass: 2, k: 8, displacement: 0.7, damping: 3 },
    { x: 0.25, v: -0.5, t: 2 },
  );
  close(result(sheet, "force").value, -0.5);
  close(result(sheet, "acceleration").value, -0.25);
  close(result(sheet, "period").value, Math.PI);
  close(result(sheet, "energy").value, 0.5);
  assert.equal(sheet.variables.find((v) => v.symbol === "x").value, 0.25);
});
test("orbital working uses current separation and both masses in relative acceleration", () => {
  const p = { ...P.ORBIT_DEFAULTS, bodyMass: 1e23 },
    state = { x: 3e7, y: 4e7, vx: 3000, vy: 4000, t: 7200 };
  const sheet = sheetFor("gravity", p, state),
    r = 5e7;
  close(
    result(sheet, "force").value,
    (P.G * p.centralMass * p.bodyMass) / r ** 2,
  );
  close(
    result(sheet, "acceleration").value,
    (P.G * (p.centralMass + p.bodyMass)) / r ** 2,
  );
  close(
    result(sheet, "energy").value,
    0.5 * ((p.centralMass * p.bodyMass) / (p.centralMass + p.bodyMass)) * 25e6 -
      (P.G * p.centralMass * p.bodyMass) / r,
  );
  assert.equal(sheet.variables.find((v) => v.symbol === "r").value, r);
  assert.equal(result(sheet, "circular").value, P.circularSpeed(p));
});
test("pendulum working keeps angles in radians and labels its approximate period", () => {
  const p = { ...E.DEFAULTS.pendulum, damping: 0.2 },
    sheet = sheetFor("pendulum", p, { theta: Math.PI / 2, omega: 2, t: 1 });
  close(result(sheet, "acceleration").value, -6.94);
  close(result(sheet, "speed").value, 3);
  close(result(sheet, "energy").value, 19.215);
  assert.match(result(sheet, "period").note, /Approximation/);
  assert.equal(sheet.variables.find((v) => v.symbol === "θ").unit, "rad");
});
test("projectile working includes signed quadratic drag and energy per unit mass", () => {
  const p = { ...E.DEFAULTS.projectile, drag: 0.02 },
    sheet = sheetFor("projectile", p, { vx: 3, vy: 4, x: 0, y: 5, t: 1 });
  close(result(sheet, "speed").value, 5);
  close(result(sheet, "ax").value, -0.3);
  close(result(sheet, "ay").value, -10.21);
  close(result(sheet, "energy").value, 61.55);
  assert.equal(result(sheet, "energy").unit, "J/kg");
});
test("collision predictions are distinguished from live velocity and absent contact", () => {
  const p = {
      ...E.DEFAULTS.collisions,
      m1: 2,
      m2: 1,
      u1: 3,
      u2: -1,
      restitution: 0.5,
    },
    sheet = sheetFor("collisions", p);
  close(result(sheet, "momentum").value, 5);
  close(result(sheet, "energy").value, 9.5);
  close(result(sheet, "v1").value, 1);
  close(result(sheet, "v2").value, 3);
  assert.match(result(sheet, "v1").note, /not the current velocity/);
  const separating = sheetFor("collisions", { ...p, u1: -1, u2: 1 });
  assert.equal(result(separating, "v1").value, null);
  assert.equal(result(separating, "v2").value, null);
  assert.match(result(separating, "v1").note, /No collision/);
});
test("wave working evaluates superposition at the selected probe and actual time", () => {
  const sheet = sheetFor(
    "waves",
    { ...E.DEFAULTS.waves, reflection: 0.5 },
    { t: 0.25 },
  );
  close(result(sheet, "frequency").value, 1);
  close(result(sheet, "incident").value, 0.25);
  close(result(sheet, "reflected").value, -0.125);
  close(result(sheet, "resultant").value, 0.125);
  const longRun = sheetFor(
    "waves",
    { ...E.DEFAULTS.waves, speed: 4, wavelength: 0.5 },
    { t: 1e8 },
  );
  const incident = result(longRun, "incident");
  const shownPhase = Number(
    incident.substitution.split("sin(")[1].split(" rad)")[0],
  );
  assert.ok(Math.abs(shownPhase) <= Math.PI + 0.001);
  close(0.25 * Math.sin(shownPhase), incident.value, 2e-4);
});
test("interference working labels small-angle estimates and predicts the envelope minimum", () => {
  const p = E.DEFAULTS.interference,
    sheet = sheetFor("interference");
  close(
    result(sheet, "spacing").value,
    (p.wavelength * p.screenDistance) / p.separation,
  );
  close(result(sheet, "dark").value, result(sheet, "spacing").value / 2);
  assert.match(result(sheet, "spacing").note, /Small-angle/);
  assert.ok(
    E.interferenceAt(result(sheet, "diffraction").value, p).envelope < 1e-25,
  );
  assert.equal(result(sheet, "centre").value, 1);
});
test("refraction working handles total internal reflection and missing critical angles", () => {
  const sheet = sheetFor("refraction", {
    ...E.DEFAULTS.refraction,
    n1: 1.5,
    n2: 1,
    angle: 60,
  });
  assert.equal(result(sheet, "angle").value, null);
  assert.match(result(sheet, "angle").note, /Total internal reflection/);
  close(result(sheet, "critical").value, 41.810314895778596);
  assert.equal(result(sheet, "reflection").value, 1);
  const ordinary = sheetFor("refraction");
  assert.equal(result(ordinary, "critical").value, null);
  assert.ok(result(ordinary, "angle").value < 40);
});
test("RC working updates with elapsed time and preserves discharge current sign", () => {
  const p = E.DEFAULTS.circuits,
    charging = sheetFor("circuits", p, { t: 1 }),
    discharging = sheetFor("circuits", { ...p, discharge: 1 }, { t: 1 });
  close(result(charging, "tau").value, 1);
  close(result(charging, "voltage").value, 12 * (1 - Math.exp(-1)));
  close(result(discharging, "voltage").value, 12 * Math.exp(-1));
  close(result(discharging, "current").value, -0.012 * Math.exp(-1));
  close(
    result(charging, "charge").value,
    0.001 * result(charging, "voltage").value,
  );
  close(
    result(charging, "energy").value,
    0.0005 * result(charging, "voltage").value ** 2,
  );
});
test("field working respects superposition, exclusions and a zero-charge probe location", () => {
  const p = E.DEFAULTS.fields,
    sheet = sheetFor("fields");
  close(result(sheet, "r1").value, Math.SQRT2);
  close(result(sheet, "ex").value, (E.K_E * 2e-6) / Math.SQRT2);
  close(result(sheet, "ey").value, 0);
  close(result(sheet, "potential").value, 0);
  const singular = sheetFor("fields", { ...p, probeX: -1, probeY: 0 });
  for (const id of ["ex", "ey", "potential"])
    assert.equal(result(singular, id).value, null);
  assert.match(singular.note, /0.16 m/);
  const zero = sheetFor("fields", { ...p, q1: 0, probeX: -1, probeY: 0 });
  assert.equal(result(zero, "r1").value, 0);
  assert.ok(Number.isFinite(result(zero, "ex").value));
  assert.match(result(zero, "ex").substitution, /zero charge/);
});
test("calculation formatting retains tiny nonzero values and explicitly marks undefined results", () => {
  assert.equal(calculationNumber(0), "0");
  assert.equal(calculationNumber(6.6743e-11), "6.674e-11");
  assert.equal(calculationNumber(null), "Not defined");
  assert.equal(calculationNumber(NaN), "Not defined");
  assert.throws(() => calculationSheet("unknown", { t: 0 }, {}), RangeError);
});
