// One illustrative AC cycle takes two display seconds. No physical source
// frequency or numerical flux is specified by this RMS transformer model.
export const TRANSFORMER_DISPLAY_PERIOD = 2;

export function transformerVisual(t) {
  const phase = 2 * Math.PI * t / TRANSFORMER_DISPLAY_PERIOD;
  const zero = value => Math.abs(value) < 1e-12 ? 0 : value;
  return { phase, voltage: zero(Math.sin(phase)), flux: zero(-Math.cos(phase)) };
}
