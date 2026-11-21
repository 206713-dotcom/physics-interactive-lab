import { createMomentsBench } from './scene-moments.js';
import { PALETTE as C, putRod } from "./scene-kit.js";
import { createVectorApparatus } from "./scene-vectors.js";
import { createBuoyancyApparatus } from "./scene-buoyancy.js";
import { createMotionBench } from "./scene-motion-benches.js";
import { springTravel, wireTravel } from "./apparatus-scales.js";
import { dashedPath } from "./scene-instruments.js";
import { FINISH, retortStand, hook, slottedMasses, hookedMass, rule, upright, pulley, glassCylinder, piston, pipe, pointer, coilSpring, winchMotor, turned } from "./scene-props.js";
const TAU = Math.PI * 2;

function clampStand(k, x, height, width) {
  retortStand(k, { x, height: height + 0.35, arm: width, armY: height });
}

function extensionPointer(k, zero, x) {
  k.box(0.18, 2.35, 0.08, C.dark, [x, zero - 0.62, 0.24]);
  for (let i = -3; i <= 7; i++) {
    const size = i === 0 ? 0.33 : 0.15;
    k.box(size, 0.022, 0.018, i === 0 ? C.gold : C.muted, [x - size / 2 + 0.08, zero - i * 0.17, 0.295]);
  }
  k.label("Unloaded level", [x + 0.68, zero + 0.3, 0.26], "#ffc584", 1.5);
  return k.box(0.32, 0.05, 0.06, C.cyan, [x + 0.02, zero, 0.35]);
}

export const MECHANICAL_SCENES = {
  measurement(p, k) {
    k.stand(8.2, 3);
    // A two-metre boxwood rule with a printed scale; the object lies against
    // its edge, the way a length is really read.
    const span = 6.6, left = -3.3, end = left + p.length * (span / 2);
    rule(k, { length: span, width: 0.66, thickness: 0.08, divisions: 200, major: 20,
      label: (i) => String(Number((i / 100).toFixed(1))), pos: [left, 0.06, -0.24] });
    k.box(p.length * (span / 2), 0.34, 0.5, C.cyan, [left + (p.length * span) / 4, 0.19, 0.4], { metalness: 0.75, roughness: 0.3 });
    // Reading lines square to the scale at each end of the object.
    for (const x of [left, end]) {
      k.line([[x, 0.11, -0.57], [x, 0.11, 0.66]], 0xff5a4f, 0.95);
      dashedPath(k, [[x, 0.11, -0.24], [x, 1.5, -0.24]], C.gold, 0.6);
    }
    k.label("Object length", [(left + end) / 2, 1.0, 0.4]);
    k.label("Read perpendicular to the scale", [0, 2.3, 0], "#ffc584", 4.6);
    return () => {};
  },
  motion(p, k) {
    return createMotionBench(p, k);
  },
  vectors(p, k) {
    return createVectorApparatus(p, k);
  },
  moments: createMomentsBench,
  buoyancy: createBuoyancyApparatus,
  energy(p, k) {
    k.stand(7.6, 3.2);
    // A motor winds a string over a pulley and lifts the load.
    const px = 1.3, py = 3.72, rim = 0.28, loadX = px + rim;
    retortStand(k, { x: -1.5, height: 4.5, arm: px + 1.5 + 0.1, armY: 4.2 });
    const wheel = pulley(k, { pos: [px, py, 0], radius: 0.34, bracket: 0.5 }),
      drum = winchMotor(k, [-0.1, 0.02, -0.32]);
    k.rod([px - rim, py, 0], [-0.1, 0.52, 0], FINISH.thread[0], 0.012);
    const size = 0.2 + 0.05 * Math.sqrt(p.mass),
      load = hookedMass(k, { radius: size, height: size * 1.5, pos: [loadX, 1, 0] }),
      rope = k.rod([loadX, py, 0], [loadX, 1, 0], FINISH.thread[0], 0.012),
      low = load.userData.height + 0.06, high = py - 0.5;
    // Two glowing columns compare the energy supplied with the useful energy.
    k.box(1.05, 0.1, 0.6, 0x1b1b1d, [-3.05, 0.05, 0.6], { roughness: 0.6 });
    const column = (x, color) => k.box(0.26, 0.05, 0.26, color, [x, 0.1, 0.6], { emissive: color, emissiveIntensity: 0.5, roughness: 0.35 }),
      input = column(-3.3, C.cyan), useful = column(-2.8, C.gold);
    k.label("Energy in / useful", [-3.05, 2.75, 0.6], "#64e8d1", 2.5);
    k.label("Load rises", [2.75, 3.1, 0], "#ffc584", 2);
    return (s, q) => {
      const y = low + (q.height / p.height) * (high - low), full = Math.max((p.mass * 9.81 * p.height) / p.efficiency, 1);
      load.position.y = y;
      putRod(rope, [loadX, py, 0], [loadX, y, 0]);
      wheel.rotation.y = q.height * 2;
      drum.rotation.y = q.height * 4;
      input.scale.y = 1 + (q.input / full) * 44;
      useful.scale.y = 1 + (q.potential / full) * 44;
      input.position.y = 0.1 + input.scale.y * 0.025;
      useful.position.y = 0.1 + useful.scale.y * 0.025;
    };
  },
  hydraulics(p, k) {
    k.stand(9, 4);
    const radii = [Math.sqrt(p.inputArea) * 18, Math.sqrt(p.outputArea) * 18],
      centers = [-2.7, 2.4],
      pistons = [],
      liquids = [];
    for (let i = 0; i < 2; i++) {
      const r = radii[i];
      glassCylinder(k, { radius: r + 0.07, height: 3.4, pos: [centers[i], 0.1, 0] });
      liquids.push(
        k.cylinder(r * 0.98, 1, 0x1eb4c6, [centers[i], 1, 0], { transparent: true, opacity: 0.62, roughness: 0.08, emissive: 0x0a5e6b, emissiveIntensity: 0.35 }),
      );
      pistons.push(piston(k, { radius: r, rod: 0.9, pos: [centers[i], 2.6, 0] }));
    }
    // The load carried by the large piston, and a push pad on the small one.
    pistons[1].add(turned(k, [[0, 0], [0.4, 0], [0.43, 0.03], [0.43, 0.27], [0.4, 0.3], [0, 0.3]], FINISH.brass, [0, 1.11, 0]));
    pistons[0].add(k.cylinder(0.2, 0.1, 0xb3262b, [0, 1.16, 0], { roughness: 0.45 }));
    pipe(k, [centers[0], 0.3, 0], [centers[1], 0.3, 0], { radius: 0.13 });
    const out = centers[1] + radii[1] + 0.5,
      arrows = [
        k.arrow([centers[0], 4.75, 0], [0, -0.8, 0], C.cyan),
        k.arrow([out, 2.2, 0], [0, 0.8, 0], C.gold),
      ];
    k.label("Small piston", [centers[0], 5.15, 0], "#64e8d1", 2.2);
    k.label("Large piston", [centers[1], 5.15, 0], "#ffc584", 2.2);
    return (s, q) => {
      const sc =
        1.2 / Math.max(p.stroke, (p.stroke * p.inputArea) / p.outputArea);
      const levels = [2.5 - q.inputTravel * sc, 1.8 + q.outputTravel * sc];
      for (let i = 0; i < 2; i++) {
        pistons[i].position.y = levels[i];
        liquids[i].scale.y = Math.max(0.1, levels[i] - 0.2);
        liquids[i].position.y = 0.2 + liquids[i].scale.y / 2;
      }
      k.setArrow(arrows[1], [out, levels[1] + 0.2, 0], [0, 0.8, 0]);
    };
  },
  hooke(p, k) {
    k.stand(7, 3);
    const top = 4.2, xs = p.mode === 2 ? [-1, 1] : [0], ruleX = p.mode === 2 ? 1.95 : 1.05;
    clampStand(k, -2.05, top + 0.12, 3.9);
    for (const x of xs) hook(k, [x, top + 0.02, 0], FINISH.chrome, 0.07);
    const c1 = coilSpring(k, xs[0], 2.7, 0, 1.5, { color: 0x9fd8cf }),
      c2 = p.mode ? coilSpring(k, p.mode === 2 ? 1 : 0, 1.2, 0, 1.4, { color: 0xe5bb7c }) : null,
      connector = p.mode === 1 ? hook(k, [0, 0, 0], FINISH.chrome, 0.06) : null,
      bar = p.mode === 2 ? k.box(2.5, 0.07, 0.1, FINISH.chrome[0], [0, 0, 0], FINISH.chrome[1]) : null,
      load = slottedMasses(k, { count: Math.max(1, Math.min(6, Math.round(p.load / 5))), radius: 0.3 }),
      needle = pointer(k, [0, 0, 0.05], ruleX - 0.2 - (p.mode === 2 ? 1.25 : 0.1));
    // A clamped rule beside the spring; the marker stays at the unloaded level.
    const zero = p.mode === 1 ? 2.08 : 2.7;
    upright(rule(k, { length: 2.3, width: 0.34, thickness: 0.05, divisions: 46, major: 10, label: () => "", pos: [ruleX, zero + 0.25, -0.02] }));
    retortStand(k, { x: ruleX + 0.75, z: -0.02, height: zero + 0.2, arm: -0.6, armY: zero - 0.3 });
    k.box(0.4, 0.035, 0.04, C.gold, [ruleX, zero, 0.02], { emissive: C.gold, emissiveIntensity: 0.45 });
    k.label("Unloaded level", [ruleX + 1.05, zero + 0.42, 0.26], "#ffc584", 1.5);
    k.label(
      ["Single spring", "Series: same force", "Parallel: same extension"][
        p.mode
      ],
      [0, 5.15, 0],
      "#cfe6ef",
      4.2,
    );
    return (s, q) => {
      const travel = 1.48 * springTravel(q.extension);
      let bottom;
      if (p.mode === 1) {
        const upperTravel = q.extension > 0 ? travel * q.x1 / q.extension : 0;
        const l1 = 1 + upperTravel,
          l2 = 1 + travel - upperTravel;
        c1.position.y = top - l1;
        c1.scale.y = l1;
        connector.position.y = c1.position.y - 0.06;
        c2.position.y = top - l1 - l2 - 0.12;
        c2.scale.y = l2;
        bottom = c2.position.y;
      } else {
        const length = 1.5 + travel;
        c1.position.y = top - length;
        c1.scale.y = length;
        if (c2) {
          c2.position.set(1, c1.position.y, 0);
          c2.scale.y = length;
        }
        bottom = c1.position.y;
      }
      if (bar) bar.position.y = bottom - 0.035;
      load.position.y = bottom - (bar ? 0.07 : 0);
      needle.position.set(p.mode === 2 ? 1.25 : 0.1, bottom, 0.05);
    };
  },
  materials(p, k) {
    k.stand(6, 3);
    clampStand(k, -1.75, 4.3, 2.3);
    const wire = k.cylinder(
        0.035 * Math.sqrt(p.area / 1e-6),
        1,
        C.cyan,
        [0, 3, 0],
      ),
      load = k.box(0.7, 0.6, 0.7, C.gold, [0, 1, 0]);
    const pointer = extensionPointer(k, 2.7, 1.18);
    k.label(
      "Wire cross-section and extension enlarged",
      [0, 5, 0],
      "#cfe6ef",
      5.5,
    );
    return (s, q) => {
      const len = 1.6 + 1.35 * wireTravel(q.extension);
      wire.scale.y = len;
      wire.position.y = 4.3 - len / 2;
      load.position.y = 4.3 - len - 0.3;
      pointer.position.y = 4.3 - len;
    };
  },
  driven(p, k) {
    k.stand(6, 3);
    clampStand(k, -1.95, 4.2, 2.55);
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
