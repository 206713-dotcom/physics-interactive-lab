import test from "node:test";
import assert from "node:assert/strict";
import * as T from "../vendor/three.module.min.js";
import { gasParticleMotion, gasParticleCount, PARTICLE_CHAMBER, particleChamberWidth, heatSlabGeometry } from "../js/thermal-geometry.js";
import { CURRICULUM_SIMULATIONS as LABS } from "../js/curriculum-simulations.js";
import { diagramLabelVisible } from "../js/scene-framing.js";
import { createCurriculumScene } from "../js/scene-curriculum.js";
import { stepPractical } from "../js/practical-physics.js";
const close = (a, b, scale = Math.max(1, Math.abs(a), Math.abs(b))) => assert.ok(Math.abs(a - b) < scale * 1e-9);

test("gas particle speed depends on square root temperature and is independent of volume", () => {
  for (let i = 0; i < 144; i++) for (const t of [0, 0.3, 12.8]) {
    const a = gasParticleMotion(i, t, 300, 0.024);
    const compressed = gasParticleMotion(i, t, 300, 0.005);
    const warm = gasParticleMotion(i, t, 600, 0.024);
    close(Math.hypot(...a.velocity), Math.hypot(...compressed.velocity));
    close(Math.hypot(...warm.velocity), Math.sqrt(2) * Math.hypot(...a.velocity));
  }
});

test("gas particles stay inside every supported chamber and advance at their displayed velocity", () => {
  const { margin, height, depth } = PARTICLE_CHAMBER;
  for (const temperature of [150, 600]) for (const volume of [0.005, 0.024, 0.05]) {
    const spans = [particleChamberWidth(volume), height, depth];
    for (let i = 0; i < 144; i++) for (const t of [0, 0.37, 23.7]) {
      const a = gasParticleMotion(i, t, temperature, volume);
      a.position.forEach((value, axis) => assert.ok(value >= margin - 1e-10 && value <= spans[axis] - margin + 1e-10));
      const next = gasParticleMotion(i, t + 1e-7, temperature, volume);
      if (next.collision.age > 1e-7) a.position.forEach((value, axis) => close((next.position[axis] - value) / 1e-7, a.velocity[axis], 100));
    }
  }
});

test("reported wall collisions lie on a wall and reverse only the normal velocity", () => {
  for (const volume of [0.005, 0.05]) {
    const p = LABS.gases.defaults, spans = [particleChamberWidth(volume), PARTICLE_CHAMBER.height, PARTICLE_CHAMBER.depth];
    for (let i = 0; i < 30; i++) {
      const a = gasParticleMotion(i, 2, p.temperature, volume), collisionTime = 2 - a.collision.age;
      const before = gasParticleMotion(i, collisionTime - 1e-7, p.temperature, volume);
      const after = gasParticleMotion(i, collisionTime + 1e-7, p.temperature, volume);
      const axis = a.collision.axis;
      close(a.collision.position[axis], a.collision.side ? spans[axis] - PARTICLE_CHAMBER.margin : PARTICLE_CHAMBER.margin);
      close(before.velocity[axis], -after.velocity[axis]);
      for (let other = 0; other < 3; other++) if (other !== axis) close(before.velocity[other], after.velocity[other]);
    }
  }
});

test("gas amount changes a bounded illustrative sample while pressure still obeys the ideal-gas equation", () => {
  assert.equal(gasParticleCount(1), 72);
  assert.equal(gasParticleCount(2), 144);
  assert.ok(gasParticleCount(0.1) >= 8);
  const p = LABS.gases.defaults, original = LABS.gases.sample({t:0}, p);
  const more = LABS.gases.sample({t:0}, {...p,amount:2 * p.amount});
  const smaller = LABS.gases.sample({t:0}, {...p,volume:p.volume / 2});
  close(more.pressure, 2 * original.pressure);
  close(smaller.pressure, 2 * original.pressure);
});

test("conduction thickness and cross-section geometry follow their selected dimensions", () => {
  const p = LABS.heat.defaults, a = heatSlabGeometry(p);
  close(heatSlabGeometry({...p,thickness:2*p.thickness}).length, 2*a.length);
  const moreArea = heatSlabGeometry({...p,area:4*p.area});
  close(moreArea.side ** 2, 4*a.side ** 2);
  const q = LABS.heat.sample({t:1},p);
  close(LABS.heat.sample({t:1},{...p,thickness:2*p.thickness}).power,q.power/2);
});

test("radiation includes both emission and absorption and their difference is the original net exchange", () => {
  for (const hot of [30,100,200]) for (const cold of [0,20,25]) for (const emissivity of [0.05,1]) {
    const p = {...LABS.heat.defaults,mode:2,hot,cold,emissivity};
    const q = LABS.heat.sample({t:2},p);
    assert.ok(q.hotEmission > q.backgroundAbsorption && q.backgroundAbsorption > 0);
    close(q.hotEmission-q.backgroundAbsorption,q.radiation);
    close(q.energy,2*q.power);
  }
  const equal = LABS.heat.sample({t:1},{...LABS.heat.defaults,mode:2,hot:20,cold:20});
  assert.ok(equal.hotEmission > 0);
  close(equal.hotEmission,equal.backgroundAbsorption);
  close(equal.radiation,0);
});

test("solid and liquid apparatus do not pretend to display a gas-law pressure", () => {
  for (const state of [0,1]) {
    const run = LABS.gases.create({...LABS.gases.defaults,state}), root = new T.Group();
    const scene = createCurriculumScene("gases",run.params,root,{labels:false});
    scene.update(run);
    assert.ok(scene.kit.annotations.some(node => node.userData.text === "No gas-law reading"));
    assert.equal(LABS.gases.sample(run.state,run.params).pressure,null);
    root.traverse(node=>{node.geometry?.dispose();node.material?.dispose?.();});
  }
});

test("long apparatus labels preserve turns and state names without admitting calculation banners", () => {
  assert.equal(diagramLabelVisible("Secondary · 1000 turns",3.8),true);
  assert.equal(diagramLabelVisible("72 illustrative gas particles",4.0),true);
  assert.equal(diagramLabelVisible("Power = 100 W",4.0),false);
  assert.equal(diagramLabelVisible("100 N",4.0),false);
});

test("filament current markers follow integrated charge and stop at zero supply voltage", () => {
  for (const voltage of [0,9]) {
    const run = LABS.filament.create({...LABS.filament.defaults,voltage});
    let state = run.state;
    for (let i = 0; i < 30; i++) state = stepPractical("filament",state,run.params,1/120);
    const root = new T.Group(), scene = createCurriculumScene("filament",run.params,root,{labels:false});
    const lab = {...run,state};
    scene.update(lab);
    const markers = scene.kit.objects.filter(node=>node.userData.role==="direction-marker");
    const positions = markers.map(node=>node.position.clone());
    const directions = markers.map(node=>new T.Vector3(0,1,0).applyQuaternion(node.quaternion));
    lab.state = stepPractical("filament",state,run.params,1e-6);
    scene.update(lab);
    if (voltage) {
      markers.forEach((node,i)=>assert.ok(node.position.clone().sub(positions[i]).dot(directions[i])>0));
      const before = LABS.filament.sample(state,run.params);
      const after = LABS.filament.sample(lab.state,run.params);
      close((after.input-before.input)/(voltage*1e-6),before.current,10000);
    } else assert.ok(markers.every(node=>!node.visible));
    root.traverse(node=>{node.geometry?.dispose();node.material?.dispose?.();});
  }
});
