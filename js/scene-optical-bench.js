/** Optical apparatus, not a ray-traced rendering engine. Principal rays use
 * the authoritative thin-lens/Snell calculations; glass shapes are illustrative. */
import * as T from "../vendor/three.module.min.js";
import { PALETTE as C, createSceneKit } from "./scene-kit.js";
import { lensConstruction, refractionConstruction } from "./optical-construction.js";
import { opticalBench, opticalMount, solidRay, dashedPath, angleArc } from "./scene-instruments.js";

export function lensGeometry(kind) {
  const profile = [], radius = 1.17, halfWidth = (r) => kind > 0
    ? 0.045 + 0.16 * Math.sqrt(Math.max(0, 1 - (r / radius) ** 2))
    : 0.035 + 0.17 * (r / radius) ** 2;
  for (let i = 0; i <= 40; i++) {
    const r = radius * i / 40; profile.push(new T.Vector2(r, -halfWidth(r)));
  }
  for (let i = 40; i >= 0; i--) {
    const r = radius * i / 40; profile.push(new T.Vector2(r, halfWidth(r)));
  }
  const g = new T.LatheGeometry(profile, 80);
  g.rotateZ(-Math.PI / 2); return g;
}

export function createLensApparatus(p, k) {
  const q = lensConstruction(p);
  opticalBench(k); opticalMount(k, 0, q.axis - 1.22);
  const lens = k.mesh(lensGeometry(p.kind), 0x9edfea, [0, q.axis, 0], { metalness: 0, roughness: 0.1, transparent: true, opacity: 0.2, depthWrite: false, side: T.DoubleSide });
  lens.userData.role = "optical-lens";
  const frame = k.mesh(new T.TorusGeometry(1.22, 0.045, 12, 96), 0x91a9b7, [0, q.axis, 0], { metalness: 0.8, roughness: 0.22 });
  frame.rotation.y = Math.PI / 2;
  // Optical axis and both focal points share the horizontal distance scale.
  dashedPath(k, [[-4.6, q.axis, 0], [4.6, q.axis, 0]], C.muted, 0.45);
  for (const sign of [-1, 1]) {
    const x = sign * p.focal * q.scale;
    k.ball(0.045, C.white, [x, q.axis, 0]);
    k.label(sign < 0 ? "F₁" : "F₂", [x, q.axis - 0.35, 0], "#a7c4d5", 0.5);
  }
  const object = k.arrow([q.object[0], q.axis, 0], [0, q.height, 0], C.cyan);
  object.userData.role = "optical-object";
  opticalMount(k, q.object[0], q.axis);
  k.label("Object", [q.object[0], q.axis + q.height + 0.42, 0], "#64e8d1", 1.35);
  const flows = q.rays.map((points, i) => solidRay(k, points, i ? 0xa9d5f2 : C.gold));
  for (const points of q.extensions) dashedPath(k, points, C.purple, 0.65);
  if (q.image && !q.offBench) {
    const image = k.arrow([q.image[0], q.axis, 0], [0, q.image[1] - q.axis, 0], C.purple);
    image.userData.role = "optical-image";
    k.label(q.image[0] > 0 ? "Real · inverted" : "Virtual · upright", [q.image[0], q.image[0] > 0 ? 3.7 : 4.3, 0], "#c3a6ff", 2.2);
    if (q.image[0] > 0) {
      opticalMount(k, q.image[0], q.axis - 1.35);
      k.glass(0.025, 2.7, 1.45, [q.image[0], q.axis, 0]);
    }
  }
  const outcome = q.image === null ? "Object at focus · outgoing rays parallel"
    : q.offBench ? `Image beyond the bench · v = ${q.image[0] / q.scale > 100 ? (q.image[0] / q.scale).toExponential(2) : (q.image[0] / q.scale).toFixed(2)} m`
    : p.kind > 0 ? "Two rays. One image." : "Back-project the diverging rays.";
  k.label(outcome, [0, 4.95, 0], "#d4e4ed", 5.3);
  k.label(p.kind > 0 ? "CONVERGING" : "DIVERGING", [0, 0.52, 1.35], "#94c1d5", 2.1);
  return {
    construction: q,
    update(s, values, lab) { flows.forEach((flow) => flow(s.t * 0.28, lab.vectors !== false)); },
  };
}

export function createRefractionApparatus(p, root, color = C.gold, options = {}) {
  const k = createSceneKit(root, options), q = refractionConstruction(p);
  k.stand(8.5, 3.2);
  // Both regions are visible when their index differs from air. In a TIR
  // setup the more strongly tinted region can therefore be ABOVE the boundary.
  // This is a display tint, not a density or absorption law.
  for (const [index, center, color] of [[p.n1, 3.25, 0x8cb2dc], [p.n2, 1.15, 0x76c3d3]]) {
    const block = k.glass(6.8, 2.1, 1.7, [0, center, 0], color);
    block.material.opacity = 0.02 + 0.16 * (index - 1) / 1.4;
    for (const z of [-0.85, 0.85]) {
      k.line([[-3.4, center - 1.05, z], [-3.4, center + 1.05, z], [3.4, center + 1.05, z], [3.4, center - 1.05, z]], color, index > 1.001 ? 0.28 : 0.07);
    }
  }
  k.box(6.8, 0.012, 1.7, 0x85cad8, [0, q.hit[1], 0], { transparent: true, opacity: 0.2, depthWrite: false });
  dashedPath(k, [[0, 0.2, 0.02], [0, 4.45, 0.02]], C.white, 0.55);
  k.label("Normal", [0.65, 4.32, 0], "#b5cbd8", 1.2);
  k.label(`n₁ = ${p.n1.toFixed(2)}`, [-2.7, 4.55, 0], "#b4d0df", 2);
  k.label(`n₂ = ${p.n2.toFixed(2)}`, [-2.7, 0.58, 1.2], "#94d4df", 2);
  const incident = solidRay(k, q.incident, color), flows = [[incident, p.n1]],
    reflectionVisible = q.reflectance > 1e-8,
    transmissionVisible = !!q.transmitted && q.transmission > 1e-8;
  if (reflectionVisible) flows.push([solidRay(k, q.reflected, color, Math.max(0.25, q.reflectance)), p.n1]);
  if (transmissionVisible) flows.push([solidRay(k, q.transmitted, color, Math.max(0.25, q.transmission)), p.n2]);
  angleArc(k, q.hit, 0.65, -p.angle * Math.PI / 180, 0, C.gold);
  k.label(`i = ${p.angle.toFixed(1)}°`, [-0.88, 3.2, 0.15], "#ffc584", 1.35);
  if (transmissionVisible) {
    angleArc(k, q.hit, 0.65, Math.PI - q.refracted * Math.PI / 180, Math.PI, C.blue);
    k.label(`r = ${q.refracted.toFixed(1)}°`, [0.95, 1.28, 0.2], "#a2caff", 1.35);
  }
  k.label(q.tir ? "Total internal reflection" : p.n1 === p.n2 ? "Equal indices · no bending" : p.n2 > p.n1 ? "Slows down · bends toward the normal" : "Speeds up · bends away from the normal", [0, 5.25, 0], "#d2e5ef", 5.2);
  k.label(`Reflected ${(q.reflectance * 100).toFixed(1)}%`, [2.65, 3.65, 0], "#b8d8e7", 2.2);
  k.label(`Transmitted ${(q.transmission * 100).toFixed(1)}%`, [2.65, 0.65, 0.8], "#94d4df", 2.3);
  if (q.critical !== null) k.label(`Critical angle ${q.critical.toFixed(2)}°`, [0, -0.22, 1.8], "#c3a6ff", 3.2);
  return {
    target: [0, 2.5, 0], radius: 10.3, fitAspect: 1.4, kit: k, construction: q,
    branches: { reflected: reflectionVisible, transmitted: transmissionVisible },
    update(lab) {
      flows.forEach(([flow, n]) => flow(lab.state.t * 0.3 / n, lab.vectors !== false));
      k.visibility(lab.showLabels !== false, lab.vectors !== false);
    },
  };
}
