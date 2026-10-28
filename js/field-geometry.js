/** Display/time windows for the existing nonrelativistic Lorentz model.
 * Every transform is uniform in x/y and fixed throughout a run. */
import { particlePosition } from "./practical-physics.js";
export const E_CHARGE = 1.602176634e-19;
export function chargedTiming(p) {
  const omega = -p.charge * E_CHARGE * p.field / p.mass,
    period = omega ? 2 * Math.PI / Math.abs(omega) : Infinity,
    duration = omega ? Math.min(4e-5, 2 * period) : 2e-8;
  return { omega, period, duration, rate: duration / (omega ? 8 : 4), step: duration / 1200, sampleEvery: duration / 360 };
}
export function chargedPosition(p, t) {
  return particlePosition({ speed: p.speed, omega: chargedTiming(p).omega }, t);
}
export function chargedLayout(p) {
  const timing = chargedTiming(p), points = Array.from({ length: 257 }, (_, i) => chargedPosition(p, timing.duration * i / 256)),
    xs = points.map((p) => p.x), ys = points.map((p) => p.y),
    minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys),
    scale = Math.min(6.6 / Math.max(maxX - minX, 1e-30), 3.4 / Math.max(maxY - minY, 1e-30));
  return {
    ...timing, scale, center: [(minX + maxX) / 2, (minY + maxY) / 2],
    point(t) { const q = chargedPosition(p, t); return [(q.x - (minX + maxX) / 2) * scale, 2.35 + (q.y - (minY + maxY) / 2) * scale, 0]; },
  };
}

/** A fixed 2 m sound window. Relative pressure is the existing source waveform
 * delayed by x/c. Parcel displacement has a schematic amplitude and the
 * pressure-compatible quarter-cycle phase; it never changes a parcel's x₀. */
export function soundLayout(p, t, x) {
  const speed = 331.3 * Math.sqrt((273.15 + p.temperature) / 273.15), wavelength = speed / p.frequency,
    scale = 3.45, phase = 2 * Math.PI * (p.frequency * t - x / wavelength),
    displayAmplitude = Math.min(0.2, wavelength * scale * 0.11) * p.amplitude;
  return { speed, wavelength, scale, phase, pressure: p.amplitude * Math.sin(phase),
    displacement: -displayAmplitude * Math.cos(phase), columns: Math.max(61, Math.ceil(2 / wavelength * 18) + 1) };
}
