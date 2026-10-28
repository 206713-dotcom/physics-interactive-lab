/** Right-hand-rule apparatus. Field-line spacing/arrow length are qualitative;
 * the numerical readings retain the ideal solenoid and straight-wire laws. */
import * as T from "../vendor/three.module.min.js";
import { PALETTE as C } from "./scene-kit.js";
import { createHelix } from "./scene-precision.js";
import { directionMarkers } from "./scene-instruments.js";
const TAU = 2 * Math.PI;
export function createMagnetismApparatus(p, k) {
  k.stand(9.5, 5.7);
  const field = new T.Group(); k.add(field);
  field.userData.role = "magnetic-field";
  const metal = { metalness: 0.75, roughness: 0.25 }, poles = [];
  const I = k.label("", [-2.35, 5.1, 0], "#ffc584", 3.1),
    B = k.label("", [2.0, 5.1, 0], "#64e8d1", 3.5);
  let flow = () => {};
  if (p.mode === 0) {
    const length = p.length * 16, radius = 0.72,
      turns = Math.max(8, Math.min(24, Math.round(p.turns / 10))),
      helix = createHelix(turns, radius, 0.025);
    helix.update(length);
    const coil = k.mesh(helix.geometry, 0xd39053, [-length / 2, 2, 0], metal);
    coil.userData.role = "solenoid-winding";
    const former = k.cylinder(0.66, length + 0.12, 0x90bdcf, [0, 2, 0], { transparent: true, opacity: 0.08, depthWrite: false, metalness: 0, roughness: 0.16 });
    former.rotation.z = Math.PI / 2;
    for (const x of [-length / 2 - 0.08, length / 2 + 0.08]) {
      const flange = k.ring(0.87, 0x8ba4af, [x, 2, 0], "z", 1); flange.rotation.y = Math.PI / 2;
      k.box(0.4, 0.13, 1.55, 0x345366, [x, 0.18, 0], metal);
      k.rod([x, 0.24, 0], [x, 1.3, 0], 0x9ab1bd, 0.06);
    }
    k.rod([-length / 2, 2 + radius, 0], [-length / 2 - 0.5, 0.45, 1.5], C.gold, 0.025);
    k.rod([length / 2, 2 + radius, 0], [length / 2 + 0.5, 0.45, 1.5], C.gold, 0.025);
    for (const sign of [-1, 1]) {
      const x = sign * (length / 2 + 0.5);
      k.cylinder(0.14, 0.16, sign > 0 ? 0x496578 : 0xaa5f50, [x, 0.32, 1.5]);
      k.cylinder(0.07, 0.13, 0xd2b788, [x, 0.45, 1.5], metal);
    }
    const winding = Array.from({ length: 385 }, (_, i) => {
      const u = i / 384; return [-length / 2 + length * u, 2 + radius * Math.cos(u * TAU * turns), radius * Math.sin(u * TAU * turns)];
    });
    flow = directionMarkers(k, winding, C.white, 5);
    const extent = length / 2 + 0.65;
    for (const phi of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) {
      const points = [[-extent, 2, 0], [extent, 2, 0], ...Array.from({ length: 97 }, (_, i) => {
        const a = i / 96 * Math.PI;
        return [extent * Math.cos(a), 2 + 1.45 * Math.sin(a) * Math.cos(phi), 1.45 * Math.sin(a) * Math.sin(phi)];
      })];
      const line = k.line(points, C.cyan, 0.34); field.add(line);
      const arrow = k.arrow([0, 2 + 1.45 * Math.cos(phi), 1.45 * Math.sin(phi)], [-0.65 * Math.sign(p.current), 0, 0], C.cyan); field.add(arrow);
    }
    for (const z of [-0.18, 0.18]) {
      const arrow = k.arrow([-0.7 * Math.sign(p.current), 2, z], [1.4 * Math.sign(p.current), 0, 0], C.cyan); field.add(arrow);
    }
    for (const sign of [-1, 1]) {
      const north = sign * p.current > 0;
      poles.push(k.label(north ? "N" : "S", [sign * (length / 2 + 0.4), 3.05, 0], north ? "#ffb1a2" : "#a2caff", 0.65));
    }
    k.label(`N = ${p.turns}  ·  L = ${p.length.toFixed(2)} m`, [0, 4.25, 0], "#c4d9e6", 4);
    k.label("Drawn turns simplified", [0, 0.3, 2.05], "#93b1c2", 3.2);
  } else {
    k.cylinder(0.065, 3.9, 0xd9a66c, [0, 2.1, 0], metal);
    for (const y of [0.2, 4.0]) {
      k.cylinder(0.25, 0.12, 0x3a5262, [0, y, 0], metal);
      k.ring(0.3, C.muted, [0, y + 0.07, 0], "y", 0.7);
    }
    for (const radius of [0.7, 1.25, 1.8]) {
      const points = Array.from({ length: 129 }, (_, i) => {
        const a = i / 128 * TAU; return [radius * Math.cos(a), 2.1, -radius * Math.sin(a)];
      });
      field.add(k.line(points, C.cyan, 0.45));
      for (const a of [0, Math.PI]) field.add(k.arrow([radius * Math.cos(a), 2.1, -radius * Math.sin(a)], [-0.45 * Math.sin(a) * Math.sign(p.current), 0, -0.45 * Math.cos(a) * Math.sign(p.current)], C.cyan));
    }
    k.arrow([0, p.current >= 0 ? 0.9 : 3.25, 0.18], [0, 2.4 * Math.sign(p.current), 0], C.gold);
    const path = [[0.13, 0.3, 0], [0.13, 3.9, 0]];
    flow = directionMarkers(k, path, C.gold, 4);
    k.ball(0.085, C.purple, [1.25, 2.1, 0]);
    k.label("Reading at r = 0.050 m", [2.1, 3.4, 0], "#c3a6ff", 3.1);
    k.label("Curl fingers with B · thumb with I", [0, 0.2, 2.3], "#bed8e5", 5);
  }
  return {
    camera: { target: [0, 2.5, 0], radius: 12.5, polar: 1.35, azimuth: -0.32, fitAspect: 1.6 },
    update(s, q, lab) {
      field.visible = p.current !== 0 && lab.vectors !== false;
      flow(s.t * 0.15 * Math.sign(p.current), p.current !== 0 && lab.vectors !== false, Math.sign(p.current) || 1);
      k.setLabel(I, `I = ${p.current.toFixed(2)} A`, "#ffc584", 3.1);
      k.setLabel(B, `B = ${(q.field * 1e3).toFixed(3)} mT`, "#64e8d1", 3.5);
    },
    afterVisibility(lab) { poles.forEach((pole) => { pole.visible = p.current !== 0 && lab.showLabels !== false; }); },
  };
}
