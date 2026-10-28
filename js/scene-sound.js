/** Fixed-window acoustic illustration. Its phase and wavelength follow the
 * existing sound model; parcel displacement is schematic, not measured in m. */
import * as T from "../vendor/three.module.min.js";
import { PALETTE as C } from "./scene-kit.js";
import { soundLayout } from "./field-geometry.js";
import { dynamicCable, dashedPath } from "./scene-instruments.js";
export function createSoundApparatus(p, k) {
  k.stand(10.2, 4.3);
  const q0 = soundLayout(p, 0, 0), columns = q0.columns,
    dots = k.instances(columns * 6, 0.035, 0xffffff),
    cold = new T.Color(0x79b9ee), hot = new T.Color(0xffca81), color = new T.Color();
  dots.userData.role = "sound-parcels";
  k.box(0.8, 2.15, 1.7, 0x213b4c, [-4, 1.45, 0], { metalness: 0.35, roughness: 0.55 });
  const rim = k.mesh(new T.TorusGeometry(0.68, 0.055, 12, 72), 0x708797, [-3.56, 1.85, 0], { metalness: 0.7, roughness: 0.3 });
  rim.rotation.y = Math.PI / 2;
  const cone = k.mesh(new T.CylinderGeometry(0.55, 0.21, 0.26, 48, 1, true), 0x152736, [-3.52, 1.85, 0], { metalness: 0.25, roughness: 0.6, side: T.DoubleSide });
  cone.rotation.z = -Math.PI / 2;
  const cap = k.ball(0.21, 0x597581, [-3.39, 1.85, 0], { metalness: 0.55, roughness: 0.3 });
  cap.scale.x = 0.35;
  const frame = [[-3, 1.25, -0.65], [-3, 2.55, -0.65], [3.9, 2.55, -0.65], [3.9, 1.25, -0.65]];
  k.line(frame, C.muted, 0.4);
  for (const x of [-3, 3.9]) k.rod([x, 0.1, -0.65], [x, 2.55, -0.65], C.muted, 0.025);
  const curvePoints = Array.from({ length: 257 }, (_, i) => [-3 + 6.9 * i / 256, 0.6, 0]),
    curve = dynamicCable(k, curvePoints, C.cyan, 0.018),
    parcel = k.ball(0.1, C.purple, [0.45, 1.85, 0.75], { emissive: C.purple, emissiveIntensity: 0.3 });
  parcel.userData.role = "sound-tracked-parcel";
  dashedPath(k, [[0.45, 1.2, 0.75], [0.45, 2.65, 0.75]], C.purple, 0.5);
  k.arrow([-1.5, 3.25, 0], [3.0, 0, 0], C.gold);
  k.label("Wave travels →  ·  parcels oscillate ↔", [0, 3.8, 0], "#cce3ed", 5.4);
  const wavelength = k.label("", [0, 4.65, 0], "#a2d6e8", 5.5),
    pressure = k.label("", [0, 0.1, 2.2], "#64e8d1", 3.8);
  k.line([[0.45, 2.65, 0.75], [0.45, 2.72, 1.8]], C.purple, 0.7);
  k.label("Tracked air parcel", [0.45, 2.72, 1.8], "#c3a6ff", 2.4);
  k.label("Gold: compressed · blue: rarefied", [0, 3.3, 0], "#a7c6d7", 4.7);
  for (const [m, label] of [[0, "0 m"], [1, "1 m"], [2, "2 m"]]) {
    const x = -3 + m * q0.scale;
    k.line([[x, 0.03, 0.75], [x, 0.03, 1.0]], C.muted, 0.8);
    k.label(label, [x, 0.05, 1.2], "#9ab9cb", 0.65);
  }
  return {
    camera: { target: [-0.3, 2.2, 0], radius: 12.5, polar: 1.27, azimuth: -0.16, fitAspect: 1.7 },
    columns,
    update(s, q, lab) {
      for (let col = 0; col < columns; col++) {
        const x = 2 * col / (columns - 1), sample = soundLayout(p, s.t, x),
          at = -3 + x * sample.scale + sample.displacement;
        color.copy(cold).lerp(hot, (sample.pressure / p.amplitude + 1) / 2);
        for (let row = 0; row < 3; row++) for (let layer = 0; layer < 2; layer++)
          k.instance(dots, col * 6 + row * 2 + layer, [at, 1.85 + (row - 1) * 0.3, (layer - 0.5) * 0.65], color);
      }
      k.finishInstances(dots);
      for (let i = 0; i < curvePoints.length; i++) curvePoints[i][1] = 0.6 + 0.35 * soundLayout(p, s.t, 2 * i / 256).pressure;
      curve.update(curvePoints);
      const phase = q0.phase + 2 * Math.PI * p.frequency * s.t,
        motion = -p.amplitude * 0.045 * Math.cos(phase);
      cone.position.x = -3.52 + motion; cap.position.x = -3.39 + motion;
      parcel.position.x = 0.45 + soundLayout(p, s.t, 1).displacement;
      k.setLabel(wavelength, `λ = ${q.wavelength.toFixed(3)} m · c = ${q.speed.toFixed(1)} m/s`, "#a2d6e8", 5.5);
      k.setLabel(pressure, `Source p = ${q.pressure.toFixed(3)} (relative)`, "#64e8d1", 3.8);
    },
  };
}
