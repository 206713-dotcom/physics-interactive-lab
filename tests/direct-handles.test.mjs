import test from "node:test";
import assert from "node:assert/strict";
import {
  diagramTransform, momentsLayout, beamDistance, incidenceAngle,
  hasHandles, handlesFor, handleAt, snapToControl, controlStep,
} from "../js/direct-handles.js";
import { createBudget, ratioForPixels } from "../js/render-budget.js";
import { SIMULATIONS } from "../js/simulations.js";
import { studyControl, studyParams } from "../js/study-policy.js";

const labFor = (type, mode, patch = {}) => {
  const definition = SIMULATIONS[type],
    model = definition.create(studyParams(type, mode, definition, patch));
  return { type, studyMode: mode, definition, ...model };
};
const W = 1200, H = 640;

test("every hands-on lab exists and its handles sit inside the diagram", () => {
  for (const type of ["moments", "lenses", "refraction", "fields"]) {
    assert.ok(hasHandles(type) && Object.hasOwn(SIMULATIONS, type));
    const handles = handlesFor(labFor(type, "igcse"), W, H);
    assert.ok(handles.length > 0);
    for (const h of handles) {
      assert.ok(h.at[0] >= 0 && h.at[0] <= W && h.at[1] >= 0 && h.at[1] <= H, `${type}/${h.id}`);
      assert.equal(typeof h.drag, "function");
    }
  }
  assert.equal(hasHandles("buoyancy"), false);
  assert.deepEqual(handlesFor(labFor("buoyancy", "igcse"), W, H), []);
});

test("dragging a handle to where it already is changes nothing", () => {
  for (const [type, keys] of [["moments", ["d1", "d2"]], ["refraction", ["angle"]], ["fields", ["separation"]]]) {
    const lab = labFor(type, "igcse");
    for (const h of handlesFor(lab, W, H))
      for (const [key, value] of Object.entries(h.drag(...h.at))) {
        assert.ok(keys.includes(key));
        assert.ok(Math.abs(value - lab.params[key]) < 1e-6, `${type}.${key}`);
      }
  }
  // The lens object stays under the pointer: its handle maps back to itself,
  // and the scale it asks the diagram to hold is the one it was drawn with.
  const lens = labFor("lenses", "igcse"), [h] = handlesFor(lens, W, H), same = h.drag(...h.at);
  assert.ok(Math.abs(same.object - lens.params.object) < 1e-9);
  assert.ok(Math.abs(same.height - lens.params.height) < 1e-9);
  assert.ok(h.hold.heldScale > 0);
  const held = handlesFor({ ...lens, ...h.hold, params: { ...lens.params, object: lens.params.object / 2 } }, W, H)[0];
  assert.equal(held.hold.heldScale, h.hold.heldScale);
});

test("moving a mass outward along the beam increases its distance from the pivot", () => {
  const lab = labFor("moments", "igcse", { d1: 0.5, d2: 0.5 }),
    [left, right] = handlesFor(lab, W, H);
  assert.ok(left.at[0] < right.at[0]);
  assert.ok(left.drag(left.at[0] - 60, left.at[1]).d1 > 0.5);
  assert.ok(right.drag(right.at[0] + 60, right.at[1]).d2 > 0.5);
  // A tilted beam still measures along itself, not along the screen.
  const layout = { ...momentsLayout(lab), theta: 0.3 };
  const x = layout.pivot + 0.8 * layout.sc * Math.cos(0.3), y = layout.py - 0.8 * layout.sc * Math.sin(0.3);
  assert.ok(Math.abs(beamDistance(layout, x, y) - 0.8) < 1e-9);
});

test("angles, snapping and hit-testing behave at their edges", () => {
  assert.ok(Math.abs(incidenceAngle(100, 100, 100, 20)) < 1e-9);
  assert.ok(Math.abs(incidenceAngle(100, 100, 20, 20) - 45) < 1e-9);
  assert.ok(incidenceAngle(100, 100, 20, 100) > 89.9);
  const control = studyControl("moments", "igcse", SIMULATIONS.moments.controls.find((c) => c.key === "d1"));
  assert.equal(snapToControl(99, control), control.max);
  assert.equal(snapToControl(-5, control), control.min);
  const snapped = snapToControl(0.7234, control);
  assert.ok(snapped >= control.min && snapped <= control.max);
  assert.equal(controlStep(control), 0.05);
  assert.equal(controlStep({ step: 0.1, min: 1, max: 4 }), 0.1);
  assert.ok(Math.abs(snapped / 0.05 - Math.round(snapped / 0.05)) < 1e-6);
  const handles = [{ id: "a", at: [10, 10] }, { id: "b", at: [40, 10] }];
  assert.equal(handleAt(handles, 14, 10).id, "a");
  assert.equal(handleAt(handles, 30, 10).id, "b");
  assert.equal(handleAt(handles, 200, 200), null);
  const t = diagramTransform(840, 470);
  assert.deepEqual([t.scale, t.ox, t.oy], [1, 0, 0]);
});

test("the render budget only steps down, and only when frames stay slow", () => {
  const fast = createBudget({ start: 1.5, floor: 1, slowMs: 27, window: 10 });
  let now = 0, changed = false;
  for (let i = 0; i < 60; i++) changed ||= fast.frame((now += 16.7));
  assert.equal(changed, false);
  assert.equal(fast.ratio, 1.5);
  const slow = createBudget({ start: 1.5, floor: 1, slowMs: 27, window: 10 });
  now = 0;
  let steps = 0;
  for (let i = 0; i < 200; i++) steps += slow.frame((now += 40)) ? 1 : 0;
  assert.equal(slow.ratio, 1);
  assert.equal(steps, 2);
  // A long pause (hidden tab) is not counted as a slow frame.
  const paused = createBudget({ start: 1.5, floor: 1, slowMs: 27, window: 3 });
  now = 0;
  for (let i = 0; i < 30; i++) paused.frame((now += i % 2 ? 16 : 5000));
  assert.equal(paused.ratio, 1.5);
  assert.ok(ratioForPixels(1440, 900, 2, 1.5e6, 1.5) < 1.2);
  assert.equal(ratioForPixels(390, 844, 3, 1.5e6, 1.5), 1.5);
});
