/** Optical benches and acoustic apparatus. Ray geometry is calculated, while
 * carrier oscillations are deliberately slowed so their structure is visible. */
import { PALETTE as C, clamp, setPath } from "./scene-kit.js";
import { createLensApparatus } from "./scene-optical-bench.js";
import { createSoundApparatus } from "./scene-sound.js";
const TAU = 2 * Math.PI,
  rad = (x) => (x * Math.PI) / 180;
function bench(k) {
  k.stand(10, 4);
  k.rod([-4.5, 0.25, 0], [4.5, 0.25, 0], C.muted, 0.06);
}
function plate(k, x, color = C.blue) {
  k.glass(0.09, 3, 2.4, [x, 1.8, 0], color);
  k.cylinder(0.05, 1, C.muted, [x, 0.5, 0]);
}
function animatedWave(k, color = C.cyan) {
  return k.line(
    Array.from({ length: 161 }, () => [0, 0, 0]),
    color,
  );
}
export const WAVE_SCENES = {
  wavefronts(p, k) {
    k.stand(9, 8);
    if (p.mode) k.box(0.16, 0.16, 7, C.muted, [0, 0.05, 0]);
    else {
      for (const sign of [-1, 1])
        k.box(0.16, 0.16, (7 - p.gap) / 2, C.muted, [
          0,
          0.05,
          (sign * (7 + p.gap)) / 4,
        ]);
    }
    const waves = Array.from({ length: 81 }, (_, i) =>
      k.line([], p.mode && i % 2 ? C.gold : C.cyan, 0.7),
    );
    k.label(
      p.mode
        ? "Incident cyan · reflected gold"
        : "Wavefronts through an aperture",
      [0, 3.5, 0],
      "#64e8d1",
      4.8,
    );
    return (s, q) => {
      const spacing = q.wavelength,
        phase = (p.speed * s.t) % spacing,
        spread = (clamp(spacing / p.gap, 0.06, 1) * Math.PI) / 2;
      waves.forEach((o, i) => {
        const x = (i - 40) * spacing + phase;
        o.visible = x >= -4 && x <= 4;
        if (!o.visible) return;
        const pts = [];
        if (p.mode) o.material.color.setHex(x < 0 ? C.cyan : C.gold);
        if (p.mode) {
          const xx = -Math.abs(x);
          for (let j = 0; j <= 40; j++)
            pts.push([xx, 0.18, -3.5 + (j * 7) / 40]);
        } else if (x < 0) {
          for (let j = 0; j <= 40; j++)
            pts.push([x, 0.18, -3.5 + (j * 7) / 40]);
        } else {
          for (let j = 0; j <= 25; j++) {
            const a = -spread + (j * spread) / 25;
            pts.push([x * Math.cos(a), 0.18, -p.gap / 2 + x * Math.sin(a)]);
          }
          for (let j = 0; j <= 25; j++) {
            const a = (j * spread) / 25;
            pts.push([x * Math.cos(a), 0.18, p.gap / 2 + x * Math.sin(a)]);
          }
        }
        setPath(o, pts);
      });
    };
  },
  spectrum(p, k) {
    bench(k);
    const wave = animatedWave(k, C.purple);
    k.label("Electric field · transverse", [0, 3.8, 0], "#c3a6ff", 4);
    k.arrow([-4, 1.5, 0], [8, 0, 0], C.white);
    k.label("Propagation →", [2.5, 0.6, 0], "#e1eff6", 2.5);
    return (s) => {
      const cycles = clamp(3 - (p.exponent + 6) * 0.7, 1, 8);
      setPath(
        wave,
        Array.from({ length: 241 }, (_, i) => {
          const x = (i / 240) * 8 - 4;
          return [
            x,
            1.5 + p.amplitude * Math.sin((i / 240) * cycles * TAU - s.t * 3),
            0,
          ];
        }),
      );
    };
  },
  sound(p, k) {
    return createSoundApparatus(p, k);
  },
  resonance(p, k) {
    bench(k);
    const tube = k.cylinder(0.65, 7, 0x87c3d7, [0, 1.5, 0], {
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
    });
    tube.rotation.z = Math.PI / 2;
    if (p.mode) k.box(0.14, 1.3, 1.3, C.muted, [-3.5, 1.5, 0]);
    const dots = k.instances(96, 0.045, C.cyan),
      curve = animatedWave(k, C.gold);
    const probe = k.ring(0.75, C.purple, [-3.5 + 7 * p.probe, 1.5, 0], "z");
    probe.rotation.y = Math.PI / 2;
    k.label("Gold: displacement envelope", [0, 3.8, 0], "#ffc584", 4.2);
    return (s, q) => {
      const harmonic = q.harmonic,
        phase = q.phase,
        amp = (x) =>
          p.mode
            ? Math.sin((harmonic * Math.PI * x) / 2)
            : Math.cos(harmonic * Math.PI * x);
      for (let i = 0; i < 96; i++) {
        const u = (i % 32) / 31,
          dx = amp(u) * Math.cos(phase) * p.amplitude * 25;
        k.instance(dots, i, [
          -3.5 + u * 7 + dx,
          1.5,
          (Math.floor(i / 32) - 1) * 0.35,
        ]);
      }
      k.finishInstances(dots);
      setPath(
        curve,
        Array.from({ length: 161 }, (_, i) => [
          -3.5 + (i / 160) * 7,
          1.5 + 0.6 * amp(i / 160) * Math.cos(phase),
          0,
        ]),
      );
    };
  },
  mirror(p, k) {
    bench(k);
    k.box(0.14, 3.3, 3, C.blue, [0, 1.8, 0], {
      metalness: 0.9,
      roughness: 0.08,
    });
    const a = rad(p.angle),
      d = 3.2,
      hit = [-0.09, 1.8, 0];
    k.line(
      [
        [-d * Math.cos(a), 1.8 + d * Math.sin(a), 0],
        hit,
        [-d * Math.cos(a), 1.8 - d * Math.sin(a), 0],
      ],
      C.gold,
    );
    k.line(
      [
        [-3.5, 1.8, 0],
        [3.5, 1.8, 0],
      ],
      C.muted,
      0.5,
    );
    k.label("Normal", [2, 2.3, 0], "#b7cedc", 1.6);
    k.label("Angle in = angle out", [-1, 4.2, 0], "#ffc584", 3.8);
    return () => {};
  },
  lenses: createLensApparatus,
  dispersion(p, k) {
    bench(k);
    k.glass(4.3, 3.2, 2.6, [2.2, 1.6, 0]);
    k.label("Air", [-2.5, 3.5, 0]);
    k.label("Glass", [2.5, 3.5, 0]);
    k.line(
      [
        [-4, 1.6, 0],
        [4, 1.6, 0],
      ],
      C.muted,
      0.4,
    );
    let built = false;
    return (s, q) => {
      if (built) return;
      built = true;
      const a = rad(p.angle),
        r = rad(q.refraction);
      k.line(
        [
          [-3 * Math.cos(a), 1.6 + 3 * Math.sin(a), 0],
          [0, 1.6, 0],
          [3.6 * Math.cos(r), 1.6 - 3.6 * Math.sin(r), 0],
        ],
        C.gold,
      );
      k.label("Slower in glass → bends to normal", [0, 4.3, 0], "#ffc584", 5.2);
    };
  },
  polarisation(p, k) {
    bench(k);
    const xs = p.mode ? [-2.7, 0, 2.7] : [-2, 2],
      angles = p.mode ? [0, p.angle, p.thirdAngle] : [0, p.angle];
    xs.forEach((x, i) => {
      plate(k, x);
      const a = rad(angles[i]);
      for (let j = -2; j <= 2; j++)
        k.rod(
          [
            x,
            1.7 - 0.9 * Math.cos(a) + j * 0.12 * Math.sin(a),
            -0.9 * Math.sin(a) - j * 0.12 * Math.cos(a),
          ],
          [
            x,
            1.7 + 0.9 * Math.cos(a) + j * 0.12 * Math.sin(a),
            0.9 * Math.sin(a) - j * 0.12 * Math.cos(a),
          ],
          C.blue,
          0.012,
        );
    });
    const lines = Array.from({ length: xs.length }, () => animatedWave(k));
    k.label(
      "Filters transmit one field direction",
      [0, 4.2, 0],
      "#89baff",
      4.8,
    );
    return (s, q) => {
      const intensities = p.mode
        ? [q.first, q.second, q.output]
        : [q.first, q.output];
      lines.forEach((line, i) => {
        const start = xs[i] + 0.13,
          end = xs[i + 1] ?? 4.4,
          a = rad(angles[i]),
          amp = 0.6 * Math.sqrt(Math.max(0, intensities[i]) / p.intensity);
        setPath(
          line,
          Array.from({ length: 81 }, (_, j) => {
            const u = j / 80,
              e = amp * Math.sin(u * TAU * 2 - s.t * 4);
            return [
              start + u * (end - start),
              1.7 + e * Math.cos(a),
              e * Math.sin(a),
            ];
          }),
        );
      });
    };
  },
  bragg(p, k) {
    bench(k);
    for (let row = 0; row < 3; row++) {
      k.line(
        [
          [-3, 0.8 + row * 0.6, 0],
          [3, 0.8 + row * 0.6, 0],
        ],
        C.blue,
        0.45,
      );
      for (let col = 0; col < 9; col++)
        k.ball(0.09, C.blue, [-2.8 + col * 0.7, 0.8 + row * 0.6, 0]);
    }
    const incoming = animatedWave(k, C.cyan),
      outgoing = animatedWave(k, C.gold);
    k.label("θ is measured from lattice planes", [0, 4, 0], "#cfe6ef", 4.7);
    return (s, q) => {
      const a = rad(q.angle ?? 0),
        hit = [0, 2, 0];
      setPath(incoming, [[-3 * Math.cos(a), 2 + 3 * Math.sin(a), 0], hit]);
      outgoing.visible = q.permitted;
      setPath(outgoing, [hit, [3 * Math.cos(a), 2 + 3 * Math.sin(a), 0]]);
    };
  },
  photoelectric(p, k) {
    bench(k);
    k.glass(7, 2.8, 2.2, [0, 1.7, 0]);
    k.box(0.18, 2.3, 1.5, C.gold, [-2.8, 1.7, 0]);
    k.box(0.18, 2.3, 1.5, C.blue, [2.8, 1.7, 0]);
    k.arrow([-4, 3.4, 0], [1.1, -1.1, 0], C.purple);
    k.label("Photons in", [-3, 4.1, 0], "#c3a6ff", 2);
    k.label("Metal", [-2.8, 0.25, 1.3], "#ffc584", 1.4);
    k.label("Collector", [2.8, 0.25, 1.3], "#89baff", 1.7);
    const dots = k.instances(16, 0.055, C.cyan);
    return (s, q) => {
      dots.visible = q.emission;
      for (let i = 0; i < 16; i++) {
        const u = (s.t * 0.6 + i / 16) % 1;
        k.instance(dots, i, [
          -2.6 + u * 5.2,
          1.1 + (i % 4) * 0.4,
          ((i % 3) - 1) * 0.3,
        ]);
      }
      k.finishInstances(dots);
    };
  },
};
