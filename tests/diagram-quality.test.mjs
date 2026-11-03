import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.min.js';
import { frameApparatus,apparatusBounds,orbitBounds,frameOrbit,diagramLabelVisible } from '../js/scene-framing.js';
import { orbitalReference } from '../js/orbital-reference.js';
import { G,centralRadius } from '../js/physics.js';
import { createSceneKit } from '../js/scene-kit.js';
import { createCurriculumScene,CURRICULUM_BUILDERS } from '../js/scene-curriculum.js';
import { SIMULATIONS } from '../js/simulations.js';
import { paperInk } from '../js/diagram-theme.js';
function checkFrame(bounds,options) {
  const before=bounds.clone(),fit=frameApparatus(bounds,options),camera=new T.PerspectiveCamera(options.fov||38,options.aspect,.01,1000),target=new T.Vector3(...fit.target);
  camera.position.set(Math.sin(fit.polar)*Math.sin(fit.azimuth),Math.cos(fit.polar),Math.sin(fit.polar)*Math.cos(fit.azimuth)).multiplyScalar(fit.radius).add(target);
  camera.lookAt(target);camera.updateMatrixWorld(true);
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]) {
    const point=new T.Vector3(x,y,z).project(camera);
    assert.ok(Math.abs(point.x)<=1/1.13+1e-10);assert.ok(Math.abs(point.y)<=1/1.13+1e-10);
  }
  assert.deepEqual(bounds,before);
}
test('perspective framing contains every apparatus corner on wide and portrait screens',()=>{
  for(const aspect of [.45,.75,1,1.6,2.4,3])for(const polar of [.3,1.18,1.57])
    checkFrame(new T.Box3(new T.Vector3(-5,-.4,-3),new T.Vector3(5,6,3)),{aspect,polar});
});

test('orbital composition fits circular, elliptical and escape paths without altering scale or state',()=>{
  const base={centralMass:5.9722e24,bodyMass:1000,distance:15e6};
  for(const multiplier of [.7,1,1.25,1.6]) {
    const params={...base,velocity:multiplier*Math.sqrt(G*(base.centralMass+base.bodyMass)/base.distance)},
      reference=orbitalReference(params),state={x:params.distance,y:0},trail=[{x:0,y:params.distance}],
      before=structuredClone({params,reference,state,trail}),scale=5/(params.distance*1.35),radius=centralRadius(params)*scale,
      bounds=orbitBounds(reference,trail,state,scale,radius);
    assert.ok(bounds.containsPoint(new T.Vector3(state.x*scale,1,-state.y*scale)));
    assert.ok(bounds.containsPoint(new T.Vector3(-radius,1-radius,-radius)));
    for(const aspect of [.45,.75,1.3,2.5]) checkFrame(bounds,{aspect,polar:.6,azimuth:-.18});
    assert.deepEqual({params,reference,state,trail},before);
  }
});

test('orbital camera bounds reject non-finite positions and invalid display scales',()=>{
  for(const scale of [0,-1,Infinity,NaN]) assert.throws(()=>orbitBounds([],[],{x:1,y:0},scale,1),RangeError);
  assert.throws(()=>orbitBounds([],[],{x:NaN,y:0},1,1),RangeError);
});

test('sampled orbit framing stays inside the viewport and removes empty corner padding', () => {
  const base = { centralMass: 5.9722e24, bodyMass: 1000, distance: 15e6 };
  const scale = 5 / (base.distance * 1.35);
  const state = { x: base.distance, y: 0 };
  for (const ratio of [0.7, 1, 1.25, 1.6]) {
    const params = { ...base, velocity: ratio * Math.sqrt(G * (base.centralMass + base.bodyMass) / base.distance) };
    const reference = orbitalReference(params);
    const planetRadius = centralRadius(params) * scale;
    for (const aspect of [0.55, 1.6, 2.5]) {
      const fit = frameOrbit(reference, [], state, scale, planetRadius, aspect);
      const camera = new T.PerspectiveCamera(38, aspect, 0.05, 200);
      const target = new T.Vector3(...fit.target);
      camera.position.set(Math.sin(fit.polar) * Math.sin(fit.azimuth), Math.cos(fit.polar), Math.sin(fit.polar) * Math.cos(fit.azimuth))
        .multiplyScalar(fit.radius).add(target);
      camera.lookAt(target);
      camera.updateMatrixWorld(true);
      for (const [x, y] of reference) {
        const projected = new T.Vector3(x * scale, 1, -y * scale).project(camera);
        assert.ok(Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1);
      }
      if (ratio === 1 && aspect === 2.5) {
        const oldFit = frameApparatus(orbitBounds(reference, [], state, scale, planetRadius), {
          aspect, azimuth: -0.18, polar: 0.6, padding: 1.1,
        });
        assert.ok(fit.radius < oldFit.radius * 0.8);
      }
    }
  }
});
test('all 44 curriculum apparatus bounds produce finite camera compositions without changing physics',()=>{
  for(const id of Object.keys(CURRICULUM_BUILDERS)) {
    const d=SIMULATIONS[id],run=d.create(d.defaults),saved=structuredClone(run),root=new T.Group(),scene=createCurriculumScene(id,run.params,root,{labels:false});
    scene.update(run);const bounds=apparatusBounds(root);
    assert.ok(!bounds.isEmpty(),id);checkFrame(bounds,{aspect:1.6});assert.deepEqual(run,saved,id);
    root.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.();});
  }
});
test('large teaching arrows and detached text banners cannot force the apparatus off into the distance',()=>{
  const root=new T.Group(),k=createSceneKit(root,{labels:false});k.box(4,2,2,0xffffff);
  const original=apparatusBounds(root);k.arrow([0,0,0],[1000,0,0]);
  k.label('A detached numerical banner = 1000 N',[100,100,100],'#fff',6);
  assert.deepEqual(apparatusBounds(root),original);
  assert.equal(diagramLabelVisible('10°',.8),true);assert.equal(diagramLabelVisible('Normal',1.2),true);
});
test('paper-diagram labels meet 4.5:1 contrast against the darkest paper tone',()=>{
  for(const color of ['#ffffff','#6be5d4','#ffc580','#91baff','#c4a3ff','#8faec2','rgba(180,210,225,0.8)']) {
    const hex=paperInk(color).slice(1),rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255),
      lum=rgb.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
    const background=[237,245,248].map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
    assert.ok((background+.05)/(lum+.05)>=4.5,color);
  }
});
