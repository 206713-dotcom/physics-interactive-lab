import test from "node:test";
import assert from "node:assert/strict";
import * as T from "../vendor/three.module.min.js";
import { CURRICULUM_SIMULATIONS as LABS } from "../js/curriculum-simulations.js";
import { createCurriculumScene } from "../js/scene-curriculum.js";
import { heatingWindow, temperatureHeight, cylinderParcel, gasHeight, gasParcelPosition, gasEnergyScale, gasPressureScale, coolingClock } from "../js/thermal-geometry.js";
const close=(a,b,scale=Math.max(1,Math.abs(a),Math.abs(b)))=>assert.ok(Math.abs(a-b)<scale*1e-10,`${a} ≈ ${b}`);
function apparatus(id,patch={}) {
  const run=LABS[id].create({...LABS[id].defaults,...patch}), root=new T.Group(), scene=createCurriculumScene(id,run.params,root,{labels:false});
  return {root,scene,p:run.params,update(t,extra={}){scene.update({...run,state:{...run.state,t},...extra});return LABS[id].sample({t},run.params);}};
}
function nodes(root,role){const all=[];root.traverse(o=>{if(o.userData.role===role)all.push(o);});return all;}
function dispose(root){root.traverse(o=>{o.geometry?.dispose();for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])m.dispose();});}
const meltingTime=(p,f)=>p.mass*(Math.max(0,-p.initial)*2100+f*334000)/p.power;
const boilingTime=(p,f)=>p.mass*(Math.max(0,-p.initial)*2100+(p.initial>0?0:334000)+(100-Math.max(0,p.initial))*4200+f*2260000)/p.power;

test("ice rendered volume follows remaining mass throughout the melting plateau",()=>{
  const a=apparatus('calorimetry');
  for(const fraction of [0,.1,.5,.9,1]){
    const q=a.update(meltingTime(a.p,fraction)),ice=nodes(a.root,'calorimeter-ice'),liquid=nodes(a.root,'calorimeter-liquid')[0];
    close(q.temperature,0);close(q.melt,fraction);
    for(const cube of ice) {
      close(cube.scale.x*cube.scale.y*cube.scale.z,1-fraction);
      assert.equal(cube.visible,fraction<1);
      const half=.42*cube.scale.x;
      for(const dx of [-half,half])for(const dz of [-half,half])
        assert.ok(Math.hypot(cube.position.x+1.6+dx,cube.position.z+dz)<=1.22);
      assert.ok(cube.position.y-half>=.65-1e-12 && cube.position.y+half<=3.8);
    }
    close(liquid.scale.y,fraction,1);
  }
  dispose(a.root);
});

test("vapour inventory can grow from zero to full and restart without losing instance capacity",()=>{
  const a=apparatus('calorimetry'),vapour=nodes(a.root,'calorimeter-vapour')[0],buffer=vapour.instanceMatrix;
  for(const fraction of [0,.25,.5,1,0,1,.5]){
    const q=a.update(boilingTime(a.p,fraction));
    close(q.boil,fraction);assert.equal(vapour.count,Math.round(40*fraction));
    assert.equal(vapour.instanceMatrix,buffer);assert.equal(buffer.count,40);
    assert.ok(buffer.array.every(Number.isFinite));
  }
  a.update(0);assert.equal(vapour.count,0);assert.equal(vapour.visible,false);
  dispose(a.root);
});

test("custom constant-heat-capacity sample is a solid with no water or phase-change inventory",()=>{
  const a=apparatus('calorimetry',{mode:1,capacity:900,initial:20}),q=a.update(20);
  close(q.temperature,20+a.p.power*20/(a.p.mass*900));
  assert.equal(nodes(a.root,'calorimeter-custom-solid')[0].visible,true);
  assert.equal(nodes(a.root,'calorimeter-liquid')[0].visible,false);
  assert.ok(nodes(a.root,'calorimeter-ice').every(o=>!o.visible));
  assert.equal(nodes(a.root,'calorimeter-vapour')[0].count,0);
  assert.ok(nodes(a.root,'calorimeter-phase')[0].userData.text.includes('Single-phase'));
  dispose(a.root);
});

test("heating playback ends at 120 °C steam or 200 °C custom sample for the parameter corners",()=>{
  const d=LABS.calorimetry;
  for(const mode of [0,1])for(const initial of [-30,0,20])for(const mass of d.limits.mass)for(const power of d.limits.power)for(const capacity of d.limits.capacity){
    const p={...d.defaults,mode,initial,mass,power,capacity},duration=heatingWindow(p),q=d.sample({t:duration},p);
    close(q.temperature,mode?200:120);close(q.energy,power*duration);
    close(duration/d.rateFor(p),45);assert.ok(d.hFor(p)>0&&d.hFor(p)<=60);
    assert.equal(d.ended({t:duration*.5},p),null);assert.ok(d.ended({t:duration},p));
    close(d.step({t:duration-d.hFor(p)/3},p,d.hFor(p)).t,duration);
    if(!mode){close(q.melt,1);close(q.boil,1);}
  }
});

test("cylinder illustration follows continuous billiard chords inside its radial and axial walls",()=>{
  for(let i=0;i<72;i++)for(const t of [-100,0,.1,1,10,1000]){
    const q=cylinderParcel(i,t);assert.ok(Math.hypot(q.x,q.z)<=1+1e-12);assert.ok(q.y>=0&&q.y<=1);
    const next=cylinderParcel(i,t+1e-6);assert.ok(Math.hypot(next.x-q.x,next.y-q.y,next.z-q.z)<1e-5);
  }
});

test("piston height is proportional to actual gas volume and every drawn parcel stays below it",()=>{
  for(const mode of [0,1,2])for(const ratio of [.5,1,3]){
    const a=apparatus('gasprocess',{mode,ratio}),piston=nodes(a.root,'gas-piston')[0],fill=nodes(a.root,'gas-volume')[0],dots=nodes(a.root,'gas-parcels')[0];
    for(const t of [0,1.5,3,6]){
      const q=a.update(t),h=piston.position.y-.09-.5;close(h/1.25,q.volume/a.p.volume);close(fill.scale.y,h);
      const matrix=new T.Matrix4(),point=new T.Vector3();
      for(let i=0;i<72;i++){
        const expected=gasParcelPosition(i,q,t*Math.sqrt(q.temperature/a.p.initial)*.9);
        dots.getMatrixAt(i,matrix);point.setFromMatrixPosition(matrix);
        assert.ok(Math.hypot(point.x+1.55,point.z)+.045<1.25);
        assert.ok(point.y-.045>.5&&point.y+.045<.5+gasHeight(q));
        point.toArray().forEach((v,j)=>assert.ok(Math.abs(v-expected[j])<3e-7));
      }
    }
    dispose(a.root);
  }
});

test("the pressure dial and signed energy bars agree with the first law on expansion and compression",()=>{
  for(const mode of [0,1,2])for(const ratio of [.5,1,3]){
    const a=apparatus('gasprocess',{mode,ratio}),maximum=gasPressureScale(a.p),scale=gasEnergyScale(a.p);
    for(const t of [0,3,6]){
      const q=a.update(t),needle=nodes(a.root,'gas-pressure-needle')[0],direction=new T.Vector3(0,1,0).applyQuaternion(needle.quaternion),angle=(-135+q.pressure/maximum*270)*Math.PI/180;
      assert.ok(q.pressure<maximum);close(direction.x,Math.sin(angle));close(direction.y,Math.cos(angle));
      close(q.heat-q.work,q.internal);
      for(const key of ['heat','work','internal']){
        const bar=nodes(a.root,'gas-energy-'+key)[0],width=q[key]/scale*1.13;
        close(bar.position.x-2.75,width/2);close(bar.scale.x,Math.abs(width));
        assert.equal(bar.visible,Math.abs(width)>1e-8);
      }
    }
    a.update(2,{vectors:false});assert.equal(nodes(a.root,'gas-pressure-needle')[0].visible,true);
    dispose(a.root);
  }
});

test("cooling has a fixed Celsius gauge and an independently positioned ambient reference",()=>{
  for(const initial of [40,90,150]){
    const a=apparatus('cooling',{initial}),tau=coolingClock(a.p),t=tau*Math.log((initial-a.p.ambient)/(40-a.p.ambient)),q=a.update(t),column=nodes(a.root,'thermal-column')[0];
    close(q.temperature,40);close(column.position.y+column.scale.y/2,temperatureHeight(40,0,160));
    close(nodes(a.root,'cooling-ambient-reference')[0].position.y,temperatureHeight(a.p.ambient,0,160));
    a.update(t,{vectors:false});assert.equal(nodes(a.root,'cooling-ambient-reference')[0].visible,true);
    dispose(a.root);
  }
});

test("cooling energy segments remain contiguous and account for all initial excess energy",()=>{
  const a=apparatus('cooling'),initial=a.p.mass*a.p.specific*(a.p.initial-a.p.ambient),tau=coolingClock(a.p);
  for(const fraction of [0,.25,1,3,5]){
    const q=a.update(tau*fraction),out=nodes(a.root,'cooling-released')[0],left=nodes(a.root,'cooling-remaining')[0];
    close(q.remaining/initial,Math.exp(-fraction));close(q.released+q.remaining,initial);
    close(out.scale.x+left.scale.x,1);close(out.position.x+1.4*out.scale.x,left.position.x-1.4*left.scale.x);
    close(q.power,a.p.conductance*(q.temperature-a.p.ambient));
  }
  dispose(a.root);
});

test("cooling clocks resolve five time constants for both fastest and slowest supported setups",()=>{
  const d=LABS.cooling;
  for(const mass of d.limits.mass)for(const specific of d.limits.specific)for(const conductance of d.limits.conductance){
    const p={...d.defaults,mass,specific,conductance},tau=coolingClock(p),duration=d.window(p),q=d.sample({t:duration},p);
    close(duration/d.rateFor(p),50);close(duration/tau,5);assert.ok(d.hFor(p)<=60);
    close((q.temperature-p.ambient)/(p.initial-p.ambient),Math.exp(-5));
    assert.equal(d.ended({t:tau},p),null);assert.ok(d.ended({t:5*tau},p));
    close(d.step({t:duration-d.hFor(p)/3},p,d.hFor(p)).t,duration);
  }
  assert.equal(LABS.gasprocess.ended({t:3}),null);assert.ok(LABS.gasprocess.ended({t:6}));
});
