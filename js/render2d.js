/** Orthographic diagram mode and an automatic fallback for browsers without WebGL. */
import { drawSpring, drawOrbit } from "./canvas.js";
import * as E from "./physics-extra.js";
export function draw2D(canvas, lab) {
  if (lab.type === "spring") {
    drawSpring(canvas, lab);
    return;
  }
  if (lab.type === "gravity") {
    drawOrbit(canvas, lab);
    return;
  }
  const w = canvas.clientWidth,
    h = canvas.clientHeight,
    dpr = Math.min(devicePixelRatio || 1, 2);
  if (
    canvas.width !== Math.round(w * dpr) ||
    canvas.height !== Math.round(h * dpr)
  ) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const c = canvas.getContext("2d");
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = "#081827";
  c.fillRect(0, 0, w, h);
  for (let x = 20; x < w; x += 28)
    for (let y = 20; y < h; y += 28) {
      c.fillStyle = "#7ab5c51a";
      c.fillRect(x, y, 1, 1);
    }
  const p = lab.params,
    s = lab.state,
    C = "#65ead5",
    G = "#ffcb7b",
    B = "#8dabff";
  const line = (pts, col, width = 1.5, dash = []) => {
    if (!pts.length) return;
    c.beginPath();
    c.setLineDash(dash);
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.strokeStyle = col;
    c.lineWidth = width;
    c.stroke();
    c.setLineDash([]);
  };
  const text = (t, x, y, col = "#94b7cb", size = 11, align = "left") => {
    c.fillStyle = col;
    c.font = `${size}px Inter,Segoe UI,sans-serif`;
    c.textAlign = align;
    c.fillText(t, x, y);
  };
  const ball = (x, y, r, col) => {
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.4, 0, x, y, r);
    g.addColorStop(0, "#e6ffff");
    g.addColorStop(0.25, col);
    g.addColorStop(1, "#183f56");
    c.shadowColor = col;
    c.shadowBlur = 18;
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    c.shadowBlur = 0;
  };
  const arrow = (x, y, dx, dy, col) => {
    const a = Math.atan2(dy, dx);
    line(
      [
        [x, y],
        [x + dx, y + dy],
      ],
      col,
      2,
    );
    line(
      [
        [x + dx - 8 * Math.cos(a - 0.45), y + dy - 8 * Math.sin(a - 0.45)],
        [x + dx, y + dy],
        [x + dx - 8 * Math.cos(a + 0.45), y + dy - 8 * Math.sin(a + 0.45)],
      ],
      col,
      2,
    );
  };
  if (lab.type === "pendulum") {
    const L = Math.min(h * 0.63, w * 0.34),
      cx = w / 2,
      py = 60,
      x = cx + L * Math.sin(s.theta),
      y = py + L * Math.cos(s.theta);
    line(
      [
        [cx, py],
        [cx, py + L],
      ],
      "#365569",
      1,
      [4, 5],
    );
    c.beginPath();
    c.arc(cx, py, L * 0.22, Math.PI / 2, Math.PI / 2 - s.theta, s.theta > 0);
    c.strokeStyle = G;
    c.stroke();
    if (lab.showTrail)
      line(
        (lab.trail || []).map((q) => [
          cx + (L * q.x) / p.length,
          py - (L * q.y) / p.length,
        ]),
        "#ffcc7866",
      );
    line(
      [
        [cx, py],
        [x, y],
      ],
      "#c6dfe8",
      2.5,
    );
    line(
      [
        [cx - 35, py - 5],
        [cx + 35, py - 5],
      ],
      "#728d9d",
      5,
    );
    ball(x, y, 16, G);
    ball(cx, py, 5, "#b5d9eb");
    text(`L = ${p.length.toFixed(2)} m`, cx + 22, py + L * 0.45);
    text(`θ = ${(s.theta / E.DEG).toFixed(1)}°`, 24, h - 30);
  } else if (lab.type === "projectile") {
    const r = E.projectileReference(p),
      sc = Math.min(
        (w - 90) / Math.max(r.range, 10),
        (h - 105) / Math.max(r.maxHeight, 5),
      ),
      left = (w - r.range * sc) / 2,
      ground = h - 48,
      pt = (q) => [left + q.x * sc, ground - q.y * sc];
    line(
      [
        [24, ground],
        [w - 24, ground],
      ],
      "#31546a",
      2,
    );
    const ref = [];
    for (let i = 0; i <= 140; i++) {
      const t = (i * r.flightTime) / 140;
      ref.push(
        pt({
          x: p.speed * Math.cos(p.angle * E.DEG) * t,
          y:
            p.height +
            p.speed * Math.sin(p.angle * E.DEG) * t -
            0.5 * p.g * t * t,
        }),
      );
    }
    line(ref, "#6c829a", 1, [5, 5]);
    if (lab.showTrail) line((lab.trail || []).map(pt), "#b5a6ff", 2.5);
    const [x, y] = pt(s);
    ball(x, y, 8, "#b5a6ff");
    if (lab.vectors) arrow(x, y, s.vx * 0.8, -s.vy * 0.8, G);
    for (let i = 0; i <= 4; i++) {
      const xx = (r.range * i) / 4;
      text(
        `${xx.toFixed(0)} m`,
        left + xx * sc,
        ground + 24,
        "#94b7cb",
        10,
        "center",
      );
    }
    text("Dashed: calculated vacuum reference", 24, 40);
  } else if (lab.type === "collisions") {
    const extent = Math.max(5, Math.abs(s.x1) + 1, Math.abs(s.x2) + 1),
      sc = (w - 90) / (extent * 2),
      y = h * 0.57,
      cx = w / 2;
    line(
      [
        [25, y + 30],
        [w - 25, y + 30],
      ],
      "#3b6074",
      4,
    );
    for (const [x, v, m, col, name] of [
      [s.x1, s.v1, p.m1, C, "A"],
      [s.x2, s.v2, p.m2, G, "B"],
    ]) {
      const px = cx + x * sc,
        ww = Math.max(15, 0.8 * sc);
      c.fillStyle = col;
      c.beginPath();
      c.roundRect(px - ww / 2, y - 20, ww, 40, 6);
      c.fill();
      text(name, px, y + 5, "#102b3e", 14, "center");
      text(`${m.toFixed(1)} kg`, px, y + 58, "#bfd3df", 11, "center");
      if (lab.vectors) arrow(px, y - 38, v * 17, 0, col);
    }
    text(
      s.hit ? "AFTER CONTACT" : "BEFORE CONTACT",
      w / 2,
      65,
      s.hit ? G : C,
      11,
      "center",
    );
    text("Positive velocity →", 24, h - 30);
  } else if (lab.type === "waves") {
    const left = 35,
      width = w - 70,
      mid = h * 0.5,
      scale = Math.min((h * 0.25) / 1.2, 100),
      sets = [
        ["incident", B],
        ["reflected", G],
        ["resultant", C],
      ];
    line(
      [
        [left, mid],
        [w - left, mid],
      ],
      "#31566c",
    );
    for (const [key, col] of sets)
      line(
        Array.from({ length: 321 }, (_, i) => {
          const x = i / 40;
          return [
            left + (x / 8) * width,
            mid - E.waveAt(x, s.t, p)[key] * scale,
          ];
        }),
        col,
        key === "resultant" ? 2.8 : 1.1,
      );
    const px = left + (p.probe / 8) * width,
      py = mid - E.waveAt(p.probe, s.t, p).resultant * scale;
    line(
      [
        [px, 75],
        [px, h - 65],
      ],
      "#ffffff44",
      1,
      [4, 5],
    );
    ball(px, py, 6, "#ffffff");
    for (let i = 0; i <= 8; i += 2)
      text(`${i} m`, left + (i / 8) * width, h - 38, "#95b7c8", 10, "center");
    text("Incident", 24, 44, B);
    text("Counter-wave", 110, 44, G);
    text("Resultant", 235, 44, C);
  } else if (lab.type === "interference") {
    const slitX = w * 0.24,
      screenX = w * 0.84,
      cy = h / 2,
      gap = 35;
    c.fillStyle = "#38586d";
    c.fillRect(slitX - 3, 65, 6, h - 130);
    c.clearRect(slitX - 4, cy - gap - 6, 8, 12);
    c.clearRect(slitX - 4, cy + gap - 6, 8, 12);
    c.save();
    c.beginPath();
    c.rect(slitX + 4, 60, screenX - slitX - 8, h - 120);
    c.clip();
    for (const yy of [cy - gap, cy + gap])
      for (let i = 0; i < 9; i++) {
        const radius = ((s.t * 0.3 + i / 9) % 1) * (screenX - slitX) * 1.5;
        c.beginPath();
        c.arc(slitX, yy, radius, -Math.PI / 2, Math.PI / 2);
        c.strokeStyle = "#a0a0ff44";
        c.lineWidth = 1.5;
        c.stroke();
      }
    c.restore();
    for (let i = 0; i < h - 110; i++) {
      const yy = (i / (h - 110) - 0.5) * 0.04,
        I = E.interferenceAt(yy, p).intensity;
      c.fillStyle = `hsla(${p.wavelength < 490 ? 240 : p.wavelength < 580 ? 140 : 10},90%,65%,${Math.sqrt(I)})`;
      c.fillRect(screenX, 55 + i, 25, 1);
    }
    line(
      [
        [slitX, cy],
        [screenX, cy],
      ],
      "#ffffff22",
      1,
      [4, 5],
    );
    text("COHERENT SLITS", slitX, 35, "#95b7c8", 10, "center");
    text("SCREEN", screenX, 35, "#95b7c8", 10, "center");
    text("Wavefront spacing enlarged", 24, h - 24);
    text("±20 mm", screenX, h - 25, "#95b7c8", 10, "center");
  } else if (lab.type === "refraction") {
    const x = w / 2,
      y = h * 0.5,
      L = Math.min(w * 0.37, h * 0.37),
      q = E.refractionInfo(p),
      i = p.angle * E.DEG;
    c.fillStyle = "#237cac20";
    c.fillRect(0, y, w, h - y);
    line(
      [
        [0, y],
        [w, y],
      ],
      "#70c5ff88",
      1,
    );
    line(
      [
        [x, 40],
        [x, h - 40],
      ],
      "#6b93a5",
      1,
      [5, 6],
    );
    const a = [x - L * Math.sin(i), y - L * Math.cos(i)],
      b = [x + L * Math.sin(i), y - L * Math.cos(i)];
    arrow(a[0], a[1], x - a[0], y - a[1], C);
    if (q.reflectance > 1e-8) arrow(x, y, b[0] - x, b[1] - y, C);
    if (!q.tir && q.reflectance < 1 - 1e-8) {
      const rr = q.refracted * E.DEG;
      arrow(x, y, L * Math.sin(rr), L * Math.cos(rr), C);
    }
    text(`n₁ = ${p.n1.toFixed(2)}`, 24, 60);
    text(`n₂ = ${p.n2.toFixed(2)}`, 24, h - 45);
    text(
      q.tir
        ? "TOTAL INTERNAL REFLECTION"
        : `i = ${p.angle}°   r = ${q.refracted.toFixed(1)}°`,
      w / 2,
      h - 20,
      q.tir ? G : C,
      11,
      "center",
    );
  } else if (lab.type === "circuits") {
    const lx = w * 0.2,
      rx = w * 0.8,
      top = h * 0.25,
      bottom = h * 0.78,
      cy = h * 0.52,
      q = E.circuitAt(s.t, p);
    line(
      [
        [rx, cy - 9],
        [rx, top],
        [lx, top],
        [lx, bottom],
        [rx, bottom],
        [rx, cy + 9],
      ],
      "#7fa7b8",
      2,
    );
    const zig = [];
    for (let i = 0; i <= 16; i++)
      zig.push([
        w * 0.4 + (i * w * 0.2) / 16,
        top + (i === 0 || i === 16 ? 0 : i % 2 ? 10 : -10),
      ]);
    line(zig, G, 2);
    line(
      [
        [rx - 26, cy - 9],
        [rx + 26, cy - 9],
      ],
      C,
      4,
    );
    line(
      [
        [rx - 26, cy + 9],
        [rx + 26, cy + 9],
      ],
      "#ff8aaa",
      4,
    );
    c.fillStyle = `rgba(100,240,210,${(q.voltage / p.voltage) * 0.25})`;
    c.fillRect(rx - 24, cy - 7, 48, 14);
    c.fillStyle = "#153447";
    c.fillRect(lx - 15, cy - 24, 30, 48);
    line(
      [
        [lx - 22, cy - 7],
        [lx + 22, cy - 7],
      ],
      p.discharge ? "#48667a" : C,
      3,
    );
    line(
      [
        [lx - 12, cy + 7],
        [lx + 12, cy + 7],
      ],
      p.discharge ? "#48667a" : C,
      3,
    );
    text(
      `${p.resistance.toLocaleString()} Ω`,
      w / 2,
      top - 22,
      G,
      12,
      "center",
    );
    text(`${(p.capacitance * 1e6).toFixed(0)} µF`, rx, cy + 45);
    text(
      p.discharge ? "Source disconnected" : `${p.voltage} V`,
      lx,
      cy + 50,
      "#99becf",
      11,
      "center",
    );
    text("Conventional current", w / 2, bottom + 30, "#99becf", 11, "center");
    if (Math.abs(q.current) > 0.00001)
      arrow(
        w / 2 + (p.discharge ? -30 : 30),
        bottom,
        p.discharge ? 60 : -60,
        0,
        G,
      );
  } else if (lab.type === "fields") {
    const sc = Math.min((w - 65) / 10, (h - 75) / 7),
      cx = w / 2,
      cy = h / 2,
      pt = ([x, y]) => [cx + x * sc, cy - y * sc];
    const key = JSON.stringify([p.q1, p.q2, p.separation]);
    if (lab.fieldKey !== key) {
      lab.fieldKey = key;
      lab.fieldLines = E.fieldLines(p);
    }
    for (const l of lab.fieldLines)
      line(l.points.map(pt), l.sign > 0 ? "#62e4d274" : "#8eabff74", 1.2);
    for (const [x, q] of [
      [-p.separation / 2, p.q1],
      [p.separation / 2, p.q2],
    ])
      if (q !== 0) {
        ball(cx + x * sc, cy, 11, q > 0 ? "#ff8aaa" : B);
        text(q > 0 ? "+" : "−", cx + x * sc, cy + 4, "#fff", 15, "center");
      }
    const [x, y] = pt([p.probeX, p.probeY]),
      f = E.fieldAt(p.probeX, p.probeY, p);
    ball(x, y, 5, "#ffffff");
    if (f.valid && f.magnitude > 1e-6 && lab.vectors)
      arrow(x, y, (f.ex / f.magnitude) * 40, (-f.ey / f.magnitude) * 40, G);
    text("Probe: click to move · distances in m", 24, h - 24);
    text(`(${p.probeX.toFixed(1)}, ${p.probeY.toFixed(1)}) m`, x + 12, y - 14);
  }
}
