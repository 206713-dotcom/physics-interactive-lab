/** Read-only display transforms for the existing analytic thermal models.
 * Normalised particles are illustrations; they do not supply p, T or energy. */
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const THERMAL_CAMERA = { target: [0, 2.75, 0], radius: 13.4, polar: 1.33, azimuth: -0.17, fitAspect: 1.65 };

export function phaseInventory(p, q) {
  if (p.mode) return { solid: 1, liquid: 0, vapour: 0, name: "Single-phase sample" };
  const solid = 1 - clamp(q.melt, 0, 1), vapour = clamp(q.boil, 0, 1), liquid = 1 - solid - vapour;
  const name = solid === 1 ? "Warming ice" : solid > 0 ? "Melting at 0 °C"
    : vapour === 1 ? "Warming steam" : vapour > 0 ? "Boiling at 100 °C" : "Warming liquid water";
  return { solid, liquid, vapour, name };
}

export function heatingWindow(p) {
  // Water: follow ice/liquid/steam up to 120 °C. Custom sample: stop at 200 °C.
  const specific = p.mode ? (200 - p.initial) * p.capacity
    : Math.max(0, -p.initial) * 2100 + (p.initial > 0 ? 0 : 334000)
      + (100 - Math.max(0, p.initial)) * 4200 + 2260000 + 20 * 2000;
  return p.mass * specific / p.power;
}

export function temperatureHeight(celsius, low = -30, high = 200, bottom = 0.65, length = 3.55) {
  return bottom + clamp((celsius - low) / (high - low), 0, 1) * length;
}

export function gasHeight(q) { return 1.25 * q.ratio; }

export function gasPressureScale(p) {
  const initial = p.amount * 8.314462618 * p.initial / p.volume,
    final = p.mode === 1 ? initial : initial / p.ratio ** (p.mode === 2 ? 5/3 : 1),
    target = Math.max(initial,final)*1.1, decade=10**Math.floor(Math.log10(target));
  return Math.ceil(target/decade*2)/2*decade;
}

/** Analytic billiard chords inside a unit disk, plus reflected axial motion.
 * The paths stay inside the piston at every volume. Rescaling the axial path
 * as the piston moves is a teaching illustration, not a moving-wall solver. */
export function cylinderParcel(index, phase) {
  const angle = index * 2.3999632297, step = 1.7 + (index % 9) * 0.115,
    distance = phase * (0.7 + (index % 7) * 0.09) + index * 0.713,
    chord = Math.floor(distance), u = distance - chord,
    a = angle + chord * step, b = a + step,
    axial = ((phase * (0.57 + index % 5 * 0.08) + index * 0.371) % 2 + 2) % 2;
  return { x: (1-u) * Math.cos(a) + u * Math.cos(b), z: (1-u) * Math.sin(a) + u * Math.sin(b), y: axial <= 1 ? axial : 2 - axial };
}

export function gasParcelPosition(index, q, phase) {
  const a = cylinderParcel(index, phase), h = gasHeight(q), radius = 1.08, margin = 0.09;
  return [-1.55 + radius * a.x, 0.5 + margin + a.y * (h - 2 * margin), radius * a.z];
}

export function coolingFraction(p, q) { return clamp((q.temperature - p.ambient) / (p.initial - p.ambient), 0, 1); }
export function coolingClock(p) { return p.mass * p.specific / p.conductance; }

/** Fixed reference for all three signed energy bars; no auto-ranging per frame. */
export function gasEnergyScale(p) {
  const r = p.ratio, nR = p.amount * 8.314462618, gamma = 5/3,
    temperature = p.mode === 0 ? p.initial : p.mode === 1 ? p.initial * r : p.initial * r ** (1-gamma),
    internal = 1.5 * nR * (temperature-p.initial),
    work = p.mode === 0 ? nR*p.initial*Math.log(r) : p.mode === 1 ? nR*p.initial*(r-1) : -internal;
  return Math.max(Math.abs(internal+work), Math.abs(work), Math.abs(internal), 1);
}
