/** Calibrated tank: one shared metre scale for the cube, water and ruler. */
import { PALETTE as C } from "./scene-kit.js";
import {
  TANK_DEPTH,
  SUPPORT_HEIGHT,
  BUOYANCY_STATUS,
} from "./buoyancy-physics.js";
export function createBuoyancyApparatus(p, k) {
  const scale = 6,
    floor = 0.12,
    surface = floor + TANK_DEPTH * scale,
    side = Math.cbrt(p.volume) * scale;
  k.stand(7.5, 4.5);
  k.glass(4.1, 3.8, 2.5, [0, floor + 1.9, 0]);
  k.box(4, 3, 2.4, 0x269fc0, [0, floor + 1.5, 0], {
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    roughness: 0.15,
  });
  k.box(4, 0.018, 2.4, C.cyan, [0, surface, 0], {
    transparent: true,
    opacity: 0.19,
    depthWrite: false,
  });
  // A perforated support lets fluid reach the underside of the resting block.
  for (let x = -1.8; x <= 1.8; x += 0.3)
    k.box(0.028, SUPPORT_HEIGHT * scale, 2.3, C.muted, [
      x,
      floor + (SUPPORT_HEIGHT * scale) / 2,
      0,
    ]);
  for (let i = 0; i <= 5; i++) {
    const y = surface - i * 0.6;
    k.rod([-1.95, y, 1.28], [-1.74, y, 1.28], C.white, 0.012);
    k.label((i / 10).toFixed(1) + " m", [-2.38, y, 1.28], "#c9e5f4", 0.75);
  }
  const body = k.box(side, side, side, C.gold, [0, 2, 0], {
      metalness: 0.18,
      roughness: 0.24,
    }),
    stripe = k.box(
      side * 1.005,
      side * 0.12,
      side * 1.005,
      0xc87f32,
      [0, 2, 0],
    ),
    up = k.arrow([1, 2, 0], [0, 1, 0], C.cyan),
    weight = k.arrow([-1, 2, 0], [0, -1, 0], C.gold),
    drag = k.arrow([1.5, 2, 0], [0, 1, 0], C.blue),
    normal = k.arrow([0, 0.3, 0], [0, 1, 0], C.purple),
    status = k.label("Release from rest", [0, 4.35, 0], "#e1eff6", 4.6),
    wl = k.label("Weight", [-1.2, 3.8, 0.3], "#ffc584", 2),
    ul = k.label("Upthrust", [1.15, 3.8, 0.3], "#64e8d1", 2),
    supportLabel = k.label("Support force", [0, 0.52, 1.65], "#c3a6ff", 2.7);
  return {
    update(s, q) {
      const y = floor + q.y * scale,
        unit = 1.05 / Math.max(q.weight, q.capacity, 1e-8);
      body.position.y = y;
      stripe.position.y = y + side * 0.22;
      k.setArrow(weight, [-side / 2 - 0.3, y, 0.6], [0, -q.weight * unit, 0]);
      k.setArrow(up, [side / 2 + 0.3, y, 0.6], [0, q.upthrust * unit, 0]);
      k.setArrow(drag, [side / 2 + 0.8, y, 0.6], [0, q.drag * unit, 0]);
      k.setArrow(normal, [0, floor + 0.04, 0.65], [0, q.normal * unit, 0]);
      k.setLabel(
        status,
        BUOYANCY_STATUS[q.status] +
          " · " +
          q.immersion.toFixed(1) +
          "% immersed",
        "#e1eff6",
        5.2,
      );
      k.setLabel(wl, "W " + q.weight.toFixed(2) + " N", "#ffc584", 2);
      k.setLabel(ul, "U " + q.upthrust.toFixed(2) + " N", "#64e8d1", 2);
      supportLabel.userData.show = q.normal > 1e-8;
    },
    afterVisibility(lab) {
      supportLabel.visible =
        lab.showLabels !== false && supportLabel.userData.show;
    },
  };
}
