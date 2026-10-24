/** Nuclear and astronomical displays. Nucleus / stellar sizes are schematic;
 * decay colours use the seeded decay event times, not invented detector hits. */
import * as T from "../vendor/three.module.min.js";
import { PALETTE as C, clamp, setPath } from "./scene-kit.js";
import { PLANETS } from "./curriculum-physics.js";
import { planckSpectrum } from "./practical-physics.js";
const TAU = Math.PI * 2;
function starColor(temperature) {
  const u = clamp((temperature - 2500) / 7500, 0, 1);
  return new T.Color(0xffa775).lerp(new T.Color(0xa9caff), u);
}
export const SPACE_SCENES = {
  atom(p, k) {
    k.stand(8, 5);
    const count = p.protons + p.neutrons,
      nucleons = k.instances(count, 0.15, C.gold);
    for (let i = 0; i < count; i++) {
      const a = i * 2.39996,
        r = 0.24 * Math.cbrt(i + 1),
        z = 1 - (2 * (i + 0.5)) / count;
      k.instance(
        nucleons,
        i,
        [
          r * Math.sqrt(1 - z * z) * Math.cos(a),
          2 + r * z,
          r * Math.sqrt(1 - z * z) * Math.sin(a),
        ],
        i < p.protons ? C.gold : C.blue,
      );
    }
    k.finishInstances(nucleons);
    k.label("Protons + neutrons form the nucleus", [0, 4.5, 0], "#cfe6ef", 5);
    k.label(
      "No classical electron orbits implied",
      [0, 0.3, 1.5],
      "#b7cedc",
      4.6,
    );
    const cloud = k.ball(1.6, C.cyan, [0, 2, 0], {
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
      wireframe: true,
    });
    cloud.visible = p.protons - p.charge > 0;
    return () => {};
  },
  radioactivity(p, k) {
    k.stand(9, 5);
    const dots = k.instances(p.nuclei, 0.055, C.cyan),
      cols = Math.ceil(Math.sqrt(p.nuclei)),
      rows = Math.ceil(p.nuclei / cols);
    k.label("Cyan: undecayed · muted: decayed", [0, 4.6, 0], "#64e8d1", 5);
    k.label(
      "Each nucleus has its own seeded event time",
      [0, 0.2, 1.3],
      "#b7cedc",
      5.8,
    );
    return (s) => {
      for (let i = 0; i < p.nuclei; i++)
        k.instance(
          dots,
          i,
          [
            -3.5 + ((i % cols) / Math.max(1, cols - 1)) * 7,
            0.65 + (Math.floor(i / cols) / Math.max(1, rows - 1)) * 3,
            0,
          ],
          s.decayTimes[i] > s.t ? C.cyan : 0x29485a,
        );
      k.finishInstances(dots);
    };
  },
  earthmoon(p, k) {
    const earth = k.ball(1, C.blue, [0, 1.8, 0], { roughness: 0.8 });
    const moon = k.ball(0.28, 0xb9c6cc, [-2.8, 1.8, 0], { roughness: 1 });
    const sun = k.ball(0.55, C.gold, [-4.5, 1.8, 0], {
      emissive: C.gold,
      emissiveIntensity: 1.1,
    });
    const light = new T.PointLight(0xffffff, 3.5, 25, 0);
    k.add(light, [-4.5, 1.8, 0]);
    k.ring(2.8, C.muted, [0, 1.8, 0]);
    const axis = k.rod([0, 0.4, 0], [0, 3.2, 0], C.white, 0.018);
    axis.rotation.z = (-p.tilt * Math.PI) / 180;
    k.label("Sunlight →", [-3.4, 3.6, 0], "#ffc584", 2.2);
    k.label("Earth", [0, 0.25, 0], "#89baff", 1.3);
    k.label("Sizes and distances not to scale", [0, 4.5, 0], "#b7cedc", 4.6);
    return (s, q) => {
      moon.position.set(-2.8 * Math.cos(q.phase), 1.8, 2.8 * Math.sin(q.phase));
      earth.rotation.y = s.t * 0.3;
    };
  },
  solarsystem(p, k) {
    const planet = PLANETS[p.planet],
      sun = k.ball(0.55, C.gold, [0, 1.5, 0], {
        emissive: C.gold,
        emissiveIntensity: 1,
      });
    const orbit = k.ring(3.5, C.muted, [0, 1.5, 0]);
    const body = k.ball(
      0.24,
      [
        0xa6a5a0,
        0xd9b780,
        C.blue,
        0xe8916c,
        0xdcb58c,
        0xead4a4,
        0x92d9dd,
        0x7b9bff,
      ][p.planet],
      [3.5, 1.5, 0],
    );
    if (p.planet === 5) {
      const rings = k.ring(0.43, C.gold, [3.5, 1.5, 0]);
      body.attach(rings);
    }
    k.label(planet[0] + " · circular orbit", [0, 4.4, 0], "#89baff", 4);
    k.label(
      "1 simulation time unit = 1 Julian year",
      [0, 0.2, 2],
      "#b7cedc",
      5.4,
    );
    return (s, q) =>
      body.position.set(3.5 * Math.cos(q.phase), 1.5, -3.5 * Math.sin(q.phase));
  },
  stars(p, k) {
    const colors = [C.red, starColor(p.temperature), C.red, C.blue, C.purple],
      sizes = [1.5, 1.1, 2.1, 0.45, 0.24],
      size = sizes[p.stage],
      body = k.ball(size, colors[p.stage], [0, 2.3, 0], {
        emissive: colors[p.stage],
        emissiveIntensity: 0.45,
        roughness: 0.85,
      });
    if (p.stage === 4) {
      const halo = k.ring(1.2, C.gold, [0, 2.3, 0]);
      halo.rotation.z = 0.3;
    }
    k.label(
      [
        "Cloud collapse",
        "Main sequence",
        "Giant / supergiant",
        "Stellar remnant",
        "Compact remnant",
      ][p.stage],
      [0, 5, 0],
      "#cfe6ef",
      4.4,
    );
    k.label(
      "Stage illustration · not an evolution timescale",
      [0, 0.3, 1.5],
      "#b7cedc",
      5.8,
    );
    return () => {};
  },
  universe(p, k) {
    const points = k.instances(25, 0.1, C.blue);
    for (let i = 0; i < 25; i++) {
      const a = i * 2.39996,
        r = 0.45 + Math.sqrt(i / 24) * 3;
      k.instance(points, i, [
        r * Math.cos(a),
        2 + r * 0.6 * Math.sin(a),
        Math.sin(i * 4) * 1.6,
      ]);
      if (i % 4 === 0 && i)
        k.arrow(
          [r * Math.cos(a), 2 + r * 0.6 * Math.sin(a), Math.sin(i * 4) * 1.6],
          [0.5 * Math.cos(a), 0.3 * Math.sin(a), 0],
          C.gold,
        );
    }
    k.finishInstances(points);
    k.ball(0.14, C.white, [0, 2, 0]);
    k.label("More distant galaxies recede faster", [0, 4.8, 0], "#ffc584", 5);
    k.label(
      "Hubble-law snapshot · no expansion history integrated",
      [0, 0.1, 1.8],
      "#b7cedc",
      6.5,
    );
    const wave = k.line([], C.purple);
    return (s, q) =>
      setPath(
        wave,
        Array.from({ length: 161 }, (_, i) => [
          -3.7 + (i / 160) * 7.4,
          1.8 +
            0.3 * Math.sin(((i / 160) * TAU * 4) / (1 + q.redshift) - s.t * 3),
          2,
        ]),
      );
  },
  blackbody(p, k) {
    k.stand(9, 4);
    const body = k.ball(1.15, starColor(p.temperature), [-2.4, 1.8, 0], {
      emissive: starColor(p.temperature),
      emissiveIntensity: clamp(p.temperature / 5000, 0.05, 2),
    });
    const screen = k.glass(3.2, 2.7, 0.1, [2, 1.8, 0]);
    k.label("Emitter", [-2.4, 3.7, 0], "#ffc584", 1.7);
    k.label("Thermal spectrum", [2.1, 3.7, 0], "#c3a6ff", 2.8);
    const curve = k.line([], C.purple);
    return (s, q) => {
      const lo = q.peak * 0.12,
        hi = q.peak * 5,
        peak = Math.max(q.peakRadiance, 1e-30);
      setPath(
        curve,
        Array.from({ length: 161 }, (_, i) => [
          0.55 + (i / 160) * 2.9,
          0.7 +
            ((p.emissivity *
              planckSpectrum(lo + ((hi - lo) * i) / 160, p.temperature)) /
              peak) *
              2,
          0,
        ]),
      );
    };
  },
};
