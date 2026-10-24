/** Crisp 2D companion to the spatial workbench; the same construction functions
 * determine all endpoints, coordinate scales and pointer inversions. */
import { vectorConstruction } from "./vector-geometry.js";
import { sampleCurriculum } from "./curriculum-physics.js";
const C = {
  a: "#64e8d1",
  b: "#ffc584",
  r: "#c3a6ff",
  component: "#89baff",
  grid: "#234252",
  text: "#d3e5ed",
};
export function vectorCanvasFrame(canvas, lab) {
  const width = canvas.clientWidth,
    height = canvas.clientHeight,
    construction = vectorConstruction(
      lab.params,
      lab.vectorMethod,
      lab.vectorProgress ?? 1,
    ),
    layout = lab.vectorDragLayout || construction.layout,
    zoom = Math.min((width - 54) / 9.2, (height - 62) / 6.3),
    center = [width / 2, height / 2 + 2],
    pixel = (p) => [center[0] + p[0] * zoom, center[1] - (p[1] - 2.65) * zoom];
  return {
    width,
    height,
    zoom,
    center,
    layout,
    construction,
    pixel,
    world: (x, y) => [(x - center[0]) / zoom, 2.65 - (y - center[1]) / zoom, 0],
  };
}
export function drawVectorDiagram(canvas, lab) {
  const f = vectorCanvasFrame(canvas, lab),
    dpr = Math.min(devicePixelRatio || 1, 2);
  if (
    canvas.width !== Math.round(f.width * dpr) ||
    canvas.height !== Math.round(f.height * dpr)
  ) {
    canvas.width = Math.round(f.width * dpr);
    canvas.height = Math.round(f.height * dpr);
  }
  const c = canvas.getContext("2d");
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const bg = c.createLinearGradient(0, 0, f.width, f.height);
  bg.addColorStop(0, "#071b2b");
  bg.addColorStop(1, "#102e40");
  c.fillStyle = bg;
  c.fillRect(0, 0, f.width, f.height);
  const p = lab.params,
    q = sampleCurriculum("vectors", lab.state, p),
    l = f.layout,
    point = (x, y) =>
      f.pixel([l.origin[0] + x * l.scale, l.origin[1] + y * l.scale, 0]),
    O = point(0, 0),
    A = point(p.a, 0),
    B = point(f.construction.layout.bx, f.construction.layout.by),
    R = point(q.x, q.y),
    u = f.construction,
    tail = point(lab.vectorMethod === "parallelogram" ? 0 : p.a * u.slide, 0),
    endB = tail.map(
      (v, i) =>
        v +
        [
          f.construction.layout.bx * l.scale * f.zoom,
          -f.construction.layout.by * l.scale * f.zoom,
        ][i],
    );
  const line = (a, b, color, width = 1, dash = []) => {
    c.beginPath();
    c.setLineDash(dash);
    c.moveTo(...a);
    c.lineTo(...b);
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
    c.setLineDash([]);
  };
  const label = (text, at, color = C.text) => {
    c.font = "600 14px Segoe UI,sans-serif";
    const w = c.measureText(text).width + 16;
    at = [
      Math.max(w / 2 + 7, Math.min(f.width - w / 2 - 7, at[0])),
      Math.max(16, Math.min(f.height - 16, at[1])),
    ];
    c.fillStyle = "#071b2bea";
    c.beginPath();
    c.roundRect(at[0] - w / 2, at[1] - 13, w, 26, 5);
    c.fill();
    c.fillStyle = color;
    c.textAlign = "center";
    c.fillText(text, at[0], at[1] + 5);
  };
  const arrow = (a, b, color, width = 4) => {
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.5) return;
    line(a, b, color, width);
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]),
      size = Math.min(12, Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.35);
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(...b);
    c.lineTo(
      b[0] - size * Math.cos(angle - 0.45),
      b[1] - size * Math.sin(angle - 0.45),
    );
    c.lineTo(
      b[0] - size * Math.cos(angle + 0.45),
      b[1] - size * Math.sin(angle + 0.45),
    );
    c.closePath();
    c.fill();
  };
  if (lab.vectorGrid !== false) {
    const step = l.scale < 0.3 ? 5 : 2;
    for (let n = -30; n <= 40; n += step) {
      const x = point(n, 0)[0];
      if (x > 20 && x < f.width - 20) {
        line([x, 24], [x, f.height - 25], C.grid);
        if (n % (step * 2) === 0) {
          c.fillStyle = "#799bac";
          c.font = "11px Segoe UI";
          c.textAlign = "center";
          c.fillText(n, x, O[1] + 19);
        }
      }
      const y = point(0, n)[1];
      if (y > 24 && y < f.height - 25) line([20, y], [f.width - 20, y], C.grid);
    }
  }
  line([22, O[1]], [f.width - 22, O[1]], "#6c899b");
  line([O[0], 24], [O[0], f.height - 25], "#6c899b");
  if (lab.vectorMethod === "parallelogram") {
    line(A, R, C.b, 2, [5, 6]);
    line(B, R, C.a, 2, [5, 6]);
  }
  if (
    (lab.vectorComponents !== false || lab.vectorMethod === "components") &&
    u.components > 0.01
  ) {
    line(O, [R[0], O[1]], C.component, 2, [4, 5]);
    line([R[0], O[1]], R, C.component, 2, [4, 5]);
    label(
      `Rₓ ${q.x.toFixed(1)} N`,
      [(O[0] + R[0]) / 2, O[1] + 42],
      C.component,
    );
    if (q.y > 1e-6)
      label(
        `Rᵧ ${q.y.toFixed(1)} N`,
        [R[0] + (R[0] > f.width * 0.65 ? -55 : 55), (R[1] + O[1]) / 2],
        C.component,
      );
  }
  arrow(
    O,
    O.map((v, i) => v + (R[i] - v) * u.rGrow),
    C.r,
    6,
  );
  arrow(
    O,
    O.map((v, i) => v + (A[i] - v) * u.aGrow),
    C.a,
    4,
  );
  if ((lab.vectorProgress ?? 1) > 0.2) arrow(tail, endB, C.b, 4);
  label(`A · ${p.a.toFixed(1)} N`, [(O[0] + A[0]) / 2, O[1] - 23], C.a);
  label(
    `B · ${p.b.toFixed(1)} N`,
    [
      (tail[0] + endB[0]) / 2 + 20,
      q.y < 1e-8 ? O[1] + 43 : (tail[1] + endB[1]) / 2 - 24,
    ],
    C.b,
  );
  label(
    `R · ${q.resultant.toFixed(2)} N`,
    [(O[0] + R[0]) / 2 - 30, (O[1] + R[1]) / 2 - (q.y < 1e-6 ? 65 : 25)],
    C.r,
  );
  if (lab.vectorAngle !== false && p.b > 0 && p.angle > 0) {
    const r = 30;
    c.strokeStyle = C.b;
    c.beginPath();
    c.arc(tail[0], tail[1], r, (-p.angle * Math.PI) / 180, 0);
    c.stroke();
    label(
      p.angle.toFixed(0) + "°",
      [
        tail[0] + 45 * Math.cos((p.angle * Math.PI) / 360),
        tail[1] - 45 * Math.sin((p.angle * Math.PI) / 360),
      ],
      C.b,
    );
  }
  if ((lab.vectorProgress ?? 1) >= 1)
    for (const [tip, col] of [
      [A, C.a],
      [lab.vectorMethod === "parallelogram" ? B : R, C.b],
    ]) {
      c.beginPath();
      c.arc(...tip, 7, 0, Math.PI * 2);
      c.strokeStyle = col;
      c.lineWidth = 2;
      c.stroke();
    }
  label("+x / N", [f.width - 49, O[1] + 23], "#90afbe");
}
