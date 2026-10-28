/** Read-only lumped RC circuit. Conductors stop at the capacitor plates:
 * schematic current markers never jump through the dielectric gap. */
import * as T from "../vendor/three.module.min.js";
import { createSceneKit, PALETTE as C } from "./scene-kit.js";
import { circuitAt } from "./physics-extra.js";
import { directionMarkers } from "./scene-instruments.js";
const reading = (x) => Math.abs(x) > 0 && Math.abs(x) < 0.01 ? x.toExponential(2) : x.toFixed(2);

export function createRCBench(p, root, options = {}) {
  const k = createSceneKit(root, options), metal = { metalness: 0.7, roughness: 0.28 },
    frontPlate = [2.9, 1.1, 0.19], backPlate = [2.9, 1.1, -0.19];
  k.stand(10.2, 5.4);
  const conductor = (points, color = 0x90b2c2) => {
    for (let i = 1; i < points.length; i++) k.rod(points[i - 1], points[i], color, 0.035);
  };
  const a = [[-2.8, 0.48, 1.55], [-1, 0.48, 1.55], [1, 0.48, 1.55], [2.9, 0.48, 1.55], frontPlate],
    b = [backPlate, [2.9, 0.48, -1.55], [-2.8, 0.48, -1.55]];
  conductor(a); conductor(b);
  const bypass = [[-2.8, 0.48, -1.55], [-2.8, 0.48, 1.55]];
  if (p.discharge) conductor(bypass);
  // An instrument-like source. It is physically outside the discharge loop.
  k.box(1.4, 1.55, 1.2, 0x31576a, [-4, 0.93, 0], { roughness: 0.45, metalness: 0.45 });
  k.box(1.12, 0.5, 0.018, 0x0c1a25, [-4, 1.2, 0.61]);
  for (const z of [-0.42, 0.42]) k.cylinder(0.07, 0.08, z > 0 ? C.red : C.dark, [-3.25, 0.65, z], metal).rotation.z = Math.PI / 2;
  if (!p.discharge) {
    conductor([[-3.25, 0.65, 0.42], a[0]], C.red);
    conductor([b.at(-1), [-3.25, 0.65, -0.42]], 0x7792a5);
  } else {
    conductor([[-3.25, 0.65, 0.42], [-3.0, 0.65, 0.65]], C.red);
    conductor([[-3.25, 0.65, -0.42], [-3.0, 0.65, -0.65]], C.muted);
  }
  k.label(p.discharge ? "SOURCE ISOLATED" : `${p.voltage.toFixed(1)} V source`, [-3.5, 2.5, 0], p.discharge ? "#9ab1c2" : "#a2caff", 2.8);
  // The drawn component is schematic; R remains the selected SI resistance.
  const resistor = k.resistor(0, 0.48, 1.55, 0xd9b67d);
  resistor.scale.y = 1.6;
  for (const x of [-0.8, 0.8]) k.cylinder(0.06, 0.4, 0x8ba6b5, [x, 0.23, 1.55], metal);
  k.label(p.resistance.toLocaleString("en") + " Ω", [0, 0.11, 2.2], "#ffc584", 1.7);
  for (const [pos, color] of [[frontPlate, 0xe0bc83], [backPlate, 0x88bacd]]) {
    k.box(1.3, 1.5, 0.04, color, pos, metal);
    k.box(0.75, 0.12, 0.22, 0x314b5c, [pos[0], 0.32, pos[2]], metal);
  }
  const positive = k.instances(12, 0.047, C.gold), negative = k.instances(12, 0.047, C.cyan);
  positive.userData.role = "capacitor-positive"; negative.userData.role = "capacitor-negative";
  for (let i = 0; i < 12; i++) for (const [o, z] of [[positive, 0.218], [negative, -0.218]])
    k.instance(o, i, [2.9 + ((i % 3) - 1) * 0.35, 0.6 + Math.floor(i / 3) * 0.31, z]);
  k.finishInstances(positive); k.finishInstances(negative);
  k.label("+", [2.5, 2.18, 0.5], "#ffc584", 0.5);
  k.label("−", [3.2, 2.18, -0.3], "#64e8d1", 0.5);
  k.label((p.capacitance * 1e6).toFixed(0) + " µF", [3, 0.15, 2], "#a2caff", 2);
  const flows = p.discharge
      ? [directionMarkers(k, [...b, ...bypass.slice(1), ...a.slice(1)], C.gold, 12)]
      : [directionMarkers(k, a, C.gold, 6), directionMarkers(k, b, C.gold, 6)],
    currentLabel = k.label("", [-1.3, 3.4, 0], "#ffc584", 3),
    voltageLabel = k.label("", [2.3, 3.4, 0], "#9fd9e7", 3),
    stateLabel = k.label(p.discharge ? "Discharging through R" : "Charging through R", [0, 4.5, 0], "#d4e4ed", 4.8);
  const field = Array.from({ length: 3 }, (_, i) => k.arrow([2.9, 0.65 + i * 0.4, 0.145], [0, 0, -0.29], C.purple));
  let lastFraction = -1;
  return {
    target: [0, 1.5, 0], radius: 10.8, fitAspect: 1.7, polar: 0.98, azimuth: -0.22, kit: k,
    conductorPaths: p.discharge ? [[...b, ...bypass.slice(1), ...a.slice(1)]] : [a, b],
    update(lab) {
      const s = lab.state, q = circuitAt(s.t, p), tau = q.tau,
        fraction = q.voltage / p.voltage,
        phase = (p.discharge ? -1 : 1) * 0.75 * (1 - Math.exp(-s.t / tau)),
        relativeCurrent = Math.exp(-s.t / tau);
      if (fraction !== lastFraction) {
        positive.count = negative.count = Math.min(12, Math.max(0, Math.round(12 * fraction)));
        lastFraction = fraction;
      }
      for (const flow of flows) flow(phase, lab.vectors !== false && relativeCurrent > 1e-4, p.discharge ? -1 : 1);
      for (const [i, arrow] of field.entries()) k.setArrow(arrow, [2.9, 0.65 + i * 0.4, 0.145], [0, 0, -0.29 * fraction]);
      k.setLabel(currentLabel, "I = " + reading(q.current * 1000) + " mA", "#ffc584", 3);
      k.setLabel(voltageLabel, "V_C = " + reading(q.voltage) + " V", "#9fd9e7", 3);
      k.visibility(lab.showLabels !== false, lab.vectors !== false);
    },
  };
}
