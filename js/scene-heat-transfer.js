import * as T from "../vendor/three.module.min.js";
import { PALETTE as C, setPath } from "./scene-kit.js";
import { directionMarkers } from "./scene-instruments.js";
import { convectionPosition, heatSlabGeometry, heatMarkerPhase, radiationMarkerAmplitude } from "./thermal-geometry.js";
import { calculationNumber as number } from "./calculations.js";

export function createHeatTransferBench(p, k) {
  k.stand(10.8, 5.2);
  const center = 2.45, gold = "#ffc584", blue = "#a7cbff";
  const hotColor = new T.Color(C.gold), coldColor = new T.Color(C.blue);
  for (const [x, color, temperature] of [[-3.25, C.gold, p.hot], [3.25, C.blue, p.cold]]) {
    k.box(1.0, 4.15, 3.75, color, [x, center, 0], { metalness: 0.55, roughness: 0.38 });
    for (let i = 0; i < 7; i++) k.box(1.16, 0.055, 3.90, color, [x, 0.65 + i * 0.58, 0]);
    k.label(temperature + " °C", [x, 5.03, 0], x < 0 ? gold : blue, 1.7);
  }
  k.label(["Conduction through a solid", "Convection in a fluid", "Radiation across a gap"][p.mode],
    [0, 5.7, 0], "#d5eaf4", 4.1);
  const reading = k.label("", [0, 0.15, 2.0], "#9cebdd", 3.4);
  let animate;
  if (p.mode === 0) {
    const { length, side } = heatSlabGeometry(p);
    for (let i = 0; i < 16; i++) {
      const fraction = i / 15;
      const slab = k.box(length / 16 + 0.005, side, side, hotColor.clone().lerp(coldColor, fraction),
        [-length / 2 + (i + 0.5) * length / 16, center, 0],
        { transparent: true, opacity: 0.20, depthWrite: false, roughness: 0.7 });
      slab.userData.role = "heat-material-slab";
    }
    for (const sign of [-1, 1]) {
      const contactLength = 2.75 - length / 2;
      k.box(contactLength, side * 0.90, side * 0.90, sign < 0 ? C.gold : C.blue,
        [sign * (length / 2 + contactLength / 2), center, 0], { roughness: 0.50, metalness: 0.35 });
    }
    const sites = [];
    for (let x = 0; x < 8; x++) for (let y = -1; y <= 1; y++) for (const z of [-1, 1]) {
      sites.push({ position: [(x / 7 - 0.5) * length * 0.72, center + y * side * 0.26, z * side * 0.23],
        temperature: p.hot + (p.cold - p.hot) * (0.14 + 0.72 * x / 7) });
    }
    const atoms = k.instances(sites.length, Math.min(0.042, length / 25), C.white);
    atoms.userData.role = "heat-lattice-particles";
    k.label("Particles vibrate in place", [0, center + side / 2 + 0.65, 0], "#cde8f0", 3.2);
    k.label("Thickness " + number(p.thickness * 1000) + " mm", [0, center - side / 2 - 0.33, side / 2], "#d9e9f2", 3.1);
    k.label("Area " + number(p.area) + " m²", [0, 0.56, 1.9], "#b8d1e2", 2.3);
    const flow = directionMarkers(k, [[-2.5, 4.65, 0], [2.5, 4.65, 0]], C.cyan, 5);
    animate = (s, q, lab) => {
      sites.forEach((site, i) => {
        const pace = Math.sqrt((site.temperature + 273.15) / 300);
        const amplitude = Math.min(0.036, length / 12) * pace;
        k.instance(atoms, i, site.position.map((value, axis) => value + amplitude * Math.sin(s.t * 10 * pace + i * 1.3 + axis * 2.1)));
      });
      k.finishInstances(atoms);
      flow(heatMarkerPhase(s.t, q.power), lab.vectors !== false);
    };
  } else if (p.mode === 1) {
    k.glass(5.4, 3.4, 2.7, [0, center, 0]);
    for (const y of [center - 1.7, center + 1.7]) {
      k.rod([-2.7, y, 1.35], [2.7, y, 1.35], 0x6c9eb8, 0.032);
    }
    for (const z of [-0.68, 0.68]) {
      k.line(Array.from({ length: 97 }, (_, i) => {
        const [x, y] = convectionPosition(i / 96);
        return [x * 1.9, center + y * 1.22, z];
      }), 0x78aec4, 0.5);
    }
    const parcels = k.instances(40, 0.065, C.cyan);
    parcels.userData.role = "convection-fluid-parcels";
    k.arrow([-1.9, center - 0.45, 1.05], [0, 0.9, 0], C.gold);
    k.arrow([1.9, center + 0.45, 1.05], [0, -0.9, 0], C.blue);
    k.label("Warm fluid rises", [-1.6, 4.45, 0], gold, 2.6);
    k.label("Cool fluid sinks", [1.6, 0.65, 1.45], blue, 2.6);
    const color = new T.Color();
    animate = s => {
      for (let i = 0; i < 40; i++) {
        const [x, y] = convectionPosition(i / 20 + s.t * 0.13 + (i < 20 ? 0 : 0.025));
        color.copy(hotColor).lerp(coldColor, (x + 1) / 2);
        k.instance(parcels, i, [x * 1.9, center + y * 1.22, i < 20 ? -0.68 : 0.68], color);
      }
      k.finishInstances(parcels);
    };
  } else {
    const outgoing = [1.95, 2.65].map(y => ({ y, path: k.line([], C.gold, 0.95) }));
    const incoming = [1.25, 3.35].map(y => ({ y, path: k.line([], C.blue, 0.92) }));
    k.arrow([1.25, 2.7, 0.3], [1.0, 0, 0], C.gold);
    k.arrow([-1.25, 1.25, 0.3], [-1.0, 0, 0], C.blue);
    const emitted = k.label("", [0, 4.55, 0], gold, 3.5);
    const absorbed = k.label("", [0, 0.62, 1.25], blue, 3.5);
    k.label("A material medium is unnecessary", [0, 3.95, 0], "#d0e5f0", 3.4);
    animate = (s, q) => {
      for (const [waves, sign, power] of [[outgoing, 1, q.hotEmission], [incoming, -1, q.backgroundAbsorption]]) {
        for (const { y, path } of waves) {
          setPath(path, Array.from({ length: 97 }, (_, i) => {
            const x = -2.65 + i * 5.3 / 96;
            return [x, y + radiationMarkerAmplitude(power) * 0.16 * Math.sin(i * 0.30 - sign * s.t * 3), 0];
          }));
        }
      }
      k.setLabel(emitted, "Emitted " + number(q.hotEmission) + " W", gold, 3.5);
      k.setLabel(absorbed, "Absorbed background " + number(q.backgroundAbsorption) + " W", blue, 3.5);
    };
  }
  return {
    camera: { target: [0, 2.70, 0], radius: 14.6, polar: 1.18, azimuth: -0.17, fitAspect: 1.8 },
    update(s, q, lab) {
      animate(s, q, lab);
      k.setLabel(reading, number(q.power) + " W · net transfer", "#9cebdd", 3.4);
    },
  };
}
