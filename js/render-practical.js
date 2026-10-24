/** State-only instrument drawings. Geometry is decorative unless a scale is stated. */
import {
  radiationReferences,
  particlePosition,
  LAMP_AMBIENT,
} from "./practical-physics.js";
const C = "#6be5d4",
  G = "#ffc580",
  B = "#91baff",
  P = "#c4a3ff",
  W = "#e7f5ff",
  M = "#8faec2";
export function drawPractical(lab, kit) {
  const {
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
  } = kit;
  const spring = (x, y, len, col = C) => {
    const pts = [
      [x, y],
      [x, y + 10],
    ];
    for (let i = 0; i <= 24; i++)
      pts.push([x + (i % 2 ? 13 : -13), y + 14 + (i * (len - 28)) / 24]);
    pts.push([x, y + len - 8], [x, y + len]);
    line(pts, col, 3);
  };
  const resistor = (x, y, label, col = C) => {
    line(
      [
        [x, y - 42],
        [x, y + 42],
      ],
      M,
      2,
    );
    rect(x - 19, y - 25, 38, 50, "#102e42", col, 3);
    text(label, x + 32, y + 5, col, 15);
  };
  const clipped = (x, y, w, h, fn) => {
    c.save();
    c.beginPath();
    c.rect(x, y, w, h);
    c.clip();
    fn();
    c.restore();
  };
  switch (lab.type) {
    case "hydraulics": {
      title("Hydraulic workbench", "Quasistatic · shared travel scale");
      const a = Math.sqrt(p.inputArea) * 1800,
        b = Math.sqrt(p.outputArea) * 1800,
        sc = Math.min(
          600,
          150 / Math.max(p.stroke, (p.stroke * p.inputArea) / p.outputArea),
        ),
        y1 = 150 + q.inputTravel * sc,
        y2 = 270 - q.outputTravel * sc;
      line(
        [
          [215, 355],
          [215, 385],
          [610, 385],
          [610, 355],
        ],
        "#1d7b97",
        22,
      );
      line(
        [
          [215, 355],
          [215, 385],
          [610, 385],
          [610, 355],
        ],
        "#6be5d455",
        9,
      );
      for (const [x, width, y, col, label, travel] of [
        [215, a, y1, C, "INPUT", q.inputTravel],
        [610, b, y2, G, "OUTPUT", q.outputTravel],
      ]) {
        rect(
          x - width / 2 - 8,
          90,
          width + 16,
          275,
          "#ffffff05",
          "#91baff55",
          6,
        );
        rect(x - width / 2, y, width, 360 - y, "#18acbc40", null, 0);
        rect(x - width / 2 - 2, y - 8, width + 4, 16, "#8aa6bc", W, 3);
        line(
          [
            [x, y - 8],
            [x, y - 48],
          ],
          col,
          8,
        );
        rect(x - width * 0.65, y - 60, width * 1.3, 14, "#7593a9", W, 3);
        text(label, x, 73, col, 18, "center");
        text(`${fmt(travel * 100, 2)} cm`, x, 403, W, 18, "center");
      }
      arrow(215, y1 - 120, 0, 48, C);
      arrow(610, y2 - 66, 0, -48, G);
      text(`${fmt(p.force)} N`, 290, 105, C, 20);
      text(`${fmt(q.outputForce)} N`, 685, 105, G, 20);
      for (let i = 0; i < 12; i++) {
        const pos = (i / 12 + Math.min(t / 4, 1) * 0.4) % 1;
        circle(215 + 395 * pos, 385, 2, C);
      }
      foot(
        `Pressure ${fmt(q.pressure / 1000)} kPa · area ratio ${fmt(q.advantage)}×`,
        `W in = W out = ${fmt(q.inputWork)} J`,
      );
      break;
    }
    case "hooke": {
      title(
        "Elasticity bench",
        "Smooth four-second loading · extension auto-fits",
      );
      line(
        [
          [235, 80],
          [605, 80],
        ],
        W,
        6,
      );
      const final = p.load / q.stiffness,
        scale = Math.min(170, 145 / final),
        x = 420;
      let end;
      if (p.mode === 1) {
        const l1 = 60 + q.x1 * scale,
          l2 = 60 + q.x2 * scale;
        spring(x, 80, l1, C);
        circle(x, 80 + l1, 5, W);
        spring(x, 90 + l1, l2, G);
        end = 90 + l1 + l2;
        text(`x₁ ${fmt(q.x1)} m`, 475, 125, C, 18);
        text(`x₂ ${fmt(q.x2)} m`, 475, 205, G, 18);
      } else if (p.mode === 2) {
        end = 200 + q.extension * scale;
        spring(320, 80, end - 80, C);
        spring(520, 80, end - 80, G);
        line(
          [
            [300, end],
            [540, end],
          ],
          W,
          5,
        );
        text(`F₁ ${fmt(q.f1)} N`, 235, 170, C, 17, "right");
        text(`F₂ ${fmt(q.f2)} N`, 600, 170, G, 17);
      } else {
        end = 200 + q.extension * scale;
        spring(x, 80, end - 80, C);
        text(`k₁ ${fmt(p.k1)} N/m`, 490, 155, C, 20);
      }
      rect(x - 50, end, 100, 35, "#254b62", W, 5);
      arrow(x, end + 36, 0, 32, G);
      text(`${fmt(q.force)} N`, x + 65, end + 29, G, 20);
      text(`${fmt(q.stiffness)} N/m`, 70, 230, W, 30);
      text("equivalent stiffness", 70, 258, M, 16);
      foot(
        `Total extension ${fmt(q.extension, 4)} m`,
        `Elastic energy ${fmt(q.energy, 4)} J`,
      );
      break;
    }
    case "sensors": {
      title(
        "Environmental sensing",
        "Unloaded divider · ideal threshold comparator",
      );
      rect(45, 100, 210, 270, "#ffffff04");
      text(
        p.mode ? "NTC THERMISTOR" : "LIGHT SENSOR",
        150,
        130,
        C,
        15,
        "center",
      );
      if (p.mode) {
        rect(125, 170, 24, 120, "#ffffff0b", M, 12);
        rect(
          132,
          280 - (p.temperature / 80) * 100,
          10,
          10 + (p.temperature / 80) * 100,
          G,
          null,
          5,
        );
        circle(137, 300, 20, G);
        text(`${fmt(p.temperature)} °C`, 150, 350, W, 24, "center");
      } else {
        circle(150, 235, 33, G, true);
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI) / 6;
          line(
            [
              [150 + 47 * Math.cos(a), 235 + 47 * Math.sin(a)],
              [
                150 + (55 + Math.log10(p.lux) * 9) * Math.cos(a),
                235 + (55 + Math.log10(p.lux) * 9) * Math.sin(a),
              ],
            ],
            G,
            2,
          );
        }
        text(`${fmt(p.lux)} lux`, 150, 350, W, 24, "center");
      }
      line(
        [
          [340, 100],
          [440, 100],
          [440, 355],
          [340, 355],
          [340, 100],
        ],
        M,
        2,
      );
      circle(340, 225, 24, B);
      text(`${p.voltage} V`, 340, 230, W, 17, "center");
      resistor(
        440,
        165,
        p.orientation ? "Sensor" : "Fixed",
        p.orientation ? C : B,
      );
      resistor(
        440,
        290,
        p.orientation ? "Fixed" : "Sensor",
        p.orientation ? B : C,
      );
      circle(440, 225, 5, G);
      line(
        [
          [440, 225],
          [590, 225],
        ],
        G,
        3,
      );
      rect(590, 170, 200, 125, "#143247", M);
      text("COMPARATOR", 690, 195, M, 15, "center");
      text(`${fmt(q.output, 3)} V`, 690, 235, W, 29, "center");
      text(`Threshold ${p.threshold} V`, 690, 270, M, 16, "center");
      circle(685, 340, 19, q.on ? C : "#355061", !!q.on);
      text(q.on ? "ON" : "OFF", 730, 345, q.on ? C : M, 18);
      foot(
        `Sensor ${fmt(q.resistance / 1000)} kΩ`,
        `I = ${fmt(q.current * 1000, 3)} mA`,
      );
      break;
    }
    case "radiation": {
      title("Magnetic beam chamber", "Main view: 100 px = 1 m · +y upward");
      rect(45, 85, 750, 310, "#ffffff03", M);
      for (let x = 80; x < 780; x += 65)
        for (let y = 110; y < 380; y += 65)
          text(
            p.field > 0 ? "⊙" : p.field < 0 ? "⊗" : "·",
            x,
            y,
            "#91baff38",
            20,
            "center",
          );
      const refs = radiationReferences(p),
        origin = [105, 235],
        sc = 100;
      clipped(47, 87, 746, 306, () => {
        for (const [key, col] of [
          ["alpha", G],
          ["beta", C],
        ]) {
          const ref = refs[key],
            duration = Math.min(
              t,
              (2 * Math.PI) / Math.abs(ref.omega || 1e-30),
            ),
            pts = Array.from({ length: 201 }, (_, i) => {
              const z = particlePosition(ref, (duration * i) / 200);
              return [origin[0] + z.x * sc, origin[1] - z.y * sc];
            });
          line(pts, col, 3);
          const z = particlePosition(ref, t);
          circle(origin[0] + z.x * sc, origin[1] - z.y * sc, 5, col, true);
        }
        line(
          [origin, [origin[0] + Math.min(q.gammaX, 20) * sc, origin[1]]],
          P,
          2,
          [7, 5],
        );
        if (q.gammaX < 6.8)
          circle(origin[0] + q.gammaX * sc, origin[1], 4, P, true);
      });
      rect(68, 218, 24, 34, "#67849a", W, 3);
      text("α", 200, 115, G, 24);
      text("β−", 250, 115, C, 24);
      text("γ", 310, 115, P, 24);
      text(
        q.gammaX > 6.8 ? "γ has left the displayed window" : "γ travels at c",
        350,
        115,
        M,
        15,
      );
      rect(562, 260, 215, 120, "#071a2bf0", C);
      text("BETA · INDEPENDENT SCALE", 670, 280, C, 13, "center");
      if (refs.beta.radius !== null) {
        const r = refs.beta.radius,
          sg = Math.sign(refs.beta.omega),
          x0 = 650,
          y0 = 329 + sg * 32;
        arc(650, 329, 32, 0, Math.PI * 2, "#6be5d455");
        const z = particlePosition(refs.beta, t);
        circle(x0 + (z.x / r) * 32, y0 - (z.y / r) * 32, 4, C, true);
        text(`32 px = rβ = ${fmt(r, 4)} m`, 670, 373, W, 13, "center");
      } else {
        text("B = 0: straight beam", 670, 331, W, 17, "center");
        arrow(600, 345, 125, 0, C);
      }
      foot(
        `α radius ${q.alphaRadius === null ? "undefined" : fmt(q.alphaRadius) + " m"}`,
        `β speed ${fmt(q.betaSpeed / 299792458, 3)} c`,
      );
      break;
    }
    case "rectifier": {
      title(
        "Rectification bench",
        p.mode ? "Full-wave · ideal bridge" : "Half-wave · ideal diode",
      );
      const diode = (x1, y1, x2, y2, active) => {
        c.save();
        c.translate((x1 + x2) / 2, (y1 + y2) / 2);
        c.rotate(Math.atan2(y2 - y1, x2 - x1));
        const length = Math.hypot(x2 - x1, y2 - y1),
          col = active ? C : "#526d80";
        line(
          [
            [-length / 2, 0],
            [length / 2, 0],
          ],
          col,
          3,
        );
        line(
          [
            [-12, -12],
            [-12, 12],
            [10, 0],
            [-12, -12],
          ],
          col,
          2,
        );
        line(
          [
            [12, -15],
            [12, 15],
          ],
          col,
          3,
        );
        c.restore();
      };
      circle(125, 225, 38, B);
      text("~", 125, 237, W, 40, "center");
      text("AC SOURCE", 125, 300, M, 15, "center");
      text(`${fmt(q.input)} V`, 125, 330, B, 22, "center");
      if (p.mode) {
        const positive = q.input >= 0;
        diode(315, 225, 420, 125, positive);
        diode(525, 225, 420, 125, !positive);
        diode(420, 325, 315, 225, !positive);
        diode(420, 325, 525, 225, positive);
        line(
          [
            [125, 187],
            [125, 145],
            [285, 145],
            [285, 225],
            [315, 225],
          ],
          B,
          2,
        );
        line(
          [
            [125, 263],
            [125, 370],
            [550, 370],
            [550, 225],
            [525, 225],
          ],
          B,
          2,
        );
        line(
          [
            [420, 125],
            [690, 125],
            [690, 180],
          ],
          C,
          3,
        );
        line(
          [
            [420, 325],
            [690, 325],
            [690, 270],
          ],
          C,
          3,
        );
      } else {
        line(
          [
            [125, 187],
            [125, 125],
            [305, 125],
          ],
          B,
          3,
        );
        diode(305, 125, 460, 125, q.input > 0);
        line(
          [
            [460, 125],
            [690, 125],
            [690, 180],
          ],
          C,
          3,
        );
        line(
          [
            [125, 263],
            [125, 325],
            [690, 325],
            [690, 270],
          ],
          M,
          3,
        );
      }
      resistor(690, 225, `${p.resistance} Ω`, G);
      arrow(645, 180, 0, q.output ? 85 : 0, C);
      text("+", 700, 105, C, 23);
      text("−", 700, 350, C, 23);
      text(`${fmt(q.output)} V`, 600, 85, W, 27);
      text("LOAD", 635, 380, G, 16);
      foot(
        `Mean ${fmt(q.mean)} V · RMS ${fmt(q.rms)} V`,
        `Output pulses ${fmt(q.rippleFrequency)} Hz`,
      );
      break;
    }
    case "filament": {
      title(
        "Filament thermal lab",
        "Glow colour illustrative · coupled electrical / thermal model",
      );
      const heat = Math.max(0, Math.min(1, (q.temperature - 650) / 2300)),
        col = heat > 0.65 ? G : heat > 0.1 ? "#ff895d" : "#7393a6";
      if (heat > 0) {
        const grad = c.createRadialGradient(290, 210, 10, 290, 210, 150);
        grad.addColorStop(0, `rgba(255,155,65,${heat * 0.35})`);
        grad.addColorStop(1, "#ff994400");
        c.fillStyle = grad;
        c.fillRect(130, 50, 320, 320);
      }
      arc(290, 190, 102, Math.PI * 0.72, Math.PI * 2.28, "#aacbd477", 3);
      line(
        [
          [224, 269],
          [248, 320],
          [332, 320],
          [356, 269],
        ],
        "#aacbd477",
        3,
      );
      for (let i = 0; i < 4; i++)
        line(
          [
            [248, 320 + i * 10],
            [332, 320 + i * 10],
          ],
          M,
          5,
        );
      line(
        [
          [265, 320],
          [265, 225],
        ],
        M,
        3,
      );
      line(
        [
          [315, 320],
          [315, 225],
        ],
        M,
        3,
      );
      const pts = Array.from({ length: 101 }, (_, i) => [
        265 + i * 0.5,
        225 + Math.sin((i / 100) * Math.PI * 12) * 13,
      ]);
      c.shadowColor = col;
      c.shadowBlur = heat * 28;
      line(pts, col, 3 + heat * 2);
      c.shadowBlur = 0;
      text(`${fmt(q.temperature, 0)} K`, 540, 130, W, 43);
      text(`${fmt(q.current, 3)} A`, 540, 180, C, 29);
      text(`${fmt(q.resistance, 3)} Ω`, 690, 180, G, 24);
      const total = Math.max(q.input, 1e-20);
      for (const [i, label, key, color] of [
        [0, "Stored thermal energy", "thermal", C],
        [1, "Transferred to surroundings", "loss", G],
      ]) {
        text(label, 500, 240 + i * 65, M, 16);
        rect(500, 252 + i * 65, 280, 13, "#ffffff0b", null, 6);
        rect(
          500,
          252 + i * 65,
          280 * Math.min(1, q[key] / total),
          13,
          color,
          null,
          6,
        );
        text(`${fmt(q[key])} J`, 780, 240 + i * 65, color, 18, "right");
      }
      text(`Electrical input ${fmt(q.input)} J`, 500, 385, W, 19);
      foot(
        `P in ${fmt(q.power)} W · P out ${fmt(q.lossPower)} W`,
        `Energy residual ${fmt(q.balance)} J`,
      );
      break;
    }
    case "cooling": {
      title(
        "Cooling & insulation",
        "Exact lumped Newton cooling · no evaporation",
      );
      rect(160, 135, 220, 225, "#ffffff05", B, 12);
      rect(168, 200, 204, 152, "#349fb64f", null, 5);
      line(
        [
          [157, 135],
          [383, 135],
        ],
        W,
        4,
      );
      for (let i = 0; i < 35; i++) {
        const x = 185 + (i % 7) * 27 + 3 * Math.sin(t * 0.02 + i),
          y = 222 + Math.floor(i / 7) * 26 + 3 * Math.cos(t * 0.03 + i);
        circle(x, y, 3, G);
      }
      rect(265, 95, 15, 240, "#ffffff0b", W, 7);
      const fraction = (q.temperature - p.ambient) / (p.initial - p.ambient);
      rect(270, 300 - 170 * fraction, 5, 25 + 170 * fraction, G, null, 2);
      circle(272, 325, 13, G);
      for (let i = 0; i < 4; i++) {
        const x = 195 + i * 50;
        arrow(x, 180, 0, -20 - 45 * fraction, G, 2);
      }
      text(`${fmt(q.temperature)} °C`, 535, 150, W, 40);
      text(`Ambient ${p.ambient} °C`, 535, 195, B, 21);
      text(`τ = ${fmt(q.tau)} s`, 535, 250, C, 26);
      text(`Heat transfer ${fmt(q.power)} W`, 535, 290, G, 20);
      text(`t/τ = ${fmt(t / q.tau)}`, 535, 340, M, 19);
      foot(
        `Released ${fmt(q.released / 1000)} kJ`,
        `Remaining excess energy ${fmt(q.remaining / 1000)} kJ`,
      );
      break;
    }
    case "resonance": {
      title(
        "Resonant air column",
        p.mode ? "Closed–open · odd harmonics" : "Open–open · all harmonics",
      );
      const x0 = 85,
        width = 670,
        y0 = 185,
        k = (2 * Math.PI) / q.wavelength;
      line(
        [
          [x0, 120],
          [x0 + width, 120],
        ],
        B,
        4,
      );
      line(
        [
          [x0, 250],
          [x0 + width, 250],
        ],
        B,
        4,
      );
      if (p.mode)
        line(
          [
            [x0, 120],
            [x0, 250],
          ],
          W,
          7,
        );
      for (let i = 0; i < 65; i++) {
        const f = i / 64,
          shape = p.mode
            ? Math.sin(k * p.length * f)
            : Math.cos(k * p.length * f),
          dx = shape * Math.cos(q.phase) * p.amplitude * 2300;
        for (let j = 0; j < 3; j++)
          circle(x0 + f * width + dx, 153 + j * 32, 2.8, C);
      }
      const profile = (pressure, y, col) => {
        const pts = Array.from({ length: 201 }, (_, i) => {
          const a = (k * p.length * i) / 200,
            shape = pressure
              ? p.mode
                ? -Math.cos(a)
                : Math.sin(a)
              : p.mode
                ? Math.sin(a)
                : Math.cos(a);
          return [x0 + (width * i) / 200, y - 24 * shape * Math.cos(q.phase)];
        });
        line(
          [
            [x0, y],
            [x0 + width, y],
          ],
          "#91baff40",
          1,
        );
        line(pts, col, 2);
      };
      profile(false, 300, C);
      profile(true, 365, G);
      text("Displacement", 90, 280, C, 14);
      text("Relative pressure", 90, 345, G, 14);
      line(
        [
          [x0 + p.probe * width, 105],
          [x0 + p.probe * width, 395],
        ],
        "#e7f5ff66",
        1,
        [5, 4],
      );
      text(
        `Probe ${fmt(p.probe)} L`,
        x0 + p.probe * width,
        90,
        W,
        16,
        "center",
      );
      foot(
        `f = ${fmt(q.frequency)} Hz · harmonic ${q.harmonic}`,
        `λ ${fmt(q.wavelength)} m · displacement enlarged`,
      );
      break;
    }
    default:
      drawAdvancedInstrument(lab, kit);
  }
}

// Added below alongside the A Level models, sharing the same state-only contract.
function drawAdvancedInstrument(lab, kit) {
  const {
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
  } = kit;
  title(lab.definition.short, "Calculated instrument · see model assumptions");
  if (lab.type === "photoelectric") {
    rect(90, 95, 670, 265, "#91baff0c", B, 90);
    rect(200, 135, 14, 185, "#637f94", G, 3);
    rect(650, 135, 14, 185, "#637f94", C, 3);
    text("EMITTER", 207, 385, G, 16, "center");
    text("COLLECTOR", 657, 385, C, 16, "center");
    for (let i = 0; i < 6; i++) {
      const x = 70 + i * 12,
        y = 150 + i * 25;
      line(
        [
          [x, 70],
          [198, y],
        ],
        P,
        2,
      );
      arrow(
        198 - (198 - x) * 0.18,
        y - (y - 70) * 0.18,
        (198 - x) * 0.18,
        (y - 70) * 0.18,
        P,
        2,
      );
    }
    if (q.emission)
      for (let i = 0; i < 12; i++) {
        const phase = (t * 0.6 + i / 12) % 1,
          x = 220 + phase * 420,
          y = 160 + (i % 5) * 31;
        circle(x, y, 3, C, true);
      }
    text(`${fmt(q.kineticEV)} eV`, 430, 220, W, 36, "center");
    text(
      q.emission
        ? "maximum electron kinetic energy"
        : "Below threshold: no emission",
      430,
      253,
      q.emission ? M : G,
      17,
      "center",
    );
    text(`${fmt(q.current * 1e9)} nA`, 430, 305, C, 24, "center");
    foot(
      `Threshold ${fmt(q.threshold / 1e14)} × 10¹⁴ Hz`,
      `Stopping potential ${fmt(q.stopping)} V`,
    );
  } else if (lab.type === "bragg") {
    for (let row = 0; row < 4; row++) {
      const y = 160 + row * 48;
      line(
        [
          [245, y],
          [710, y],
        ],
        "#91baff33",
        1,
      );
      for (let j = 0; j < 12; j++) circle(250 + j * 40, y, 5, B);
    }
    const angle = q.angle === null ? 0.25 : (q.angle * Math.PI) / 180,
      ex = 430 + 270 * Math.cos(angle),
      ey = 210 - 270 * Math.sin(angle);
    arrow(80, 210 - 250 * Math.sin(angle), 350, 250 * Math.sin(angle), G, 2);
    arrow(430, 210, ex - 430, ey - 210, C, 2);
    text(
      q.angle === null ? "No permitted Bragg angle" : `θ = ${fmt(q.angle)}°`,
      430,
      105,
      W,
      30,
      "center",
    );
    text("CRYSTAL PLANES · spacing enlarged", 470, 385, M, 16, "center");
    foot(`Electron wavelength ${fmt(q.wavelength * 1e12)} pm`, `2d sin θ = nλ`);
  } else if (lab.type === "polarisation") {
    const centers = [180, 420, 660],
      angles = [0, p.angle, p.thirdAngle],
      count = p.mode ? 3 : 2;
    line(
      [
        [60, 235],
        [790, 235],
      ],
      "#c4a3ff44",
      14,
    );
    for (let i = 0; i < count; i++) {
      const x = centers[i],
        a = (angles[i] * Math.PI) / 180;
      rect(x - 42, 110, 84, 250, "#91baff12", B, 30);
      for (let j = -3; j <= 3; j++)
        line(
          [
            [x + j * 9 - 25 * Math.sin(a), 235 - 90 * Math.cos(a)],
            [x + j * 9 + 25 * Math.sin(a), 235 + 90 * Math.cos(a)],
          ],
          i ? C : G,
          1,
        );
      text(i ? "ANALYSER" : "POLARISER", x, 390, M, 15, "center");
    }
    text(`${fmt(q.output)} W/m²`, 640, 75, W, 30, "center");
    foot(
      `After first polariser: ${fmt(q.first)} W/m²`,
      `Final transmission ${fmt(q.transmission * 100)}%`,
    );
  } else if (lab.type === "selector") {
    rect(140, 110, 560, 18, "#6be5d466", C, 3);
    rect(140, 335, 560, 18, "#ffc58066", G, 3);
    for (let x = 180; x < 690; x += 70) {
      text("⊗", x, 190, "#91baff55", 24);
      arrow(x, 155, 0, 120, C, 1);
    }
    const scale = 1e3;
    const path = lab.definition.path(p, t);
    clampPath(c, 140, 135, 560, 195, () => {
      line(
        path.map((v) => [140 + (560 * v.x) / p.length, 230 - v.y * scale]),
        G,
        3,
      );
      circle(140 + (560 * q.x) / p.length, 230 - q.y * scale, 5, G, true);
    });
    rect(710, 130, 12, 90, "#637f94", M, 2);
    rect(710, 265, 12, 75, "#637f94", M, 2);
    text("EXIT SLIT", 750, 380, M, 14, "center");
    text(`v selected = ${fmt(q.selected)} m/s`, 420, 85, W, 25, "center");
    foot(
      `Electric force ${fmt(q.electric)} N`,
      `Magnetic force ${fmt(q.magnetic)} N · vertical: 1000 px/m`,
    );
  } else if (lab.type === "driven") {
    const y = 220 + q.displacement * Math.min(210, 80 / q.amplitude);
    line(
      [
        [90, 70],
        [310, 70],
      ],
      M,
      5,
    );
    const pts = [[200, 70]];
    for (let i = 0; i < 25; i++)
      pts.push([200 + (i % 2 ? 17 : -17), 80 + (i * (y - 100)) / 24]);
    pts.push([200, y]);
    line(pts, C, 3);
    rect(160, y, 80, 50, "#285069", W, 7);
    arrow(200, y + 60, 0, 30 * Math.cos(2 * Math.PI * p.drive * t), G, 3);
    const xr = 460,
      yr = 305;
    line(
      [
        [xr, 100],
        [xr, yr],
        [780, yr],
      ],
      M,
      1,
    );
    const curve = Array.from({ length: 201 }, (_, i) => {
      const f = 0.1 + (i * 3) / 200,
        den = Math.hypot(
          p.k - p.mass * (2 * Math.PI * f) ** 2,
          p.damping * 2 * Math.PI * f,
        );
      return [xr + i * 1.6, yr - Math.min(190, (p.force / den) * 130)];
    });
    line(curve, C, 3);
    circle(
      xr + ((p.drive - 0.1) / 3) * 320,
      yr - Math.min(190, q.amplitude * 130),
      5,
      G,
      true,
    );
    text("Steady-state response", 620, 355, W, 18, "center");
    text("0.1 → 3.1 Hz · peaks clipped", 620, 385, M, 14, "center");
    foot(
      `Natural f₀ ${fmt(q.natural)} Hz · phase lag ${fmt(q.phaseLag)}°`,
      `Amplitude ${fmt(q.amplitude, 4)} m`,
    );
  } else if (lab.type === "gasprocess") {
    const vol = q.volume / p.volume,
      top = 335 - (200 * vol) / Math.max(1, p.ratio);
    rect(150, 90, 220, 250, "#ffffff05", B, 6);
    rect(155, top, 210, 335 - top, "#6be5d422", null, 0);
    rect(150, top - 8, 220, 16, "#7595aa", W, 3);
    line(
      [
        [260, top - 8],
        [260, 60],
      ],
      W,
      5,
    );
    for (let i = 0; i < 28; i++) {
      const x = 170 + ((i * 47) % 180),
        y = top + 10 + ((i * 31 + t * 40) % Math.max(10, 320 - top));
      circle(x, y, 3, G);
    }
    text(`${fmt(q.pressure / 1000)} kPa`, 490, 140, W, 31);
    text(`${fmt(q.temperature)} K`, 490, 190, C, 27);
    text(`W by gas ${fmt(q.work)} J`, 490, 255, G, 23);
    text(`ΔU ${fmt(q.internal)} J`, 490, 300, B, 23);
    text(`Q into gas ${fmt(q.heat)} J`, 490, 345, P, 23);
    foot("Monatomic ideal gas · quasistatic path", "ΔU = Q − W");
  } else if (lab.type === "blackbody") {
    const col =
      p.temperature < 2200 ? "#ff9655" : p.temperature < 6000 ? G : "#b8d7ff";
    circle(210, 235, 90, col, true);
    text(`${fmt(p.temperature, 0)} K`, 210, 375, W, 27, "center");
    line(
      [
        [390, 345],
        [780, 345],
      ],
      M,
      1,
    );
    const max = lab.definition.spectral(q.peak, p.temperature),
      pts = Array.from({ length: 251 }, (_, i) => {
        const wavelength = 1e-7 * Math.pow(200, i / 250);
        return [
          390 + i * 1.56,
          345 -
            (225 * lab.definition.spectral(wavelength, p.temperature)) / max,
        ];
      });
    line(pts, col, 3);
    text("0.1 μm", 390, 375, M, 14);
    text("20 μm · logarithmic λ", 780, 375, M, 14, "right");
    text(`λ peak ${fmt(q.peak * 1e9)} nm`, 580, 85, W, 27, "center");
    foot(
      `Total emitted power ${fmt(q.power)} W`,
      `Emissivity ${fmt(p.emissivity)}`,
    );
  } else if (lab.type === "materials") {
    const extScale =
        120 / Math.max((p.force * p.length) / (p.area * p.young), 1e-12),
      end = 180 + q.extension * extScale;
    line(
      [
        [140, 80],
        [470, 80],
      ],
      W,
      5,
    );
    rect(286, 80, 28, end - 80, "#91baff55", B, 2);
    rect(250, end, 100, 48, "#285069", W, 5);
    arrow(300, end + 52, 0, 42, G);
    text(`${fmt(q.force)} N`, 365, end + 28, G, 21);
    text(`${fmt(q.stress / 1e6)} MPa`, 540, 155, W, 33);
    text("Tensile stress", 540, 185, M, 17);
    text(`${fmt(q.strain * 100, 4)} %`, 540, 245, C, 28);
    text("Tensile strain", 540, 275, M, 17);
    text(`Extension ${fmt(q.extension * 1000)} mm`, 540, 340, G, 22);
    foot(
      `Young modulus ${fmt(p.young / 1e9)} GPa`,
      "Elastic region only · extension enlarged",
    );
  }
}
function clampPath(c, x, y, w, h, fn) {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  fn();
  c.restore();
}
export function practicalThumbnail(id) {
  const paths = {
    hydraulics:
      "M80 45v90h70V45m95-20v110h90V25M80 85h70m95-30h90M115 135v15h175v-15",
    hooke:
      "M80 25h230M190 25v15l-16 10 32 10-32 10 32 10-32 10 16 10v15m-35 0h70v30h-70z",
    sensors: "M90 30h160v110H90zm125 20h70v25h-70zm0 55h70v25h-70zM250 90h80",
    radiation: "M65 85h260M65 85q90-90 230-45M65 85q65 110 65 0q-65-70-65 0",
    rectifier: "M60 85h90m0-30v60l60-30zm65-30v60m0-30h110",
    filament:
      "M155 115q-80-100 40-100 120 0 40 100l-10 30h-60zM175 115V70l10-10 10 20 10-20 10 10v45",
    cooling:
      "M100 35v110h190V35m-190 55h190M190 45v70m-30-50V25m-10 12 10-12 10 12m40 28V25",
    resonance: "M50 35h285M50 135h285M50 85q35-70 70 0t70 0t70 0t70 0",
    photoelectric: "M80 120V35m230 0v85M90 85h210M90 85l-40-50m0 0h25m-25 0v25",
    bragg: "M100 75h230m-230 30h230m-230 30h230M55 25l140 80L335 25",
    polarisation: "M90 30v115m100-115v115m100-115v115M50 85h290",
    selector: "M65 45h260M65 130h260M65 85h260m-30-15 30 15-30 15",
    driven: "M60 135q40-10 65-50t40-55 40 55 40 50h75",
    gasprocess: "M105 25v120h180V25M105 75h180m-90 0V20",
    blackbody: "M50 140q15-130 70-100t200 100M50 140h280",
    materials: "M90 25h210M180 25v80h30V25m-50 80h70v40h-70z",
  };
  return `<svg viewBox="0 0 390 170" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="${paths[id]}"/></svg>`;
}
