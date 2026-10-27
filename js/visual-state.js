/** Fixed-step interpolation affects only drawing. Readouts, histories, exports
 * and pause/step continue to use the exact integrated state. Event/count fields
 * stay discrete. Arrays are copied only for the integrated multi-body states. */
const continuous = new Set([
  "t",
  "x",
  "y",
  "x1",
  "x2",
  "v1",
  "v2",
  "vx",
  "vy",
  "v",
  "a",
  "theta",
  "theta1",
  "theta2",
  "omega",
  "omega1",
  "omega2",
  "q",
  "i",
  "temperature",
  "input",
  "loss",
]);
export function visualState(previous, current, fraction) {
  const a = Math.max(0, Math.min(1, fraction));
  if (
    !previous ||
    ["collided", "collisionCount", "hit", "landed", "grounded"].some(
      (k) => previous[k] !== current[k],
    )
  )
    return current;
  const out = { ...current };
  for (const key of continuous)
    if (Number.isFinite(previous[key]) && Number.isFinite(current[key]))
      out[key] = previous[key] + a * (current[key] - previous[key]);
  if (
    Array.isArray(current.bodies) &&
    previous.bodies?.length === current.bodies.length
  )
    out.bodies = current.bodies.map((b, i) =>
      visualState(previous.bodies[i], b, a),
    );
  if (current.twin && previous.twin)
    out.twin = visualState(previous.twin, current.twin, a);
  return out;
}
