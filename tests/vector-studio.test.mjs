import test from "node:test";
import assert from "node:assert/strict";
import * as T from "../vendor/three.module.min.js";
import {
  vectorLayout,
  vectorConstruction,
  parametersFromVectorPoint,
  VECTOR_METHODS,
} from "../js/vector-geometry.js";
import { createCurriculumScene } from "../js/scene-curriculum.js";
import {
  createCurriculum,
  sampleCurriculum,
} from "../js/curriculum-physics.js";
import { vectorCanvasFrame } from "../js/render-vectors.js";
const close = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);
function setup(p = { a: 8, b: 6, angle: 90 }) {
  const root = new T.Group(),
    run = createCurriculum("vectors", p),
    scene = createCurriculumScene("vectors", p, root, { labels: false });
  scene.update({ ...run, vectorProgress: 1 });
  return { root, run, scene };
}
const dispose = (root) =>
  root.traverse((o) => {
    o.geometry?.dispose();
    for (const m of Array.isArray(o.material) ? o.material : [o.material])
      m?.dispose();
  });
test("all addition methods preserve a common N scale, exact endpoint and horizontal / vertical signs", () => {
  for (const p of [
    { a: 8, b: 6, angle: 90 },
    { a: 4, b: 9, angle: 130 },
    { a: 0, b: 20, angle: 180 },
    { a: 20, b: 20, angle: 0 },
    { a: 0, b: 0, angle: 0 },
  ])
    for (const method of VECTOR_METHODS) {
      const l = vectorLayout(p, method),
        q = sampleCurriculum("vectors", { t: 0 }, p);
      close((l.result[0] - l.origin[0]) / l.scale, q.x);
      close((l.result[1] - l.origin[1]) / l.scale, q.y);
      close(
        Math.hypot(l.result[0] - l.origin[0], l.result[1] - l.origin[1]) /
          l.scale,
        q.resultant,
      );
      assert.ok(l.origin.every(Number.isFinite));
      assert.ok(l.result[0] >= -3.2 && l.result[0] <= 3.2);
      assert.ok(l.result[1] <= 4.5);
    }
});
test("construction translates B without rotating or rescaling it, and reveals the full resultant at the end", () => {
  const p = { a: 8, b: 6, angle: 120 };
  let previous = -Infinity;
  for (let i = 0; i <= 100; i++) {
    const c = vectorConstruction(p, "triangle", i / 100);
    assert.ok(c.slide >= previous);
    previous = c.slide;
    close(c.bTail[1], c.layout.origin[1]);
    close(c.bTail[0] - c.layout.origin[0], p.a * c.layout.scale * c.slide);
    assert.ok(c.rGrow >= 0 && c.rGrow <= 1);
  }
  const end = vectorConstruction(p, "triangle", 1);
  close(end.bTail[0], end.layout.a[0]);
  assert.equal(end.rGrow, 1);
  assert.equal(end.components, 1);
  for (const u of [0, 0.3, 0.6, 1])
    assert.deepEqual(
      vectorConstruction(p, "parallelogram", u).bTail,
      vectorLayout(p, "parallelogram").origin,
    );
});
test("drag inversion round-trips known vectors, respects supported bounds and keeps zero-vector direction", () => {
  const p = { a: 4.6, b: 7.2, angle: 43 };
  for (const method of VECTOR_METHODS) {
    const l = vectorLayout(p, method);
    assert.deepEqual(parametersFromVectorPoint("a", l.a, l, p, method), {
      a: 4.6,
    });
    assert.deepEqual(
      parametersFromVectorPoint(
        "b",
        method === "parallelogram" ? l.b : l.result,
        l,
        p,
        method,
      ),
      { b: 7.2, angle: 43 },
    );
    assert.equal(
      parametersFromVectorPoint("b", [Infinity, 0, 0], l, p, method),
      null,
    );
    assert.equal(
      parametersFromVectorPoint("a", [-1e9, 0, 0], l, p, method).a,
      0,
    );
    assert.equal(
      parametersFromVectorPoint("a", [1e9, 0, 0], l, p, method).a,
      20,
    );
    const tail = method === "parallelogram" ? l.origin : l.a;
    assert.deepEqual(parametersFromVectorPoint("b", tail, l, p, method), {
      b: 0,
      angle: 43,
    });
  }
});
test("reactive 3D edits keep every mesh and geometry while all three methods still agree with calculations", () => {
  const { root, run, scene } = setup(),
    before = [];
  root.traverse((o) => before.push([o, o.geometry]));
  assert.equal(scene.liveParams, true);
  for (const method of VECTOR_METHODS)
    for (const angle of [0, 45, 90, 135, 180]) {
      const params = { a: 12, b: 7, angle };
      scene.update({ ...run, params, vectorMethod: method, vectorProgress: 1 });
      const [A, B, R] = scene.kit.indicators,
        end = (o) =>
          new T.Vector3(0, o.userData.vectorLength, 0)
            .applyQuaternion(o.quaternion)
            .add(o.position),
        ratio =
          R.userData.vectorLength /
          Math.hypot(
            sampleCurriculum("vectors", { t: 0 }, params).x,
            sampleCurriculum("vectors", { t: 0 }, params).y,
          );
      close(A.userData.vectorLength / 12, ratio);
      close(B.userData.vectorLength / 7, ratio);
      if (method === "parallelogram")
        assert.ok(B.position.distanceTo(A.position) < 1e-9);
      else assert.ok(B.position.distanceTo(end(A)) < 1e-9);
      if (method !== "parallelogram")
        assert.ok(end(B).distanceTo(end(R)) < 1e-9);
    }
  const after = [];
  root.traverse((o) => after.push([o, o.geometry]));
  assert.deepEqual(after, before);
  assert.deepEqual(run.params, { a: 8, b: 6, angle: 90 });
  dispose(root);
});
test("a camera ray hits the B handle and maps a real 3D pointer move back to correct magnitude and angle", () => {
  for (const method of VECTOR_METHODS) {
    const { root, run, scene } = setup(),
      camera = new T.PerspectiveCamera(38, 1.5, 0.05, 200);
    camera.position.set(0, 2.65, 10);
    camera.lookAt(0, 2.65, 0);
    camera.updateMatrixWorld(true);
    scene.update({ ...run, vectorMethod: method, vectorProgress: 1 });
    const l = vectorLayout(run.params, method),
      ndc = new T.Vector3(
        ...(method === "parallelogram" ? l.b : l.result),
      ).project(camera);
    assert.equal(
      scene.interaction.pick(new T.Vector2(ndc.x, ndc.y), camera),
      "b",
    );
    scene.interaction.begin("b");
    const target = l.point(
        (method === "parallelogram" ? 0 : 8) + 9 * Math.cos(Math.PI / 3),
        9 * Math.sin(Math.PI / 3),
      ),
      projected = new T.Vector3(...target).project(camera);
    assert.deepEqual(
      scene.interaction.move(new T.Vector2(projected.x, projected.y), camera),
      { b: 9, angle: 60 },
    );
    scene.interaction.end();
    assert.equal(scene.interaction.move(new T.Vector2(0, 0), camera), null);
    dispose(root);
  }
});
test("responsive 2D pointer mapping is the exact inverse of the drawn coordinate transform", () => {
  const run = createCurriculum("vectors");
  for (const [width, height] of [
    [360, 380],
    [768, 400],
    [1200, 550],
  ]) {
    const f = vectorCanvasFrame(
      { clientWidth: width, clientHeight: height },
      run,
    );
    for (const p of [f.layout.origin, f.layout.a, f.layout.result]) {
      const screen = f.pixel(p),
        world = f.world(...screen);
      close(world[0], p[0]);
      close(world[1], p[1]);
    }
  }
});
