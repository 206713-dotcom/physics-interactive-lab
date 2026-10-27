import test from "node:test";
import assert from "node:assert/strict";
import {
  createBuoyancy,
  stepBuoyancy,
  buoyancySample,
  TANK_DEPTH,
  SUPPORT_HEIGHT,
} from "../js/buoyancy-physics.js";
import {
  createCurriculum,
  stepCurriculum,
  DEFAULTS,
} from "../js/curriculum-physics.js";
import { createCurriculumScene } from "../js/scene-curriculum.js";
import * as T from "../vendor/three.module.min.js";
const params = (patch) => ({ ...DEFAULTS.buoyancy, ...patch });
const near = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);
function run(p, seconds, h = 1 / 120) {
  let s = createBuoyancy(p);
  for (let t = 0; t < seconds - 1e-10; t += h)
    s = stepBuoyancy(s, p, Math.min(h, seconds - t));
  return s;
}
test("release is fully immersed at rest; initial acceleration comes from actual displaced liquid", () => {
  for (const density of [100, 600, 1000, 15000]) {
    const p = params({ density }),
      s = createBuoyancy(p),
      q = buoyancySample(s, p);
    near(q.fraction, 1);
    near(q.a, 9.81 * (p.fluid / p.density - 1));
    near(q.net, q.mass * q.a);
    near(q.drag, 0);
  }
});
test("the reported 15 kg screenshot case actually sinks and rests on a support with all forces balanced", () => {
  const p = params({ density: 15000 }),
    s = run(p, 9),
    q = buoyancySample(s, p);
  assert.equal(s.grounded, true);
  near(s.y, SUPPORT_HEIGHT + q.side / 2);
  near(s.v, 0);
  near(q.weight, 147.15);
  near(q.upthrust, 9.81);
  near(q.normal, 137.34);
  near(q.net, 0);
  assert.equal(q.status, 0);
});
test("light cubes rise and converge to Archimedes floating immersion without being pinned to it", () => {
  for (const density of [100, 600, 900]) {
    const p = params({ density }),
      start = createBuoyancy(p),
      s = run(p, 180),
      q = buoyancySample(s, p);
    assert.ok(s.y > start.y);
    near(q.fraction, density / p.fluid, 0.00015);
    assert.ok(Math.abs(s.v) < 0.00015);
    near(q.upthrust, q.weight, 0.0015);
    assert.equal(s.grounded, false);
  }
});
test("equal-density submerged cube stays suspended across both small and maximum supported time steps", () => {
  const p = params({ density: 1000 }),
    s = createBuoyancy(p),
    b = stepBuoyancy(s, p, 60);
  near(b.y, s.y);
  near(b.v, 0);
  near(b.t, 60);
  assert.equal(buoyancySample(b, p).status, 3);
});
test("drag always dissipates energy and pressure-probe depth cannot alter the tank motion", () => {
  const p = params({}),
    s = createBuoyancy(p);
  for (const v of [-2, -0.2, 0, 0.2, 2]) {
    const q = buoyancySample({ ...s, v }, p);
    assert.ok(q.drag * v <= 0);
  }
  const a = stepBuoyancy(s, p, 0.7),
    b = stepBuoyancy(s, { ...p, depth: 5 }, 0.7);
  assert.deepEqual(a, b);
  near(buoyancySample(s, { ...p, depth: 2 }).pressure, 19620);
});
test("RK4 results converge when halving the integration step; stepping never mutates its input", () => {
  const p = params({ density: 600 }),
    s = createBuoyancy(p),
    saved = structuredClone(s);
  stepBuoyancy(s, p, 0.5);
  assert.deepEqual(s, saved);
  const a = run(p, 2, 1 / 120),
    b = run(p, 2, 1 / 240);
  near(a.y, b.y, 2e-6);
  near(a.v, b.v, 2e-5);
});
test("all density/fluid/volume corner combinations remain finite, bounded and above the support", () => {
  for (const density of [100, 15000])
    for (const fluid of [500, 14000])
      for (const volume of [0.0002, 0.005]) {
        const p = params({ density, fluid, volume });
        let s = createBuoyancy(p);
        for (let i = 0; i < 30; i++) {
          s = stepBuoyancy(s, p, 1);
          const q = buoyancySample(s, p);
          assert.ok(Object.values(q).every(Number.isFinite));
          assert.ok(s.y >= SUPPORT_HEIGHT + q.side / 2 - 1e-10);
          assert.ok(s.y < TANK_DEPTH + 0.5);
          assert.ok(q.fraction >= 0 && q.fraction <= 1);
        }
      }
  assert.throws(
    () => stepBuoyancy({ t: 0, y: NaN, v: 0 }, params({}), 0.1),
    RangeError,
  );
});
test("the curriculum and 3D builder use the integrated position without changing state or adding meshes", () => {
  const p = params({ density: 15000 }),
    run = createCurriculum("buoyancy", p),
    root = new T.Group(),
    scene = createCurriculumScene("buoyancy", p, root, { labels: false });
  scene.update(run);
  const before = root.children.map((o) => o.position.y),
    count = root.children.length;
  run.state = stepCurriculum("buoyancy", run.state, p, 2);
  const saved = JSON.stringify(run);
  scene.update(run);
  assert.ok(
    root.children.some((o, i) => Math.abs(o.position.y - before[i]) > 0.5),
  );
  assert.equal(root.children.length, count);
  assert.equal(JSON.stringify(run), saved);
  root.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });
});
