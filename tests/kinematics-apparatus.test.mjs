import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.min.js';
import { SIMULATIONS as LABS } from '../js/simulations.js';
import { linearMotion, motionTurningTime } from '../js/linear-motion.js';
import { motionLayout, collisionObservation, collisionLayout, projectilePreview, projectileLayout, vacuumPoint, clipFlightSegment } from '../js/kinematics-display.js';
import { createCurriculumScene } from '../js/scene-curriculum.js';
import { createCollisionBench } from '../js/scene-motion-benches.js';
import { createProjectileBench } from '../js/scene-projectile-bench.js';
const close=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} ≈ ${b}`);
function nodes(root,role){const out=[];root.traverse(o=>{if(o.userData.role===role)out.push(o);});return out;}
function clean(root){root.traverse(o=>{o.geometry?.dispose();for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])m.dispose();});}
function make(id,patch={}) {
 const d=LABS[id],run=d.create({...d.defaults,...patch}),root=new T.Group(),scene=id==='motion'?createCurriculumScene(id,run.params,root,{labels:false}):id==='collisions'?createCollisionBench(run.params,root,{labels:false}):createProjectileBench(run.params,root,{labels:false});
 return {d,run,root,scene,update(state=run.state,extra={}){scene.update({...run,state,trail:[{x:0,y:run.params.height??0}],...extra});}};
}
function runTo(id,p,stop) {
 const d=LABS[id],run=d.create(p),h=d.hFor?.(run.params)??d.h;let s=run.state;
 for(let i=0;i<160000&&s.t<stop&&!d.ended?.(s,run.params);i++)s=d.step(s,run.params,h);
 return s;
}
const vector=o=>new T.Vector3(0,o.userData.vectorLength,0).applyQuaternion(o.quaternion);

test('linear motion reaches the zero-drag limit without catastrophic cancellation',()=>{
 for(const mode of [0,1])for(const force of [-30,0,30])for(const initial of [-10,0,20])for(const t of [0,.03,1,8]){
  const p={...LABS.motion.defaults,mode,force,initial},vac=linearMotion({...p,drag:0},t),F=mode?p.mass*p.g:force;
  close(vac.x,initial*t+.5*F/p.mass*t*t);close(vac.v,initial+F/p.mass*t);
  for(const drag of [1e-320,1e-20,1e-12]){const q=linearMotion({...p,drag},t);close(q.x,vac.x);close(q.v,vac.v);}
 }
});

test('linear-drag solution satisfies xdot=v, mdv/dt=F-bv and its terminal-speed limit',()=>{
 for(const drag of [.001,.5,5])for(const initial of [-10,0,20]){
  const p={...LABS.motion.defaults,drag,initial},t=1.3,eps=1e-5,a=linearMotion(p,t-eps),b=linearMotion(p,t+eps),q=linearMotion(p,t);
  close((b.x-a.x)/(2*eps),q.v,1e-7);close(p.mass*(b.v-a.v)/(2*eps),p.force-drag*q.v,1e-7);
  close(linearMotion(p,50*p.mass/drag).v,p.force/drag);
 }
});

test('motion has a linear fixed scale, includes reversal extrema and draws the same authoritative state',()=>{
 for(const mode of [0,1])for(const force of [-30,0,30])for(const initial of [-10,0,20]){
  const a=make('motion',{mode,force,initial}),p=a.run.params,l=motionLayout(p),turn=motionTurningTime(p);
  for(let i=0;i<=40;i++){
   const t=i/5,q=a.d.sample({t},p);assert.ok(q.x>=l.low-1e-8&&q.x<=l.high+1e-8);
   a.update({t});const body=nodes(a.root,'motion-body')[0],at=l.point(q.x);
   close(body.position.x,at[0]);if(mode)close(body.position.y,at[1]);
   const [v,F,D,R]=a.scene.kit.indicators,axis=mode?'y':'x',sign=mode?-1:1;
   close(vector(v)[axis],sign*q.v*l.velocityScale);close(vector(F)[axis]+vector(D)[axis],vector(R)[axis]);
  }
  if(turn>0&&turn<8)close(linearMotion(p,turn).v,0);
  const one=l.point(1),two=l.point(2),three=l.point(3);one.forEach((_,j)=>close(two[j]-one[j],three[j]-two[j]));
  close(a.d.step({t:7.999},p,.01).t,8);clean(a.root);
 }
});

test('collision carts retain a physical 0.8 m length and touch exactly without overlap',()=>{
 const a=make('collisions',{m1:5,m2:.2,u1:5,u2:-5,restitution:.7}),p=a.run.params,
  contact=collisionObservation(p).contact,s=a.d.step(a.run.state,p,contact);
 a.update(s);a.root.updateMatrixWorld(true);
 const A=nodes(a.root,'collision-a')[0],B=nodes(a.root,'collision-b')[0],ba=new T.Box3().setFromObject(A),bb=new T.Box3().setFromObject(B);
 const {scale}=collisionLayout(p);
 close(ba.max.x-ba.min.x,.8*scale,1e-7);close(bb.max.x-bb.min.x,.8*scale,1e-7);close(ba.max.x,bb.min.x,1e-7);
 const width=ba.max.x-ba.min.x,after=a.d.step(s,p,.1);a.update(after);a.root.updateMatrixWorld(true);
 close(new T.Box3().setFromObject(A).getSize(new T.Vector3()).x,width,1e-7);
 assert.ok(new T.Box3().setFromObject(B).min.x>=new T.Box3().setFromObject(A).max.x-1e-7);clean(a.root);
});

test('collision ruler stays in lab coordinates through impact and same-direction drift',()=>{
 for(const [u1,u2] of [[5,5],[-5,-5],[5,4],[5,-5],[-5,5],[0,0]]){
  const a=make('collisions',{u1,u2,m1:5,m2:.2,restitution:.7}),p=a.run.params,
    layout=collisionLayout(p),{duration}=collisionObservation(p),
    ticks=nodes(a.root,'collision-ruler-tick'),
    marks=ticks.map(n=>n.geometry.attributes.position.getX(0));
  let s=a.run.state;
  for(let i=0;i<=160;i++){
   if(i) s=a.d.step(s,p,duration/160);
   a.update(s);
   for(const [id,x] of [['collision-a',s.x1],['collision-b',s.x2]]){
    assert.ok(x-.4>=layout.low-1e-7 && x+.4<=layout.high+1e-7);
    close(nodes(a.root,id)[0].position.x,layout.point(x));
   }
   ticks.forEach((n,j)=>{
    close(n.position.x,0);
    close(n.geometry.attributes.position.getX(0),marks[j]);
    close(marks[j],layout.point(n.userData.metres),1e-7);
   });
  }
  assert.ok(layout.ticks.includes(0)); clean(a.root);
 }
});

test('collision windows preserve the event, cap separation at 7 m and do not invent contact for separating carts',()=>{
 for(const u1 of [-5,0,5])for(const u2 of [-5,0,5])for(const restitution of [0,.4,1]){
  const p={...LABS.collisions.defaults,u1,u2,restitution},q=collisionObservation(p),s=runTo('collisions',p,q.duration);
  close(q.duration/q.rate,6);assert.ok(q.duration>0&&q.duration<=10);assert.ok(s.x2-s.x1<=7+1e-7);assert.ok(s.x2-s.x1>=.8-1e-7);
  close(p.m1*s.v1+p.m2*s.v2,p.m1*u1+p.m2*u2);
  if(u1<=u2)assert.equal(s.hit,false);else if(q.contact<=q.duration)assert.equal(s.hit,true);
 }
});

test('collision energy bars account for remaining kinetic energy and internal transfer, including zero energy',()=>{
 for(const restitution of [0,.4,1])for(const velocities of [[2,0],[2,-2],[0,0]]){
  const a=make('collisions',{restitution,u1:velocities[0],u2:velocities[1]}),p=a.run.params,s=runTo('collisions',p,collisionObservation(p).duration);a.update(s);
  const initial=.5*p.m1*p.u1**2+.5*p.m2*p.u2**2,K=.5*p.m1*s.v1**2+.5*p.m2*s.v2**2,
   kept=nodes(a.root,'collision-energy-kept')[0],lost=nodes(a.root,'collision-energy-lost')[0];
  if(initial){close(kept.scale.x,K/initial);close(lost.scale.x,1-K/initial);close(kept.position.x+2.3*kept.scale.x,lost.position.x-2.3*lost.scale.x);}
  else {assert.equal(kept.visible,false);assert.equal(lost.visible,false);}
  clean(a.root);
 }
});

test('cached projectile preview and live RK4 agree across presets and difficult flight extremes',()=>{
 const d=LABS.projectile,patches=[...d.presets.map(x=>x[1]),{speed:5,angle:5,g:20},{speed:60,angle:85,g:1},{speed:60,angle:85,g:1,drag:.08},{height:20,speed:5,angle:5,g:1,drag:.08}];
 for(const patch of patches){
  const p={...d.defaults,...patch},saved=JSON.stringify(p),preview=projectilePreview(p),s=runTo('projectile',p,preview.duration+1);
  assert.equal(s.landed,true);close(s.t,preview.duration);close(s.x,preview.range);close(s.y,0);assert.ok(preview.step<=1/240);
  close(preview.duration/d.rateFor(p),8);assert.equal(JSON.stringify(p),saved);assert.equal(projectilePreview(p),preview);
  if(p.drag===0){close(s.x,preview.vacuum.range,1e-5);close(s.t,preview.vacuum.flightTime,1e-5);}
 }
});

test('projectile frames keep an equal x/y length scale and the comparison fits the full vacuum reference',()=>{
 const p={...LABS.projectile.defaults,drag:.08,speed:60,g:1},preview=projectilePreview(p),actual=projectileLayout(p),comparison=projectileLayout(p,'vacuum');
 assert.ok(actual.scale>comparison.scale);
 for(const l of [actual,comparison]){const zero=l.point({x:0,y:0}),x=l.point({x:1,y:0}),y=l.point({x:0,y:1});close(x[0]-zero[0],y[1]-zero[1]);}
 for(let i=0;i<=240;i++){const q=vacuumPoint(p,preview.vacuum.flightTime*i/240);assert.ok(q.x<=comparison.maxX+1e-7&&q.y<=comparison.maxY+1e-7);}
 const a={x:0,y:0},b={x:3,y:6},segment=clipFlightSegment(a,b,2,2);close(segment[1].x,1);close(segment[1].y,2);
 assert.equal(clipFlightSegment({x:0,y:3},{x:2,y:3},2,2),null);
});

test('projectile indicators show velocity, downward gravity and opposing drag; impact retains incoming velocity',()=>{
 const a=make('projectile',{drag:.025}),p=a.run.params,mid=runTo('projectile',p,.7);a.update(mid);
 const [v,g,d]=a.scene.kit.indicators,velocity=new T.Vector3(mid.vx,mid.vy,0),gravity=vector(g),drag=vector(d);
 assert.ok(vector(v).dot(velocity)>0);assert.ok(gravity.y<0);close(gravity.x,0);
 assert.ok(drag.dot(velocity)<0);close(drag.x*mid.vy-drag.y*mid.vx,0);
 const end=runTo('projectile',p,projectilePreview(p).duration+1);a.update(end);
 assert.equal(g.visible,false);assert.equal(d.visible,false);assert.equal(v.visible,true);close(nodes(a.root,'projectile-body')[0].position.y-.12,.35);clean(a.root);
});

test('projectile framing and collision playback reuse geometry and never mutate supplied states',()=>{
 for(const id of ['projectile','collisions']){
  const a=make(id),objects=[];a.root.traverse(o=>objects.push([o,o.geometry]));Object.freeze(a.run.params);Object.freeze(a.run.state);
  const saved=JSON.stringify(a.run);for(const frame of ['actual','vacuum','actual'])a.update(a.run.state,{projectileFrame:frame});
  const after=[];a.root.updateMatrixWorld(true);a.root.traverse(o=>{after.push([o,o.geometry]);assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.isInstancedMesh)assert.ok(o.instanceMatrix.array.every(Number.isFinite));});
  assert.deepEqual(after,objects);assert.equal(JSON.stringify(a.run),saved);clean(a.root);
 }
});
