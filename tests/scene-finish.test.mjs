import test from "node:test";
import assert from "node:assert/strict";
import * as T from "../vendor/three.module.min.js";
import { roundedBox } from "../js/scene-finish.js";
import { createHelix, createDetailedMechanics } from "../js/scene-precision.js";
import { SIMULATIONS } from "../js/simulations.js";
import { createCurriculumScene } from "../js/scene-curriculum.js";
import { TANK_DEPTH } from "../js/buoyancy-physics.js";
import { orbitalReference } from "../js/orbital-reference.js";
import { G, centralRadius } from "../js/physics.js";

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);
const clean = (root) => root.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
function finite(root) {
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    assert.ok(o.matrixWorld.elements.every(Number.isFinite));
    for (const a of Object.values(o.geometry?.attributes || {})) assert.ok(a.array.every(Number.isFinite));
  });
}

test("bevelled apparatus preserves its specified dimensions and has unit surface normals", () => {
  for (const dimensions of [[4, 3, 2], [0.08, 5, 0.08], [0.1, 0.1, 0.1]]) {
    const g = roundedBox(...dimensions);
    g.computeBoundingBox();
    const size = g.boundingBox.getSize(new T.Vector3());
    dimensions.forEach((d, i) => near(size.getComponent(i), d));
    const n = g.attributes.normal;
    for (let i = 0; i < n.count; i++) near(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)), 1);
    g.dispose();
  }
});

test("solid spring keeps a constant wire cross-section while pitch changes, with no buffer replacement", () => {
  const helix = createHelix(), g = helix.geometry, p = g.attributes.position, n = g.attributes.normal;
  for (const length of [0.5, 2.12, 4, 8]) {
    helix.update(length);
    assert.equal(g.attributes.position, p);
    assert.equal(g.attributes.normal, n);
    for (let i = 0; i <= 288; i += 12) for (let j = 0; j <= 8; j++) {
      const a = i / 288 * 24 * Math.PI, index = i * 9 + j;
      near(Math.hypot(p.getX(index) - i / 288 * length, p.getY(index) - 0.19 * Math.cos(a), p.getZ(index) - 0.19 * Math.sin(a)), 0.032);
      near(Math.hypot(n.getX(index), n.getY(index), n.getZ(index)), 1);
    }
  }
  g.dispose();
});

test("detailed spring reads exact displacement and energy without changing states or allocating geometry", () => {
  for (const displacement of [-0.8, 0, 0.8]) {
    const d = SIMULATIONS.spring, run = d.create({ ...d.defaults, displacement }), root = new T.Group(),
      scene = createDetailedMechanics("spring", run.params, root, { labels: false });
    const meshes = []; root.traverse((o) => meshes.push([o, o.geometry]));
    const saved = JSON.stringify(run);
    scene.update({ ...run, showLabels: true, vectors: true });
    const mass = scene.kit.objects.find((o) => o.userData.role === "spring-mass");
    near(mass.position.x, 1 + 3.2 * displacement);
    assert.equal(JSON.stringify(run), saved);
    for (let i = 0; i < 8; i++) scene.update({ ...run, state: d.step(run.state, run.params, i / 240) });
    const after = []; root.traverse((o) => after.push([o, o.geometry]));
    assert.deepEqual(after, meshes);
    finite(root); clean(root);
  }
});

test("pendulum link and trail use one fitted scale for all supported lengths and angles", () => {
  for (const length of [0.3, 1.5, 3]) for (const angle of [-120, 0, 120]) {
    const d = SIMULATIONS.pendulum, run = d.create({ ...d.defaults, length, angle }), root = new T.Group(),
      scene = createDetailedMechanics("pendulum", run.params, root, { labels: false }), saved = JSON.stringify(run);
    scene.update({ ...run, trail: [{ x: length * Math.sin(run.state.theta), y: -length * Math.cos(run.state.theta) }], showTrail: true });
    const bob = scene.kit.objects.find((o) => o.userData.role === "pendulum-bob");
    near(bob.position.distanceTo(new T.Vector3(0, 4.1, 0)), 3.3);
    near(bob.position.x, 3.3 * Math.sin(run.state.theta));
    assert.equal(JSON.stringify(run), saved);
    finite(root); clean(root);
  }
});

test("decorative tank finish keeps its true waterline and cube size at both volume limits", () => {
  for (const volume of [0.0002, 0.005]) {
    const d = SIMULATIONS.buoyancy, run = d.create({ ...d.defaults, volume }), root = new T.Group(),
      scene = createCurriculumScene("buoyancy", run.params, root, { labels: false });
    scene.update(run);
    const cube = scene.kit.objects.find((o) => o.userData.role === "buoyancy-body"),
      surface = scene.kit.objects.find((o) => o.material?.uniforms?.motion);
    near(surface.position.y, 0.14 + 6 * TANK_DEPTH);
    cube.geometry.computeBoundingBox();
    near(cube.geometry.boundingBox.getSize(new T.Vector3()).y, Math.cbrt(volume) * 6);
    near(cube.position.y, 0.14 + run.state.y * 6);
    assert.equal(surface.material.uniforms.motion.value, 0, "stationary cube cannot generate moving-wave highlights");
    finite(root); clean(root);
  }
});

test("dashed Kepler reference shares the solver's two-mass gravitational parameter", () => {
  const p = { ...SIMULATIONS.gravity.defaults, bodyMass: 1e23 },
    mu = G * (p.centralMass + p.bodyMass), circular = Math.sqrt(mu / p.distance),
    circle = orbitalReference({ ...p, velocity: circular });
  assert.equal(circle.length, 481);
  for (const point of circle) near(Math.hypot(...point) / p.distance, 1, 1e-10);
  near(circle[0][0] / p.distance, 1);
  near(circle.at(-1)[1] / p.distance, 0);
  const ellipse = orbitalReference({ ...p, velocity: circular * 0.9 });
  near(Math.hypot(...ellipse[240]) / p.distance, 0.81 / 1.19, 1e-10);
});

test("orbital reference stops at surface/extent and does not invent a radial orbit", () => {
  const p = { ...SIMULATIONS.gravity.defaults }, circular = Math.sqrt(G * (p.centralMass + p.bodyMass) / p.distance);
  assert.deepEqual(orbitalReference({ ...p, velocity: 0 }), []);
  for (const velocity of [circular * 0.1, circular * 2]) {
    const points = orbitalReference({ ...p, velocity });
    assert.ok(points.length > 0 && points.length < 481);
    for (const point of points) {
      assert.ok(point.every(Number.isFinite));
      assert.ok(Math.hypot(...point) > centralRadius(p));
      assert.ok(Math.hypot(...point) <= p.distance * 6);
    }
  }
});
