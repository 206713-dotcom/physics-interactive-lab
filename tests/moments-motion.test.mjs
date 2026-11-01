import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.min.js';
import { SIMULATIONS } from '../js/simulations.js';
import { createMoments, stepMoments, momentsReadings, BEAM_STOP, BEAM_DAMPING } from '../js/moments-physics.js';
import { createMomentsBench } from '../js/scene-moments.js';
import { createSceneKit } from '../js/scene-kit.js';
const base=SIMULATIONS.moments.defaults;
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol,`${a} ≠ ${b}`);

test('the screenshot case turns right: the heavier left mass has the smaller moment',()=>{
  const p={...base,m1:2.84,m2:2,d1:.8,d2:1.2},s=stepMoments(createMoments(),p,.5),q=momentsReadings(s,p);
  assert.ok(p.m1>p.m2);assert.ok(q.right>q.left);assert.ok(s.theta<0);assert.ok(s.omega<0);
  assert.ok(Math.sin(s.theta)*p.d2<0,'right-hand attachment moves downward');
});
test('a greater left moment turns left down, while balanced release moments keep the beam level',()=>{
  const p={...base,m1:5,m2:2,d1:.8,d2:1.2};
  assert.ok(stepMoments(createMoments(),p,.3).theta>0);
  const balanced=stepMoments(createMoments(),base,60);
  near(balanced.theta,0,1e-11);near(balanced.omega,0,1e-11);
});
test('torques use current perpendicular distances and close Newton’s rotational equation',()=>{
  const p={...base,m1:5},s={...createMoments(),theta:.21,omega:.3},q=momentsReadings(s,p);
  near(q.armLeft,p.d1*Math.cos(s.theta));near(q.armRight,p.d2*Math.cos(s.theta));
  near(q.left,p.m1*9.81*q.armLeft);near(q.right,p.m2*9.81*q.armRight);
  near(q.inertia*q.alpha,q.left-q.right-BEAM_DAMPING*s.omega);
  const next=stepMoments(s,p,1e-6);
  near((next.omega-s.omega)/1e-6,q.alpha,1e-5);
});
test('bearing damping and inelastic stop losses account for the lost mechanical energy',()=>{
  for (const p of [{...base,m1:6},{...base,m2:7},{...base,m1:.2,m2:10,d1:.1,d2:1.5}]) {
    let s=createMoments();
    for(let i=0;i<180;i++) {
      s=stepMoments(s,p,1/60);const q=momentsReadings(s,p);
      near(q.kinetic+q.potential+q.dissipated+q.impactLoss,0,2e-7);
      assert.ok(q.dissipated>=0 && q.impactLoss>=0);
    }
    assert.ok(s.contact);near(Math.abs(s.theta),BEAM_STOP);near(s.omega,0);
    const q=momentsReadings(s,p);near(q.torque,0);near(q.stopMoment,-q.net);
    assert.ok(q.impactLoss>0,'stopping loss is measured at contact, not fabricated as a remainder');
  }
});
test('all supported beam parameter corners stay finite and inside the mechanical stops',()=>{
  for(const m1 of [.2,10])for(const m2 of [.2,10])for(const d1 of [.1,1.5])for(const d2 of [.1,1.5]) {
    const p={...base,m1,m2,d1,d2},s=stepMoments(createMoments(),p,60),q=momentsReadings(s,p);
    assert.ok(Object.values(q).every(Number.isFinite));
    assert.ok(Math.abs(s.theta)<=BEAM_STOP+1e-12);
    assert.equal(s.t,60);
  }
});
test('stepping is immutable and refuses invalid time intervals',()=>{
  const s=Object.freeze(createMoments()),p=Object.freeze({...base,m1:5});
  stepMoments(s,p,.5);assert.equal(s.theta,0);assert.equal(s.t,0);
  for(const h of [0,-1,NaN,Infinity,61])assert.throws(()=>stepMoments(s,p,h),RangeError);
});
test('the real 3D beam and attached masses follow the solver angle while weight arrows stay vertical',()=>{
  const p={...base,m1:2.84},s=stepMoments(createMoments(),p,.8),q=momentsReadings(s,p),root=new T.Group(),
    k=createSceneKit(root,{labels:false}),bench=createMomentsBench(p,k);
  bench.update(s,q,{});root.updateMatrixWorld(true);
  const beam=k.objects.find(o=>o.userData.role==='moments-beam'),
    left=k.objects.find(o=>o.userData.role==='moments-left-mass').getWorldPosition(new T.Vector3()),
    right=k.objects.find(o=>o.userData.role==='moments-right-mass').getWorldPosition(new T.Vector3());
  near(beam.rotation.z,s.theta);assert.ok(right.y<left.y);
  near(left.x,-2*p.d1*Math.cos(s.theta));near(right.x,2*p.d2*Math.cos(s.theta));
  for(const arrow of k.indicators) {
    const direction=new T.Vector3(0,1,0).applyQuaternion(arrow.quaternion);
    near(direction.x,0);near(direction.y,-1);near(direction.z,0);
  }
  const before=[];root.traverse(o=>before.push([o,o.geometry]));
  for(let i=0;i<12;i++)bench.update(s,q,{});
  const after=[];root.traverse(o=>after.push([o,o.geometry]));assert.deepEqual(after,before);
  root.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.();});
});
