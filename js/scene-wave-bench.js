/** Three solid strings sample the same travelling-wave solution as the graph.
 * Fixed-x beads expose the distinction between wave travel and medium motion. */
import { createSceneKit, PALETTE as C, setPath } from "./scene-kit.js";
import { waveAt } from "./physics-extra.js";
import { dynamicCable, dashedPath } from "./scene-instruments.js";
import * as T from '../vendor/three.module.min.js';
import { waveMeasurement } from './wave-geometry.js';

export function createWaveBench(p, root, options = {}) {
  const introductory=options.studyMode==='igcse',
    k = createSceneKit(root, options), axis = 2.05, vertical = 1.5, count = 193,
    lanes = introductory ? [{key:'resultant',z:1.35,color:0x087f7b,name:'Travelling wave →'}] : [
      { key: "incident", z: -1.35, color: C.blue, name: "Incident →" },
      { key: "reflected", z: 0, color: C.gold, name: "← Reflected" },
      { key: "resultant", z: 1.35, color: C.cyan, name: "Resultant = sum" },
    ];
  k.stand(introductory?9.4:10.5, introductory?2.2:5.7);
  if(introductory) {
    k.box(9.2,3.65,.12,0x42647b,[0,2.05,1.12],{metalness:.2,roughness:.5});
    const paper=k.box(9.0,3.45,.025,0xedf4f8,[0,2.05,1.2]);
    paper.material.dispose();paper.material=new T.MeshBasicMaterial({color:0xedf4f8,toneMapped:false});
    for(let x=-4;x<=4;x++)k.line([[x,.45,1.23],[x,3.55,1.23]],0x99b5c8,.2);
    for(const dy of [-p.amplitude,0,p.amplitude])dashedPath(k,[[-4,axis+dy*vertical,1.26],[4,axis+dy*vertical,1.26]],dy?0x7ca9b7:0x476f88,dy?.4:.6);
    k.label('Travelling wave →',[0,3.55,1.4],'#176a71',2.5,'paper');
  }
  for (const x of introductory?[]:[-4.2, 4.2]) {
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
    if(!introductory)k.label(lane.name, [-3 + index * 3, 4.4, lane.z], lane.key === "incident" ? "#a2caff" : lane.key === "reflected" ? "#ffc584" : "#64e8d1", 2.4);
    return { ...lane, points, cable };
  });
  for (let i = 0; i <= 8; i++) {
    const x = i - 4;
    k.line([[x, introductory?.7:.05, introductory?1.28:2.05], [x, introductory?.62:.05, introductory?1.28:2.3]], introductory?0x50768d:C.muted, 0.8);
    if (!(i % 2)) k.label(i + " m", [x, introductory?.48:.07, introductory?1.4:2.62], introductory?'#42667e':"#91afc0", 0.6,introductory?'ink':'dark');
  }
  const beads = k.instances(33, 0.052, introductory?0x3e8c93:0xb9e8df),
    probe = k.ball(0.105, introductory?0xb07a2a:C.gold, [p.probe - 4, axis, 1.35], { emissive: C.gold, emissiveIntensity: 0.15 }),
    arrow = k.arrow([p.probe - 4, axis, 1.6], [0, 1, 0], introductory?0xa16c23:C.gold),
    value = k.label("", [0, 5.25, 0], "#d4e7ee", 5.4);
  probe.userData.role = "wave-probe";
  const probeX = p.probe - 4;
  dashedPath(k, [[probeX, 0.15, 1.35], [probeX, 4.15, 1.35]], C.gold, 0.25);
  k.label(introductory?'Marked particle':"Probe · fixed position", [probeX, introductory?.82:.58, introductory?1.5:2.1], introductory?'#8e601f':"#ffc584", introductory?1.8:2.4,introductory?'paper':'dark');
  const waveGuide=k.line([],introductory?0x7b57a4:C.purple,.8),
    amplitudeGuide=k.line([],introductory?0x0c7c79:C.cyan,.8),
    lambdaLabel=k.label('',[0,3,1.6],introductory?'#705294':'#c3a6ff',1.5,introductory?'paper':'dark'),
    amplitudeLabel=k.label('A',[-4.28,axis+p.amplitude*vertical/2,1.45],introductory?'#086c69':'#64e8d1',.35,introductory?'ink':'dark');
  waveGuide.userData.role='wave-wavelength-guide';
  amplitudeGuide.userData.role='wave-amplitude-guide';
  const guideZ=introductory?1.42:-1.28;
  amplitudeLabel.position.z=guideZ;
  setAmplitudeGuide();
  function setAmplitudeGuide(){
    const y=axis+p.amplitude*vertical;
    // Endpoints show equilibrium to one crest, rather than peak-to-peak.
    setPath(amplitudeGuide,[[-4.08,axis,guideZ],[-4.2,axis,guideZ],[-4.2,y,guideZ],[-4.08,y,guideZ]]);
  }
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
    const {first}=waveMeasurement(p,s.t),
      crest=axis+p.amplitude*vertical,guideY=crest+.27;
    const points=[[first-4,crest,guideZ],[first-4,guideY,guideZ],[first+p.wavelength-4,guideY,guideZ],[first+p.wavelength-4,crest,guideZ]];
    // Reuse the buffer as the crest pair advances through the observation window.
    setPath(waveGuide,points);
    lambdaLabel.position.set(first+p.wavelength/2-4,guideY+.16,guideZ);
    k.setLabel(lambdaLabel,(introductory?'λ':'Incident λ')+' = '+p.wavelength.toFixed(2)+' m',introductory?'#705294':'#c3a6ff',introductory?1.5:2.0);
  };
  return {
    planar:introductory,
    target: introductory?[0,2.05,1.35]:[0,2.15,0], radius: introductory?8:9.4, fitAspect: 1.75, polar: introductory?1.33:1.05, azimuth: introductory?-.06:-.18, kit: k,
    update(lab) { readout(lab.state); k.visibility(lab.showLabels !== false, lab.vectors !== false); waveGuide.visible=amplitudeGuide.visible=lab.showLabels!==false; },
  };
}
