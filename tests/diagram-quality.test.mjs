import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.min.js';
import { frameApparatus,apparatusBounds,diagramLabelVisible } from '../js/scene-framing.js';
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
