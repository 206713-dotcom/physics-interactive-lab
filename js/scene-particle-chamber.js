/** Machined field chamber. The trajectory is analytic, matching the graph;
 * the backdrop and enlarged particle are apparatus illustrations. */
import * as T from "../vendor/three.module.min.js";
import { PALETTE as C } from "./scene-kit.js";
import { chargedLayout } from "./field-geometry.js";
import { dynamicCable, dashedPath } from "./scene-instruments.js";
const number = (x) => x === 0 ? "0" : x.toExponential(2);
export function createParticleChamber(p, k) {
  const layout = chargedLayout(p), metal = { metalness: 0.7, roughness: 0.3 };
  k.stand(9.2, 3.8);
  k.box(8, 4.5, 0.18, 0x152c3e, [0, 2.35, -0.82], { roughness: 0.75, metalness: 0.15 });
  for (const x of [-4.05, 4.05]) for (const z of [-0.8, 0.8]) {
    k.rod([x, 0.15, z], [x, 4.65, z], 0x8ba4b2, 0.04);
    k.box(0.35, 0.16, 0.4, 0x385260, [x, 0.16, z], metal);
  }
  for (const z of [-0.8, 0.8]) k.rod([-4.05, 4.65, z], [4.05, 4.65, z], 0x809baa, 0.04);
  const glyphs = new T.Group(); k.add(glyphs);
  for (let x = -3; x <= 3; x += 1.5) for (const y of [1.1, 2.35, 3.6]) {
    const ring = k.ring(0.115, C.blue, [x, y, -0.65], "z", 0.5); glyphs.add(ring);
    if (p.field >= 0) glyphs.add(k.ball(0.025, C.blue, [x, y, -0.63]));
    else for (const sign of [-1, 1]) {
      const rod = k.rod([x - 0.055, y - sign * 0.055, -0.63], [x + 0.055, y + sign * 0.055, -0.63], C.blue, 0.011); glyphs.add(rod);
    }
  }
  const release = layout.point(0);
  k.ball(0.06, C.white, release);
  k.label("Release", [release[0] - 0.65, release[1], 0.2], "#bdd1df", 1.1);
  const points = Array.from({ length: 257 }, () => [...release]), trail = dynamicCable(k, points, C.cyan, 0.025),
    particle = k.ball(0.11, C.gold, release, { metalness: 0.4, roughness: 0.2, emissive: C.gold, emissiveIntensity: 0.35 });
  particle.userData.role = "charged-particle"; trail.mesh.userData.role = "charged-trajectory";
  // Complete-orbit guide is shown only when a full orbit fits this window.
  if (layout.period * 2 <= layout.duration * (1 + 1e-12)) {
    const guide = Array.from({ length: 193 }, (_, i) => layout.point(layout.period * i / 192));
    dashedPath(k, guide, C.muted, 0.4);
  }
  const velocity = k.arrow(release, [1, 0, 0], C.gold),
    force = k.arrow(release, [0, 1, 0], C.purple),
    headline = k.label("", [0, 5.25, 0], "#d5e6ef", 5.6),
    radiusLabel = k.label("", [-2.2, 0.35, 1.5], "#a2d9df", 3),
    forceLabel = k.label("", [2.0, 0.35, 1.5], "#c3a6ff", 3.2);
  k.label(p.field === 0 ? "B = 0" : `${p.field > 0 ? "⊙ out" : "⊗ into"} · |B| = ${(Math.abs(p.field) * 1000).toFixed(2)} mT`, [0, 4.7, 0], "#a2caff", 4);
  k.label("Gold: velocity  ·  purple: force", [0, -0.23, 1.85], "#a8bfce", 4.2);
  return {
    camera: { target: [0, 2.4, 0], radius: 12.5, polar: 1.35, azimuth: -0.14, fitAspect: 1.6 },
    layout,
    update(s, q, lab) {
      const at = layout.point(s.t), phase = layout.omega * s.t;
      for (let i = 0; i < points.length; i++) points[i] = layout.point(s.t * i / (points.length - 1));
      trail.update(points); particle.position.set(...at);
      k.setArrow(velocity, at, [1.05 * Math.cos(phase), 1.05 * Math.sin(phase), 0]);
      const sign = Math.sign(p.charge * p.field);
      k.setArrow(force, at, [sign * Math.sin(phase) * 0.85, -sign * Math.cos(phase) * 0.85, 0]);
      glyphs.visible = p.field !== 0 && lab.vectors !== false;
      trail.mesh.visible = lab.showTrail !== false;
      k.setLabel(headline, q.force === 0 ? "No magnetic force · straight flight" : "Force turns the velocity · speed stays constant", "#d5e6ef", 5.6);
      k.setLabel(radiusLabel, q.radius === null ? "No circular radius" : "r = " + number(q.radius) + " m", "#a2d9df", 3);
      k.setLabel(forceLabel, "|F| = " + number(q.force) + " N", "#c3a6ff", 3.2);
    },
  };
}
