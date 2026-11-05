import test from "node:test";
import assert from "node:assert/strict";
import * as T from "../vendor/three.module.min.js";
import { SIMULATIONS } from "../js/simulations.js";
import { mirrorConstruction, dispersionConstruction, dispersionFronts,
  polarisationConstruction, polarisationWave } from "../js/optical-construction.js";
import { polarisationProjection } from "../js/practical-physics.js";
import { createCurriculumScene } from "../js/scene-curriculum.js";
import { studyReadings, studyParams } from "../js/study-policy.js";

const near = (a, b, eps = 1e-10) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);
const dispose = root => root.traverse(o => { o.geometry?.dispose(); o.material?.dispose?.(); });
const difference = (a, b) => a.map((v, i) => v - b[i]);

test("plane-mirror distance changes both equal distances on a fixed scale, independently of the incident ray", () => {
  const p = SIMULATIONS.mirror.defaults, original = mirrorConstruction(p);
  for (const distance of [0.5, 2, 5]) for (const angle of [0, 35, 80]) {
    const q = mirrorConstruction({ ...p, distance, angle });
    near(q.mirrorX - q.object[0], distance * 0.36);
    near(q.image[0] - q.mirrorX, distance * 0.36);
    near(q.image[1] - q.axis, q.height);
    const incoming = difference(q.hit, q.incident[0]), outgoing = difference(q.reflected[1], q.hit);
    near(incoming[0], -outgoing[0]); near(incoming[1], outgoing[1]);
    near(Math.atan2(Math.abs(incoming[1]), incoming[0]) * 180 / Math.PI, angle);
    if (distance === p.distance) assert.deepEqual(q.object, original.object);
    if (angle === p.angle) assert.deepEqual(q.incident, original.incident);
  }
});

test("two actual reflected mirror rays back-project to the same virtual image at every supported distance", () => {
  for (const distance of [0.5, 1, 2, 5]) {
    const q = mirrorConstruction({ ...SIMULATIONS.mirror.defaults, distance });
    for (const [source, hit, end] of q.rays) {
      const a = difference(hit, source), b = difference(end, hit), back = difference(q.image, hit);
      near(a[0], -b[0]); near(a[1], b[1]);
      near(back[1] / back[0], b[1] / b[0]);
      assert.ok(end[0] < q.mirrorX && q.image[0] > q.mirrorX);
    }
  }
});

test("dispersion uses true Snell angles and Cauchy units, with constant optical frequency", () => {
  for (const wavelength of [400e-9, 550e-9, 700e-9]) for (const angle of [0, 40, 75])
    for (const [a, b] of [[1.3, 0.001], [1.8, 0.01]]) {
      const p = { ...SIMULATIONS.dispersion.defaults, wavelength, angle, a, b }, q = dispersionConstruction(p),
        v = difference(q.transmitted[1], q.hit), length = Math.hypot(...v);
      near(q.index, a + b / (wavelength * 1e6) ** 2);
      near(Math.sin(angle * Math.PI / 180), q.index * Math.abs(v[1]) / length);
      near(q.wavelength / wavelength, 1 / q.index);
      near(q.speed / 299792458, 1 / q.index);
      near((q.speed / q.wavelength) / (299792458 / wavelength), 1);
      assert.ok(q.references[0].index > q.references[2].index);
      assert.ok(q.references[0].refraction <= q.references[2].refraction);
    }
});

test("animated wavefronts have the calculated spacing and speed ratios and cross the boundary in phase", () => {
  for (const wavelength of [400e-9, 700e-9]) {
    const q = dispersionConstruction({ ...SIMULATIONS.dispersion.defaults, wavelength });
    const distance = (front, start, direction) => front[0].map((v, i) => (v + front[1][i]) / 2 - start[i]).reduce((sum, v, i) => sum + v * direction[i], 0);
    const positions = (t, material) => dispersionFronts(q, t, material).map(f => distance(f,
      material ? q.hit : q.incident[0], material ? q.materialDirection : q.airDirection));
    const air = positions(0.333, false), glass = positions(0.333, true);
    near(air[1] - air[0], q.spacing);
    near(glass[1] - glass[0], q.spacing / q.index);
    near(positions(0.334, false)[0] - air[0], q.displaySpeed * 0.001);
    near(positions(0.334, true)[0] - glass[0], q.displaySpeed / q.index * 0.001);
    const arrival = q.airLength / q.displaySpeed + 2 * q.spacing / q.displaySpeed;
    assert.ok(Math.min(...positions(arrival, false).map(d => Math.abs(d - q.airLength))) < 1e-9);
    const materialOffset = positions(arrival, true)[0];
    assert.ok(Math.min(materialOffset, q.spacing / q.index - materialOffset) < 1e-9);
    assert.ok(dispersionFronts(q, arrival, true).length <= 36);
  }
});

test("crossed polarisers are exactly dark and inserting a 45-degree filter restores one eighth of unpolarised input", () => {
  const p = SIMULATIONS.polarisation.defaults;
  for (const angle of [90, -90, 270]) assert.equal(polarisationProjection(angle), 0);
  const crossed = polarisationConstruction({ ...p, angle: 90, mode: 0 }),
    middle = polarisationConstruction({ ...p, angle: 45, thirdAngle: 90, mode: 1 });
  assert.equal(crossed.output, 0); assert.equal(crossed.amplitudes[1], 0);
  near(middle.output, p.intensity / 8);
  assert.deepEqual(crossed.xs, [-2.7, 2.7]); assert.deepEqual(middle.xs, [-2.7, 0, 2.7]);
});

test("signed transverse fields preserve Malus intensity and physical phase through 180 degrees", () => {
  const p = SIMULATIONS.polarisation.defaults;
  for (const mode of [0, 1]) for (const angle of [0, 45, 90, 135, 180]) {
    const q = polarisationConstruction({ ...p, mode, angle, thirdAngle: 90 });
    q.intensities.forEach((intensity, i) => near(q.amplitudes[i] ** 2 * p.intensity, intensity));
  }
  const parallel = polarisationConstruction({ ...p, angle: 0 }), reversed = polarisationConstruction({ ...p, angle: 180 });
  polarisationWave(parallel, 1, 0.173).forEach((a, i) => {
    const b = polarisationWave(reversed, 1, 0.173)[i]; a.forEach((v, j) => near(v, b[j]));
  });
});

test("polarisation edits reuse all meshes and buffers, rotate real axes and extinguish the actual screen", () => {
  const run = SIMULATIONS.polarisation.create(SIMULATIONS.polarisation.defaults), root = new T.Group(),
    scene = createCurriculumScene("polarisation", run.params, root, { labels: false }), nodes = [];
  root.traverse(o => nodes.push(o));
  const meshes = nodes.filter(o => o.isMesh), geometry = meshes.map(o => o.geometry),
    middle = nodes.find(o => o.userData.role === "polarisation-filter" && o.userData.slot === 1),
    screen = nodes.find(o => o.userData.role === "polarisation-screen");
  const snapshot = JSON.stringify(run);
  for (const params of [{ ...run.params, mode: 0, angle: 90 }, { ...run.params, mode: 1, angle: 45, thirdAngle: 90 }, { ...run.params, mode: 1, angle: 90, thirdAngle: 90 }]) {
    const lab = { ...run, params, vectors: false, showLabels: true };
    scene.update(lab);
    assert.equal(middle.visible, !!params.mode);
    near(screen.userData.intensity, polarisationConstruction(params).output);
    assert.equal(screen.material.emissiveIntensity === 0, screen.userData.intensity === 0);
    let count = 0; root.traverse(() => count++); assert.equal(count, nodes.length);
    meshes.forEach((mesh, i) => assert.equal(mesh.geometry, geometry[i]));
    for (const mesh of meshes.filter(o => o.isInstancedMesh)) assert.ok(mesh.instanceMatrix.array.every(Number.isFinite));
  }
  assert.equal(scene.liveParams, true); assert.equal(JSON.stringify(run), snapshot); dispose(root);
});

test("mirror object and image remain visible when direction indicators are switched off", () => {
  const run = SIMULATIONS.mirror.create(SIMULATIONS.mirror.defaults), root = new T.Group(),
    scene = createCurriculumScene("mirror", run.params, root, { labels: false });
  scene.update({ ...run, vectors: false, showLabels: true });
  for (const role of ["mirror-object", "mirror-image"]) {
    const objects = []; root.traverse(o => { if (o.userData.role === role) objects.push(o); });
    assert.equal(objects.length, 1); assert.equal(objects[0].visible, true);
  }
  dispose(root);
});

test("polarisation instruments show the final output when an extension filter is inserted", () => {
  const definition = SIMULATIONS.polarisation;
  for (const mode of [0, 1]) {
    const p = { ...definition.defaults, mode, angle: 45, thirdAngle: 90 },
      readings = studyReadings("polarisation", { t: 0 }, p, "alevel", definition), q = polarisationConstruction(p);
    assert.equal(readings.length, mode ? 3 : 2);
    near(readings.at(-1).value, q.output);
    if (mode) near(readings[1].value, q.second);
  }
});

test("IGCSE nanometre endpoints accept display conversion round-off and still reject invalid wavelengths", () => {
  const definition = SIMULATIONS.dispersion;
  const control = definition.controls.find(c => c.key === 'wavelength');
  assert.equal(control.min, 400); assert.equal(control.max, 700);
  for (const nm of [400, 700]) {
    const p = studyParams("dispersion", "igcse", definition, { wavelength: nm * 1e-9 });
    assert.doesNotThrow(() => definition.create(p));
    near(p.wavelength / (nm === 400 ? definition.limits.wavelength[0] : definition.limits.wavelength[1]), 1, 1e-14);
  }
  for (const nm of [399.999999, 700.000001])
    assert.throws(() => studyParams("dispersion", "igcse", definition, { wavelength: nm * 1e-9 }), /between 400 and 700 nm/);
});
