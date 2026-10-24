/** Shared vector construction and inverse pointer mapping, independent of DOM,
 * Three.js and animation. All display lengths share one fitted N→scene scale. */
import { vectorComponents } from "./curriculum-physics.js";
export const VECTOR_METHODS = ["triangle", "parallelogram", "components"];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const ease = (t) => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};
export function vectorLayout(p, method = "triangle") {
  const q = vectorComponents(p),
    xs = [0, p.a, q.x, ...(method === "parallelogram" ? [q.bx] : [])],
    lo = Math.min(...xs),
    hi = Math.max(...xs),
    scale = Math.min(6.3 / Math.max(6, hi - lo), 3.6 / Math.max(6, q.by)),
    origin = [(-(lo + hi) * scale) / 2, 0.8, 0];
  const point = (x, y) => [origin[0] + x * scale, origin[1] + y * scale, 0];
  return {
    ...q,
    scale,
    origin,
    a: point(p.a, 0),
    b: point(q.bx, q.by),
    result: point(q.x, q.by),
    point,
  };
}
export function vectorConstruction(p, method = "triangle", progress = 1) {
  const layout = vectorLayout(p, method),
    u = clamp(progress, 0, 1),
    aGrow = ease(u / 0.2),
    slide = ease((u - 0.2) / 0.35),
    rGrow = ease((u - 0.55) / 0.25),
    components = ease((u - 0.8) / 0.2),
    tail =
      method === "parallelogram" ? layout.origin : layout.point(p.a * slide, 0);
  return {
    layout,
    aGrow,
    slide,
    rGrow,
    components,
    bTail: tail,
    phase: u <= 0.2 ? 0 : u <= 0.55 ? 1 : u <= 0.8 ? 2 : 3,
  };
}
/** Freeze this layout during a drag: changing the fit under the pointer would
 * otherwise feed back into the parameter being edited. Numeric inputs retain
 * full precision; drag handles snap to 0.1 N and 1 degree. */
export function parametersFromVectorPoint(
  handle,
  point,
  layout,
  p,
  method = "triangle",
) {
  if (!point.every(Number.isFinite)) return null;
  const x = (point[0] - layout.origin[0]) / layout.scale,
    y = Math.max(0, (point[1] - layout.origin[1]) / layout.scale);
  if (handle === "a") return { a: Math.round(clamp(x, 0, 20) * 10) / 10 };
  const dx = x - (method === "parallelogram" ? 0 : p.a),
    magnitude = clamp(Math.hypot(dx, y), 0, 20),
    angle =
      magnitude < 1e-8
        ? p.angle
        : clamp((Math.atan2(y, dx) * 180) / Math.PI, 0, 180);
  return { b: Math.round(magnitude * 10) / 10, angle: Math.round(angle) };
}
export const VECTOR_PHASES = [
  [
    "Place vector A",
    "A begins at the origin and points along +x. Its arrow length represents its magnitude.",
  ],
  [
    "Translate vector B",
    "Slide B without changing its length or direction. Its tail meets the head of A.",
  ],
  [
    "Join the endpoints",
    "The resultant runs from the first tail to the final head: R = A + B.",
  ],
  [
    "Check the components",
    "Horizontal components add separately from vertical components. These give the same resultant.",
  ],
];
