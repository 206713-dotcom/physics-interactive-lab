import * as T from "../vendor/three.module.min.js";

/** A solid helical wire. Its axial pitch changes without stretching the wire
 * cross-section. Positions and normals share fixed buffers for every frame. */
export function createHelix(turns = 12, radius = 0.19, wire = 0.032) {
  const segments = 288, sides = 8, count = (segments + 1) * (sides + 1),
    geometry = new T.BufferGeometry(),
    positions = new T.BufferAttribute(new Float32Array(count * 3), 3),
    normals = new T.BufferAttribute(new Float32Array(count * 3), 3), indices = [];
  positions.setUsage(T.DynamicDrawUsage);
  normals.setUsage(T.DynamicDrawUsage);
  geometry.setAttribute("position", positions);
  geometry.setAttribute("normal", normals);
  for (let i = 0; i < segments; i++) for (let j = 0; j < sides; j++) {
    const a = i * (sides + 1) + j, b = a + sides + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  geometry.setIndex(indices);
  return {
    geometry,
    update(length) {
      const omega = turns * Math.PI * 2, tangent = Math.hypot(length, radius * omega),
        ax = length / tangent, twist = radius * omega / tangent;
      for (let i = 0; i <= segments; i++) {
        const f = i / segments, angle = f * omega, c = Math.cos(angle), s = Math.sin(angle);
        for (let j = 0; j <= sides; j++) {
          const u = j / sides * Math.PI * 2, cu = Math.cos(u), su = Math.sin(u),
            nx = -su * twist, ny = cu * c - su * ax * s, nz = cu * s + su * ax * c,
            index = i * (sides + 1) + j;
          positions.setXYZ(index, f * length + wire * nx, radius * c + wire * ny, radius * s + wire * nz);
          normals.setXYZ(index, nx, ny, nz);
        }
      }
      positions.needsUpdate = normals.needsUpdate = true;
      geometry.computeBoundingSphere();
    },
  };
}

