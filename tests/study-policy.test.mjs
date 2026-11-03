import test from 'node:test';
import assert from 'node:assert/strict';
import { SIMULATIONS } from '../js/simulations.js';
import { availableModes, getProfile } from '../js/learning-paths.js';
import { calculationSheet } from '../js/calculations.js';
import { studyParams, studyControl, studySheet, studyReadings, studyGraphs,
  visibleControlKeys, sceneLabelAllowed, igcseArea, IGCSE_AREAS } from '../js/study-policy.js';

const beginner = Object.entries(SIMULATIONS).filter(([id])=>availableModes(id).includes('igcse'));
test('all 41 IGCSE activities start in valid, reproducible course-scoped states',()=>{
  assert.equal(beginner.length,41);
  for (const [id,d] of beginner) {
    const p = studyParams(id,'igcse',d), before = structuredClone(p);
    const {state} = d.create(p);
    assert.deepEqual(studyParams(id,'igcse',d,p),p,id);
    assert.ok(IGCSE_AREAS.includes(igcseArea(id)),id);
    const readings = studyReadings(id,state,p,'igcse',d);
    assert.ok(readings.length>=1 && readings.length<=3,id);
    assert.ok(readings.every(r=>typeof r.value==='string'||r.value===null||Number.isFinite(r.value)),id);
    assert.deepEqual(p,before,`${id}: presentation must not mutate parameters`);
    assert.ok(studyGraphs(id,'igcse',d).every(g=>d.graphs.includes(g)),id);
  }
});
test('each visible IGCSE slider endpoint and named choice survives the input round trip',()=>{
  for (const [id,d] of beginner) for (const key of visibleControlKeys(id,'igcse')) {
    const c=studyControl(id,'igcse',d.controls.find(x=>x.key===key));
    const choices=c.options?.map(([v])=>Number(v)) || [c.min*(c.factor||1),c.max*(c.factor||1)];
    for (const value of choices) {
      const p=studyParams(id,'igcse',d,{[key]:value});
      assert.ok(Math.abs(p[key]-value) <= Math.max(Math.abs(value)*1e-12,1e-30),`${id}.${key}`);
      assert.doesNotThrow(()=>d.create(p),`${id}.${key}=${value}`);
    }
  }
});
test('shared IGCSE setups cannot re-enable untaught variables or invalid course options',()=>{
  const d=SIMULATIONS.pendulum;
  const p=studyParams('pendulum','igcse',d,{g:1,damping:1,mass:5,length:2});
  assert.equal(p.g,9.81);assert.equal(p.damping,0);assert.equal(p.mass,1);assert.equal(p.length,2);
  assert.throws(()=>studyParams('pendulum','igcse',d,{angle:100}),/between/);
  assert.throws(()=>studyParams('pendulum','igcse',d,{length:NaN}),/finite/);
  assert.throws(()=>studyParams('cooling','igcse',SIMULATIONS.cooling,{conductance:7}),/available/);
  assert.equal(studyParams('motion','igcse',SIMULATIONS.motion,{initial:10}).initial,0);
  assert.equal(studyParams('gases','igcse',SIMULATIONS.gases,{amount:100}).amount,1);
});
test('IGCSE pendulum timing contains no analytic SHM period or calculated measurement',()=>{
  const d=SIMULATIONS.pendulum,p=studyParams('pendulum','igcse',d),s=d.create(p).state;
  assert.equal(getProfile('pendulum','igcse').calculations.length,0);
  assert.deepEqual(studySheet('pendulum',s,p,'igcse').calculations,[]);
  assert.deepEqual(studyReadings('pendulum',s,p,'igcse',d).map(r=>r.title),['Length','Angle from vertical','Elapsed time']);
  assert.deepEqual(studyGraphs('pendulum','igcse',d).map(g=>g.id),['angle']);
});
test('IGCSE worked steps exclude ideal-gas, exponential cooling, Faraday and Kepler derivations',()=>{
  for (const id of ['gases','cooling','induction','earthmoon','solarsystem','filament','motion','calorimetry']) {
    const d=SIMULATIONS[id],p=studyParams(id,'igcse',d),s=d.create(p).state;
    const text=studySheet(id,s,p,'igcse').calculations.map(c=>c.formula).join(' ');
    assert.doesNotMatch(text,/nRT|e\^|NBA|GM|α|mL|e\^\(/,id);
  }
});
test('course calculations and numerical readings remain authoritative solver outputs',()=>{
  for (const [id,d] of beginner) {
    const p=studyParams(id,'igcse',d),s=d.create(p).state;
    const full=calculationSheet(id,s,p);
    for (const c of studySheet(id,s,p,'igcse').calculations)
      assert.deepEqual(c,full.calculations.find(x=>x.id===c.id),id);
    assert.ok(studySheet(id,s,p,'igcse').variables.every(v=>
      !['alpha','conductance','amount','impact','restitution','emissivity'].includes(v.symbol)),id);
  }
});
test('friendly unit labels and field-direction choices retain the same SI model values',()=>{
  const d=SIMULATIONS.universe,c=studyControl('universe','igcse',d.controls.find(x=>x.key==='distance'));
  assert.ok(Math.abs(100/c.factor-326.156)<1e-8);
  const u=studyParams('universe','igcse',d);
  const distance=studySheet('universe',d.create(u).state,u,'igcse').variables.find(v=>v.symbol==='distance');
  assert.equal(distance.unit,'m');assert.equal(distance.value,100*3.085677581491367e22);
  const charge=SIMULATIONS.charged;
  const p=studyParams('charged','igcse',charge,{field:-0.002});
  assert.equal(p.field,-0.002);
  assert.equal(charge.create(p).params.field,-0.002);
});
test('qualitative gas states do not display inapplicable gas-pressure readings',()=>{
  const d=SIMULATIONS.gases,p=studyParams('gases','igcse',d,{state:0});
  const readings=studyReadings('gases',d.create(p).state,p,'igcse',d);
  assert.equal(readings[0].value,'Solid');
  assert.ok(readings.every(x=>!/pressure/i.test(x.title)));
});
test('level-aware labels preserve IGCSE ray and vector maths while removing advanced derivations',()=>{
  for (const [id,text] of [['gases','pV = nRT'],['pendulum','θ̈ = −(g/L) sin θ'],['induction','ε = NBAω sin θ'],['expansion','ΔL = αLΔT']]) {
    assert.equal(sceneLabelAllowed(id,'igcse',text),false,text);
    assert.equal(sceneLabelAllowed(id,'alevel',text),true,text);
  }
  for (const text of ['n = sin i / sin r','sin c = 1/n','Normal','30°'])
    assert.equal(sceneLabelAllowed('refraction','igcse',text),true,text);
  assert.equal(sceneLabelAllowed('vectors','igcse','R = √(A² + B²)'),true);
});
test('all AS, A Level and enrichment modes retain their complete parameter, graph and calculation sets',()=>{
  for (const [id,d] of Object.entries(SIMULATIONS)) for (const mode of availableModes(id).filter(m=>m!=='igcse')) {
    const p=studyParams(id,mode,d),s=d.create(p).state;
    assert.equal(studyGraphs(id,mode,d),d.graphs,id);
    assert.deepEqual(studySheet(id,s,p,mode),calculationSheet(id,s,p),id);
    assert.equal(visibleControlKeys(id,mode),null,id);
  }
});
test('heat transfer readout follows the selected mechanism and its model power', () => {
  const d = SIMULATIONS.heat;
  for (const [mode, id] of ['conduction-0', 'convection-1', 'radiation-2'].entries()) {
    const { state, params } = d.create({ ...d.defaults, mode });
    const [power] = studyReadings('heat', state, params, 'alevel', d);
    assert.equal(power.id, id);
    assert.equal(power.value, d.sample(state, params).power);
  }
});
