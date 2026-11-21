/** Moving beam, masses and vertical weight vectors read the same integrated
 * angle as the graph. One fixed scene scale: 2 world units per metre. */
import * as T from '../vendor/three.module.min.js';
import { PALETTE as C, setPath } from './scene-kit.js';
import { BEAM_STOP } from './moments-physics.js';
import { dashedPath } from './scene-instruments.js';
import { FINISH, slottedMasses } from './scene-props.js';
export function createMomentsBench(p,k) {
  const scale=2,pivotY=2.05,half=Math.max(1.15,p.d1,p.d2)*scale+.35,
    metal={metalness:.65,roughness:.28};
  k.stand(half*2+.6,3.2);
  // Knife-edge stand: an iron foot, two steel cheek plates and a pin through
  // the rule. Decorative parts carry no mass or inertia in the model.
  k.box(1.5,.12,1.15,FINISH.iron[0],[0,.06,0],FINISH.iron[1]);
  for(const z of [-.36,.36]) {
    const cheek=new T.Shape();cheek.moveTo(-.55,0);cheek.lineTo(.55,0);cheek.lineTo(.13,pivotY+.12);cheek.lineTo(-.13,pivotY+.12);cheek.closePath();
    const hole=new T.Path();hole.moveTo(-.2,.3);hole.lineTo(.2,.3);hole.lineTo(.06,pivotY-.45);hole.lineTo(-.06,pivotY-.45);hole.closePath();cheek.holes.push(hole);
    k.mesh(new T.ExtrudeGeometry(cheek,{depth:.05,bevelEnabled:false}),FINISH.steel[0],[0,.12,z-.025],FINISH.steel[1]);
    const cap=k.cylinder(.085,.05,FINISH.brass[0],[0,pivotY,z+Math.sign(z)*.05],FINISH.brass[1]);cap.rotation.x=Math.PI/2;
  }
  const axle=k.cylinder(.04,.86,FINISH.chrome[0],[0,pivotY,0],FINISH.chrome[1]);axle.rotation.x=Math.PI/2;
  const stopArc=Array.from({length:49},(_,i)=>{
    const a=-BEAM_STOP+2*BEAM_STOP*i/48;return [.82*Math.cos(a),pivotY+.82*Math.sin(a),.36];
  });
  k.line(stopArc,0xc9c9c9,.55);
  for(let angle=-20;angle<=20;angle+=5) {
    const a=angle*Math.PI/180,r=angle%10===0?.78:.8;
    k.line([[r*Math.cos(a),pivotY+r*Math.sin(a),.37],[.87*Math.cos(a),pivotY+.87*Math.sin(a),.37]],0xaac7d4,.8);
  }
  for(const sign of [-1,1]) {
    const peg=k.cylinder(.05,.2,FINISH.brass[0],[.73*Math.cos(BEAM_STOP),pivotY+sign*.73*Math.sin(BEAM_STOP),.36],FINISH.brass[1]);
    peg.rotation.x=Math.PI/2;
  }
  const moving=new T.Group();k.add(moving,[0,pivotY,0],'moments-beam');
  const beam=k.box(half*2,.14,.42,FINISH.boxwood[0],[0,0,0],{roughness:.6,metalness:0});moving.add(beam);
  // Engraved ticks use the very same two scene units per metre as the loads.
  for(let i=-Math.floor(half/scale*10);i<=Math.floor(half/scale*10);i++) {
    const x=i*scale/10,major=i%5===0,
      tick=k.line([[x,-.045,.216],[x,major?.05:.0,.216]],0x24170c,.9);
    moving.add(tick);tick.userData.role='moments-ruler-tick';tick.userData.metres=i/10;
  }
  const labelWidth=Math.min(1.15,Math.min(p.d1,p.d2)*scale*2),
    weights=[[-p.d1*scale,p.m1,C.cyan],[p.d2*scale,p.m2,C.gold]].map(([x,mass,color],i)=>{
      // A sliding clip on the rule carries a hanger of slotted masses, which
      // stays vertical under gravity however far the rule tips.
      const block=k.box(.13,.24,.5,FINISH.steel[0],[x,0,0],FINISH.steel[1]);
      moving.add(block);block.userData.role=i?'moments-right-mass':'moments-left-mass';
      const count=Math.max(1,Math.min(6,Math.ceil(mass))),
        hanger=slottedMasses(k,{count,radius:.2+.012*count,thickness:.055,stem:.1+count*.059,
          finish:[color,{metalness:.9,roughness:.3,envMapIntensity:1.3}]});
      moving.add(hanger);hanger.position.set(x,-.12,0);
      return {x,mass,block,hanger,label:k.label(`${mass.toFixed(2)} kg`,[x,pivotY+.6,0],i?'#ffd293':'#83ead6',labelWidth),
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
      for(const w of weights)w.hanger.rotation.z=-theta;
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
