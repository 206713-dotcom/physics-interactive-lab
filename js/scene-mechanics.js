import { PALETTE as C, putRod } from "./scene-kit.js";
import { createVectorApparatus } from "./scene-vectors.js";
const TAU = Math.PI * 2;
export const MECHANICAL_SCENES = {
  measurement(p, k) {
    k.stand();
    k.box(7, 0.12, 0.9, 0xc7d9dc, [0, 0.1, 0]);
    for (let i = 0; i <= 40; i++) {
      const x = -3.3 + (i * 6.6) / 40;
      k.box(0.018, 0.013, i % 5 === 0 ? 0.5 : 0.23, 0x163347, [x, 0.17, 0]);
      if (i % 10 === 0)
        k.label(String((i / 40) * 2), [x, 0.55, -0.7], "#b7d9e5", 0.6);
    }
    const object = k.box(p.length * 3.3, 0.4, 0.55, C.cyan, [
      -3.3 + (p.length * 3.3) / 2,
      0.43,
      0,
    ]);
    k.label("Object length", [-1, 1.3, 0]);
    k.label("Read perpendicular to the scale", [0, 2.3, 0], "#ffc584", 4.6);
    return () => {};
  },
  motion(p, k) {
    k.stand(9, 2);
    const cart = k.box(0.7, 0.55, 0.7, C.cyan, [0, 0.5, 0]);
    for (const x of [-0.24, 0.24])
      for (const z of [-0.4, 0.4]) {
        const w = k.cylinder(0.13, 0.08, C.muted, [x, 0.2, z]);
        w.rotation.x = Math.PI / 2;
        cart.attach(w);
      }
    for (let i = -4; i <= 4; i++) k.box(0.025, 0.02, 1, C.muted, [i, 0.04, 0]);
    const velocity = k.arrow([0, 1.5, 0], [1, 0, 0], C.gold),
      force = k.arrow([0, 2.3, 0], [1, 0, 0], C.red);
    k.label("Velocity · gold", [1.5, 3.2, 0], "#ffc584");
    k.label("Resultant force · coral", [-1.5, 3.2, 0], "#ff9d91", 2.7);
    if (p.mode)
      k.label("Falling body · downward +", [0, 4.2, 0], "#cfe6ef", 3.5);
    return (s, q) => {
      const x = 3.7 * Math.tanh(q.x / 10);
      cart.position.set(
        p.mode ? 0 : x,
        p.mode ? 2.7 - 2.2 * Math.tanh(q.x / 20) : 0.5,
        0,
      );
      const at = [cart.position.x, cart.position.y + 1, 0],
        v = 1.5 * Math.tanh(q.v / 10),
        f = 1.5 * Math.tanh(q.net / 10);
      k.setArrow(velocity, at, p.mode ? [0, -v, 0] : [v, 0, 0]);
      k.setArrow(
        force,
        [at[0], at[1] + 0.65, 0],
        p.mode ? [0, -f, 0] : [f, 0, 0],
      );
    };
  },
  vectors(p, k) {
    return createVectorApparatus(p, k);
  },
  moments(p, k) {
    k.stand();
    k.cylinder(0.3, 1.7, C.muted, [0, 0.8, 0]);
    k.box(7, 0.14, 0.6, 0x86a5b7, [0, 1.7, 0]);
    for (const [m, x, col] of [
      [p.m1, -p.d1 * 2, C.cyan],
      [p.m2, p.d2 * 2, C.gold],
    ]) {
      k.box(0.45, 0.3 + Math.sqrt(m) * 0.18, 0.55, col, [
        x,
        1.95 + Math.sqrt(m) * 0.09,
        0,
      ]);
      k.arrow([x, 1.35, 0], [0, -Math.min(1.2, m * 0.15), 0], col);
    }
    k.label("Compare turning effects", [0, 3.7, 0], "#cfe6ef", 3.6);
    k.label("F × perpendicular distance", [0, 3.1, 0], "#89baff", 3.8);
    return () => {};
  },
  buoyancy(p, k) {
    k.stand(7, 4);
    k.glass(4, 3, 2.6, [0, 1.5, 0]);
    k.box(3.9, 2.1, 2.5, 0x2b9ebd, [0, 1.05, 0], {
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    });
    const side = 0.8 * Math.cbrt(p.volume / 0.001),
      fraction = Math.min(1, p.density / p.fluid),
      height = 2.1 + side / 2 - fraction * side;
    k.box(side, side, side, C.gold, [0, height, 0]);
    const up = k.arrow([1, height, 0], [0, 1.2, 0], C.cyan),
      down = k.arrow([-1, height, 0], [0, -1.2, 0], C.gold);
    k.label("Weight", [-2, 3.6, 0], "#ffc584");
    k.label("Upthrust", [2, 3.6, 0], "#64e8d1");
    k.label("Displaced liquid supplies upthrust", [0, 4.3, 0], "#cfe6ef", 4.8);
    return (s, q) => {
      k.setArrow(
        up,
        [1, height, 0],
        [0, (1.2 * q.upthrust) / Math.max(q.weight, q.upthrust), 0],
      );
      k.setArrow(
        down,
        [-1, height, 0],
        [0, (-1.2 * q.weight) / Math.max(q.weight, q.upthrust), 0],
      );
    };
  },
  energy(p, k) {
    k.stand(7, 3);
    k.box(0.16, 4, 0.16, C.muted, [-2, 2, 0]);
    k.box(4, 0.14, 0.3, C.muted, [0, 4, 0]);
    const wheel = k.cylinder(0.35, 0.3, C.blue, [1.3, 3.8, 0]);
    wheel.rotation.x = Math.PI / 2;
    const load = k.box(0.7, 0.55, 0.7, C.gold, [1.3, 0.6, 0]),
      rope = k.rod([1.3, 4, 0], [1.3, 0.9, 0], C.white, 0.018);
    const input = k.box(0.18, 0.05, 0.3, C.cyan, [-2.8, 0.1, 0]),
      useful = k.box(0.18, 0.05, 0.3, C.gold, [-2.1, 0.1, 0]);
    k.label("Energy in / useful", [-2, 3.3, 0], "#64e8d1", 2.5);
    k.label("Load rises", [2.4, 4.6, 0], "#ffc584", 2);
    return (s, q) => {
      const y = 0.5 + (q.height / p.height) * 2.7;
      load.position.y = y;
      putRod(rope, [1.3, 3.8, 0], [1.3, y + 0.3, 0]);
      wheel.rotation.y = q.height * 2;
      input.scale.y =
        1 +
        (q.input / Math.max((p.mass * 9.81 * p.height) / p.efficiency, 1)) * 40;
      useful.scale.y =
        1 +
        (q.potential / Math.max((p.mass * 9.81 * p.height) / p.efficiency, 1)) *
          40;
      input.position.y = input.scale.y * 0.025;
      useful.position.y = useful.scale.y * 0.025;
    };
  },
  hydraulics(p, k) {
    k.stand(9, 4);
    const radii = [Math.sqrt(p.inputArea) * 18, Math.sqrt(p.outputArea) * 18],
      centers = [-2.7, 2.4],
      pistons = [],
      liquids = [],
      rods = [];
    for (let i = 0; i < 2; i++) {
      const r = radii[i];
      k.cylinder(r + 0.09, 3.4, 0x85b8d1, [centers[i], 1.8, 0], {
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
      });
      pistons.push(k.cylinder(r, 0.12, C.muted, [centers[i], 2.8, 0]));
      liquids.push(
        k.cylinder(r * 0.97, 1, 0x1eb4c6, [centers[i], 1, 0], {
          transparent: true,
          opacity: 0.6,
        }),
      );
      rods.push(k.cylinder(0.07, 1, C.white, [centers[i], 3.3, 0]));
    }
    k.rod([-2.7, 0.25, 0], [2.4, 0.25, 0], 0x2699b2, 0.14);
    const arrows = [
      k.arrow([-2.7, 4.3, 0], [0, -0.8, 0], C.cyan),
      k.arrow([2.4, 3.6, 0], [0, 0.8, 0], C.gold),
    ];
    k.label("Small piston", [-2.7, 4.7, 0], "#64e8d1", 2.2);
    k.label("Large piston", [2.4, 4.7, 0], "#ffc584", 2.2);
    return (s, q) => {
      const sc =
        1.2 / Math.max(p.stroke, (p.stroke * p.inputArea) / p.outputArea);
      const levels = [2.5 - q.inputTravel * sc, 1.8 + q.outputTravel * sc];
      for (let i = 0; i < 2; i++) {
        pistons[i].position.y = levels[i];
        rods[i].position.y = levels[i] + 0.55;
        liquids[i].scale.y = Math.max(0.1, levels[i] - 0.2);
        liquids[i].position.y = 0.2 + liquids[i].scale.y / 2;
      }
      k.setArrow(arrows[1], [2.4, levels[1] + 0.5, 0], [0, 0.8, 0]);
    };
  },
  hooke(p, k) {
    k.stand(7, 3);
    k.box(4, 0.16, 0.45, C.muted, [0, 4.2, 0]);
    const final =
        p.load /
        (p.mode === 0
          ? p.k1
          : p.mode === 1
            ? 1 / (1 / p.k1 + 1 / p.k2)
            : p.k1 + p.k2),
      sc = 1.5 / final;
    const c1 = k.spring(p.mode === 2 ? -1 : 0, 2.7, 0, 1.5, C.cyan),
      c2 = p.mode ? k.spring(p.mode === 2 ? 1 : 0, 1.2, 0, 1.4, C.gold) : null,
      load = k.box(p.mode === 2 ? 2.6 : 1, 0.35, 0.65, C.blue, [0, 2.5, 0]);
    k.label(
      ["Single spring", "Series: same force", "Parallel: same extension"][
        p.mode
      ],
      [0, 5, 0],
      "#cfe6ef",
      4.2,
    );
    return (s, q) => {
      let bottom;
      if (p.mode === 1) {
        const l1 = 1 + q.x1 * sc,
          l2 = 1 + q.x2 * sc;
        c1.position.y = 4.2 - l1;
        c1.scale.y = l1;
        c2.position.y = 4.2 - l1 - l2 - 0.12;
        c2.scale.y = l2;
        bottom = c2.position.y;
      } else {
        const length = 1.5 + q.extension * sc;
        c1.position.y = 4.2 - length;
        c1.scale.y = length;
        if (c2) {
          c2.position.set(1, c1.position.y, 0);
          c2.scale.y = length;
        }
        bottom = c1.position.y;
      }
      load.position.y = bottom - 0.18;
    };
  },
  materials(p, k) {
    k.stand(6, 3);
    k.box(3, 0.18, 0.55, C.muted, [0, 4.3, 0]);
    const wire = k.cylinder(
        0.035 * Math.sqrt(p.area / 1e-6),
        1,
        C.cyan,
        [0, 3, 0],
      ),
      load = k.box(0.7, 0.6, 0.7, C.gold, [0, 1, 0]);
    const sc = 1 / ((p.force * p.length) / (p.area * p.young));
    k.label(
      "Wire cross-section and extension enlarged",
      [0, 5, 0],
      "#cfe6ef",
      5.5,
    );
    return (s, q) => {
      const len = 1.6 + q.extension * sc;
      wire.scale.y = len;
      wire.position.y = 4.3 - len / 2;
      load.position.y = 4.3 - len - 0.3;
    };
  },
  driven(p, k) {
    k.stand(6, 3);
    k.box(3, 0.18, 0.5, C.muted, [0, 4.2, 0]);
    const coil = k.spring(0, 2.3, 0, 1.9, C.cyan),
      mass = k.box(0.8, 0.7, 0.8, C.gold, [0, 2, 0]),
      force = k.arrow([1.3, 2, 0], [0, 0.7, 0], C.purple);
    const den = Math.hypot(
        p.k - p.mass * (TAU * p.drive) ** 2,
        p.damping * TAU * p.drive,
      ),
      sc = Math.min(6, 1.1 / (p.force / den));
    k.label("Gold mass follows the drive", [0, 5, 0], "#ffc584", 4.2);
    k.label(
      "Steady state · transient already gone",
      [0, 0.5, 1.1],
      "#c3a6ff",
      4.8,
    );
    return (s, q) => {
      const y = 2.2 + q.displacement * sc;
      mass.position.y = y;
      coil.position.y = y + 0.35;
      coil.scale.y = 4.2 - y - 0.35;
      k.setArrow(
        force,
        [1.3, y, 0],
        [0, Math.cos(TAU * p.drive * s.t) * 0.85, 0],
      );
    };
  },
};
