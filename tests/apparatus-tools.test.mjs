import test from "node:test";
import assert from "node:assert/strict";
import { formatElapsed, createClock, angleBetween, calculate, tidyNumber } from "../js/apparatus-tools.js";
import { hasHandles, opensInDiagram, handlesFor, pendulumDrawLength } from "../js/direct-handles.js";
import { SIMULATIONS } from "../js/simulations.js";
import { studyParams } from "../js/study-policy.js";

test("elapsed time reads like a stopwatch and scales up for long runs", () => {
  assert.equal(formatElapsed(0), "00:00.00");
  assert.equal(formatElapsed(83.456), "01:23.45");
  assert.equal(formatElapsed(59.999), "00:59.99");
  assert.equal(formatElapsed(-4), "00:00.00");
  assert.equal(formatElapsed(3725), "1:02:05");
  assert.equal(formatElapsed(86400 * 3), "3.00 d");
});

test("the clock follows model time, ignores replays and keeps laps", () => {
  const clock = createClock();
  clock.feed(5);
  assert.equal(clock.elapsed, 0);
  clock.start();
  for (const t of [5, 5.5, 6]) clock.feed(t);
  assert.equal(clock.elapsed, 1);
  clock.lap();
  clock.feed(0); // the experiment replayed from zero
  clock.feed(0.25);
  assert.equal(clock.elapsed, 1.25);
  clock.stop();
  clock.feed(9);
  assert.equal(clock.elapsed, 1.25);
  assert.deepEqual(clock.laps, [1]);
  clock.reset();
  assert.equal(clock.elapsed, 0);
  assert.equal(clock.laps.length, 0);
});

test("the protractor measures the angle at its middle point", () => {
  assert.ok(Math.abs(angleBetween([1, 0], [0, 0], [0, 1]) - 90) < 1e-9);
  assert.ok(Math.abs(angleBetween([1, 0], [0, 0], [-1, 0]) - 180) < 1e-9);
  assert.ok(Math.abs(angleBetween([2, 0], [0, 0], [2, 2]) - 45) < 1e-9);
  assert.equal(angleBetween([0, 0], [0, 0], [1, 1]), 0);
});

test("the calculator follows operator precedence and refuses nonsense", () => {
  assert.equal(calculate("2 + 3 × 4"), 14);
  assert.equal(calculate("(2+3)*4"), 20);
  assert.equal(calculate("2^3^2"), 512);
  assert.equal(calculate("-3^2"), -9);
  assert.equal(calculate("10 ÷ 4"), 2.5);
  assert.ok(Math.abs(calculate("sin(30)") - 0.5) < 1e-12);
  assert.equal(calculate("sqrt(16)+ans", 2), 6);
  assert.ok(Math.abs(calculate("2*pi") - 2 * Math.PI) < 1e-12);
  assert.equal(calculate("1.5e3/3"), 500);
  for (const bad of ["", "2+", "1/0", "alert(1)", "2..5", "(3", "window"]) assert.throws(() => calculate(bad));
  assert.equal(tidyNumber(0.1 + 0.2), "0.3");
  assert.equal(tidyNumber(12345678), "1.235e+7");
});

test("the pendulum bob can be pulled, and flat experiments open in the diagram", () => {
  assert.ok(hasHandles("pendulum"));
  for (const type of ["pendulum", "moments", "dc", "waves", "mirror"]) assert.ok(opensInDiagram(type) && Object.hasOwn(SIMULATIONS, type));
  assert.equal(opensInDiagram("buoyancy"), false);
  const definition = SIMULATIONS.pendulum,
    lab = { type: "pendulum", studyMode: "igcse", definition, ...definition.create(studyParams("pendulum", "igcse", definition, {})) },
    [bob] = handlesFor(lab, 1200, 640), same = bob.drag(...bob.at);
  assert.equal(pendulumDrawLength(lab), 180);
  assert.ok(Math.abs(same.length - lab.params.length) < 1e-9);
  assert.ok(Math.abs(same.angle - (lab.state.theta * 180) / Math.PI) < 1e-9);
  // Pulling the bob straight down away from the pivot makes the pendulum longer.
  assert.ok(bob.drag(bob.at[0], bob.at[1] + 80).length > lab.params.length);
  assert.equal(pendulumDrawLength({ ...lab, ...bob.hold, params: { ...lab.params, length: lab.params.length / 2 } }), 90);
});
