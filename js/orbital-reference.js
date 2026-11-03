/** Analytic future Kepler conic from the same tangential release used by the
 * Verlet model. A reference guide, never an observed/integrated trail.
 * Stop at the surface, asymptote or a stated visual extent. */
import { G, centralRadius } from "./physics.js";
export function orbitalReference(p, segments = 480, maxDistance = p.distance * 6) {
  const mu = G * (p.centralMass + p.bodyMass),
    h = p.distance * p.velocity,
    l = h * h / mu,
    signedE = p.distance * p.velocity ** 2 / mu - 1,
    radius = centralRadius(p), points = [];
  if (!(l > 0)) return points;
  for (let i = 0; i <= segments; i++) {
    const angle = i / segments * Math.PI * 2,
      denominator = 1 + signedE * Math.cos(angle), r = l / denominator;
    if (!(denominator > 0) || r <= radius || r > maxDistance) break;
    points.push([r * Math.cos(angle), r * Math.sin(angle)]);
  }
  return points;
}

const displayReferences = new WeakMap();
export function orbitalDisplayReference(p) {
  if (displayReferences.has(p)) return displayReferences.get(p);
  const points = orbitalReference(p);
  // A closed guide can be framed from release. An open guide is clipped to
  // the growing observation extent so escape doesn't start at a tiny scale.
  const closed = points.length === 481;
  const radius = closed ? Math.max(...points.map(([x,y]) => Math.hypot(x,y))) : p.distance;
  const data = { points, closed, radius };
  displayReferences.set(p, data);
  return data;
}

export function orbitalDisplayExtent(p, state, trail = []) {
  let extent = orbitalDisplayReference(p).radius;
  for (const {x,y} of trail) extent = Math.max(extent, Math.hypot(x,y));
  return Math.max(extent, Math.hypot(state.x,state.y)) * 1.06;
}
