import test from "node:test";
import assert from "node:assert/strict";
import * as P from "../js/physics.js";
import { SIMULATIONS } from "../js/simulations.js";

const launch = (ratio = 1, changes = {}) => {
  const p = { ...P.ORBIT_DEFAULTS, ...changes };
  p.velocity = ratio * P.circularSpeed(p);
  return p;
};
const close = (actual, expected, relative = 1e-12) =>
  assert.ok(
    Math.abs(actual - expected) <= relative * Math.max(1, Math.abs(expected)),
    `${actual} vs ${expected}`,
  );

test("eccentricity is accurate for circular states at arbitrary orbital phases", () => {
  for (const centralMass of [1e24, P.EARTH_MASS, 2e25])
    for (const bodyMass of [100, 1e23]) {
      const p = launch(1, { centralMass, bodyMass, distance: 4e7 });
      for (let i = 0; i < 24; i++) {
        const a = (i * Math.PI) / 12,
          c = Math.cos(a),
          s = Math.sin(a);
        const q = P.orbitInfo(
          {
            x: p.distance * c,
            y: p.distance * s,
            vx: -p.velocity * s,
            vy: p.velocity * c,
          },
          p,
        );
        assert.ok(
          q.eccentricity < 1e-15,
          `circular eccentricity ${q.eccentricity}`,
        );
        close(q.periapsis, p.distance);
        close(q.apoapsis, p.distance);
        close(q.period, (2 * Math.PI * p.distance) / p.velocity);
        assert.equal(q.kind, "Circular orbit");
      }
    }
});

test("elliptic, parabolic and hyperbolic elements match analytical tangential launches", () => {
  for (const ratio of [0.8, 1.1, Math.SQRT2, 1.5]) {
    const p = launch(ratio),
      q = P.orbitInfo(P.createOrbit(p).state, p);
    close(q.eccentricity, Math.abs(ratio ** 2 - 1));
    close(
      q.periapsis,
      (p.distance * ratio ** 2) / (1 + Math.abs(ratio ** 2 - 1)),
    );
    if (ratio < Math.SQRT2) {
      close(q.semiMajorAxis, p.distance / (2 - ratio ** 2));
      close(q.apoapsis, q.semiMajorAxis * (1 + q.eccentricity));
      assert.ok(Number.isFinite(q.period));
    } else {
      assert.equal(q.apoapsis, Infinity);
      assert.equal(q.period, Infinity);
    }
  }
  assert.equal(
    P.orbitInfo(P.createOrbit(launch(Math.SQRT2)).state, launch(Math.SQRT2))
      .kind,
    "Parabolic escape",
  );
});

test("surface crossing, radial fall and impact are not described as completed orbits", () => {
  const p = launch(0.5),
    q = P.orbitInfo(P.createOrbit(p).state, p);
  assert.ok(q.periapsis < P.centralRadius(p));
  assert.equal(q.intersectsSurface, true);
  assert.equal(q.kind, "Surface-crossing path");
  const radial = launch(0);
  let s = P.createOrbit(radial).state;
  assert.equal(P.orbitInfo(s, radial).kind, "Radial fall");
  for (let i = 0; i < 20000 && !s.collided; i++) s = P.stepOrbit(s, radial, 2);
  assert.equal(P.orbitInfo(s, radial).kind, "Surface impact");
  close(Math.hypot(s.x, s.y), P.centralRadius(radial));
});

test("gravity scenarios preserve the chosen masses and separation and recalculate speed", () => {
  for (const centralMass of [1e24, 2e25])
    for (const bodyMass of [100, 1e23]) {
      const original = launch(1, { centralMass, bodyMass, distance: 4e7 });
      for (let i = 0; i < 3; i++) {
        const p = SIMULATIONS.gravity.presetFor(i, original);
        assert.equal(p.centralMass, centralMass);
        assert.equal(p.bodyMass, bodyMass);
        assert.equal(p.distance, original.distance);
        close(p.velocity, P.circularSpeed(original) * [1, 0.8, 1.5][i]);
        assert.doesNotThrow(() => P.createOrbit(p));
      }
    }
});

test("the integrated ellipse returns after the calculated Kepler period with stable elements", () => {
  const p = launch(0.8);
  let s = P.createOrbit(p).state;
  const initial = P.orbitInfo(s, p);
  let maxEccentricityError = 0;
  while (s.t < initial.period) {
    s = P.stepOrbit(s, p, Math.min(2, initial.period - s.t));
    const q = P.orbitInfo(s, p);
    assert.equal(s.collided, false);
    maxEccentricityError = Math.max(
      maxEccentricityError,
      Math.abs(q.eccentricity - initial.eccentricity),
    );
  }
  assert.ok(
    maxEccentricityError < 2e-6,
    `eccentricity drift ${maxEccentricityError}`,
  );
  assert.ok(
    Math.hypot(s.x - p.distance, s.y) / p.distance < 3e-5,
    "one complete Kepler period",
  );
});
