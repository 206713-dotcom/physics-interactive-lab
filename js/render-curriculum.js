/** Scientific Canvas instruments. This module reads state; it never advances it. */
import * as P from "./curriculum-physics.js";
import { PRACTICAL_IDS } from "./practical-physics.js";
import { drawPractical, practicalThumbnail } from "./render-practical.js";
import { drawVectorDiagram } from "./render-vectors.js";
const TAU = Math.PI * 2,
  CYAN = "#6be5d4",
  GOLD = "#ffc580",
  BLUE = "#91baff",
  PURPLE = "#c4a3ff",
  MUTED = "#8faec2",
  WHITE = "#e7f5ff";
export function drawCurriculum(canvas, lab) {
  if (lab.type === "vectors") return drawVectorDiagram(canvas, lab);
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
  bg.addColorStop(0, "#071a2b");
  bg.addColorStop(1, "#10283a");
  c.fillStyle = bg;
  c.fillRect(0, 0, width, height);
  const scale = Math.min(width / 840, height / 470),
    ox = (width - 840 * scale) / 2,
    oy = (height - 470 * scale) / 2;
  c.translate(ox, oy);
  c.scale(scale, scale);
  for (let x = 20; x < 840; x += 28)
    for (let y = 20; y < 470; y += 28) {
      c.fillStyle = "#91baff13";
      c.fillRect(x, y, 1.2, 1.2);
    }
  const p = lab.params,
    s = lab.state,
    q = P.sampleCurriculum(lab.type, s, p),
    t = s.t;
  const text = (str, x, y, color = MUTED, size = 17, align = "left") => {
    c.fillStyle = color;
    c.font = `${size}px Inter,Segoe UI,sans-serif`;
    c.textAlign = align;
    c.fillText(String(str), x, y);
  };
  const line = (pts, color = CYAN, lw = 2, dash = []) => {
    c.beginPath();
    c.setLineDash(dash);
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.strokeStyle = color;
    c.lineWidth = lw;
    c.stroke();
    c.setLineDash([]);
  };
  const arrow = (x, y, dx, dy, col = CYAN, lw = 3) => {
    if (Math.hypot(dx, dy) < 0.01) return;
    const a = Math.atan2(dy, dx);
    line(
      [
        [x, y],
        [x + dx, y + dy],
      ],
      col,
      lw,
    );
    line(
      [
        [x + dx - 11 * Math.cos(a - 0.45), y + dy - 11 * Math.sin(a - 0.45)],
        [x + dx, y + dy],
        [x + dx - 11 * Math.cos(a + 0.45), y + dy - 11 * Math.sin(a + 0.45)],
      ],
      col,
      lw,
    );
  };
  const rect = (
    x,
    y,
    w,
    h,
    col = "#ffffff0b",
    stroke = "#a5cadd36",
    r = 10,
  ) => {
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.fillStyle = col;
    c.fill();
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 1.5;
      c.stroke();
    }
  };
  const circle = (x, y, r, col, glow = false) => {
    if (glow) {
      const g = c.createRadialGradient(x, y, 1, x, y, r * 2.2);
      g.addColorStop(0, col + "55");
      g.addColorStop(1, col + "00");
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, r * 2.2, 0, TAU);
      c.fill();
    }
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.4, 0, x, y, r);
    g.addColorStop(0, WHITE);
    g.addColorStop(0.28, col);
    g.addColorStop(1, "#143449");
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
  };
  const arc = (x, y, r, a, b, col = CYAN, lw = 2) => {
    c.beginPath();
    c.arc(x, y, r, a, b);
    c.strokeStyle = col;
    c.lineWidth = lw;
    c.stroke();
  };
  const fmt = (n, d = 2) =>
    n === null
      ? "No finite result"
      : Math.abs(n) >= 1e5 || (Math.abs(n) > 0 && Math.abs(n) < 0.001)
        ? n.toExponential(2)
        : Number(n.toFixed(d)).toString();
  const title = (label, note) => {
    text(label.toUpperCase(), 35, 36, CYAN, 16);
    if (note) text(note, 805, 36, MUTED, 14, "right");
  };
  const foot = (a, b = "") => {
    rect(25, 416, 790, 40, "#071522aa");
    text(a, 42, 442, WHITE, 16);
    if (b) text(b, 795, 442, GOLD, 16, "right");
  };
  const tickRuler = (x, y, w, max, unit) => {
    line(
      [
        [x, y],
        [x + w, y],
      ],
      MUTED,
    );
    for (let i = 0; i <= 20; i++) {
      const xx = x + (i * w) / 20;
      line(
        [
          [xx, y],
          [xx, y + (i % 5 === 0 ? 16 : 8)],
        ],
        MUTED,
        1,
      );
      if (i % 5 === 0)
        text(fmt((i * max) / 20), xx, y + 37, MUTED, 15, "center");
    }
    text(unit, x + w + 25, y + 10, MUTED, 15);
  };
  const sine = (x, y, w, amp, cycles, phase = 0, col = CYAN) =>
    line(
      Array.from({ length: 241 }, (_, i) => [
        x + (i * w) / 240,
        y - amp * Math.sin((i / 240) * TAU * cycles - phase),
      ]),
      col,
      2.5,
    );
  if (PRACTICAL_IDS.includes(lab.type)) {
    drawPractical(lab, {
      c,
      p,
      s,
      q,
      t,
      text,
      line,
      arrow,
      rect,
      circle,
      arc,
      fmt,
      title,
      foot,
    });
    return;
  }
  switch (lab.type) {
    case "measurement": {
      title("Measurement bench", "Ideal ruler · model timing");
      const len = (p.length / 2) * 650;
      rect(80, 105, len, 44, "#6be5d44d", CYAN, 4);
      text("Object", 80, 92, WHITE, 19);
      tickRuler(80, 165, 650, 2, "m");
      line(
        [
          [80 + len, 102],
          [80 + len, 212],
        ],
        GOLD,
        1.5,
        [4, 4],
      );
      rect(80, 263, 290, 108);
      text("RULER READING", 100, 290, MUTED, 14);
      text(`${fmt(q.measured, 4)} m`, 100, 331, WHITE, 30);
      text(`± ${fmt(q.absolute, 4)} m resolution`, 100, 354, GOLD, 15);
      const phase = (TAU * t) / p.period;
      line(
        [
          [560, 265],
          [560 + 70 * Math.sin(phase), 265 + 70 * Math.cos(phase)],
        ],
        WHITE,
        3,
      );
      circle(560 + 70 * Math.sin(phase), 265 + 70 * Math.cos(phase), 15, CYAN);
      text(
        `${p.count} cycles = ${fmt(q.elapsed)} s`,
        680,
        335,
        WHITE,
        20,
        "center",
      );
      foot(
        "Time several oscillations to reduce endpoint uncertainty.",
        `uT = ${fmt(q.uncertainty)} s`,
      );
      break;
    }
    case "motion": {
      title(
        p.mode ? "Free-fall force laboratory" : "Newton’s motion track",
        "Linear drag · exact solution",
      );
      if (p.mode) {
        line(
          [
            [400, 70],
            [400, 365],
          ],
          MUTED,
          1,
          [4, 6],
        );
        const y = 100 + ((Math.abs(q.x) * 12) % 240);
        circle(400, y, 27, GOLD);
        const max = Math.max(p.mass * p.g, Math.abs(p.drag * q.v), 1);
        arrow(400, y + 30, 0, ((p.mass * p.g) / max) * 95, GOLD);
        arrow(400, y - 30, 0, ((-p.drag * q.v) / max) * 95, CYAN);
        text("Weight", 445, y + 60, GOLD);
        text("Drag", 445, y - 60, CYAN);
        text(
          "Display follows the falling object; repeated window.",
          80,
          390,
          MUTED,
          16,
        );
      } else {
        const x = 150 + ((((q.x * 25) % 530) + 530) % 530);
        line(
          [
            [65, 300],
            [780, 300],
          ],
          MUTED,
          3,
        );
        for (let i = 0; i < 18; i++) {
          const xx = 60 + i * 42 - ((q.x * 12) % 42);
          line(
            [
              [xx, 307],
              [xx - 10, 321],
            ],
            "#8faec244",
          );
        }
        rect(x - 45, 236, 90, 50, "#6be5d455", CYAN);
        circle(x - 28, 291, 9, BLUE);
        circle(x + 28, 291, 9, BLUE);
        const max = Math.max(Math.abs(p.force), Math.abs(p.drag * q.v), 1);
        arrow(x, 218, (p.force / max) * 100, 0, GOLD);
        arrow(x, 327, ((-p.drag * q.v) / max) * 100, 0, PURPLE);
        text("Applied force", x, 198, GOLD, 17, "center");
        text("Drag", x, 363, PURPLE, 17, "center");
      }
      if (!p.mode) {
        const ticks = Array.from(
          { length: 31 },
          (_, i) => Math.floor(t * 50) / 50 - (30 - i) / 50,
        )
          .filter((x) => x >= 0)
          .map((time) => P.sampleCurriculum("motion", { t: time }, p).x);
        const lo = Math.min(...ticks),
          hi = Math.max(...ticks);
        text("50 Hz ticker tape · auto-fit", 65, 403, MUTED, 14);
        for (const x of ticks)
          circle(
            310 + ((x - lo) / Math.max(hi - lo, 1e-8)) * 430,
            393,
            2,
            CYAN,
          );
      }
      foot(
        `x = ${fmt(q.x)} m   ·   v = ${fmt(q.v)} m/s`,
        `a = ${fmt(q.a)} m/s²`,
      );
      break;
    }
    case "vectors": {
      title("Vector construction", "Lengths use one common scale");
      const sc = 12,
        x = 175,
        y = 320,
        ax = p.a * sc,
        bx = p.b * Math.cos(p.angle * P.DEG) * sc,
        by = -p.b * Math.sin(p.angle * P.DEG) * sc;
      line(
        [
          [x, 80],
          [x, 360],
          [740, 360],
        ],
        "#8faec244",
      );
      arrow(x, y, ax, 0, GOLD, 5);
      arrow(x + ax, y, bx, by, BLUE, 5);
      arrow(x, y, (p.a + p.b * Math.cos(p.angle * P.DEG)) * sc, by, CYAN, 4);
      line(
        [
          [x, y + by],
          [x + ax + bx, y + by],
          [x + ax + bx, y],
        ],
        "#6be5d455",
        1,
        [5, 5],
      );
      text(`A = ${p.a} N`, x + ax / 2, y + 32, GOLD, 20, "center");
      text(`B = ${p.b} N`, x + ax + bx / 2 + 20, y + by / 2 - 15, BLUE, 20);
      text(`R = ${fmt(q.resultant)} N`, 490, 100, CYAN, 27);
      text(`Direction = ${fmt(q.direction)}°`, 490, 132, WHITE, 19);
      foot(
        "Add head-to-tail. The resultant joins the starting point to the final tip.",
      );
      break;
    }
    case "moments": {
      title("Moments and centre of mass", "Beam held level · torque shown");
      const pivot = 300,
        sc = 125;
      line(
        [
          [80, 207],
          [520, 207],
        ],
        WHITE,
        8,
      );
      line(
        [
          [pivot - 30, 256],
          [pivot, 211],
          [pivot + 30, 256],
          [pivot - 30, 256],
        ],
        MUTED,
        3,
      );
      const xl = pivot - p.d1 * sc,
        xr = pivot + p.d2 * sc;
      rect(xl - 20, 130, 40, 73, "#ffc58055", GOLD, 3);
      rect(xr - 20, 130, 40, 73, "#91baff55", BLUE, 3);
      arrow(xl, 212, 0, 75, GOLD);
      arrow(xr, 212, 0, 75, BLUE);
      text(`${p.m1} kg`, xl, 115, GOLD, 18, "center");
      text(`${p.m2} kg`, xr, 115, BLUE, 18, "center");
      text(`${p.d1} m`, (xl + pivot) / 2, 317, MUTED, 18, "center");
      text(`${p.d2} m`, (xr + pivot) / 2, 317, MUTED, 18, "center");
      c.save();
      c.translate(680, 320);
      c.rotate(-p.tilt * P.DEG);
      rect(
        -p.width * 30,
        -p.height * 120,
        p.width * 60,
        p.height * 120,
        "#c4a3ff33",
        PURPLE,
        2,
      );
      circle(0, -p.height * 60, 5, GOLD);
      c.restore();
      line(
        [
          [590, 322],
          [770, 322],
        ],
        MUTED,
        2,
      );
      text("Separate stability test", 680, 95, PURPLE, 17, "center");
      text(
        q.tipping ? "Beyond tipping threshold" : "Centre of mass above support",
        680,
        364,
        q.tipping ? GOLD : CYAN,
        15,
        "center",
      );
      foot(
        `Resultant moment = ${fmt(q.net)} N m`,
        Math.abs(q.net) < 1e-8 ? "ROTATIONAL EQUILIBRIUM" : "UNBALANCED",
      );
      break;
    }
    case "buoyancy": {
      title("Hydrostatics tank", "Equilibrium floating / submerged comparison");
      rect(150, 85, 450, 280, "#91baff12", BLUE, 3);
      rect(152, 170, 446, 192, "#62c6f32b", null, 0);
      for (let x = 152; x < 596; x += 6)
        line(
          [
            [x, 170 + 2 * Math.sin(x / 22 + t)],
            [x + 6, 170 + 2 * Math.sin((x + 6) / 22 + t)],
          ],
          BLUE,
          1,
        );
      const side = 100,
        yy = q.fraction < 1 ? 170 - (1 - q.fraction) * side : 250;
      rect(310, yy, side, side, "#ffc58060", GOLD, 5);
      const max = Math.max(q.weight, q.upthrust, 1);
      arrow(360, yy + 50, 0, (q.weight / max) * 95, GOLD);
      arrow(360, yy + 50, 0, (-q.upthrust / max) * 95, CYAN);
      text("W", 405, yy + 120, GOLD, 19);
      text("U", 405, yy - 25, CYAN, 19);
      const py = 182 + (p.depth / 5) * 160;
      circle(570, py, 6, PURPLE);
      line(
        [
          [578, py],
          [650, py],
        ],
        PURPLE,
      );
      text(`${fmt(q.pressure)} Pa`, 660, py + 5, PURPLE, 20);
      text("gauge pressure", 660, py + 29, MUTED, 15);
      foot(
        q.fraction < 1
          ? `Floats · ${fmt(q.fraction * 100, 1)}% submerged`
          : p.density === p.fluid
            ? "Neutral density · fully submerged"
            : "Sinks · net downward force",
        `ρobject = ${p.density} kg/m³`,
      );
      break;
    }
    case "energy": {
      const resources = [
        "Hydroelectric: water → turbine → generator",
        "Wind: moving air → turbine → generator",
        "Solar: radiation → electrical transfer",
        "Fossil fuel: chemical → thermal → generator",
        "Nuclear: nuclear store → thermal → generator",
        "Tidal: moving seawater → turbine → generator",
      ];
      title("Energy transfer machine", resources[p.resource]);
      rect(75, 130, 150, 120, "#6be5d41b", CYAN);
      text("INPUT", 150, 165, CYAN, 17, "center");
      text(`${p.power} W`, 150, 204, WHITE, 27, "center");
      arrow(230, 190, 115, 0, CYAN, 12);
      rect(352, 145, 130, 90);
      text("LIFT", 417, 198, WHITE, 23, "center");
      arrow(490, 178, 145, 0, GOLD, Math.max(3, p.efficiency * 16));
      arrow(417, 245, 0, 86, PURPLE, Math.max(3, (1 - p.efficiency) * 16));
      text(`Useful: ${fmt(q.potential)} J`, 635, 150, GOLD, 20, "center");
      text(`Dissipated: ${fmt(q.waste)} J`, 417, 363, PURPLE, 20, "center");
      line(
        [
          [710, 90],
          [710, 350],
        ],
        MUTED,
        3,
      );
      const yy = 340 - (q.height / p.height) * 210;
      rect(680, yy - 35, 60, 35, "#ffc58055", GOLD);
      text(`${fmt(q.height)} m`, 760, yy, GOLD, 18);
      foot(
        `Input ${fmt(q.input)} J = useful + dissipated`,
        `${fmt(p.efficiency * 100, 0)}% efficient`,
      );
      break;
    }
    case "gases": {
      title(
        "Particle model",
        p.state === 2
          ? "Ideal gas · illustrative particle speeds"
          : "Conceptual arrangement · no gas-law pressure",
      );
      const boxw = 270 + (p.volume / 0.05) * 260,
        x = 120,
        y = 90,
        h = 275;
      rect(x, y, boxw, h, "#ffffff06", MUTED, 2);
      line(
        [
          [x + boxw, y],
          [x + boxw, y + h],
        ],
        GOLD,
        8,
      );
      for (let i = 0; i < 70; i++) {
        let xx, yy;
        if (p.state === 0) {
          xx = x + 35 + ((i % 10) * (boxw - 70)) / 9 + 2 * Math.sin(t * 8 + i);
          yy = y + 50 + Math.floor(i / 10) * 28 + 2 * Math.cos(t * 9 + i);
        } else if (p.state === 1) {
          xx =
            x +
            20 +
            ((((i * 67 + t * 20 * Math.sin(i)) % (boxw - 40)) + (boxw - 40)) %
              (boxw - 40));
          yy =
            y +
            h -
            120 +
            ((((i * 31 + t * 12 * Math.cos(i)) % 100) + 100) % 100);
        } else {
          const v = Math.sqrt(p.temperature / 300) * 25;
          xx =
            x +
            14 +
            Math.abs(
              ((((i * 77 + t * v * Math.cos(i)) % (2 * (boxw - 28))) +
                2 * (boxw - 28)) %
                (2 * (boxw - 28))) -
                (boxw - 28),
            );
          yy =
            y +
            14 +
            Math.abs(
              ((((i * 39 + t * v * Math.sin(i)) % (2 * (h - 28))) +
                2 * (h - 28)) %
                (2 * (h - 28))) -
                (h - 28),
            );
        }
        circle(xx, yy, 4, p.state === 0 ? BLUE : CYAN);
      }
      text(`${p.temperature} K`, 700, 150, GOLD, 29, "center");
      text(`${fmt(p.temperature - 273.15)} °C`, 700, 185, MUTED, 18, "center");
      foot(
        p.state === 2
          ? `pV = nRT · p = ${fmt(q.pressure)} Pa`
          : "Particles are not to scale; solid vibrations / liquid motion are schematic.",
        `V = ${fmt(p.volume * 1000)} L`,
      );
      break;
    }
    case "expansion": {
      title("Thermal expansion gauge", "Extension overlay magnified ×3000");
      const baseline = 450,
        extra = (q.extension / p.length) * baseline * 3000;
      rect(110, 235, baseline, 45, "#91baff44", BLUE, 3);
      rect(110, 155, baseline + Math.min(extra, 180), 45, "#ffc58055", GOLD, 3);
      text("Original rod", 110, 318, BLUE, 20);
      text(`Heated +${p.temperature} K`, 110, 130, GOLD, 20);
      line(
        [
          [560, 145],
          [560, 300],
        ],
        MUTED,
        1,
        [4, 5],
      );
      arrow(560, 110, Math.min(extra, 180), 0, GOLD);
      text(
        `${fmt(q.extension * 1000, 3)} mm actual`,
        530,
        350,
        WHITE,
        23,
        "center",
      );
      foot(
        "Overlay exaggerates ΔL. The numeric length uses the actual extension.",
        `L = ${fmt(q.final, 6)} m`,
      );
      break;
    }
    case "calorimetry": {
      title(
        "Calorimeter",
        p.mode
          ? "Custom material · one phase"
          : "Water at 1 atmosphere · insulated",
      );
      rect(260, 95, 260, 240, "#91baff16", BLUE, 3);
      const phase =
        q.temperature < 0
          ? "ICE"
          : q.temperature === 0 && q.melt < 1
            ? "MELTING"
            : q.temperature < 100
              ? "LIQUID"
              : q.boil < 1
                ? "BOILING"
                : "STEAM";
      const col =
        q.temperature < 0 ? BLUE : q.temperature > 100 ? PURPLE : CYAN;
      rect(265, 190, 250, 140, col + "35", null, 2);
      for (let i = 0; i < 36; i++) {
        const xx = 282 + (i % 6) * 40,
          yy =
            q.temperature < 0
              ? 210 + Math.floor(i / 6) * 20
              : 210 + Math.floor(i / 6) * 20 + 6 * Math.sin(t * 0.8 + i);
        circle(xx, yy, 4, col);
        if (q.temperature === 100 && q.boil > 0)
          arc(xx, 250 - ((t * 12 + i * 9) % 100), 5, 0, TAU, "#e7f5ff55");
      }
      line(
        [
          [340, 310],
          [340, 280],
          [355, 300],
          [370, 280],
          [385, 300],
          [400, 280],
          [415, 300],
          [430, 280],
          [430, 310],
        ],
        GOLD,
        5,
      );
      text("ELECTRIC HEATER", 390, 367, GOLD, 15, "center");
      text(`${fmt(q.temperature, 1)} °C`, 650, 180, WHITE, 35, "center");
      text(p.mode ? "SINGLE PHASE" : phase, 650, 222, col, 20, "center");
      text(`${fmt(q.energy / 1000)} kJ input`, 650, 262, MUTED, 20, "center");
      foot(
        "Plateaus transfer latent energy without raising temperature.",
        `${p.mass} kg · ${p.power} W`,
      );
      break;
    }
    case "heat": {
      title(
        ["Conduction bridge", "Convection cell", "Thermal radiation"][p.mode],
        "Reservoir temperatures held constant",
      );
      rect(80, 110, 150, 250, "#ffc58033", GOLD);
      rect(610, 110, 150, 250, "#91baff33", BLUE);
      text(`${p.hot} °C`, 155, 95, GOLD, 23, "center");
      text(`${p.cold} °C`, 685, 95, BLUE, 23, "center");
      if (p.mode === 0) {
        const grad = c.createLinearGradient(235, 0, 605, 0);
        grad.addColorStop(0, "#ffc580");
        grad.addColorStop(1, "#91baff");
        rect(235, 205, 370, 60, grad, null, 2);
        for (let i = 0; i < 15; i++)
          circle(
            245 + i * 24 + Math.sin(t * 15 + i) * 2,
            235 + Math.cos(i) * 10,
            5,
            WHITE,
          );
        arrow(300, 170, 225, 0, CYAN);
        text(
          "Energy by particle interactions / electrons",
          420,
          315,
          MUTED,
          17,
          "center",
        );
      }
      if (p.mode === 1) {
        rect(260, 100, 320, 265, "#91baff16", BLUE);
        for (let i = 0; i < 35; i++) {
          const a = TAU * (i / 35 + t * 0.08),
            xx = 420 + 115 * Math.cos(a),
            yy = 232 + 90 * Math.sin(a);
          circle(xx, yy, 5, Math.sin(a) > 0 ? BLUE : GOLD);
        }
        arrow(300, 285, 0, -100, GOLD);
        arrow(540, 180, 0, 100, BLUE);
        text("Warm rises · cool sinks", 420, 390, WHITE, 19, "center");
      }
      if (p.mode === 2) {
        for (let i = 0; i < 6; i++)
          sine(240, 150 + i * 32, 360, 9, 4, t * 3 - i, GOLD);
        text(
          "Infrared radiation crosses a vacuum",
          420,
          390,
          MUTED,
          18,
          "center",
        );
      }
      foot(
        `Selected transfer power = ${fmt(q.power)} W`,
        `Q = ${fmt(q.energy)} J`,
      );
      break;
    }
    case "wavefronts": {
      title(
        p.mode ? "Reflection at a plane wall" : "Diffraction at a single gap",
        "Wavefront construction · not a full fluid solver",
      );
      const spacing = Math.min(100, q.wavelength * 60),
        gap = p.gap * 45;
      line(
        [
          [355, 70],
          [355, 235 - gap / 2],
        ],
        WHITE,
        7,
      );
      line(
        [
          [355, 235 + gap / 2],
          [355, 390],
        ],
        WHITE,
        7,
      );
      for (let i = 0; i < 8; i++) {
        const xx = 35 + ((i * spacing + t * p.speed * 45) % 315);
        line(
          [
            [xx, 80],
            [xx, 385],
          ],
          CYAN,
          2,
        );
      }
      if (p.mode === 0) {
        const spread = Math.asin(Math.min(1, 1 / q.ratio));
        for (let i = 0; i < 12; i++) {
          const r = (t * p.speed * 45 + i * spacing) % 470;
          if (r > 3) {
            c.save();
            c.beginPath();
            c.rect(359, 65, 440, 330);
            c.clip();
            arc(355, 235, r, -spread, spread, BLUE, 2);
            c.restore();
          }
        }
        text(
          q.ratio < 1.5
            ? "Gap ≲ λ: strong spreading"
            : "Gap > λ: weaker angular spreading",
          420,
          390,
          GOLD,
          19,
          "center",
        );
      } else {
        line(
          [
            [355, 70],
            [355, 390],
          ],
          WHITE,
          7,
        );
        for (let i = 0; i < 8; i++) {
          const xx = 355 - ((i * spacing + t * p.speed * 45) % 325);
          line(
            [
              [xx, 80],
              [xx, 385],
            ],
            GOLD,
            2,
          );
        }
        text("Incident + reflected wavefronts", 550, 235, GOLD, 18, "center");
      }
      foot(`λ = ${fmt(q.wavelength)} m`, `gap / λ = ${fmt(q.ratio)}`);
      break;
    }
    case "mirror": {
      title("Plane mirror ray bench", "Angles measured from the normal");
      line(
        [
          [420, 80],
          [420, 380],
        ],
        WHITE,
        7,
      );
      for (let y = 90; y < 380; y += 22)
        line(
          [
            [425, y],
            [440, y - 12],
          ],
          MUTED,
          1,
        );
      line(
        [
          [90, 235],
          [730, 235],
        ],
        "#8faec266",
        1,
        [5, 5],
      );
      const dx = Math.cos(p.angle * P.DEG) * 240,
        dy = Math.sin(p.angle * P.DEG) * 240;
      arrow(420 - dx, 235 - dy, dx, dy, GOLD);
      arrow(420, 235, -dx, dy, CYAN);
      line(
        [
          [420, 235],
          [420 + dx, 235 - dy],
        ],
        BLUE,
        2,
        [6, 5],
      );
      circle(420 - dx, 235 - dy, 8, GOLD);
      circle(420 + dx, 235 - dy, 8, BLUE);
      text("Object", 420 - dx, 205 - dy, GOLD, 19, "center");
      text("Virtual image", 420 + dx, 205 - dy, BLUE, 19, "center");
      text("normal", 90, 221, MUTED, 16);
      arc(420, 235, 50, Math.PI, Math.PI + p.angle * P.DEG, GOLD);
      arc(420, 235, 55, Math.PI - p.angle * P.DEG, Math.PI, CYAN);
      foot(
        `i = ${p.angle}°   ·   r = ${p.angle}°`,
        "Image same distance behind mirror",
      );
      break;
    }
    case "lenses": {
      title(
        p.kind === 1 ? "Converging lens" : "Diverging lens",
        "Paraxial thin-lens principal rays",
      );
      const max = Math.max(
          p.object,
          p.focal * 2,
          Math.min(Math.abs(q.image || 0), 2),
        ),
        sc = 310 / max,
        cx = 420,
        y = 245,
        u = p.object * sc,
        f = p.focal * p.kind * sc,
        hh = Math.min(95, p.height * sc),
        v = q.image === null ? null : q.image * sc;
      line(
        [
          [25, y],
          [815, y],
        ],
        MUTED,
        1,
      );
      c.save();
      c.translate(cx, y);
      c.scale(1, p.kind);
      c.beginPath();
      c.ellipse(0, 0, 13, 130, 0, 0, TAU);
      c.fillStyle = "#91baff35";
      c.fill();
      c.strokeStyle = BLUE;
      c.lineWidth = 2;
      c.stroke();
      c.restore();
      [-1, 1].forEach((sign) => {
        circle(cx + sign * Math.abs(f), y, 3, GOLD);
        text("F", cx + sign * Math.abs(f), y + 28, GOLD, 17, "center");
      });
      arrow(cx - u, y, 0, -hh, GOLD, 4);
      text("Object", cx - u, y + 52, GOLD, 18, "center");
      line(
        [
          [cx - u, y - hh],
          [cx, y - hh],
        ],
        GOLD,
        2,
      );
      const rayY = (x) => y - hh + (hh / f) * (x - cx);
      line(
        [
          [cx, y - hh],
          [810, rayY(810)],
        ],
        CYAN,
        2,
      );
      line(
        [
          [cx - u, y - hh],
          [810, y + (hh / u) * (810 - cx)],
        ],
        BLUE,
        2,
      );
      if (v !== null && Math.abs(v) < 380) {
        const imgH = q.magnification * hh;
        arrow(cx + v, y, 0, -imgH, PURPLE, 4);
        text(
          q.image > 0 ? "Real image" : "Virtual image",
          cx + v,
          y + 75,
          PURPLE,
          18,
          "center",
        );
        if (q.image < 0) {
          line(
            [
              [cx, y - hh],
              [cx + v, y - imgH],
            ],
            CYAN,
            1.5,
            [5, 5],
          );
          line(
            [
              [cx, y],
              [cx + v, y - imgH],
            ],
            BLUE,
            1.5,
            [5, 5],
          );
        }
      } else
        text(
          q.image === null
            ? "Object at F: emerging rays parallel"
            : "Image beyond this view",
          610,
          95,
          PURPLE,
          19,
          "center",
        );
      foot(
        q.image === null
          ? "At the focal plane: no finite image distance."
          : `v = ${fmt(q.image * 100)} cm · m = ${fmt(q.magnification)}`,
        "Signed distances · heights linear",
      );
      break;
    }
    case "dispersion": {
      title(
        "Dispersive optical interface",
        "Air → Cauchy material · one interface",
      );
      rect(420, 65, 390, 330, "#91baff13", null, 0);
      line(
        [
          [420, 65],
          [420, 395],
        ],
        WHITE,
        2,
      );
      line(
        [
          [80, 235],
          [790, 235],
        ],
        MUTED,
        1,
        [4, 5],
      );
      const dx = Math.min(
          320,
          p.angle > 0 ? 155 / Math.tan(p.angle * P.DEG) : 320,
        ),
        dy = dx * Math.tan(p.angle * P.DEG);
      arrow(420 - dx, 235 - dy, dx, dy, WHITE, 4);
      for (let i = 0; i < 7; i++) {
        const wave = (400 + i * 50) * 1e-9,
          n = p.a + p.b / (wave * 1e6) ** 2,
          r = Math.asin(Math.sin(p.angle * P.DEG) / n),
          col = `hsl(${270 - i * 45} 90% 72%)`;
        line(
          [
            [420, 235],
            [790, 235 + 370 * Math.tan(r)],
          ],
          col,
          2,
        );
      }
      text(`n = ${fmt(q.index, 4)}`, 630, 100, WHITE, 28, "center");
      text(`r = ${fmt(q.refraction)}°`, 630, 139, CYAN, 23, "center");
      foot(
        `Selected vacuum wavelength ${fmt(p.wavelength * 1e9, 0)} nm`,
        "Frequency unchanged at boundary",
      );
      break;
    }
    case "spectrum": {
      title("Electromagnetic spectrum", "Logarithmic wavelength ruler");
      const bands = [
        ["γ rays", -12, -11, PURPLE],
        ["X-rays", -11, -8, BLUE],
        ["UV", -8, -6.4, "#a5a4ff"],
        ["Visible", -6.4, -6.15, CYAN],
        ["Infrared", -6.15, -3, GOLD],
        ["Microwave", -3, 0, "#f1a387"],
        ["Radio", 0, 4, "#b1c6d4"],
      ];
      for (const [name, a, b, col] of bands) {
        const x = 65 + ((a + 12) / 16) * 710,
          w = ((b - a) / 16) * 710;
        rect(x, 110, w, 55, col + "77", null, 1);
        text(name, x + w / 2, 94, col, 14, "center");
      }
      const xx = 65 + ((p.exponent + 12) / 16) * 710;
      line(
        [
          [xx, 170],
          [xx, 222],
        ],
        WHITE,
        2,
      );
      circle(xx, 175, 6, WHITE);
      for (let i = -12; i <= 4; i += 2)
        text(
          `10${i < 0 ? "⁻" : ""}${Math.abs(i)}`,
          65 + ((i + 12) / 16) * 710,
          193,
          MUTED,
          14,
          "center",
        );
      sine(75, 310, 690, 35 * p.amplitude, 4, t * 1.5, CYAN);
      text(
        "Field sketch · all vacuum EM waves travel at c",
        420,
        384,
        MUTED,
        18,
        "center",
      );
      foot(`λ = ${fmt(q.wavelength)} m`, `f = ${fmt(q.frequency)} Hz`);
      break;
    }
    case "sound": {
      title(
        "Longitudinal sound wave",
        "Visible wave motion slowed; waveform uses real simulated time",
      );
      for (let i = 0; i < 105; i++) {
        const base = 65 + i * 6.8,
          displacement =
            10 *
            p.amplitude *
            Math.sin((i / 105) * TAU * 5 - TAU * p.frequency * t);
        line(
          [
            [base + displacement, 105],
            [base + displacement, 200],
          ],
          i % 5 === 0 ? CYAN : "#6be5d455",
          i % 5 === 0 ? 2 : 1,
        );
      }
      text("Compressions and rarefactions", 420, 232, CYAN, 20, "center");
      sine(70, 315, 690, 40 * p.amplitude, 5, TAU * p.frequency * t, BLUE);
      text("Relative pressure", 70, 384, MUTED, 17);
      foot(
        `${p.frequency} Hz · λ = ${fmt(q.wavelength)} m`,
        `Echo time ${fmt(q.echo, 4)} s`,
      );
      break;
    }
    case "dc": {
      title(
        [
          "Series circuit",
          "Parallel circuit",
          "Potential divider",
          "Resistance of a wire",
        ][p.mode],
        "Conventional-current dots · drift speed illustrative",
      );
      const x1 = 160,
        x2 = 690,
        y1 = 110,
        y2 = 340;
      line(
        [
          [x1, 210],
          [x1, y1],
          [x2, y1],
          [x2, y2],
          [x1, y2],
          [x1, 250],
        ],
        CYAN,
        3,
      );
      line(
        [
          [130, 210],
          [190, 210],
        ],
        GOLD,
        4,
      );
      line(
        [
          [143, 250],
          [177, 250],
        ],
        GOLD,
        3,
      );
      text(`${p.voltage} V`, 105, 240, GOLD, 23, "center");
      const resistor = (x, y, label, value, col) => {
        rect(x - 52, y - 15, 104, 30, col + "22", col, 2);
        text(label, x, y - 35, col, 18, "center");
        text(`${fmt(value)} Ω`, x, y + 48, MUTED, 17, "center");
      };
      resistor(
        415,
        y1,
        p.mode === 3 ? "Wire" : "R₁",
        p.mode === 3 ? q.wire : p.r1,
        GOLD,
      );
      if (p.mode === 1) {
        line(
          [
            [240, y1],
            [240, 248],
            [600, 248],
            [600, y1],
          ],
          CYAN,
          3,
        );
        resistor(415, 248, "R₂", p.r2, BLUE);
        text("Same voltage in each branch", 430, 392, WHITE, 18, "center");
      } else resistor(415, y2, "R₂", p.r2, BLUE);
      for (let i = 0; i < 14; i++) {
        const pos = (((t * 0.13 * Math.sign(q.current) + i / 14) % 1) + 1) % 1,
          per = 2 * (x2 - x1 + y2 - y1),
          d = pos * per;
        let x, y;
        if (d < x2 - x1) {
          x = x1 + d;
          y = y1;
        } else if (d < x2 - x1 + y2 - y1) {
          x = x2;
          y = y1 + d - (x2 - x1);
        } else if (d < 2 * (x2 - x1) + y2 - y1) {
          x = x2 - (d - (x2 - x1 + y2 - y1));
          y = y2;
        } else {
          x = x1;
          y = y2 - (d - (2 * (x2 - x1) + y2 - y1));
        }
        circle(x, y, 3, CYAN);
      }
      if (p.mode === 2) {
        line(
          [
            [690, 340],
            [755, 340],
          ],
          PURPLE,
        );
        text("Vout", 760, 320, PURPLE, 18, "center");
      }
      foot(
        `I = ${fmt(q.current, 4)} A   ·   Req = ${fmt(q.resistance)} Ω`,
        `V₂ = ${fmt(q.v2)} V`,
      );
      break;
    }
    case "devices": {
      title(
        [
          "Diode characteristic",
          "Ideal relay switch",
          "Ideal overcurrent cut-out",
        ][p.mode],
        "Teaching thresholds · no component heating / time-response model",
      );
      line(
        [
          [110, 235],
          [720, 235],
        ],
        CYAN,
        3,
      );
      rect(245, 218, 100, 34, "#ffc58022", GOLD, 2);
      text(`${p.resistance} Ω`, 295, 190, GOLD, 18, "center");
      if (p.mode === 0) {
        line(
          [
            [440, 202],
            [440, 268],
            [490, 235],
            [440, 202],
          ],
          BLUE,
          3,
        );
        line(
          [
            [492, 200],
            [492, 270],
          ],
          BLUE,
          3,
        );
        text("0.7 V forward-drop model", 470, 319, BLUE, 21, "center");
      } else {
        line(
          [
            [420, 235],
            [445, 235],
            [492, q.on ? 235 : 190],
          ],
          q.on ? CYAN : GOLD,
          4,
        );
        circle(500, 235, 5, WHITE);
        text(
          q.on ? "CLOSED / CONDUCTING" : "OPEN / NOT CONDUCTING",
          480,
          319,
          q.on ? CYAN : GOLD,
          21,
          "center",
        );
      }
      circle(660, 235, 24, q.on ? GOLD : "#607387", q.on > 0);
      text(`${p.voltage} V supply`, 175, 365, WHITE, 22);
      foot(
        `Load current = ${fmt(q.current, 4)} A`,
        p.mode === 2
          ? "Simplified protection; not a wiring guide"
          : "Conventional current",
      );
      break;
    }
    case "magnetism": {
      title(
        p.mode ? "Straight-wire field" : "Air-core solenoid",
        "μ₀ ≈ 4π × 10⁻⁷ · field-line sketch",
      );
      if (!p.mode) {
        for (let i = 0; i < 22; i++) {
          c.beginPath();
          c.ellipse(200 + i * 20, 230, 14, 65, 0, 0, TAU);
          c.strokeStyle = GOLD;
          c.lineWidth = 2;
          c.stroke();
        }
        for (let i = 0; i < 5; i++) {
          const yy = 190 + i * 20;
          arrow(
            p.current >= 0 ? 180 : 650,
            yy,
            p.current >= 0 ? 470 : -470,
            0,
            CYAN,
            1.5,
          );
        }
        for (let r = 0; r < 3; r++) {
          c.beginPath();
          c.ellipse(420, 235, 280 + r * 28, 100 + r * 23, 0, 0, TAU);
          c.strokeStyle = "#91baff66";
          c.lineWidth = 1.5;
          c.stroke();
        }
        text(p.current >= 0 ? "S" : "N", 155, 238, BLUE, 30, "center");
        text(p.current >= 0 ? "N" : "S", 685, 238, GOLD, 30, "center");
      } else {
        circle(420, 235, 15, GOLD);
        for (let r = 50; r < 180; r += 35) {
          arc(420, 235, r, 0, TAU, CYAN, 1.5);
          arrow(420 + r, 235, 0, p.current >= 0 ? -22 : 22, CYAN, 2);
        }
        text(
          p.current >= 0 ? "• Current out of page" : "× Current into page",
          420,
          75,
          GOLD,
          20,
          "center",
        );
      }
      foot(
        `Signed reference field = ${fmt(q.field)} T`,
        `${p.current} A · reverse I to reverse B`,
      );
      break;
    }
    case "charged": {
      title(
        "Magnetic beam chamber",
        "Uniform field perpendicular to the screen",
      );
      for (let x = 110; x < 750; x += 65)
        for (let y = 100; y < 390; y += 55) {
          text(p.field >= 0 ? "•" : "×", x, y, "#91baff55", 20, "center");
        }
      const radius = q.radius || 0.01,
        sc = 130 / radius,
        sign = p.charge * p.field > 0 ? -1 : 1,
        cy = 235,
        originX = 300;
      if (q.radius !== null) {
        arc(originX, cy, 130, 0, TAU, "#6be5d455");
        const originY = cy + sign * 130,
          x = originX + q.x * sc,
          y = originY - q.y * sc;
        circle(x, y, 9, GOLD, true);
        arrow(x, y, (originX - x) * 0.45, (cy - y) * 0.45, PURPLE);
        text(`r = ${fmt(radius)} m`, 625, 200, WHITE, 23, "center");
        text("Force always perpendicular to v", 625, 240, MUTED, 17, "center");
      } else {
        arrow(130, 235, 550, 0, CYAN);
        circle(130 + ((t * p.speed * 100) % 550), 235, 9, GOLD);
        text("B = 0: straight trajectory", 420, 340, WHITE, 23, "center");
      }
      foot(`K = ${fmt(q.kinetic)} J (constant)`, `F = ${fmt(q.force)} N`);
      break;
    }
    case "induction": {
      title(
        p.mode ? "Ideal commutated DC motor" : "Alternating-current generator",
        "Rotation rate imposed · mechanical response not solved",
      );
      rect(90, 120, 150, 240, "#ffc58033", GOLD);
      rect(600, 120, 150, 240, "#91baff33", BLUE);
      text("N", 165, 255, GOLD, 45, "center");
      text("S", 675, 255, BLUE, 45, "center");
      for (let i = 0; i < 5; i++)
        arrow(255, 150 + i * 43, 330, 0, "#8faec255", 1);
      c.save();
      c.translate(420, 240);
      c.rotate(q.phase);
      rect(-70, -70, 140, 140, "#6be5d411", CYAN, 2);
      line(
        [
          [-70, -70],
          [-70, 70],
          [70, 70],
          [70, -70],
          [-70, -70],
        ],
        CYAN,
        4,
      );
      arrow(0, 0, 75, 0, GOLD, 2);
      c.restore();
      text("Coil normal", 420, 385, GOLD, 17, "center");
      foot(
        p.mode ? `τ = ${fmt(q.torque)} N m` : `ε = ${fmt(q.emf)} V`,
        p.mode
          ? "Split-ring reverses coil current each half-turn"
          : `εpeak = ${fmt(q.peak)} V`,
      );
      break;
    }
    case "transformer": {
      title(
        "Ideal AC transformer",
        "RMS values · leakage and core loss omitted",
      );
      rect(245, 105, 350, 260, "#91baff12", MUTED, 8);
      rect(315, 160, 210, 150, "#071a2b", MUTED, 8);
      const drawCoil = (x, n, col) => {
        const count = Math.max(3, Math.min(20, Math.round(n / 70)));
        for (let i = 0; i < count; i++) {
          c.beginPath();
          c.ellipse(x, 140 + (i * 180) / (count - 1), 55, 7, 0, 0, TAU);
          c.strokeStyle = col;
          c.lineWidth = 3;
          c.stroke();
        }
      };
      drawCoil(280, p.np, GOLD);
      drawCoil(560, p.ns, CYAN);
      text(`${p.np} turns`, 130, 95, GOLD, 22, "center");
      text(`${p.vp} V`, 130, 236, GOLD, 30, "center");
      text(`${fmt(q.ip)} A`, 130, 279, MUTED, 22, "center");
      text(`${p.ns} turns`, 710, 95, CYAN, 22, "center");
      text(`${fmt(q.vs)} V`, 710, 236, CYAN, 30, "center");
      text(`${fmt(q.is)} A`, 710, 279, MUTED, 22, "center");
      const flux = Math.sin(t * TAU);
      line(
        [
          [350, 132],
          [490, 132],
          [560, 132],
        ],
        "#c4a3ff77",
        3,
      );
      arrow(flux > 0 ? 355 : 490, 132, flux > 0 ? 120 : -120, 0, PURPLE, 3);
      foot(
        `Ideal power: ${fmt(q.input)} W in = ${fmt(q.output)} W out`,
        `Separate line loss ${fmt(q.loss)} W`,
      );
      break;
    }
    case "atom": {
      title(
        p.decay ? "Nuclear accounting" : "Rutherford scattering",
        "Nucleus / atom sizes enlarged independently",
      );
      if (p.decay) {
        const nucleus = (x, z, a, col) => {
          circle(x, 220, 62, col, true);
          text(String(a), x - 88, 190, WHITE, 25, "right");
          text(String(z), x - 88, 251, WHITE, 25, "right");
          text("X", x, 232, WHITE, 36, "center");
        };
        nucleus(225, p.protons, q.massNumber, GOLD);
        arrow(335, 220, 110, 0, CYAN);
        if (q.valid) {
          nucleus(575, q.daughterZ, q.daughterA, BLUE);
          text(
            ["", "+ ⁴₂He", "+ ⁰₋₁e + antineutrino", "+ γ"][p.decay],
            700,
            330,
            PURPLE,
            23,
            "center",
          );
        } else text("No permitted daughter", 590, 230, GOLD, 24, "center");
      } else {
        circle(490, 235, 38, GOLD, true);
        for (let i = 0; i < 7; i++) {
          const by = 105 + i * 38,
            impact = ((by - 235) / 130) * p.impact * 5,
            theta =
              2 *
              Math.atan(
                (8.9875517923e9 * 2 * p.protons * 1.602176634e-19 ** 2) /
                  (2 *
                    p.energy *
                    1.602176634e-19 *
                    Math.max(Math.abs(impact), 1e-15)),
              ),
            sign = Math.sign(by - 235) || 1;
          line(
            [
              [55, by],
              [390, by],
            ],
            CYAN,
            1.5,
          );
          const pts = Array.from({ length: 51 }, (_, j) => {
            const u = j / 50;
            return [
              390 + u * 310 * Math.cos(theta),
              by + sign * u * u * 200 * Math.sin(theta),
            ];
          });
          line(pts, CYAN, 1.5);
          const pos = (t * 0.3 + i / 7) % 1;
          circle(55 + pos * 330, by, 3, CYAN);
        }
        text(
          "Trajectories schematic; angle computed for selected b.",
          420,
          382,
          MUTED,
          17,
          "center",
        );
      }
      foot(
        `Z = ${p.protons}   ·   N = ${p.neutrons}   ·   A = ${q.massNumber}`,
        `${q.electrons} electrons · θ = ${fmt(q.angle)}°`,
      );
      break;
    }
    case "radioactivity": {
      title(
        "Random radioactive decay",
        `Seed ${p.seed} · each nucleus has an exponential waiting time`,
      );
      const cols = 30,
        rows = Math.ceil(p.nuclei / cols),
        gap = Math.min(14, 270 / rows);
      for (let i = 0; i < p.nuclei; i++) {
        const x = 65 + (i % cols) * 15,
          y = 90 + Math.floor(i / cols) * gap;
        c.fillStyle = s.decayTimes[i] > t ? CYAN : "#66809629";
        c.beginPath();
        c.arc(x, y, 3.5, 0, TAU);
        c.fill();
      }
      text(`${q.remaining}`, 675, 160, CYAN, 46, "center");
      text("nuclei remaining", 675, 193, MUTED, 19, "center");
      text(`${fmt(q.expected, 1)}`, 675, 258, GOLD, 30, "center");
      text("ensemble expectation", 675, 290, MUTED, 17, "center");
      rect(585, 330, 175, 30, "#c4a3ff33", PURPLE);
      text(
        `Shield: ${fmt(100 * q.transmission, 1)}%`,
        672,
        352,
        PURPLE,
        17,
        "center",
      );
      foot(
        "Dots = one random sample. Curve = mathematical expectation.",
        `T½ = ${p.halfLife} s`,
      );
      break;
    }
    case "earthmoon": {
      title(
        "Earth and Moon observatory",
        "Sizes / distances / phase speed illustrative",
      );
      circle(115, 225, 48, GOLD, true);
      text("SUN", 115, 315, GOLD, 18, "center");
      for (let y = 165; y <= 285; y += 40)
        arrow(185, y, 150, 0, "#ffc58066", 1);
      circle(450, 225, 75, BLUE);
      c.save();
      c.beginPath();
      c.arc(450, 225, 75, 0, TAU);
      c.clip();
      c.fillStyle = "#020c20bb";
      c.fillRect(450, 140, 90, 170);
      c.restore();
      const tilt = p.tilt * P.DEG;
      line(
        [
          [450 - 100 * Math.sin(tilt), 225 + 100 * Math.cos(tilt)],
          [450 + 100 * Math.sin(tilt), 225 - 100 * Math.cos(tilt)],
        ],
        WHITE,
        2,
      );
      arc(450, 225, 135, 0, TAU, "#8faec244");
      const mx = 450 - 135 * Math.cos(q.phase),
        my = 225 + 100 * Math.sin(q.phase);
      circle(mx, my, 17, WHITE);
      text("EARTH", 450, 355, BLUE, 18, "center");
      c.fillStyle = "#020c20";
      c.beginPath();
      c.arc(720, 185, 37, 0, TAU);
      c.fill();
      for (let yy = -37; yy <= 37; yy++) {
        const edge = Math.sqrt(Math.max(0, 37 ** 2 - yy ** 2)),
          term = edge * Math.cos(q.phase),
          waxing = Math.sin(q.phase) >= 0;
        line(
          [
            [720 + (waxing ? term : -edge), 185 + yy],
            [720 + (waxing ? edge : -term), 185 + yy],
          ],
          WHITE,
          1.2,
        );
      }
      text(
        `${fmt(q.illumination * 100, 0)}% lit`,
        720,
        250,
        WHITE,
        20,
        "center",
      );
      text("View from Earth", 720, 282, MUTED, 16, "center");
      foot(
        `Latitude ${p.latitude}° · geometric daylight ${fmt(q.daylight)} h`,
        `Solar declination ${fmt(q.declination)}°`,
      );
      break;
    }
    case "solarsystem": {
      title(
        "Solar System orrery",
        "Log radius view · circular reference orbits",
      );
      const cx = 420,
        cy = 230;
      circle(cx, cy, 22, GOLD, true);
      for (let i = 0; i < 8; i++) {
        const planet = P.PLANETS[i],
          r = 47 + i * 19 + (i === p.planet ? Math.log(p.scale) * 15 : 0),
          period =
            (2 * Math.PI * Math.sqrt((planet[1] * P.AU) ** 3 / (P.G * P.SUN))) /
            P.YEAR,
          a = (i === p.planet ? q.phase : (TAU * t) / period) + i * 0.9;
        c.beginPath();
        c.ellipse(cx, cy, r * 1.7, r * 0.8, 0, 0, TAU);
        c.strokeStyle = i === p.planet ? "#6be5d466" : "#8faec225";
        c.lineWidth = i === p.planet ? 2 : 1;
        c.stroke();
        const x = cx + r * 1.7 * Math.cos(a),
          y = cy + r * 0.8 * Math.sin(a);
        circle(x, y, i === p.planet ? 8 : 4, i === p.planet ? CYAN : BLUE);
        if (i === p.planet) text(planet[0], x, y - 18, CYAN, 18, "center");
      }
      text(
        `${P.PLANETS[p.planet][0]} · ${P.PLANETS[p.planet][4]}`,
        420,
        82,
        WHITE,
        24,
        "center",
      );
      foot(
        `r = ${fmt(q.radius / P.AU)} AU · T = ${fmt(q.period / P.YEAR)} yr`,
        `Light: ${fmt(q.lightTime)} s`,
      );
      break;
    }
    case "stars": {
      title(
        "Stellar evolution studio",
        "Qualitative stages · analytic reference estimates",
      );
      const heavy = p.mass >= 8,
        labels = [
          "Cloud / protostar",
          "Main sequence",
          heavy ? "Red supergiant" : "Red giant",
          heavy ? "Supernova" : "Planetary nebula",
          heavy ? "Neutron star / black hole" : "White dwarf",
        ];
      const st = p.stage,
        col = st === 2 ? "#ff9d80" : st === 4 ? BLUE : GOLD,
        r = [35, 42, 85, 25, 15][st];
      if (st === 0 || st === 3) {
        for (let i = 0; i < 110; i++) {
          const a = i * 2.399,
            rr = Math.sqrt(i / 110) * 130 * (0.85 + 0.1 * Math.sin(t * 0.5));
          circle(
            420 + Math.cos(a) * rr,
            220 + Math.sin(a) * rr * 0.7,
            2 + (i % 3),
            st === 3 ? PURPLE : BLUE,
          );
        }
      }
      circle(420, 220, r, col, true);
      if (st === 3)
        for (let i = 0; i < 4; i++)
          arc(420, 220, 45 + ((t * 5 + i * 23) % 90), 0, TAU, "#c4a3ff44", 3);
      text(labels[st], 420, 365, WHITE, 27, "center");
      labels.forEach((label, i) => {
        const xx = 100 + i * 160;
        circle(xx, 80, 5, i === st ? CYAN : "#547589");
        if (i < 4)
          line(
            [
              [xx + 9, 80],
              [xx + 151, 80],
            ],
            "#54758966",
          );
        text(String(i + 1), xx, 61, i === st ? CYAN : MUTED, 15, "center");
      });
      foot(
        `${p.mass} M☉ · ${heavy ? "massive-star" : "lower-mass"} branch`,
        `λpeak = ${fmt(q.peak * 1e9, 0)} nm`,
      );
      break;
    }
    case "universe": {
      title(
        "Expanding-Universe desk",
        "Low-z Hubble model · galaxy spacing illustration",
      );
      const scaleView = 1 + 0.15 * Math.sin(t * 0.3);
      for (let i = 0; i < 16; i++) {
        const a = i * 2.399,
          r = 30 + Math.sqrt(i) * 28,
          x = 300 + Math.cos(a) * r * scaleView,
          y = 235 + Math.sin(a) * r * 0.75 * scaleView;
        c.save();
        c.translate(x, y);
        c.rotate(a);
        c.beginPath();
        c.ellipse(0, 0, 12, 4, 0, 0, TAU);
        c.strokeStyle = i % 2 ? BLUE : CYAN;
        c.lineWidth = 2;
        c.stroke();
        c.restore();
        if (i % 3 === 0)
          arrow(x, y, Math.cos(a) * 20, Math.sin(a) * 15, "#91baff66", 1);
      }
      const x0 = 535,
        y0 = 145,
        ww = 230;
      rect(x0, y0, ww, 65, "#ffffff06");
      rect(x0, 265, ww, 65, "#ffffff06");
      for (const [i, wave] of [430, 486, 656].entries()) {
        const xx = x0 + ((wave - 400) / 350) * ww;
        line(
          [
            [xx, y0 + 5],
            [xx, y0 + 60],
          ],
          [PURPLE, CYAN, GOLD][i],
          3,
        );
        const xr = x0 + ((wave * (1 + q.redshift) - 400) / 350) * ww;
        line(
          [
            [xr, 270],
            [xr, 325],
          ],
          [PURPLE, CYAN, GOLD][i],
          3,
        );
      }
      text("Rest spectrum", x0, y0 - 15, WHITE, 17);
      text("Receding-galaxy spectrum", x0, 250, WHITE, 17);
      text(`z ≈ ${fmt(q.redshift, 4)}`, 650, 375, GOLD, 24, "center");
      foot(
        `d = ${p.distance} Mpc · v = ${fmt(q.speed / 1000)} km/s`,
        `Hubble time ${fmt(q.age / 1e9)} billion yr`,
      );
      break;
    }
  }
}
export function curriculumThumbnail(id) {
  if (PRACTICAL_IDS.includes(id)) return practicalThumbnail(id);
  const groups = {
    measurement:
      "M70 100h250M80 100v20m40-20v12m40-12v20m40-20v12m40-12v20m40-20v12",
    motion: "M65 120h260m-200-55h80v45h-80zM220 70h95m-12-10 12 10-12 10",
    vectors: "M90 125h125l-40-80-85 80m125 0-12-10m12 10-14 5m-38-80 0 15",
    moments: "M65 90h260M175 95l-25 35h50zM105 50v40m170-40v40",
    buoyancy: "M95 35v110h200V35M95 80h200m-110-20h45v45h-45z",
    energy: "M65 65h70v55H65zm80 25h70m-12-10 12 10-12 10m15-35h70v55h-70z",
    gases: "M90 30h210v115H90zM120 55h1m50 30h1m60-35h1m30 65h1m-130 10h1",
    expansion: "M65 65h230v20H65zm0 45h260v20H65z",
    calorimetry:
      "M125 35v100h140V35m-130 45h120m-90 40 10-20 10 20 10-20 10 20 10-20",
    heat: "M65 40h70v95H65zm190 0h70v95h-70zM145 85h100m-15-12 15 12-15 12",
    wavefronts:
      "M175 25v40m0 40v40M65 30v110m30-110v110m30-110v110m50-60q65-70 130 0m-130 0q65 70 130 0",
    mirror: "M200 25v120M80 35l120 50L80 135M200 85l110-50",
    lenses:
      "M35 90h320M190 25q-25 65 0 120 25-55 0-120M80 90V45h110l120 75M80 45l230 75",
    dispersion: "M190 25v120M50 35l140 50 150 30M190 85l150 40m-150-40 150 20",
    spectrum:
      "M50 65h290v50H50zm30 0v50m45-50v50m45-50v50m45-50v50m45-50v50m45-50v50",
    sound: "M60 90q17-65 34 0t34 0t34 0t34 0t34 0t34 0t34 0t34 0",
    dc: "M75 70V35h240v110H75V95m-15-25h30m-20 25h10M155 20h75v30h-75z",
    devices: "M60 90h260M165 55v70l55-35zM225 55v70",
    magnetism:
      "M80 90q115-110 230 0M80 90q115 110 230 0M120 65h150v50H120zm20-10v70m25-70v70m25-70v70m25-70v70",
    induction: "M65 40h65v100H65zm195 0h65v100h-65zM165 50l70 20-10 65-70-20z",
    transformer:
      "M110 35h170v110H110zm40 30h90v55h-90zM90 55h40m-40 20h40m-40 20h40m130-40h40m-40 20h40m-40 20h40",
    atom: "M75 85h90m-90-30h80l125-30M75 115h80l125 30",
    radioactivity:
      "M80 50h1m35 0h1m35 0h1m35 0h1m35 0h1m-140 35h1m35 0h1m35 0h1m35 0h1m35 0h1m-140 35h1m35 0h1m35 0h1",
    earthmoon: "M180 30l35 110M90 85h40m-12-9 12 9-12 9",
    solarsystem: "M80 85h230m-115-65v130",
    stars: "M45 85h300m-30-10 30 10-30 10",
    universe: "M60 130l260-100M60 30v100h260",
  };
  return `<svg viewBox="0 0 390 170" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="${groups[id]}"/>${["atom", "earthmoon", "solarsystem", "stars"].includes(id) ? '<circle cx="195" cy="85" r="27" fill="currentColor" fill-opacity=".25"/><circle cx="290" cy="55" r="8" fill="#ffc580"/>' : ""}</svg>`;
}
