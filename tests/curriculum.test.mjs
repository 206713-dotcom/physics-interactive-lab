import test from "node:test";
import assert from "node:assert/strict";
import * as P from "../js/curriculum-physics.js";
import {
  CURRICULUM_SIMULATIONS as LABS,
  curriculumRows,
  curriculumCalculationSheet,
} from "../js/curriculum-simulations.js";
import { CURRICULUM_LESSONS } from "../js/content-curriculum.js";
import { COURSE, COURSE_SCAN } from "../js/course-map.js";
import { SIMULATIONS } from "../js/simulations.js";
import { experimentLink } from "../js/integration.js";
const close = (a, b, rel = 1e-10) =>
  assert.ok(
    Math.abs(a - b) <= rel * Math.max(Math.abs(b), 1e-30),
    `${a} != ${b}`,
  );
const sample = (id, overrides = {}, t = 0) => {
  const p = { ...P.DEFAULTS[id], ...overrides },
    s = P.createCurriculum(id, p).state;
  s.t = t;
  return P.sampleCurriculum(id, s, p);
};

test("course scan accounts for every public IGCSE lesson, ten hubs and six areas", () => {
  assert.equal(COURSE.length, 78);
  assert.equal(COURSE_SCAN.statements, 324);
  assert.equal(new Set(COURSE.map((x) => x.url)).size, 78);
  assert.equal(COURSE.filter((x) => x.review).length, 13);
  assert.equal(new Set(COURSE.map((x) => x.area)).size, 6);
  assert.equal(new Set(COURSE.map((x) => x.topic)).size, 10);
  for (const lesson of COURSE) {
    assert.ok(lesson.models.length > 0);
    assert.ok(lesson.url.startsWith("https://focusphysics.com/years/"));
    for (const model of lesson.models)
      assert.ok(SIMULATIONS[model], `${lesson.title}: ${model}`);
  }
  for (const id of P.CURRICULUM_IDS.filter(
    (id) => LABS[id].level === "IGCSE 0625",
  ))
    assert.ok(
      COURSE.some((x) => x.models.includes(id)),
      `${id} is not reachable from course`,
    );
});
test("all 44 scientific instruments expose real calculations, lessons, valid presets and diagram embeds", () => {
  assert.equal(P.CURRICULUM_IDS.length, 44);
  for (const [id, d] of Object.entries(LABS)) {
    assert.equal(d.presets.length, 3);
    assert.equal(CURRICULUM_LESSONS[id].questions.length, 5);
    assert.equal(CURRICULUM_LESSONS[id].experiments.length, 3);
    for (const [, p] of d.presets) {
      const run = d.create(p),
        before = JSON.stringify(run),
        sheet = curriculumCalculationSheet(id, run.state, p, (x) => String(x));
      assert.ok(sheet.calculations.length >= 4);
      for (const r of sheet.calculations)
        assert.ok(r.value === null || Number.isFinite(r.value));
      assert.equal(JSON.stringify(run), before);
      assert.equal(
        new URLSearchParams(
          experimentLink({
            baseURL: "https://example.org/lab/",
            model: id,
            params: p,
            view: "3d",
          })
            .split("?")
            .at(-1),
        ).get("view"),
        "3d",
      );
    }
  }
});
test("every parameter endpoint, mode and ten-minute observation stays finite or explicitly undefined", () => {
  for (const [id, d] of Object.entries(LABS)) {
    const setups = d.presets.map((x) => x[1]);
    for (const control of d.controls) {
      const values = control.options
        ? control.options.map((x) => x[0])
        : [P.RANGES[id][control.key][1], P.RANGES[id][control.key][2]];
      for (const value of values) {
        const p = { ...d.defaults, [control.key]: value };
        try {
          d.create(p);
          setups.push(p);
        } catch (e) {
          assert.equal(id, "atom");
          assert.equal(control.key, "charge");
        }
      }
    }
    for (const p of setups) {
      const s = d.create(p).state;
      for (const t of [0, 1e-9, 0.01, 10, 600]) {
        const q = P.sampleCurriculum(id, { ...s, t }, p);
        for (const [k, value] of Object.entries(q))
          assert.ok(
            value === null || Number.isFinite(value),
            `${id}.${k} = ${value}`,
          );
      }
    }
    if (d.sweep)
      for (const row of curriculumRows(
        `curriculum:${id}`,
        d.create(d.defaults).state,
        d.defaults,
      ))
        for (const v of Object.values(row))
          assert.ok(v === null || Number.isFinite(v));
  }
});
test("invalid numbers, noninteger selectors and physically impossible ions are rejected", () => {
  for (const id of P.CURRICULUM_IDS)
    for (const [key, [, lo, hi]] of Object.entries(P.RANGES[id]))
      for (const bad of [
        NaN,
        Infinity,
        -Infinity,
        lo - Math.max(Math.abs(lo), 1e-30),
        hi + Math.max(Math.abs(hi), 1e-30),
      ])
        assert.throws(
          () => P.createCurriculum(id, { ...P.DEFAULTS[id], [key]: bad }),
          RangeError,
        );
  assert.throws(() =>
    P.createCurriculum("lenses", { ...P.DEFAULTS.lenses, kind: 0 }),
  );
  assert.throws(() =>
    P.createCurriculum("atom", { ...P.DEFAULTS.atom, protons: 1, charge: 3 }),
  );
  assert.throws(() =>
    P.createCurriculum("radioactivity", {
      ...P.DEFAULTS.radioactivity,
      nuclei: 50.5,
    }),
  );
});
test("ruler quantisation and repeated timing reduce uncertainty as 1/n", () => {
  const a = sample("measurement", { count: 1 }),
    b = sample("measurement", { count: 20 });
  close(a.measured, 0.427);
  close(a.absolute, 0.0005);
  close(a.period, 1.4);
  close(b.uncertainty, a.uncertainty / 20);
});
test("constant-force motion agrees with suvat and finite differences of x/v", () => {
  const p = { mass: 2, force: 6, drag: 0, initial: 4 },
    q = sample("motion", p, 3);
  close(q.v, 13);
  close(q.x, 25.5);
  close(q.a, 3);
  const a = sample("motion", {}, 3 - 0.0001),
    b = sample("motion", {}, 3 + 0.0001),
    m = sample("motion", {}, 3);
  close((b.x - a.x) / 0.0002, m.v, 1e-8);
  close((b.v - a.v) / 0.0002, m.a, 1e-8);
});
test("free fall reaches mg/b with zero resultant and mass-proportional weight", () => {
  const q = sample("motion", { mode: 1, mass: 2, drag: 2 }, 100);
  close(q.v, 9.81);
  assert.ok(Math.abs(q.net) < 1e-12);
  close(q.weight, 19.62);
});
test("perpendicular and opposing force vectors obey Pythagoras and cancellation", () => {
  const q = sample("vectors");
  close(q.resultant, 10);
  close(q.direction, 36.86989764584402);
  const cancelled = sample("vectors", { a: 10, b: 10, angle: 180 });
  assert.equal(cancelled.resultant, 0);
  assert.equal(cancelled.direction, null);
  assert.equal(sample("vectors", { a: 8, b: 6, angle: 180 }).y, 0);
});
test("balanced moments and stability threshold use perpendicular lever arms", () => {
  assert.ok(Math.abs(sample("moments").net) < 1e-10);
  const p = { width: 0.8, height: 1, tilt: 30 },
    q = sample("moments", p);
  close(q.critical, Math.atan(0.4) / P.DEG);
  assert.equal(q.tipping, 1);
});
test("floating equilibrium displaces its weight and liquid pressure scales with depth", () => {
  const q = sample("buoyancy");
  close(q.weight, q.upthrust);
  close(q.fraction, 0.6);
  close(
    sample("buoyancy", { depth: 2 }).pressure,
    2 * sample("buoyancy", { depth: 1 }).pressure,
  );
  assert.ok(
    sample("buoyancy", { density: 7800 }).upthrust <
      sample("buoyancy", { density: 7800 }).weight,
  );
});
test("lift conserves input = useful + dissipated and stops at its chosen height", () => {
  for (const t of [0, 0.1, 2, 1000]) {
    const q = sample("energy", {}, t);
    close(q.input, q.potential + q.waste);
    assert.ok(q.height <= P.DEFAULTS.energy.height);
  }
  close(sample("energy", { efficiency: 1 }, 2).waste, 0);
});
test("Boyle and absolute-temperature gas laws have correct scaling and units", () => {
  const q = sample("gases");
  close(q.pressure, 103930.782725);
  close(sample("gases", { volume: 0.048 }).pressure, q.pressure / 2);
  close(sample("gases", { temperature: 600 }).pressure, q.pressure * 2);
  close(q.celsius, 26.85);
  assert.equal(sample("gases", { state: 0 }).pressure, null);
});
test("linear expansion scales with length, coefficient and temperature rise", () => {
  const q = sample("expansion");
  close(q.extension, 0.00184);
  close(q.final, 1.00184);
  close(sample("expansion", { length: 2 }).extension, 2 * q.extension);
});
test("water heating resolves ice, fusion, water, vaporisation and steam continuously", () => {
  const p = { mass: 1, power: 1000, initial: -10 };
  const atE = (e) => sample("calorimetry", p, e / 1000);
  close(atE(0).temperature, -10);
  close(atE(21000).temperature, 0);
  close(atE(21000 + 167000).melt, 0.5);
  close(atE(355000).temperature, 0);
  close(atE(565000).temperature, 50);
  close(atE(775000).temperature, 100);
  close(atE(1905000).boil, 0.5);
  close(atE(3035000).temperature, 100);
  close(atE(3235000).temperature, 200);
});
test("positive initial water temperature skips ice and custom c gives Q/(mc)", () => {
  close(sample("calorimetry", { initial: 20 }, 0).temperature, 20);
  close(
    sample(
      "calorimetry",
      { mode: 1, initial: 20, mass: 1, power: 1000, capacity: 1000 },
      10,
    ).temperature,
    30,
  );
});
test("heat conduction scales as A/d and radiation uses kelvin fourth powers", () => {
  const q = sample("heat");
  close(sample("heat", { thickness: 0.1 }).conduction, q.conduction / 2);
  close(sample("heat", { area: 0.04 }).conduction, 2 * q.conduction);
  close(q.radiation, 0.9 * P.SIGMA * 0.02 * (373.15 ** 4 - 293.15 ** 4));
  close(sample("heat", { emissivity: 0.45 }).radiation, q.radiation / 2);
});
test("wavefront wavelength and gap ratio follow v = fλ", () => {
  const q = sample("wavefronts");
  close(q.wavelength, 1);
  close(q.ratio, 1);
  close(sample("wavefronts", { frequency: 4 }).wavelength, 0.5);
});
test("plane mirror preserves angle, magnification and opposite signed image distance", () => {
  const q = sample("mirror");
  close(q.incident, q.reflected);
  close(q.image, -2);
  close(q.magnification, 1);
});
test("thin lens produces real, virtual, diverging and infinite-distance results", () => {
  let q = sample("lenses", { focal: 0.1, object: 0.3 });
  close(q.image, 0.15);
  close(q.magnification, -0.5);
  q = sample("lenses", { focal: 0.1, object: 0.05 + 0.01 });
  close(q.image, -0.15);
  assert.ok(q.magnification > 1);
  q = sample("lenses", { kind: -1 });
  assert.ok(q.image < 0 && q.magnification > 0 && q.magnification < 1);
  assert.equal(sample("lenses", { focal: 0.15, object: 0.15 }).image, null);
  const pole = curriculumRows(
    "curriculum:lenses",
    { t: 0 },
    { ...P.DEFAULTS.lenses, focal: 0.123 },
  );
  assert.ok(
    pole.some((r) => r.image === null && Math.abs(r.x - 12.3) < 1e-10),
    "Parameter curves must break at the focal-plane asymptote.",
  );
});
test("Cauchy dispersion gives larger blue index and conserves frequency at boundary", () => {
  const blue = sample("dispersion", { wavelength: 400e-9 }),
    red = sample("dispersion", { wavelength: 700e-9 });
  assert.ok(blue.index > red.index && blue.refraction < red.refraction);
  close(blue.speed / blue.wavelength, P.C / 400e-9);
});
test("all EM wavelengths preserve vacuum speed while photon energy increases with frequency", () => {
  const q = sample("spectrum");
  close(q.frequency * q.wavelength, P.C);
  close(
    sample("spectrum", { exponent: -8 }).energy /
      sample("spectrum", { exponent: -6 }).energy,
    100,
  );
});
test("sound echo has a round-trip path and frequency changes pitch without changing speed", () => {
  const q = sample("sound");
  close(q.echo, 60 / q.speed);
  close(sample("sound", { frequency: 880 }).wavelength, q.wavelength / 2);
  close(sample("sound", { frequency: 880 }).speed, q.speed);
});
test("series and parallel circuits conserve current, voltage and power", () => {
  const a = sample("dc");
  close(a.resistance, 300);
  close(a.current, 0.04);
  close(a.v1 + a.v2, 12);
  close(a.power, a.i1 * a.v1 + a.i2 * a.v2);
  const b = sample("dc", { mode: 1 });
  close(b.current, b.i1 + b.i2);
  close(b.v1, b.v2);
  close(b.resistance, (100 * 200) / 300);
});
test("wire resistance scales with length and inverse area; divider voltage follows ratio", () => {
  const q = sample("dc");
  close(sample("dc", { length: 2 }).wire, 2 * q.wire);
  close(sample("dc", { area: 2e-6 }).wire, q.wire / 2);
  close(sample("dc", { mode: 2 }).v2, 8);
});
test("diode direction, relay threshold and overcurrent cut-out give valid states", () => {
  close(sample("devices", { voltage: -6 }).current, 0);
  close(sample("devices", { voltage: 6 }).current, 0.053);
  close(sample("devices", { mode: 1, voltage: 2 }).current, 0);
  close(sample("devices", { mode: 1, voltage: 4 }).current, 0.04);
  const q = sample("devices", { mode: 2, voltage: 12, rating: 0.05 });
  assert.equal(q.on, 0);
  close(q.current, 0);
});
test("solenoid field scales with NI/L and changes sign on current reversal", () => {
  const q = sample("magnetism");
  close(sample("magnetism", { current: -2 }).field, -q.field);
  close(sample("magnetism", { turns: 200 }).field, 2 * q.field);
  close(sample("magnetism", { length: 0.4 }).field, q.field / 2);
});
test("magnetic circular orbit conserves speed and energy, reverses curvature and returns", () => {
  const p = P.DEFAULTS.charged,
    q = sample("charged"),
    period = 1 / q.frequency,
    half = sample("charged", {}, period / 2);
  close(half.y, 2 * q.radius);
  const reverse = sample("charged", { charge: 1 }, period / 2);
  close(reverse.y, -half.y);
  const end = sample("charged", {}, period);
  assert.ok(Math.hypot(end.x, end.y) < q.radius * 1e-12);
  close(sample("charged", {}, period * 0.4).kinetic, q.kinetic);
  assert.equal(sample("charged", { field: 0 }).radius, null);
  close(sample("charged", { field: 0 }, 1e-8).x, 0.01);
});
test("generator emf is negative derivative of flux linkage and vanishes at max flux", () => {
  close(sample("induction").emf, 0);
  const p = P.DEFAULTS.induction,
    t = 0.13,
    h = 1e-6,
    q = sample("induction", {}, t),
    derivative =
      (sample("induction", {}, t + h).flux -
        sample("induction", {}, t - h).flux) /
      (2 * h);
  close(q.emf, -p.turns * derivative, 1e-8);
  close(
    sample("induction", { frequency: 2 }).peak,
    2 * sample("induction").peak,
  );
});
test("ideal transformer preserves power and turns ratios while line loss is I²R", () => {
  const q = sample("transformer");
  close(q.vs, 46);
  close(q.input, q.output);
  close(q.vs / 230, 100 / 500);
  close(q.ip / q.is, 100 / 500);
  close(q.loss, q.ip * q.ip * 2);
});
test("nuclear accounting conserves charge and nucleon number for alpha and beta-minus", () => {
  let q = sample("atom", { protons: 92, neutrons: 146, decay: 1 });
  assert.equal(q.daughterZ + 2, 92);
  assert.equal(q.daughterA + 4, 238);
  q = sample("atom", { protons: 6, neutrons: 8, decay: 2 });
  assert.equal(q.daughterZ - 1, 6);
  assert.equal(q.daughterA, 14);
  assert.equal(
    sample("atom", { protons: 1, neutrons: 0, decay: 1 }).daughterZ,
    null,
  );
});
test("Rutherford deflection decreases for greater impact parameter and energy", () => {
  const q = sample("atom");
  assert.ok(sample("atom", { impact: 6e-13 }).angle < q.angle);
  assert.ok(sample("atom", { energy: 1e7 }).angle < q.angle);
});
test("seeded waiting times are reproducible, monotone and independent of step size", () => {
  const p = P.DEFAULTS.radioactivity,
    a = P.createCurriculum("radioactivity", p),
    b = P.createCurriculum("radioactivity", p);
  assert.deepEqual(a.state.decayTimes, b.state.decayTimes);
  assert.notDeepEqual(
    a.state.decayTimes,
    P.createCurriculum("radioactivity", { ...p, seed: 43 }).state.decayTimes,
  );
  let last = p.nuclei;
  for (let t = 0; t < 40; t += 0.1) {
    const q = P.sampleCurriculum("radioactivity", { ...a.state, t }, p);
    assert.ok(q.remaining <= last);
    last = q.remaining;
  }
  close(sample("radioactivity", {}, 5).expected, 150);
  close(sample("radioactivity", {}, 10).expected, 75);
});
test("an ensemble of seeded samples agrees statistically with the half-life expectation", () => {
  let sum = 0;
  for (let seed = 1; seed <= 400; seed++)
    sum += sample("radioactivity", { seed }, 5).remaining;
  assert.ok(Math.abs(sum / 400 - 150) < 2);
  close(
    sample("radioactivity", { thickness: 2 }).transmission,
    sample("radioactivity", { thickness: 1 }).transmission ** 2,
  );
});
test("equinox daylight is 12 h, opposite hemispheres have opposite seasons and lunar phases cycle", () => {
  close(sample("earthmoon", { day: 80 }).daylight, 12);
  const n = sample("earthmoon", { day: 172, latitude: 45 }),
    s = sample("earthmoon", { day: 172, latitude: -45 });
  close(n.daylight + s.daylight, 24);
  assert.ok(n.daylight > s.daylight);
  close(sample("earthmoon", { lunarDay: 0 }).illumination, 0);
  close(sample("earthmoon", { lunarDay: 29.53059 / 2 }).illumination, 1);
});
test("planet reference data give Earth-like orbit, correct Kepler scaling and light delay", () => {
  const q = sample("solarsystem");
  assert.ok(Math.abs(q.period / P.YEAR - 1) < 1e-4);
  assert.ok(Math.abs(q.speed - 29785) < 10);
  close(q.lightTime, P.AU / P.C);
  const b = sample("solarsystem", { scale: 2 });
  close(b.period / q.period, Math.sqrt(8));
  close(b.speed / q.speed, 1 / Math.sqrt(2));
  assert.ok(q.surfaceGravity > 9.7 && q.surfaceGravity < 9.9);
});
test("stellar reference relations scale consistently and Wien peak shifts with temperature", () => {
  const q = sample("stars");
  close(q.luminosity, 1);
  close(q.lifetime, 1e10);
  assert.ok(sample("stars", { mass: 10 }).lifetime < q.lifetime);
  close(sample("stars", { temperature: 11600 }).peak, q.peak / 2);
});
test("Hubble relation, wavelength redshift and CMB expansion use consistent units", () => {
  const q = sample("universe");
  close(q.speed, 2.2e-18 * 100 * 3.085677581491367e22);
  close(q.observed, 500e-9 * (1 + q.redshift));
  close(q.age, 1 / 2.2e-18 / P.YEAR);
  close(sample("universe", { scale: 4 }).cmb, q.cmb / 2);
  assert.ok(
    sample("universe", { distance: 300, hubble: 3e-18 }).redshift < 0.1,
  );
});
