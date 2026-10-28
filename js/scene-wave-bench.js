/** Three solid strings sample the same travelling-wave solution as the graph.
 * Fixed-x beads expose the distinction between wave travel and medium motion. */
import { createSceneKit, PALETTE as C } from "./scene-kit.js";
import { waveAt } from "./physics-extra.js";
import { dynamicCable, dashedPath } from "./scene-instruments.js";

export function createWaveBench(p, root, options = {}) {
  const k = createSceneKit(root, options), axis = 2.05, vertical = 1.5, count = 193,
    lanes = [
      { key: "incident", z: -1.35, color: C.blue, name: "Incident →" },
      { key: "reflected", z: 0, color: C.gold, name: "← Reflected" },
      { key: "resultant", z: 1.35, color: C.cyan, name: "Resultant = sum" },
    ];
  k.stand(10.5, 5.7);
  for (const x of [-4.2, 4.2]) {
    for (const z of [-2, 2]) {
      k.rod([x, 0.05, z], [x, 3.9, z], 0x879daa, 0.045);
      k.box(0.4, 0.12, 0.45, 0x314d60, [x, 0.12, z], { metalness: 0.65, roughness: 0.4 });
    }
    k.rod([x, 3.9, -2], [x, 3.9, 2], 0x879daa, 0.045);
  }
  const strings = lanes.map((lane, index) => {
    const points = Array.from({ length: count }, (_, i) => [i / (count - 1) * 8 - 4, axis, lane.z]);
    dashedPath(k, [[-4, axis, lane.z], [4, axis, lane.z]], lane.color, 0.2);
    const cable = dynamicCable(k, points, lane.color, lane.key === "resultant" ? 0.034 : 0.024);
    cable.mesh.userData.role = "wave-" + lane.key;
    k.label(lane.name, [-3 + index * 3, 4.4, lane.z], lane.key === "incident" ? "#a2caff" : lane.key === "reflected" ? "#ffc584" : "#64e8d1", 2.4);
    return { ...lane, points, cable };
  });
  for (let i = 0; i <= 8; i++) {
    const x = i - 4;
    k.line([[x, 0.05, 2.05], [x, 0.05, 2.3]], C.muted, 0.8);
    if (!(i % 2)) k.label(i + " m", [x, 0.07, 2.62], "#91afc0", 0.6);
  }
  const beads = k.instances(33, 0.052, 0xb9e8df),
    probe = k.ball(0.105, C.gold, [p.probe - 4, axis, 1.35], { emissive: C.gold, emissiveIntensity: 0.25 }),
    arrow = k.arrow([p.probe - 4, axis, 1.6], [0, 1, 0], C.gold),
    value = k.label("", [0, 5.25, 0], "#d4e7ee", 5.4);
  probe.userData.role = "wave-probe";
  const probeX = p.probe - 4;
  dashedPath(k, [[probeX, 0.15, 1.35], [probeX, 4.15, 1.35]], C.gold, 0.25);
  k.label("Probe · fixed position", [probeX, 0.58, 2.1], "#ffc584", 2.4);
  const readout = (s) => {
    const q = waveAt(p.probe, s.t, p), y = axis + vertical * q.resultant;
    for (const lane of strings) {
      for (let i = 0; i < count; i++) lane.points[i][1] = axis + vertical * waveAt(i / (count - 1) * 8, s.t, p)[lane.key];
      lane.cable.update(lane.points);
    }
    for (let i = 0; i < 33; i++) {
      const x = i / 32 * 8;
      k.instance(beads, i, [x - 4, axis + vertical * waveAt(x, s.t, p).resultant, 1.35]);
    }
    k.finishInstances(beads);
    probe.position.y = y;
    k.setArrow(arrow, [probeX, axis, 1.6], [0, y - axis, 0]);
    k.setLabel(value, `${q.incident.toFixed(3)} + (${q.reflected.toFixed(3)}) = ${q.resultant.toFixed(3)} m`, "#d4e7ee", 5.4);
  };
  return {
    target: [0, 2.15, 0], radius: 10.7, fitAspect: 1.65, polar: 1.05, azimuth: -0.3, kit: k,
    update(lab) { readout(lab.state); k.visibility(lab.showLabels !== false, lab.vectors !== false); },
  };
}
