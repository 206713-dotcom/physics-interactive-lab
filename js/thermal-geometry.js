/** Read-only display transforms for the existing analytic thermal models.
 * Normalised particles are illustrations; they do not supply p, T or energy. */
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const THERMAL_CAMERA = { target: [0, 2.75, 0], radius: 13.4, polar: 1.33, azimuth: -0.17, fitAspect: 1.65 };
export const EXPANSION_MAGNIFICATION = 40;

export function convectionPosition(phase) {
  const angle = phase * 2 * Math.PI;
  return [-Math.cos(angle), Math.sin(angle)];
}

export function particleChamberWidth(volume) {
  // The illustrative chamber has fixed cross-section, so width is linear in volume.
  return 5.4 * volume / 0.05;
}

function reflectedCoordinate(value) {
  const cycle = ((value % 2) + 2) % 2;
  return 1 - Math.abs(cycle - 1);
}

export function chamberParticle(index, time, temperature, state) {
  const speed = Math.sqrt(temperature / 300);
  if (state === 0) return [
    0.14 + (index % 6) * 0.14 + 0.018 * Math.sin(time * 7 * speed + index),
    0.15 + Math.floor(index / 18) * 0.12 + 0.015 * Math.cos(time * 8 * speed + index),
    0.19 + (Math.floor(index / 6) % 3) * 0.31,
  ];
  const height = state === 1 ? 0.45 : 1;
  const pace = state === 1 ? speed * 0.18 : speed * 0.65;
  return [
    reflectedCoordinate(index * 0.681 + time * pace * Math.cos(index * 2.4)),
    height * reflectedCoordinate(index * 0.413 + time * pace * Math.sin(index * 1.7)),
    reflectedCoordinate(index * 0.789 + time * pace * Math.cos(index * 0.9)),
  ];
}

export const PARTICLE_CHAMBER = { height: 2.85, depth: 1.8, margin: 0.09 };

export function gasParticleCount(amount) {
  return Math.max(8, Math.min(144, Math.round(72 * amount)));
}

/** Analytic wall reflections. Scene velocity depends on temperature, never on
 * box size. The enlarged display particles do not supply the ideal-gas pressure. */
export function gasParticleMotion(index, time, temperature, volume) {
  const { height, depth, margin } = PARTICLE_CHAMBER;
  const dimensions = [particleChamberWidth(volume), height, depth];
  const direction = [Math.cos(index * 2.4 + 0.3), Math.sin(index * 1.7 + 0.6), Math.cos(index * 0.9 + 0.8)];
  const norm = Math.hypot(...direction), speed = 1.35 * Math.sqrt(temperature / 300);
  const velocity = [], position = [];
  let collision = { age: Infinity };
  dimensions.forEach((length, axis) => {
    const span = length - 2 * margin;
    const seed = ((index + 1) * [0.681, 0.413, 0.789][axis]) % 1;
    const v = speed * direction[axis] / norm, raw = seed * span + time * v;
    let segment = Math.floor(raw / span), remainder = ((raw % span) + span) % span;
    if (v < 0 && remainder < 1e-12) { segment--; remainder = span; }
    const odd = ((segment % 2) + 2) % 2;
    position.push(margin + (odd ? span - remainder : remainder));
    velocity.push(odd ? -v : v);
    const distance = v >= 0 ? remainder : (span - remainder) % span;
    const age = Math.abs(v) > 1e-12 ? distance / Math.abs(v) : Infinity;
    if (age < collision.age) {
      const boundary = v >= 0 ? segment : Math.ceil(raw / span);
      collision = { age, axis, side: ((boundary % 2) + 2) % 2 };
    }
  });
  collision.position = position.map((value, axis) => value - velocity[axis] * collision.age);
  return { position, velocity, speed, collision };
}

export function heatSlabGeometry(p) {
  return { length: 18 * p.thickness, side: 1.45 * Math.sqrt(p.area / 0.02) };
}

export function heatMarkerPhase(time, power) {
  // Qualitative, bounded energy-flow motion. Wattage remains a computed reading.
  return time * (0.05 + 0.24 * power / (power + 100));
}

export function radiationMarkerAmplitude(power) {
  return Math.min(1, Math.sqrt(Math.max(0, power) / 100));
}

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
