/** Detailed mechanics apparatus. Read-only views of the original RK4 states. */
import * as T from "../vendor/three.module.min.js";
import { createSceneKit, PALETTE as C, putRod, setPath } from "./scene-kit.js";
import { springEnergy } from "./physics.js";

/** A solid helical wire. Its axial pitch changes without stretching the wire
 * cross-section. Positions and normals share fixed buffers for every frame. */
export function createHelix(turns = 12, radius = 0.19, wire = 0.032) {
  const segments = 288, sides = 8, count = (segments + 1) * (sides + 1),
    geometry = new T.BufferGeometry(),
    positions = new T.BufferAttribute(new Float32Array(count * 3), 3),
    normals = new T.BufferAttribute(new Float32Array(count * 3), 3), indices = [];
  positions.setUsage(T.DynamicDrawUsage);
  normals.setUsage(T.DynamicDrawUsage);
  geometry.setAttribute("position", positions);
  geometry.setAttribute("normal", normals);
  for (let i = 0; i < segments; i++) for (let j = 0; j < sides; j++) {
    const a = i * (sides + 1) + j, b = a + sides + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  geometry.setIndex(indices);
  return {
    geometry,
    update(length) {
      const omega = turns * Math.PI * 2, tangent = Math.hypot(length, radius * omega),
        ax = length / tangent, twist = radius * omega / tangent;
      for (let i = 0; i <= segments; i++) {
        const f = i / segments, angle = f * omega, c = Math.cos(angle), s = Math.sin(angle);
        for (let j = 0; j <= sides; j++) {
          const u = j / sides * Math.PI * 2, cu = Math.cos(u), su = Math.sin(u),
            nx = -su * twist, ny = cu * c - su * ax * s, nz = cu * s + su * ax * c,
            index = i * (sides + 1) + j;
          positions.setXYZ(index, f * length + wire * nx, radius * c + wire * ny, radius * s + wire * nz);
          normals.setXYZ(index, nx, ny, nz);
        }
      }
      positions.needsUpdate = normals.needsUpdate = true;
      geometry.computeBoundingSphere();
    },
  };
}

export function createDetailedMechanics(type, p, root, options = {}) {
  const k = createSceneKit(root, options), metal = { metalness: 0.78, roughness: 0.26 };
  if (type === "spring") {
    k.stand(10.6, 2.8);
    for (const z of [-0.52, 0.52]) k.rod([-4.8, 0.24, z], [4.8, 0.24, z], 0xb0bec4, 0.045);
    k.box(0.28, 1.55, 1.35, 0x394f60, [-4.55, 0.83, 0], metal);
    for (const y of [0.35, 1.3]) for (const z of [-0.48, 0.48]) {
      const screw = k.cylinder(0.056, 0.028, 0xa9b9c4, [-4.39, y, z], metal);
      screw.rotation.z = Math.PI / 2;
    }
    const mass = k.box(0.95, 0.8, 0.96, 0x388c96, [0, 0.74, 0], { metalness: 0.45, roughness: 0.28 }),
      carriage = k.box(1.2, 0.1, 1.25, 0x293b4b, [0, -0.44, 0], metal);
    mass.add(carriage);
    const inset = k.box(0.66, 0.46, 0.01, 0x6fc8c6, [0, 0.02, 0.485], { metalness: 0.35, roughness: 0.38 });
    mass.add(inset);
    mass.userData.role = "spring-mass";
    for (const x of [-0.38, 0.38]) for (const z of [-0.61, 0.61]) {
      const wheel = k.cylinder(0.11, 0.06, 0x8797a5, [x, -0.42, z], metal);
      wheel.rotation.x = Math.PI / 2;
      mass.add(wheel);
    }
    const helix = createHelix(), coil = k.mesh(helix.geometry, 0xd5e2e5, [-4.3, 0.74, 0], metal),
      connector = k.rod([-4.45, 0.74, 0], [-4.3, 0.74, 0], C.white),
      end = k.rod([0, 0.74, 0], [1, 0.74, 0], C.white),
      velocity = k.arrow([0, 2.5, 0], [1, 0, 0], C.gold),
      force = k.arrow([0, 1.65, 0], [1, 0, 0], C.cyan),
      xLine = k.line([], C.purple, 0.8),
      massLabel = k.label(p.mass.toFixed(2) + " kg", [0, 1.25, 0.35], "#c9e5e6", 1.1),
      xLabel = k.label("", [0, 0.32, 1.25], "#c3a6ff", 1.7),
      vLabel = k.label("Velocity", [-2.2, 3, 0], "#ffc584", 2.5),
      fLabel = k.label("Restoring force", [1.7, 3, 0], "#64e8d1", 3);
    for (let i = -8; i <= 8; i++) {
      const x = 1 + i * 0.32;
      k.line([[x, 0.04, 0.85], [x, 0.04, i % 2 ? 1 : 1.1]], 0xa1b8c7, 0.7);
      if (!(i % 4)) k.label((i / 10).toFixed(1), [x, 0.04, 1.38], "#7997ad", 0.5);
    }
    k.line([[1, 0.06, -1], [1, 0.06, 1.1]], C.purple, 0.5);
    k.label("Equilibrium · x = 0", [1, -0.32, 1.55], "#a7a3c7", 2.4);
    // Actual mechanical energies; a common scale is fixed from release energy.
    const e0 = Math.max(0.5 * p.k * p.displacement ** 2, 1e-12),
      bars = [C.gold, C.cyan].map((color, i) => k.box(0.16, 1, 0.22, color, [4.25 + i * 0.42, 0.2, -0.6], { roughness: 0.35 }));
    k.label("K   U", [4.45, 1.9, -0.6], "#9cb5c4", 0.85);
    let last = -1;
    return {
      target: [0, 1.2, 0], radius: 9.8, fitAspect: 1.9, kit: k,
      update(lab) {
        const s = lab.state, x = 1 + 3.2 * s.x;
        mass.position.x = x;
        helix.update(x - 0.62 + 4.3);
        putRod(end, [x - 0.62, 0.74, 0], [x - 0.475, 0.74, 0]);
        k.setArrow(velocity, [x, 2.45, 0], [Math.tanh(s.v / 2) * 1.9, 0, 0]);
        k.setArrow(force, [x, 1.7, 0], [Math.tanh(-p.k * s.x / 15) * 1.9, 0, 0]);
        massLabel.position.x = x;
        setPath(xLine, [[1, 0.32, 1.08], [x, 0.32, 1.08]]);
        xLabel.position.set((1 + x) / 2, 0.7, 1.5);
        const e = springEnergy(s, p);
        [e.kinetic, e.potential].forEach((value, i) => {
          bars[i].scale.y = Math.max(0.001, value / e0 * 1.3);
          bars[i].position.y = 0.12 + bars[i].scale.y / 2;
        });
        if (s.t < last || s.t - last >= 0.1) {
          k.setLabel(xLabel, "x = " + s.x.toFixed(2) + " m", "#c3a6ff", 1.7);
          k.setLabel(vLabel, "v = " + s.v.toFixed(2) + " m/s", "#ffc584", 2.5);
          k.setLabel(fLabel, "−kx = " + (-p.k * s.x).toFixed(2) + " N", "#64e8d1", 3);
          last = s.t;
        }
        k.visibility(lab.showLabels !== false, lab.vectors !== false);
        xLine.visible = lab.showLabels !== false;
      },
    };
  }

  // The pendulum is fitted per setup, with a constant length scale during a run.
  // Its rigid link supports the nonlinear model's >90° starting angles.
  const length = 3.3, scale = length / p.length, pivot = [0, 4.1, 0];
  k.stand(8.6, 3.1);
  for (const x of [-3.75, 3.75]) {
    k.rod([x, 0.1, -0.7], [x, 4.4, -0.7], 0x718895, 0.065);
    k.box(0.55, 0.12, 0.7, 0x385263, [x, 0.12, -0.7], metal);
  }
  k.rod([-3.75, 4.4, -0.7], [3.75, 4.4, -0.7], 0x8a9fab, 0.075);
  k.rod([0, 4.4, -0.7], [0, 4.1, 0.1], 0x95aab4, 0.07);
  const bearing = k.cylinder(0.16, 0.15, 0xd4b47f, [0, 4.1, 0], metal);
  bearing.rotation.x = Math.PI / 2;
  const bob = k.ball(0.19 + 0.04 * Math.sqrt(p.mass), C.gold, [0, 1, 0], { metalness: 0.75, roughness: 0.23 }),
    rod = k.rod(pivot, [0, 1, 0], 0xb5c7cc, 0.025),
    path = k.line([], C.gold, 0.55),
    angle = k.line([], C.cyan, 0.7),
    thetaLabel = k.label("", [0.7, 3.3, 0.15], "#64e8d1", 1.7),
    weight = k.arrow([0, 1, 0], [0, -0.9, 0], C.gold),
    tangent = k.arrow([0, 1, 0], [1, 0, 0], C.cyan);
  bob.userData.role = "pendulum-bob";
  k.line([[0, 4.1, -0.06], [0, 0.7, -0.06]], 0x8392a5, 0.25);
  k.label("L = " + p.length.toFixed(2) + " m", [-2.6, 4.95, 0], "#bacbd6", 2.2);
  k.label("Rigid link · nonlinear motion", [1.4, 4.95, 0], "#8ca7ba", 3.7);
  const arc = [];
  for (let i = -12; i <= 12; i++) {
    const a = i * Math.PI / 18, x = length * Math.sin(a), y = 4.1 - length * Math.cos(a);
    k.line([[x * 0.97, 4.1 - length * Math.cos(a) * 0.97, -0.15], [x * 1.02, 4.1 - length * Math.cos(a) * 1.02, -0.15]], 0x608597, 0.45);
    arc.push([x, y, -0.15]);
  }
  k.line(arc, 0x557989, 0.25);
  let last = -1;
  return {
    target: [0, 3.0, 0], radius: 11.2, fitAspect: 1.3, kit: k,
    update(lab) {
      const s = lab.state, theta = s.theta,
        at = [length * Math.sin(theta), 4.1 - length * Math.cos(theta), 0];
      bob.position.set(...at);
      putRod(rod, pivot, at);
      k.setArrow(weight, at, [0, -0.95, 0]);
      const v = Math.tanh(p.length * s.omega / 2) * 1.5;
      k.setArrow(tangent, at, [v * Math.cos(theta), v * Math.sin(theta), 0]);
      setPath(path, (lab.trail || []).map((q) => [q.x * scale, 4.1 + q.y * scale, 0.01]));
      const pts = [];
      for (let i = 0; i <= 32; i++) {
        const a = theta * i / 32;
        pts.push([0.7 * Math.sin(a), 4.1 - 0.7 * Math.cos(a), 0.08]);
      }
      setPath(angle, pts);
      thetaLabel.position.set(1.1 * Math.sin(theta / 2), 4.1 - 1.1 * Math.cos(theta / 2), 0.2);
      if (s.t < last || s.t - last >= 0.1) {
        k.setLabel(thetaLabel, "θ = " + (theta * 180 / Math.PI).toFixed(1) + "°", "#64e8d1", 1.7);
        last = s.t;
      }
      k.visibility(lab.showLabels !== false, lab.vectors !== false);
      path.visible = lab.showTrail;
      angle.visible = lab.showLabels !== false;
    },
  };
}
