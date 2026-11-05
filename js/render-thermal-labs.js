import { chamberParticle, gasParticleMotion, gasParticleCount, particleChamberWidth, PARTICLE_CHAMBER,
  convectionPosition, heatSlabGeometry, heatMarkerPhase, radiationMarkerAmplitude } from "./thermal-geometry.js";

export function drawParticleBench({c, p, q, t, text, line, arrow, rect, circle, fmt, title, foot, vectors = true}) {
  const gas = p.state === 2, width = particleChamberWidth(gas ? p.volume : 0.024);
  const scale = 85, left = 110, bottom = 363, height = PARTICLE_CHAMBER.height * scale;
  const project = ([x, y]) => [left + x * scale, bottom - y * scale];
  title(["Solid particles", "Liquid particles", "Gas particles"][p.state], "Particles enlarged · motion slowed");
  rect(left, bottom - height, width * scale, height, "#e2eff566", "#7396ab", 3);
  line([[left + width * scale, bottom - height], [left + width * scale, bottom]], "#b38139", 6);
  const count = gas ? gasParticleCount(p.amount) : 72;
  if (!gas && p.state === 0) {
    const rest = Array.from({ length: 72 }, (_, i) => [left + (0.09 + (0.14 + i % 6 * 0.14) * (width - 0.18)) * scale,
      bottom - (0.09 + (0.15 + Math.floor(i / 18) * 0.12) * (PARTICLE_CHAMBER.height - 0.18)) * scale]);
    for (let i = 0; i < 72; i++) {
      if (i % 6 < 5) line([rest[i], rest[i + 1]], "#8fa8be", 1);
      if (i + 18 < 72) line([rest[i], rest[i + 18]], "#8fa8be", 1);
    }
  }
  for (let i = 0; i < count; i++) {
    let position;
    if (gas) position = gasParticleMotion(i, t, p.temperature, p.volume).position;
    else {
      const [x, y] = chamberParticle(i, t, p.temperature, p.state);
      position = [0.09 + x * (width - 0.18), 0.09 + y * (PARTICLE_CHAMBER.height - 0.18)];
    }
    const [x, y] = project(position);
    circle(x, y, 3.7, p.state === 0 ? "#4f7cb1" : "#168e87");
  }
  let collision = false;
  if (gas) {
    const tracked = gasParticleMotion(0, t, p.temperature, p.volume), [x, y] = project(tracked.position);
    circle(x, y, 5.8, "#b38139");
    if (vectors) arrow(x, y, tracked.velocity[0] * scale * 0.38, -tracked.velocity[1] * scale * 0.38, "#b38139", 2.5);
    collision = tracked.collision.age <= t && tracked.collision.age < 0.14 && tracked.collision.axis < 2;
    if (collision && vectors) {
      const [cx, cy] = project(tracked.collision.position);
      c.beginPath(); c.arc(cx, cy, 12, 0, 2 * Math.PI);
      c.strokeStyle = "#b38139"; c.lineWidth = 2; c.stroke();
    }
    for (const litres of [5, 15, 25, 35, 50]) {
      const x = left + 5.4 * litres / 50 * scale;
      line([[x, 375], [x, 383]], "#7898aa", 1);
      text(litres + " L", x, 404, "#56768a", 13, "center");
    }
  }
  rect(617, 100, 184, 280, "#f8fcfe", "#b8cddc", 12);
  text(gas ? "Pressure" : "Particle view", 709, 135, "#58768a", 18, "center");
  text(gas ? fmt(q.pressure / 1000) + " kPa" : ["Solid", "Liquid"][p.state], 709, 180, "#117f77", 26, "center");
  text("Temperature", 709, 230, "#58768a", 17, "center");
  text(fmt(p.temperature) + " K", 709, 269, "#a8772e", 27, "center");
  text(gas ? fmt(p.volume * 1000) + " L" : "Not applied", 709, 335, "#58768a", gas ? 24 : 18, "center", 170);
  foot(gas ? collision ? "Wall collision · particle rebounds" : vectors ? "Gold particle · velocity arrow enlarged" : "Gas particles move and rebound"
    : "Conceptual arrangement · no gas-law pressure", gas ? "Pressure is calculated independently of these dots" : "Temperature controls illustrative particle motion");
}

export function drawHeatTransferBench({c, p, q, t, text, line, arrow, rect, circle, fmt, title, foot, vectors = true}) {
  const gold = "#b37c32", teal = "#168e87", blue = "#4f7cb1", muted = "#58778b";
  title(["Conduction through a solid", "Convection in a fluid", "Radiation across a gap"][p.mode],
    "Reservoir temperatures held constant");
  rect(58, 109, 140, 266, "#f4e8ce", gold, 10);
  rect(642, 109, 140, 266, "#dbe8f7", blue, 10);
  text(p.hot + " °C", 128, 91, gold, 24, "center");
  text(p.cold + " °C", 712, 91, blue, 24, "center");
  if (p.mode === 0) {
    const { length, side } = heatSlabGeometry(p);
    const width = length * 75, height = side * 62, x0 = 420 - width / 2, y0 = 240 - height / 2;
    rect(198, 240 - height * 0.44, x0 - 198, height * 0.88, "#d8b771", null, 2);
    rect(x0 + width, 240 - height * 0.44, 642 - x0 - width, height * 0.88, "#9cbbdc", null, 2);
    const gradient = c.createLinearGradient(x0, 0, x0 + width, 0);
    gradient.addColorStop(0, "#e9be78"); gradient.addColorStop(1, "#a6c2e6");
    rect(x0, y0, width, height, gradient, "#7796aa", 2);
    for (let i = 0; i < 8; i++) for (let row = -1; row <= 1; row++) {
      const temperature = p.hot + (p.cold - p.hot) * (0.14 + 0.72 * i / 7);
      const pace = Math.sqrt((temperature + 273.15) / 300);
      const amplitude = Math.min(0.036, length / 12) * pace;
      circle(420 + (i / 7 - 0.5) * width * 0.72 + amplitude * 75 * Math.sin(t * 10 * pace + i * 1.3),
        240 + row * height * 0.26 + amplitude * 62 * Math.sin(t * 10 * pace + i * 1.3 + 2.1),
        Math.min(3, width / 25), "#46677d");
    }
    line([[x0, y0 - 14], [x0 + width, y0 - 14]], muted, 1.5);
    text("Thickness " + fmt(p.thickness * 1000) + " mm", 420, y0 - 26, muted, 17, "center");
    text("Area " + fmt(p.area) + " m²", 420, Math.min(388, y0 + height + 26), muted, 17, "center");
    const phase = heatMarkerPhase(t, q.power);
    for (let i = 0; vectors && i < 5; i++) {
      const x = 218 + ((i / 5 + phase) % 1) * 390;
      arrow(x, 126, 12, 0, teal, 2);
    }
  } else if (p.mode === 1) {
    rect(213, 110, 414, 265, "#dcecf580", "#8eb3c9", 6);
    for (let i = 0; i < 40; i++) {
      const [x, y] = convectionPosition(i / 20 + t * 0.13 + (i < 20 ? 0 : 0.025));
      circle(420 + x * 147, 242 - y * 97, 4.4, x < 0 ? gold : blue);
    }
    if (vectors) {
      arrow(267, 285, 0, -92, gold, 3);
      arrow(573, 193, 0, 92, blue, 3);
    }
    text("Warm fluid rises", 332, 94, gold, 17, "center");
    text("Cool fluid sinks", 507, 395, blue, 17, "center");
  } else {
    for (const [ys, sign, color, power] of [
      [[185, 225], 1, gold, q.hotEmission],
      [[280, 320], -1, blue, q.backgroundAbsorption],
    ]) for (const y of ys) {
      line(Array.from({ length: 97 }, (_, i) => [207 + i * 426 / 96, y + radiationMarkerAmplitude(power) * 14 * Math.sin(i * 0.30 - sign * t * 3)]), color, 2.3);
      if (vectors) arrow(sign > 0 ? 568 : 272, y, sign * 35, 0, color, 2);
    }
    text("Emitted " + fmt(q.hotEmission) + " W →", 420, 143, gold, 18, "center");
    text("← Absorbed background " + fmt(q.backgroundAbsorption) + " W", 420, 365, blue, 17, "center", 420);
    text("No material medium needed", 420, 395, muted, 17, "center");
  }
  foot("Net transfer " + fmt(q.power) + " W", "Energy transferred " + fmt(q.energy) + " J");
}
