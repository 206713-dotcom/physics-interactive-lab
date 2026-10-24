/** Spatial circuit components and field chambers. Charges in wires are an
 * illustrative current-direction overlay, never a measurement of drift speed. */
import * as T from "../vendor/three.module.min.js";
import { PALETTE as C, clamp, setPath } from "./scene-kit.js";
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
    board(k);
    source(k);
    const path = [
      [-3.3, 0.7, 0],
      [3, 0.7, 0],
      [3, 2.2, 0],
      [-3.3, 2.2, 0],
    ];
    wire(k, [...path, path[0]]);
    k.resistor(0, 2.2, 0);
    k.label("R₁", [0, 3, 0], "#ffc584", 1);
    if (p.mode === 1) {
      wire(k, [
        [-2, 2.2, 0],
        [-2, 1.3, 1.2],
        [2, 1.3, 1.2],
        [2, 2.2, 0],
      ]);
      k.resistor(0, 1.3, 1.2, C.purple);
      k.label("Parallel branch", [0, 0.5, 1.9], "#c3a6ff", 2.6);
    } else if (p.mode !== 3) {
      k.resistor(1.8, 2.2, 0, C.purple);
      k.label("R₂", [1.8, 3, 0], "#c3a6ff", 1);
    }
    if (p.mode === 2) {
      k.rod([0.9, 2.2, 0], [0.9, 3.1, 0], C.gold);
      k.label("Vout", [0.9, 3.5, 0], "#ffc584", 1.4);
    }
    const flow = carrierLoop(k, path);
    k.label("Gold markers: conventional current", [0, 4, 0], "#ffc584", 4.8);
    return (s, q) => flow(s.t, q.current);
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
    board(k);
    if (p.mode === 0) {
      const coil = k.spring(-2, 1.8, 0, 4, C.gold, 0.7, 18);
      coil.rotation.z = -Math.PI / 2;
      for (let j = 0; j < 5; j++) {
        const z = (j - 2) * 0.25;
        k.arrow(
          [p.current < 0 ? 1.6 : -1.6, 1.8, z],
          [3.2 * Math.sign(p.current), 0, 0],
          C.cyan,
        );
      }
      for (const z of [-1, 1])
        k.line(
          Array.from({ length: 121 }, (_, i) => {
            const a = (i / 120) * TAU;
            return [
              3.2 * Math.cos(a),
              1.8 + 0.7 * Math.sin(a),
              z * Math.sin(a),
            ];
          }),
          C.cyan,
          0.35,
        );
      k.label("Field inside the solenoid", [0, 3.8, 0], "#64e8d1", 4);
    } else {
      k.cylinder(0.07, 3.5, C.gold, [0, 1.8, 0]);
      for (let j = 1; j < 5; j++) {
        const ring = k.ring(j * 0.55, C.cyan, [0, 1.8, 0]);
        ring.visible = p.current !== 0;
      }
      k.arrow([1.1, 1.8, 0.3], [0, 0, -0.6 * Math.sign(p.current)], C.cyan);
      k.arrow([0, 0.5, 0], [0, 2.5 * Math.sign(p.current || 1), 0], C.gold);
      k.label("Circular field around a wire", [0, 4.2, 0], "#64e8d1", 4.2);
    }
    return () => {};
  },
  charged(p, k) {
    chamber(k, Math.sign(p.field));
    const path = wire(k, [], C.cyan),
      dot = k.ball(0.12, C.gold, [-3, 2, 0]);
    k.label(
      "Magnetic force is perpendicular to v",
      [0, 4.7, 0],
      "#cfe6ef",
      5.3,
    );
    const force = k.arrow([0, 2, 0], [0, 1, 0], C.purple);
    return (s, q) => {
      const omega = (-p.charge * 1.602176634e-19 * p.field) / p.mass,
        scale = omega ? 2 / q.radius : 6 / Math.max(p.speed * s.t, 1e-12),
        pt = (t) =>
          omega
            ? [
                (p.speed / omega) * Math.sin(omega * t) * scale,
                2 +
                  ((p.speed / omega) * (1 - Math.cos(omega * t)) -
                    p.speed / omega) *
                    scale,
                0,
              ]
            : [p.speed * t * scale - 3, 2, 0];
      const pos = pt(s.t);
      dot.position.set(...pos);
      setPath(
        path,
        Array.from({ length: 201 }, (_, i) => pt((s.t * i) / 200)),
      );
      const a = q.phase,
        sign = Math.sign(p.charge * p.field);
      k.setArrow(
        force,
        pos,
        p.field
          ? [sign * Math.sin(a) * 0.7, -sign * Math.cos(a) * 0.7, 0]
          : [0, 0, 0],
      );
    };
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
  induction(p, k) {
    board(k);
    k.box(1, 3, 2, C.red, [-3, 1.6, 0]);
    k.box(1, 3, 2, C.blue, [3, 1.6, 0]);
    k.label("N", [-3, 3.6, 0], "#ff9d91", 0.8);
    k.label("S", [3, 3.6, 0], "#89baff", 0.8);
    for (const y of [0.8, 2.4]) k.arrow([-2.3, y, -0.6], [4.6, 0, 0], C.cyan);
    const rotor = new T.Group();
    rotor.position.y = 1.6;
    k.add(rotor, [0, 1.6, 0]);
    for (const z of [-0.08, 0, 0.08]) {
      const points = [
        [0, -1, z - 0.8],
        [0, 1, z - 0.8],
        [0, 1, z + 0.8],
        [0, -1, z + 0.8],
        [0, -1, z - 0.8],
      ].map((a) => new T.Vector3(...a));
      const curve = new T.CatmullRomCurve3(points, false, "centripetal", 0.05),
        path = k.mesh(new T.TubeGeometry(curve, 100, 0.026, 8, false), C.gold);
      rotor.add(path);
    }
    k.cylinder(0.045, 4, C.white, [0, 1.9, 0]);
    k.box(7, 0.18, 0.3, C.muted, [0, 0.2, -1.2]);
    for (const y of [0.25, 3.75]) {
      const bearing = k.cylinder(0.18, 0.25, C.muted, [0, y, 0]);
      k.ring(0.2, C.white, [0, y + 0.14, 0]);
    }
    rotor.userData.role = "rotor";
    const normal = k.arrow([0, 1.6, 0], [1.5, 0, 0], C.purple);
    k.label("B → cyan · coil normal → purple", [0, 4.5, 0], "#cfe6ef", 5);
    return (s, q) => {
      rotor.rotation.y = q.phase;
      k.setArrow(
        normal,
        [0, 1.6, 0],
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
