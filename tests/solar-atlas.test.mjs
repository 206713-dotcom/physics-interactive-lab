import test from "node:test";
import assert from "node:assert/strict";
import {
  ELEMENTS,
  solveKepler,
  elementsAt,
  ellipsePoint,
  planetPosition,
  orbitPhysics,
  bodyPhysics,
  satellitePhysics,
  energyBalance,
  daysFromDate,
  dateFromDays,
  AU,
  C,
} from "../atlas/astronomy-math.js";
import { WORLDS, BODIES, BODY_MAP, MOONS } from "../atlas/astronomy-data.js";
import { INTERIORS } from "../atlas/world-interiors.js";
const near = (a, b, tol = 1e-10) =>
  assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);
test("imported Muon Atlas contains 20 distinct worlds with ordered interior shells ending at the surface", () => {
  assert.equal(BODIES.length, 20);
  assert.equal(new Set(BODIES.map((b) => b.id)).size, 20);
  for (const b of BODIES) {
    assert.ok((b.mass > 0 || b.gm > 0) && b.radius > 0);
    const layers = INTERIORS[b.id].layers;
    near(layers.at(-1).edge, 1);
    let edge = 0,
      volume = 0;
    for (const layer of layers) {
      assert.ok(layer.edge > edge && layer.edge <= 1);
      volume += layer.edge ** 3 - edge ** 3;
      edge = layer.edge;
    }
    near(volume, 1);
  }
});
test("Kepler solver satisfies the equation for circular, planetary and highly eccentric ellipses", () => {
  for (const e of [0, 0.0167, 0.2056, 0.8, 0.99])
    for (const m of [-3, -0.1, 0, 0.1, 2, 3]) {
      const E = solveKepler(m, e);
      near(E - e * Math.sin(E), m, 2e-12);
    }
  assert.throws(() => solveKepler(0, 1), RangeError);
});
test("all eight JPL orbits remain finite and inside their perihelion / aphelion bounds for the supported dates", () => {
  assert.equal(Object.keys(ELEMENTS).length, 8);
  for (const id of Object.keys(ELEMENTS))
    for (const date of ["2000-01-01", "2026-10-24", "2049-12-31"]) {
      const days = daysFromDate(date),
        el = elementsAt(id, days),
        point = planetPosition(id, days),
        r = Math.hypot(...point);
      assert.ok(point.every(Number.isFinite));
      assert.ok(
        r >= el[0] * (1 - el[1]) - 1e-10 && r <= el[0] * (1 + el[1]) + 1e-10,
      );
      near(Math.hypot(...ellipsePoint(el, 0)), el[0] * (1 - el[1]));
      near(Math.hypot(...ellipsePoint(el, Math.PI)), el[0] * (1 + el[1]));
    }
});
test("the atlas obeys Kepler scaling, vis-viva and the physical light-travel delay", () => {
  const earth = orbitPhysics(1),
    far = orbitPhysics(4),
    ecc = orbitPhysics(1, 0.8);
  near(far.periodDays / earth.periodDays, 8);
  near(far.speed / earth.speed, 0.5);
  near(earth.lightMinutes, AU / C / 60);
  near(ecc.speed / earth.speed, Math.sqrt(1.5));
  assert.ok(earth.periodDays > 365.2 && earth.periodDays < 365.3);
});
test("all world calculation panels have consistent gravity and escape / circular speeds", () => {
  for (const b of BODIES) {
    const q = bodyPhysics(b),
      high = bodyPhysics(b, b.radius);
    assert.ok(Object.values(q).every(Number.isFinite));
    near(high.gravity / q.gravity, 0.25);
    near(q.escape / q.circular, Math.sqrt(2));
  }
  assert.throws(() => bodyPhysics(BODY_MAP.earth, -1), RangeError);
  for (const moon of MOONS) {
    const q = satellitePhysics(moon, BODY_MAP[moon.parent]);
    assert.ok(
      q.periodDays > 0 && q.barycentreKm > 0 && q.barycentreKm < moon.orbitKm,
    );
  }
});
test("energy balance conserves absorbed / emitted flux; distance and albedo scale temperature correctly", () => {
  const a = energyBalance(1, 0.3),
    b = energyBalance(4, 0.3),
    dark = energyBalance(1, 1);
  near(a.absorbed, (a.incident * 0.7) / 4, 1e-8);
  near(b.incident / a.incident, 1 / 16);
  near(b.temperature / a.temperature, 0.5);
  near(dark.temperature, 0);
  assert.throws(() => energyBalance(0), RangeError);
  assert.throws(() => energyBalance(1, 1.1), RangeError);
});
test("UTC date input round-trips the supported range without a local-time shift", () => {
  for (const date of ["2000-01-01", "2026-10-24", "2049-12-31"])
    assert.equal(dateFromDays(daysFromDate(date)), date);
});
