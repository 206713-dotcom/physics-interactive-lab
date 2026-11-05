import * as T from "../vendor/three.module.min.js";
import { PALETTE as C, clamp } from "./scene-kit.js";
import { circuitWire } from "./circuit-apparatus.js";
import { directionMarkers } from "./scene-instruments.js";
import { calculationNumber as number } from "./calculations.js";

export function createFilamentBench(p, k) {
  k.stand(10.6, 5);
  const x = -0.8, metal = { metalness: 0.65, roughness: 0.32 };
  k.box(1.55, 1.9, 1.3, 0x31566c, [-4.0, 1.15, 0], metal);
  k.box(1.25, 0.55, 0.02, 0x10293c, [-4.0, 1.5, 0.67]);
  k.label(number(p.voltage) + " V DC", [-4.0, 1.5, 0.72], "#a4eddf", 1.08, "ink");
  k.label("Supply", [-4.0, 2.55, 0], "#c5deec", 1.5);
  const sourceP = [-3.2, 1.68, 0.35], sourceN = [-3.2, 0.97, 0.35];
  for (const [point, color] of [[sourceP, C.red], [sourceN, C.muted]]) {
    k.cylinder(0.08, 0.12, color, point).rotation.z = Math.PI / 2;
  }
  k.label("+", [-3.1, 1.95, 0.4], "#ffc584", 0.4);
  k.label("−", [-3.1, 0.70, 0.4], "#b6d3e3", 0.4);
  k.cylinder(0.75, 0.30, 0x36586d, [x, 0.25, 0], metal);
  k.cylinder(0.49, 0.75, 0x647f90, [x, 0.77, 0], metal);
  for (const y of [0.50, 0.65, 0.80, 0.95]) k.ring(0.49, 0xadc1cc, [x, y, 0], "y", 1);
  const envelope = k.ball(1.14, 0xb0d9e7, [x, 2.34, 0], {
    transparent: true, opacity: 0.085, roughness: 0.12, depthWrite: false, side: T.DoubleSide, metalness: 0,
  });
  envelope.scale.y = 1.18;
  const filamentPoints = Array.from({ length: 193 }, (_, i) => {
    const u = i / 192, angle = u * 24 * Math.PI;
    return [x - 0.35 + u * 0.70, 2.23 + 0.06 * Math.cos(angle), 0.06 * Math.sin(angle)];
  });
  const filament = k.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(filamentPoints.map(point => new T.Vector3(...point))), 288, 0.019, 8, false),
    0x7d7369, [0, 0, 0], { emissive: 0xffb04b, emissiveIntensity: 0, metalness: 0.4, roughness: 0.35 });
  filament.userData.role = "lamp-filament";
  const feed = [sourceP, [-2.6, 0.45, 1.45], [x - 0.35, 0.45, 1.45], [x - 0.35, 0.65, 0], filamentPoints[0]];
  const back = [filamentPoints.at(-1), [x + 0.35, 0.65, 0], [x + 0.35, 0.45, -1.35], [-2.7, 0.45, -1.35], sourceN];
  circuitWire(k, feed, 0xba7c46, 0.030);
  circuitWire(k, back, 0x759aae, 0.030);
  const flow = directionMarkers(k, [...feed, ...filamentPoints.slice(1), ...back.slice(1)], C.gold, 19);
  const light = k.add(new T.PointLight(0xffb450, 0, 7), [x, 2.30, 0]);
  k.label("Filament heats and glows", [x, 4.12, 0], "#ffd098", 3.5);
  k.label("Glass shown as a cutaway", [x, 0.1, 1.9], "#adcddf", 3.2);
  k.box(2.75, 3.8, 0.17, 0x15354a, [3.15, 2.35, -0.12]);
  const labels = [
    k.label("", [3.15, 3.47, 0.03], "#ffd098", 2.25, "ink", 0.60),
    k.label("", [3.15, 2.30, 0.03], "#9ce9dd", 2.25, "ink", 0.60),
    k.label("", [3.15, 1.14, 0.03], "#a8cff1", 2.25, "ink", 0.60),
  ];
  for (const [y, name] of [[3.96, "Temperature"], [2.80, "Resistance"], [1.65, "Current"]]) {
    k.label(name, [3.15, y, 0.03], "#c0dbe7", 1.7, "ink", 0.27);
  }
  const input = k.label("", [0, 4.85, 0], "#cbe3ec", 4.1);
  const heatArrows = [-1, 1].map(sign => k.arrow([x + sign * 1.2, 2.4, 0], [sign * 0.4, 0, 0], C.gold));
  return {
    camera: { target: [0, 2.45, 0], radius: 13.2, polar: 1.18, azimuth: -0.14, fitAspect: 1.8 },
    update(s, q, lab) {
      const glow = clamp((q.temperature - 600) / 2200, 0, 1);
      filament.material.color.setRGB(0.35 + glow * 0.65, 0.16 + glow * 0.55, 0.08 + glow * 0.25);
      filament.material.emissiveIntensity = glow * 3;
      light.intensity = glow * 12;
      // For a constant-voltage run, E_in / V is the integrated charge. This
      // keeps marker speed proportional to I as the filament warms.
      const charge = p.voltage > 0 ? q.input / p.voltage : 0;
      flow(charge * 0.05, lab.vectors !== false && q.current > 0);
      k.setLabel(labels[0], number(q.celsius) + " °C", "#ffd098", 2.25);
      k.setLabel(labels[1], number(q.resistance) + " Ω", "#9ce9dd", 2.25);
      k.setLabel(labels[2], number(q.current) + " A", "#a8cff1", 2.25);
      k.setLabel(input, "Electrical input " + number(q.power) + " W", "#cbe3ec", 4.1);
      for (const [i, sign] of [[0, -1], [1, 1]]) {
        const length = q.power > 0 ? 0.8 * q.lossPower / q.power : 0;
        k.setArrow(heatArrows[i], [x + sign * 1.2, 2.4, 0], [sign * length, 0, 0]);
      }
    },
  };
}
