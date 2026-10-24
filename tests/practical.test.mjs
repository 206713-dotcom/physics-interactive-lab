import test from "node:test";
import assert from "node:assert/strict";
import * as P from "../js/practical-physics.js";
import {
  DEFAULTS,
  createCurriculum,
  sampleCurriculum,
} from "../js/curriculum-physics.js";
import {
  CURRICULUM_SIMULATIONS as LABS,
  curriculumRows,
} from "../js/curriculum-simulations.js";
const near = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} != ${b}`);
const sample = (id, overrides = {}, t = 0) =>
  P.samplePractical(
    id,
    { ...P.createPractical(id), t },
    { ...DEFAULTS[id], ...overrides },
  );
const lamp = (p, duration, h = 1 / 120) => {
  let s = P.createPractical("filament");
  while (s.t < duration - 1e-12)
    s = P.stepPractical("filament", s, p, Math.min(h, duration - s.t));
  return s;
};
test("hydraulic pressure and displaced volume conserve ideal work across area extremes", () => {
  for (const a of [1e-4, 2e-3])
    for (const b of [0.001, 0.02]) {
      const p = { ...DEFAULTS.hydraulics, inputArea: a, outputArea: b },
        q = sample("hydraulics", p, 4);
      near(q.outputForce / b, p.force / a);
      near(a * q.inputTravel, b * q.outputTravel);
      near(q.inputWork, q.outputWork);
    }
});
test("single, series and parallel springs obey force sharing, extension and component energy sums", () => {
  for (const mode of [0, 1, 2]) {
    const p = { ...DEFAULTS.hooke, mode },
      q = sample("hooke", p, 4);
    near(q.force, p.load);
    near(
      q.energy,
      0.5 * p.k1 * q.x1 ** 2 + (mode ? 0.5 * p.k2 * q.x2 ** 2 : 0),
    );
    if (mode === 1) {
      near(q.extension, q.x1 + q.x2);
      near(q.f1, q.f2);
    }
    if (mode === 2) {
      near(q.f1 + q.f2, q.force);
      near(q.x1, q.x2);
    }
  }
  near(sample("hooke", {}, 0).force, 0);
});
test("sensor reference points, monotonic NTC law, divider complement and exact comparator threshold", () => {
  near(sample("sensors", { lux: 100 }).resistance, 10000);
  near(sample("sensors", { mode: 1, temperature: 25 }).resistance, 10000);
  assert.ok(sample("sensors", { mode: 1, temperature: 60 }).resistance < 10000);
  assert.ok(
    sample("sensors", { lux: 1000 }).resistance <
      sample("sensors", { lux: 10 }).resistance,
  );
  const a = sample("sensors", { orientation: 0 }),
    b = sample("sensors", { orientation: 1 });
  near(a.output + b.output, 6);
  assert.equal(a.on, 1);
  near(a.sensorPower, a.current ** 2 * a.resistance);
});
test("radiation beams conserve relativistic energy, remain subluminal and have inverse-field radii", () => {
  for (const energy of [1e4, 3e5, 1e6]) {
    const ref = P.particleReference(
      energy,
      P.ELECTRON_MASS,
      -1.602176634e-19,
      0.1,
    );
    assert.ok(ref.speed < 299792458);
    const gamma = 1 / Math.sqrt(1 - (ref.speed / 299792458) ** 2);
    near(
      ((gamma - 1) * P.ELECTRON_MASS * 299792458 ** 2) / ref.kinetic,
      1,
      1e-12,
    );
  }
  near(
    sample("radiation", { field: 0.1 }).betaRadius,
    2 * sample("radiation", { field: 0.2 }).betaRadius,
  );
  const a = sample("radiation", { field: 0.1 }, 1e-8),
    b = sample("radiation", { field: -0.1 }, 1e-8);
  near(a.alphaX, b.alphaX);
  near(a.alphaY, -b.alphaY);
  assert.ok(a.alphaY * a.betaY < 0);
  near(a.gammaX, 299792458e-8);
});
test("zero and weak magnetic fields have continuous straight-beam limits", () => {
  const zero = sample("radiation", { field: 0 }, 1e-8),
    weak = sample("radiation", { field: 1e-10 }, 1e-8);
  assert.equal(zero.alphaRadius, null);
  near(zero.alphaY, 0);
  near(zero.alphaX, weak.alphaX);
  near(zero.betaX, weak.betaX);
  assert.ok(Math.abs(weak.betaY) < 1e-5);
});
test("rectified waveform numerical cycle means and RMS agree with analytic formulas", () => {
  for (const mode of [0, 1]) {
    let sum = 0,
      square = 0;
    const n = 20000,
      p = { ...DEFAULTS.rectifier, mode, frequency: 50 };
    for (let i = 0; i < n; i++) {
      const q = sample("rectifier", p, (i + 0.5) / (n * p.frequency));
      sum += q.output;
      square += q.output ** 2;
      assert.ok(q.output >= 0);
    }
    const q = sample("rectifier", p);
    near(sum / n, q.mean, 1e-8);
    near(Math.sqrt(square / n), q.rms, 1e-10);
    near(q.power, q.rms ** 2 / p.resistance);
    near(q.rippleFrequency, (mode ? 2 : 1) * p.frequency);
  }
});
test("thermal lamp warms, current falls, and integrated energy closes the electrical-thermal budget", () => {
  const p = DEFAULTS.filament,
    s = lamp(p, 5),
    q = P.samplePractical("filament", s, p),
    initial = sample("filament");
  assert.ok(q.temperature > P.LAMP_AMBIENT);
  assert.ok(q.current < initial.current);
  near(q.input, q.loss + q.thermal, 1e-10);
  assert.ok(q.loss > 0 && q.thermal > 0);
  assert.ok(Math.abs(q.power - q.lossPower) / q.power < 0.02);
});
test("thermal lamp converges and remains finite across supported parameter corners", () => {
  const p = DEFAULTS.filament,
    a = lamp(p, 1, 1 / 8000),
    b = lamp(p, 1, 1 / 16000);
  near(a.temperature, b.temperature, 1e-9);
  for (const voltage of [0, 12])
    for (const coldResistance of [0.5, 5])
      for (const capacity of [0.002, 0.05])
        for (const area of [1e-5, 1e-4]) {
          const p = { voltage, coldResistance, capacity, area },
            q = P.samplePractical("filament", lamp(p, 3), p);
          assert.ok(
            q.temperature >= P.LAMP_AMBIENT - 1e-9 && q.temperature < 4000,
          );
          for (const v of Object.values(q)) assert.ok(Number.isFinite(v));
          near(q.balance, 0, 1e-7);
        }
});
test("Newton cooling gives the one-time-constant fraction and conserves released plus remaining excess energy", () => {
  const a = sample("cooling"),
    b = sample("cooling", {}, a.tau);
  near((b.temperature - 20) / (90 - 20), Math.exp(-1));
  near(b.released + b.remaining, a.remaining);
  near(sample("cooling", { conductance: 4 }).tau, a.tau / 2);
});
test("air-column modes respect open pressure nodes, closed displacement nodes and harmonic selection", () => {
  for (const mode of [0, 1])
    for (const count of [1, 2, 5]) {
      const a = sample("resonance", { mode, count, probe: 0 }, 0.002),
        b = sample("resonance", { mode, count, probe: 1 }, 0.002);
      near(b.pressure, 0);
      near(mode ? a.displacement : a.pressure, 0);
      assert.equal(a.harmonic, mode ? 2 * count - 1 : count);
    }
  near(
    sample("resonance", { length: 1 }).frequency,
    sample("resonance", { length: 2 }).frequency * 2,
  );
});
test("photoelectric threshold, energy balance and saturation current distinguish frequency from power", () => {
  const a = sample("photoelectric"),
    b = sample("photoelectric", { power: 2e-6 });
  near(
    a.kinetic + a.photon * 0 + DEFAULTS.photoelectric.work * 1.602176634e-19,
    a.photon,
    1e-30,
  );
  near(b.current, 2 * a.current);
  near(b.kinetic, a.kinetic, 1e-30);
  const off = sample("photoelectric", { frequency: 3e14, work: 5 });
  assert.equal(off.emission, 0);
  assert.equal(off.current, 0);
  assert.equal(off.kinetic, 0);
});
test("Bragg diffraction uses electron momentum, permits only valid orders and decreases wavelength with voltage", () => {
  const p = DEFAULTS.bragg,
    q = sample("bragg");
  near(
    2 * p.spacing * Math.sin((q.angle * Math.PI) / 180),
    p.order * q.wavelength,
    1e-22,
  );
  near(q.wavelength * q.momentum, P.PLANCK, 1e-40);
  assert.ok(sample("bragg", { voltage: 10000 }).wavelength < q.wavelength);
  assert.equal(
    sample("bragg", { voltage: 500, spacing: 5e-11, order: 5 }).angle,
    null,
  );
  assert.throws(
    () => createCurriculum("bragg", { ...p, order: 1.5 }),
    RangeError,
  );
});
test("ideal polarisers obey Malus law, crossed extinction and three-filter transmission", () => {
  near(sample("polarisation", { angle: 0 }).output, 50);
  near(sample("polarisation", { angle: 90 }).output, 0, 1e-25);
  near(
    sample("polarisation", { mode: 1, angle: 45, thirdAngle: 90 }).output,
    12.5,
  );
  near(sample("polarisation", { angle: 180 }).output, 50);
});
test("exact crossed-field paths satisfy force balance, differential equations and electric work", () => {
  const p = { ...DEFAULTS.selector },
    balanced = P.selectorPosition(p, 2e-6);
  near(balanced.y, 0);
  near(balanced.vx, p.speed);
  for (const speed of [1e5, 3e5, 2e6]) {
    const p = { ...DEFAULTS.selector, speed },
      t = 1.1e-6,
      dt = 1e-11,
      a = P.selectorPosition(p, t - dt),
      b = P.selectorPosition(p, t + dt),
      q = sample("selector", p, t),
      omega = (1.602176634e-19 * p.field) / P.PROTON_MASS;
    near((b.vx - a.vx) / (2 * dt), -omega * q.vy, 2e-9);
    near((b.vy - a.vy) / (2 * dt), omega * (q.vx - q.selected), 2e-9);
    near(
      (q.kinetic - 0.5 * P.PROTON_MASS * p.speed ** 2) / 1.602176634e-19,
      -p.electricField * q.y,
      1e-9,
    );
  }
});
test("steady driven oscillator solves its differential equation and mean power equals damping loss", () => {
  for (const drive of [0.1, 1, 3.1]) {
    const p = { ...DEFAULTS.driven, drive },
      t = 0.123,
      q = sample("driven", p, t),
      acc = -((2 * Math.PI * drive) ** 2) * q.displacement;
    near(
      p.mass * acc + p.damping * q.velocity + p.k * q.displacement,
      p.force * Math.cos(2 * Math.PI * drive * t),
    );
    near(q.power, 0.5 * p.damping * (2 * Math.PI * drive * q.amplitude) ** 2);
  }
  near(sample("driven", { drive: Math.sqrt(40) / (2 * Math.PI) }).phaseLag, 90);
});
test("gas paths satisfy pV=nRT, first law and analytic isothermal/isobaric/adiabatic invariants", () => {
  for (const mode of [0, 1, 2])
    for (const ratio of [0.5, 1, 3]) {
      const p = { ...DEFAULTS.gasprocess, mode, ratio },
        q = sample("gasprocess", p, 6);
      near(q.pressure * q.volume, p.amount * 8.314462618 * q.temperature);
      near(q.internal, q.heat - q.work);
      if (mode === 0) {
        near(q.temperature, p.initial);
        near(q.internal, 0);
      }
      if (mode === 1) near(q.pressure, q.initialPressure);
      if (mode === 2) {
        near(q.heat, 0);
        near(
          q.temperature * q.volume ** (2 / 3),
          p.initial * p.volume ** (2 / 3),
        );
      }
    }
});
test("Planck spectrum peaks at Wien wavelength and integrates to Stefan–Boltzmann radiance", () => {
  const T = 5800,
    peak = sample("blackbody").peak;
  assert.ok(P.planckSpectrum(peak, T) > P.planckSpectrum(peak * 0.99, T));
  assert.ok(P.planckSpectrum(peak, T) > P.planckSpectrum(peak * 1.01, T));
  const n = 30000,
    lo = 1e-9,
    hi = 0.01,
    logStep = Math.log(hi / lo) / n;
  let integral = 0;
  for (let i = 0; i < n; i++) {
    const x = lo * Math.exp((i + 0.5) * logStep);
    integral += P.planckSpectrum(x, T) * x * logStep;
  }
  near(Math.PI * integral, P.SIGMA * T ** 4, 1e-7);
  near(
    sample("blackbody", { temperature: 2900 }).power * 16,
    sample("blackbody").power,
  );
});
test("Young modulus distinguishes material stress–strain from geometry-dependent wire stiffness", () => {
  const p = DEFAULTS.materials,
    a = sample("materials", {}, 4),
    b = sample("materials", { length: 2 }, 4);
  near(a.stress / a.strain, p.young);
  near(b.extension, 2 * a.extension);
  near(b.strain, a.strain);
  near(a.energy, 0.5 * a.force * a.extension);
  near(a.stiffness, (p.young * p.area) / p.length);
});
test("all sixteen additions validate presets and actually advance with finite samples and parameter sweeps", () => {
  assert.equal(P.PRACTICAL_IDS.length, 16);
  for (const id of P.PRACTICAL_IDS) {
    const d = LABS[id];
    for (const [, p] of d.presets) {
      let s = d.create(p).state;
      for (let i = 0; i < 80; i++) s = d.step(s, p, d.h);
      for (const v of Object.values(sampleCurriculum(id, s, p)))
        assert.ok(v === null || Number.isFinite(v), id);
    }
    if (d.sweep) {
      const rows = curriculumRows(
        `curriculum:${id}`,
        d.create(d.defaults).state,
        d.defaults,
      );
      assert.equal(rows.length, 161);
      for (const row of rows)
        for (const v of Object.values(row))
          assert.ok(v === null || Number.isFinite(v), id);
    }
  }
  const p = { ...DEFAULTS.sensors, mode: 1 },
    rows = curriculumRows("curriculum:sensors", { t: 0 }, p);
  near(rows[0].x, 0);
  near(rows.at(-1).x, 80);
  assert.ok(rows[0].resistance > rows.at(-1).resistance);
});
