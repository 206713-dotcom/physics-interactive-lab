import test from "node:test";
import assert from "node:assert/strict";
import * as T from "../vendor/three.module.min.js";
import { CURRICULUM_SIMULATIONS as LABS } from "../js/curriculum-simulations.js";
import { createCurriculumScene } from "../js/scene-curriculum.js";

function bench(id, patch) {
  const run = LABS[id].create({ ...LABS[id].defaults, ...patch }), root = new T.Group();
  const scene = createCurriculumScene(id, run.params, root, { labels: false });
  const update = (t, extra = {}) => scene.update({ ...run, state: { t }, ...extra });
  const dispose = () => root.traverse(node => {
    node.geometry?.dispose();
    for (const material of node.material ? [node.material].flat() : []) material.dispose();
  });
  return { root, scene, run, update, dispose };
}

test("bridge selects the correct diode pair and passes both peaks with fixed load polarity", () => {
  for (const mode of [0, 1]) {
    const b = bench("rectifier", { mode }), p = b.run.params;
    const diodes = b.scene.kit.objects.filter(node => node.userData.role === "rectifier-diode");
    const active = () => diodes.filter(node => node.userData.conducting).map(node => node.userData.diode);
    b.update(1 / (4 * p.frequency));
    assert.deepEqual(active(), mode ? ["D1", "D4"] : ["D1"]);
    const positive = LABS.rectifier.sample({ t: 1 / (4 * p.frequency) }, p);
    b.update(3 / (4 * p.frequency));
    assert.deepEqual(active(), mode ? ["D2", "D3"] : []);
    const negative = LABS.rectifier.sample({ t: 3 / (4 * p.frequency) }, p);
    assert.equal(positive.output, p.peak);
    assert.equal(negative.output, mode ? p.peak : 0);
    assert.ok(negative.current >= 0);
    // The local load markers, created first, retain downward direction.
    const markers = b.scene.kit.objects.filter(node => node.userData.role === "direction-marker").slice(0, 3);
    if (mode) for (const marker of markers) {
      assert.ok(marker.visible);
      const direction = new T.Vector3(0, 1, 0).applyQuaternion(marker.quaternion);
      assert.ok(direction.y < -0.99999);
    }
    b.update(1 / (2 * p.frequency));
    assert.deepEqual(active(), []);
    assert.ok(b.scene.kit.objects.filter(node => node.userData.role === "direction-marker").every(node => !node.visible));
    b.dispose();
  }
});

test("rectifier indicator toggle removes markers while preserving calculated diode states", () => {
  const b = bench("rectifier", { mode: 1 });
  b.update(1 / (4 * b.run.params.frequency), { vectors: false });
  assert.equal(b.scene.kit.objects.filter(node => node.userData.conducting).length, 2);
  assert.ok(b.scene.kit.objects.filter(node => node.userData.role === "direction-marker").every(node => !node.visible));
  b.dispose();
});

test("sensor voltages complement after an arm swap and both indicator states follow the actual sample", () => {
  for (const mode of [0, 1]) {
    const patch = { mode, lux: 10, temperature: 60, threshold: 3, voltage: 6 };
    const outputs = [];
    for (const orientation of [0, 1]) {
      const b = bench("sensors", { ...patch, orientation });
      b.update(0.3);
      const sample = LABS.sensors.sample({ t: 0.3 }, b.run.params);
      outputs.push(sample.output);
      const indicator = b.scene.kit.objects.find(node => node.userData.role === "sensor-comparator-indicator");
      assert.equal(indicator.userData.on, sample.output >= patch.threshold);
      assert.equal(indicator.material.emissiveIntensity > 0, Boolean(sample.on));
      assert.ok(b.scene.kit.annotations.some(node => node.userData.text.includes("Divider I")));
      b.dispose();
    }
    assert.ok(Math.abs(outputs[0] + outputs[1] - patch.voltage) < 1e-12);
    assert.notEqual(outputs[0] >= patch.threshold, outputs[1] >= patch.threshold);
  }
});
