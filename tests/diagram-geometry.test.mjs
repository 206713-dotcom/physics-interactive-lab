import { test } from 'node:test';
import assert from 'node:assert/strict';
import { springTravel, wireTravel } from '../js/apparatus-scales.js';
import { rippleFronts, RIPPLE_HALF_LENGTH, RIPPLE_HALF_WIDTH } from '../js/ripple-geometry.js';

test('extension indicators use a fixed increasing display scale', () => {
  for (const [scale, reference] of [[springTravel, 0.2], [wireTravel, 0.0004]]) {
    assert.equal(scale(0), 0);
    assert.equal(scale(reference), 0.5);
    assert.ok(scale(reference / 2) < scale(reference));
    assert.ok(scale(reference) < scale(reference * 2));
    assert.ok(scale(1e3) < 1);
  }
});

test('incident and reflected crests advance at the same speed in opposite directions', () => {
  const positions = travel => {
    const fronts = rippleFronts(1, travel, 1, true);
    return [fronts.filter(front => !front.kind).at(-1).points[0][0],
      fronts.find(front => front.kind).points[0][0]];
  };
  assert.deepEqual(positions(0.25), [-0.75, -0.25]);
  assert.deepEqual(positions(0.50), [-0.50, -0.50]);
});

test('diffraction curves bend more at a narrow gap and stay within the tank', () => {
  const firstFront = gap => rippleFronts(1, 0.5, gap, false).find(front => front.kind).points;
  assert.ok(firstFront(0.2)[0][0] < firstFront(4)[0][0]);
  for (const wavelength of [0.1, 1, 10]) {
    for (const gap of [0.2, 1, 4]) {
      const fronts = rippleFronts(wavelength, 13.1, gap, false);
      assert.ok(fronts.length <= 82);
      for (const { points } of fronts) {
        for (const [x, z] of points) {
          assert.ok(Math.abs(x) <= RIPPLE_HALF_LENGTH + 1e-10);
          assert.ok(Math.abs(z) <= RIPPLE_HALF_WIDTH + 1e-10);
        }
      }
    }
  }
});
