import { PALETTE as C, clamp } from "./scene-kit.js";
import * as T from "../vendor/three.module.min.js";
import { createGasProcessBench, createCalorimeterBench, createCoolingBench } from "./scene-thermal-benches.js";
import { chamberParticle, convectionPosition, EXPANSION_MAGNIFICATION, particleChamberWidth, THERMAL_CAMERA } from "./thermal-geometry.js";

const metal = { metalness: 0.55, roughness: 0.32 };
const camera = { ...THERMAL_CAMERA, target: [0, 2, 0], radius: 11.9 };
const gold = "#ffc78f", cyan = "#9dece5", blue = "#a7cafa";
const modeNames = ["Conduction", "Convection", "Radiation"];

export const THERMAL_SCENES = {
  gases(p, k) {
    k.stand(9.2, 4.3);
    const left = -3.75, width = particleChamberWidth(p.volume), right = left + width;
    const floor = 0.42, height = 2.85, depth = 1.8;
    k.box(5.55, 0.24, 2.1, 0x44647b, [-0.98, 0.22, 0], metal);
    k.glass(width, height, depth, [left + width / 2, floor + height / 2, 0]);
    for (const x of [left, right]) {
      k.box(0.12, height + 0.14, depth + 0.12, x === right ? 0xcba268 : 0x7497af,
        [x, floor + height / 2, 0], { ...metal, transparent: true, opacity: 0.67 });
    }
    for (const z of [-depth / 2, depth / 2]) {
      for (const y of [floor, floor + height]) k.line([[left, y, z], [right, y, z]], 0x81c5e2, 0.76);
    }
    k.box(2.04, 3.03, 0.12, 0x142d46, [3.1, 1.87, -0.15]);
    k.label(["Solid lattice", "Liquid particles", "Gas particles"][p.state], [0, 3.78, 0], cyan, 2.65);
    k.label(p.state === 2 ? "Gas readings" : "Chamber readings", [3.1, 2.96, 0.03], "#d6e9f4", 1.76);
    k.label(`${p.temperature} K`, [3.1, 2.2, 0.03], gold, 1.37);
    k.label(`${(p.volume * 1000).toFixed(1)} L`, [3.1, 1.53, 0.03], cyan, 1.37);
    const pressure = k.label("", [3.1, 0.88, 0.03], blue, 1.77);
    const dots = k.instances(72, 0.052, p.state === 0 ? C.blue : C.cyan);
    return { camera, update(s, q) {
      for (let i = 0; i < 72; i++) {
        const [x, y, z] = chamberParticle(i, s.t, p.temperature, p.state);
        k.instance(dots, i, [left + 0.09 + x * (width - 0.18), floor + 0.09 + y * (height - 0.18), (z - 0.5) * (depth - 0.18)]);
      }
      k.finishInstances(dots);
      k.setLabel(pressure, q.pressure === null ? "No gas pressure" : `${(q.pressure / 1000).toFixed(1)} kPa`, blue, 1.77);
    }};
  },
  expansion(p, k) {
    k.stand(9.4, 3.8);
    const start = -3.38, length = 5.35, end = start + length;
    k.box(8.5, 2.74, 0.17, 0x19364e, [0, 1.61, -0.56]);
    k.box(0.24, 2.07, 0.76, 0x788e9c, [start - 0.12, 1.22, 0], metal);
    k.box(length, 0.24, 0.4, C.blue, [start + length / 2, 0.92, 0], metal);
    const bar = k.box(length, 0.29, 0.53, C.gold, [start + length / 2, 1.73, 0], metal);
    k.line([[end, 0.58, 0.33], [end, 2.29, 0.33]], 0x9cd0f1, 0.77);
    k.label("Original rod", [-1.51, 0.56, 0.3], blue, 1.75);
    k.label("Heated rod", [-1.51, 2.12, 0.3], gold, 1.75);
    k.label(`Extension enlarged ×${EXPANSION_MAGNIFICATION}`, [0, 3.21, 0], "#d3e9f5", 4.3);
    const reading = k.label("", [2.45, 2.52, 0.36], gold, 2.62);
    const pointer = k.arrow([end, 1.72, 0.45], [0, 0, 0], C.gold);
    return { camera, update(s, q) {
      const delta = length * q.strain * EXPANSION_MAGNIFICATION;
      bar.scale.x = (length + delta) / length;
      bar.position.x = start + (length + delta) / 2;
      k.setArrow(pointer, [end, 1.73, 0.47], [delta, 0, 0]);
      k.setLabel(reading, `ΔL = ${(q.extension * 1000).toFixed(3)} mm`, gold, 2.62);
    }};
  },
  calorimetry(p, k) {
    return createCalorimeterBench(p, k);
  },
  heat(p, k) {
    k.stand(9.5, 4.3);
    for (const [x, color, name, value] of [[-3.3, C.gold, "Hot", p.hot], [3.3, C.blue, "Cool", p.cold]]) {
      k.box(1.37, 2.38, 1.93, color, [x, 1.34, 0], metal);
      for (let i = 0; i < 7; i++) k.box(1.54, 0.065, 2.1, color, [x, 0.39 + i * 0.29, 0], metal);
      k.label(`${name} · ${value} °C`, [x, 2.86, 0], x < 0 ? gold : blue, 2.12);
    }
    k.label(modeNames[p.mode], [0, 3.66, 0], "#d6ebf5", 2.7);
    const power = k.label("", [0, 0.5, 1.24], cyan, 3);
    let dots;
    if (p.mode === 0) {
      const hot = new T.Color(C.gold), cold = new T.Color(C.blue);
      for (let i = 0; i < 24; i++) {
        k.box(0.22, 0.48, 0.86, hot.clone().lerp(cold, i / 23), [-2.55 + i * 0.22, 1.41, 0]);
      }
      k.arrow([-1.72, 2.38, 0], [3.44, 0, 0], C.cyan);
    } else if (p.mode === 1) {
      k.glass(5.17, 2.42, 1.76, [0, 1.42, 0]);
      for (const z of [-0.57, 0.57]) k.line(Array.from({ length: 97 }, (_, i) => {
        const [x, y] = convectionPosition(i / 96);
        return [x * 1.92, 1.42 + y * 0.89, z];
      }), 0x76afc8, 0.42);
      k.arrow([-1.92, 1.08, 0], [0, 0.72, 0], C.gold);
      k.arrow([1.92, 1.78, 0], [0, -0.72, 0], C.blue);
      dots = k.instances(36, 0.056, C.cyan);
    } else {
      for (const y of [0.96, 1.44, 1.92]) {
        k.line(Array.from({ length: 89 }, (_, i) => [-2.54 + i * 0.058, y + Math.sin(i * 0.4) * 0.105, 0]), C.gold, 0.75);
        k.arrow([2.03, y, 0], [0.49, 0, 0], C.gold);
      }
      k.label("Infrared across a gap", [0, 2.52, 0], gold, 3);
    }
    const color = new T.Color(), hot = new T.Color(C.gold), cold = new T.Color(C.blue);
    return { camera, update(s, q) {
      const watts = q.power.toLocaleString("en", { maximumSignificantDigits: 4 });
      k.setLabel(power, `${watts} W · net transfer`, cyan, 3);
      if (!dots) return;
      for (let i = 0; i < 36; i++) {
        const [x, y] = convectionPosition((i % 18) / 18 + s.t * 0.13 + (i < 18 ? 0 : 0.025));
        color.copy(hot).lerp(cold, (x + 1) / 2);
        k.instance(dots, i, [x * 1.92, 1.42 + y * 0.89, i < 18 ? -0.57 : 0.57], color);
      }
      k.finishInstances(dots);
    }};
  },
  cooling(p, k) {
    return createCoolingBench(p, k);
  },
  gasprocess(p, k) {
    return createGasProcessBench(p, k);
  },
  filament(p, k) {
    k.stand(7, 4);
    k.cylinder(0.65, 0.5, C.muted, [0, 0.3, 0]);
    for (let i = 0; i < 5; i++) k.ring(0.66, C.white, [0, 0.1 + i * 0.08, 0]);
    k.cylinder(0.45, 0.8, 0x47718b, [0, 0.8, 0]);
    const glass = k.ball(1.3, 0xb2e6f2, [0, 2.1, 0], {
      transparent: true,
      opacity: 0.1,
      roughness: 0.05,
      metalness: 0,
      depthWrite: false,
      side: T.DoubleSide,
    });
    glass.scale.y = 1.15;
    k.rod([-0.35, 0.7, 0], [-0.35, 2, 0], C.white);
    k.rod([0.35, 0.7, 0], [0.35, 2, 0], C.white);
    const coil = k.spring(-0.35, 2, 0, 0.7, C.gold, 0.08, 14);
    coil.rotation.z = -Math.PI / 2;
    coil.material = coil.material.clone();
    const light = new T.PointLight(C.gold, 0, 8);
    light.position.set(0, 2.2, 0);
    k.add(light);
    k.label("Glass envelope", [2.3, 3.3, 0], "#b7dce9", 2.7);
    k.label("Filament", [-2, 2.6, 0], "#ffc584", 2);
    k.label("Electrical → thermal → surroundings", [0, 4.6, 0], "#cfe6ef", 5);
    const heat = [-1, 1].map((x) =>
      k.arrow([x * 1.5, 2.2, 0], [x, 0, 0], C.gold),
    );
    return (s, q) => {
      const f = clamp((q.temperature - 600) / 2200, 0, 1);
      coil.material.color.setRGB(
        0.35 + f * 0.65,
        0.15 + f * 0.55,
        0.08 + f * 0.25,
      );
      coil.material.emissive.setHex(C.gold);
      coil.material.emissiveIntensity = f * 3;
      light.intensity = f * 12;
      for (let i = 0; i < 2; i++)
        k.setArrow(
          heat[i],
          [(i ? 1 : -1) * 1.5, 2.2, 0],
          [(i ? 1 : -1) * clamp(q.lossPower / 15, 0, 1.4), 0, 0],
        );
    };
  },
};
