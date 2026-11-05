import test from "node:test";
import assert from "node:assert/strict";
import * as T from "../vendor/three.module.min.js";
import { SIMULATIONS } from "../js/simulations.js";
import { photoelectricDisplay, photoelectricMarkers, braggConstruction, matterWave } from "../js/quantum-display.js";
import { createCurriculumScene } from "../js/scene-curriculum.js";
import { studyReadings } from "../js/study-policy.js";
import { calculationOutcome } from "../js/calculations.js";
const H=6.62607015e-34,E=1.602176634e-19,M=9.1093837139e-31,C=299792458;
const near=(a,b,eps=1e-10)=>assert.ok(Math.abs(a-b)<=eps*Math.max(Math.abs(a),Math.abs(b),1e-300),`${a} ≠ ${b}`);
const sub=(a,b)=>a.map((x,i)=>x-b[i]), dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0), length=a=>Math.hypot(...a);
const dispose=root=>root.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.();});
function build(id,params) {
  const run=SIMULATIONS[id].create(params), root=new T.Group(), scene=createCurriculumScene(id,run.params,root,{labels:false});
  scene.update({...run,vectors:true,showLabels:true});return {run,root,scene};
}

test("photoelectric energy and ideal saturation current obey Einstein's equation and photon flux at supported corners",()=>{
  for(const frequency of [3e14,1.5e15])for(const work of [1.5,5.5])for(const power of [1e-8,1e-5])for(const efficiency of [.01,1]) {
    const p={frequency,work,power,efficiency},q=photoelectricDisplay(p),available=H*frequency-work*E;
    near(q.photonEV,H*frequency/E);assert.equal(q.emission,available>0?1:0);
    near(q.kineticEV,Math.max(0,available)/E);
    near(q.current,q.emission*efficiency*E*power/(H*frequency));
    if(q.emission)near(q.photonEV,work+q.kineticEV);
    assert.ok(q.photonMarkers>0&&q.photonMarkers<=96);
    assert.ok(q.electronMarkers>=0&&q.electronMarkers<=192);
    assert.equal(q.electronMarkers===0,!q.emission);
  }
});

test("more power changes photon and electron traffic and current without changing electron energy",()=>{
  const p=SIMULATIONS.photoelectric.defaults,a=photoelectricDisplay(p),b=photoelectricDisplay({...p,power:p.power*5});
  near(b.current,a.current*5);near(b.photons,a.photons*5);near(b.kinetic,a.kinetic);near(b.stopping,a.stopping);
  assert.ok(b.photonMarkers>a.photonMarkers&&b.electronMarkers>a.electronMarkers);
  near(b.energyScale,a.energyScale);
});

test("sub-threshold light still reaches the emitter, but no electron markers or energy-equivalent stopping voltage are displayed",()=>{
  const d=SIMULATIONS.photoelectric,p={...d.defaults,frequency:3e14,power:1e-5},q=photoelectricDisplay(p),
    readings=studyReadings("photoelectric",{t:0},p,"alevel",d),{root}=build("photoelectric",p),nodes=[];
  root.traverse(o=>nodes.push(o));
  assert.ok(photoelectricMarkers(q,.3).length>0);assert.deepEqual(photoelectricMarkers(q,.3,true),[]);
  assert.equal(q.current,0);assert.equal(readings[0].value,"No emission");assert.equal(readings[2].unit,"");
  assert.equal(calculationOutcome("photoelectric",{id:"stopping-1",value:0,unit:"V"}),"No emitted electrons");
  const electrons=nodes.find(o=>o.userData.role==="photoelectric-electron-markers");
  assert.equal(electrons.count,0);assert.equal(electrons.visible,false);
  const bars=nodes.filter(o=>o.userData.role==="photon-energy-bar");
  assert.equal(bars.length,3);assert.equal(bars[2].visible,false);dispose(root);
});

test("energy bars use a common fixed eV scale with true endpoints and no energy-dependent autoscaling",()=>{
  for(const frequency of [3e14,8e14,1.5e15]) {
    const p={...SIMULATIONS.photoelectric.defaults,frequency},{root}=build("photoelectric",p),q=photoelectricDisplay(p),bars=[];
    root.traverse(o=>{if(o.userData.role==="photon-energy-bar")bars.push(o);});
    const commonStart=bars[0].position.x-bars[0].scale.x/2;
    bars.forEach(bar=>{if(bar.visible){near(bar.scale.x,bar.userData.energyEV*q.energyScale);near(bar.position.x-bar.scale.x/2,commonStart);assert.ok(bar.scale.x<=2.35);}});
    dispose(root);
  }
});

test("electron diffraction uses relativistic momentum, with shorter wavelength and greater speed at higher voltage",()=>{
  let previous=null;
  for(const voltage of [500,5000,20000]) {
    const p={...SIMULATIONS.bragg.defaults,voltage},q=braggConstruction(p),kinetic=E*voltage,
      momentum=Math.sqrt(kinetic*(kinetic+2*M*C*C))/C;
    near(q.wavelength,H/momentum);near(q.speed,momentum*C*C/(kinetic+M*C*C));near(q.kinetic,kinetic);
    if(previous){assert.ok(q.wavelength<previous.wavelength&&q.speed>previous.speed&&q.angle<previous.angle);}
    previous=q;
  }
});

test("the geometric extra path is nλ and incident/diffracted directions use the true Bragg angle",()=>{
  for(const voltage of [500,5000,20000])for(const spacing of [5e-11,2.15e-10,5e-10])for(const order of [1,3,5]) {
    const p={voltage,spacing,order},q=braggConstruction(p);
    near(q.top[1]-q.bottom[1],p.spacing*q.spacingScale);
    near(q.wavelengthDisplay/q.gap,q.wavelength/p.spacing*12.5);
    if(!q.permitted){assert.equal(q.angle,null);assert.deepEqual(q.rays,[]);assert.equal(q.pathDifference,null);continue;}
    near(2*p.spacing*Math.sin(q.angle*Math.PI/180),p.order*q.wavelength);
    near(q.extraPaths.reduce((sum,v)=>sum+length(sub(v[1],v[0])),0)/q.spacingScale,p.order*q.wavelength);
    q.wavefronts.forEach((v,i)=>assert.ok(Math.abs(dot(sub(v[1],v[0]),i?q.outgoingDirection:q.incidentDirection))<1e-12));
    near(dot(q.incidentDirection,q.outgoingDirection),Math.cos(2*q.angle*Math.PI/180));
    for(const ray of q.rays){const incoming=sub(ray[1],ray[0]),outgoing=sub(ray[2],ray[1]);near(incoming[1]/length(incoming),-Math.sin(q.angle*Math.PI/180));near(outgoing[1]/length(outgoing),Math.sin(q.angle*Math.PI/180));}
  }
});

test("an impossible Bragg order has no ray mesh direction markers and an explicit non-result in the instruments",()=>{
  const d=SIMULATIONS.bragg,p={...d.defaults,voltage:500,spacing:5e-11,order:5},q=braggConstruction(p),{root}=build("bragg",p),nodes=[];
  root.traverse(o=>nodes.push(o));assert.equal(q.permitted,0);assert.equal(q.incidentDirection,null);assert.equal(q.outgoingDirection,null);
  assert.equal(nodes.filter(o=>o.userData.role==="direction-marker").length,0);
  assert.equal(calculationOutcome("bragg",{id:"angle-1",value:null,unit:"°"}),"No permitted Bragg angle");
  const readings=studyReadings("bragg",{t:0},p,"alevel",d);assert.equal(readings.at(-1).value,"Not permitted");assert.equal(readings.at(-1).unit,"");
  assert.ok(matterWave(q,.2).every(v=>v.every(Number.isFinite)));dispose(root);
});

test("both quantum apparatuses animate with stable meshes and buffers without mutating model state",()=>{
  for(const id of ["photoelectric","bragg"]) {
    const {run,root,scene}=build(id,SIMULATIONS[id].defaults),before=JSON.stringify(run),nodes=[];
    root.traverse(o=>nodes.push(o));const geometries=nodes.map(o=>o.geometry);
    for(const t of [0,.037,.4,1,12])scene.update({...run,state:{...run.state,t},vectors:false,showLabels:true});
    const after=[];root.traverse(o=>after.push(o));assert.deepEqual(after,nodes);assert.deepEqual(after.map(o=>o.geometry),geometries);
    assert.equal(JSON.stringify(run),before);
    for(const o of nodes)if(o.isInstancedMesh)assert.ok(o.instanceMatrix.array.every(Number.isFinite));
    dispose(root);
  }
});
