/** Exact constant-force / linear-drag solution in SI units. The phi functions
 * retain the zero-drag limit without subtracting enormous cancelling terms. */
export function linearMotion(p, t) {
  const force = p.mode ? p.mass * p.g : p.force, a0 = force / p.mass,
    z = -p.drag * t / p.mass;
  let phi1, phi2;
  if (Math.abs(z) < 1e-4) {
    phi1 = 1 + z * (1/2 + z * (1/6 + z * (1/24 + z/120)));
    phi2 = 1/2 + z * (1/6 + z * (1/24 + z * (1/120 + z/720)));
  } else {
    const em1 = Math.expm1(z);
    phi1 = em1 / z; phi2 = (em1-z)/(z*z);
  }
  const v = p.initial * Math.exp(z) + a0 * t * phi1,
    x = p.initial * t * phi1 + a0 * t * t * phi2;
  return { x, v, a: (force-p.drag*v)/p.mass, net: force-p.drag*v, applied: force };
}
export function motionTurningTime(p) {
  const force=p.mode?p.mass*p.g:p.force;
  if (p.initial*force>=0 || force===0) return null;
  const z=-p.initial*p.drag/force,base=-p.initial*p.mass/force;
  return z===0?base:!Number.isFinite(z)?Infinity:base*Math.log1p(z)/z;
}
