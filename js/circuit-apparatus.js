import * as T from "../vendor/three.module.min.js";

export const CIRCUIT_INK = 0x486b80;

/** A mounted teaching circuit. Component dimensions are schematic. */
export function createCircuitBoard(k) {
  k.stand(11.2, 2.8);
  k.box(10.8, 5.4, 0.16, 0x30546b, [0, 2.6, -0.20]);
  const face = k.box(10.6, 5.2, 0.025, 0xeaf2f7, [0, 2.6, -0.10]);
  face.material.dispose();
  face.material = new T.MeshBasicMaterial({ color: 0xeaf2f7, toneMapped: false });
  for (const x of [-5.12, 5.12]) for (const y of [0.16, 5.04]) {
    k.cylinder(0.046, 0.025, 0x8ca4b3, [x, y, -0.06]).rotation.x = Math.PI / 2;
  }
}

export function circuitWire(k, path, color = CIRCUIT_INK, radius = 0.027) {
  return path.slice(1).map((point, i) => k.rod(path[i], point, color, radius));
}

export function circuitResistor(k, a, b, color = 0xd1b681) {
  const center = a.map((value, i) => (value + b[i]) / 2);
  const direction = new T.Vector3(...b).sub(new T.Vector3(...a)).normalize();
  const axis = new T.Vector3(0, 1, 0);
  // No fixed colour bands. Arbitrary slider values are labelled numerically.
  circuitWire(k, [a, b], 0x8fa9b7);
  const body = k.cylinder(0.16, 0.62, color, center, { metalness: 0.04, roughness: 0.65 });
  body.quaternion.setFromUnitVectors(axis, direction);
  for (const sign of [-1, 1]) {
    const point = center.map((value, i) => value + direction.getComponent(i) * sign * 0.31);
    k.cylinder(0.164, 0.08, 0x90a9b7, point).quaternion.copy(body.quaternion);
  }
  return body;
}

export function circuitSource(k, a, b, ac, reversed = false) {
  const center = a.map((value, i) => (value + b[i]) / 2);
  circuitWire(k, [a, [a[0], center[1] + 0.48, a[2]]]);
  circuitWire(k, [[b[0], center[1] - 0.48, b[2]], b]);
  const body = k.cylinder(0.48, 0.20, 0x30546b, center);
  body.rotation.x = Math.PI / 2;
  if (ac) {
    k.line(Array.from({ length: 33 }, (_, i) => [center[0] - 0.28 + i * 0.56 / 32,
      center[1] + 0.14 * Math.sin(i * 2 * Math.PI / 32), center[2] + 0.12]), 0xd4f6ff);
  } else {
    const mark = (y, vertical) => {
      circuitWire(k, [[center[0] - 0.12, y, center[2] + 0.12], [center[0] + 0.12, y, center[2] + 0.12]], 0xd4f6ff, 0.018);
      if (vertical) circuitWire(k, [[center[0], y - 0.12, center[2] + 0.12], [center[0], y + 0.12, center[2] + 0.12]], 0xd4f6ff, 0.018);
    };
    mark(center[1] + 0.18, !reversed);
    mark(center[1] - 0.18, reversed);
  }
}

export const circuitCamera = {
  target: [0, 2.6, 0], radius: 11.0, polar: 1.36, azimuth: -0.13, fitAspect: 1.9,
};
