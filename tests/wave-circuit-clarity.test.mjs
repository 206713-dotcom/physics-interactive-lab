import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.min.js';
import { SIMULATIONS } from '../js/simulations.js';
import { waveAt } from '../js/physics-extra.js';
import { waveMeasurement } from '../js/wave-geometry.js';
import { createWaveBench } from '../js/scene-wave-bench.js';
import { createRefractionApparatus } from '../js/scene-optical-bench.js';
import { createCurriculumScene } from '../js/scene-curriculum.js';
import { studyParams,sceneLabelAllowed } from '../js/study-policy.js';
const near=(a,b,eps=1e-6)=>assert.ok(Math.abs(a-b)<eps,`${a} ≠ ${b}`),
  dispose=root=>root.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.();});

test('wavelength guide endpoints are two real incident crests exactly one wavelength apart',()=>{
  for(const wavelength of [.5,2,4])for(const speed of [.2,2,4])for(const amplitude of [.05,.6])for(const t of [0,.137,1.23,10]) {
    const p={...SIMULATIONS.waves.defaults,wavelength,speed,amplitude},before=structuredClone(p),g=waveMeasurement(p,t);
    near(g.second-g.first,wavelength);assert.ok(g.first>=0 && g.first<wavelength);assert.ok(g.second<=8);
    near(waveAt(g.first,t,p).incident,amplitude);near(waveAt(g.second,t,p).incident,amplitude);
    assert.deepEqual(p,before);
  }
});

test('IGCSE shows one actual wave with calibrated amplitude and wavelength guides and stable GPU buffers',()=>{
  const p=studyParams('waves','igcse',SIMULATIONS.waves),lab=SIMULATIONS.waves.create(p),root=new T.Group(),scene=createWaveBench(p,root,{labels:false,studyMode:'igcse'}),
    curves=scene.kit.objects.filter(o=>/^wave-(incident|reflected|resultant)$/.test(o.userData.role));
  assert.deepEqual(curves.map(o=>o.userData.role),['wave-resultant']);
  const amplitude=scene.kit.objects.find(o=>o.userData.role==='wave-amplitude-guide').geometry.attributes.position,
    guide=scene.kit.objects.find(o=>o.userData.role==='wave-wavelength-guide');
  near(amplitude.getY(2)-amplitude.getY(1),1.5*p.amplitude);
  let buffer;
  for(const t of [0,.137,.5,1.23]) {
    const frame={...lab,state:{...lab.state,t}},before=structuredClone(frame);scene.update(frame);
    const position=guide.geometry.attributes.position;
    near(position.getX(2)-position.getX(0),p.wavelength);
    for(const i of [0,3])near(position.getY(i),2.05+1.5*waveAt(position.getX(i)+4,t,p).resultant);
    if(buffer)assert.equal(position.array,buffer);else buffer=position.array;
    assert.deepEqual(frame,before);
  }
  dispose(root);
});

test('the two displayed optical media meet at the exact Snell-law junction',()=>{
  for(const [n1,n2,angle] of [[1,1.5,40],[1.5,1,60],[1.2,1.2,0]]) {
    const p={...SIMULATIONS.refraction.defaults,n1,n2,angle},root=new T.Group(),scene=createRefractionApparatus(p,root,0xffffff,{labels:false,studyMode:'igcse'}),
      media=scene.kit.objects.filter(o=>o.userData.role==='optical-medium');
    assert.equal(media.length,2);
    const upper=new T.Box3().setFromObject(media[0]),lower=new T.Box3().setFromObject(media[1]);
    near(upper.min.y,scene.construction.hit[1]);near(lower.max.y,scene.construction.hit[1]);
    assert.equal(scene.branches.transmitted,!scene.construction.tir);dispose(root);
  }
});

test('parallel current markers share true junctions and their measured speeds obey the calculated current ratios',()=>{
  for(const [r1,r2] of [[100,200],[10,1000],[1000,10]]) {
    const p={...SIMULATIONS.dc.defaults,mode:1,r1,r2},lab=SIMULATIONS.dc.create(p),root=new T.Group(),scene=createCurriculumScene('dc',p,root,{labels:false});
    lab.state={...lab.state,t:.137};scene.update(lab);
    const q=SIMULATIONS.dc.sample(lab.state,p);near(q.current,q.i1+q.i2);
    const b1=scene.flowPaths.find(f=>f.key==='i1').path,b2=scene.flowPaths.find(f=>f.key==='i2').path,
      mains=scene.flowPaths.filter(f=>f.key==='current');
    assert.deepEqual(b1[0],b2[0]);assert.deepEqual(b1.at(-1),b2.at(-1));
    assert.deepEqual(mains[0].path.at(-1),b1[0]);assert.deepEqual(mains[1].path[0],b1.at(-1));
    const markers=scene.kit.objects.filter(o=>o.userData.role==='direction-marker'),
      before=markers.map(o=>({point:o.position.clone(),direction:new T.Vector3(0,1,0).applyQuaternion(o.quaternion),key:o.userData.currentKey})),h=1e-5;
    lab.state={...lab.state,t:lab.state.t+h};const saved=structuredClone(lab);scene.update(lab);
    markers.forEach((marker,i)=>{
      const displacement=marker.position.clone().sub(before[i].point);
      assert.ok(displacement.dot(before[i].direction)>0);
      near(displacement.length()/h,1.6*q[before[i].key]/q.current,1e-5);
    });
    const branchMarkers=markers.filter(o=>o.userData.currentKey!=='current');
    assert.ok(branchMarkers.some(o=>o.userData.currentKey==='i1'));assert.ok(branchMarkers.some(o=>o.userData.currentKey==='i2'));
    assert.deepEqual(lab,saved);dispose(root);
  }
});

test('IGCSE permits ohm labels while keeping angular-frequency notation and wire resistivity outside the activity',()=>{
  assert.equal(sceneLabelAllowed('dc','igcse','R₁ · 100 Ω'),true);
  assert.equal(sceneLabelAllowed('waves','igcse','ω = 6.28 rad/s'),false);
  assert.throws(()=>studyParams('dc','igcse',SIMULATIONS.dc,{mode:3}));
  assert.equal(SIMULATIONS.dc.create({...SIMULATIONS.dc.defaults,mode:3}).params.mode,3);
});
