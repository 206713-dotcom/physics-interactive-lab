/** A planar projectile in a 3D observation bench. The actual trail uses stored
 * solver samples; the dashed comparison is always the analytic vacuum path. */
import * as T from "../vendor/three.module.min.js";
import { PALETTE as C, createSceneKit, setPath } from "./scene-kit.js";
import { dynamicCable } from "./scene-instruments.js";
import { projectilePreview, projectileLayout, vacuumPoint, clipFlightSegment, tickStep } from "./kinematics-display.js";
import { DEG } from "./physics-extra.js";
const metal={metalness:.72,roughness:.28}, role=(o,name)=>{o.userData.role=name;return o;};
export function createProjectileBench(p,root,options={}) {
  const k=createSceneKit(root,options),preview=projectilePreview(p),radius=.12;
  k.stand(10.2,4.5);
  k.box(9,.12,2.1,0x253e50,[0,.29,0],{roughness:.82});
  for(const x of [-4.4,4.4])for(const z of [-.8,.8]) k.cylinder(.05,.025,0xb2c6cf,[x,.36,z],metal);
  const ball=role(k.ball(radius,C.purple,[-4,.47,0],{...metal,emissive:C.purple,emissiveIntensity:.15}),'projectile-body'),
    points=Array.from({length:601},()=>[-4,.47,0]),trail=dynamicCable(k,points,C.purple,.02);
  role(trail.mesh,'projectile-trail');
  const refGeometry=new T.BufferGeometry();refGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(1440),3));refGeometry.setDrawRange(0,0);
  const reference=new T.LineSegments(refGeometry,new T.LineDashedMaterial({color:0x83aebf,transparent:true,opacity:.65,dashSize:.1,gapSize:.075,toneMapped:false}));
  k.add(reference);reference.frustumCulled=false;role(reference,'projectile-vacuum-reference');
  const support=k.cylinder(.045,1,0x8ba7b6,[-4.48,1,-.6],metal),
    dial=k.cylinder(.3,.09,0x425b6e,[-4.48,1,-.55],metal);dial.rotation.x=Math.PI/2;
  const launchArm=k.rod([0,0,0],[1,0,0],C.gold,.025),
    velocity=k.arrow([0,1,0],[1,0,0],C.gold),gravity=k.arrow([0,1,0],[0,-1,0],C.blue),drag=k.arrow([0,1,0],[-1,0,0],C.red),
    phase=k.label('',[0,5.45,0],'#d6e8ef',5.6),
    components=k.label('',[0,4.67,0],'#ffc584',5.5),
    framing=k.label('',[0,.12,-1.65],'#9fc3d3',6.9);
  k.label('Gold velocity · blue gravity · coral drag',[0,-1.0,1.65],'#accbda',6.2);
  const xTicks=Array.from({length:9},()=>({line:k.line([[0,.36,.7],[0,.36,.95]],C.muted,.8),label:k.label('',[0,.38,1.2],'#aacbd9',.9)})),
    yTicks=Array.from({length:7},()=>({line:k.line([[-4.35,0,-.3],[-4.1,0,-.3]],C.muted,.6),label:k.label('',[-4.75,0,-.3],'#aacbd9',.9)}));
  const energy=k.label('',[0,-.45,1.65],'#b3d0dc',6.5),energy0=.5*p.speed**2+p.g*p.height;
  let activeFrame=null,layout;
  function frame(name) {
    layout=projectileLayout(p,name);activeFrame=name;
    const clipped=[];let cut=false;
    for(let i=0;i<240;i++) {
      const a=vacuumPoint(p,preview.vacuum.flightTime*i/240),b=vacuumPoint(p,preview.vacuum.flightTime*(i+1)/240),
        pair=clipFlightSegment(a,b,layout.maxX,layout.maxY);
      if(pair)clipped.push(...pair.map(layout.point));
      if(!pair||pair.some((q,j)=>Math.hypot(q.x-[a,b][j].x,q.y-[a,b][j].y)>1e-8))cut=true;
    }
    setPath(reference,clipped);reference.computeLineDistances();
    k.setLabel(framing,cut?'Vacuum reference continues outside this window':'Dashed: vacuum prediction · solid: calculated flight','#9fc3d3',6.9);
    const launch=layout.point({x:0,y:p.height});
    support.scale.y=Math.max(.15,launch[1]);support.position.y=.35+support.scale.y/2;
    dial.position.y=launch[1]+.35;
    const a=p.angle*DEG;
    // The separate goniometer is illustrative apparatus, not a launch barrel.
    launchArm.position.set(-4.48,dial.position.y,-.48);
    launchArm.scale.y=.32;launchArm.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(Math.cos(a),Math.sin(a),0));
    const xs=tickStep(layout.maxX,6),ys=tickStep(layout.maxY,4);
    xTicks.forEach((t,i)=>{const value=i*xs;t.line.position.x=-4+value*layout.scale;t.label.position.x=t.line.position.x;k.setLabel(t.label,`${Number(value.toPrecision(3))} m`,'#aacbd9',.9);t.line.visible=value<=layout.maxX;t.label.userData.inWindow=value<=layout.maxX;});
    yTicks.forEach((t,i)=>{const value=i*ys;t.line.position.y=.47+value*layout.scale;t.label.position.y=t.line.position.y;k.setLabel(t.label,`${Number(value.toPrecision(3))} m`,'#aacbd9',.9);t.line.visible=value<=layout.maxY;t.label.userData.inWindow=value<=layout.maxY;});
  }
  return {target:[0,2.65,0],radius:13.2,polar:1.4,azimuth:-.12,fitAspect:1.85,kit:k,update(lab) {
    const name=lab.projectileFrame==='vacuum'?'vacuum':'actual';if(activeFrame!==name)frame(name);
    const s=lab.state,at=layout.point(s);ball.position.set(...at);
    const history=lab.trail?.length?lab.trail:[{x:0,y:p.height}],count=history.length;
    for(let i=0;i<601;i++) {
      const u=i/600*count,index=Math.min(count-1,Math.floor(u)),f=Math.min(1,u-index),a=history[index],b=index===count-1?s:history[index+1];
      points[i]=layout.point({x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f});
    }
    trail.update(points);trail.mesh.visible=lab.showTrail!==false;reference.visible=lab.showTrail!==false;
    const vScale=1.25/preview.maxSpeed,aScale=1.1/Math.max(p.g,p.drag*preview.maxSpeed**2),speed=Math.hypot(s.vx,s.vy);
    k.setArrow(velocity,at,[s.vx*vScale,s.vy*vScale,0]);
    k.setArrow(gravity,[at[0]+.2,at[1],.15],s.landed?[0,0,0]:[0,-p.g*aScale,0]);
    k.setArrow(drag,[at[0],at[1],.2],s.landed?[0,0,0]:[-p.drag*speed*s.vx*aScale,-p.drag*speed*s.vy*aScale,0]);
    k.setLabel(phase,s.landed?'Ground contact · incoming velocity shown':'Projectile in flight · +y upwards','#d6e8ef',5.6);
    k.setLabel(components,`vₓ = ${s.vx.toFixed(2)} m/s · vᵧ = ${s.vy.toFixed(2)} m/s`,'#ffc584',5.5);
    const mechanical=.5*speed**2+p.g*s.y;
    k.setLabel(energy,`Mechanical: ${mechanical.toFixed(2)} J/kg · drag loss: ${Math.max(0,energy0-mechanical).toFixed(2)} J/kg`,'#b3d0dc',6.5);
    k.visibility(lab.showLabels!==false,lab.vectors!==false);
    [...xTicks,...yTicks].forEach(t=>t.label.visible=lab.showLabels!==false&&t.label.userData.inWindow);
  }};
}
