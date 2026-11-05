import { createCircuitBoard, circuitWire, circuitSource, circuitResistor, circuitCamera } from "./circuit-apparatus.js";
import { directionMarkers, dashedPath } from "./scene-instruments.js";
import { calculationNumber as number } from "./calculations.js";

export function createSensorBench(p, k) {
  createCircuitBoard(k);
  const z = 0.20, x = -0.65, top = 4.05, bottom = 0.72, tap = 2.40,
    sensorY = p.orientation ? 3.25 : 1.55,
    fixedY = p.orientation ? 1.55 : 3.25,
    sourceTop = [-3.95, top, z], sourceBottom = [-3.95, bottom, z];
  circuitSource(k, sourceTop, sourceBottom, false);
  // These short paths terminate at each component instead of bypassing it.
  // Explicit upper/lower arms work for either orientation.
  const upperY = 3.25, lowerY = 1.55;
  circuitWire(k, [sourceTop, [x, top, z]]);
  circuitWire(k, [[x, top, z], [x, upperY + 0.43, z]]);
  circuitWire(k, [[x, upperY - 0.43, z], [x, lowerY + 0.43, z]]);
  circuitWire(k, [[x, lowerY - 0.43, z], [x, bottom, z], sourceBottom]);
  circuitResistor(k, [x, fixedY + 0.43, z], [x, fixedY - 0.43, z], 0xd1b681);
  const sensor = k.cylinder(p.mode ? 0.20 : 0.28, 0.13, p.mode ? 0x9875b7 : 0xd4ac66, [x, sensorY, z + 0.02]);
  sensor.rotation.x = Math.PI / 2;
  circuitWire(k, [[x, sensorY + 0.43, z], [x, sensorY + 0.20, z]], 0x8fa9b7);
  circuitWire(k, [[x, sensorY - 0.20, z], [x, sensorY - 0.43, z]], 0x8fa9b7);
  if (p.mode) {
    circuitWire(k, [[x - 0.31, sensorY - 0.25, z + 0.10], [x + 0.26, sensorY + 0.29, z + 0.10],
      [x + 0.40, sensorY + 0.29, z + 0.10]], 0x6c448e, 0.018);
  } else {
    const zigzag = Array.from({ length: 7 }, (_, i) => [x + (i % 2 ? -0.09 : 0.09), sensorY - 0.19 + i * 0.063, z + 0.10]);
    circuitWire(k, zigzag, 0x5f4930, 0.018);
    for (const offset of [0, 0.29]) k.arrow([x - 1.05, sensorY + 0.56 + offset, z],
      [0.64, -0.43, 0], 0xbd8e37);
  }
  k.label(number(p.voltage) + " V supply", [-3.95, 4.55, z], "#466a86", 1.8, "paper");
  k.label(number(p.fixed / 1000) + " kΩ fixed", [x - 1.28, fixedY - 0.18, z], "#8b641e", 1.8, "paper");
  const sensorLabel = k.label("", [x + 1.25, sensorY, z], "#72519a", 2.0, "paper");
  k.label(p.mode ? number(p.temperature) + " °C" : number(p.lux) + " lux",
    [x - 1.5, sensorY + 0.15, z], "#72519a", 1.7, "paper");
  k.label(p.mode ? "NTC temperature sensor" : "Light-dependent resistor",
    [-1.9, 4.96, z], "#466a86", 3.6, "ink");
  k.ball(0.07, 0x3a6075, [x, tap, z]);
  circuitWire(k, [[x, tap, z], [1.50, tap, z]], 0xb48838);
  dashedPath(k, [[x, bottom, z], [1.50, bottom, z], [1.50, 1.6, z]], 0x7b90a1, 0.8);
  k.label("0 V reference", [0.1, 0.28, z], "#567689", 1.9, "paper");
  k.label("Output tap", [0.55, tap + 0.24, z], "#946820", 1.5, "paper");
  k.box(2.55, 2.5, 0.28, 0x30556b, [2.85, 2.65, 0.20]);
  k.box(2.29, 1.04, 0.02, 0x0f293b, [2.85, 3.18, 0.355]);
  const voltage = k.label("", [2.85, 3.18, 0.40], "#a0efe0", 1.85, "ink");
  k.label("DIVIDER OUTPUT", [2.85, 4.18, z], "#08776e", 2.2, "paper");
  k.label("Threshold " + number(p.threshold) + " V", [2.85, 2.31, 0.40], "#ffcf87", 2.15, "ink");
  const indicator = k.ball(0.115, 0x66a697, [2.20, 1.85, 0.41], { emissive: 0x65f0c9, emissiveIntensity: 0 });
  indicator.userData.role = "sensor-comparator-indicator";
  const onLabel = k.label("", [3.0, 1.85, 0.41], "#9fc1cc", 0.95, "ink");
  k.label("Ideal threshold indicator", [2.85, 1.04, z], "#5b7688", 2.8, "paper");
  const level = k.box(0.13, 1, 0.03, 0x68dfcd, [4.45, 1.7, z]);
  const thresholdY = 1.45 + 2.15 * p.threshold / Math.max(p.voltage, p.threshold);
  k.box(0.50, 0.035, 0.06, 0xc78a30, [4.45, thresholdY, z + 0.04]);
  circuitWire(k, [[4.45, 1.45, z], [4.45, 3.6, z]], 0x8ca6b8, 0.011);
  k.label(number(Math.max(p.voltage, p.threshold)) + " V", [4.45, 3.88, z], "#587688", 0.85, "paper");
  const flow = directionMarkers(k, [sourceTop, [x, top, z], [x, bottom, z], sourceBottom], 0xb7822c, 14);
  const current = k.label("", [-3.1, 0.28, z], "#466a86", 2.4, "paper");
  return {
    planar: true, camera: circuitCamera,
    update(s, q, lab) {
      k.setLabel(sensorLabel, number(q.resistance / 1000) + " kΩ " + (p.mode ? "NTC" : "LDR"), "#72519a", 2.0);
      k.setLabel(voltage, number(q.output) + " V", "#a0efe0", 1.85);
      k.setLabel(onLabel, q.on ? "ON" : "OFF", q.on ? "#9cf4ce" : "#9fc1cc", 0.95);
      k.setLabel(current, "Divider I = " + number(q.current * 1000) + " mA", "#466a86", 2.4);
      indicator.material.emissiveIntensity = q.on ? 1.2 : 0;
      indicator.userData.on = Boolean(q.on);
      const height = 2.15 * q.output / Math.max(p.voltage, p.threshold);
      level.scale.y = Math.max(1e-8, height);
      level.position.y = 1.45 + height / 2;
      flow(s.t * Math.min(0.4, q.current * 100), lab.vectors !== false);
    },
  };
}
