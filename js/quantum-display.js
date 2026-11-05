/** Display constructions only. Every measured quantity comes from the SI
 * model. Marker counts and transit times are explicitly schematic. */
import { samplePractical } from "./practical-physics.js";
const DEG = Math.PI / 180;

export function photoelectricDisplay(p) {
  const q = samplePractical("photoelectric", { t: 0 }, p), wavelength = 299792458 / p.frequency,
    band = wavelength < 380e-9 ? "Ultraviolet" : wavelength > 750e-9 ? "Infrared" : "Visible light";
  return { ...q, wavelength, band, shortfall: Math.max(0, p.work - q.photonEV),
    // Separate square-root flux scales keep the full parameter range legible.
    // These counts are not single-photon events or a sampling of a distribution.
    photonMarkers: Math.min(96, Math.max(1, Math.round(10 * Math.sqrt(q.photons / 1e12)))),
    electronMarkers: q.emission ? Math.min(192, Math.max(1, Math.round(18 * Math.sqrt(q.current / 1e-7)))) : 0,
    energyScale: 2.35 / 6.5 };
}

export function photoelectricMarkers(q, t, electron = false) {
  const count = electron ? q.electronMarkers : q.photonMarkers;
  return Array.from({ length: count }, (_, i) => {
    const u = ((t * (electron ? 0.55 : 0.8) + i / count) % 1 + 1) % 1;
    return electron
      ? [-2.37 + u * 4.84, 2.35 + ((i % 7) - 3) * 0.19, ((i * 3 % 5) - 2) * 0.15]
      : [-0.55 - 1.85 * u, 4.55 - 2.2 * u, ((i % 5) - 2) * 0.11];
  });
}

export function braggConstruction(p) {
  const q = samplePractical("bragg", { t: 0 }, p), spacingScale = 2.4e9,
    gap = p.spacing * spacingScale, top = [0, 2.75, 0.13], bottom = [0, 2.75 - gap, 0.13],
    argument = p.order * q.wavelength / (2 * p.spacing),
    result = { ...q, argument, spacingScale, gap, top, bottom,
      pathDifference: q.permitted ? p.order * q.wavelength : null,
      // The wavelength strip has its own fixed magnification, labelled in each view.
      wavelengthScale: 3e10, wavelengthDisplay: q.wavelength * 3e10,
      rays: [], wavefronts: [], extraPaths: [], incidentDirection: null, outgoingDirection: null };
  if (!q.permitted) return result;
  const a = q.angle * DEG, incoming = [Math.cos(a), -Math.sin(a), 0], outgoing = [Math.cos(a), Math.sin(a), 0],
    add = (v, d, length) => v.map((x, i) => x + d[i] * length),
    extra = gap * Math.sin(a), c = add(bottom, incoming, -extra), d = add(bottom, outgoing, extra),
    // Trim only the ends of the guides to fit the board, preserving true angles.
    length = Math.min(2.9 / Math.max(1e-12, Math.cos(a)), 1.85 / Math.max(1e-12, Math.sin(a)));
  return { ...result, incidentDirection: incoming, outgoingDirection: outgoing,
    rays: [top, bottom].map(hit => [add(hit, incoming, -length), hit, add(hit, outgoing, length)]),
    wavefronts: [[top, c], [top, d]], extraPaths: [[c, bottom], [bottom, d]] };
}

/** Matter-wave guide, not a wiggling electron track or a solved wavefunction.
 * Its fixed ruler makes wavelength changes visible; time is illustrative. */
export function matterWave(q, t) {
  return Array.from({ length: 481 }, (_, i) => {
    const x = -2.9 + i / 480 * 5.8;
    return [x, 0.62 + 0.16 * Math.sin(2 * Math.PI * (x + 2.9) / q.wavelengthDisplay - t * 2), 1.45];
  });
}
