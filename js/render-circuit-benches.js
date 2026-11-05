/** Circuit symbols and paths read the same instantaneous sample as the graphs. */
import { transformerVisual } from "./transformer-visual.js";
function flatDisk(c, x, y, radius, fill, stroke) {
  c.beginPath();
  c.arc(x, y, radius, 0, 2 * Math.PI);
  c.fillStyle = fill; c.fill();
  c.strokeStyle = stroke; c.lineWidth = 2.5; c.stroke();
}

export function drawRectifierBench({c, p, q, t, text, line, arrow, rect, circle, fmt, title, foot}) {
  title("Rectification bench", p.mode ? "Full-wave bridge · ideal diodes" : "Half-wave · ideal diode");
  const sign = Math.abs(q.input) < p.peak * 1e-10 ? 0 : Math.sign(q.input),
    active = sign > 0 || (p.mode && sign < 0),
    teal = "#168e87", muted = "#8096a4", purple = "#795b9d", gold = "#b37c32",
    A = [305, 225], B = [500, 225], P = [402.5, 125], N = [402.5, 325],
    top = [[105, 187], [105, 125], [240, 125], [240, 225], A],
    bottom = [[105, 263], [105, 370], [550, 370],
      ...Array.from({ length: 13 }, (_, i) => {
        const angle = Math.PI / 2 - i * Math.PI / 12;
        return [550 + 11 * Math.cos(angle), 325 + 11 * Math.sin(angle)];
      }), [550, 225], B],
    load = [P, [680, 125], [680, 325], N];
  const flow = points => {
    if (!active) return;
    const lengths = points.slice(1).map((b, i) => Math.hypot(b[0] - points[i][0], b[1] - points[i][1]));
    const total = lengths.reduce((a, b) => a + b, 0);
    for (let i = 0; i < 13; i++) {
      let distance = ((i / 13 + t * p.frequency * 0.65) % 1) * total, part = 0;
      while (part < lengths.length - 1 && distance > lengths[part]) distance -= lengths[part++];
      const a = points[part], b = points[part + 1], f = distance / lengths[part],
        dx = (b[0] - a[0]) / lengths[part], dy = (b[1] - a[1]) / lengths[part];
      arrow(a[0] + f * (b[0] - a[0]) - dx * 4, a[1] + f * (b[1] - a[1]) - dy * 4,
        dx * 8, dy * 8, gold, 2);
    }
  };
  function diode(a, b, label, polarity) {
    const conducts = active && sign === polarity, color = conducts ? teal : muted;
    const x = (a[0] + b[0]) / 2, y = (a[1] + b[1]) / 2;
    c.save();
    c.translate(x, y);
    c.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]));
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    line([[-length / 2, 0], [-12, 0]], color, 3);
    line([[12, 0], [length / 2, 0]], color, 3);
    line([[-12, -12], [-12, 12], [10, 0], [-12, -12]], color, 2.5);
    line([[12, -15], [12, 15]], color, 3);
    c.restore();
    text(label, x + (x < 402 ? -20 : 20), y - 13, color, 16, "center");
  }
  rect(40, 70, 760, 332, "#e7f0f6", "#bfd2de", 12);
  flatDisk(c, 105, 225, 38, "#f8fcff", purple);
  text("~", 105, 236, purple, 40, "center");
  text("AC source", 105, 304, purple, 16, "center");
  text(fmt(sign ? q.input : 0) + " V", 105, 334, purple, 22, "center");
  text(sign < 0 ? "−" : "+", 82, 175, purple, 20, "center");
  text(sign < 0 ? "+" : "−", 82, 280, purple, 20, "center");
  if (p.mode) {
    line(top, purple, 2.5);
    diode(A, P, "D1", 1); diode(B, P, "D2", -1);
    diode(N, A, "D3", -1); diode(N, B, "D4", 1);
    line([P, [680, 125], [680, 190]], teal, 3);
    line([[680, 260], [680, 325], N], teal, 3);
    // A background halo at the crossover makes the unconnected wire jump clear.
    line(bottom, "#e7f0f6", 8);
    line(bottom, purple, 2.5);
    for (const [x, y] of [A, B, P, N]) circle(x, y, 4, "#375c71");
    if (sign > 0) flow([...top, ...load, ...bottom.slice().reverse()]);
    else if (sign < 0) flow([...bottom, ...load, ...top.slice().reverse()]);
  } else {
    line([[105, 187], [105, 125], [290, 125]], purple, 2.5);
    diode([290, 125], [460, 125], "D1", 1);
    line([[460, 125], [680, 125], [680, 190]], teal, 3);
    line([[680, 260], [680, 325], [105, 325], [105, 263]], teal, 3);
    flow([[105, 187], [105, 125], [680, 125], [680, 325], [105, 325], [105, 263]]);
    text(sign < 0 ? "Blocked half-cycle" : sign ? "Diode conducts" : "Zero crossing",
      405, 225, sign > 0 ? teal : purple, 22, "center");
  }
  // Redraw the load over schematic markers so its symbol stays legible.
  rect(668, 190, 24, 70, "#d1ebe7", teal, 3);
  text(fmt(p.resistance) + " Ω", 715, 232, teal, 17);
  if (active) arrow(641, 193, 0, 62, teal, 3);
  text("+", 697, 126, teal, 22);
  text("−", 697, 332, teal, 22);
  text("Load " + fmt(active ? q.output : 0) + " V", 658, 93, teal, 22, "center");
  text(fmt(active ? q.current * 1000 : 0) + (active ? " mA ↓" : " mA"), 675, 371, teal, 21, "center");
  foot(p.mode ? "Current keeps the same direction through the load" : "Current flows only on positive half-cycles",
    "Output pulses " + fmt(q.rippleFrequency) + " Hz");
}

export function drawSensorBench({c, p, q, text, line, arrow, rect, circle, fmt, title, foot}) {
  title(p.mode ? "NTC temperature sensor" : "Light sensor", "Unloaded divider · ideal comparator");
  const x = 420, tap = 230, sensorY = p.orientation ? 151 : 309,
    fixedY = p.orientation ? 309 : 151, teal = "#168e87", purple = "#795b9d", gold = "#b37c32";
  rect(38, 80, 222, 302, "#e8f1f7", "#c1d5e0", 12);
  if (p.mode) {
    rect(128, 143, 18, 152, "#c4d5e3", "#9eb7cb", 8);
    const height = 130 * p.temperature / 80;
    rect(132, 290 - height, 10, height + 4, gold, null, 4);
    circle(137, 304, 19, gold);
    text(fmt(p.temperature) + " °C", 150, 352, purple, 25, "center");
  } else {
    const light = Math.log10(p.lux + 1) / Math.log10(1001);
    circle(148, 230, 20 + 17 * light, "#c8a05a", true);
    for (let i = 0; i < 10; i++) {
      const angle = i * Math.PI / 5;
      line([[148 + 49 * Math.cos(angle), 230 + 49 * Math.sin(angle)],
        [148 + (53 + 19 * light) * Math.cos(angle), 230 + (53 + 19 * light) * Math.sin(angle)]], gold, 2.5);
    }
    text(fmt(p.lux) + " lux", 148, 352, purple, 25, "center");
  }
  text("Environment", 150, 113, "#46677e", 17, "center");
  const arm = (y, sensor) => {
    rect(x - 12, y - 27, 24, 54, sensor ? "#e3daf1" : "#e8dcbe", sensor ? purple : gold, 3);
    text(sensor ? (p.mode ? "NTC" : "LDR") : "Fixed", x + 27, y - 12, sensor ? purple : gold, 17);
    text(fmt((sensor ? q.resistance : p.fixed) / 1000) + " kΩ", x + 27, y + 15, sensor ? purple : gold, 17);
    if (sensor && !p.mode) {
      for (const offset of [0, 18]) arrow(x - 64 + offset, y - 49, 23, 23, gold, 1.7);
    }
    if (sensor && p.mode) line([[x - 22, y + 21], [x + 21, y - 21], [x + 31, y - 21]], purple, 2);
  };
  line([[308, 179], [308, 100], [x, 100], [x, 124]], "#4d7187", 2.5);
  line([[x, 178], [x, 282]], "#4d7187", 2.5);
  line([[x, 336], [x, 365], [308, 365], [308, 255]], "#4d7187", 2.5);
  flatDisk(c, 308, 217, 38, "#f8fcff", "#567487");
  text("+", 308, 208, "#416980", 20, "center");
  text("−", 308, 234, "#416980", 20, "center");
  text(fmt(p.voltage) + " V", 308, 296, "#416980", 20, "center");
  arm(fixedY, false); arm(sensorY, true);
  circle(x, tap, 4.5, gold);
  line([[x, tap], [580, tap]], gold, 3);
  line([[x, 365], [580, 365], [580, 279]], "#768e9d", 1.5, [5, 4]);
  text("0 V reference", 438, 389, "#567487", 15);
  rect(580, 121, 164, 182, "#f9fcfe", "#9abcc9", 12);
  text("OUTPUT", 662, 149, teal, 15, "center");
  text(fmt(q.output, 3) + " V", 662, 188, teal, 27, "center");
  text("Threshold", 662, 222, "#58758b", 15, "center");
  text(fmt(p.threshold) + " V", 662, 247, gold, 20, "center");
  circle(625, 278, 8, q.on ? teal : "#aabfc8", !!q.on);
  text(q.on ? "ON" : "OFF", 670, 284, q.on ? teal : "#718b9c", 20, "center");
  text("Ideal threshold indicator", 662, 335, "#567487", 15, "center");
  const max = Math.max(p.voltage, p.threshold), level = 158 * q.output / max,
    threshold = 299 - 158 * p.threshold / max;
  rect(763, 141, 12, 158, "#d4e3ed", null, 3);
  rect(763, 299 - level, 12, level, teal, null, 3);
  line([[754, threshold], [785, threshold]], gold, 2.5);
  foot("Sensor " + fmt(q.resistance / 1000) + " kΩ", "Divider current " + fmt(q.current * 1000, 3) + " mA");
}

export function drawTransformerBench({c, p, q, t, text, line, arrow, rect, fmt, title, foot}) {
  title("Ideal AC transformer", "RMS readouts · illustrative AC phase");
  const gold = "#aa7329", teal = "#117f77", purple = "#8664af", steel = "#638093",
    visual = transformerVisual(t), sign = Math.sign(visual.voltage);
  rect(220, 104, 400, 278, "#b8ccd7", steel, 9);
  rect(296, 163, 248, 159, "#eff6fa", steel, 6);
  for (let y = 109; y < 131; y += 5) line([[228, y], [612, y]], "#819cab", 1);
  for (let y = 355; y < 377; y += 5) line([[228, y], [612, y]], "#819cab", 1);
  function coil(x, turns, color, angle0) {
    const n = Math.max(4, Math.min(24, Math.round(turns / 50))), samples = n * 20;
    const points = Array.from({ length: samples + 1 }, (_, i) => {
      const u = i / samples, angle = angle0 + u * n * 2 * Math.PI;
      return [x + 45 * Math.cos(angle), 337 - u * 200 + 6 * Math.sin(angle)];
    });
    line(points, color, 3.5);
    return { bottom: points[0], top: points.at(-1) };
  }
  const primary = coil(258, p.np, gold, Math.PI), secondary = coil(582, p.ns, teal, 0);
  line([primary.top, [80, 137], [80, 208]], gold, 2.5);
  line([[80, 272], [80, 337], primary.bottom], gold, 2.5);
  flatDisk(c, 80, 240, 32, "#fbfdff", gold);
  text("~", 80, 253, gold, 35, "center");
  line([secondary.top, [754, 137], [754, 212]], teal, 2.5);
  line([[754, 272], [754, 337], secondary.bottom], teal, 2.5);
  rect(743, 212, 22, 60, "#c7e6df", teal, 3);
  text("Primary · " + p.np + " turns", 182, 85, gold, 19, "center");
  text("Secondary · " + p.ns + " turns", 658, 85, teal, 19, "center");
  text(fmt(p.vp) + " V a.c.", 109, 174, gold, 20, "center");
  text(fmt(q.ip) + " A a.c.", 109, 374, gold, 18, "center");
  text(fmt(q.vs) + " V a.c.", 711, 174, teal, 20, "center");
  text(fmt(q.is) + " A a.c.", 711, 374, teal, 18, "center");
  text(fmt(p.load) + " Ω", 754, 307, teal, 17, "center");
  line([[330, 134], [510, 134]], purple, 1.4, [5, 5]);
  line([[510, 352], [330, 352]], purple, 1.4, [5, 5]);
  arrow(420 - 45 * visual.flux, 134, 90 * visual.flux, 0, purple, 3);
  arrow(420 + 45 * visual.flux, 352, -90 * visual.flux, 0, purple, 3);
  text("Shared changing flux", 420, 209, purple, 18, "center");
  text("Nₛ / Nₚ = " + fmt(q.ratio), 420, 247, "#365c74", 24, "center");
  text("Separate circuits", 420, 286, "#56768a", 17, "center");
  if (sign) {
    arrow(145 - 20 * sign, 137, 40 * sign, 0, gold, 3);
    arrow(692 - 20 * sign, 137, 40 * sign, 0, teal, 3);
  }
  foot("Ideal power " + fmt(q.input) + " W in = " + fmt(q.output) + " W out",
    "Line-loss estimate " + fmt(q.loss) + " W · separate comparison");
}

export function drawDeviceBench({c, p, q, text, line, arrow, rect, fmt, title, foot}) {
  const teal = "#168e87", purple = "#795b9d", gold = "#b37c32",
    conducting = Math.abs(q.current) > 1e-12, closed = Boolean(q.on), sign = Math.sign(q.current);
  title(["Diode + resistor", "Ideal voltage-operated relay", "Ideal overcurrent cut-out"][p.mode],
    p.mode === 0 ? "0.7 V forward-drop model" : "Instantaneous switching model");
  rect(40, 78, 760, 322, "#e7f0f6", "#bfd2de", 12);
  line([[105, 193], [105, 130], [330, 130]], gold, 3);
  line([[485, 130], [682, 130], [682, 198]], teal, 3);
  line([[682, 264], [682, 349], [105, 349], [105, 257]], teal, 3);
  flatDisk(c, 105, 225, 32, "#fbfdff", "#58758b");
  text(p.voltage < 0 ? "−" : "+", 105, 218, "#416980", 22, "center");
  text(p.voltage < 0 ? "+" : "−", 105, 244, "#416980", 22, "center");
  text(fmt(Math.abs(p.voltage)) + " V", 105, 303, "#416980", 21, "center");
  rect(670, 198, 24, 66, "#cbe6df", teal, 3);
  text(fmt(p.resistance) + " Ω", 730, 237, teal, 18, "center");
  text(fmt(q.current * 1000) + " mA", 674, 99, teal, 22, "center");
  text(fmt(q.current ** 2 * p.resistance) + " W in load", 661, 383, teal, 17, "center");
  if (conducting) {
    arrow(609, 231 - sign * 25, 0, sign * 50, teal, 3);
    arrow(218 - sign * 22, 130, sign * 44, 0, gold, 3);
  }
  if (p.mode === 0) {
    const color = conducting ? teal : "#7a8d9f";
    line([[330, 130], [392, 130]], color, 3);
    line([[392, 112], [392, 148], [421, 130], [392, 112]], color, 2.5);
    line([[424, 109], [424, 151]], color, 3);
    line([[424, 130], [485, 130]], color, 3);
    text("Anode", 340, 172, "#627b8e", 16, "center");
    text("Cathode", 477, 172, "#627b8e", 16, "center");
  } else {
    line([[330, 130], [356, 130], [454, closed ? 130 : 93]], closed ? teal : gold, 4);
    line([[460, 130], [485, 130]], teal, 3);
    flatDisk(c, 356, 130, 4, "#f9fcfe", "#58758b");
    flatDisk(c, 460, 130, 4, "#f9fcfe", "#58758b");
    line([[408, 195], [408, 145]], purple, 1.5, [4, 4]);
  }
  rect(249, 204, 310, 115, "#f8fcfe", "#bfd2de", 10);
  const state = p.mode === 0 ? conducting ? "Forward biased · current flows"
    : p.voltage < 0 ? "Reverse biased · blocked" : "Below forward drop · blocked"
    : closed ? conducting ? "Contact closed · current flows" : "Contact closed · no current"
    : p.mode === 2 ? "Contact open · overcurrent" : "Contact open · below pick-up";
  text(state, 404, 240, conducting ? teal : "#936c38", 18, "center", 300);
  text(p.mode === 0 ? "Diode voltage " + (conducting ? "0.7" : fmt(p.voltage)) + " V"
    : p.mode === 1 ? fmt(p.voltage) + " V control / " + fmt(p.threshold) + " V pick-up"
    : "|Demand| " + fmt(Math.abs(p.voltage / p.resistance) * 1000) + " mA / " + fmt(p.rating * 1000) + " mA rating",
    404, 284, purple, 17, "center", 300);
  foot("Supply power " + fmt(q.power) + " W", p.mode === 2
    ? "Ideal cut-out recloses below its current limit" : p.mode === 1 ? "Positive-voltage control · coil current omitted" : "Reverse breakdown is omitted");
}
