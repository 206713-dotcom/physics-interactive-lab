/** Vertical motion of an upright cube. SI throughout; y is height above the
 * tank floor. A permeable support leaves liquid under a resting cube, so the
 * hydrostatic upthrust remains applicable at contact (no sealed suction cup).
 * Archimedes: https://openstax.org/books/university-physics-volume-1/pages/14-4-archimedes-principle-and-buoyancy
 * Drag is an explicit teaching approximation, not a calibrated fluid solver. */
export const TANK_DEPTH = 0.5,
  SUPPORT_HEIGHT = 0.005;
export const FLUID_VISCOSITY = 0.1,
  DRAG_COEFFICIENT = 1.05;
export const BUOYANCY_STATUS = [
  "Resting on support",
  "Sinking",
  "Rising",
  "Neutrally buoyant",
  "Floating in equilibrium",
  "Accelerating downward",
  "Accelerating upward",
  "At rest",
];
const g = 9.81,
  clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export function createBuoyancy(p) {
  const side = Math.cbrt(p.volume);
  // Release at rest with the top face 2 cm under the surface. Neutral density
  // consequently stays suspended; light cubes rise and heavy cubes sink.
  return { t: 0, y: TANK_DEPTH - side / 2 - 0.02, v: 0, grounded: false };
}
export function buoyancySample(s, p) {
  const side = Math.cbrt(p.volume),
    area = side * side,
    y = s.y ?? createBuoyancy(p).y,
    v = s.v ?? 0,
    fraction = clamp((TANK_DEPTH - y + side / 2) / side, 0, 1),
    displaced = p.volume * fraction,
    mass = p.density * p.volume,
    weight = mass * g,
    upthrust = p.fluid * g * displaced,
    linear = 3 * Math.PI * FLUID_VISCOSITY * side,
    // Wetted-area fraction approximates entry/exit; fixed Cd neglects Re changes.
    drag =
      -fraction *
      (linear * v + 0.5 * p.fluid * DRAG_COEFFICIENT * area * v * Math.abs(v)),
    bottom = SUPPORT_HEIGHT + side / 2,
    normal =
      y <= bottom + 1e-10 && v <= 0 ? Math.max(0, weight - upthrust - drag) : 0,
    net = upthrust + drag + normal - weight,
    equilibriumFraction = Math.min(1, p.density / p.fluid),
    status =
      normal > 0
        ? 0
        : Math.abs(v) > 0.003
          ? v < 0
            ? 1
            : 2
          : p.density === p.fluid && fraction === 1
            ? 3
            : p.density < p.fluid &&
                Math.abs(fraction - equilibriumFraction) < 0.003
              ? 4
              : net < -1e-7
                ? 5
                : net > 1e-7
                  ? 6
                  : 7;
  return {
    mass,
    weight,
    upthrust,
    capacity: p.fluid * g * p.volume,
    pressure: p.fluid * g * p.depth,
    fraction,
    displaced,
    y,
    v,
    a: net / mass,
    drag,
    normal,
    net,
    side,
    immersion: fraction * 100,
    equilibriumFraction,
    depth: TANK_DEPTH - y,
    status,
  };
}
export function stepBuoyancy(s, p, h) {
  if (![s.y, s.v, s.t, h].every(Number.isFinite) || h <= 0 || h > 60)
    throw new RangeError(
      "Finite buoyancy state and a time step in (0, 60] required.",
    );
  let y = s.y,
    v = s.v,
    remaining = h,
    grounded = false;
  const side = Math.cbrt(p.volume),
    mass = p.density * p.volume,
    bottom = SUPPORT_HEIGHT + side / 2,
    omega = Math.sqrt((p.fluid * g * side * side) / mass),
    acceleration = (yy, vv) => buoyancySample({ y: yy, v: vv }, p).a;
  // RK4 with a bound from both hydrostatic stiffness and drag relaxation.
  // Re-evaluate the bound as the velocity changes, including surface crossings.
  while (remaining > 1e-12) {
    const relaxation =
        (3 * Math.PI * FLUID_VISCOSITY * side +
          p.fluid * DRAG_COEFFICIENT * side * side * Math.abs(v)) /
        mass,
      dt = Math.min(
        remaining,
        0.003,
        0.12 / omega,
        0.12 / Math.max(relaxation, 1),
      ),
      a1 = acceleration(y, v),
      v2 = v + (a1 * dt) / 2,
      a2 = acceleration(y + (v * dt) / 2, v2),
      v3 = v + (a2 * dt) / 2,
      a3 = acceleration(y + (v2 * dt) / 2, v3),
      v4 = v + a3 * dt,
      a4 = acceleration(y + v3 * dt, v4);
    y += (dt * (v + 2 * v2 + 2 * v3 + v4)) / 6;
    v += (dt * (a1 + 2 * a2 + 2 * a3 + a4)) / 6;
    if (y <= bottom) {
      y = bottom;
      if (v < 0) v = 0;
      grounded = true;
    }
    remaining -= dt;
    // Exact continuation at static support avoids thousands of zero-motion steps.
    if (grounded && p.density >= p.fluid) break;
  }
  return {
    t: s.t + h,
    y,
    v,
    grounded: y <= bottom + 1e-10 && p.density >= p.fluid,
  };
}
