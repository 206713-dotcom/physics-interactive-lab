/** A calibrated, open-top laboratory tank. Every vertical position (including
 * the cube and waterline) uses the same six scene units per metre. */
import * as T from "../vendor/three.module.min.js";
import { PALETTE as C } from "./scene-kit.js";
import { waterSurface } from "./scene-finish.js";
import { TANK_DEPTH, SUPPORT_HEIGHT, BUOYANCY_STATUS } from "./buoyancy-physics.js";

export function createBuoyancyApparatus(p, k) {
  const scale = 6, floor = 0.14,
    surface = floor + TANK_DEPTH * scale,
    side = Math.cbrt(p.volume) * scale,
    width = 4.1, depth = 2.5, height = 3.65;
  k.stand(5.8, 3.8);
  const metal = { metalness: 0.72, roughness: 0.26 },
    glass = { transparent: true, opacity: 0.065, depthWrite: false, metalness: 0.05, roughness: 0.18 };
  // Separate panes keep the front clear; the highlights describe the edges.
  k.box(width, 0.09, depth, 0x7b9da9, [0, floor - 0.045, 0], metal);
  for (const x of [-width / 2, width / 2]) {
    k.box(0.035, height, depth, 0xc0e9ef, [x, floor + height / 2, 0], glass);
    for (const z of [-depth / 2, depth / 2])
      k.rod([x, floor, z], [x, floor + height, z], 0xb1d7de, 0.018);
  }
  for (const z of [-depth / 2, depth / 2]) {
    k.box(width, height, 0.018, 0xa2d7e6, [0, floor + height / 2, z], { ...glass, opacity: z > 0 ? 0.025 : 0.075 });
    k.rod([-width / 2, floor + height, z], [width / 2, floor + height, z], 0x90bcc8, 0.025);
  }
  for (const x of [-width / 2, width / 2])
    k.rod([x, floor + height, -depth / 2], [x, floor + height, depth / 2], 0x90bcc8, 0.025);
  k.box(width - 0.05, TANK_DEPTH * scale, depth - 0.05, 0x2b9dbc, [0, floor + TANK_DEPTH * scale / 2, 0], {
    transparent: true, opacity: 0.085, depthWrite: false, roughness: 0.35, metalness: 0,
  });
  const water = waterSurface(width - 0.04, depth - 0.04);
  water.rotation.x = -Math.PI / 2;
  k.add(water, [0, surface, 0]);
  k.line([[-width / 2, surface, depth / 2], [width / 2, surface, depth / 2]], 0x91e8ed, 0.6);
  k.line([[-width / 2, surface, -depth / 2], [width / 2, surface, -depth / 2]], 0x91e8ed, 0.4);
  // Permeable support: the actual solver permits liquid below the cube.
  for (let x = -1.8; x <= 1.8; x += 0.24)
    k.box(0.045, SUPPORT_HEIGHT * scale, depth - 0.12, 0x5f7b86, [x, floor + SUPPORT_HEIGHT * scale / 2, 0], metal);
  for (const z of [-0.95, 0, 0.95])
    k.box(width - 0.14, 0.012, 0.045, 0xabc3ca, [0, floor + SUPPORT_HEIGHT * scale, z], metal);
  const rulerX = -2.38;
  k.box(0.14, 3.15, 0.075, 0x73949f, [rulerX, surface - 1.5, 1.31], { metalness: 0.6, roughness: 0.4 });
  for (let i = 0; i <= 20; i++) {
    const y = surface - i * 0.15;
    k.line([[rulerX - 0.03, y, 1.36], [rulerX + (i % 4 ? 0.12 : 0.23), y, 1.36]], 0xd1e2e8, 0.9);
    if (!(i % 4)) k.label((i / 40).toFixed(1) + " m", [-2.85, y, 1.35], "#a8c7d8", 0.67);
  }
  const body = k.box(side, side, side, C.gold, [0, 2, 0], { metalness: 0.55, roughness: 0.28 }),
    bodyDetail = new T.Group();
  body.add(bodyDetail);
  for (const z of [-side / 2 - 0.001, side / 2 + 0.001]) {
    const inset = k.box(side * 0.72, side * 0.72, 0.004, 0xab743d, [0, 0, z], { metalness: 0.6, roughness: 0.4 });
    bodyDetail.add(inset);
    const face = k.box(side * 0.64, side * 0.64, 0.005, 0xd8a567, [0, 0, z * 1.01], { metalness: 0.4, roughness: 0.45 });
    bodyDetail.add(face);
    for (const x of [-0.25, 0.25]) {
      const screw = k.ball(side * 0.022, 0x4a4540, [x * side, side * 0.25, z * 1.025]);
      bodyDetail.add(screw);
    }
  }
  const up = k.arrow([1, 2, 0], [0, 1, 0], C.cyan),
    weight = k.arrow([-1, 2, 0], [0, -1, 0], C.gold),
    drag = k.arrow([1.5, 2, 0], [0, 1, 0], C.blue),
    normal = k.arrow([0, 0.3, 0], [0, 1, 0], C.purple),
    status = k.label("Release from rest", [0, 4.65, 0], "#cfdee9", 4.2),
    wl = k.label("Weight", [-1.35, 4.07, 0], "#ffc584", 2),
    ul = k.label("Upthrust", [1.35, 4.07, 0], "#64e8d1", 2),
    supportLabel = k.label("Support force", [0, floor + 0.3, 1.75], "#c3a6ff", 2.2);
  body.userData.role = "buoyancy-body";
  return {
    update(s, q) {
      const y = floor + q.y * scale,
        unit = 1.35 / Math.max(q.weight, q.capacity, 1e-8);
      body.position.y = y;
      water.material.uniforms.time.value = s.t;
      water.material.uniforms.motion.value = Math.min(1, Math.abs(q.v) * 3) * Math.exp(-Math.abs(y - surface) * 1.6);
      k.setArrow(weight, [-side / 2 - 0.36, y, 0.7], [0, -q.weight * unit, 0]);
      k.setArrow(up, [side / 2 + 0.36, y, 0.7], [0, q.upthrust * unit, 0]);
      k.setArrow(drag, [side / 2 + 0.92, y, 0.7], [0, q.drag * unit, 0]);
      k.setArrow(normal, [0, floor + 0.04, 0.85], [0, q.normal * unit, 0]);
      k.setLabel(status, BUOYANCY_STATUS[q.status] + " · " + q.immersion.toFixed(1) + "% immersed", "#cfdee9", 4.2);
      k.setLabel(wl, "Weight  " + q.weight.toFixed(2) + " N", "#ffc584", 2.25);
      k.setLabel(ul, "Upthrust  " + q.upthrust.toFixed(2) + " N", "#64e8d1", 2.25);
      supportLabel.userData.show = q.normal > 1e-8;
    },
    afterVisibility(lab) {
      supportLabel.visible = lab.showLabels !== false && supportLabel.userData.show;
    },
  };
}
