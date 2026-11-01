/** A paper-style scientific diagram. Geometry and arrows read the same SI
 * state as the 3D scene. HTML instruments supply camera-independent readings. */
import {
  springReadings,
  pendulumReadings,
  smallAngleReference,
  oscillationScales,
} from "./oscillation-physics.js";
export function drawOscillation(canvas, lab) {
  const width = canvas.clientWidth,
    height = canvas.clientHeight,
    dpr = Math.min(devicePixelRatio || 1, 2);
  if (
    canvas.width !== Math.round(width * dpr) ||
    canvas.height !== Math.round(height * dpr)
  ) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  const c = canvas.getContext("2d");
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const bg = c.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#f7fbfd");
  bg.addColorStop(1, "#e7f0f5");
  c.fillStyle = bg;
  c.fillRect(0, 0, width, height);
  c.strokeStyle = "#bdceda30";
  c.lineWidth = 1;
  for (let x = 0; x < width; x += 28) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, height);
    c.stroke();
  }
  for (let y = 0; y < height; y += 28) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(width, y);
    c.stroke();
  }
  const compact = width < 600,
    virtualWidth = compact ? 620 : 900,
    scale = Math.min(width / virtualWidth, height / 520);
  c.translate((width - virtualWidth * scale) / 2, (height - 520 * scale) / 2);
  c.scale(scale, scale);
  c.lineCap = c.lineJoin = "round";
  const gold = "#ad7729",
    cyan = "#138d88",
    purple = "#8c64b9",
    red = "#c96d58",
    blue = "#487eac",
    ink = "#244e64",
    muted = "#7c9aaa",
    p = lab.params,
    s = lab.state,
    spring = lab.type === "spring",
    q = spring ? springReadings(s, p) : pendulumReadings(s, p),
    scales = oscillationScales(lab.type, p),
    motion = spring
      ? lab.oscillationVectors === "motion"
      : lab.oscillationVectors !== "forces";
  const text = (t, x, y, col = ink, size = 17, align = "left") => {
      c.fillStyle = col;
      c.font = `500 ${Math.max(size, compact ? 19 : 0)}px Manrope,Segoe UI,sans-serif`;
      c.textAlign = align;
      c.fillText(t, x, y);
    },
    line = (points, col = muted, lw = 2, dash = []) => {
      if (!points.length) return;
      c.beginPath();
      c.setLineDash(dash);
      points.forEach((v, i) => (i ? c.lineTo(...v) : c.moveTo(...v)));
      c.strokeStyle = col;
      c.lineWidth = lw;
      c.stroke();
      c.setLineDash([]);
    },
    disc = (x, y, r, fill, stroke = null) => {
      c.beginPath();
      c.arc(x, y, r, 0, 2 * Math.PI);
      if (fill) {
        c.fillStyle = fill;
        c.fill();
      }
      if (stroke) {
        c.strokeStyle = stroke;
        c.lineWidth = 2;
        c.stroke();
      }
    },
    rounded = (x, y, w, h, fill, r = 7) => {
      c.beginPath();
      c.roundRect(x, y, w, h, r);
      c.fillStyle = fill;
      c.fill();
    },
    arrow = (at, v, col) => {
      const len = Math.hypot(...v);
      if (len < 0.3) return;
      const end = at.map((x, i) => x + v[i]),
        a = Math.atan2(v[1], v[0]),
        head = Math.min(10, len * 0.32);
      line([at, end], col, 3);
      line(
        [
          [
            end[0] - head * Math.cos(a - 0.4),
            end[1] - head * Math.sin(a - 0.4),
          ],
          end,
          [
            end[0] - head * Math.cos(a + 0.4),
            end[1] - head * Math.sin(a + 0.4),
          ],
        ],
        col,
        3,
      );
    };
  if (!lab.cleanPresentation)
    text(spring ? "MASS–SPRING BENCH" : "NONLINEAR PENDULUM", 40, 45, ink, 22);
  if (spring) {
    const origin = compact ? 350 : 500,
      metres = compact ? 200 : 230,
      x = origin + s.x * metres,
      y = 338;
    // The display cart is illustrative; displacement uses the metre ruler.
    c.fillStyle = "#a5bfce35";
    c.beginPath();
    c.ellipse(
      compact ? 310 : 449,
      407,
      compact ? 275 : 367,
      15,
      0,
      0,
      Math.PI * 2,
    );
    c.fill();
    rounded(compact ? 35 : 65, 380, compact ? 550 : 770, 17, "#b8ceda");
    rounded(compact ? 35 : 65, 380, compact ? 550 : 770, 7, "#f9fdff", 3);
    for (const xx of compact ? [75, 540] : [103, 794])
      rounded(xx, 397, 22, 15, "#7d9daa", 3);
    rounded(compact ? 45 : 78, 277, 15, 103, "#365e74", 4);
    rounded(compact ? 44 : 77, 276, 18, 5, "#88aebf", 3);
    for (const yy of [293, 366]) disc(compact ? 52 : 85, yy, 3, "#acc5d0");
    const coilStart = compact ? 78 : 116;
    const springPath = [
      [compact ? 63 : 96, y],
      [coilStart, y],
      ...Array.from({ length: 121 }, (_, i) => [
        coilStart + ((x - 36 - coilStart) * i) / 120,
        y + Math.sin((i / 120) * 12 * Math.PI) * 16,
      ]),
      [x - 33, y],
    ];
    line(springPath, "#39697a", 4);
    line(springPath, "#94bcbf", 1.6);
    const body = c.createLinearGradient(x - 35, y - 30, x + 35, y + 25);
    body.addColorStop(0, "#7dd2c4");
    body.addColorStop(0.55, "#359a98");
    body.addColorStop(1, "#236d7a");
    c.save();
    c.shadowColor = "#2b617332";
    c.shadowBlur = 15;
    c.shadowOffsetY = 7;
    rounded(x - 34, y - 29, 68, 55, body, 8);
    c.restore();
    rounded(x - 34, y - 29, 68, 7, "#9be0d0", 4);
    rounded(x - 23, y - 36, 46, 7, "#c8ae80", 3);
    for (const xx of [x - 21, x + 21]) {
      disc(xx, y + 33, 10, "#31566d");
      disc(xx, y + 33, 5, "#a8c4d1");
      const a = (x - origin) / 10;
      line(
        [
          [xx - 6 * Math.cos(a), y + 33 - 6 * Math.sin(a)],
          [xx + 6 * Math.cos(a), y + 33 + 6 * Math.sin(a)],
        ],
        "#d3e4ec",
        1,
      );
    }
    text(`${p.mass.toFixed(1)} kg`, x, y + 5, "#e8fcf6", 15, "center");
    line(
      [
        [origin, 310],
        [origin, 451],
      ],
      "#9ba9c4",
      1,
      [4, 6],
    );
    for (let i = -4; i <= 4; i++) {
      const xx = origin + i * 0.2 * metres;
      line(
        [
          [xx, 418],
          [xx, 431],
        ],
        muted,
        1,
      );
      text(`${Number((i * 0.2).toFixed(1))}`, xx, 451, muted, 16, "center");
    }
    text("x / m", compact ? 590 : 813, 451, muted, 16, "right");
    const values = motion
        ? [s.v * scales.velocity, q.a * scales.acceleration]
        : [
            q.restoring * scales.force,
            q.damping * scales.force,
            q.net * scales.force,
          ],
      colors = motion ? [gold, purple] : [cyan, red, purple],
      names = motion
        ? ["Velocity  v", "Acceleration  a"]
        : ["Spring  −kx", "Damping  −bv", "Resultant  F"];
    if (lab.vectors !== false)
      values.forEach((v, i) => {
        arrow([x, 171 + i * 55], [v * 85, 0], colors[i]);
        text(names[i], compact ? 25 : 65, 177 + i * 55, colors[i], 17);
      });
  } else {
    c.save();
    if (compact) c.translate(-140, 0);
    // The complete ±120° envelope fits below the instrument strip. Both axes
    // and the actual trail use the same physical length-to-pixel scale.
    const pivot = [450, 268],
      length = 180,
      pt = (a) => [
        pivot[0] + length * Math.sin(a),
        pivot[1] + length * Math.cos(a),
      ],
      at = pt(s.theta);
    c.fillStyle = "#a5bfce35";
    c.beginPath();
    c.ellipse(450, 473, 265, 15, 0, 0, 2 * Math.PI);
    c.fill();
    rounded(194, 461, 512, 10, "#9fbac9", 4);
    for (const xx of [210, 690]) {
      rounded(xx - 5, 172, 10, 290, "#86a5b5", 4);
      rounded(xx - 28, 457, 56, 8, "#50788e", 3);
    }
    rounded(207, 169, 486, 9, "#52798e", 4);
    line([[450, 179], pivot], "#759baa", 3);
    line([pivot, [pivot[0], pivot[1] + length]], "#a9bdc8", 1, [4, 6]);
    line(
      Array.from({ length: 121 }, (_, i) => {
        const a = ((-120 + i * 2) * Math.PI) / 180;
        return [pivot[0] + 194 * Math.sin(a), pivot[1] + 194 * Math.cos(a)];
      }),
      "#b5cbd6",
      1.4,
    );
    for (let deg = -120; deg <= 120; deg += 10) {
      const a = (deg * Math.PI) / 180,
        r1 = 188,
        r2 = deg % 30 === 0 ? 199 : 194;
      line(
        [
          [pivot[0] + r1 * Math.sin(a), pivot[1] + r1 * Math.cos(a)],
          [pivot[0] + r2 * Math.sin(a), pivot[1] + r2 * Math.cos(a)],
        ],
        muted,
        1.3,
      );
      if (deg % 30 === 0)
        text(
          `${deg}°`,
          pivot[0] + 215 * Math.sin(a),
          pivot[1] + 215 * Math.cos(a) + 5,
          muted,
          14,
          "center",
        );
    }
    if (lab.showTrail !== false)
      line(
        (lab.trail ?? []).map((v) => [
          pivot[0] + (v.x * length) / p.length,
          pivot[1] - (v.y * length) / p.length,
        ]),
        "#c3a27388",
        2.2,
      );
    if (lab.smallAngleReference) {
      const r = pt(smallAngleReference(p, s.t).theta);
      line([pivot, r], purple, 2, [6, 6]);
      disc(...r, 17, null, purple);
    }
    line([pivot, at], "#557b8e", 4);
    line(
      [
        [pivot[0] - 1, pivot[1]],
        [at[0] - 1, at[1]],
      ],
      "#b9d0da",
      1,
    );
    c.save();
    c.shadowColor = "#58778d44";
    c.shadowBlur = 13;
    c.shadowOffsetY = 5;
    const metal = c.createRadialGradient(
      at[0] - 6,
      at[1] - 8,
      0,
      at[0],
      at[1],
      18,
    );
    metal.addColorStop(0, "#fff4d2");
    metal.addColorStop(0.4, "#eac58e");
    metal.addColorStop(1, "#a27643");
    disc(...at, 18, metal);
    c.restore();
    disc(...pivot, 10, "#3d697e");
    disc(...pivot, 5, "#b9d1dc");
    line(
      Array.from({ length: 33 }, (_, i) => {
        const a = (s.theta * i) / 32;
        return [pivot[0] + 42 * Math.sin(a), pivot[1] + 42 * Math.cos(a)];
      }),
      cyan,
      2,
    );
    if (lab.vectors !== false) {
      const values = motion
          ? [q.velocity, q.acceleration]
          : [q.weight, q.constraint, q.damping],
        colors = motion ? [gold, purple] : [blue, cyan, red],
        factors = motion
          ? [scales.velocity, scales.acceleration]
          : [scales.force, scales.force, scales.force];
      values.forEach((v, i) =>
        arrow(at, [v[0] * factors[i] * 87, -v[1] * factors[i] * 87], colors[i]),
      );
    }
    c.restore();
  }
}
