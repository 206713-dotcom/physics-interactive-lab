/** Quantum teaching apparatus. No detector counts, spectrum or bias curve is
 * invented. Numeric outputs are the authoritative analytic model values. */
import * as T from "../vendor/three.module.min.js";
import { PALETTE as C, setPath } from "./scene-kit.js";
import { opticalMount, solidRay, dashedPath } from "./scene-instruments.js";
import { photoelectricDisplay, photoelectricMarkers, braggConstruction, matterWave } from "./quantum-display.js";
import { wavelengthRGB } from "./diagram-theme.js";

function plaque(k, x, width = 2.8) {
  k.box(width, 4.6, 0.12, 0x163448, [x, 2.65, -0.62], { roughness: 0.65 });
  opticalMount(k, x, 0.4);
}
const caption = (k, text, pos, width = 2.6, color = "#d8eaf3", height = 0.43) =>
  k.label(text, pos, color, width, "dark", height);
function energyBar(k, start, y, value, color, scale) {
  k.box(2.35, 0.14, 0.07, 0x304f64, [start + 1.175, y, -0.45]);
  const bar = k.box(1, 0.14, 0.085, color, [start, y, -0.4]);
  bar.visible = value > 0;
  bar.scale.x = Math.max(1e-9, value * scale); bar.position.x = start + value * scale / 2;
  bar.userData.role = "photon-energy-bar"; bar.userData.energyEV = value;
  return bar;
}

export function createPhotoelectricBench(p, k) {
  const q = photoelectricDisplay(p), color = q.band === "Visible light"
    ? new T.Color().setRGB(...wavelengthRGB(q.wavelength * 1e9), T.SRGBColorSpace)
    : q.band === "Ultraviolet" ? new T.Color(C.purple) : new T.Color(C.red);
  const panelX = 5.2;
  k.stand(12.6, 4.3);
  // Open front section provides a cutaway view of the vacuum chamber.
  const tube = k.mesh(new T.CylinderGeometry(1.08, 1.08, 6.4, 72, 1, true, Math.PI * 0.16, Math.PI * 1.35),
    0xa8d5e6, [0, 2.35, 0], { transparent:true, opacity:0.10, depthWrite:false, side:T.DoubleSide, roughness:0.16 });
  tube.rotation.z = Math.PI / 2; tube.userData.role = "photoelectric-vacuum-cutaway";
  for (const x of [-3.2, 3.2]) {
    const ring = k.mesh(new T.TorusGeometry(1.08, 0.065, 12, 80), 0x8ea8b6, [x, 2.35, 0], { metalness:0.75, roughness:0.26 });
    ring.rotation.y = Math.PI / 2; opticalMount(k, x, 1.25);
  }
  k.box(0.12, 1.65, 1.45, C.gold, [-2.45, 2.35, 0], { roughness:0.25, metalness:0.7 });
  k.box(0.12, 1.65, 1.45, C.blue, [2.55, 2.35, 0], { roughness:0.25, metalness:0.7 });
  for (const x of [-2.45, 2.55]) {
    k.rod([x, 1.55, 0], [x, 0.39, 0.85], C.muted, 0.035);
    k.rod([x, 0.39, 0.85], [Math.sign(x) * 0.65, 0.39, 1.0], C.muted, 0.035);
  }
  k.box(1.35, 0.52, 0.65, 0x173749, [0, 0.4, 1.05]);
  caption(k, `Iₛₐₜ  ${(q.current * 1e9).toFixed(2)} nA`, [0, 0.85, 1.2], 3.2, "#79e4da", 0.48);
  const source = k.cylinder(0.22, 0.66, 0x3e5671, [-0.55, 4.55, 0]);
  source.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(-1.85, -2.2, 0).normalize());
  solidRay(k, [[-0.55, 4.55, 0], [-2.4, 2.35, 0]], color, 0.35);
  const photons = k.instances(96, 0.065, color), electrons = k.instances(192, 0.052, C.cyan);
  photons.userData.role = "photoelectric-photon-markers"; electrons.userData.role = "photoelectric-electron-markers";
  photons.count = q.photonMarkers; electrons.count = q.electronMarkers;
  caption(k, q.band === "Visible light" ? "Visible light" : `${q.band} · colour key`, [-1.0, 5.05, 0], 3.1, "#c4b4ff", 0.36);
  caption(k, "Metal emitter", [-2.5, 1.05, 0.95], 2.2, "#ffc584", 0.38);
  caption(k, "Collector", [2.55, 1.05, 0.95], 1.9, "#a5c8ff", 0.38);
  caption(k, q.emission ? "Electrons emitted → collected" : "Light arrives · no electrons escape",
    [0, 3.7, 0], 5.3, q.emission ? "#79e4da" : "#ffc584", 0.45);
  plaque(k, panelX, 3.0);
  caption(k, "ONE PHOTON · ENERGY BUDGET", [panelX, 4.65, -0.48], 2.8, "#9dbbce", 0.33);
  const start = panelX - 1.175;
  for (const [value, y, title, col, css] of [
    [q.photonEV, 3.94, `Photon hf  ${q.photonEV.toFixed(2)} eV`, C.purple, "#c4b4ff"],
    [p.work, 2.91, `Work φ  ${p.work.toFixed(2)} eV`, C.gold, "#ffc584"],
    [q.kineticEV, 1.88, q.emission ? `Kₘₐₓ  ${q.kineticEV.toFixed(2)} eV` : "No emitted electrons", C.cyan, "#79e4da"],
  ]) {
    caption(k, title, [panelX, y + 0.36, -0.36], 2.7, css, 0.40);
    energyBar(k, start, y, value, col, q.energyScale);
  }
  caption(k, q.emission ? `Vₛ  ${q.stopping.toFixed(2)} V` : `Shortfall  ${q.shortfall.toFixed(2)} eV`, [panelX, 1.16, -0.36], 2.7, "#e0edf4", 0.38);
  caption(k, "Fixed energy scale · 0–6.5 eV", [panelX, 0.62, -0.36], 2.8, "#9dbbce", 0.28);
  caption(k, "Ideal collection · marker flux uses √ scale", [0, 0.25, 1.9], 5.8, "#a7c5d8", 0.3);
  return { camera:{target:[0.8,2.6,0],radius:12.3,polar:1.28,azimuth:-0.22,fitAspect:1.85},
    update(s) {
      for (const [mesh, isElectron] of [[photons, false], [electrons, true]]) {
        mesh.visible = mesh.count > 0;
        photoelectricMarkers(q, s.t, isElectron).forEach((pos, i) => k.instance(mesh, i, pos));
        k.finishInstances(mesh);
      }
    } };
}

export function createBraggBench(p, k) {
  const q = braggConstruction(p), flows = [];
  const panelX = 5.2;
  k.stand(12.6, 4.8);
  // Equal x/y/z length scales within this enlarged schematic lattice.
  for (let row = 0; row < 3; row++) {
    const y = q.top[1] - row * q.gap,
      plane = k.box(4.4, 0.018, 1.6, row ? 0x5686a8 : 0x57a6ba, [0, y, -0.7], { transparent:true, opacity:0.24, depthWrite:false, metalness:0, roughness:0.7 });
    plane.userData.role = "bragg-plane"; plane.userData.plane = row;
    for (let x = -4; x <= 4; x++) for (const z of [-1.35, -0.7, -0.05])
      k.ball(0.048, row ? C.blue : C.cyan, [x * 0.5, y, z], { roughness:0.4, metalness:0.2 });
  }
  // The ruler changes with the physical d instead of keeping a decorative gap.
  k.line([[-2.6, q.top[1], 0.1], [-2.6, q.bottom[1], 0.1]], C.white);
  for (const y of [q.top[1], q.bottom[1]]) k.line([[-2.7,y,0.1],[-2.5,y,0.1]],C.white);
  caption(k, `d  ${(p.spacing * 1e12).toFixed(1)} pm`, [-3.55, (q.top[1] + q.bottom[1]) / 2, 0.1], 1.7, "#a5c8ff", 0.34);
  if (q.permitted) {
    q.rays.forEach((ray, i) => flows.push(solidRay(k, ray, i ? C.gold : C.cyan)));
    q.wavefronts.forEach(path => dashedPath(k, path, C.white, 0.6));
    q.extraPaths.forEach(path => { if (Math.hypot(...path[1].map((v,i)=>v-path[0][i]))>1e-9) k.rod(path[0],path[1],C.purple,0.027); });
    const a = q.angle * Math.PI / 180;
    k.line(Array.from({length:65},(_,i)=>[0.95*Math.cos(a*i/64),q.top[1]+0.95*Math.sin(a*i/64),0.18]),C.cyan);
    k.line([[0,q.top[1],0.14],[1.4,q.top[1],0.14]],C.muted,0.55);
    caption(k, `θ  ${q.angle.toFixed(2)}°`, [1.65,3.5,0.16], 2.0, "#79e4da", 0.42);
    caption(k, "Two paths · same outgoing phase", [0,4.75,0], 5.2, "#d5eaf5", 0.42);
  } else {
    caption(k, "No permitted Bragg angle", [0,4.45,0], 5.0, "#ffc584", 0.52);
    caption(k, "No ray direction assigned", [0,3.8,0], 4.6, "#a7c5d8", 0.39);
  }
  plaque(k, panelX, 3.0);
  caption(k, "ELECTRON MATTER WAVE", [panelX,4.65,-0.45],2.8,"#9dbbce",0.33);
  caption(k, `${(q.wavelength*1e12).toFixed(2)} pm`, [panelX,4.04,-0.4],2.7,"#79e4da",0.6);
  caption(k, `${(p.voltage/1000).toFixed(2)} kV → ${(q.kinetic/1.602176634e-19/1000).toFixed(2)} keV`, [panelX,3.36,-0.4],2.8,"#d8eaf3",0.35);
  caption(k, `Order  n = ${p.order}`,[panelX,2.8,-0.4],2.7,"#a5c8ff",0.38);
  caption(k, q.permitted ? `Δ = ${(q.pathDifference*1e12).toFixed(2)} pm` : `nλ / 2d = ${q.argument.toFixed(3)} > 1`, [panelX,2.2,-0.4],2.8,q.permitted?"#c4b4ff":"#ffc584",0.38);
  caption(k, q.permitted ? `Beam deflection  ${(2*q.angle).toFixed(2)}°` : "sin θ cannot exceed 1",[panelX,1.58,-0.4],2.8,"#d8eaf3",0.37);
  caption(k,"Bragg construction · extension",[panelX,0.8,-0.4],2.8,"#9dbbce",0.28);
  const wave = k.line([], 0x087d79); wave.userData.role = "matter-wave-guide";
  dashedPath(k,[[-2.9,0.62,1.45],[2.9,0.62,1.45]],C.muted,0.5);
  // The two marks span one actual displayed period at the strip's fixed scale.
  for (const x of [-2.9, -2.9+q.wavelengthDisplay]) k.line([[x,0.94,1.45],[x,1.17,1.45]],C.gold);
  k.line([[-2.9,1.08,1.45],[-2.9+q.wavelengthDisplay,1.08,1.45]],C.gold);
  caption(k,"λ · separate enlarged fixed scale",[0,0.18,2.2],5.4,"#a7c5d8",0.29);
  return { camera:{target:[0.8,2.45,0],radius:12.4,polar:1.25,azimuth:-0.20,fitAspect:1.85},
    update(s, values, lab) { flows.forEach(flow => flow(s.t * 0.20,lab.vectors!==false));setPath(wave,matterWave(q,s.t)); } };
}
