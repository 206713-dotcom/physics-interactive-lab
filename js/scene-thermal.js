import { PALETTE as C } from "./scene-kit.js";
import { createGasProcessBench, createCalorimeterBench, createCoolingBench } from "./scene-thermal-benches.js";
import { EXPANSION_MAGNIFICATION, THERMAL_CAMERA } from "./thermal-geometry.js";
import { createParticleBench } from "./scene-particles.js";
import { createHeatTransferBench } from "./scene-heat-transfer.js";
import { createFilamentBench } from "./scene-filament.js";

const metal = { metalness: 0.55, roughness: 0.32 };
const camera = { ...THERMAL_CAMERA, target: [0, 2, 0], radius: 11.9 };
const gold = "#ffc78f", cyan = "#9dece5", blue = "#a7cafa";

export const THERMAL_SCENES = {
  gases(p, k) {
    return createParticleBench(p, k);
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
    return createHeatTransferBench(p, k);
  },
  cooling(p, k) {
    return createCoolingBench(p, k);
  },
  gasprocess(p, k) {
    return createGasProcessBench(p, k);
  },
  filament(p, k) {
    return createFilamentBench(p, k);
  },
};
