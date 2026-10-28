/** Solid teaching apparatus and direction markers. Decorative dimensions and
 * marker speed do not represent a microscopic or optical measurement. */
import * as T from "../vendor/three.module.min.js";
import { PALETTE as C, putRod } from "./scene-kit.js";

export function opticalBench(k) {
  k.stand(10.4, 3.6);
  for (const z of [-0.6, 0.6]) k.rod([-4.8, 0.22, z], [4.8, 0.22, z], 0x8ea7b3, 0.045);
  for (let i = -9; i <= 9; i++) k.line([[i / 2, 0.04, 0.95], [i / 2, 0.04, i % 2 ? 1.08 : 1.2]], C.muted, 0.7);
}
export function opticalMount(k, x, y = 2.05) {
  const metal = { metalness: 0.75, roughness: 0.28 };
  k.box(0.9, 0.18, 1.55, 0x324c5c, [x, 0.18, 0], metal);
  const length = Math.max(0.05, y - 0.28);
  k.cylinder(0.055, length, 0x9eb5c0, [x, length / 2 + 0.28, 0], metal);
  k.cylinder(0.12, 0.15, 0xc6a777, [x, 0.52, 0], metal);
  for (const z of [-0.63, 0.63]) k.cylinder(0.04, 0.025, 0xbfd0d7, [x, 0.29, z], metal);
}

export function solidRay(k, points, color = C.gold, opacity = 1) {
  const material = new T.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, toneMapped: false }),
    glow = new T.MeshBasicMaterial({ color, transparent: true, opacity: opacity * 0.08, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false });
  for (let i = 1; i < points.length; i++) for (const [radius, m] of [[0.014, material], [0.06, glow]]) {
    const rod = new T.Mesh(new T.CylinderGeometry(radius, radius, 1, 12), m);
    k.add(rod); rod.castShadow = rod.receiveShadow = false;
    putRod(rod, points[i - 1], points[i]);
  }
  return directionMarkers(k, points, color);
}

export function dashedPath(k, points, color = C.muted, opacity = 0.6) {
  const line = k.line(points, color, opacity);
  line.material.dispose();
  line.material = new T.LineDashedMaterial({ color, transparent: true, opacity, dashSize: 0.09, gapSize: 0.07, toneMapped: false });
  line.computeLineDistances();
  return line;
}

export function directionMarkers(k, points, color = C.gold, count = 3) {
  const lengths = points.slice(1).map((b, i) => Math.hypot(...b.map((v, j) => v - points[i][j]))),
    total = lengths.reduce((a, b) => a + b, 0), axis = new T.Vector3(0, 1, 0), tangent = new T.Vector3(),
    markers = Array.from({ length: count }, () => {
      const o = new T.Mesh(new T.ConeGeometry(0.052, 0.15, 12), new T.MeshBasicMaterial({ color, toneMapped: false }));
      k.add(o);
      o.castShadow = o.receiveShadow = false; o.userData.role = "direction-marker";
      return o;
    });
  return (phase, visible = true, direction = 1) => {
    markers.forEach((o, i) => {
      o.visible = visible && total > 1e-9;
      if (!o.visible) return;
      let d = (((i / count + phase) % 1 + 1) % 1) * total, segment = 0;
      while (segment < lengths.length - 1 && d > lengths[segment]) d -= lengths[segment++];
      const a = points[segment], b = points[segment + 1], fraction = d / Math.max(lengths[segment], 1e-12);
      o.position.set(...a.map((v, j) => v + (b[j] - v) * fraction));
      tangent.set(...b.map((v, j) => (v - a[j]) * direction)).normalize();
      o.quaternion.setFromUnitVectors(axis, tangent);
    });
  };
}

export function angleArc(k, center, radius, start, end, color) {
  return k.line(Array.from({ length: 49 }, (_, i) => {
    const a = start + (end - start) * i / 48;
    return [center[0] + radius * Math.sin(a), center[1] + radius * Math.cos(a), center[2] + 0.04];
  }), color, 0.9);
}

/** A rendered cable with fixed GPU allocations and analytic centre samples. */
export function dynamicCable(k, points, color = C.cyan, radius = 0.028) {
  const segments = points.length - 1,
    mesh = new T.InstancedMesh(new T.CylinderGeometry(radius, radius, 1, 10), k.material(color, { metalness: 0.35, roughness: 0.3, emissive: color, emissiveIntensity: 0.18 }), segments),
    matrix = new T.Matrix4(), quaternion = new T.Quaternion(), position = new T.Vector3(), scale = new T.Vector3(1, 1, 1),
    tangent = new T.Vector3(), axis = new T.Vector3(0, 1, 0);
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  mesh.castShadow = mesh.receiveShadow = true;
  k.add(mesh);
  const update = (values) => {
    for (let i = 0; i < segments; i++) {
      const a = values[i], b = values[i + 1];
      tangent.set(...b.map((v, j) => v - a[j]));
      scale.y = tangent.length() * 1.005;
      quaternion.setFromUnitVectors(axis, tangent.normalize());
      position.set(...a.map((v, j) => (v + b[j]) / 2));
      matrix.compose(position, quaternion, scale); mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
  };
  update(points);
  return { mesh, update };
}
