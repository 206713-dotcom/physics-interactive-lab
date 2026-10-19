import * as P from './physics.js';
import { LESSONS } from './content.js';
import { drawSpring, drawOrbit } from './canvas.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const icons = { play: '<path d="m6 3 9 6-9 6z"/>', pause: '<path d="M6 4v10M12 4v10"/>', reset: '<path d="M3 8a6 6 0 1 1 1 6M3 3v5h5"/>', arrow: '<path d="M3 9h12m-5-5 5 5-5 5"/>', download: '<path d="M9 2v10m-4-4 4 4 4-4M3 13v3h12v-3"/>', share: '<path d="M6 9h9m-4-4 4 4-4 4M8 3H3v12h5"/>' };
const icon = name => `<svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
let lab = null, charts = [], lastFrame = 0, toastTimer;
const colors = ['#078c92', '#5777d7', '#bb7725'];
const fmt = (n, digits = 2) => !Number.isFinite(n) ? '—' : (Math.abs(n) >= 1e7 || Math.abs(n) > 0 && Math.abs(n) < .001) ? n.toExponential(2) : n.toLocaleString('en', { minimumFractionDigits: digits, maximumFractionDigits: digits });

function springArt(dark = false) {
  return `<svg viewBox="0 0 560 210" aria-hidden="true"><defs><pattern id="spring-grid" width="25" height="25" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="${dark ? '#33566d' : '#c9d8df'}"/></pattern></defs><rect width="560" height="210" fill="url(#spring-grid)"/><path d="M90 70v75m-7-75-12 12m12 1-12 12m12 1-12 12m12 1-12 12m12 1-12 12m19-27h25l8-15 13 30 13-30 13 30 13-30 13 30 13-30 13 30 13-30 13 30 13-30 13 30 13-30 8 15h26" fill="none" stroke="${dark ? '#67dfdc' : '#138d96'}" stroke-width="2"/><path d="M82 145h381" stroke="${dark ? '#648797' : '#bdcfd8'}"/><path d="M321 48v130" stroke="${dark ? '#648797' : '#b4cbd7'}" stroke-dasharray="3 5"/><rect x="303" y="88" width="56" height="56" rx="7" fill="${dark ? '#65ded5' : '#147e8c'}"/><text x="331" y="122" fill="${dark ? '#12364a' : '#fff'}" text-anchor="middle" font-size="15" font-family="Georgia,serif">m</text><path d="M370 111h62m-9-5 9 5-9 5" fill="none" stroke="${dark ? '#ffd498' : '#bf8438'}" stroke-width="1.5"/><text x="250" y="184" fill="${dark ? '#aec7d7' : '#5b7789'}" font-size="13" font-family="Georgia,serif">F = −kx</text></svg>`;
}
function orbitArt(hero = false) {
  return `<svg viewBox="0 0 500 340" aria-hidden="true"><defs><radialGradient id="planet-${hero}"><stop stop-color="#7dc6da" offset="0"/><stop stop-color="#397d9f" offset=".65"/><stop stop-color="#204a6b" offset="1"/></radialGradient><pattern id="orbit-grid-${hero}" width="25" height="25" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="${hero ? '#3c617a' : '#335671'}"/></pattern></defs><rect width="500" height="340" fill="${hero ? 'transparent' : '#122d44'}"/><rect width="500" height="340" fill="url(#orbit-grid-${hero})"/><g fill="none" stroke="#a2c4d41e"><circle cx="250" cy="170" r="75"/><circle cx="250" cy="170" r="124"/><circle cx="250" cy="170" r="162"/><path d="M30 170h440M250 15v310"/></g><ellipse cx="258" cy="170" rx="172" ry="100" transform="rotate(-28 258 170)" fill="none" stroke="#69dcd9" stroke-width="1.3"/><ellipse cx="258" cy="170" rx="172" ry="100" transform="rotate(-28 258 170)" fill="none" stroke="#9bf5e6" stroke-width="3" stroke-dasharray="180 800"/><circle cx="250" cy="170" r="40" fill="url(#planet-${hero})"/><g fill="none" stroke="#a4e0df45"><ellipse cx="250" cy="163" rx="38" ry="9" transform="rotate(-20 250 163)"/><ellipse cx="250" cy="180" rx="38" ry="9" transform="rotate(-20 250 180)"/></g><path d="m250 170 141-92" stroke="#83adc550" stroke-dasharray="3 5"/><circle cx="391" cy="78" r="7" fill="#b5ffe9"/><circle cx="391" cy="78" r="14" fill="none" stroke="#9cf1da30"/><path d="m399 78 28 38m-1-10 1 10-10-2" fill="none" stroke="#ffd494" stroke-width="1.5"/><g fill="#a6c8d9" font-family="Consolas,monospace" font-size="10"><text x="320" y="145">r</text><text x="433" y="120" fill="#ffd494">v</text><text x="246" y="174" fill="#e1faff">M</text></g>${hero ? '<g fill="#a5dedd" font-family="Georgia,serif" font-size="21"><text x="39" y="56">F = GMm/r²</text><text x="329" y="300">a ∝ 1/r²</text></g>' : ''}</svg>`;
}

function home() {
  $('#main').innerHTML = `<section class="hero"><div><div class="eyebrow"><span class="status-dot"></span> A LABORATORY FOR YOUR CURIOSITY</div><h1>Don’t just learn physics.<br><em>Make it move.</em></h1><p>Turn equations into experiments. Explore the motion, change the variables, and see the physics unfold.</p><a class="button" href="#simulations">Explore the simulations ${icon('arrow')}</a></div><div class="hero-art">${orbitArt(true)}<span class="hero-art-label">NEWTONIAN MECHANICS / SCHEMATIC</span></div><div class="hero-bottom"><span><span class="status-dot"></span> Calculated in your browser</span><span>↗ Live graphs & measurements</span><span>◎ Built for IGCSE & A Level</span></div></section>
  <div class="page-width"><section id="simulations"><div class="section-heading"><div><div class="eyebrow">CHOOSE YOUR EXPERIMENT</div><h2>Big ideas. Hands-on discovery.</h2></div><p>Two experiments. Endless “what if?” moments.</p></div><div class="simulation-grid"><a class="simulation-card" href="#/spring"><div class="card-art">${springArt()}<span class="art-label">01 / THE MASS–SPRING SYSTEM</span></div><div class="card-body"><div class="card-meta">MECHANICS <span class="pill">IGCSE → A LEVEL</span></div><h3>Simple harmonic motion</h3><p>Find the rhythm behind a spring. Explore oscillations, energy transfer and the effect of damping.</p><div class="card-bottom"><span>4 adjustable parameters · Live graphs</span><span class="text-link">Enter the lab ${icon('arrow')}</span></div></div></a><a class="simulation-card" href="#/gravity"><div class="card-art">${orbitArt()}<span class="art-label" style="color:#a8c8d8">02 / THE TWO-BODY SYSTEM</span></div><div class="card-body"><div class="card-meta">SPACE & GRAVITATION <span class="pill">A LEVEL</span></div><h3>Newton’s law of gravitation</h3><p>Launch a satellite into the unknown. Discover circular orbits, elliptical paths and the escape threshold.</p><div class="card-bottom"><span>3 launch presets · Orbital trails</span><span class="text-link">Enter the lab ${icon('arrow')}</span></div></div></a></div></section><section class="method-band"><div><h3>Think like a physicist.</h3><p>A little curiosity goes a long way.</p></div><div class="method-item"><span class="number">01</span><div><strong>Make a prediction</strong><p>Start with a question.<br>What do you expect to change?</p></div></div><div class="method-item"><span class="number">02</span><div><strong>Run the experiment</strong><p>Change one variable.<br>Watch the evidence unfold.</p></div></div><div class="method-item"><span class="number">03</span><div><strong>Connect the ideas</strong><p>Read the graphs.<br>Explain it with the physics.</p></div></div></section><p class="home-note"><strong>Small models. Clear assumptions.</strong> Explore idealised systems with numerical integration, SI units, worked answers and documented accuracy tests. This independent prototype is a proposed contribution to FocusPhysics.</p></div>`;
}

const springControls = [
  { key: 'mass', label: 'Mass', unit: 'kg', min: .2, max: 5, step: .1, hint: 'More mass → a longer natural period.' },
  { key: 'k', label: 'Spring constant', unit: 'N/m', min: 1, max: 100, step: 1, hint: 'A stiffer spring → faster oscillation.' },
  { key: 'displacement', label: 'Initial displacement', unit: 'm', min: -.8, max: .8, step: .01, hint: 'Sets the starting position; released from rest.' },
  { key: 'damping', label: 'Damping coefficient', unit: 'kg/s', min: 0, max: 10, step: .1, hint: 'Damping removes mechanical energy.' }
];
const orbitControls = [
  { key: 'centralMass', label: 'Central mass', unit: '10²⁴ kg', min: 1, max: 20, step: .001, factor: 1e24, hint: 'More mass → stronger gravitational attraction.' },
  { key: 'bodyMass', label: 'Satellite mass', unit: 'kg', min: 2, max: 23, step: .1, log: true, hint: 'Logarithmic slider: 10² to 10²³ kg.' },
  { key: 'distance', label: 'Initial separation', unit: '10³ km', min: 8, max: 40, step: .1, factor: 1e6, hint: 'Centre to centre. Twice as far → ¼ the force.' },
  { key: 'velocity', label: 'Initial tangential speed', unit: 'km/s', min: 0, max: 25, step: .01, factor: 1000, hint: 'Launch direction is perpendicular to separation.' }
];
function controlMarkup(d, p) {
  const n = p[d.key] / (d.factor || 1), value = d.log ? Math.log10(n) : n;
  return `<div class="control"><label class="control-label" for="${d.key}-slider">${d.label}<span class="value-input"><input id="${d.key}-number" type="number" aria-label="${d.label} in ${d.unit}" min="${d.log ? 100 : d.min}" max="${d.log ? 1e23 : d.max}" step="any" value="${d.log ? n.toExponential(2) : Number(n.toFixed(4))}"><span>${d.unit}</span></span></label><input id="${d.key}-slider" type="range" min="${d.min}" max="${d.max}" step="${d.step}" value="${value}" aria-label="${d.label}"><div class="slider-ends"><span>${d.log ? '10² kg' : d.min}</span><span>${d.log ? '10²³ kg' : d.max}</span></div><p class="control-hint">${d.hint}</p></div>`;
}
function labPage(type, query) {
  const spring = type === 'spring', lesson = LESSONS[type], defaults = spring ? P.SPRING_DEFAULTS : P.ORBIT_DEFAULTS;
  let params = { ...defaults }, invalid = false;
  if (!spring) params.velocity = P.circularSpeed(params);
  for (const key of Object.keys(params)) if (query.has(key)) params[key] = Number(query.get(key));
  try { (spring ? P.createSpring : P.createOrbit)(params); } catch { params = { ...defaults }; if (!spring) params.velocity = P.circularSpeed(params); invalid = true; }
  lab = { type, ... (spring ? P.createSpring(params) : P.createOrbit(params)), running: !matchMedia('(prefers-reduced-motion: reduce)').matches,
    speed: 1, accumulator: 0, history: [], trail: [], showTrail: true, vectors: true, graph: 'motion', nextSample: 0, lastUI: -1, lessonTab: 'learn' };
  $('#main').innerHTML = `<div class="page-width"><div class="breadcrumb"><a href="#/">The laboratory</a><span>/</span><span>${spring ? 'Oscillations' : 'Gravitation'}</span></div><div class="lab-title-row"><div><div class="eyebrow">${lesson.eyebrow}</div><h1>${lesson.title}</h1><p>${lesson.description}</p></div><div class="toolbar-buttons"><button class="small-button" id="share">${icon('share')} Share setup</button><button class="small-button" id="export">${icon('download')} Export data</button></div></div><div class="lab-grid"><aside class="panel controls" aria-label="Simulation parameters"><h2 class="panel-label">Your experiment</h2>${(spring ? springControls : orbitControls).map(d => controlMarkup(d, params)).join('')}<p class="control-error" id="control-error" role="alert"></p><div class="control-divider"></div><div class="preset-block"><h3 class="panel-label">${spring ? 'Quick setups' : 'Launch presets'}</h3><div class="preset-row">${(spring ? ['Ideal', 'Damped', 'Critical'] : ['Circular', 'Elliptical', 'Escape']).map(v => `<button class="preset-button" data-preset="${v.toLowerCase()}">${v}</button>`).join('')}</div></div><p class="control-footnote">Changing a parameter starts a new run.<br>${spring ? 'Horizontal spring · initial velocity = 0' : 'Two-body model · spherical central body'}</p></aside><div class="workspace"><section class="stage" aria-label="Animated simulation"><div class="stage-top"><span class="running-status"><span class="status-dot"></span><span id="run-status">RUNNING</span></span><span id="time-readout">t = 0.00 s</span></div><canvas id="simulation" role="img" aria-label="${spring ? 'Animated horizontal mass and spring, with a displacement ruler' : 'Calculated satellite orbit with trail and velocity vector'}"></canvas><div class="stage-caption" id="stage-caption"></div><div class="transport"><button id="play" class="play-button">${icon('pause')} Pause</button><button id="reset" class="reset-button">${icon('reset')} Reset</button><label class="speed-select">Speed <select id="speed" aria-label="Simulation speed"><option value=".25">0.25×</option><option value=".5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select></label></div></section><div class="live-metrics" id="metrics"></div><section class="panel graph-panel" aria-label="Live graphs"><div class="graph-header"><h2>Live measurements</h2><div class="segmented" aria-label="Graph selection">${(spring ? [['motion','Motion'],['energy','Energy']] : [['speed','Speed'],['distance','Distance'],['energy','Energy']]).map(([key, value], i) => `<button data-graph="${key}" aria-pressed="${i === 0}" class="${i === 0 ? 'active' : ''}">${value}</button>`).join('')}</div></div><div class="stage-options" style="color:var(--muted)"><label><input type="checkbox" id="vectors" checked> Velocity vector</label>${spring ? '' : '<label><input type="checkbox" id="trail" checked> Orbital trail</label>'}</div><div id="plots"></div><div id="energy-summary" class="energy-summary"></div><p class="graph-note" id="graph-note"></p></section></div></div><section class="lesson-area"><div class="lesson-tabs" role="tablist" aria-label="Learning resources">${[['learn','Understand the physics'],['experiments','Guided experiments'],['questions','Test your understanding'],['model','Equations & model']].map(([key, label], i) => `<button role="tab" id="tab-${key}" aria-controls="lesson-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-lesson="${key}">${label}</button>`).join('')}</div><div class="lesson-content" id="lesson-panel" role="tabpanel" aria-labelledby="tab-learn" tabindex="0"></div></section></div>`;
  if (!spring) lab.graph = 'speed';
  bindControls(); createCharts(); showLesson('learn'); sample(); updateReadouts(); syncPlay();
  if (invalid) toast('The shared setup contained invalid values. Safe defaults have been restored.');
}

function bindControls() {
  const descriptors = lab.type === 'spring' ? springControls : orbitControls;
  for (const d of descriptors) {
    const range = $(`#${d.key}-slider`), number = $(`#${d.key}-number`);
    const change = (raw, slider) => {
      const value = d.log ? (slider ? 10 ** raw : raw) : raw * (d.factor || 1);
      const params = { ...lab.params, [d.key]: value };
      try { reset(params); $('#control-error').textContent = ''; syncInputs(); }
      catch (error) { $('#control-error').textContent = error.message; syncInputs(); }
    };
    range.addEventListener('input', () => change(Number(range.value), true));
    const commitNumber = () => {
      const raw = number.value === '' ? NaN : Number(number.value);
      if (raw * (d.factor || 1) !== lab.params[d.key]) change(raw, false);
    };
    number.addEventListener('change', commitNumber);
    number.addEventListener('blur', commitNumber);
    number.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); commitNumber(); } });
  }
  $('#play').onclick = () => { if (lab.state.collided || lab.viewLimit) reset(); lab.running = !lab.running; syncPlay(); };
  $('#reset').onclick = () => { reset(); toast('Run reset to its initial conditions.'); };
  $('#speed').onchange = e => { lab.speed = Number(e.target.value); };
  $('#vectors').onchange = e => { lab.vectors = e.target.checked; };
  if ($('#trail')) $('#trail').onchange = e => { lab.showTrail = e.target.checked; };
  $$('[data-preset]').forEach(b => b.onclick = () => {
    const preset = b.dataset.preset;
    if (lab.type === 'spring') reset({ ...P.SPRING_DEFAULTS, damping: preset === 'ideal' ? 0 : preset === 'damped' ? 1 : 2 * Math.sqrt(20) });
    else {
      const params = { ...P.ORBIT_DEFAULTS }, factor = { circular: 1, elliptical: .8, escape: 1.5 }[preset];
      params.velocity = factor * P.circularSpeed(params); reset(params);
    }
    lab.running = true; syncInputs(); syncPlay();
    $$('[data-preset]').forEach(btn => btn.setAttribute('aria-pressed', String(btn === b)));
  });
  $$('[data-graph]').forEach(b => b.onclick = () => {
    lab.graph = b.dataset.graph; $$('[data-graph]').forEach(btn => { btn.classList.toggle('active', btn === b); btn.setAttribute('aria-pressed', String(btn === b)); }); createCharts(); updateCharts();
  });
  $$('[data-lesson]').forEach((b, i, buttons) => {
    b.onclick = () => showLesson(b.dataset.lesson);
    b.onkeydown = e => {
      let target;
      if (e.key === 'ArrowRight') target = buttons[(i + 1) % buttons.length];
      if (e.key === 'ArrowLeft') target = buttons[(i - 1 + buttons.length) % buttons.length];
      if (e.key === 'Home') target = buttons[0]; if (e.key === 'End') target = buttons.at(-1);
      if (target) { e.preventDefault(); target.focus(); target.click(); }
    };
  });
  $('#export').onclick = exportData;
  $('#share').onclick = async () => {
    const query = new URLSearchParams(Object.entries(lab.params).map(([k,v]) => [k,String(v)]));
    const url = `${location.href.split('#')[0]}#/${lab.type}?${query}`;
    try { await navigator.clipboard.writeText(url); toast('Setup link copied. It opens a new run with these parameters.'); }
    catch { window.prompt('Copy this setup link:', url); }
  };
}
function syncInputs() {
  for (const d of lab.type === 'spring' ? springControls : orbitControls) {
    const value = lab.params[d.key] / (d.factor || 1);
    $(`#${d.key}-number`).value = d.log ? value.toExponential(2) : Number(value.toFixed(4));
    $(`#${d.key}-slider`).value = d.log ? Math.log10(value) : value;
  }
}
function reset(params = lab.params) {
  const model = lab.type === 'spring' ? P.createSpring(params) : P.createOrbit(params);
  Object.assign(lab, model, { accumulator: 0, history: [], trail: [], nextSample: 0, viewLimit: false, lastUI: -1 });
  lab.initialEnergy = lab.type === 'spring' ? P.springEnergy(lab.state, lab.params).total : P.orbitEnergy(lab.state, lab.params).total;
  $$('[data-preset]').forEach(b => b.setAttribute('aria-pressed', 'false'));
  sample(); updateCharts(); updateReadouts(); syncPlay();
}
function syncPlay() {
  if (!lab) return;
  $('#play').innerHTML = icon(lab.running ? 'pause' : 'play') + (lab.running ? ' Pause' : lab.state.collided || lab.viewLimit ? ' Replay' : ' Resume');
  $('#run-status').textContent = lab.state.collided ? 'SURFACE IMPACT · STOPPED' : lab.viewLimit ? 'VIEW LIMIT · PAUSED' : lab.running ? 'RUNNING' : 'PAUSED';
}

function sample() {
  const s = lab.state, p = lab.params;
  if (lab.type === 'spring') { const e = P.springEnergy(s,p); lab.history.push({ t:s.t,x:s.x,v:s.v,a:P.springAcceleration(s,p),...e }); }
  else { const e = P.orbitEnergy(s,p); lab.history.push({ t:s.t, x:s.x,y:s.y,vx:s.vx,vy:s.vy,speed:Math.hypot(s.vx,s.vy),distance:Math.hypot(s.x,s.y),force:P.gravityForce(p.centralMass,p.bodyMass,Math.hypot(s.x,s.y)),...e }); }
  if (lab.history.length > 600) lab.history.shift();
  if (lab.type === 'gravity') { lab.trail.push({x:s.x,y:s.y}); if(lab.trail.length > 2000) lab.trail.shift(); }
}
function createCharts() {
  charts.forEach(c => c.chart.destroy()); charts = [];
  if (!window.Chart) { $('#plots').innerHTML = '<p>The graph library could not load. Reload this page to restore graphs.</p>'; return; }
  const spring = lab.type === 'spring', energy = lab.graph === 'energy';
  const definitions = energy ? [{ label:'Mechanical energy / J', keys:['kinetic','potential','total'], names:['Kinetic','Potential','Total'], factor:1 }]
    : spring ? [{ label:'Displacement / m',keys:['x'],factor:1 },{ label:'Velocity / m s⁻¹',keys:['v'],factor:1 },{ label:'Acceleration / m s⁻²',keys:['a'],factor:1 }]
    : [{ label: lab.graph === 'speed' ? 'Relative speed / km s⁻¹' : 'Centre-to-centre distance / km', keys:[lab.graph],factor:.001 }];
  $('#plots').innerHTML = definitions.map((d,i) => `<p class="plot-label">${d.label}</p><div class="plot-wrap ${definitions.length === 1 ? 'tall' : ''}"><canvas id="plot-${i}" role="img" aria-label="Live ${d.label} against simulated time"></canvas></div>`).join('');
  definitions.forEach((d,i) => {
    const chart = new Chart($(`#plot-${i}`),{type:'line',data:{datasets:d.keys.map((key,j) => ({label:d.names?.[j] || d.label,data:[],borderColor:colors[(definitions.length > 1 ? i : j)%3],borderWidth:1.7,pointRadius:0,pointHitRadius:8,tension:0,parsing:false}))},options:{ responsive:true,maintainAspectRatio:false,animation:false,normalized:true,interaction:{mode:'nearest',axis:'x',intersect:false},plugins:{legend:{display:energy,labels:{boxWidth:9,boxHeight:3,font:{size:10},color:'#536a7b'}},tooltip:{callbacks:{title:items=>`t = ${fmt(items[0].parsed.x)} ${spring ? 's' : 'h'}`}}},scales:{x:{type:'linear',title:{display:true,text:`Time / ${spring ? 's' : 'h'}`,font:{size:9},color:'#68808e'},ticks:{maxTicksLimit:6,font:{size:9},color:'#68808e'},grid:{display:false},border:{color:'#dce6eb'}},y:{ticks:{maxTicksLimit:4,font:{size:9},color:'#68808e'},grid:{color:'#edf2f5'},border:{display:false}}}}});
    // Include zero so round-off in a circular orbit is never magnified into a
    // visually large change in speed or separation. Keep large SI energies legible.
    chart.options.scales.y.beginAtZero = true;
    chart.options.scales.y.ticks.callback = value => Math.abs(value) >= 1e6 ? Number(value).toExponential(1) : value;
    chart.update('none');
    charts.push({ chart, ...d });
  });
}
function updateCharts() {
  const spring = lab.type === 'spring', latest = lab.state.t / (spring ? 1 : 3600), span = spring ? 12 : 24;
  for (const c of charts) {
    c.keys.forEach((key,i) => { c.chart.data.datasets[i].data = lab.history.filter(row => row.t / (spring ? 1 : 3600) >= Math.max(0, latest - span)).map(row => ({ x:row.t / (spring ? 1 : 3600), y:row[key] * c.factor })); });
    c.chart.options.scales.x.min = Math.max(0, latest - span); c.chart.options.scales.x.max = Math.max(spring ? 2 : 1, latest);
    c.chart.update('none');
  }
}
function metric(label,value,unit,note) { return `<div class="metric"><div class="metric-label">${label}</div><div class="metric-value">${value}<span>${unit}</span></div><div class="metric-note">${note}</div></div>`; }
function updateReadouts() {
  const spring = lab.type === 'spring', s = lab.state, p = lab.params, e = spring ? P.springEnergy(s,p) : P.orbitEnergy(s,p);
  if (lab.initialEnergy === undefined) lab.initialEnergy = e.total;
  $('#time-readout').textContent = `t = ${fmt(s.t / (spring ? 1 : 3600))} ${spring ? 's' : 'h'}`;
  if (spring) {
    const info = P.springInfo(p), regime = info.zeta < 1e-10 ? 'Undamped' : Math.abs(info.zeta - 1) < .001 ? 'Critically damped' : info.zeta < 1 ? 'Underdamped' : 'Overdamped';
    $('#metrics').innerHTML = metric('Natural period T₀',fmt(info.period),'s','Undamped reference') + metric('Natural frequency f₀',fmt(info.frequency),'Hz','Cycles per second, undamped') + metric('Angular frequency ω₀',fmt(info.omega),'rad/s','√(k/m), undamped');
    $('#stage-caption').textContent = `${regime} · ${info.dampedOmega > 0 && p.damping > 0 ? `Damped period: ${fmt(info.dampedPeriod)} s` : 'Displacement ruler in metres'} · Block and spring illustrative`;
  } else {
    const info = P.orbitInfo(s,p);
    $('#metrics').innerHTML = metric('Relative orbital speed',fmt(info.speed/1000),'km/s',info.kind) + metric('Separation r',fmt(info.r/1000,0),'km','Measured between centres') + metric('Total mechanical energy',fmt(e.total),'J','Centre-of-mass frame');
    $('#stage-caption').textContent = `${info.kind} · 1× = 1 hour / real second · Auto zoom · Satellite & velocity arrow enlarged`;
  }
  const entries = spring ? [['Kinetic energy',e.kinetic,'J'],['Elastic potential',e.potential,'J'],['Total mechanical',e.total,'J']] : [['Gravitational force',P.gravityForce(p.centralMass,p.bodyMass,Math.hypot(s.x,s.y)),'N'],['Kinetic energy',e.kinetic,'J'],['Potential energy',e.potential,'J']];
  $('#energy-summary').innerHTML = entries.map(([label,value,unit],i) => `<div><small><span class="color-dot" style="background:${colors[i]}"></span>${label}</small>${fmt(value)} ${unit}</div>`).join('');
  const drift = Math.abs(lab.initialEnergy) > 1e-15 ? 100*(e.total-lab.initialEnergy)/Math.abs(lab.initialEnergy) : null;
  $('#graph-note').textContent = `Calculated samples only · ${spring ? '12 s' : '24 h'} rolling view · ${spring && p.damping > 0 ? 'Mechanical energy decreases through damping.' : drift === null ? 'Initial total energy is zero; percentage drift is undefined.' : `Energy change from launch: ${drift.toExponential(2)}%.`} Export includes up to 600 most recent samples in SI units.`;
}

function showLesson(tab) {
  lab.lessonTab = tab; const l = LESSONS[lab.type], panel = $('#lesson-panel');
  $$('[data-lesson]').forEach(b => { const selected = b.dataset.lesson === tab; b.setAttribute('aria-selected',String(selected)); b.tabIndex = selected ? 0 : -1; });
  panel.setAttribute('aria-labelledby',`tab-${tab}`);
  if (tab === 'learn') panel.innerHTML = `<div class="learn-grid"><aside class="objectives"><h3>Your learning objectives</h3><ul>${l.objectives.map(o=>`<li>${o}</li>`).join('')}</ul></aside><div><h2>${l.description}</h2><p>${l.intro}</p><div class="principles">${l.principles.map(([title,text])=>`<div><h3>${title}</h3><p>${text}</p></div>`).join('')}</div></div></div><div class="application"><h3>Physics beyond the screen</h3><p>${l.applications}</p></div>`;
  if (tab === 'experiments') {
    panel.innerHTML = `<h2>Predict. Experiment. Explain.</h2><p>Change one variable at a time. Load a setup, pause when needed, and use the graphs to support your explanation.</p><div class="experiment-grid">${l.experiments.map((e,i)=>`<article class="experiment"><div class="eyebrow">INVESTIGATION 0${i+1}</div><h3>${e.title}</h3><p>${e.text}</p><p class="prediction">${e.predict}</p><details><summary>What should I observe?</summary><p>${e.result}</p></details><button class="small-button" data-experiment="${i}">Load this setup ${icon('arrow')}</button></article>`).join('')}</div>`;
    $$('[data-experiment]').forEach(b=>b.onclick=()=>{
      const e=l.experiments[Number(b.dataset.experiment)];
      if(typeof e.preset==='object') { reset(e.preset); syncInputs(); lab.running=false; syncPlay(); }
      else { $(`[data-preset="${e.preset}"]`).click(); lab.running=false; syncPlay(); }
      toast('Investigation setup loaded and paused. Resume when you are ready.'); $('.stage').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
    });
  }
  if (tab === 'questions') panel.innerHTML = `<h2>Test your understanding.</h2><p>Try each question before revealing the worked explanation.</p>${l.questions.map(([q,a],i)=>`<details class="question"><summary>${String(i+1).padStart(2,'0')} &nbsp; ${q}</summary><p>${a}</p></details>`).join('')}`;
  if (tab === 'model') panel.innerHTML = `<h2>The mathematics behind the motion.</h2><div class="equation-grid">${l.equations.map(([title,formula,note])=>`<article class="equation"><h3>${title}</h3><p class="formula">${formula}</p><p>${note}</p></article>`).join('')}</div><aside class="model-note"><h3>Model assumptions & numerical method</h3><p>${l.model}</p><a href="${l.source[1]}" target="_blank" rel="noopener">${l.source[0]} ↗</a> · <a href="https://github.com/206713-dotcom/physics-interactive-lab#physics-and-numerical-methods" target="_blank" rel="noopener">Accuracy tests & source ↗</a></aside>`;
}
function exportData() {
  const spring=lab.type==='spring', keys=spring?['t','x','v','a','kinetic','potential','total']:['t','x','y','vx','vy','speed','distance','force','kinetic','potential','total'];
  const headers=spring?['time_s','displacement_m','velocity_m_per_s','acceleration_m_per_s2','kinetic_J','potential_J','total_J']:['time_s','relative_x_m','relative_y_m','relative_vx_m_per_s','relative_vy_m_per_s','relative_speed_m_per_s','separation_m','force_N','kinetic_COM_J','potential_J','total_COM_J'];
  const csv=[`# ${lab.type} simulation; SI units; parameters=${JSON.stringify(lab.params)}`,headers.join(','),...lab.history.map(row=>keys.map(k=>row[k]).join(','))].join('\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),a=document.createElement('a'); a.href=url;a.download=`physics-lab-${lab.type}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Calculated measurements exported as CSV.');
}
function toast(message) { $('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4000); }
function route() {
  if (location.hash === '#simulations') {
    if (!$('#simulations')) { charts.forEach(c=>c.chart.destroy()); charts=[]; lab=null; home(); }
    $('#simulations').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;
  }
  charts.forEach(c=>c.chart.destroy());charts=[];lab=null;
  const [path,query='']=location.hash.slice(1).split('?'),type=path==='/spring'?'spring':path==='/gravity'?'gravity':'home';
  $$('[data-nav]').forEach(a=>{a.classList.toggle('active',a.dataset.nav===type);if(a.dataset.nav===type)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  document.title=type==='home'?'Physics Interactive Lab · Make physics move':`${LESSONS[type].title} · Physics Interactive Lab`;
  type==='home'?home():labPage(type,new URLSearchParams(query));
  window.scrollTo(0,0);lastFrame=0;
}
function frame(now) {
  const dt=lastFrame?Math.min((now-lastFrame)/1000,.1):0;lastFrame=now;
  if (lab) {
    const spring=lab.type==='spring',h=spring?1/240:2;
    if(lab.running&&!document.hidden) {
      lab.accumulator+=dt*lab.speed*(spring?1:3600);
      let iterations=0;
      while(lab.accumulator>=h&&iterations++<1000) {
        lab.state=spring?P.stepSpring(lab.state,lab.params,h):P.stepOrbit(lab.state,lab.params,h);lab.accumulator-=h;
        if(lab.state.t>=lab.nextSample) {sample();lab.nextSample=lab.state.t+(spring?1/30:120);}
        if(!spring&&(lab.state.collided||Math.hypot(lab.state.x,lab.state.y)>=100*lab.params.distance)) {
          lab.running=false;lab.viewLimit=!lab.state.collided;sample();syncPlay();toast(lab.state.collided?'Surface impact: the run has stopped. Try a larger launch speed.':'Escape trajectory reached the view limit. Replay or choose a different launch.');break;
        }
      }
    }
    if(!spring) drawOrbit($('#simulation'),lab);else drawSpring($('#simulation'),lab);
    if(now-lab.lastUI>110) {updateReadouts();updateCharts();lab.lastUI=now;}
  }
  requestAnimationFrame(frame);
}
window.addEventListener('hashchange',route);
$('.skip-link').addEventListener('click',e=>{e.preventDefault();$('#main').focus();$('#main').scrollIntoView();});
document.addEventListener('visibilitychange',()=>{lastFrame=0;});
route();requestAnimationFrame(frame);
