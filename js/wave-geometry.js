/** Positions in metres, shared by both diagram views. The moving guide follows
 * two incident-wave crests; particles of the medium retain their fixed x. */
export function waveMeasurement(p,t) {
  const first=((p.wavelength/4+p.speed*t)%p.wavelength+p.wavelength)%p.wavelength;
  return {first,second:first+p.wavelength,amplitude:p.amplitude};
}
