/** Calibrated oscillation apparatus. Views read the integrated SI state.
 * Decorative bearings, wheel rotation, wire and dashpot add no dynamics. */
import * as T from '../vendor/three.module.min.js';
import { createSceneKit, PALETTE as C, putRod, setPath } from './scene-kit.js';
import { detailedCart } from './scene-motion-benches.js';
import { createHelix } from './spring-helix.js';
import { dashedPath } from './scene-instruments.js';
import { springReadings, pendulumReadings, pendulumPeriod, smallAngleReference, oscillationScales, pendulumPoint, PENDULUM_RIG, SPRING_TRACK } from './oscillation-physics.js';
const metal={metalness:.8,roughness:.25},role=(o,name)=>{o.userData.role=name;return o;},
  fmt=v=>v!==0&&Math.abs(v)<.01?v.toExponential(2):v.toFixed(2),mul=(v,n)=>v.map(x=>x*n);

/** Three contiguous segments use the same release-energy scale. Dissipation
 * is the integral of damping power, NOT a fabricated E0-E remainder. */
export function energyLedger(k,initial,y,z=0,width=7.2) {
  const track=k.box(width+.12,.22,.12,0x263c50,[0,y,z],{roughness:.85});
  const bars=[C.gold,C.cyan,C.red].map((color,i)=>role(k.box(width,.12,.15,color,[0,y,z+.08]),['energy-kinetic','energy-potential','energy-dissipated'][i])),
    reading=k.label('',[0,y+.48,z],'#bed7e3',7.7);
  return {bars,reading,track,update(q,refresh=true){
    let start=-width/2;
    [q.kinetic,q.potential,q.dissipated].forEach((value,i)=>{
      const fraction=initial>0?Math.max(0,value/initial):0;
      bars[i].visible=value>0&&initial>0;bars[i].scale.x=fraction;
      bars[i].position.x=start+width*fraction/2;start+=width*fraction;
    });
    if(refresh)k.setLabel(reading,initial>0?`K ${fmt(q.kinetic)} J · U ${fmt(q.potential)} J · damping ${fmt(q.dissipated)} J`:'At equilibrium · zero release energy','#bed7e3',7.7);
  }};
}

export function createSpringBench(p,root,options={}) {
  const k=createSceneKit(root,options),scales=oscillationScales('spring',p),h=SPRING_TRACK.height,
    cart=detailedCart(k,C.cyan,p.mass),mass=role(cart.group,'spring-mass');
  mass.scale.setScalar(1.2);k.stand(10.7,3.9);
  for(const z of [-.48,.48])k.rod([-4.8,.24,z],[4.8,.24,z],0xa0b7c2,.045);
  k.box(.26,1.5,1.7,0x3c5364,[-4.6,.79,-.25],metal);
  for(const y of [.35,1.28])for(const z of [-.75,.35]){
    const screw=k.cylinder(.055,.035,0xc0cfd5,[-4.45,y,z],metal);screw.rotation.z=Math.PI/2;
  }
  const helix=createHelix(),coil=role(k.mesh(helix.geometry,0xc7dae0,[-4.3,h,0],metal),'spring-coil'),
    connector=k.rod([-4.48,h,0],[-4.3,h,0],C.white,.033),end=k.rod([0,h,0],[1,h,0],C.white,.033);
  // Parallel viscous damper: fixed housing, sliding piston, a sealed collar.
  const housing=k.cylinder(.15,1.15,p.damping?0xb17d6e:0x5b6c79,[-3.62,h,-.85],metal);housing.rotation.z=Math.PI/2;
  k.rod([-4.48,h,-.85],[-4.2,h,-.85],0xa8bbc5,.04);
  const collar=k.cylinder(.18,.09,0xd0b28a,[-3.04,h,-.85],metal);collar.rotation.z=Math.PI/2;
  const piston=role(k.rod([-3,h,-.85],[0,h,-.85],0xc8d6db,.045),'spring-damper-piston'),
    bracket=k.rod([0,h,-.85],[0,h,0],0x8ea5b4,.03);
  const damperLabel=k.label(`Viscous damper · b = ${fmt(p.damping)} kg/s`,[-2.8,.13,-1.45],'#ba9e96',3.5);
  // A fixed displacement ruler, identical for every release amplitude.
  for(let i=-4;i<=4;i++) {
    const x=1+i*.2*SPRING_TRACK.scale;
    k.line([[x,.07,.9],[x,.07,1.15]],C.muted,.8);
    if(i%2===0)k.label(`${Number((i*.2).toFixed(1))} m`,[x,.12,1.44],'#abc9d8',.85);
  }
  dashedPath(k,[[1,.08,-1.15],[1,.08,1.2]],C.purple,.6);
  const equilibriumLabel=k.label('Equilibrium · x = 0',[1,-.3,1.65],'#b3add6',2.8);
  const xMark=role(k.line([[1,.18,1.0],[1,.18,1.0]],C.purple,.9),'spring-displacement'),
    arrows=[C.gold,C.purple,C.cyan,C.red,C.purple].map(c=>k.arrow([0,2,0],[1,0,0],c)),
    xLabel=k.label('',[-2.15,5.35,0],'#e0edf4',3.4),vLabel=k.label('',[2.15,5.35,0],'#ffc584',3.4),
    regime=k.label('',[0,6.08,0],'#bbd6e1',6.2),
    restoringLabel=k.label('',[-2.65,3.0,0],'#64e8d1',2.5),dampingLabel=k.label('',[0,3.0,0],'#ff9e91',2.5),netLabel=k.label('',[2.65,3.0,0],'#c3a6ff',2.5),
    legend=k.label('',[0,3.55,0],'#b0cbd9',7.2),ledger=energyLedger(k,.5*p.k*p.displacement**2,4.08);
  let last=-Infinity,lastMode;
  const readouts=[xLabel,vLabel,regime,restoringLabel,dampingLabel,netLabel,legend,damperLabel,equilibriumLabel,ledger.reading,ledger.track,...ledger.bars];
  return {target:[0,1.9,0],radius:9.4,polar:1.22,azimuth:-.17,fitAspect:1.65,kit:k,update(lab){
    const s=lab.state,q=springReadings(s,p),x=1+SPRING_TRACK.scale*s.x,motion=lab.oscillationVectors==='motion',
      refresh=!lab.running||s.t<last||s.t-last>=.08||lastMode!==motion;
    mass.position.set(x,.285-.045*1.2,0);cart.roll(x/1.2);
    helix.update(x-.62+4.3);putRod(end,[x-.62,h,0],[x-.48,h,0]);
    putRod(piston,[-3,h,-.85],[x-.57,h,-.85]);putRod(bracket,[x-.57,h,-.85],[x-.57,h,-.32]);
    setPath(xMark,[[1,.18,1.0],[x,.18,1.0]]);
    const values=[s.v*scales.velocity,q.a*scales.acceleration,q.restoring*scales.force,q.damping*scales.force,q.net*scales.force];
    arrows.forEach((a,i)=>k.setArrow(a,[x,i<2?2.35-i*.62:2.35-(i-2)*.58,0],[values[i],0,0]));
    if(refresh){
      k.setLabel(xLabel,`x = ${s.x.toFixed(2)} m`,'#e0edf4',3.4);
      k.setLabel(vLabel,`v = ${s.v.toFixed(2)} m/s`,'#ffc584',3.4);
      k.setLabel(restoringLabel,`−kx = ${q.restoring.toFixed(2)} N`,'#64e8d1',2.5);
      k.setLabel(dampingLabel,`−bv = ${q.damping.toFixed(2)} N`,'#ff9e91',2.5);
      k.setLabel(netLabel,`Net = ${q.net.toFixed(2)} N`,'#c3a6ff',2.5);
      k.setLabel(regime,`${q.regime} · ζ = ${q.zeta.toFixed(2)} · T₀ = ${q.period.toFixed(2)} s`,'#bbd6e1',6.2);
      k.setLabel(legend,motion?'Gold: velocity · purple: acceleration · separate arrow scales':'Cyan: spring · coral: damping · purple: resultant · one force scale','#b0cbd9',7.2);
      last=s.t;lastMode=motion;
    }
    ledger.update(q,refresh);k.visibility(lab.showLabels!==false,lab.vectors!==false);
    arrows.forEach((a,i)=>a.visible=a.visible&&(i<2?motion:!motion));
    xMark.visible=lab.showLabels!==false;
    if(lab.cleanPresentation)readouts.forEach(o=>o.visible=false);
  }};
}

export function createPendulumBench(p,root,options={}) {
  const k=createSceneKit(root,options),{length,pivot}=PENDULUM_RIG,scales=oscillationScales('pendulum',p);
  k.stand(8.6,4.0);
  for(const x of [-3.7,3.7]){
    k.box(.7,.12,1.7,0x3b5366,[x,.1,-.6],metal);
    k.rod([x,.2,-.6],[x,5.35,-.6],0x7f9baa,.065);
    for(const z of [-1.2,.1])k.rod([x,.17,z],[x,1.35,-.6],0x527082,.04);
    for(const z of [-1.2,.1])k.cylinder(.035,.03,0xb2c6d1,[x,.18,z],metal);
  }
  k.rod([-3.7,5.35,-.6],[3.7,5.35,-.6],0xa3bbc6,.075);
  k.rod([0,5.35,-.6],[0,pivot[1],-.6],0x7693a3,.055);
  k.rod([0,pivot[1],-.7],[0,pivot[1],.18],0x9eb4c1,.08);
  for(const [radius,z] of [[.21,-.1],[.14,.1],[.07,.2]]){
    const bearing=k.cylinder(radius,.12,radius===.14?0xbaa071:0x9aafbb,[0,pivot[1],z],metal);bearing.rotation.x=Math.PI/2;
  }
  const bob=role(k.ball(.2+.02*Math.sqrt(p.mass),C.gold,pendulumPoint(0),{metalness:.84,roughness:.2}),'pendulum-bob'),
    rod=role(k.rod(pivot,pendulumPoint(0),0xb6cbd3,.025),'pendulum-link'),
    path=role(k.line(Array.from({length:1201},()=>pendulumPoint(0)),C.gold,.5),'pendulum-trail'),
    angle=role(k.line(Array.from({length:33},()=>[0,0,0]),C.cyan,.8),'pendulum-angle');
  const referenceRod=dashedPath(k,[pivot,pendulumPoint(0)],C.purple,.65),
    referenceBob=role(k.ring(.24,C.purple,pendulumPoint(0),'z',.9),'pendulum-reference');
  dashedPath(k,[pivot,pendulumPoint(0)],C.muted,.7);
  // Angle markings cover both ±120° releases without changing length mid-run.
  const rim=[], limit = options.studyMode === "igcse" ? 30 : 120;
  for(let degrees=-limit;degrees<=limit;degrees+=2){
    const a=degrees*Math.PI/180;rim.push([2.94*Math.sin(a),pivot[1]-2.94*Math.cos(a),-.24]);
    if(degrees%10===0){
      const outer=degrees%30===0?3.07:3.0;
      k.line([[2.9*Math.sin(a),pivot[1]-2.9*Math.cos(a),-.24],[outer*Math.sin(a),pivot[1]-outer*Math.cos(a),-.24]],C.muted,.75);
      if(degrees%30===0&&degrees!==0)k.label(`${degrees}°`,[3.27*Math.sin(a),pivot[1]-3.27*Math.cos(a),-.23],'#9bbdce',.72);
    }
  }
  k.line(rim,0x4b6e81,.4);
  const vectors=[C.gold,C.purple,C.blue,C.cyan,C.red].map(c=>k.arrow([0,1,0],[0,0,0],c)),
    thetaLabel=k.label('',[-2.0,6.12,0],'#e1edf4',2.4),speedLabel=k.label('',[2.2,6.12,0],'#ffc584',3.3),
    periodLabel=k.label(`T₀ ${fmt(2*Math.PI*Math.sqrt(p.length/p.g))} s · finite-angle ${fmt(pendulumPeriod(p))} s (undamped)`,[0,6.83,0],'#b3ccda',7.5),
    legend=k.label('',[0,-.65,1.0],'#bed5df',7.8),
    forceLabel=k.label('',[0,5.47,0],'#a8ccde',6.7),
    referenceLabel=k.label('',[0,-1.14,1.0],'#c3a6ff',7.0),
    ledger=energyLedger(k,pendulumReadings({theta:p.angle*Math.PI/180,omega:0},p).initial,-.1,1.0,6.7);
  let last=-Infinity,lastMode,lastReference;
  const readouts=[thetaLabel,speedLabel,periodLabel,legend,forceLabel,referenceLabel,ledger.reading,ledger.track,...ledger.bars];
  return {target:[0,3.55,0],radius:10.8,polar:1.47,azimuth:-.16,fitAspect:1.5,kit:k,update(lab){
    const s=lab.state,q=pendulumReadings(s,p),at=pendulumPoint(s.theta),motion=lab.oscillationVectors!=='forces',
      compare=lab.smallAngleReference===true,ref=smallAngleReference(p,s.t),refresh=!lab.running||s.t<last||s.t-last>=.08||motion!==lastMode||compare!==lastReference;
    bob.position.set(...at);putRod(rod,pivot,at);
    const hist=lab.trail??[];setPath(path,hist.map(v=>[v.x*length/p.length,pivot[1]+v.y*length/p.length,.03]));
    setPath(angle,Array.from({length:33},(_,i)=>{const a=s.theta*i/32;return [.56*Math.sin(a),pivot[1]-.56*Math.cos(a),.13];}));
    const refAt=pendulumPoint(ref.theta);referenceBob.position.set(...refAt);referenceBob.position.z=.12;
    setPath(referenceRod,[pivot,refAt]);referenceRod.computeLineDistances();
    const values=[mul(q.velocity,scales.velocity),mul(q.acceleration,scales.acceleration),mul(q.weight,scales.force),mul(q.constraint,scales.force),mul(q.damping,scales.force)];
    vectors.forEach((v,i)=>k.setArrow(v,[at[0],at[1],.3+i*.025],values[i]));
    if(refresh){
      k.setLabel(thetaLabel,`θ = ${(s.theta*180/Math.PI).toFixed(1)}°`,'#e1edf4',2.4);
      k.setLabel(speedLabel,`Speed = ${q.speed.toFixed(2)} m/s`,'#ffc584',3.3);
      k.setLabel(forceLabel,motion?`L = ${p.length.toFixed(2)} m · rigid massless link · +θ to the right`:`Weight ${fmt(p.mass*p.g)} N · link ${fmt(q.link)} N · drag ${fmt(q.drag)} N`,'#a8ccde',6.7);
      k.setLabel(legend,motion?'Gold: velocity · purple: total acceleration · separate scales':'Blue: weight · cyan: link force · coral: damping · one force scale','#bed5df',7.8);
      k.setLabel(referenceLabel,compare?`Dashed purple: linear prediction · θ = ${(ref.theta*180/Math.PI).toFixed(1)}°`:'Rigid link can pull or push; no slack-string approximation','#c3a6ff',7.0);
      last=s.t;lastMode=motion;lastReference=compare;
    }
    ledger.update(q,refresh);k.visibility(lab.showLabels!==false,lab.vectors!==false);
    vectors.forEach((v,i)=>v.visible=v.visible&&(i<2?motion:!motion));
    referenceBob.visible=referenceRod.visible=compare;path.visible=lab.showTrail!==false;
    angle.visible=lab.showLabels!==false;
    if(lab.cleanPresentation)readouts.forEach(o=>o.visible=false);
  }};
}
