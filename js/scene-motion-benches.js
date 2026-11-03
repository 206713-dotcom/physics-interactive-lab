/** Detailed carts and calibrated rulers. Wheel rotation is a visual cue;
 * rolling resistance and rotational kinetic energy are not in these models. */
import * as T from "../vendor/three.module.min.js";
import { PALETTE as C, createSceneKit } from "./scene-kit.js";
import { motionLayout, tickStep, collisionFrame, collisionSpeedScale, COLLISION_SCALE } from "./kinematics-display.js";
const metal={metalness:.75,roughness:.3};
const role=(o,name)=>{o.userData.role=name;return o;};
export function detailedCart(k,color,mass=1) {
  const group=new T.Group();k.add(group);role(group,'detailed-cart');
  const parts=[k.box(.68,.23,.57,color,[0,.32,0],{...metal,roughness:.38}),k.box(.57,.06,.5,0xc7d5db,[0,.47,0],metal)];
  for (const z of [-.287,.287]) {
    parts.push(k.box(.54,.043,.012,color,[0,.36,z],{roughness:.42,emissive:color,emissiveIntensity:.21}));
    parts.push(k.box(.28,.035,.012,0xd9e8ed,[0,.285,z],{roughness:.35}));
  }
  for(const x of [-.37,.37]) parts.push(k.box(.06,.19,.5,0x344958,[x,.31,0],{roughness:.65}));
  const wheels=[];
  for(const x of [-.24,.24])for(const z of [-.32,.32]) {
    const axle=new T.Group();axle.position.set(x,.15,z);group.add(axle);
    const wheel=k.cylinder(.105,.07,0x152634,[0,0,0],{roughness:.85});wheel.rotation.x=Math.PI/2;
    const hub=k.cylinder(.045,.074,0x9fb7c3,[0,0,0],metal);hub.rotation.x=Math.PI/2;
    axle.add(wheel,hub);
    const face=Math.sign(z)*.04;
    axle.add(k.rod([-.07,0,face],[.07,0,face],0xa0b6c3,.009),k.rod([0,-.07,face],[0,.07,face],0xa0b6c3,.009));
    wheels.push(axle);
  }
  const weight=k.box(.4,.08+.16*Math.sqrt(mass),.38,0xa58a61,[0,.54+.08*Math.sqrt(mass),0],metal);parts.push(weight);
  parts.forEach(o=>group.add(o));
  return {group,wheels,roll(x){wheels.forEach(o=>o.rotation.z=-x/.105);}};
}
export function mechanicsDeck(k) {
  k.stand(10.2,4.3);
  k.box(9.55,.08,1.23,0x192e3e,[0,.075,0],{roughness:.68});
  for(const z of [-.45,.45]) k.rod([-4.7,.17,z],[4.7,.17,z],0x819dab,.045);
  for(const x of [-4.4,4.4]) k.box(.45,.12,1.35,0x3a5365,[x,.08,0],metal);
}
export function createMotionBench(p,k) {
  mechanicsDeck(k);const layout=motionLayout(p),
    cart=p.mode?null:detailedCart(k,C.cyan,p.mass),
    body=p.mode?role(k.ball(.22,0xc7a66e,[-1.7,3,0],metal),'motion-body'):role(cart.group,'motion-body');
  if(p.mode) {
    for(const x of [-2.35,-1.05]) k.rod([x,.2,-.45],[x,4.9,-.45],0x65879a,.04);
    k.rod([-2.35,4.9,-.45],[-1.05,4.9,-.45],0x9eb6c2,.05);
    k.label('Vertical motion · + down',[1.3,5.55,0],'#cde5ef',5);
    k.label('No ground collision in this model',[-1.7,.28,1.1],'#9dbecf',4.1);
  } else k.label('Motion on a fixed displacement scale',[0,4.75,0],'#cde5ef',5.8);
  const step=tickStep(layout.high-layout.low);
  for(let n=Math.ceil(layout.low/step);n*step<=layout.high+step*1e-8;n++) {
    const value=n*step,at=layout.point(value);
    if(p.mode){k.line([[-2.65,at[1],0],[-2.4,at[1],0]],C.muted,.7);k.label(`${value.toPrecision(3)} m`,[-3.25,at[1],0],'#abc9d8',1.3);}
    else{k.line([[at[0],.22,.55],[at[0],.22,.83]],C.muted,.7);k.label(`${Number(value.toPrecision(4))} m`,[at[0],.24,1.0],'#abc9d8',1.15);}
  }
  const velocity=k.arrow([0,1.3,0],[1,0,0],C.gold),applied=k.arrow([0,2,0],[1,0,0],C.red),
    drag=k.arrow([0,2.6,0],[-1,0,0],C.blue),net=k.arrow([0,3.2,0],[1,0,0],C.purple),
    reading=k.label('',p.mode?[2.4,4.2,0]:[0,3.95,0],'#d2e6ef',6),
    forceReading=k.label('',p.mode?[2.4,3.25,0]:[0,3.0,-.8],'#c3a6ff',5.7);
  k.label('Gold v · coral applied · blue drag · purple net',[0,.14,1.9],'#adc9d8',7.1);
  const release=layout.point(0);k.ball(.035,C.white,release);
  return {camera:{target:[0,2.45,0],radius:11.2,polar:1.34,azimuth:-.16,fitAspect:1.65},update(s,q) {
    const at=layout.point(q.x);body.position.set(...at);
    if(cart){body.position.y=.17;cart.roll(q.x*layout.scale);}
    const force=(p.mode?p.mass*p.g:p.force), values=[q.v*layout.velocityScale,force*layout.forceScale,-p.drag*q.v*layout.forceScale,q.net*layout.forceScale];
    [velocity,applied,drag,net].forEach((o,i)=>{
      const origin=p.mode?[at[0]+.38+i*.5,at[1],0]:[at[0],1.25+i*.48,0];
      k.setArrow(o,origin,p.mode?[0,-values[i],0]:[values[i],0,0]);
    });
    k.setLabel(reading,`x = ${q.x.toFixed(2)} m · v = ${q.v.toFixed(2)} m/s`,'#d2e6ef',p.mode?3.8:6);
    k.setLabel(forceReading,`Net = ${q.net.toFixed(2)} N · a = ${q.a.toFixed(2)} m/s²`,'#c3a6ff',p.mode?3.8:5.7);
  }};
}
export function createCollisionBench(p,root,options={}) {
  // A precision-scene wrapper uses the same kit contract as curriculum scenes.
  const k=createSceneKit(root,options);mechanicsDeck(k);
  const A=detailedCart(k,C.cyan,p.m1),B=detailedCart(k,C.gold,p.m2),scale=COLLISION_SCALE;
  role(A.group,'collision-a');role(B.group,'collision-b');A.group.scale.setScalar(scale);B.group.scale.setScalar(scale);
  const va=k.arrow([0,1.2,0],[1,0,0],C.cyan),vb=k.arrow([0,1.9,0],[1,0,0],C.gold),
    speedScale=collisionSpeedScale(p),phase=k.label('',[0,3.2,0],'#d4e7ee',1.75),
    momentum=k.label('',[0,4.15,0],'#c3a6ff',5.1),
    labelA=k.label('',[0,1.75,0.72],'#64e8d1',1.65),labelB=k.label('',[0,2.35,0.72],'#ffc584',1.65),
    origin=k.label('',[0,2.6,-.6],'#a5c4d3',6);
  const ticks=Array.from({length:11},()=>({line:k.line([[0,.22,.55],[0,.22,.83]],C.muted,.7),label:k.label('',[0,.24,1.0],'#abc9d8',.56)}));
  const initial=.5*p.m1*p.u1**2+.5*p.m2*p.u2**2,
    kept=role(k.box(4.6,.14,.22,C.cyan,[0,.15,1.65]),'collision-energy-kept'),
    lost=role(k.box(4.6,.14,.22,C.purple,[0,.15,1.65]),'collision-energy-lost'),
    energy=k.label('',[0,2.0,-.6],'#b5d0dc',6.1);
  return {target:[0,1.55,0],radius:10.6,polar:1.32,azimuth:-.12,fitAspect:1.65,kit:k,update(lab) {
    const s=lab.state,frame=collisionFrame(s),a=(s.x1-frame.center)*scale,b=(s.x2-frame.center)*scale;
    const railHeight=.215-.045*scale;
    A.group.position.set(a,railHeight,0);B.group.position.set(b,railHeight,0);A.roll(s.x1);B.roll(s.x2);
    labelA.position.x = a;
    labelB.position.x = b;
    k.setArrow(va,[a,1.25,0],[s.v1*speedScale,0,0]);k.setArrow(vb,[b,1.9,0],[s.v2*speedScale,0,0]);
    const K=.5*p.m1*s.v1**2+.5*p.m2*s.v2**2,loss=Math.max(0,initial-K),f=initial>0?Math.max(0,Math.min(1,K/initial)):0;
    kept.scale.x=f;kept.position.x=-2.3+2.3*f;lost.scale.x=1-f;lost.position.x=-2.3+4.6*f+2.3*(1-f);lost.visible=loss>1e-10;
    kept.visible=K>1e-10;
    const phaseText=s.hit?'After contact':p.u1<=p.u2?'No collision':'Approaching';
    k.setLabel(phase,phaseText,'#d4e7ee',1.75);
    k.setLabel(momentum,`Σp = ${(p.m1*s.v1+p.m2*s.v2).toFixed(3)} kg m/s`,'#c3a6ff',5.1);
    k.setLabel(labelA,`A · ${s.v1.toFixed(2)} m/s`,'#64e8d1',1.65);
    k.setLabel(labelB,`B · ${s.v2.toFixed(2)} m/s`,'#ffc584',1.65);
    k.setLabel(energy,`K = ${K.toFixed(2)} J · transferred internally: ${loss.toFixed(2)} J`,'#b5d0dc',6.1);
    k.setLabel(origin,'Camera follows pair · ruler & velocities in lab frame','#a5c4d3',6);
    const first=Math.floor(frame.center)-5;
    ticks.forEach((tick,i)=>{const world=first+i,x=(world-frame.center)*scale;tick.line.position.x=x;tick.label.position.x=x;k.setLabel(tick.label,`${world} m`,'#abc9d8',.56);tick.line.visible=Math.abs(x)<4.65;});
    k.visibility(lab.showLabels!==false,lab.vectors!==false);
    ticks.forEach(t=>t.label.visible=lab.showLabels!==false&&Math.abs(t.label.position.x)<4.65);
  }};
}
