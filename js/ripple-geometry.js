// Coordinates on the same schematic water surface for the 2D and 3D views.
export const RIPPLE_HALF_LENGTH = 4;
export const RIPPLE_HALF_WIDTH = 3.25;

export function rippleFronts(wavelength, travel, gap, reflected) {
  const phase = travel % wavelength;
  const spread = Math.asin(Math.min(1, wavelength / gap));
  const fronts = [];
  const halfLength = RIPPLE_HALF_LENGTH;
  const halfWidth = RIPPLE_HALF_WIDTH;
  for (let n = Math.ceil((-halfLength - phase) / wavelength); ; n++) {
    const distance = phase + n * wavelength;
    if (distance > halfLength) break;
    if (distance <= 0 || reflected) {
      const x = -Math.abs(distance);
      fronts.push({ kind: distance <= 0 ? 0 : 1, points: [[x, -halfWidth], [x, halfWidth]] });
    } else {
      // A flat middle section joins the two circular edges of a finite gap.
      const limit = Math.min(spread, Math.asin(Math.min(1, (halfWidth - gap / 2) / distance)));
      const edge = sign => Array.from({ length: 15 }, (_, i) => {
        const angle = limit * (sign < 0 ? 1 - i / 14 : i / 14);
        return [distance * Math.cos(angle), sign * (gap / 2 + distance * Math.sin(angle))];
      });
      fronts.push({ kind: 1, points: [...edge(-1), ...edge(1)] });
    }
  }
  return fronts;
}
