/** Moving beam, masses and vertical weight vectors read the same integrated
 * angle as the graph. One fixed scene scale: 2 world units per metre. */
import * as T from '../vendor/three.module.min.js';
import { PALETTE as C, setPath } from './scene-kit.js';
import { BEAM_STOP } from './moments-physics.js';
import { dashedPath } from './scene-instruments.js';
export function createMomentsBench(p,k) {
  const scale=2,pivotY=2.05,half=Math.max(1.15,p.d1,p.d2)*scale+.35,
    metal={metalness:.65,roughness:.28};
  k.stand(half*2+.6,3.2);
  k.box(.85,.16,1.2,0x385a70,[0,.12,0],metal);
  k.cylinder(.2,pivotY-.14,0x91afbc,[0,pivotY/2,0],metal);
  const axle=k.cylinder(.14,.8,0xb0c7d0,[0,pivotY,0],metal);axle.rotation.x=Math.PI/2;
  const disc=k.cylinder(.19,.10,0x547589,[0,pivotY,.48],metal);disc.rotation.x=Math.PI/2;
  k.ring(.195,C.white,[0,pivotY,.55],'z',.85);
  const cap=k.cylinder(.075,.025,0xc5d7df,[0,pivotY,.55],metal);cap.rotation.x=Math.PI/2;
  // A bearing frame and stop scale make the pivot visible without covering
  // the beam. These decorative parts carry no additional mass or inertia.
  for(const z of [-.42,.28]) for(const sign of [-1,1])
    k.rod([sign*.38,.25,z],[0,pivotY-.18,z],0x587a90,.055);
  const stopArc=Array.from({length:49},(_,i)=>{
    const a=-BEAM_STOP+2*BEAM_STOP*i/48;return [.82*Math.cos(a),pivotY+.82*Math.sin(a),.36];
  });
  k.line(stopArc,0x8bb1c5,.55);
  for(let angle=-20;angle<=20;angle+=5) {
    const a=angle*Math.PI/180,r=angle%10===0?.78:.8;
    k.line([[r*Math.cos(a),pivotY+r*Math.sin(a),.37],[.87*Math.cos(a),pivotY+.87*Math.sin(a),.37]],0xaac7d4,.8);
  }
  for(const sign of [-1,1]) {
    const peg=k.cylinder(.065,.18,C.red,[.73*Math.cos(BEAM_STOP),pivotY+sign*.73*Math.sin(BEAM_STOP),.36],metal);
    peg.rotation.x=Math.PI/2;
  }
  const moving=new T.Group();k.add(moving,[0,pivotY,0],'moments-beam');
  const beam=k.box(half*2,.14,.42,0xb5d0d9,[0,0,0],metal);moving.add(beam);
  // Engraved ticks use the very same two scene units per metre as the loads.
  for(let i=-Math.floor(half/scale*10);i<=Math.floor(half/scale*10);i++) {
    const x=i*scale/10,major=i%5===0,
      tick=k.line([[x,-.045,.216],[x,major?.05:.0,.216]],0x2c5269,.8);
    moving.add(tick);tick.userData.role='moments-ruler-tick';tick.userData.metres=i/10;
  }
  const labelWidth=Math.min(1.15,Math.min(p.d1,p.d2)*scale*2),
    weights=[[-p.d1*scale,p.m1,C.cyan],[p.d2*scale,p.m2,C.gold]].map(([x,mass,color],i)=>{
      const size=Math.min(.52,.6*Math.abs(x)),block=k.box(size,size,.62,color,[x,0,0],{metalness:.32,roughness:.3});
      moving.add(block);block.userData.role=i?'moments-right-mass':'moments-left-mass';
      const face=k.box(size*.7,size*.7,.018,0xe4edf0,[0,0,.32],metal);block.add(face);
      return {x,mass,block,label:k.label(`${mass.toFixed(2)} kg`,[x,pivotY+.6,0],i?'#ffd293':'#83ead6',labelWidth),
        vector:k.arrow([x,pivotY,0],[0,-1,0],color),
        guide:dashedPath(k,[[x,pivotY,0],[x,.43,0]],color,.32),
        arm:k.line([],color,.9),
        reading:k.label('',[x/2,.22,1.05],i?'#ffd293':'#83ead6',1.15)};
    });
  k.label('Pivot',[0,pivotY+.53,.05],'#d1e6ee',1);
  k.label('Angular stops · ±24°',[0,.05,-1.1],'#b8d0da',2.5);
  return {camera:{target:[0,1.55,0],radius:7.3,polar:1.25,azimuth:-.12,fitAspect:1.6},
    update(s,q,lab){
      const theta=s.theta||0,cos=Math.cos(theta),sin=Math.sin(theta),
        // One fixed common force scale per setup, with room above the base
        // even at the lowest supported load position and the angular stop.
        forceScale=Math.min(1.05,pivotY-Math.max(p.d1,p.d2)*scale*Math.sin(BEAM_STOP)-.35)/Math.max(p.m1,p.m2);
      moving.rotation.z=theta;
      weights.forEach((w,i)=>{
        const x=w.x*cos,y=pivotY+w.x*sin;
        k.setArrow(w.vector,[x,y-.2,.65],[0,-w.mass*forceScale,0]);
        w.label.position.set(x,y+.58,.15);
        setPath(w.guide,[[x,y-.1,.65],[x,.43,.65]]);w.guide.computeLineDistances();
        setPath(w.arm,[[0,.54,.72],[0,.43,.72],[x,.43,.72],[x,.54,.72]]);
        w.reading.position.x=x/2;
        k.setLabel(w.reading,`d${i?'₂':'₁'} · ${(i?q.armRight:q.armLeft).toFixed(2)} m`,i?'#ffd293':'#83ead6',1.15);
        w.guide.visible=w.arm.visible=lab.showLabels!==false;
      });
    }};
}
