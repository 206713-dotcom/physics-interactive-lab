/** Canvas companions to the 3D optics benches. Geometry and field amplitudes
 * are shared constructions, never independently fitted experimental results. */
import { mirrorConstruction, dispersionConstruction, dispersionFronts,
  polarisationConstruction } from "./optical-construction.js";
import { wavelengthRGB, paperInk } from "./diagram-theme.js";

const TEAL = "#087d79", GOLD = "#a77827", PURPLE = "#7953a3", INK = "#3f647a", MUTED = "#6a899b";
const point = ([x, y]) => [420 + x * 65, 400 - y * 65];
function path(kit, points, color, dashed = false, moving = false) {
  const points2 = points.map(point);
  kit.line(points2, color, dashed ? 1.8 : 3, dashed ? [6, 5] : []);
  if (moving) {
    for (let i = 1; i < points2.length; i++) {
      const a = points2[i - 1], b = points2[i], u = ((kit.t * 0.26) % 1 + 1) % 1,
        length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (length > 10) kit.arrow(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u,
        (b[0] - a[0]) / length * 10, (b[1] - a[1]) / length * 10, color, 2);
    }
  }
}
function mirror(kit, x, bottom, top) {
  const a = point([x, bottom]), b = point([x, top]);
  kit.line([a, b], "#7299af", 5);
  for (let y = b[1] + 5; y < a[1]; y += 14) kit.line([[a[0] + 3, y], [a[0] + 12, y - 7]], "#9cb8c7", 1);
}
function worldText(kit, text, x, y, color = INK, size = 16, width = 200) {
  kit.text(text, ...point([x, y]), color, size, "center", width);
}

export function drawMirrorBench(kit) {
  const { p, title, line, arrow, foot, arc } = kit, q = mirrorConstruction(p), moving = kit.vectors !== false;
  title("Reflection & virtual images", "Two constructions · one plane mirror");
  line([[433, 80], [433, 395]], "#b5cbd9", 1);
  worldText(kit, "01  REFLECTION LAW", -2.5, 4.85, TEAL, 16, 285);
  worldText(kit, "02  VIRTUAL IMAGE", 2.7, 4.85, PURPLE, 16, 285);
  mirror(kit, q.hit[0], 0.7, 4.5);
  path(kit, [[-4.8, q.hit[1]], q.hit], MUTED, true);
  const [cx, cy] = point(q.hit), a = p.angle * Math.PI / 180;
  for (let d = -90; d <= 90; d += 5) {
    const angle = Math.PI + d * Math.PI / 180, r = d % 30 === 0 ? 123 : 128;
    line([[cx + r * Math.cos(angle), cy + r * Math.sin(angle)],
      [cx + 130 * Math.cos(angle), cy + 130 * Math.sin(angle)]], "#afc4d2", 1);
  }
  path(kit, q.incident, GOLD, false, moving); path(kit, q.reflected, TEAL, false, moving);
  arc(cx, cy, 37, Math.PI, Math.PI + a, GOLD, 2);
  arc(cx, cy, 49, Math.PI - a, Math.PI, TEAL, 2);
  worldText(kit, "Normal", -4.0, 2.92, MUTED, 14, 100);
  worldText(kit, `i = ${p.angle.toFixed(0)}°`, -3.7, 0.78, GOLD, 21, 125);
  worldText(kit, `r = ${p.angle.toFixed(0)}°`, -1.3, 0.78, TEAL, 21, 125);
  mirror(kit, q.mirrorX, 1.85, 4.1);
  q.rays.forEach(ray => path(kit, ray, GOLD, false, moving));
  q.extensions.forEach(ray => path(kit, ray, PURPLE, true));
  for (const [v, color] of [[q.object, TEAL], [q.image, PURPLE]]) {
    const base = point([v[0], q.axis]); arrow(...base, 0, -q.height * 65, color, 5);
  }
  worldText(kit, "Object", 1.05, 4.3, TEAL, 17, 110);
  worldText(kit, "Virtual image", 4.05, 4.3, PURPLE, 17, 130);
  worldText(kit, "Mirror", q.mirrorX, 1.65, MUTED, 13, 85);
  for (const [a, b] of [[q.object[0], q.mirrorX], [q.mirrorX, q.image[0]]]) {
    path(kit, [[a, 1.35], [b, 1.35]], MUTED);
    for (const x of [a, b]) path(kit, [[x, 1.27], [x, 1.43]], MUTED);
  }
  worldText(kit, `${p.distance.toFixed(2)} m in front`, 1.15, 0.85, TEAL, 16, 175);
  worldText(kit, `${p.distance.toFixed(2)} m behind`, 4.0, 0.85, PURPLE, 16, 175);
  foot("i = r · measured from the normal", "Dashed lines are back projections, not light");
}

export function drawDispersionBench(kit) {
  const { c, p, t, title, line, rect, foot, text } = kit, q = dispersionConstruction(p),
    rgb = wavelengthRGB(p.wavelength * 1e9), color = paperInk(`rgb(${rgb.map(v => Math.round(v * 255)).join(",")})`),
    edge = point(q.hit)[0];
  title("Dispersion at one interface", "Air → material · no prism or second face");
  rect(edge, 110, point([1.35, 0])[0] - edge, 258, "#d3e9ed", null, 0);
  path(kit, [[-1.5, 0.5], [-1.5, 4.35]], INK);
  path(kit, [[-4.8, 2.2], [1.3, 2.2]], MUTED, true);
  line([[527, 80], [527, 390]], "#b5cbd9", 1);
  path(kit, q.incident, color); path(kit, q.transmitted, color);
  for (const medium of [false, true]) for (const front of dispersionFronts(q, t, medium)) path(kit, front, color);
  worldText(kit, "Air", -3.9, 1.35, INK, 18);
  worldText(kit, "Material", -0.05, 4.12, INK, 18);
  worldText(kit, "Normal", -4.0, 1.94, MUTED, 14, 110);
  worldText(kit, `i = ${p.angle.toFixed(1)}°`, -3.75, 4.25, GOLD, 17, 140);
  worldText(kit, `r = ${q.refraction.toFixed(2)}°`, 0.1, 0.68, TEAL, 17, 140);
  const [cx, cy] = point(q.hit);
  c.beginPath(); c.arc(cx, cy, 37, Math.PI, Math.PI + p.angle * Math.PI / 180); c.strokeStyle = GOLD; c.lineWidth = 2; c.stroke();
  c.beginPath(); c.arc(cx, cy, 44, 0, q.refraction * Math.PI / 180); c.strokeStyle = TEAL; c.stroke();
  const x = 661;
  text("SELECTED WAVELENGTH", x, 99, MUTED, 14, "center", 230);
  text(`${Math.round(p.wavelength * 1e9)} nm`, x, 139, color, 31, "center", 230);
  text(`n = ${q.index.toFixed(4)}`, x, 178, INK, 21, "center", 230);
  text(`λ in material  ${(q.wavelength * 1e9).toFixed(1)} nm`, x, 213, INK, 16, "center", 230);
  text(`v = ${(q.speed / 1e8).toFixed(3)} × 10⁸ m/s`, x, 245, INK, 17, "center", 230);
  text("COMPARE REFRACTION", x, 289, MUTED, 14, "center", 230);
  q.references.forEach((ref, i) => {
    const col = paperInk(`rgb(${wavelengthRGB(ref.nm).map(v => Math.round(v * 255)).join(",")})`);
    text(`${ref.nm} nm    ${ref.refraction.toFixed(2)}°`, x, 319 + 29 * i, col, 17, "center", 230);
  });
  foot("Closer fronts · slower light", "Frequency stays the same across the boundary");
}

export function drawPolarisationBench(kit) {
  const { c, p, t, title, text, line, rect, foot } = kit, q = polarisationConstruction(p),
    xs = q.xs.map(x => 420 + x * 66), centerY = 239, lastX = 785;
  title("Polarisation bench", "Field amplitude ∝ √intensity · optical time slowed");
  const segment = (a, b, amplitude, angle, intensity) => {
    if (intensity === 0) { line([[a, centerY], [b, centerY]], "#c2d1dc", 1, [4, 5]); return; }
    const relative = Math.sqrt(intensity / p.intensity);
    line([[a, centerY], [b, centerY]], `rgba(25,151,142,${0.1 + relative * 0.28})`, 35 * relative + 2);
    const points = Array.from({ length: 141 }, (_, j) => {
      const x = a + (b - a) * j / 140,
        // Oblique projection displays both transverse components. Signed field
        // projections are shared with the 3D bench, including phase reversal.
        phase = 2 * Math.PI * ((x - 420) / 66) / 1.7 - t * 3,
        e = 51 * amplitude * Math.sin(phase), rad = angle * Math.PI / 180;
      return [x + 0.3 * e * Math.sin(rad), centerY - e * Math.cos(rad) + 0.25 * e * Math.sin(rad)];
    });
    line(points, TEAL, 2.5);
  };
  // The varied input marks represent unpolarised light qualitatively.
  for (let i = 0; i < 14; i++) {
    const x = 63 + ((t * 0.12 + i / 14) % 1) * (xs[0] - 78), a = i * 2.39996 + t * 0.7;
    line([[x - 9 * Math.sin(a), centerY - 15 * Math.cos(a)], [x + 9 * Math.sin(a), centerY + 15 * Math.cos(a)]], GOLD, 1.5);
  }
  q.xs.forEach((_, i) => segment(xs[i] + 10, (xs[i + 1] ?? lastX) - 10, q.amplitudes[i], q.angles[i], q.intensities[i]));
  xs.forEach((x, i) => {
    rect(x - 10, 139, 20, 200, "#c5e2e7aa", "#648da2", 7);
    // A face-on inset makes the transmission axis readable even at 90°.
    c.beginPath(); c.arc(x, 115, 34, 0, 2 * Math.PI); c.fillStyle = "#e3eff4"; c.fill(); c.strokeStyle = "#6e94a9"; c.lineWidth = 2; c.stroke();
    const a = q.angles[i] * Math.PI / 180;
    line([[x - 28 * Math.sin(a), 115 + 28 * Math.cos(a)], [x + 28 * Math.sin(a), 115 - 28 * Math.cos(a)]], i === 1 && p.mode ? GOLD : TEAL, 4);
    text(`${q.angles[i].toFixed(0)}°`, x, 170, INK, 17, "center", 115);
    text(i ? "ANALYSER" : "POLARISER", x, 368, MUTED, 13, "center", 150);
    text(`${q.intensities[i].toFixed(2)} W/m²`, x, 393, TEAL, 18, "center", 170);
  });
  if (!p.mode) { rect(388, 193, 64, 91, "#dce7ef44", "#a8becd", 10); text("No middle filter", 420, 322, MUTED, 14, "center", 175); }
  text("Unpolarised", 122, 187, GOLD, 14, "center", 145);
  const glow = Math.min(1, Math.sqrt(q.output / 500));
  if (glow > 0) {
    const g = c.createRadialGradient(lastX, centerY, 0, lastX, centerY, 59);
    g.addColorStop(0, `rgba(41,207,181,${glow * 0.8})`); g.addColorStop(1, "rgba(41,207,181,0)");
    c.fillStyle = g; c.fillRect(lastX - 59, centerY - 59, 118, 118);
  }
  rect(lastX - 8, 202, 16, 74, q.output === 0 ? "#19394d" : `rgba(8,125,121,${0.25 + glow * 0.75})`, "#3f647a", 4);
  text(q.output === 0 ? "BLOCKED" : "SCREEN", lastX, 319, q.output === 0 ? PURPLE : TEAL, 13, "center", 97);
  foot(`Final output ${q.output.toFixed(2)} W/m²`, `${(q.transmission * 100).toFixed(1)}% of incident intensity`);
}
