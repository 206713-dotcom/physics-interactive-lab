/** Direct manipulation for the 2D diagrams: grab the thing itself instead of
 * a slider. Each entry mirrors the layout its diagram is drawn with and turns
 * a pointer position back into model parameters. The model, its limits and
 * the sliders stay the single source of truth; a handle is only another way
 * to set the same numbers. */

import { sampleCurriculum } from "./curriculum-physics.js";

const DEG = Math.PI / 180;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** The curriculum diagrams draw in a virtual 840 × 470 space, centred. */
export function diagramTransform(w, h) {
  const scale = Math.min(w / 840, h / 470);
  return { scale, ox: (w - 840 * scale) / 2, oy: (h - 470 * scale) / 2 };
}
const toCanvas = (t, [x, y]) => [t.ox + x * t.scale, t.oy + y * t.scale];
const toDiagram = (t, x, y) => [(x - t.ox) / t.scale, (y - t.oy) / t.scale];

/** Geometry of the moments beam, identical to the diagram's own numbers. */
export function momentsLayout(lab) {
  const intro = lab.studyMode === "igcse";
  return { pivot: intro ? 420 : 300, sc: intro ? 180 : 125, py: intro ? 185 : 207, theta: lab.state.theta || 0 };
}
/** Signed distance along the beam (metres, right positive) under a pointer. */
export function beamDistance(layout, vx, vy) {
  return ((vx - layout.pivot) * Math.cos(layout.theta) - (vy - layout.py) * Math.sin(layout.theta)) / layout.sc;
}
/** Angle of incidence in degrees for a pointer above a boundary point. */
export function incidenceAngle(x, y, px, py) {
  return Math.atan2(Math.abs(x - px), Math.max(1e-6, y - py)) / DEG;
}

/** Length the pendulum is drawn with. Normally a fixed 180 units; while the
 * bob is held it follows the real length so the bob stays under the pointer. */
export function pendulumDrawLength(lab) {
  return lab.heldPendulumScale ? clamp(lab.params.length * lab.heldPendulumScale, 50, 245) : 180;
}

const LABS = {
  pendulum(lab, w, h) {
    // Mirrors drawOscillation: a 900 × 520 space (620 wide and shifted on phones).
    const compact = w < 600, wide = compact ? 620 : 900, scale = Math.min(w / wide, h / 520),
      px = (w - wide * scale) / 2 + (compact ? 310 : 450) * scale, py = (h - 520 * scale) / 2 + 268 * scale,
      perMetre = lab.heldPendulumScale ?? 180 / lab.params.length,
      length = pendulumDrawLength(lab) * scale, theta = lab.state.theta || 0;
    return [{
      id: "bob", at: [px + length * Math.sin(theta), py + length * Math.cos(theta)], hint: "Pull the bob: angle and length",
      cursor: "grab", hold: { heldPendulumScale: perMetre },
      drag: (x, y) => ({ angle: Math.atan2(x - px, Math.max(1e-6, y - py)) / DEG, length: Math.hypot(x - px, y - py) / scale / perMetre }),
    }];
  },
  moments(lab, w, h) {
    const t = diagramTransform(w, h), L = momentsLayout(lab), p = lab.params,
      at = (d) => toCanvas(t, [L.pivot + d * L.sc * Math.cos(L.theta), L.py - d * L.sc * Math.sin(L.theta)]),
      along = (x, y) => beamDistance(L, ...toDiagram(t, x, y));
    return [
      { id: "left-mass", at: at(-p.d1), hint: "Drag along the beam", cursor: "ew-resize",
        drag: (x, y) => ({ d1: -along(x, y) }) },
      { id: "right-mass", at: at(p.d2), hint: "Drag along the beam", cursor: "ew-resize",
        drag: (x, y) => ({ d2: along(x, y) }) },
    ];
  },
  lenses(lab, w, h) {
    const t = diagramTransform(w, h), p = lab.params, cx = 420, axis = 245,
      image = sampleCurriculum("lenses", lab.state, p).image,
      // Same fit as the diagram. It is held for the length of a drag so the
      // object stays under the pointer instead of the picture rescaling.
      sc = lab.heldScale ?? 310 / Math.max(p.object, p.focal * 2, Math.min(Math.abs(image || 0), 2)),
      tip = [cx - p.object * sc, axis - Math.min(95, p.height * sc)];
    return [{
      id: "object", at: toCanvas(t, tip), hint: "Drag the object", cursor: "move", hold: { heldScale: sc },
      drag(x, y) {
        const [vx, vy] = toDiagram(t, x, y);
        return { object: (cx - vx) / sc, height: (axis - vy) / sc };
      },
    }];
  },
  refraction(lab, w, h) {
    const x = w / 2, y = h * 0.5, L = Math.min(w * 0.3, h * 0.34), i = lab.params.angle * DEG;
    return [{
      id: "incident-ray", at: [x - L * Math.sin(i), y - L * Math.cos(i)], hint: "Swing the ray", cursor: "grab",
      drag: (px, py) => ({ angle: incidenceAngle(x, y, px, py) }),
    }];
  },
  fields(lab, w, h) {
    const sc = Math.min((w - 65) / 10, (h - 75) / 7), cx = w / 2, cy = h / 2, half = lab.params.separation / 2,
      drag = (px) => ({ separation: (2 * Math.abs(px - cx)) / sc });
    return [
      { id: "charge-a", at: [cx - half * sc, cy], hint: "Drag the charges apart", cursor: "ew-resize", drag },
      { id: "charge-b", at: [cx + half * sc, cy], hint: "Drag the charges apart", cursor: "ew-resize", drag },
    ];
  },
};

export const hasHandles = (type) => Object.hasOwn(LABS, type);
/** Flat experiments whose 3D bench added clutter rather than insight. They
 * open in the diagram; the 3D view is still one click away. */
const DIAGRAM_FIRST = new Set(["pendulum", "measurement", "motion", "hooke", "collisions", "waves", "mirror",
  "dispersion", "spectrum", "dc", "sensors", "devices", "rectifier"]);
export const opensInDiagram = (type) => hasHandles(type) || DIAGRAM_FIRST.has(type);
/** Handles for the current state, in CSS pixels of the diagram canvas. */
export function handlesFor(lab, w, h) {
  return hasHandles(lab.type) ? LABS[lab.type](lab, w, h) : [];
}
export function handleAt(handles, x, y, reach = 30) {
  let best = null, distance = reach;
  for (const handle of handles) {
    const d = Math.hypot(handle.at[0] - x, handle.at[1] - y);
    if (d <= distance) [best, distance] = [handle, d];
  }
  return best;
}
/** Step used while dragging. Controls that accept any number get a tidy
 * step from their range, e.g. 0.05 m for a 0.1 to 1.5 m distance. */
export function controlStep(control) {
  const step = Number(control.step);
  if (Number.isFinite(step) && step > 0) return step;
  const range = control.max - control.min;
  return 10 ** Math.floor(Math.log10(range)) / (range >= 100 ? 100 : 20);
}
/** Keep a dragged value inside its control's range and on its step. */
export function snapToControl(value, control) {
  const factor = control.factor || 1, step = controlStep(control),
    shown = clamp(Math.round(value / factor / step) * step, control.min, control.max);
  return Number(shown.toFixed(6)) * factor;
}

/** Draw the grab rings over a finished diagram. */
export function drawHandles(canvas, handles, { active = null, hover = null, time = 0, still = false } = {}) {
  if (!handles.length) return;
  const c = canvas.getContext("2d"), ratio = canvas.width / canvas.clientWidth;
  c.save();
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  handles.forEach((handle, n) => {
    const [x, y] = handle.at, on = handle.id === active || handle.id === hover,
      pulse = still || on ? 0 : (Math.sin(time * 3 + n * 1.3) + 1) / 2;
    c.beginPath();
    c.arc(x, y, 17 + pulse * 5, 0, Math.PI * 2);
    c.fillStyle = on ? "rgba(8,125,121,0.20)" : "rgba(8,125,121,0.08)";
    c.fill();
    c.lineWidth = on ? 3 : 2;
    c.strokeStyle = `rgba(8,125,121,${on ? 1 : 0.85 - pulse * 0.45})`;
    c.setLineDash(on ? [] : [5, 4]);
    c.stroke();
    c.setLineDash([]);
  });
  // One short prompt beside the first handle until something has been dragged.
  if (!active && handles[0].hint && handles.prompt !== false) {
    const [x, y] = handles[0].at, label = "✋ " + handles[0].hint;
    c.font = "600 13px Manrope, Segoe UI, sans-serif";
    const width = c.measureText(label).width + 20, left = clamp(x - width / 2, 8, canvas.clientWidth - width - 8),
      // High enough to clear a value label sitting just above the part.
      top = y - 92 > 8 ? y - 92 : y + 34;
    c.fillStyle = "#0c5f63";
    c.beginPath();
    c.roundRect(left, top, width, 26, 13);
    c.fill();
    c.fillStyle = "#fff";
    c.textAlign = "left";
    c.textBaseline = "middle";
    c.fillText(label, left + 10, top + 13.5);
  }
  c.restore();
}
