import { AU, SOLAR_MASS, doublePosition } from "./physics-advanced.js";
const COLORS = ["#ffcc84", "#8edfff", "#d0a3ff"];
export function drawAdvanced(canvas, lab) {
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
  c.fillStyle = "#071522";
  c.fillRect(0, 0, w, h);
  const text = (value, x, y, color = "#8faec4", size = 13, align = "left") => {
    c.font = `${size}px Segoe UI,sans-serif`;
    c.fillStyle = color;
    c.textAlign = align;
    c.fillText(value, x, y);
  };
  const line = (points, color, width = 1.5, opacity = 1) => {
    if (points.length < 2) return;
    c.globalAlpha = opacity;
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineJoin = "round";
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
    c.globalAlpha = 1;
  };
  const disc = (x, y, r, color, ghost = false) => {
    c.globalAlpha = ghost ? 0.35 : 1;
    const glow = c.createRadialGradient(x, y, 0, x, y, r * 3);
    glow.addColorStop(0, color);
    glow.addColorStop(0.25, color + "aa");
    glow.addColorStop(1, color + "00");
    c.fillStyle = glow;
    c.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
    const surface = c.createRadialGradient(
      x - r * 0.3,
      y - r * 0.3,
      1,
      x,
      y,
      r,
    );
    surface.addColorStop(0, "#fff5dc");
    surface.addColorStop(0.5, color);
    surface.addColorStop(1, "#304052");
    c.fillStyle = surface;
    c.beginPath();
    c.arc(x, y, r, 0, 2 * Math.PI);
    c.fill();
    c.globalAlpha = 1;
  };
  const arrow = (x, y, dx, dy, color) => {
    const a = Math.atan2(dy, dx);
    line(
      [
        [x, y],
        [x + dx, y + dy],
      ],
      color,
      1.5,
      0.8,
    );
    line(
      [
        [x + dx - 6 * Math.cos(a - 0.45), y + dy - 6 * Math.sin(a - 0.45)],
        [x + dx, y + dy],
        [x + dx - 6 * Math.cos(a + 0.45), y + dy - 6 * Math.sin(a + 0.45)],
      ],
      color,
    );
  };
  for (let x = 30; x < w; x += 36)
    for (let y = 30; y < h; y += 36) {
      c.fillStyle = "#a4c4db12";
      c.fillRect(x, y, 1, 1);
    }
  if (lab.type !== "doublependulum") {
    const { state: s, params: p } = lab;
    let extent =
      p.separation *
      (lab.type === "threebody" ? (p.layout === 2 ? 5.5 : 1.3) : 1);
    for (const q of [...lab.trail, { bodies: s.bodies }])
      for (const b of q.bodies)
        extent = Math.max(extent, Math.abs(b.x) * 1.15, Math.abs(b.y) * 1.15);
    const scale = Math.min((w - 100) / (2 * extent), (h - 115) / (2 * extent)),
      cx = w / 2,
      cy = h / 2,
      pt = (b) => [cx + b.x * scale, cy - b.y * scale];
    line(
      [
        [cx - 9, cy],
        [cx + 9, cy],
      ],
      "#c6dce9",
    );
    line(
      [
        [cx, cy - 9],
        [cx, cy + 9],
      ],
      "#c6dce9",
    );
    text("BARYCENTRIC FRAME", 22, 28, "#718fa8", 11);
    text("All bodies move · no fixed central star", 22, 49, "#9bb9ce", 12);
    if (lab.showTrail)
      s.bodies.forEach((b, i) =>
        line(
          [
            ...lab.trail
              .filter((q) => s.t - q.t <= lab.definition.trailDuration(p))
              .map((q) => q.bodies[i]),
            b,
          ].map(pt),
          COLORS[i],
          1.8,
          0.6,
        ),
      );
    line(
      [...s.bodies, ...(s.bodies.length === 3 ? [s.bodies[0]] : [])].map(pt),
      "#8eabc1",
      1,
      0.25,
    );
    const speedScale = Math.sqrt((6.6743e-11 * p.m1) / p.separation);
    s.bodies.forEach((b, i) => {
      const [x, y] = pt(b);
      disc(x, y, 12 + 4 * Math.cbrt(b.mass / SOLAR_MASS), COLORS[i]);
      text(
        `${"ABC"[i]} · ${(b.mass / SOLAR_MASS).toFixed(2)} M☉`,
        x,
        y - 26,
        COLORS[i],
        13,
        "center",
      );
      if (lab.vectors) {
        const speed = Math.hypot(b.vx, b.vy),
          length = Math.min(65, (speed / speedScale) * 28);
        if (speed)
          arrow(
            x,
            y,
            (b.vx / speed) * length,
            (-b.vy / speed) * length,
            COLORS[i],
          );
      }
    });
    const metres = Math.min((w * 0.22) / scale, p.separation),
      pixels = metres * scale;
    line(
      [
        [24, h - 38],
        [24 + pixels, h - 38],
      ],
      "#bed5e5",
      2,
    );
    line(
      [
        [24, h - 43],
        [24, h - 33],
      ],
      "#bed5e5",
    );
    line(
      [
        [24 + pixels, h - 43],
        [24 + pixels, h - 33],
      ],
      "#bed5e5",
    );
    text(`${(metres / AU).toPrecision(3)} AU`, 24, h - 17);
    text(
      "Linear distance scale · star radii illustrative",
      w - 20,
      h - 18,
      "#708da4",
      11,
      "right",
    );
    return;
  }
  const p = lab.params,
    s = lab.state,
    radius = Math.min(w * 0.4, h * 0.39),
    scale = radius / (p.l1 + p.l2),
    cx = w / 2,
    cy = h * 0.48;
  const pt = (x, y) => [cx + x * scale, cy - y * scale],
    q = doublePosition(s, p),
    twin = doublePosition(s.twin, p),
    origin = [cx, cy],
    a = pt(q.x1, q.y1),
    b = pt(q.x, q.y),
    ga = pt(twin.x1, twin.y1),
    gb = pt(twin.x, twin.y);
  text("COUPLED NONLINEAR MOTION", 22, 27, "#8faec4", 11);
  text(`Twin starts ${p.delta}° away`, 22, 48, "#c6acff", 13);
  line(
    [
      [cx, cy - radius],
      [cx, cy + radius],
    ],
    "#6b899d",
    1,
    0.2,
  );
  if (lab.showTrail) {
    line([...lab.trail.map((q) => pt(q.x, q.y)), b], "#72e2ce", 1.7, 0.65);
    if (lab.vectors)
      line([...lab.trail.map((q) => pt(q.tx, q.ty)), gb], "#c49aff", 1.3, 0.45);
  }
  if (lab.vectors) {
    line([origin, ga, gb], "#c49aff", 2, 0.4);
    disc(...ga, 9, "#c49aff", true);
    disc(...gb, 10, "#c49aff", true);
  }
  line([origin, a, b], "#d0e5ec", 3);
  line(
    [
      [cx - 22, cy - 3],
      [cx + 22, cy - 3],
    ],
    "#8da9bd",
    5,
  );
  disc(...a, 11, "#ffcc84");
  disc(...b, 12, "#72e2ce");
  disc(cx, cy, 4, "#e6eff6");
  text(
    `L₁ = ${p.l1.toFixed(2)} m`,
    (cx + a[0]) / 2 + 12,
    (cy + a[1]) / 2,
    "#d4dbdf",
    12,
  );
  text(
    `L₂ = ${p.l2.toFixed(2)} m`,
    (a[0] + b[0]) / 2 + 12,
    (a[1] + b[1]) / 2,
    "#b4e2d7",
    12,
  );
  text("Gold / cyan: main · Violet: perturbed twin", 22, h - 22, "#9eb8ca", 12);
}
