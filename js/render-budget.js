/** Adaptive render quality for slower graphics hardware (integrated GPUs on
 * high-density screens). Feed it the time of every rendered frame; when the
 * average gap stays above the budget it lowers the pixel ratio one step.
 * It never raises quality again, so the picture does not flicker between sizes. */
export function createBudget({ start, floor = 1, step = 0.25, slowMs = 26, window = 40 }) {
  let ratio = Math.max(floor, start), sum = 0, count = 0, last = 0;
  return {
    get ratio() { return ratio; },
    /** @param {number} now performance.now() of this frame
     *  @returns {boolean} true when the ratio was lowered and the surface must resize */
    frame(now) {
      const gap = last ? now - last : 0;
      last = now;
      // Ignore the first frame and long pauses (hidden tab, paused model).
      if (gap <= 0 || gap > 250) return false;
      sum += gap;
      if (++count < window) return false;
      const mean = sum / count;
      sum = count = 0;
      if (mean <= slowMs || ratio <= floor) return false;
      ratio = Math.max(floor, +(ratio - step).toFixed(3));
      return true;
    },
    /** Forget the running average, for example after the view changes. */
    reset() { sum = count = last = 0; },
  };
}

/** Largest pixel ratio that keeps a w × h surface under a pixel budget. */
export function ratioForPixels(w, h, devicePixelRatio, maxPixels, cap = 2) {
  const fit = Math.sqrt(maxPixels / Math.max(1, w * h));
  return Math.max(0.5, Math.min(devicePixelRatio || 1, cap, fit));
}
