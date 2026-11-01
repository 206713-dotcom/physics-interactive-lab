import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.min.js';
import { SIMULATIONS as LABS } from '../js/simulations.js';
import { createDetailedMechanics } from '../js/scene-precision.js';
import { springReadings,pendulumReadings,pendulumPeriod,smallAngleReference,oscillationScales,PENDULUM_RIG } from '../js/oscillation-physics.js';
import { calculationSheet } from '../js/calculations.js';
const close=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} ≈ ${b}`),
  readings=(id,s,p)=>id==='spring'?springReadings(s,p):pendulumReadings(s,p),
  vector=o=>new T.Vector3(0,o.userData.vectorLength,0).applyQuaternion(o.quaternion);
function nodes(root,role){const found=[];root.traverse(o=>{if(o.userData.role===role)found.push(o);});return found;}
function clean(root){root.traverse(o=>{o.geometry?.dispose();for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])m.dispose();});}
function stateAt(id,p,stop,h=1/240){let s=LABS[id].create(p).state;while(s.t<stop-1e-12)s=LABS[id].step(s,p,Math.min(h,stop-s.t));return s;}
function make(id,patch={}){const d=LABS[id],run=d.create({...d.defaults,...patch}),root=new T.Group(),scene=createDetailedMechanics(id,run.params,root,{labels:false});return {d,run,root,scene,update(state=run.state,extra={}){scene.update({...run,state,trail:[],...extra});}};}

test('spring damping power is integrated independently and energy closes at difficult parameter corners',()=>{
 for(const mass of [.2,5])for(const k of [1,100])for(const displacement of [-.8,0,.8])for(const damping of [0,10]){
  const p={mass,k,displacement,damping};let s=LABS.spring.create(p).state,previous=0;
  for(let i=0;i<2400;i++){s=LABS.spring.step(s,p,1/240);assert.ok(s.dissipated>=previous);previous=s.dissipated;}
  const q=springReadings(s,p);assert.ok(Number.isFinite(q.accounted));close(q.accounted,q.initial,3e-5);
  if(damping===0)assert.equal(s.dissipated,0,'numerical energy drift must never be called damping transfer');
  if(displacement===0)assert.equal(q.accounted,0);
 }
});

test('pendulum damping power closes the energy budget across supported length, gravity, mass and angle extremes',()=>{
 for(const length of [.3,3])for(const angle of [-120,0,120])for(const g of [1,20])for(const mass of [.2,5])for(const damping of [0,1]){
  const p={length,angle,g,mass,damping};let s=LABS.pendulum.create(p).state,previous=0;
  for(let i=0;i<2400;i++){s=LABS.pendulum.step(s,p,1/240);assert.ok(s.dissipated>=previous);previous=s.dissipated;}
  const q=pendulumReadings(s,p);close(q.accounted,q.initial,3e-6);if(damping===0)assert.equal(q.dissipated,0);
 }
});

test('the dampers integrate the correct SI power rather than an energy-balance remainder',()=>{
 const h=1e-6,p={...LABS.spring.defaults,damping:2},s={x:.1,v:3,t:0,dissipated:7},next=LABS.spring.step(s,p,h);
 close((next.dissipated-s.dissipated)/h,18,1e-5);
 const pp={...LABS.pendulum.defaults,length:2,mass:3,damping:.4},ps={theta:.3,omega:1.5,t:0,dissipated:9},pn=LABS.pendulum.step(ps,pp,h);
 close((pn.dissipated-ps.dissipated)/h,3*4*.4*1.5**2,1e-5);
});

test('pendulum weight, signed link force and damping sum to the full centripetal plus tangential ma',()=>{
 const p={...LABS.pendulum.defaults,damping:.4};
 for(const theta of [-2,-.5,0,.5,2])for(const omega of [-4,0,4]){
  const q=pendulumReadings({theta,omega,t:0},p);
  for(let i=0;i<3;i++)close(q.weight[i]+q.constraint[i]+q.damping[i],p.mass*q.acceleration[i]);
  close(q.velocity[0]*Math.sin(theta)-q.velocity[1]*Math.cos(theta),0);
  assert.ok(q.damping.reduce((sum,x,i)=>sum+x*q.velocity[i],0)<=1e-12);
 }
 assert.ok(pendulumReadings({theta:120*Math.PI/180,omega:0},p).link<0,'rigid rod must push at a >90° release');
 assert.ok(pendulumReadings({theta:0,omega:4},p).link>p.mass*p.g);
});

test('finite-angle AGM period agrees with independent nonlinear RK4 zero crossings',()=>{
 for(const length of [.3,3])for(const angle of [.1,35,100,120]){
  const p={...LABS.pendulum.defaults,length,angle,damping:0},h=1/2000;let s=LABS.pendulum.create(p).state,previous=s;
  while(s.theta>0){previous=s;s=LABS.pendulum.step(s,p,h);assert.ok(s.t<20);}
  const quarter=previous.t+h*previous.theta/(previous.theta-s.theta);close(4*quarter,pendulumPeriod(p),2e-6);
 }
 const p=LABS.pendulum.defaults;close(pendulumPeriod({...p,angle:0}),2*Math.PI*Math.sqrt(p.length/p.g));
 assert.ok(pendulumPeriod({...p,angle:120})>1.3*pendulumPeriod({...p,angle:0}));
 close(pendulumPeriod({...p,angle:-120}),pendulumPeriod({...p,angle:120}));
});

test('the optional linear reference uses the same damping, initial conditions and small-angle differential equation',()=>{
 for(const length of [.3,3])for(const damping of [0,1]){
  const p={...LABS.pendulum.defaults,length,damping,angle:.1},z=smallAngleReference(p,0);close(z.theta,p.angle*Math.PI/180);close(z.omega,0);
  const t=1.3,e=1e-5,a=smallAngleReference(p,t-e),b=smallAngleReference(p,t+e),q=smallAngleReference(p,t);
  close((b.theta-a.theta)/(2*e),q.omega,1e-8);close((b.omega-a.omega)/(2*e),-p.g/p.length*q.theta-damping*q.omega,1e-8);
  close(stateAt('pendulum',p,t).theta,q.theta,2e-8);
 }
 const p={...LABS.pendulum.defaults,angle:100};assert.ok(Math.abs(stateAt('pendulum',p,1.5).theta-smallAngleReference(p,1.5).theta)>.1);
});

test('spring vector views share a fixed linear force scale and never change cart displacement',()=>{
 const a=make('spring',{damping:3}),p=a.run.params,s=stateAt('spring',p,.4),scales=oscillationScales('spring',p),q=springReadings(s,p);
 for(const oscillationVectors of ['forces','motion']){
  a.update(s,{oscillationVectors,vectors:true});const arrows=a.scene.kit.indicators;
  close(nodes(a.root,'spring-mass')[0].position.x,1+3.2*s.x);
  [q.restoring,q.damping,q.net].forEach((v,i)=>close(vector(arrows[i+2]).x,v*scales.force));
  assert.deepEqual(arrows.map(o=>o.visible),oscillationVectors==='motion'?[true,true,false,false,false]:[false,false,true,true,true]);
 }
 clean(a.root);
});

test('both energy ledgers use release energy, show integrated transfer and hide every zero-energy segment',()=>{
 for(const id of ['spring','pendulum'])for(const rest of [false,true]){
  const a=make(id,{damping:.5,...(rest?(id==='spring'?{displacement:0}:{angle:0}):{})}),s=stateAt(id,a.run.params,1),q=readings(id,s,a.run.params);a.update(s);
  for(const [i,role] of ['energy-kinetic','energy-potential','energy-dissipated'].entries()){
   const bar=nodes(a.root,role)[0],value=[q.kinetic,q.potential,q.dissipated][i];close(bar.scale.x,q.initial>0?value/q.initial:0);
   assert.equal(bar.visible,value>0&&q.initial>0);
  }clean(a.root);
 }
});

test('pendulum link, actual trail and linear ghost use the same fixed length for wide releases',()=>{
 for(const length of [.3,3])for(const angle of [-120,0,120]){
  const a=make('pendulum',{length,angle}),s=stateAt('pendulum',a.run.params,.6),saved=JSON.stringify(a.run),theta=smallAngleReference(a.run.params,s.t).theta;
  a.update(s,{smallAngleReference:true,trail:[{x:length*Math.sin(s.theta),y:-length*Math.cos(s.theta)}]});
  const bob=nodes(a.root,'pendulum-bob')[0],ghost=nodes(a.root,'pendulum-reference')[0],trail=nodes(a.root,'pendulum-trail')[0];
  close(bob.position.distanceTo(new T.Vector3(...PENDULUM_RIG.pivot)),PENDULUM_RIG.length);
  close(ghost.position.x,PENDULUM_RIG.length*Math.sin(theta));close(trail.geometry.attributes.position.getX(0),bob.position.x,1e-6);
  assert.equal(JSON.stringify(a.run),saved);clean(a.root);
 }
});

test('switching indicators and reference preserves immutable state and reuses every scene geometry',()=>{
 for(const id of ['spring','pendulum']){
  const a=make(id),s=Object.freeze(stateAt(id,a.run.params,.7));Object.freeze(a.run.params);const objects=[];a.root.traverse(o=>objects.push([o,o.geometry]));
  const saved=JSON.stringify(s);
  for(const oscillationVectors of ['motion','forces'])for(const smallAngleReference of [true,false]){
   a.update(s,{oscillationVectors,smallAngleReference,vectors:true});a.root.updateMatrixWorld(true);
   a.root.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));for(const attr of Object.values(o.geometry?.attributes??{}))assert.ok(attr.array.every(Number.isFinite));});
  }
  const after=[];a.root.traverse(o=>after.push([o,o.geometry]));assert.deepEqual(after,objects);assert.equal(JSON.stringify(s),saved);clean(a.root);
 }
});

test('worked calculations and both energy-balance graphs expose the integrated SI readings',()=>{
 for(const id of ['spring','pendulum']){
  const p={...LABS[id].defaults,damping:.5},s=stateAt(id,p,.7),sheet=calculationSheet(id,s,p),byId=new Map(sheet.calculations.map(c=>[c.id,c])),q=readings(id,s,p),sample=LABS[id].sample(s,p);
  close(byId.get('transferred').value,s.dissipated);close(byId.get('damping-power').value,q.power);close(byId.get('budget').value,q.accounted);
  assert.deepEqual(LABS[id].graphs.find(g=>g.id==='budget').keys,['total','dissipated','accounted']);
  close(sample.dissipated,s.dissipated);close(sample.accounted,q.accounted);
 }
 assert.equal(LABS.gravity.graphs.some(g=>g.id==='budget'),false);
});

test('the clean presentation hides floating readouts without changing physical geometry or force indicators',()=>{
 for(const id of ['spring','pendulum']){
  const a=make(id,{damping:.5}),s=Object.freeze(stateAt(id,a.run.params,.5));Object.freeze(a.run.params);
  a.update(s,{cleanPresentation:false,vectors:true,oscillationVectors:'forces'});
  const body=nodes(a.root,id==='spring'?'spring-mass':'pendulum-bob')[0],before=body.position.clone(),
    arrows=a.scene.kit.indicators.map(o=>({position:o.position.clone(),vector:vector(o),visible:o.visible})),saved=JSON.stringify(s),objects=[];
  a.root.traverse(o=>objects.push([o,o.geometry]));
  a.update(s,{cleanPresentation:true,vectors:true,oscillationVectors:'forces'});
  close(body.position.distanceTo(before),0);
  a.scene.kit.indicators.forEach((o,i)=>{close(o.position.distanceTo(arrows[i].position),0);close(vector(o).distanceTo(arrows[i].vector),0);assert.equal(o.visible,arrows[i].visible);});
  for(const role of ['energy-kinetic','energy-potential','energy-dissipated'])assert.equal(nodes(a.root,role)[0].visible,false);
  assert.ok(a.scene.kit.annotations.some(o=>o.visible),'calibrated ruler or protractor labels remain');
  const after=[];a.root.traverse(o=>after.push([o,o.geometry]));assert.deepEqual(after,objects);assert.equal(JSON.stringify(s),saved);clean(a.root);
 }
});
