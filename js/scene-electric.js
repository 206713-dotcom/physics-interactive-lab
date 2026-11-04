/** Spatial circuit components and field chambers. Charges in wires are an
 * illustrative current-direction overlay, never a measurement of drift speed. */
import * as T from "../vendor/three.module.min.js";
import { PALETTE as C, clamp, setPath } from "./scene-kit.js";
import { createParticleChamber } from "./scene-particle-chamber.js";
import { createMagnetismApparatus } from "./scene-magnetism.js";
import { createDCBench } from './scene-dc-bench.js';
import { machineSide } from "./curriculum-physics.js";
import {
  radiationReferences,
  particlePosition,
  selectorPath,
} from "./practical-physics.js";
const TAU = Math.PI * 2;
function board(k) {
  k.stand(9, 5);
}
function source(k) {
  k.box(0.7, 1.3, 0.7, C.blue, [-3.3, 1.3, 0]);
  k.label("Source", [-3.3, 2.5, 0], "#89baff", 1.5);
}
function wire(k, points, color = C.cyan) {
  return k.line(points, color);
}
function carrierLoop(k, points) {
  const dots = k.instances(18, 0.045, C.gold);
  return (t, current) => {
    dots.visible = Math.abs(current) > 1e-14;
    for (let i = 0; i < 18; i++) {
      const u =
          ((((i / 18 + t * 0.2 * Math.sign(current)) % 1) + 1) % 1) *
          points.length,
        j = Math.floor(u),
        f = u - j,
        a = points[j],
        b = points[(j + 1) % points.length];
      k.instance(
        dots,
        i,
        a.map((x, d) => x + (b[d] - x) * f),
      );
    }
    k.finishInstances(dots);
  };
}
function chamber(k, direction = -1) {
  board(k);
  k.glass(8, 4, 2.4, [0, 2, 0]);
  for (let x = -3; x <= 3; x += 1.5)
    for (let y = 0.7; y < 3.5; y += 1.3)
      k.arrow([x, y, -0.7], [0, 0, direction * 0.45], C.blue);
}
export const ELECTRIC_SCENES = {
  dc(p, k) {
    return createDCBench(p,k);
  },
  devices(p, k) {
    board(k);
    source(k);
    wire(k, [
      [-3.3, 0.7, 0],
      [3, 0.7, 0],
      [3, 2, 0],
      [-3.3, 2, 0],
      [-3.3, 0.7, 0],
    ]);
    k.resistor(-1, 2, 0);
    const device = k.box(0.7, 0.45, 0.65, C.muted, [1, 2, 0], {
      emissive: C.cyan,
      emissiveIntensity: 0,
    });
    k.label(
      ["Diode threshold", "Relay switching", "Ideal current cut-out"][p.mode],
      [0, 3.7, 0],
      "#cfe6ef",
      3.8,
    );
    const flow = carrierLoop(k, [
      [-3.3, 0.7, 0],
      [3, 0.7, 0],
      [3, 2, 0],
      [-3.3, 2, 0],
    ]);
    return (s, q) => {
      device.material.emissiveIntensity = q.on ? 0.65 : 0;
      flow(s.t, q.current);
    };
  },
  sensors(p, k) {
    board(k);
    source(k);
    wire(k, [
      [-3.3, 0.7, 0],
      [1.8, 0.7, 0],
      [1.8, 3, 0],
      [-3.3, 3, 0],
      [-3.3, 0.7, 0],
    ]);
    k.resistor(1.8, p.orientation ? 1.2 : 2.7, 0);
    const sensor = k.ball(0.35, C.purple, [1.8, p.orientation ? 2.7 : 1.2, 0]);
    k.rod([1.8, 1.9, 0], [3.3, 1.9, 0], C.gold);
    const led = k.ball(0.2, C.cyan, [3.3, 1.9, 0], {
      emissive: C.cyan,
      emissiveIntensity: 0,
    });
    k.label("Vout", [3.2, 2.6, 0], "#ffc584", 1.3);
    k.label(
      p.mode ? "Thermistor" : "Light-dependent resistor",
      [0.8, 0.35, 1.4],
      "#c3a6ff",
      3.8,
    );
    k.label("Sensor changes resistance", [0, 4.1, 0], "#cfe6ef", 4);
    return (s, q) => {
      led.material.emissiveIntensity = q.on ? 1.5 : 0;
      sensor.scale.setScalar(0.85 + 0.15 * Math.tanh(q.resistance / 1e4));
    };
  },
  rectifier(p, k) {
    board(k);
    const diode = (a, b) => {
      wire(k, [a, b]);
      const center = a.map((v, i) => (v + b[i]) / 2),
        g = new T.Group();
      k.add(g, center);
      g.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]);
      g.add(
        k.box(0.45, 0.25, 0.4, C.blue),
        k.box(0.045, 0.31, 0.45, C.white, [0.15, 0, 0]),
      );
    };
    if (p.mode) {
      const left = [-2, 1.7, 0],
        right = [2, 1.7, 0],
        top = [0, 3, 0],
        bottom = [0, 0.4, 0];
      for (const [a, b] of [
        [left, top],
        [right, top],
        [bottom, left],
        [bottom, right],
      ])
        diode(a, b);
      k.box(0.5, 1, 0.5, C.blue, [-3.5, 1.7, 0]);
      wire(k, [[-3.5, 1.2, 0], left]);
      wire(k, [[-3.5, 2.2, 0], [-3.5, 2.2, -1.5], [2, 2.2, -1.5], right]);
      wire(k, [top, [4, 3, 0], [4, 0.4, 0], bottom]);
      k.resistor(2.7, 3, 0);
      k.label("+", [0.4, 3.45, 0], "#ffc584", 0.45);
      k.label("−", [0.4, 0.1, 0], "#89baff", 0.45);
    } else {
      source(k);
      wire(k, [
        [-3.3, 0.7, 0],
        [3, 0.7, 0],
        [3, 2, 0],
        [-3.3, 2, 0],
        [-3.3, 0.7, 0],
      ]);
      diode([-1, 2, 0], [1, 2, 0]);
      k.resistor(2.5, 0.7, 0);
    }
    const input = k.arrow([-3, 3, 0], [0, 1, 0], C.purple),
      output = k.arrow([3.8, 1.4, 0], [0, 1, 0], C.gold);
    k.label("AC in", [-3, 4.4, 0], "#c3a6ff", 1.5);
    k.label("Pulsed DC out", [2.3, 4.4, 0], "#ffc584", 2.5);
    return (s, q) => {
      k.setArrow(input, [-3, 3, 0], [0, q.input / p.peak, 0]);
      k.setArrow(output, [3.8, 1.4, 0], [0, q.output / p.peak, 0]);
    };
  },
  magnetism(p, k) {
    return createMagnetismApparatus(p, k);
  },
  charged(p, k) {
    return createParticleChamber(p, k);
  },
  radiation(p, k) {
    chamber(k, Math.sign(p.field));
    const refs = radiationReferences(p),
      paths = {},
      dots = {};
    for (const [id, col] of [
      ["alpha", C.gold],
      ["beta", C.cyan],
      ["gamma", C.purple],
    ]) {
      paths[id] = wire(k, [], col);
      dots[id] = k.ball(0.09, col, [-3, 2, 0]);
    }
    k.label("α gold · β cyan · γ purple", [0, 4.7, 0], "#cfe6ef", 4.4);
    return (s) => {
      const duration = s.t,
        extent = Math.max(1, 299792458 * duration),
        scale = 6 / extent;
      for (const id of ["alpha", "beta", "gamma"]) {
        const point = (t) => {
          const a =
            id === "gamma"
              ? { x: 299792458 * t, y: 0 }
              : particlePosition(refs[id], t);
          return [-3 + a.x * scale, 2 + a.y * scale, 0];
        };
        setPath(
          paths[id],
          Array.from({ length: 241 }, (_, i) => point((duration * i) / 240)),
        );
        dots[id].position.set(...point(duration));
      }
    };
  },
  motor(p, k) {
    return ELECTRIC_SCENES.induction(p, k, true);
  },
  induction(p, k, motor = false) {
    board(k);
    const metal = { metalness: 0.75, roughness: 0.3 };
    // Laminated rear yoke and machined pole shoes make the air gap explicit.
    k.box(6.8, 0.45, 0.9, 0x445564, [0, 0.35, -0.8], metal);
    for (const [x, color] of [[-2.8, 0xa34f4d], [2.8, 0x40678f]]) {
      k.box(1.1, 2.8, 1.75, color, [x, 1.85, 0], { metalness: 0.45, roughness: 0.4 });
      k.box(0.14, 2.25, 1.9, 0xa9b9c0, [x + (x < 0 ? 0.62 : -0.62), 1.85, 0], metal);
      k.box(1.3, 0.15, 2, 0x3d505d, [x, 0.35, 0], metal);
      for (const z of [-0.7, 0.7]) {
        const bolt = k.cylinder(0.06, 0.035, 0xb4c6ce, [x, 3.26, z], metal);
        k.rod([x - 0.22, 0.6, z], [x - 0.22, 3.15, z], 0x627580, 0.018);
      }
    }
    k.label("N", [-2.8, 3.7, 0], "#ff9d91", 0.65);
    k.label("S", [2.8, 3.7, 0], "#89baff", 0.65);
    const fieldLines = 2 + Math.round(5 * Math.sqrt(p.field));
    for (let i = 0; i < fieldLines; i++)
      k.arrow([-2.1, .87 + i * 1.92/(fieldLines-1), -.96], [4.2, 0, 0], C.cyan);
    const rotor = new T.Group();
    k.add(rotor, [0, 1.8, 0]);
    // Visible turns are a schematic bundle; N is taken from the calculation.
    for (const z of [-0.12, -0.06, 0, 0.06, 0.12]) {
      const points = [
        [0, -1, z - 0.8],
        [0, 1, z - 0.8],
        [0, 1, z + 0.8],
        [0, -1, z + 0.8],
        [0, -1, z - 0.8],
      ].map((a) => new T.Vector3(...a));
      const curve = new T.CatmullRomCurve3(points, false, "centripetal", 0.05),
        path = k.mesh(new T.TubeGeometry(curve, 128, 0.025, 10, false), 0xd89055, [0, 0, 0], { metalness: 0.68, roughness: 0.26 });
      rotor.add(path);
    }
    const shaft = k.cylinder(0.055, 3.85, C.white, [0, 1.9, 0], metal);
    for (const y of [0.25, 3.6]) {
      k.box(0.62, 0.16, 0.65, 0x374f60, [0, y, 0], metal);
      const bearing = k.cylinder(0.18, 0.3, 0x9bb0ba, [0, y, 0], metal);
      k.ring(0.2, C.white, [0, y + 0.16, 0]);
    }
    const contacts = new T.Group();
    k.add(contacts, [0, 3.14, 0]);
    for (const side of [-1, 1]) {
      const ring = k.mesh(new T.TorusGeometry(.19,.036,10,44,motor ? Math.PI-.23 : TAU),
        motor && side < 0 ? 0xf4be78 : 0xda9c64, [0,motor ? 0 : side*.105,0],metal);
      ring.rotation.x = -Math.PI/2;
      ring.rotation.z = motor ? (side<0 ? Math.PI : 0)+.115 : 0;
      contacts.add(ring);
      const x = motor ? side*.30 : .30, y = 3.14 + (motor ? 0 : side*.105);
      const leadColor = motor ? (side > 0 ? C.red : C.blue) : (side < 0 ? C.gold : C.blue);
      k.box(.18,.105,.14,0x546474,[x,y,0],metal);
      k.rod([x,y,0],[x,y,.73],leadColor,.022);
      k.rod([x,y,.73],[motor ? side*.8 : .8,y,.73],leadColor,.022);
      if (motor)
        k.label(side > 0 ? "+" : "−", [side*.88,y,.73],side > 0 ? "#ffb4ac" : "#a8cbff", .36);
    }
    k.label(motor ? "Split ring · DC supply" : "Slip rings · AC output",
      [0,3.85,.85],"#dbedf5",2.3);
    rotor.userData.role = "rotor";
    const sides = [-1,1].map(side => ({
      side, current: k.arrow([0,0,0],[0,0,0],C.purple),
      action: k.arrow([0,0,0],[0,0,0],C.gold),
    }));
    const markedSide = k.label("A", [0, 0, 0], "#e5f2fa", .42);
    const normal = !motor && k.arrow([0, 1.8, 0], [1.5, 0, 0], C.blue);
    return (s, q) => {
      rotor.rotation.y = q.phase;
      contacts.rotation.y = q.phase;
      for (const {side,current,action} of sides) {
        const direction = machineSide(q.phase, side, motor, motor || Boolean(q.circuit));
        const x = .8*direction.x, z = .8*direction.z;
        if (side === 1) markedSide?.position.set(x, .62, z);
        k.setArrow(current,[x,1.8-direction.current*.52,z],[0,direction.current*1.04,0]);
        k.setArrow(action,[x,2.27,z],motor ? [0,0,1.1*direction.force]
          : direction.motion.map(component => component*1.05));
      }
      if (normal) k.setArrow(
        normal,
        [0, 1.8, 0],
        [1.4 * Math.cos(q.phase), 0, -1.4 * Math.sin(q.phase)],
      );
    };
  },
  transformer(p, k) {
    board(k);
    for (const x of [-2, 2]) k.box(0.5, 3, 1, C.muted, [x, 1.7, 0]);
    for (const y of [0.3, 3.1]) k.box(4.5, 0.5, 1, C.muted, [0, y, 0]);
    k.spring(-2, 0.7, 0, 2, C.gold, 0.55, 12);
    k.spring(
      2,
      0.7,
      0,
      2,
      C.cyan,
      0.55,
      Math.round(clamp((12 * p.ns) / p.np, 3, 24)),
    );
    k.label("Primary", [-2, 4, 0], "#ffc584", 1.9);
    k.label("Secondary", [2, 4, 0], "#64e8d1", 2.1);
    const flux = k.instances(24, 0.045, C.purple);
    const loop = [
      [-2, 0.6, 0],
      [2, 0.6, 0],
      [2, 2.8, 0],
      [-2, 2.8, 0],
    ];
    return (s) => {
      for (let i = 0; i < 24; i++) {
        const u = ((i / 24 + s.t * 0.15) % 1) * 4,
          j = Math.floor(u),
          a = loop[j],
          b = loop[(j + 1) % 4];
        k.instance(
          flux,
          i,
          a.map((x, d) => x + (b[d] - x) * (u - j)),
        );
      }
      k.finishInstances(flux);
    };
  },
  selector(p, k) {
    chamber(k);
    const sc = Math.min(6 / p.length, 1.5 / 0.095),
      length = p.length * sc,
      left = -length / 2,
      halfHeight = 0.095 * sc;
    k.box(length, 0.15, 1.5, C.gold, [0, 2 - halfHeight, 0]);
    k.box(length, 0.15, 1.5, C.cyan, [0, 2 + halfHeight, 0]);
    for (const x of [-2, 0, 2]) k.arrow([x, 3.3, 0], [0, -2.6, 0], C.cyan);
    const path = wire(k, [], C.gold),
      dot = k.ball(0.1, C.gold, [-3, 2, 0]),
      electric = k.arrow([0, 2, 0], [0, -0.7, 0], C.red),
      magnetic = k.arrow([0, 2, 0], [0, 0.7, 0], C.purple);
    k.label(
      "E down · B into the trajectory plane",
      [0, 4.7, 0],
      "#cfe6ef",
      5.3,
    );
    return (s, q) => {
      const scale = sc,
        pts = selectorPath(p, s.t).map((a) => [
          left + a.x * scale,
          2 + a.y * scale,
          0,
        ]);
      setPath(path, pts);
      dot.position.set(...pts.at(-1));
      const force = Math.max(q.electric, q.magnetic, 1e-30);
      k.setArrow(electric, pts.at(-1), [0, -q.electric / force, 0]);
      k.setArrow(magnetic, pts.at(-1), [
        ((-q.vy / Math.max(p.speed, Math.hypot(q.vx, q.vy))) * q.magnetic) /
          force,
        ((q.vx / Math.max(p.speed, Math.hypot(q.vx, q.vy))) * q.magnetic) /
          force,
        0,
      ]);
    };
  },
};
