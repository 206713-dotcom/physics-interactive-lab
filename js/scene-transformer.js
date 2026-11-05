import * as T from "../vendor/three.module.min.js";
import { circuitWire, circuitSource, circuitResistor } from "./circuit-apparatus.js";
import { directionMarkers, dashedPath } from "./scene-instruments.js";
import { transformerVisual } from "./transformer-visual.js";
import { calculationNumber as number } from "./calculations.js";

export function createTransformerBench(p, k) {
  k.stand(11.7, 4.6);
  const core = 0x526d80, gold = 0xd4a15d, teal = 0x3cbaab, purple = 0xb49bdf;
  // Separate windings surround an unbroken laminated rectangular core.
  for (const x of [-1.65, 1.65]) k.box(0.52, 3.7, 0.85, core, [x, 2.0, 0]);
  for (const y of [0.4, 3.6]) k.box(3.8, 0.5, 0.85, core, [0, y, 0]);
  for (let z = -0.36; z <= 0.36; z += 0.12) {
    for (const y of [0.16, 3.85]) k.line([[-1.9, y, z], [1.9, y, z]], 0x91a5b2, 0.7);
  }
  function winding(x, turns, color, startAngle) {
    const shown = Math.max(4, Math.min(24, Math.round(turns / 50)));
    const samples = shown * 24 + 1;
    const points = Array.from({ length: samples }, (_, i) => {
      const u = i / (samples - 1), angle = startAngle + 2 * Math.PI * shown * u;
      return [x + 0.58 * Math.cos(angle), 0.95 + 2.1 * u, 0.58 * Math.sin(angle)];
    });
    const curve = new T.CatmullRomCurve3(points.map(point => new T.Vector3(...point)));
    const coil = k.mesh(new T.TubeGeometry(curve, shown * 32, 0.038, 8, false), color, [0, 0, 0],
      { metalness: 0.52, roughness: 0.34 });
    coil.userData.role = "transformer-winding";
    return { bottom: points[0], top: points.at(-1), points };
  }
  const primary = winding(-1.65, p.np, gold, Math.PI);
  const secondary = winding(1.65, p.ns, teal, 0);
  const sourceTop = [-4.55, 3.05, 0], sourceBottom = [-4.55, 0.95, 0];
  circuitSource(k, sourceTop, sourceBottom, true);
  circuitWire(k, [sourceTop, primary.top], gold);
  circuitWire(k, [primary.bottom, sourceBottom], gold);
  const loadTop = [4.55, 3.05, 0], loadBottom = [4.55, 0.95, 0];
  circuitWire(k, [secondary.top, loadTop, [4.55, 2.55, 0]], teal);
  circuitWire(k, [[4.55, 1.45, 0], loadBottom, secondary.bottom], teal);
  circuitResistor(k, [4.55, 2.55, 0], [4.55, 1.45, 0], 0x9ed4cc);
  k.label("Primary · " + p.np + " turns", [-2.75, 4.55, 0], "#ffc584", 3.5);
  k.label("Secondary · " + p.ns + " turns", [2.75, 4.55, 0], "#83efdf", 3.5);
  k.label(number(p.vp) + " V a.c.", [-4.35, 3.8, 0], "#ffc584", 2.0);
  k.label(number(p.load) + " Ω load", [4.35, 0.44, 0], "#83efdf", 1.9);
  const primaryReading = k.label("", [-4.35, 0.44, 0], "#ffc584", 2.1);
  const secondaryReading = k.label("", [4.35, 3.8, 0], "#83efdf", 2.1);
  const secondaryCurrent = k.label("", [2.45, 0.1, 1.0], "#83efdf", 2.4);
  k.label("Shared changing flux", [0, 2.8, 0.65], "#d4bdff", 2.5);
  k.label("Separate electrical circuits", [0, 1.25, 0.75], "#d7e6f0", 3.1);
  const ratio = k.label("", [0, 2.0, 0.7], "#d7e6f0", 2.7);
  const fluxPath = [[-1.65, 0.4, 0.64], [1.65, 0.4, 0.64], [1.65, 3.6, 0.64], [-1.65, 3.6, 0.64], [-1.65, 0.4, 0.64]];
  dashedPath(k, fluxPath, purple, 0.7);
  const field = [
    { center: [0, 3.6, 0.65], axis: [1, 0, 0] },
    { center: [1.65, 2, 0.65], axis: [0, -1, 0] },
    { center: [0, 0.4, 0.65], axis: [-1, 0, 0] },
    { center: [-1.65, 2, 0.65], axis: [0, 1, 0] },
  ].map(({center, axis}) => ({ center, axis, arrow: k.arrow(center, axis, purple) }));
  for (const item of field) item.arrow.userData.role = "transformer-flux-arrow";
  const primaryPath = [sourceTop, ...primary.points.slice().reverse(), sourceBottom];
  const secondaryPath = [secondary.top, loadTop, loadBottom, ...secondary.points];
  const primaryStart = k.objects.length;
  const pFlow = directionMarkers(k, primaryPath, 0xffd18b, 24);
  for (const marker of k.objects.slice(primaryStart)) marker.userData.circuit = "transformer-primary";
  const secondaryStart = k.objects.length;
  const sFlow = directionMarkers(k, secondaryPath, 0x8ff7e7, 24);
  for (const marker of k.objects.slice(secondaryStart)) marker.userData.circuit = "transformer-secondary";
  const primaryLength = primaryPath.slice(1).reduce((sum, point, i) => sum + Math.hypot(...point.map((v,j) => v - primaryPath[i][j])), 0);
  const secondaryLength = secondaryPath.slice(1).reduce((sum, point, i) => sum + Math.hypot(...point.map((v,j) => v - secondaryPath[i][j])), 0);
  // Cosine progress reverses each marker smoothly as the sinusoidal current
  // reverses. Within a setup, path-length correction preserves the current ratio.
  return {
    camera: { target: [0, 2.15, 0], radius: 12.5, polar: 1.13, azimuth: -0.15, fitAspect: 1.9 },
    update(s, q, lab) {
      const visual = transformerVisual(s.t), normal = Math.max(q.ip, q.is);
      pFlow(-0.60 * Math.cos(visual.phase) * q.ip / normal / primaryLength,
        lab.vectors !== false && visual.voltage !== 0, Math.sign(visual.voltage) || 1);
      sFlow(-0.60 * Math.cos(visual.phase) * q.is / normal / secondaryLength,
        lab.vectors !== false && visual.voltage !== 0, Math.sign(visual.voltage) || 1);
      for (const { center, axis, arrow } of field) {
        const vector = axis.map(value => value * 0.95 * visual.flux);
        k.setArrow(arrow, center.map((value, i) => value - vector[i] / 2), vector);
      }
      k.setLabel(primaryReading, number(q.ip) + " A a.c.", "#ffc584", 2.1);
      k.setLabel(secondaryReading, number(q.vs) + " V a.c.", "#83efdf", 2.1);
      k.setLabel(secondaryCurrent, number(q.is) + " A a.c.", "#83efdf", 2.4);
      k.setLabel(ratio, "Nₛ / Nₚ = " + number(q.ratio), "#d7e6f0", 2.7);
    },
  };
}
