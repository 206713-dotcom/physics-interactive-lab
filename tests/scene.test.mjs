import test from "node:test";
import assert from "node:assert/strict";
import * as T from "../vendor/three.module.min.js";
import { CURRICULUM_SIMULATIONS as LABS } from "../js/curriculum-simulations.js";
import { SIMULATIONS } from "../js/simulations.js";
import {
  createCurriculumScene,
  CURRICULUM_BUILDERS,
} from "../js/scene-curriculum.js";
import { SCENE_GUIDES } from "../js/scene-guides.js";
import { setPath } from "../js/scene-kit.js";
import { visualState } from "../js/visual-state.js";
const dispose = (root) =>
  root.traverse((o) => {
    o.geometry?.dispose();
    if (o.material)
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        m.dispose();
  });
function build(id, params = LABS[id].defaults) {
  const run = LABS[id].create(params),
    root = new T.Group(),
    scene = createCurriculumScene(id, run.params, root, { labels: false });
  return { root, scene, run };
}
function finite(root, id) {
  root.updateMatrixWorld(true);
  let meshes = 0;
  root.traverse((o) => {
    assert.ok(
      o.matrixWorld.elements.every(Number.isFinite),
      id + " world transform",
    );
    if (o.isMesh) meshes++;
    for (const attribute of Object.values(o.geometry?.attributes || {}))
      assert.ok(attribute.array.every(Number.isFinite), id + " geometry");
    if (o.isInstancedMesh)
      assert.ok(
        o.instanceMatrix.array.every(Number.isFinite),
        id + " instances",
      );
  });
  assert.ok(meshes >= 1, id + " must have volumetric apparatus");
}
test("all 57 models support 3D and have a complete model-specific visual explanation", () => {
  assert.equal(Object.keys(SIMULATIONS).length, 57);
  assert.deepEqual(
    Object.keys(CURRICULUM_BUILDERS).sort(),
    Object.keys(LABS).sort(),
  );
  for (const [id, d] of Object.entries(SIMULATIONS)) {
    assert.equal(d.diagramOnly || false, false, id);
    assert.equal(SCENE_GUIDES[id].length, 4, id);
    assert.ok(
      SCENE_GUIDES[id].every((text) => text.length > 35),
      id + " explanatory depth",
    );
  }
});
test("every 3D instrument stays finite across presets and every supported single-parameter endpoint", () => {
  for (const [id, d] of Object.entries(LABS)) {
    const setups = [d.defaults, ...d.presets.map((x) => x[1])];
    for (const [key, range] of Object.entries(d.limits))
      for (const v of range) setups.push({ ...d.defaults, [key]: v });
    for (const params of setups) {
      try {
        d.create(params);
      } catch (error) {
        if (error instanceof RangeError) continue;
        throw error;
      }
      const { root, scene, run } = build(id, params);
      for (const t of [0, 0.3, 2]) {
        scene.update({ ...run, state: { ...run.state, t } });
        finite(root, id);
      }
      dispose(root);
    }
  }
});
test("rendering cannot mutate the physical state or parameters and does not grow apparatus each frame", () => {
  for (const [id, d] of Object.entries(LABS)) {
    const { root, scene, run } = build(id);
    Object.freeze(run.params);
    Object.freeze(run.state);
    scene.update(run);
    const objects = [];
    root.traverse((o) => objects.push(o));
    const geometry = objects.map((o) => o.geometry);
    for (let i = 0; i < 12; i++)
      scene.update({
        ...run,
        state: Object.freeze({ ...run.state, t: i / 20 }),
      });
    const after = [];
    root.traverse((o) => after.push(o));
    assert.deepEqual(after, objects, id + " object count");
    assert.deepEqual(
      after.map((o) => o.geometry),
      geometry,
      id + " geometry allocation",
    );
    dispose(root);
  }
});
test("vector arrows add head-to-tail with a common physical scale, including cancellation", () => {
  for (const angle of [0, 90, 180]) {
    const { root, scene, run } = build("vectors", { a: 8, b: 8, angle });
    scene.update(run);
    const [A, B, R] = scene.kit.indicators;
    const end = (o) =>
      new T.Vector3(0, o.userData.vectorLength, 0)
        .applyQuaternion(o.quaternion)
        .add(o.position);
    assert.ok(end(A).distanceTo(B.position) < 1e-10);
    assert.ok(end(B).distanceTo(end(R)) < 1e-10);
    if (angle === 180) assert.equal(R.visible, false);
    dispose(root);
  }
});
test("magnetic-force arrow stays perpendicular to actual particle velocity for both charge signs", () => {
  for (const charge of [-1, 1]) {
    const params = { ...LABS.charged.defaults, charge },
      { root, scene, run } = build("charged", params),
      omega = (-charge * 1.602176634e-19 * params.field) / params.mass,
      t = 0.73 / Math.abs(omega);
    scene.update({ ...run, state: { t } });
    const arrow = scene.kit.indicators.at(-1),
      direction = new T.Vector3(0, 1, 0).applyQuaternion(arrow.quaternion),
      velocity = new T.Vector3(Math.cos(omega * t), Math.sin(omega * t), 0);
    assert.ok(Math.abs(direction.dot(velocity)) < 1e-10);
    dispose(root);
  }
});
test("radioactive dot colours follow actual seeded nucleus event times", () => {
  const { root, scene, run } = build("radioactivity"),
    t = run.params.halfLife;
  scene.update({ ...run, state: { ...run.state, t } });
  const dots = scene.kit.objects.find((o) => o.isInstancedMesh),
    color = new T.Color(),
    aliveColor = new T.Color(0x64e8d1);
  let count = 0;
  for (let i = 0; i < dots.count; i++) {
    dots.getColorAt(i, color);
    if (
      color.distanceTo
        ? color.distanceTo(aliveColor) < 1e-6
        : Math.abs(color.g - aliveColor.g) < 1e-6
    )
      count++;
  }
  assert.equal(count, run.state.decayTimes.filter((x) => x > t).length);
  dispose(root);
});
test("animated paths reuse buffers and draw ranges remove stale points", () => {
  const line = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial());
  setPath(line, [
    [0, 0, 0],
    [1, 2, 3],
    [2, 3, 4],
  ]);
  const buffer = line.geometry.attributes.position,
    geometry = line.geometry;
  for (let i = 0; i < 200; i++)
    setPath(line, [
      [i, 0, 0],
      [i + 1, 0, 0],
    ]);
  assert.equal(line.geometry, geometry);
  assert.equal(line.geometry.attributes.position, buffer);
  assert.equal(line.geometry.drawRange.count, 2);
  setPath(line, []);
  assert.equal(line.geometry.drawRange.count, 0);
  line.geometry.dispose();
  line.material.dispose();
});
test("generator orientation agrees with calculated flux at every quarter-turn and an intermediate phase", () => {
  const { root, scene, run } = build("induction");
  for (const phase of [0, 0.43, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    const state = { t: phase / (2 * Math.PI * run.params.frequency) };
    scene.update({ ...run, state });
    const rotor = scene.kit.objects.find((o) => o.userData.role === "rotor"),
      normal = new T.Vector3(1, 0, 0).applyQuaternion(rotor.quaternion);
    assert.ok(Math.abs(normal.x - Math.cos(phase)) < 1e-12);
    const drawn = scene.kit.indicators.at(-1),
      direction = new T.Vector3(0, 1, 0).applyQuaternion(drawn.quaternion);
    assert.ok(normal.distanceTo(direction) < 1e-12);
  }
  dispose(root);
});
test("air-column animation uses the physical phase shown by the graph", () => {
  const { root, scene, run } = build("resonance"),
    frequency = run.params.speed / (2 * run.params.length),
    gold = scene.kit.objects.find(
      (o) => o.isLine && o.material.color.getHex() === 0xffc584,
    );
  scene.update({ ...run, state: { t: 0 } });
  assert.ok(gold.geometry.attributes.position.getY(0) > 2);
  scene.update({ ...run, state: { t: 1 / (4 * frequency) } });
  for (let i = 0; i < gold.geometry.drawRange.count; i++)
    assert.ok(Math.abs(gold.geometry.attributes.position.getY(i) - 1.5) < 1e-6);
  dispose(root);
});
test("fixed-step visual interpolation is bounded, immutable and preserves discrete events and nucleus data", () => {
  const a = {
      t: 1,
      x: 2,
      remaining: 10,
      decayTimes: [2, 4],
      bodies: [{ x: 3, vx: 2 }],
      twin: { theta: 1 },
    },
    b = {
      t: 2,
      x: 6,
      remaining: 9,
      decayTimes: a.decayTimes,
      bodies: [{ x: 5, vx: 4 }],
      twin: { theta: 3 },
    },
    before = JSON.stringify([a, b]),
    s = visualState(a, b, 0.25);
  assert.equal(s.x, 3);
  assert.equal(s.remaining, 9);
  assert.equal(s.decayTimes, b.decayTimes);
  assert.equal(s.bodies[0].x, 3.5);
  assert.equal(s.twin.theta, 1.5);
  assert.equal(visualState(a, b, 4).x, 6);
  assert.equal(visualState(a, b, -1).x, 2);
  assert.equal(JSON.stringify([a, b]), before);
  const collision = { ...b, hit: true };
  assert.equal(visualState({ ...a, hit: false }, collision, 0.5), collision);
});
