/** Teaching optics. Paths and projections come from the same models as the
 * numerical inspector. Board dimensions and optical time are illustrative. */
import * as T from "../vendor/three.module.min.js";
import { PALETTE as C, setPath } from "./scene-kit.js";
import { createCircuitBoard, circuitCamera } from "./circuit-apparatus.js";
import { mirrorConstruction, dispersionConstruction, dispersionFronts,
  polarisationConstruction, polarisationWave } from "./optical-construction.js";
import { opticalBench, opticalMount, solidRay, dashedPath, dynamicCable } from "./scene-instruments.js";
import { wavelengthRGB, paperInk } from "./diagram-theme.js";

const TEAL = 0x087d79, GOLD = 0xa77827, PURPLE = 0x7953a3, INK = 0x3f647a;
const label = (k, text, x, y, width = 2, color = "#3f647a", height = 0.30) =>
  k.label(text, [x, y, 0.25], color, width, "ink", height * 1.5);
function diagramArc(k, center, radius, start, end, color) {
  return k.line(Array.from({ length: 51 }, (_, i) => {
    const a = start + (end - start) * i / 50;
    return [center[0] + radius * Math.cos(a), center[1] + radius * Math.sin(a), 0.19];
  }), color);
}
function mirrorStrip(k, x, bottom, top) {
  k.box(0.07, top - bottom, 0.10, 0x95bac8, [x + 0.035, (top + bottom) / 2, 0.04], { metalness: 0.8, roughness: 0.18 });
  for (let y = bottom + 0.1; y < top; y += 0.24)
    k.line([[x + 0.09, y, 0.11], [x + 0.22, y + 0.12, 0.11]], 0x85a3b4);
}
function distanceBracket(k, a, b, y, text) {
  k.line([[a, y, 0.16], [b, y, 0.16]], INK);
  for (const x of [a, b]) k.line([[x, y - 0.09, 0.16], [x, y + 0.09, 0.16]], INK);
  if (text) label(k, text, (a + b) / 2, y - 0.30, 1.5, "#3f647a", 0.24);
}

export function createMirrorBench(p, k) {
  const q = mirrorConstruction(p), flows = [], a = p.angle * Math.PI / 180;
  createCircuitBoard(k);
  k.line([[0.2, 0.35, 0.02], [0.2, 4.55, 0.02]], 0xb7cbd8);
  label(k, "01  REFLECTION LAW", -2.6, 4.83, 3.6, "#087d79", 0.32);
  label(k, "02  VIRTUAL IMAGE", 2.8, 4.83, 3.6, "#7953a3", 0.32);
  mirrorStrip(k, q.hit[0], 0.7, 4.5);
  dashedPath(k, [[-4.85, q.hit[1], 0.13], q.hit], INK, 0.6);
  for (let deg = -90; deg <= 90; deg += 5) {
    const angle = Math.PI + deg * Math.PI / 180, r = deg % 30 === 0 ? 1.57 : 1.63;
    k.line([[q.hit[0] + r * Math.cos(angle), q.hit[1] + r * Math.sin(angle), 0.08],
      [q.hit[0] + 1.67 * Math.cos(angle), q.hit[1] + 1.67 * Math.sin(angle), 0.08]], 0xa3bac8);
    if (deg % 30 === 0) label(k, `${Math.abs(deg)}°`, q.hit[0] + 1.87 * Math.cos(angle),
      q.hit[1] + 1.87 * Math.sin(angle), 0.52, "#668696", 0.21);
  }
  diagramArc(k, q.hit, 0.58, Math.PI - a, Math.PI, GOLD);
  diagramArc(k, q.hit, 0.75, Math.PI, Math.PI + a, TEAL);
  flows.push(solidRay(k, q.incident, GOLD), solidRay(k, q.reflected, TEAL));
  label(k, "Normal", -4.15, 2.9, 1.1, "#668696", 0.25);
  label(k, `Incident  ${p.angle.toFixed(0)}°`, -3.6, 0.30, 2.3, "#8e6421", 0.29);
  label(k, `Reflected  ${p.angle.toFixed(0)}°`, -1.1, 0.30, 2.3, "#087d79", 0.29);
  const source = k.cylinder(0.10, 0.45, 0x40596c, q.incident[0]);
  source.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(Math.cos(a), -Math.sin(a), 0));
  mirrorStrip(k, q.mirrorX, 1.75, 4.15);
  const object = k.arrow([q.object[0], q.axis, 0.12], [0, q.height, 0], TEAL),
    image = k.arrow([q.image[0], q.axis, 0.12], [0, q.height, 0], PURPLE);
  object.userData.role = "mirror-object"; image.userData.role = "mirror-image";
  q.rays.forEach(path => flows.push(solidRay(k, path, GOLD)));
  q.extensions.forEach(path => dashedPath(k, path, PURPLE, 0.8));
  label(k, "Object", 1.22, 4.35, 1.6, "#087d79");
  label(k, "Virtual image", 4.0, 4.35, 2.0, "#7953a3");
  label(k, "Mirror", q.mirrorX, 1.65, 1.1, "#668696", 0.22);
  distanceBracket(k, q.object[0], q.mirrorX, 1.38);
  distanceBracket(k, q.mirrorX, q.image[0], 1.38);
  label(k, `${p.distance.toFixed(2)} m in front`, 1.13, 0.97, 2.65, "#087d79", 0.3);
  label(k, `${p.distance.toFixed(2)} m behind`, 4.0, 0.97, 2.65, "#7953a3", 0.3);
  label(k, "Same size · same distance · upright", 2.7, 0.43, 4.25, "#7953a3", 0.27);
  return { camera: circuitCamera, planar: true, construction: q,
    update(s, values, lab) { flows.forEach(flow => flow(s.t * 0.2, lab.vectors !== false)); },
    afterVisibility() { object.visible = image.visible = true; } };
}

export function createDispersionBench(p, k) {
  const q = dispersionConstruction(p), rgb = wavelengthRGB(p.wavelength * 1e9),
    color = new T.Color().setRGB(...rgb, T.SRGBColorSpace).multiplyScalar(0.55),
    css = paperInk(`rgb(${rgb.map(v => Math.round(v * 255)).join(",")})`);
  createCircuitBoard(k);
  // A pale panel depicts one material half-space, not a second prism face.
  const material = k.box(2.86, 3.9, 0.018, 0xc8e5e9, [-0.07, 2.45, -0.065]);
  material.material.dispose();
  material.material = new T.MeshBasicMaterial({ color: 0xd4e9ed, toneMapped: false });
  material.userData.role = "dispersion-medium";
  k.line([[-1.5, 0.5, 0.05], [-1.5, 4.38, 0.05]], INK);
  dashedPath(k, [[-4.8, q.hit[1], 0.08], [1.3, q.hit[1], 0.08]], INK, 0.5);
  k.line([[1.65, 0.45, 0.05], [1.65, 4.45, 0.05]], 0xa9c2d0);
  label(k, "ONE INTERFACE · FOLLOW A WAVEFRONT", -1.7, 4.83, 5.8, "#087d79", 0.3);
  label(k, "Air", -3.8, 1.35, 1.1);
  label(k, "Material", -0.1, 4.14, 1.8);
  label(k, "Normal", -3.9, 1.95, 1.3, "#668696", 0.24);
  const airFlow = solidRay(k, q.incident, color), materialFlow = solidRay(k, q.transmitted, color);
  const source = k.cylinder(0.105, 0.40, 0x40596c, q.incident[0]);
  source.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...q.airDirection));
  diagramArc(k, q.hit, 0.57, Math.PI - p.angle * Math.PI / 180, Math.PI, GOLD);
  diagramArc(k, q.hit, 0.68, -q.refraction * Math.PI / 180, 0, TEAL);
  label(k, `i  ${p.angle.toFixed(1)}°`, -3.75, 4.25, 1.7, "#8e6421", 0.32);
  label(k, `r  ${q.refraction.toFixed(2)}°`, 0.1, 0.68, 1.9, "#087d79", 0.32);
  const fronts = [false, true].map(() => Array.from({ length: 36 }, () => k.line([], color, 0.65)));
  label(k, "SELECTED LIGHT", 3.35, 4.85, 2.75, "#668696", 0.27);
  label(k, `${Math.round(p.wavelength * 1e9)} nm`, 3.35, 4.31, 2.7, css, 0.55);
  label(k, `Index  n = ${q.index.toFixed(4)}`, 3.35, 3.68, 2.8);
  label(k, `In material  ${(q.wavelength * 1e9).toFixed(1)} nm`, 3.35, 3.17, 2.8);
  label(k, `Speed  ${(q.speed / 1e8).toFixed(3)} × 10⁸ m/s`, 3.35, 2.66, 2.8);
  label(k, "COMPARE AT THE SAME ANGLE", 3.35, 1.95, 2.9, "#668696", 0.23);
  q.references.forEach((ref, i) => {
    const col = paperInk(`rgb(${wavelengthRGB(ref.nm).map(v => Math.round(v * 255)).join(",")})`);
    label(k, `${ref.nm} nm    r = ${ref.refraction.toFixed(2)}°`, 3.35, 1.52 - i * 0.43, 2.75, col, 0.28);
  });
  label(k, "Closer fronts · lower speed · same frequency", -1.65, 0.3, 5.8, "#087d79", 0.26);
  return { camera: circuitCamera, planar: true, construction: q,
    update(s, values, lab) {
      for (let side = 0; side < 2; side++) {
        const paths = dispersionFronts(q, s.t, !!side);
        fronts[side].forEach((line, i) => { line.visible = !!paths[i]; if (paths[i]) setPath(line, paths[i]); });
      }
      airFlow(s.t * q.displaySpeed / q.airLength, lab.vectors !== false);
      materialFlow((s.t - q.airLength / q.displaySpeed) * q.displaySpeed / q.index / q.materialLength, lab.vectors !== false);
    } };
}

export function createPolarisationBench(p, k) {
  opticalBench(k);
  const rack = [-2.7, 0, 2.7].map((x, i) => {
    const before = k.objects.length, group = new T.Group(), axis = new T.Group(),
      rim = k.mesh(new T.TorusGeometry(0.99, 0.065, 16, 80), 0x849fae, [x, 2.2, 0], { metalness: 0.75, roughness: 0.25 });
    rim.rotation.y = Math.PI / 2;
    const disc = k.mesh(new T.CircleGeometry(0.94, 64), 0x3b8191, [x, 2.2, 0], { transparent: true, opacity: 0.16, side: T.DoubleSide, depthWrite: false });
    disc.rotation.y = Math.PI / 2;
    opticalMount(k, x, 1.18);
    const name = k.label("", [x, 3.72, 0], "#d5eaf5", 2.5, "dark", 0.44),
      reading = k.label("", [x, 0.62, 1.05], "#79e4da", 2.5, "dark", 0.45);
    // Reparent whole mounts and labels so inserting a filter is a real visible change.
    group.userData.role = "polarisation-filter"; group.userData.slot = i;
    axis.userData.role = "polarisation-axis";
    rim.parent.add(group); k.objects.slice(before).forEach(o => group.add(o));
    group.add(axis); axis.position.set(x, 2.2, 0);
    for (let j = -2; j <= 2; j++) {
      const z = j * 0.21, h = Math.sqrt(0.82 ** 2 - z ** 2),
        rod = k.rod([0.07, -h, z], [0.07, h, z], i === 1 ? C.gold : C.cyan, j === 0 ? 0.027 : 0.011);
      axis.add(rod);
    }
    const arrow = k.arrow([0.09, -0.73, 0], [0, 1.46, 0], i === 1 ? C.gold : C.cyan);
    axis.add(arrow);
    return { group, axis, arrow, name, reading };
  });
  // Normalised transverse E fields. A signed projection determines both phase and amplitude.
  const waves = Array.from({ length: 3 }, () => dynamicCable(k, Array.from({ length: 121 }, (_, i) => [-2.5 + i / 120, 2.2, 0]), C.cyan, 0.018));
  waves.forEach((wave, i) => { wave.mesh.userData.role = "polarisation-field"; wave.mesh.userData.stage = i; });
  dashedPath(k, [[-4.8, 2.2, 0], [4.5, 2.2, 0]], C.muted, 0.45);
  const source = k.box(0.6, 0.7, 0.75, 0x355267, [-4.5, 2.2, 0]);
  opticalMount(k, -4.5, 1.8);
  const input = k.instances(14, 0.035, C.gold);
  const screen = k.mesh(new T.CircleGeometry(0.9, 64), 0x081b29, [4.5, 2.2, 0], { side: T.DoubleSide, emissive: 0x64e8d1, emissiveIntensity: 0 });
  screen.rotation.y = Math.PI / 2; screen.userData.role = "polarisation-screen";
  const frame = k.mesh(new T.TorusGeometry(0.96, 0.05, 12, 80), 0x829eaf, [4.51, 2.2, 0]);
  frame.rotation.y = Math.PI / 2; opticalMount(k, 4.5, 1.24);
  const result = k.label("", [4.5, 3.6, 0], "#79e4da", 2.7, "dark", 0.46),
    status = k.label("", [0, 4.45, 0], "#d5eaf5", 4.9, "dark", 0.46);
  k.label("Unpolarised", [-4.5, 3.18, 0], "#ffc584", 1.9, "dark", 0.36);
  k.label("Transmission axes", [0, 0.35, 1.8], "#a7c5d8", 3.2, "dark", 0.38);
  let current;
  return { liveParams: true, camera: { target: [0, 2.1, 0], radius: 11.5, polar: 1.18, azimuth: 0.72, fitAspect: 1.7 },
    update(s, values, lab) {
      current = polarisationConstruction(lab.params);
      const q = current, slots = lab.params.mode ? [0, 1, 2] : [0, 2];
      rack[1].group.visible = !!lab.params.mode;
      slots.forEach((slot, i) => {
        const filter = rack[slot];
        filter.axis.rotation.x = q.angles[i] * Math.PI / 180;
        k.setLabel(filter.name, `${i ? "Analyser" : "Polariser"}  ${q.angles[i].toFixed(0)}°`);
        k.setLabel(filter.reading, `${q.intensities[i].toFixed(2)} W/m²`);
      });
      waves.forEach((wave, i) => {
        wave.mesh.visible = i < q.xs.length && q.amplitudes[i] !== 0;
        if (i < q.xs.length) wave.update(polarisationWave(q, i, s.t));
      });
      // Changing input intensity affects the screen. This is a qualitative glow,
      // not a calibrated display luminance or a photorealistic spectral rendering.
      screen.material.emissiveIntensity = Math.min(1.8, 1.8 * Math.sqrt(q.output / 500));
      screen.userData.intensity = q.output;
      k.setLabel(result, q.output === 0 ? "Blocked · 0 W/m²" : `${q.output.toFixed(2)} W/m²`);
      k.setLabel(status, q.output === 0 ? "Crossed axes · no transmitted field" : `Final transmission  ${(q.transmission * 100).toFixed(1)}%`);
      for (let i = 0; i < 14; i++) {
        const x = -4.12 + ((s.t * 0.35 + i / 14) % 1) * 1.23,
          angle = i * 2.39996 + s.t * 0.7, r = 0.30 * Math.sin(i * 1.3 + s.t * 3);
        k.instance(input, i, [x, 2.2 + r * Math.cos(angle), r * Math.sin(angle)]);
      }
      k.finishInstances(input);
      source.userData.intensity = lab.params.intensity;
    },
    afterVisibility() { rack.forEach(filter => { filter.arrow.visible = true; }); } };
}
