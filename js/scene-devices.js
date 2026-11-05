import { createCircuitBoard, circuitWire, circuitSource, circuitResistor, circuitCamera } from "./circuit-apparatus.js";
import { putRod } from "./scene-kit.js";
import { directionMarkers, dashedPath } from "./scene-instruments.js";
import { calculationNumber as number } from "./calculations.js";

export function createDeviceBench(p, k) {
  createCircuitBoard(k);
  const z = 0.20, top = 3.75, bottom = 0.85,
    sourceA = [-4.0, top, z], sourceB = [-4.0, bottom, z],
    a = [-1.5, top, z], b = [0.7, top, z], loadX = 3.5,
    left = [sourceA, a], right = [b, [loadX, top, z], [loadX, 2.75, z]],
    lower = [[loadX, 1.85, z], [loadX, bottom, z], sourceB];
  circuitSource(k, sourceA, sourceB, false, p.voltage < 0);
  circuitWire(k, left, 0x927551);
  circuitWire(k, right, 0x3d9088);
  circuitWire(k, lower, 0x3d9088);
  const resistor = circuitResistor(k, [loadX, 2.75, z], [loadX, 1.85, z], 0x9ed4cc);
  resistor.userData.role = "device-load";
  k.label(number(Math.abs(p.voltage)) + " V source", [-4.0, 4.4, z], "#536b87", 2.15, "paper");
  k.label(number(p.resistance) + " Ω load", [loadX, 1.42, z], "#087b72", 2.25, "paper");
  const loadPower = k.label("", [loadX, 0.32, z], "#087b72", 2.3, "paper");
  const current = k.label("", [3.5, 3.13, z], "#087b72", 2.35, "paper");
  k.label(["Diode + resistor", "Ideal voltage-operated relay", "Ideal overcurrent cut-out"][p.mode],
    [-0.4, 4.97, z], "#42677f", 4.7, "ink");
  const status = k.label("", [-0.45, 2.50, z], "#42677f", 3.5, "paper");
  const detail = k.label("", [-0.45, 1.86, z], "#6e527f", 3.5, "paper");
  let blade;
  let diode;
  if (p.mode === 0) {
    circuitWire(k, [a, [-0.6, top, z]]);
    circuitWire(k, [[-0.05, top, z], b]);
    diode = k.cylinder(0.15, 0.57, 0x425b71, [-0.33, top, z], { emissive: 0x138a7a, emissiveIntensity: 0 });
    diode.userData.role = "device-diode";
    diode.rotation.z = Math.PI / 2;
    k.cylinder(0.154, 0.075, 0xd5e6ef, [-0.15, top, z]).rotation.z = Math.PI / 2;
    k.label("Anode", [-1.25, 3.17, z], "#5b7085", 1.1, "paper");
    k.label("Cathode band", [0.95, 3.17, z], "#5b7085", 1.8, "paper");
    k.label("0.7 V forward-drop model", [-0.4, 0.32, z], "#6e527f", 3.5, "paper");
  } else {
    circuitWire(k, [a, [-0.95, top, z]]);
    circuitWire(k, [[0.35, top, z], b]);
    for (const x of [-0.95, 0.35]) k.ball(0.085, 0x58778a, [x, top, z]);
    blade = k.rod([-0.95, top, z], [0.35, top + 0.52, z], 0xc39b5b, 0.045);
    blade.userData.role = "device-contact";
    k.label(p.mode === 1 ? "Positive control voltage" : "Prospective current",
      [-0.4, 1.15, z], "#6e527f", 3.5, "paper");
    dashedPath(k, [[-0.4, 2.92, z], [-0.4, top - 0.1, z]], 0x8a73a3, 0.8);
  }
  const markerStart = k.objects.length;
  const flow = directionMarkers(k, [sourceA, [loadX, top, z], [loadX, bottom, z], sourceB], 0xb78428, 15);
  const markers = k.objects.slice(markerStart);
  for (const marker of markers) marker.userData.circuit = "device-load";
  return {
    planar: true, camera: circuitCamera,
    update(s, q, lab) {
      const conducting = Math.abs(q.current) > 1e-12, closed = Boolean(q.on);
      if (blade) {
        putRod(blade, [-0.95, top, z], [0.35, top + (closed ? 0 : 0.64), z]);
        blade.userData.closed = closed;
      }
      if (diode) {
        diode.material.emissiveIntensity = conducting ? 0.2 : 0;
        diode.userData.conducting = conducting;
      }
      const sign = Math.sign(q.current) || 1;
      flow(s.t * 0.13 * sign, lab.vectors !== false && conducting, sign);
      k.setLabel(current, "I = " + number(q.current * 1000) + " mA", "#087b72", 2.35);
      k.setLabel(loadPower, number(q.current ** 2 * p.resistance) + " W in load", "#087b72", 2.3);
      const state = p.mode === 0
        ? conducting ? "Forward biased · current flows" : p.voltage < 0 ? "Reverse biased · blocked" : "Below forward drop · blocked"
        : closed ? conducting ? "Contact closed · current flows" : "Contact closed · no current" : p.mode === 2 ? "Contact open · overcurrent" : "Contact open · below pick-up";
      k.setLabel(status, state, conducting ? "#087b72" : "#885f32", 3.5);
      k.setLabel(detail, p.mode === 0 ? "Diode drop = " + (conducting ? "0.7 V" : number(p.voltage) + " V")
        : p.mode === 1 ? number(p.voltage) + " V control / " + number(p.threshold) + " V pick-up"
        : "|Demand| " + number(Math.abs(p.voltage / p.resistance) * 1000) + " mA / " + number(p.rating * 1000) + " mA rating",
        "#6e527f", 3.5);
    },
  };
}
