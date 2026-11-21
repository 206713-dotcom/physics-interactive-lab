/** Living backdrop for the home and topic pages: one small 2D scene per IGCSE
 * area. These are illustrations, not measurements. Kept deliberately cheap:
 * plain canvas 2D, no blur filters, capped pixel ratio and frame rate, and the
 * loop stops whenever the page is hidden or the backdrop is not on screen. */

import { createBudget, ratioForPixels } from "./render-budget.js";

const TAU = Math.PI * 2;
const CHALK = "232,241,246";

/** Triangle wave: a point bouncing between 0 and span without storing state. */
export function bounce(x, span) {
  const period = 2 * span, m = ((x % period) + period) % period;
  return m <= span ? m : period - m;
}

/** Repeatable pseudo-random number in [0, 1) so every visit looks the same. */
export function seeded(i, k = 0) {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Where the scene sits: right of the copy on wide screens, centred on phones. */
export function sceneFrame(w, h) {
  const wide = w >= 900;
  return {
    w, h, wide, ratio: 1,
    cx: wide ? w * 0.68 : w * 0.5,
    cy: wide ? h * 0.43 : h * 0.4,
    s: Math.max(120, Math.min(wide ? w * 0.44 : w * 0.8, h * 0.6)),
  };
}

/** Field line of two opposite point charges, traced from the positive one.
 * Returns points in units where the charges sit at (∓1, 0). */
export function dipoleLine(angle, { step = 0.035, limit = 900, reach = 3.6 } = {}) {
  let x = -1 + 0.09 * Math.cos(angle), y = 0.09 * Math.sin(angle);
  const points = [[x, y]];
  for (let i = 0; i < limit; i++) {
    const ax = x + 1, bx = x - 1,
      ra = Math.hypot(ax, y) ** 3, rb = Math.hypot(bx, y) ** 3,
      ex = ax / ra - bx / rb, ey = y / ra - y / rb, e = Math.hypot(ex, ey);
    if (!e) break;
    x += (ex / e) * step;
    y += (ey / e) * step;
    points.push([x, y]);
    if (Math.hypot(x - 1, y) < 0.09 || Math.hypot(x, y) > reach) break;
  }
  return points;
}

const sprites = new Map();
function sprite(color) {
  if (sprites.has(color)) return sprites.get(color);
  const c = document.createElement("canvas");
  c.width = c.height = 96;
  const g = c.getContext("2d"), fill = g.createRadialGradient(48, 48, 0, 48, 48, 48);
  fill.addColorStop(0, color);
  fill.addColorStop(0.25, color + "99");
  fill.addColorStop(1, color + "00");
  g.fillStyle = fill;
  g.fillRect(0, 0, 96, 96);
  sprites.set(color, c);
  return c;
}
function glow(ctx, x, y, r, color, alpha = 1) {
  const before = ctx.globalAlpha;
  ctx.globalAlpha = before * alpha;
  ctx.drawImage(sprite(color), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = before;
}
function dot(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
}
/** A layer drawn once and reused every frame (static stars, field lines). */
function layer(cache, f, draw) {
  if (cache.layer && cache.w === f.w && cache.h === f.h && cache.ratio === f.ratio) return cache.layer;
  const c = cache.layer || document.createElement("canvas"), g = c.getContext("2d");
  c.width = Math.round(f.w * f.ratio);
  c.height = Math.round(f.h * f.ratio);
  g.setTransform(f.ratio, 0, 0, f.ratio, 0, 0);
  draw(g);
  Object.assign(cache, { layer: c, w: f.w, h: f.h, ratio: f.ratio });
  return c;
}
const chalk = (a) => `rgba(${CHALK},${a})`;

const SCENES = [
  function motion(ctx, f, t, c) {
    const amplitude = 0.6, rate = 1.5, L = f.s * 0.72,
      px = f.cx, py = f.cy - f.s * 0.42,
      at = (time) => {
        const th = amplitude * Math.cos(rate * time);
        return [px + L * Math.sin(th), py + L * Math.cos(th), th];
      };
    ctx.lineCap = "round";
    ctx.strokeStyle = chalk(0.55);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px - f.s * 0.16, py);
    ctx.lineTo(px + f.s * 0.16, py);
    ctx.stroke();
    ctx.strokeStyle = chalk(0.16);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 7]);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, py + L * 1.08);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(px, py, L, Math.PI / 2 - amplitude - 0.1, Math.PI / 2 + amplitude + 0.1);
    ctx.stroke();
    for (let d = -30; d <= 30; d += 10) {
      const a = Math.PI / 2 - (d * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(px + (L + 8) * Math.cos(a), py + (L + 8) * Math.sin(a));
      ctx.lineTo(px + (L + (d % 30 ? 15 : 22)) * Math.cos(a), py + (L + (d % 30 ? 15 : 22)) * Math.sin(a));
      ctx.strokeStyle = chalk(0.3);
      ctx.stroke();
    }
    for (let k = 9; k >= 1; k--) {
      const [gx, gy] = at(t - k * 0.05);
      glow(ctx, gx, gy, f.s * 0.07, c, 0.32 * (1 - k / 10));
    }
    const [bx, by, th] = at(t);
    ctx.strokeStyle = chalk(0.7);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(bx, by);
    ctx.stroke();
    glow(ctx, bx, by, f.s * 0.13, c, 0.9);
    dot(ctx, bx, by, f.s * 0.034, "#f4fbff");
    dot(ctx, px, py, 4, chalk(0.8));
    // Velocity arrow along the tangent: longest through the middle, zero at the ends.
    const v = -amplitude * rate * Math.sin(rate * t), len = v * f.s * 0.19,
      tx = Math.cos(th), ty = -Math.sin(th);
    if (Math.abs(len) > 6) {
      const ex = bx + tx * len, ey = by + ty * len, sign = Math.sign(len);
      ctx.strokeStyle = "#ffcd84";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx + tx * f.s * 0.045 * sign, by + ty * f.s * 0.045 * sign);
      ctx.lineTo(ex, ey);
      ctx.moveTo(ex - (tx * 7 - ty * 4) * sign, ey - (ty * 7 + tx * 4) * sign);
      ctx.lineTo(ex, ey);
      ctx.lineTo(ex - (tx * 7 + ty * 4) * sign, ey - (ty * 7 - tx * 4) * sign);
      ctx.stroke();
    }
  },

  function thermal(ctx, f, t, c) {
    const base = ctx.globalAlpha;
    const bw = f.s * 1.05, bh = f.s * 0.68, x0 = f.cx - bw / 2, y0 = f.cy - bh / 2, pad = 8;
    ctx.strokeStyle = chalk(0.4);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x0, y0, bw, bh, 10);
    ctx.stroke();
    // Group the particles by colour so each colour is one path, not 64.
    const groups = { [c]: [], "#ffd9a8": [], "#8fd0ff": [] };
    for (let i = 0; i < 56; i++) {
      const speed = 0.25 + seeded(i, 1) * 0.75, dir = seeded(i, 2) * TAU,
        vx = Math.cos(dir) * speed * f.s * 0.5, vy = Math.sin(dir) * speed * f.s * 0.5,
        pos = (time) => [
          x0 + pad + bounce(seeded(i, 3) * bw + vx * time, bw - 2 * pad),
          y0 + pad + bounce(seeded(i, 4) * bh + vy * time, bh - 2 * pad),
        ];
      groups[speed > 0.7 ? c : speed > 0.45 ? "#ffd9a8" : "#8fd0ff"].push([...pos(t), ...pos(t - 0.07), 2 + speed * 1.6]);
    }
    ctx.lineCap = "round";
    ctx.lineWidth = 1.5;
    for (const [color, list] of Object.entries(groups)) {
      ctx.strokeStyle = ctx.fillStyle = color;
      ctx.globalAlpha = base * 0.4;
      ctx.beginPath();
      for (const [x, y, ox, oy] of list) {
        ctx.moveTo(ox, oy);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = base;
      ctx.beginPath();
      for (const [x, y, , , r] of list) {
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, TAU);
      }
      ctx.fill();
    }
    // One large speck jostled by the small ones: Brownian motion.
    const sx = f.cx + f.s * 0.2 * (Math.sin(t * 0.7) * 0.6 + Math.sin(t * 2.3 + 1) * 0.25 + Math.sin(t * 5.1) * 0.08),
      sy = f.cy + f.s * 0.13 * (Math.cos(t * 0.9) * 0.6 + Math.sin(t * 2.9 + 2) * 0.25 + Math.cos(t * 6.3) * 0.08);
    glow(ctx, sx, sy, f.s * 0.11, c, 0.7);
    dot(ctx, sx, sy, f.s * 0.026, "#fff3e6");
  },

  function waves(ctx, f, t, c) {
    const base = ctx.globalAlpha;
    const wavelength = f.s * 0.11, count = 8, span = wavelength * count,
      sources = [[f.cx - f.s * 0.2, f.cy], [f.cx + f.s * 0.2, f.cy]];
    ctx.lineWidth = 1.5;
    for (const [x, y] of sources) {
      for (let k = 0; k < count; k++) {
        const r = (t * f.s * 0.07 + k * wavelength) % span, fade = 1 - r / span;
        ctx.strokeStyle = c;
        ctx.globalAlpha = base * (0.55 * fade);
        ctx.beginPath();
        ctx.arc(x, y, r + 2, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = base;
      }
      glow(ctx, x, y, f.s * 0.06, c, 0.95);
      dot(ctx, x, y, 3.5, "#f1fffe");
    }
  },

  function electricity(ctx, f, t, c, cache) {
    const base = ctx.globalAlpha;
    const unit = f.s * 0.3;
    if (!cache.lines || cache.unit !== unit || cache.cx !== f.cx || cache.cy !== f.cy) {
      Object.assign(cache, { unit, cx: f.cx, cy: f.cy, layer: null });
      cache.lines = Array.from({ length: 16 }, (_, i) =>
        dipoleLine(((i + 0.5) / 16) * TAU).map(([x, y]) => [f.cx + x * unit, f.cy + y * unit]));
    }
    // The field lines never change, so they are painted once.
    ctx.drawImage(layer(cache, f, (g) => {
      g.strokeStyle = c;
      g.globalAlpha = 0.24;
      g.lineWidth = 1;
      for (const points of cache.lines) {
        g.beginPath();
        points.forEach(([x, y], n) => g[n ? "lineTo" : "moveTo"](x, y));
        g.stroke();
      }
    }), 0, 0, f.w, f.h);
    // Small markers drift from + to −: the direction a positive test charge is pushed.
    ctx.fillStyle = c;
    ctx.beginPath();
    for (const points of cache.lines) {
      const spacing = 46, travel = (t * 26) % spacing, stepPx = unit * 0.035;
      for (let d = travel; d < points.length * stepPx; d += spacing) {
        const [x, y] = points[Math.min(points.length - 1, Math.floor(d / stepPx))];
        ctx.moveTo(x + 1.8, y);
        ctx.arc(x, y, 1.8, 0, TAU);
      }
    }
    ctx.fill();
    ctx.globalAlpha = base;
    for (const [sign, color] of [[-1, "#ff9aa8"], [1, "#8fb6ff"]]) {
      const x = f.cx + sign * unit, r = f.s * 0.04;
      glow(ctx, x, f.cy, f.s * 0.13, color, 0.9);
      dot(ctx, x, f.cy, r, color);
      ctx.strokeStyle = "#0b1d2e";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.5, f.cy);
      ctx.lineTo(x + r * 0.5, f.cy);
      if (sign < 0) {
        ctx.moveTo(x, f.cy - r * 0.5);
        ctx.lineTo(x, f.cy + r * 0.5);
      }
      ctx.stroke();
    }
  },

  function nuclear(ctx, f, t, c) {
    const base = ctx.globalAlpha;
    const nx = f.cx - f.s * 0.5, ny = f.cy, period = 3.4;
    // Crosses: a magnetic field into the screen, which is why charged tracks bend.
    ctx.strokeStyle = chalk(0.13);
    ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 4; j++) {
        const x = f.cx - f.s * 0.18 + i * f.s * 0.13, y = f.cy - f.s * 0.3 + j * f.s * 0.2;
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 4);
        ctx.lineTo(x + 4, y + 4);
        ctx.moveTo(x + 4, y - 4);
        ctx.lineTo(x - 4, y + 4);
        ctx.stroke();
      }
    const tracks = [
      { label: "α", color: "#ffcd84", width: 4, length: 0.62, bend: -0.16, wobble: 0 },
      { label: "β", color: "#7fe3ee", width: 1.6, length: 0.92, bend: 0.34, wobble: 0 },
      { label: "γ", color: c, width: 1.4, length: 1.12, bend: 0, wobble: 4 },
    ];
    ctx.lineCap = "round";
    ctx.font = `600 ${Math.round(f.s * 0.05)}px Manrope, sans-serif`;
    tracks.forEach((track, j) => {
      const phase = (((t + j * 1.13) % period) + period) % period / period,
        progress = Math.min(1, phase * 1.9), fade = phase < 0.62 ? 1 : 1 - (phase - 0.62) / 0.38,
        point = (u) => [
          nx + f.s * 0.08 + u * track.length * f.s,
          ny + track.bend * u * u * f.s + Math.sin(u * 46) * track.wobble,
        ];
      ctx.globalAlpha = base * (fade);
      ctx.strokeStyle = track.color;
      ctx.lineWidth = track.width;
      ctx.beginPath();
      for (let n = 0; n <= 48; n++) {
        const [x, y] = point((n / 48) * progress);
        ctx[n ? "lineTo" : "moveTo"](x, y);
      }
      ctx.stroke();
      const [hx, hy] = point(progress);
      glow(ctx, hx, hy, f.s * 0.05, track.color, 0.9);
      ctx.fillStyle = track.color;
      ctx.fillText(track.label, hx + 10, hy - 8);
      ctx.globalAlpha = base;
    });
    glow(ctx, nx, ny, f.s * 0.2, c, 0.55);
    for (let i = 0; i < 14; i++) {
      const a = seeded(i, 5) * TAU, r = Math.sqrt(seeded(i, 6)) * f.s * 0.045,
        jitter = Math.sin(t * 3 + i) * 1.2;
      dot(ctx, nx + Math.cos(a) * r + jitter, ny + Math.sin(a) * r - jitter, f.s * 0.019,
        i % 2 ? "#ff9aa8" : "#b9c8dc");
    }
  },

  function space(ctx, f, t, c, cache) {
    const base = ctx.globalAlpha;
    ctx.drawImage(layer(cache, f, (g) => {
      for (let i = 0; i < 120; i++) {
        g.fillStyle = chalk(0.15 + seeded(i, 10) * 0.5);
        g.beginPath();
        g.arc(seeded(i, 7) * f.w, seeded(i, 8) * f.h, 0.4 + seeded(i, 9) * 1.1, 0, TAU);
        g.fill();
      }
    }), 0, 0, f.w, f.h);
    const sx = f.cx - f.s * 0.08, sy = f.cy, tilt = -0.3, squash = 0.36,
      planets = [[0.24, "#ffb48a", 3.2, 0.4], [0.42, "#7fe3ee", 4.6, 2.1], [0.64, c, 4, 4.4], [0.9, "#ffd9a8", 6, 1.2]];
    glow(ctx, sx, sy, f.s * 0.3, "#ffcd84", 0.85);
    dot(ctx, sx, sy, f.s * 0.05, "#fff1cf");
    for (const [a, color, size, start] of planets) {
      const rx = a * f.s, ry = rx * squash, angle = start + t * 0.42 * (0.24 / a) ** 1.5,
        at = (th) => {
          const x = rx * Math.cos(th), y = ry * Math.sin(th);
          return [sx + x * Math.cos(tilt) - y * Math.sin(tilt), sy + x * Math.sin(tilt) + y * Math.cos(tilt)];
        };
      ctx.strokeStyle = chalk(0.16);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(sx, sy, rx, ry, tilt, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = base * (0.6);
      ctx.beginPath();
      ctx.ellipse(sx, sy, rx, ry, tilt, angle - 0.55, angle);
      ctx.stroke();
      ctx.globalAlpha = base;
      const [x, y] = at(angle);
      glow(ctx, x, y, size * 4.5, color, 0.8);
      dot(ctx, x, y, size, color);
    }
  },
];

/** @param {HTMLCanvasElement} canvas @param {{accent:string}[]} topics */
export function createBackdrop(canvas, topics) {
  const ctx = canvas.getContext("2d"),
    still = () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    caches = SCENES.map(() => ({}));
  let frame = sceneFrame(1, 1), current = 0, previous = -1, changedAt = -1e9,
    raf = 0, running = false, last = 0, clock = 0, onChange = null,
    cycling = false, nextTurn = 0, shown = false;

  let budget = null, minGap = 30;
  function resize(keepBudget = false) {
    const w = innerWidth, h = innerHeight;
    // Cap the surface at about 1.5 million pixels: a full-screen canvas at a
    // 2× pixel ratio is the main cost on integrated graphics.
    if (!keepBudget || !budget)
      budget = createBudget({ start: ratioForPixels(w, h, devicePixelRatio, 1.5e6, 1.5), floor: 0.75, slowMs: 46, window: 45 });
    const ratio = budget.ratio;
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    frame = { ...sceneFrame(w, h), ratio };
    if (shown) paint();
  }
  function paint() {
    ctx.clearRect(0, 0, frame.w, frame.h);
    const mix = Math.min(1, (clock - changedAt) / 0.7);
    const layers = mix < 1 && previous >= 0 ? [[previous, 1 - mix], [current, mix]] : [[current, 1]];
    for (const [index, alpha] of layers) {
      ctx.save();
      ctx.globalAlpha = alpha;
      SCENES[index](ctx, frame, clock, topics[index].accent, caches[index]);
      ctx.restore();
    }
  }
  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (document.hidden) return void (last = 0);
    // About 30 frames a second is plenty for slow scenes and halves the work.
    if (last && now - last < minGap) return;
    if (minGap === 30 && budget.frame(now)) resize(true);
    clock += last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (cycling && clock >= nextTurn) show((current + 1) % SCENES.length);
    paint();
  }
  function show(index, { instant = false } = {}) {
    if (index === current && shown) return;
    previous = shown && !instant ? current : -1;
    current = index;
    changedAt = instant ? -1e9 : clock;
    nextTurn = clock + 9;
    shown = true;
    onChange?.(current);
    if (!running) paint();
  }
  addEventListener("resize", () => resize());
  resize();
  return {
    show,
    get current() { return current; },
    /** Auto-advance through the six scenes; a pinned scene stays put. */
    cycle(on) {
      cycling = on && !still();
      nextTurn = clock + 9;
    },
    onChange(listener) { onChange = listener; },
    /** Behind a page of text the scene is ambient: 20 frames a second is enough. */
    calm(on) {
      minGap = on ? 48 : 30;
      budget?.reset();
    },
    start() {
      shown = true;
      if (still()) {
        clock = 0.9;
        return paint();
      }
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
