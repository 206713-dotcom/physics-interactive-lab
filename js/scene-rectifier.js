import * as T from "../vendor/three.module.min.js";
import { createCircuitBoard, circuitWire, circuitSource, circuitResistor, circuitCamera } from "./circuit-apparatus.js";
import { directionMarkers } from "./scene-instruments.js";
import { calculationNumber as number } from "./calculations.js";

export function createRectifierBench(p, k) {
  createCircuitBoard(k);
  const z = 0.20, sourceA = [-3.9, 3.7, z], sourceB = [-3.9, 0.9, z],
    A = [-1.5, 2.3, z], B = [1.1, 2.3, z], P = [-0.2, 3.7, z], N = [-0.2, 0.9, z],
    loadTop = [3.05, 3.7, z], loadBottom = [3.05, 0.9, z],
    inputA = [sourceA, [-2.25, 3.7, z], [-2.25, 2.3, z], A],
    // The raised wire crosses the load return without making a junction.
    inputB = [sourceB, [-3.9, 0.34, z], [1.8, 0.34, z],
      [1.8, 0.65, z], [1.8, 0.74, z + 0.25], [1.8, 1.06, z + 0.25], [1.8, 1.15, z],
      [1.8, 2.3, z], B],
    halfPath = [sourceA, loadTop, loadBottom, sourceB],
    diodes = [];
  circuitSource(k, sourceA, sourceB, true);
  circuitResistor(k, [3.05, 2.95, z], [3.05, 1.65, z], 0xa2d5ce);
  k.label("AC source", [-3.9, 4.30, z], "#5d4c91", 1.65, "paper");
  const inputLabel = k.label("", [-3.9, 1.57, z + 0.10], "#5d4c91", 1.65, "paper");
  k.label(number(p.resistance) + " Ω load", [3.05, 1.22, z + 0.12], "#087b72", 2.1, "paper");
  const outputLabel = k.label("", [3.2, 4.34, z], "#087b72", 2.7, "paper");
  const currentLabel = k.label("", [4.31, 2.3, z], "#087b72", 1.8, "paper");
  const status = k.label("", [0, 4.96, z], "#34566f", 5.6, "ink");
  const loadFlow = directionMarkers(k, [loadTop, loadBottom], 0x0a8b7c, 3);
  k.label("+", [3.6, 3.7, z], "#087b72", 0.4, "paper");
  k.label("−", [3.6, 0.80, z], "#087b72", 0.4, "paper");

  function diode(a, b, label, polarity) {
    const leads = circuitWire(k, [a, b]);
    for (const lead of leads) lead.material = lead.material.clone();
    const center = a.map((value, i) => (value + b[i]) / 2);
    const direction = new T.Vector3(...b).sub(new T.Vector3(...a)).normalize();
    const body = k.cylinder(0.115, 0.47, 0x485e76, center, { emissive: 0x167f72, emissiveIntensity: 0 });
    body.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction);
    const bandAt = center.map((value, i) => value + direction.getComponent(i) * 0.13);
    const band = k.cylinder(0.119, 0.06, 0xdbe8f0, bandAt);
    band.quaternion.copy(body.quaternion);
    body.userData.role = "rectifier-diode";
    body.userData.diode = label;
    const caption = k.label(label, [center[0] + (center[0] < -0.2 ? -0.28 : 0.28), center[1] + 0.26, z + 0.1],
      "#567386", 0.55, "paper");
    diodes.push({ body, leads, caption, label, polarity });
  }

  let positiveFlow, negativeFlow;
  if (p.mode) {
    circuitWire(k, inputA, 0x7c66a2);
    circuitWire(k, inputB, 0x7c66a2);
    diode(A, P, "D1", 1); diode(B, P, "D2", -1);
    diode(N, A, "D3", -1); diode(N, B, "D4", 1);
    circuitWire(k, [P, loadTop, [3.05, 2.95, z]], 0x168e81);
    circuitWire(k, [[3.05, 1.65, z], loadBottom, N], 0x168e81);
    positiveFlow = directionMarkers(k, [...inputA, P, loadTop, loadBottom, N, ...inputB.slice().reverse()], 0xba7e26, 17);
    negativeFlow = directionMarkers(k, [...inputB, P, loadTop, loadBottom, N, ...inputA.slice().reverse()], 0xba7e26, 17);
    for (const point of [A, B, P, N]) k.ball(0.065, 0x3b6177, point);
  } else {
    circuitWire(k, [sourceA, [-1.3, 3.7, z]], 0x7c66a2);
    diode([-1.3, 3.7, z], [0.5, 3.7, z], "D1", 1);
    circuitWire(k, [[0.5, 3.7, z], loadTop, [3.05, 2.95, z]], 0x168e81);
    circuitWire(k, [[3.05, 1.65, z], loadBottom, sourceB], 0x168e81);
    positiveFlow = directionMarkers(k, halfPath, 0xba7e26, 13);
  }
  k.label("Band marks the cathode", [0.0, -0.04, z], "#536f81", 3.6, "paper");

  return {
    planar: true, camera: circuitCamera,
    update(s, q, lab) {
      // Snap only visual zero crossings. The authoritative sample is unchanged.
      const sign = Math.abs(q.input) < p.peak * 1e-10 ? 0 : Math.sign(q.input);
      const conducting = sign > 0 || (p.mode && sign < 0);
      const phase = s.t * p.frequency * 0.65;
      for (const diode of diodes) {
        const active = conducting && diode.polarity === sign;
        diode.body.material.color.setHex(active ? 0x129886 : 0x485e76);
        diode.body.material.emissiveIntensity = active ? 0.25 : 0;
        diode.body.userData.conducting = Boolean(active);
        for (const lead of diode.leads) lead.material.color.setHex(active ? 0xb17e32 : 0x91a8b6);
        k.setLabel(diode.caption, diode.label, active ? "#086e60" : "#667f90", 0.55);
      }
      positiveFlow(phase, lab.vectors !== false && sign > 0);
      negativeFlow?.(phase, lab.vectors !== false && sign < 0);
      loadFlow(phase, lab.vectors !== false && Boolean(conducting));
      k.setLabel(inputLabel, "Vin = " + number(sign ? q.input : 0) + " V", "#5d4c91", 1.65);
      k.setLabel(outputLabel, "Vload = " + number(conducting ? q.output : 0) + " V", "#087b72", 2.7);
      k.setLabel(currentLabel, "I = " + number(conducting ? q.current * 1000 : 0) + " mA", "#087b72", 1.8);
      k.setLabel(status, !sign ? "Zero crossing · no load current" : !conducting ? "Negative half-cycle · diode blocks"
        : p.mode ? (sign > 0 ? "D1 + D4 conduct · current down the load" : "D2 + D3 conduct · current down the load")
        : "Positive half-cycle · current down the load", "#34566f", 5.6);
    },
  };
}
