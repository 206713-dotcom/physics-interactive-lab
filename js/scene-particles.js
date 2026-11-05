import { PALETTE as C } from "./scene-kit.js";
import { chamberParticle, gasParticleMotion, gasParticleCount, particleChamberWidth, PARTICLE_CHAMBER } from "./thermal-geometry.js";
import { calculationNumber as number } from "./calculations.js";

/** A fixed-cross-section chamber. The selected volume places its right wall. */
export function createParticleBench(p, k) {
  k.stand(10.8, 4.5);
  const gas = p.state === 2, volume = gas ? p.volume : 0.024;
  const left = -3.75, floor = 0.58, width = particleChamberWidth(volume), right = left + width;
  const { height, depth } = PARTICLE_CHAMBER;
  const metal = { metalness: 0.55, roughness: 0.35 };
  k.box(5.85, 0.20, 2.15, 0x385c72, [-0.95, 0.31, 0], metal);
  k.glass(width, height, depth, [left + width / 2, floor + height / 2, 0]);
  for (const x of [left, right]) {
    k.box(0.10, height + 0.06, depth + 0.07, x === right ? 0xc69d61 : 0x6f96ac,
      [x, floor + height / 2, 0], { ...metal, transparent: true, opacity: gas && x === right ? 0.40 : 0.24, depthWrite: false });
  }
  for (const z of [-depth / 2, depth / 2]) {
    for (const y of [floor, floor + height]) k.rod([left, y, z], [right, y, z], 0x7badc4, 0.023);
  }
  if (gas) {
    k.rod([right + 0.04, 2.0, 0], [2.05, 2.0, 0], 0xc3cfd5, 0.065);
    k.box(0.28, 2.1, 0.5, 0x426579, [2.12, 1.25, 0], metal);
    k.rod([2.12, 1.70, -0.5], [2.12, 2.30, 0.5], C.gold, 0.04);
    k.label("Move the volume slider", [-0.9, 3.97, 0], "#bad9e5", 3.4);
    for (const litres of [5, 15, 25, 35, 50]) {
      const x = left + 5.4 * litres / 50;
      k.line([[x, 0.43, 0.94], [x, 0.43, 1.12]], C.white, 0.8);
      k.label(litres + " L", [x, 0.23, 1.32], "#b5d2e3", 0.63);
    }
  }
  const count = gas ? gasParticleCount(p.amount) : 72;
  const dots = k.instances(count, 0.052, p.state === 0 ? C.blue : C.cyan);
  dots.userData.role = "particle-chamber-dots";
  if (p.state === 0) {
    const rest = Array.from({ length: 72 }, (_, i) => {
      const x = 0.14 + i % 6 * 0.14, y = 0.15 + Math.floor(i / 18) * 0.12;
      const z = 0.19 + Math.floor(i / 6) % 3 * 0.31;
      return [left + 0.09 + x * (width - 0.18), floor + 0.09 + y * (height - 0.18), (z - 0.5) * (depth - 0.18)];
    });
    for (let i = 0; i < 72; i++) {
      if (i % 6 < 5) k.line([rest[i], rest[i + 1]], 0x708fae, 0.45);
      if (i + 18 < 72) k.line([rest[i], rest[i + 18]], 0x708fae, 0.45);
    }
  }
  const tracked = gas ? k.ball(0.081, C.gold, [0, 1, 0], { emissive: C.gold, emissiveIntensity: 0.3 }) : null;
  if (tracked) tracked.userData.role = "gas-tracked-particle";
  const velocity = gas ? k.arrow([0, 1, 0], [0.5, 0, 0], C.gold) : null;
  const impact = gas ? k.ball(0.14, C.gold, [0, 1, 0], {
    transparent: true, opacity: 0, depthWrite: false, emissive: C.gold, emissiveIntensity: 1.1,
  }) : null;
  if (impact) impact.userData.role = "gas-wall-impact";
  k.box(2.2, 3.5, 0.18, 0x15394e, [3.55, 2.2, -0.12]);
  k.label(["Solid · fixed neighbours", "Liquid · particles rearrange", "Gas · moving particles"][p.state],
    [-0.95, 4.72, 0], "#d2eaf3", 4.1);
  k.label(gas ? "Pressure" : "Conceptual particle view", [3.55, 3.59, 0.03], "#abcbdc", gas ? 1.5 : 2.0, "ink", 0.27);
  const pressure = k.label("", [3.55, 3.05, 0.03], "#9ce8df", 1.95, "ink", 0.60);
  k.label("Temperature", [3.55, 2.45, 0.03], "#abcbdc", 1.7, "ink", 0.27);
  k.label(number(p.temperature) + " K", [3.55, 1.98, 0.03], "#ffc584", 1.75, "ink", 0.60);
  k.label(gas ? "Volume" : "Gas pressure", [3.55, 1.42, 0.03], "#abcbdc", 1.5, "ink", 0.27);
  k.label(gas ? number(p.volume * 1000) + " L" : "Not applied", [3.55, 0.98, 0.03], "#b8d4ef", 1.8, "ink", 0.55);
  const message = k.label("", [-0.8, 0.05, -1.43], "#d4e5ee", 4.5);
  const toWorld = point => [left + point[0], floor + point[1], point[2] - depth / 2];
  return {
    camera: { target: [0.15, 2.30, 0], radius: 13.0, polar: 1.31, azimuth: -0.20, fitAspect: 1.75 },
    update(s, q, lab) {
      for (let i = 0; i < count; i++) {
        if (gas) {
          k.instance(dots, i, toWorld(gasParticleMotion(i, s.t, p.temperature, p.volume).position));
        } else {
          const [x, y, z] = chamberParticle(i, s.t, p.temperature, p.state);
          k.instance(dots, i, [left + 0.09 + x * (width - 0.18), floor + 0.09 + y * (height - 0.18), (z - 0.5) * (depth - 0.18)]);
        }
      }
      k.finishInstances(dots);
      k.setLabel(pressure, gas ? number(q.pressure / 1000) + " kPa" : "No gas-law reading", "#9ce8df", 1.95);
      if (!gas) return;
      const particle = gasParticleMotion(0, s.t, p.temperature, p.volume);
      const position = toWorld(particle.position);
      tracked.position.set(...position);
      k.setArrow(velocity, position, particle.velocity.map(value => value * 0.38));
      const visible = particle.collision.age <= s.t && particle.collision.age < 0.14;
      impact.visible = visible && lab.vectors !== false;
      impact.material.opacity = visible ? 0.85 * (1 - particle.collision.age / 0.14) : 0;
      if (visible) impact.position.set(...toWorld(particle.collision.position));
      k.setLabel(message, visible ? "Wall collision · particle rebounds" : "Gold particle · scaled velocity arrow", "#d4e5ee", 4.5);
    },
  };
}
