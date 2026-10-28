import test from "node:test";
import assert from "node:assert/strict";
import * as T from "../vendor/three.module.min.js";
import { CURRICULUM_SIMULATIONS as LABS } from "../js/curriculum-simulations.js";
import { chargedLayout, chargedTiming, chargedPosition, soundLayout } from "../js/field-geometry.js";
import { createCurriculumScene } from "../js/scene-curriculum.js";
const close = (a, b, scale = Math.max(Math.abs(a), Math.abs(b), 1e-30)) => assert.ok(Math.abs(a-b) <= scale * 1e-10, `${a} ≈ ${b}`);
function apparatus(id, patch = {}) {
  const run = LABS[id].create({ ...LABS[id].defaults, ...patch }), root = new T.Group(),
    scene = createCurriculumScene(id, run.params, root, { labels: false });
  const update = (t, extra = {}) => scene.update({ ...run, state: { ...run.state, t }, ...extra });
  return { run, root, scene, update };
}
const nodes = (root, role) => { const found = []; root.traverse(o => { if(o.userData.role === role) found.push(o); }); return found; };
function dispose(root) { root.traverse(o => { o.geometry?.dispose(); const materials = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; materials.forEach(m => m.dispose()); }); }

test("zero-field and neutral particles move progressively through a fixed observation scale", () => {
  for (const patch of [{ field: 0 }, { charge: 0 }]) {
    const p = { ...LABS.charged.defaults, ...patch }, l = chargedLayout(p),
      a = l.point(0), b = l.point(l.duration/2), c = l.point(l.duration);
    close(a[0], -3.3); close(b[0], 0, 1); close(c[0], 3.3);
    close(a[1], b[1]); close(b[1], c[1]);
    close(c[0]-a[0], p.speed*l.duration*l.scale);
    assert.equal(l.period, Infinity);
  }
});

test("charged clock resolves both mass extremes, both field signs and the weak-field cap", () => {
  for (const mass of LABS.charged.limits.mass) for (const field of [-.01, .002, 1e-12, 1e-20]) for(const charge of [-1,1]) {
    const p = { ...LABS.charged.defaults, mass, field, charge }, d = LABS.charged, t = chargedTiming(p);
    close(t.duration/t.step, 1200); assert.ok(t.duration <= 4e-5);
    assert.ok(Math.abs(t.omega*t.step) <= 4*Math.PI/1200*(1+1e-12));
    close(d.window(p)*d.timeFactor, t.duration);
    close(d.hFor(p), t.step); close(d.rateFor(p), t.rate);
    assert.equal(d.ended({t:t.duration/2},p), null);
    assert.ok(d.ended({t:t.duration},p));
    const l = chargedLayout(p);
    for(let i=0;i<=100;i++) {
      const at=l.point(t.duration*i/100);
      const actual=LABS.charged.sample({t:t.duration*i/100},p), exact=chargedPosition(p,t.duration*i/100);
      close(actual.x,exact.x); close(actual.y,exact.y);
      assert.ok(at.every(Number.isFinite));
      assert.ok(Math.abs(at[0])<=3.301 && Math.abs(at[1]-2.35)<=1.701);
    }
  }
});

test("particle chamber uses the solver trajectory and magnetic force does no work", () => {
  for (const charge of [-1, 1]) for(const field of [-.002, 0, .002]) {
    const a = apparatus('charged', {charge,field}), p=a.run.params, l=chargedLayout(p);
    for (const f of [.03,.19,.71]) {
      const t=l.duration*f, q=LABS.charged.sample({t},p), pos=chargedPosition(p,t);
      close(pos.x,q.x); close(pos.y,q.y);
      a.update(t);
      const particle=nodes(a.root,'charged-particle')[0];
      particle.position.toArray().forEach((value,i)=>close(value,l.point(t)[i],1));
      const [velocity, force] = a.scene.kit.indicators.slice(-2),
        v=new T.Vector3(0,1,0).applyQuaternion(velocity.quaternion),
        F=new T.Vector3(0,1,0).applyQuaternion(force.quaternion);
      if(q.force) close(v.dot(F),0,1); else assert.equal(force.visible,false);
      close(q.kinetic,.5*p.mass*p.speed**2);
    }
    dispose(a.root);
  }
});

test("solenoid pole labels and internal field reverse with current and vanish at zero", () => {
  for(const current of [-2,0,2]) {
    const a=apparatus('magnetism',{current}); a.update(0);
    const field=nodes(a.root,'magnetic-field')[0], arrows=field.children.filter(o=>o.userData.vectorLength!==undefined),
      poles=a.scene.kit.annotations.filter(o=>['N','S'].includes(o.userData.text)),
      markers=nodes(a.root,'direction-marker');
    assert.equal(field.visible,current!==0);
    assert.ok(poles.every(o=>o.visible===(current!==0)));
    assert.ok(markers.every(o=>o.visible===(current!==0)));
    if(current) {
      const right=poles.find(o=>o.position.x>0);
      assert.equal(right.userData.text,current>0?'N':'S');
      const direction=new T.Vector3(0,1,0).applyQuaternion(arrows.at(-1).quaternion);
      close(direction.x,Math.sign(current));
    }
    a.update(.2,{vectors:false}); assert.equal(field.visible,false);
    a.update(.3,{showLabels:false}); assert.ok(poles.every(o=>!o.visible));
    dispose(a.root);
  }
});

test("straight-wire field follows I cross r and its reference-probe reading", () => {
  for(const current of [-5,2]) {
    const a=apparatus('magnetism',{current,mode:1}); a.update(.4);
    const field=nodes(a.root,'magnetic-field')[0], arrows=field.children.filter(o=>o.userData.vectorLength!==undefined),
      first=arrows[0], direction=new T.Vector3(0,1,0).applyQuaternion(first.quaternion);
    assert.ok(first.position.x>0); close(direction.z,-Math.sign(current));
    const q=LABS.magnetism.sample({t:0},a.run.params);
    close(q.field,4e-7*Math.PI*current/(2*Math.PI*.05));
    dispose(a.root);
  }
});

test("sound spatial pressure uses the exact source clock, c/f and x/c delay without a cycle cap", () => {
  for(const frequency of [50,440,880,2000]) for(const temperature of [0,40]) {
    const p={...LABS.sound.defaults,frequency,temperature}, t=.00073,
      q=LABS.sound.sample({t},p), a=soundLayout(p,t,0);
    close(a.speed,q.speed); close(a.wavelength,q.wavelength); close(a.pressure,q.pressure);
    for(const x of [0,.15,1,2]) {
      const b=soundLayout(p,t,x), delayed=soundLayout(p,t-x/a.speed,0);
      close(b.pressure,delayed.pressure,1);
      close(b.pressure,soundLayout(p,t,x+a.wavelength).pressure,1);
    }
    assert.ok(a.columns>=2/a.wavelength*18);
    close(soundLayout(p,t,0).phase-soundLayout(p,t,2).phase,4*Math.PI/a.wavelength);
  }
});

test("positive acoustic pressure means compression and parcels never cross neighbours", () => {
  for(const frequency of LABS.sound.limits.frequency) for(const amplitude of LABS.sound.limits.amplitude) {
    const p={...LABS.sound.defaults,frequency,amplitude}, a=soundLayout(p,1/(4*frequency),0), eps=1e-7,
      derivative=(soundLayout(p,1/(4*frequency),eps).displacement-soundLayout(p,1/(4*frequency),-eps).displacement)/(2*eps);
    assert.ok(a.pressure>0 && derivative<0);
    for(const phase of [0,.13,.37,.73]) {
      let previous=-Infinity;
      for(let i=0;i<a.columns;i++) {
        const x=2*i/(a.columns-1), q=soundLayout(p,phase/frequency,x), at=x*q.scale+q.displacement;
        assert.ok(at>previous); previous=at;
      }
    }
  }
});

test("tracked air parcel returns to its own rest position and sound meshes use that same phase", () => {
  const a=apparatus('sound'), p=a.run.params, period=1/p.frequency, parcel=nodes(a.root,'sound-tracked-parcel')[0],
    dots=nodes(a.root,'sound-parcels')[0];
  for(const t of [0,period/4,period/2,period]) {
    a.update(t); close(parcel.position.x,.45+soundLayout(p,t,1).displacement);
    const matrix=new T.Matrix4(), position=new T.Vector3(); dots.getMatrixAt(0,matrix); position.setFromMatrixPosition(matrix);
    assert.ok(Math.abs(position.x-(-3+soundLayout(p,t,0).displacement))<2e-7);
  }
  const initial=soundLayout(p,0,1).displacement;
  close(soundLayout(p,period,1).displacement,initial);
  dispose(a.root);
});
