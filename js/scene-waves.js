/** Optical benches and acoustic apparatus. Ray geometry is calculated, while
 * carrier oscillations are deliberately slowed so their structure is visible. */
import { PALETTE as C, clamp, setPath } from "./scene-kit.js";
import { createPhotoelectricBench, createBraggBench } from "./scene-quantum-labs.js";
import { createLensApparatus } from "./scene-optical-bench.js";
import { createSoundApparatus } from "./scene-sound.js";
import { createMirrorBench, createDispersionBench, createPolarisationBench } from "./scene-optics-labs.js";
import { rippleFronts, RIPPLE_HALF_LENGTH as tankX, RIPPLE_HALF_WIDTH as tankZ } from "./ripple-geometry.js";
const TAU = 2 * Math.PI;
function bench(k) {
  k.stand(10, 4);
  k.rod([-4.5, 0.25, 0], [4.5, 0.25, 0], C.muted, 0.06);
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
    k.box(tankX * 2, 0.15, tankZ * 2, 0x092d44, [0, 0.10, 0], { roughness: 0.68 });
    for (const side of [-1, 1]) {
      k.box(tankX * 2 + 0.2, 0.24, 0.13, C.muted, [0, 0.16, side * (tankZ + 0.07)]);
      k.box(0.13, 0.24, tankZ * 2, C.muted, [side * (tankX + 0.07), 0.16, 0]);
    }
    const gap = p.mode ? 0 : p.gap;
    const barrier = tankZ - gap / 2;
    for (const side of [-1, 1]) {
      k.box(0.22, 0.37, barrier, C.white, [0, 0.29, side * (gap / 2 + barrier / 2)]);
    }
    const waves = Array.from({ length: 82 }, () => k.line([], C.cyan, 0.94));
    const outgoing = p.mode ? C.gold : C.blue;
    k.label("Incident fronts", [-2.15, 0.64, -2.8], "#79f5e1", 2.1);
    k.label(p.mode ? "Reflected fronts" : "Diffracted fronts",
      [2.15, 0.64, -2.8], p.mode ? "#ffc584" : "#a8cfff", 2.15);
    k.label(p.mode ? "Reflecting wall" : "Gap", [0, 0.68, 2.68], "#e1eff6", 1.5);
    k.arrow([-2.5, 0.26, 2.2], [0.9, 0, 0], C.cyan);
    if (p.mode) k.arrow([-1.6, 0.26, 1.66], [-0.9, 0, 0], outgoing);
    else k.arrow([1.3, 0.26, 0], [0.9, 0, 0], outgoing);
    return (s, q) => {
      const fronts = rippleFronts(q.wavelength, p.speed * s.t, p.gap, p.mode);
      waves.forEach((wave, i) => {
        const front = fronts[i];
        wave.visible = Boolean(front);
        if (!front) return;
        wave.material.color.setHex(front.kind ? outgoing : C.cyan);
        setPath(wave, front.points.map(([x, z]) => [x, 0.215 + front.kind * 0.006, z]));
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
  mirror: createMirrorBench,
  lenses: createLensApparatus,
  dispersion: createDispersionBench,
  polarisation: createPolarisationBench,
  bragg: createBraggBench,
  photoelectric: createPhotoelectricBench,
};
