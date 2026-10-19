/** High-DPI Canvas views. All motion positions come from the numerical models. */
import { centralRadius } from "./physics.js";
const TAU = Math.PI * 2;
function line(c, x1, y1, x2, y2, color, width = 1) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function text(c, value, x, y, color = "#9bb9ca", size = 10, align = "left") {
  c.font = `${size}px Consolas,monospace`;
  c.fillStyle = color;
  c.textAlign = align;
  c.fillText(value, x, y);
}
function arrow(c, x, y, dx, dy, color) {
  const length = Math.hypot(dx, dy);
  if (length < 1) return;
  line(c, x, y, x + dx, y + dy, color, 2);
  const a = Math.atan2(dy, dx);
  c.beginPath();
  c.moveTo(x + dx, y + dy);
  c.lineTo(x + dx - 8 * Math.cos(a - 0.45), y + dy - 8 * Math.sin(a - 0.45));
  c.lineTo(x + dx - 8 * Math.cos(a + 0.45), y + dy - 8 * Math.sin(a + 0.45));
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
function setup(canvas) {
  const w = canvas.clientWidth,
    h = canvas.clientHeight,
    dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (
    canvas.width !== Math.round(w * dpr) ||
    canvas.height !== Math.round(h * dpr)
  ) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const c = canvas.getContext("2d");
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, w, h);
  c.fillStyle = "#10283e";
  c.fillRect(0, 0, w, h);
  for (let x = 20; x < w; x += 25)
    for (let y = 20; y < h; y += 25) {
      c.fillStyle = "#83b8c416";
      c.fillRect(x, y, 1, 1);
    }
  return { c, w, h };
}
export function drawSpring(canvas, lab) {
  const { c, w, h } = setup(canvas),
    { x, v } = lab.state,
    p = lab.params;
  const center = w * 0.55,
    scale = Math.min(w * 0.3, 210),
    y = h * 0.49,
    block = 48,
    bx = center + x * scale;
  c.setLineDash([4, 5]);
  line(c, center, 75, center, h - 58, "#7297ad5a");
  c.setLineDash([]);
  text(c, "EQUILIBRIUM", center, 68, "#6f93a7", 8, "center");
  const wall = w * 0.09;
  c.fillStyle = "#29465d";
  c.fillRect(wall - 10, y - 52, 10, 100);
  for (let i = -50; i < 49; i += 9)
    line(c, wall - 10, y + i, wall - 20, y + i + 10, "#55748a");
  c.beginPath();
  c.moveTo(wall, y);
  c.lineTo(wall + 15, y);
  const end = bx - block / 2 - 13,
    start = wall + 15;
  for (let i = 0; i <= 30; i++)
    c.lineTo(
      start + ((end - start) * i) / 30,
      y + (i === 0 || i === 30 ? 0 : i % 2 ? -13 : 13),
    );
  c.lineTo(bx - block / 2, y);
  c.strokeStyle = "#5dd7d6";
  c.lineWidth = 2.5;
  c.stroke();
  const gradient = c.createLinearGradient(bx - 24, y - 24, bx + 24, y + 24);
  gradient.addColorStop(0, "#7ce9e1");
  gradient.addColorStop(1, "#31aeb8");
  c.fillStyle = gradient;
  c.beginPath();
  c.roundRect(bx - 24, y - 24, block, block, 7);
  c.fill();
  text(c, `${p.mass.toFixed(1)} kg`, bx, y + 4, "#0a3541", 11, "center");
  line(c, wall - 10, y + 26, w - 25, y + 26, "#7394a460");
  if (lab.vectors) {
    arrow(c, bx, y - 39, v * 18, 0, "#ffc875");
    text(c, "v", bx, y - 49, "#ffc875", 10, "center");
  }
  const rulerY = h - 60;
  line(
    c,
    center - 0.8 * scale,
    rulerY,
    center + 0.8 * scale,
    rulerY,
    "#5c7c90",
  );
  for (let tick = -8; tick <= 8; tick += 2) {
    const px = center + (tick / 10) * scale;
    line(c, px, rulerY - 4, px, rulerY + 4, "#6a91a7");
    text(
      c,
      `${tick === 0 ? "0" : (tick / 10).toFixed(1)}`,
      px,
      rulerY + 18,
      "#9fb9c9",
      9,
      "center",
    );
  }
  c.fillStyle = "#6ce0dc";
  c.beginPath();
  c.arc(bx, rulerY, 4, 0, TAU);
  c.fill();
  text(c, "x / m", w - 24, rulerY + 18, "#9fb9c9", 9, "right");
  text(c, `x = ${x.toFixed(3)} m`, 24, 68, "#d1e6ef", 11);
}
export function drawOrbit(canvas, lab) {
  const { c, w, h } = setup(canvas),
    s = lab.state,
    p = lab.params;
  let extent = p.distance * 1.25;
  for (const pt of lab.trail)
    extent = Math.max(extent, Math.abs(pt.x) * 1.18, Math.abs(pt.y) * 1.18);
  extent = Math.max(extent, Math.abs(s.x) * 1.18, Math.abs(s.y) * 1.18);
  const scale = Math.min(w * 0.44, h * 0.36) / extent,
    cx = w / 2,
    cy = h * 0.51;
  const screen = (pt) => [cx + pt.x * scale, cy - pt.y * scale];
  c.setLineDash([2, 6]);
  for (const multiple of [1, 2, 3]) {
    const rr = p.distance * multiple * scale;
    c.beginPath();
    c.arc(cx, cy, rr, 0, TAU);
    c.strokeStyle = "#7197a526";
    c.stroke();
  }
  c.setLineDash([]);
  line(c, 25, cy, w - 25, cy, "#7591a016");
  line(c, cx, 45, cx, h - 25, "#7591a016");
  if (lab.showTrail && lab.trail.length > 1) {
    c.beginPath();
    lab.trail.forEach((pt, i) => {
      const [x, y] = screen(pt);
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    });
    c.strokeStyle = "#4fded4b0";
    c.lineWidth = 1.7;
    c.stroke();
  }
  const radius = centralRadius(p) * scale;
  const glow = c.createRadialGradient(
    cx,
    cy,
    0,
    cx,
    cy,
    Math.max(radius * 1.5, 1),
  );
  glow.addColorStop(0, "#54b7cc30");
  glow.addColorStop(1, "#54b7cc00");
  c.fillStyle = glow;
  c.beginPath();
  c.arc(cx, cy, radius * 1.5, 0, TAU);
  c.fill();
  const sphere = c.createRadialGradient(
    cx - radius * 0.35,
    cy - radius * 0.4,
    0,
    cx,
    cy,
    radius,
  );
  sphere.addColorStop(0, "#6bb4d0");
  sphere.addColorStop(0.6, "#327e9b");
  sphere.addColorStop(1, "#174563");
  c.fillStyle = sphere;
  c.beginPath();
  c.arc(cx, cy, radius, 0, TAU);
  c.fill();
  c.save();
  c.beginPath();
  c.arc(cx, cy, radius, 0, TAU);
  c.clip();
  c.strokeStyle = "#a0e0e326";
  c.lineWidth = 1;
  for (const f of [-0.5, 0, 0.5]) {
    c.beginPath();
    c.ellipse(cx, cy + f * radius, radius, radius * 0.2, -0.18, 0, TAU);
    c.stroke();
  }
  c.restore();
  const [sx, sy] = screen(s);
  c.setLineDash([3, 5]);
  line(c, cx, cy, sx, sy, "#bed4df32");
  c.setLineDash([]);
  if (lab.vectors) arrow(c, sx, sy, s.vx / 150, -s.vy / 150, "#ffcd83");
  c.shadowColor = "#7bfff1";
  c.shadowBlur = 12;
  c.fillStyle = s.collided ? "#ffb596" : "#b1fff0";
  c.beginPath();
  c.arc(sx, sy, 5, 0, TAU);
  c.fill();
  c.shadowBlur = 0;
  text(c, "M", cx, cy + 4, "#d6f3fa", 11, "center");
  text(c, "m", sx + 11, sy + 4, "#b6eae4", 11);
  const scaleMetres = 10 ** Math.floor(Math.log10(70 / scale)),
    scalePixels = scaleMetres * scale;
  line(c, w - 25 - scalePixels, h - 28, w - 25, h - 28, "#b7cdd9", 2);
  text(
    c,
    `${(scaleMetres / 1000).toLocaleString()} km`,
    w - 25,
    h - 37,
    "#b7cdd9",
    9,
    "right",
  );
}
