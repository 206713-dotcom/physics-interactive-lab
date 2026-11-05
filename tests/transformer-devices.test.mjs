import test from "node:test";
import assert from "node:assert/strict";
import * as T from "../vendor/three.module.min.js";
import { CURRICULUM_SIMULATIONS as LABS } from "../js/curriculum-simulations.js";
import { createCurriculumScene } from "../js/scene-curriculum.js";
import { transformerVisual, TRANSFORMER_DISPLAY_PERIOD } from "../js/transformer-visual.js";
import { sceneLabelAllowed } from "../js/study-policy.js";
import { diagramLabelVisible } from "../js/scene-framing.js";

function bench(id, patch = {}) {
  const run = LABS[id].create({ ...LABS[id].defaults, ...patch }), root = new T.Group();
  const scene = createCurriculumScene(id, run.params, root, { labels: false });
  return {
    run, scene,
    update(t, extra = {}) { scene.update({ ...run, state: { t }, ...extra }); },
    nodes(role) { return scene.kit.objects.filter(node => node.userData.role === role); },
    dispose() { root.traverse(node => {
      node.geometry?.dispose();
      for (const material of node.material ? [node.material].flat() : []) material.dispose();
    }); },
  };
}
const close = (a, b, tolerance = 1e-10) => assert.ok(Math.abs(a - b) < tolerance, a + " ≈ " + b);

test("transformer voltage is zero at maximum flux and peaks at zero flux", () => {
  const period = TRANSFORMER_DISPLAY_PERIOD;
  assert.deepEqual(transformerVisual(0), { phase: 0, voltage: 0, flux: -1 });
  close(transformerVisual(period / 4).voltage, 1);
  close(transformerVisual(period / 4).flux, 0);
  close(transformerVisual(period / 2).voltage, 0);
  close(transformerVisual(period / 2).flux, 1);
  close(transformerVisual(3 * period / 4).voltage, -1);
  // Faraday phase. Normalised d(flux)/dt is proportional to voltage.
  const h = 1e-6;
  for (const t of [0.13, 0.4, 0.8, 1.4, 1.9]) {
    const derivative = (transformerVisual(t + h).flux - transformerVisual(t - h).flux) / (2 * h);
    close(derivative / (2 * Math.PI / period), transformerVisual(t).voltage, 1e-8);
  }
});

test("transformer currents reverse and core flux alternates without changing the RMS model", () => {
  const b = bench("transformer"), period = TRANSFORMER_DISPLAY_PERIOD;
  b.update(period / 4);
  const markers = b.nodes("direction-marker");
  assert.ok(markers.some(node => node.userData.circuit === "transformer-primary"));
  assert.ok(markers.some(node => node.userData.circuit === "transformer-secondary"));
  const positive = markers.map(node => new T.Vector3(0, 1, 0).applyQuaternion(node.quaternion));
  assert.ok(markers.every(node => node.visible));
  assert.ok(b.nodes("transformer-flux-arrow").every(node => !node.visible));
  b.update(3 * period / 4);
  markers.forEach((node, i) => {
    const reversed = new T.Vector3(0, 1, 0).applyQuaternion(node.quaternion);
    close(reversed.dot(positive[i]), -1);
  });
  b.update(period / 2);
  assert.ok(markers.every(node => !node.visible));
  assert.ok(b.nodes("transformer-flux-arrow").every(node => node.visible));
  const q = LABS.transformer.sample({ t: 0 }, b.run.params);
  close(q.input, q.output);
  b.update(period / 4, { vectors: false });
  assert.ok(markers.every(node => !node.visible));
  b.dispose();
});

test("doubling secondary turns at fixed resistance quadruples supplied power", () => {
  const p = LABS.transformer.defaults;
  const before = LABS.transformer.sample({ t: 0 }, p);
  const after = LABS.transformer.sample({ t: 0 }, { ...p, ns: 2 * p.ns });
  close(after.vs, 2 * before.vs);
  close(after.is, 2 * before.is);
  close(after.input, 4 * before.input);
  close(after.input, after.output);
});

test("IGCSE presentation retains both winding names and all four electrical readings", () => {
  const b = bench("transformer");
  b.update(0.5);
  const labels = b.scene.kit.annotations.filter(node => /a\.c\.|turns/.test(node.userData.text));
  assert.equal(labels.length, 6);
  for (const node of labels) {
    assert.equal(sceneLabelAllowed("transformer", "igcse", node.userData.text), true);
    assert.equal(diagramLabelVisible(node.userData.text, node.userData.labelWidth), true);
  }
  b.dispose();
});

test("closed cut-out at zero voltage has no current markers and reverse current reverses their arrows", () => {
  for (const voltage of [0, -2, 2]) {
    const b = bench("devices", { mode: 2, voltage, rating: 0.1, resistance: 100 });
    b.update(0.5);
    assert.equal(b.nodes("device-contact")[0].userData.closed, true);
    const markers = b.nodes("direction-marker");
    assert.ok(markers.every(node => node.visible === (voltage !== 0)));
    if (voltage) {
      const before = markers.map(node => node.position.clone());
      const direction = markers.map(node => new T.Vector3(0, 1, 0).applyQuaternion(node.quaternion));
      b.update(0.50001);
      markers.forEach((node, i) => assert.ok(node.position.clone().sub(before[i]).dot(direction[i]) > 0));
    }
    b.dispose();
  }
});

test("relay and cut-out contact gaps match their model thresholds", () => {
  for (const [patch, expected] of [
    [{ mode: 1, voltage: 2, threshold: 3 }, false],
    [{ mode: 1, voltage: 3, threshold: 3 }, true],
    [{ mode: 1, voltage: -6, threshold: 3 }, false],
    [{ mode: 2, voltage: 12, resistance: 100, rating: 0.05 }, false],
    [{ mode: 2, voltage: 12, resistance: 300, rating: 0.05 }, true],
  ]) {
    const b = bench("devices", patch);
    b.update(0.25);
    const contact = b.nodes("device-contact")[0];
    assert.equal(contact.userData.closed, expected);
    const direction = new T.Vector3(0, 1, 0).applyQuaternion(contact.quaternion);
    assert.equal(Math.abs(direction.y) < 1e-10, expected);
    assert.ok(b.nodes("direction-marker").every(node => node.visible === expected));
    b.dispose();
  }
});
