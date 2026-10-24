import { PALETTE as C, clamp } from "./scene-kit.js";
import * as T from "../vendor/three.module.min.js";
const warm = new T.Color(C.gold),
  cold = new T.Color(C.blue);
const tempColor = (t, lo = 20, hi = 150) =>
  cold.clone().lerp(warm, clamp((t - lo) / (hi - lo), 0, 1));
function tank(k) {
  k.stand(7, 4);
  k.glass(3.6, 3.2, 2.5, [0, 1.6, 0]);
  k.box(3.8, 0.1, 2.7, C.muted, [0, 0, 0]);
}
function particles(k, n = 72) {
  const dots = k.instances(n, 0.065, C.cyan);
  return {
    dots,
    n,
    update(t, temp, state = 2) {
      for (let i = 0; i < n; i++) {
        const a = i * 2.399963;
        let x, y, z;
        if (state === 0) {
          x = ((i % 6) - 2.5) * 0.42;
          y = 0.5 + Math.floor(i / 18) * 0.42;
          z = ((Math.floor(i / 6) % 3) - 1) * 0.47;
          x += Math.sin(t * 7 + i) * 0.018;
          y += Math.cos(t * 8 + i) * 0.018;
        } else {
          const speed = Math.sqrt(temp / 300) * (state === 1 ? 0.3 : 1),
            h = state === 1 ? 1.2 : 2.6;
          x = Math.sin(a + t * speed * 0.8) * 1.4;
          y = 0.3 + ((Math.sin(i * 1.713 + t * speed) + 1) * h) / 2;
          z = Math.cos(i * 0.923 + t * speed * 0.7) * 1;
        }
        k.instance(dots, i, [x, y, z]);
      }
      k.finishInstances(dots);
    },
  };
}
export const THERMAL_SCENES = {
  gases(p, k) {
    tank(k);
    const cloud = particles(k, 90);
    k.label(
      [
        "Solid: ordered particles",
        "Liquid: close, mobile particles",
        "Gas: random particle illustration",
      ][p.state],
      [0, 4.1, 0],
      "#64e8d1",
      5,
    );
    k.label(
      "Particle motion schematic · not molecular dynamics",
      [0, 0.1, 2],
      "#b7cedc",
      5.8,
    );
    return (s) => cloud.update(s.t, p.temperature, p.state);
  },
  expansion(p, k) {
    k.stand(9, 3);
    const reference = k.box(5, 0.2, 0.4, C.blue, [-0.5, 0.4, 0]),
      bar = k.box(5, 0.3, 0.6, C.gold, [-0.5, 0.9, 0]);
    k.box(0.15, 1.6, 1, C.muted, [-3, 0.8, 0]);
    k.label("Original length · blue", [0, 2.5, 0], "#89baff", 3);
    k.label("Heated length · gold", [0, 3.2, 0], "#ffc584", 3);
    return (s, q) => {
      const length = 5 + q.strain * 200;
      bar.scale.x = length / 5;
      bar.position.x = -3 + length / 2;
    };
  },
  calorimetry(p, k) {
    tank(k);
    const liquid = k.box(3.3, 1.8, 2.2, C.blue, [0, 1.05, 0], {
        transparent: true,
        opacity: 0.55,
      }),
      ice = [];
    for (let i = 0; i < 8; i++)
      ice.push(
        k.box(
          0.55,
          0.55,
          0.55,
          0xb8e7ef,
          [
            ((i % 2) - 0.5) * 1.25,
            1.5 + Math.floor(i / 4) * 0.5,
            ((Math.floor(i / 2) % 2) - 0.5) * 1.2,
          ],
          { roughness: 0.15 },
        ),
      );
    const cloud = particles(k, 28);
    k.cylinder(1, 0.2, C.red, [0, -0.15, 0]);
    k.label("Energy enters from the heater", [0, 4.2, 0], "#ff9d91", 4.3);
    return (s, q) => {
      const water = p.mode === 0;
      liquid.visible = !water || q.melt > 0;
      liquid.scale.y = water ? Math.max(0.01, q.melt * (1 - q.boil)) : 1;
      liquid.position.y = 0.15 + 0.9 * liquid.scale.y;
      liquid.material.color.copy(tempColor(q.temperature, 0, 100));
      for (const o of ice) {
        o.visible = water && q.melt < 1;
        o.scale.setScalar(Math.max(0.01, 1 - q.melt));
      }
      cloud.dots.visible = water && q.boil > 0;
      if (cloud.dots.visible) cloud.update(s.t, 373, 2);
    };
  },
  heat(p, k) {
    k.stand(9, 4);
    k.box(1.2, 2.8, 2, C.gold, [-3, 1.5, 0]);
    k.box(1.2, 2.8, 2, C.blue, [3, 1.5, 0]);
    k.label("HOT", [-3, 3.5, 0], "#ffc584", 1.3);
    k.label("COOL", [3, 3.5, 0], "#89baff", 1.3);
    const dots = k.instances(40, 0.06, C.white);
    if (p.mode === 0)
      for (let i = 0; i < 20; i++)
        k.box(0.24, 0.45, 0.6, cold.clone().lerp(warm, 1 - i / 19), [
          -2.3 + i * 0.24,
          1.5,
          0,
        ]);
    else if (p.mode === 1) k.glass(4.6, 3, 2, [0, 1.5, 0]);
    else
      for (let j = -1; j <= 1; j++)
        k.line(
          Array.from({ length: 90 }, (_, i) => [
            -2.2 + i * 0.05,
            1.5 + Math.sin(i * 0.3) * 0.13,
            j * 0.5,
          ]),
          C.purple,
          0.6,
        );
    k.arrow([-1.5, 3.5, 0], [3, 0, 0], C.cyan);
    return (s) => {
      for (let i = 0; i < 40; i++) {
        const u = (i / 40 + s.t * 0.13) % 1;
        const pos =
          p.mode === 1
            ? [
                2 * Math.cos(u * Math.PI * 2),
                1.6 + Math.sin(u * Math.PI * 2) * 1.2,
                Math.sin(i) * 0.5,
              ]
            : [
                -2.3 + u * 4.6,
                1.5 + Math.sin(i * 3 + s.t * 8) * 0.08,
                Math.cos(i) * 0.28,
              ];
        k.instance(dots, i, pos);
      }
      k.finishInstances(dots);
    };
  },
  cooling(p, k) {
    tank(k);
    const body = k.box(2.4, 1.8, 1.6, C.gold, [0, 1.1, 0], { metalness: 0.1 }),
      thermo = k.cylinder(0.09, 2.8, C.white, [1.8, 1.5, 0]),
      column = k.cylinder(0.06, 1, C.red, [1.8, 1, 0]);
    const arrows = [-1, 0, 1].map((x) =>
      k.arrow([x, 2.4, 0], [0, 0.8, 0], C.gold),
    );
    k.label("Object loses thermal energy", [0, 4.2, 0], "#ffc584", 4.2);
    return (s, q) => {
      const f = (q.temperature - p.ambient) / (p.initial - p.ambient);
      body.material.color.copy(tempColor(q.temperature, p.ambient, p.initial));
      column.scale.y = 0.3 + f * 2;
      column.position.y = 0.15 + column.scale.y / 2;
      arrows.forEach((a, i) => k.setArrow(a, [i - 1, 2.4, 0], [0, f * 0.9, 0]));
    };
  },
  gasprocess(p, k) {
    k.stand(7, 4);
    k.cylinder(1.5, 3.6, 0x8bc4dc, [0, 1.8, 0], {
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
    const piston = k.cylinder(1.5, 0.18, C.muted, [0, 2, 0]),
      gas = k.cylinder(1.43, 1, C.cyan, [0, 1, 0], {
        transparent: true,
        opacity: 0.25,
      }),
      rod = k.cylinder(0.08, 1, C.white, [0, 3, 0]),
      cloud = particles(k, 50);
    k.label(
      [
        "ISOTHERMAL · temperature fixed",
        "ISOBARIC · pressure fixed",
        "ADIABATIC · no heat transfer",
      ][p.mode],
      [0, 4.8, 0],
      "#cfe6ef",
      4.8,
    );
    return (s, q) => {
      const height = (2.9 * q.ratio) / Math.max(1, p.ratio);
      piston.position.y = height + 0.2;
      gas.scale.y = height;
      gas.position.y = 0.2 + height / 2;
      gas.material.color.copy(tempColor(q.temperature, 150, 600));
      rod.position.y = piston.position.y + 0.6;
      cloud.update(s.t, q.temperature, 2);
      cloud.dots.scale.y = height / 3;
    };
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
