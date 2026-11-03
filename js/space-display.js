// Display radius in scene units. Physical AU and orbital periods stay in the model.
export function solarDisplayRadius(au) {
  return 0.72 + 1.08 * Math.log1p(2 * au);
}

// Horizontal limits of the sunlit part of a Moon-disc scanline, as seen from Earth.
export function lunarLitInterval(halfWidth, phase) {
  const terminator = halfWidth * Math.cos(phase);
  return Math.sin(phase) >= 0 ? [terminator, halfWidth] : [-halfWidth, -terminator];
}
