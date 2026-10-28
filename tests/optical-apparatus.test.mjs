import test from "node:test";
import assert from "node:assert/strict";
import * as T from "../vendor/three.module.min.js";
import { SIMULATIONS } from "../js/simulations.js";
import { createSceneKit } from "../js/scene-kit.js";
import { lensConstruction, refractionConstruction } from "../js/optical-construction.js";
import { createLensApparatus, createRefractionApparatus, lensGeometry } from "../js/scene-optical-bench.js";
import { createWaveBench } from "../js/scene-wave-bench.js";
import { createRCBench } from "../js/scene-rc-bench.js";
import { waveAt, circuitAt } from "../js/physics-extra.js";
import { fieldAt } from "../js/physics-extra.js";
import { SceneView } from "../js/scene3d.js";
import { calculationOutcome, calculationSheet } from "../js/calculations.js";
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);
const dispose = (root) => root.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
function build(type, p = SIMULATIONS[type].defaults) {
  const run = SIMULATIONS[type].create(p), root = new T.Group(), options = { labels: false };
  const scene = type === "lenses" ? createLensApparatus(run.params, createSceneKit(root, options))
    : type === "refraction" ? createRefractionApparatus(run.params, root, 0xffc584, options)
    : type === "waves" ? createWaveBench(run.params, root, options)
    : createRCBench(run.params, root, options);
  return { run, root, scene };
}
function update(type, scene, run, t) {
  const lab = { ...run, state: { ...run.state, t }, running: false, vectors: true, showLabels: true };
  if (type === "lenses") scene.update(lab.state, {}, lab); else scene.update(lab);
}

test("shaped lens surfaces distinguish thick-centre converging from thin-centre diverging lenses", () => {
  for (const kind of [-1, 1]) {
    const g = lensGeometry(kind), p = g.attributes.position;
    let center = 0, edge = 0;
    for (let i = 0; i < p.count; i++) {
      const r = Math.hypot(p.getY(i), p.getZ(i));
      if (r < 1e-5) center = Math.max(center, Math.abs(p.getX(i)));
      if (r > 1.16) edge = Math.max(edge, Math.abs(p.getX(i)));
    }
    assert.ok(kind > 0 ? center > edge : center < edge);
    assert.ok(p.array.every(Number.isFinite)); g.dispose();
  }
});

test("both principal rays intersect the exact real or virtual image, preserving signed magnification", () => {
  for (const kind of [-1, 1]) for (const object of [0.06, 0.1, 0.3, 0.6, 1.5]) {
    const p = { ...SIMULATIONS.lenses.defaults, kind, object }, q = lensConstruction(p);
    near((q.image[1] - q.axis) / q.height, q.magnification);
    for (const ray of q.rays) {
      const [, a, b] = ray, slope = (b[1] - a[1]) / (b[0] - a[0]);
      near(a[1] + slope * q.image[0], q.image[1]);
    }
    assert.equal(q.extensions.length, q.image[0] < 0 && !q.offBench ? 2 : 0);
  }
});

test("focus gives parallel rays and a distant image is omitted rather than clamped to a false distance", () => {
  const p = SIMULATIONS.lenses.defaults, focus = lensConstruction({ ...p, object: p.focal });
  assert.equal(focus.image, null);
  const slope = ([, a, b]) => (b[1] - a[1]) / (b[0] - a[0]);
  near(slope(focus.rays[0]), slope(focus.rays[1]));
  const { root, scene } = build("lenses", { ...p, object: p.focal + 1e-7 });
  assert.equal(scene.construction.offBench, true);
  const images = []; root.traverse((o) => { if (o.userData.role === "optical-image") images.push(o); });
  assert.equal(images.length, 0);
  assert.ok(scene.construction.image[0] > 4.15); dispose(root);
});

test("the inspector describes focus and TIR without inventing a distance or refracted angle", () => {
  const p = { ...SIMULATIONS.lenses.defaults, object: 0.15, focal: 0.15 },
    sheet = calculationSheet("lenses", { t: 0 }, p);
  assert.equal(sheet.calculations[0].value, null);
  assert.equal(calculationOutcome("lenses", sheet.calculations[0]), "Image at infinity");
  assert.equal(calculationOutcome("refraction", { id: "angle", value: null, unit: "°" }), "No transmitted ray (TIR)");
  assert.equal(calculationOutcome("refraction", { id: "critical", value: null, unit: "°" }), "No critical angle for this direction");
  assert.equal(calculationOutcome("refraction", { id: "angle", value: 35, unit: "°" }), "35 °");
});

test("Snell rays use angles from the normal, conserve Fresnel power, and suppress the TIR transmission branch", () => {
  for (const [n1, n2, angle] of [[1, 1.5, 0], [1, 1.5, 70], [1.5, 1, 30], [1.5, 1, 60], [1.2, 1.2, 55]]) {
    const p = { ...SIMULATIONS.refraction.defaults, n1, n2, angle }, q = refractionConstruction(p),
      { root, scene } = build("refraction", p);
    near(q.reflectance + q.transmission, 1);
    const incoming = q.incident[0].map((v, i) => v - q.hit[i]);
    near(Math.atan2(Math.abs(incoming[0]), incoming[1]) * 180 / Math.PI, angle);
    if (!q.tir) {
      const v = q.transmitted[1].map((x, i) => x - q.hit[i]);
      near(n1 * Math.sin(angle * Math.PI / 180), n2 * Math.abs(v[0]) / Math.hypot(...v));
    } else { assert.equal(q.transmitted, null); assert.equal(scene.branches.transmitted, false); }
    if (n1 === n2) { near(q.refracted, angle); assert.equal(scene.branches.reflected, false); }
    dispose(root);
  }
});

test("wave beads keep fixed horizontal positions and the probe matches the graphed superposition", () => {
  const p = { ...SIMULATIONS.waves.defaults, amplitude: 0.6, reflection: 1, probe: 2.35 },
    { root, scene, run } = build("waves", p),
    probe = scene.kit.objects.find((o) => o.userData.role === "wave-probe"),
    beads = scene.kit.objects.find((o) => o.isInstancedMesh && o.count === 33), m = new T.Matrix4();
  for (const t of [0, 0.137, 0.5, 1.2]) {
    update("waves", scene, run, t);
    near(probe.position.x, p.probe - 4);
    near(probe.position.y, 2.05 + 1.5 * waveAt(p.probe, t, p).resultant);
    for (let i = 0; i < 33; i++) {
      beads.getMatrixAt(i, m); near(m.elements[12], i / 32 * 8 - 4);
      near(m.elements[13], 2.05 + 1.5 * waveAt(i / 32 * 8, t, p).resultant);
    }
  }
  dispose(root);
});

test("RC current markers stay out of the capacitor gap and point along their actual travel in both modes", () => {
  for (const discharge of [0, 1]) {
    const p = { ...SIMULATIONS.circuits.defaults, discharge }, { root, scene, run } = build("circuits", p), tau = p.resistance * p.capacitance;
    for (const points of scene.conductorPaths) for (let i = 1; i < points.length; i++) for (let j = 0; j <= 40; j++) {
      const a = points[i - 1], b = points[i], v = a.map((x, k) => x + (b[k] - x) * j / 40);
      assert.ok(!(Math.abs(v[0] - 2.9) < 0.64 && v[1] > 0.35 && v[1] < 1.85 && Math.abs(v[2]) < 0.17), "marker conductor must not cross the dielectric");
    }
    update("circuits", scene, run, tau * 0.23);
    const markers = scene.kit.objects.filter((o) => o.userData.role === "direction-marker"),
      before = markers.map((o) => ({ p: o.position.clone(), d: new T.Vector3(0, 1, 0).applyQuaternion(o.quaternion) }));
    update("circuits", scene, run, tau * 0.23 + 1e-6);
    markers.forEach((o, i) => assert.ok(o.position.clone().sub(before[i].p).dot(before[i].d) > 0));
    dispose(root);
  }
});

test("capacitor charge markers and paused in-scene voltage/current follow the same exact RC state", () => {
  for (const discharge of [0, 1]) {
    const p = { ...SIMULATIONS.circuits.defaults, discharge }, { root, scene, run } = build("circuits", p), tau = p.resistance * p.capacitance;
    for (const t of [0, tau * 0.73, tau, tau * 8]) {
      update("circuits", scene, run, t);
      const q = circuitAt(t, p), charged = scene.kit.objects.filter((o) => /^capacitor-/.test(o.userData.role || ""));
      charged.forEach((o) => assert.equal(o.count, Math.round(12 * q.voltage / p.voltage)));
      const labels = scene.kit.annotations.map((o) => o.userData.text);
      assert.ok(labels.some((s) => s.startsWith("V_C = ")));
      assert.ok(labels.some((s) => s.startsWith("I = ") && s.endsWith("mA")));
      if (t === tau) assert.ok(labels.includes("V_C = " + q.voltage.toFixed(2) + " V"));
    }
    dispose(root);
  }
});

test("the rebuilt apparatus stays finite and immutable at presets and supported parameter endpoints without geometry growth", () => {
  for (const type of ["lenses", "refraction", "waves", "circuits"]) {
    const d = SIMULATIONS[type], setups = [d.defaults, ...d.presets.map((x) => ({ ...d.defaults, ...x[1] }))];
    for (const [key, bounds] of Object.entries(d.limits)) for (const value of bounds) setups.push({ ...d.defaults, [key]: value });
    for (const p of setups) {
      const { root, scene, run } = build(type, p), saved = JSON.stringify(run), before = [];
      root.traverse((o) => before.push([o, o.geometry]));
      for (const t of [0, 0.17, 2]) {
        update(type, scene, run, t); root.updateMatrixWorld(true);
        root.traverse((o) => {
          assert.ok(o.matrixWorld.elements.every(Number.isFinite), type + " transform");
          if (o.isInstancedMesh) assert.ok(o.instanceMatrix.array.every(Number.isFinite), type + " instances");
        });
      }
      const after = []; root.traverse((o) => after.push([o, o.geometry]));
      assert.deepEqual(after, before); assert.equal(JSON.stringify(run), saved); dispose(root);
    }
  }
});

test("reorganising scene dispatch preserves the electric-field probe direction and zero-field hiding", () => {
  for (const p of [SIMULATIONS.fields.defaults, { ...SIMULATIONS.fields.defaults, q1: 0, q2: 0 }]) {
    const root = new T.Group(), probe = new T.Object3D(), arrow = new T.ArrowHelper(),
      view = Object.assign(Object.create(SceneView.prototype), {
        type: "fields", key: JSON.stringify(p), root, objects: { probe, fieldArrow: arrow },
        trackedLabels: [], firstFrame: true, canvas: { clientWidth: 720, clientHeight: 400 }, w: 720, h: 400,
        scene: new T.Scene(), camera: new T.PerspectiveCamera(38, 1.8, 0.05, 200),
        target: new T.Vector3(), radius: 15, azimuth: 0, polar: 1,
        grid: { material: { opacity: 0.3, uniforms: { opacity: { value: 0.3 } } } },
        renderer: { render() {} },
      });
    root.add(probe, arrow);
    view.update({ type: "fields", params: p, state: { t: 0 }, vectors: true });
    const field = fieldAt(p.probeX, p.probeY, p);
    assert.equal(arrow.visible, field.valid && field.magnitude > 1e-8);
    if (arrow.visible) {
      const direction = new T.Vector3(0, 1, 0).applyQuaternion(arrow.quaternion);
      near(direction.x, field.ex / field.magnitude); near(direction.y, field.ey / field.magnitude);
    }
    dispose(root);
  }
});
