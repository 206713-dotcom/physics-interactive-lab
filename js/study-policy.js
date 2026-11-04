import { buoyancySample } from './buoyancy-physics.js';
/** Course presentation policy, independent of the physical solvers.
 * IGCSE presents selected 0625 Core / Supplement outcomes. Model readings can
 * come from a more detailed solver without teaching its advanced derivation. */
import { getProfile } from './learning-paths.js';
import { calculationSheet } from './calculations.js';

// Explicit lists avoid exposing an advanced formula just because it is the
// first result in a model's full calculation sheet.
const WORKING = {
  measurement: ['period-2'], moments: ['left-0','right-1'],
  buoyancy: ['mass-3','pressure-10'], energy: ['potential-0','input-1'],
  hooke: ['extension-0'], hydraulics: ['pressure-1','outputForce-0'],
  calorimetry: ['energy-0'], heat: ['energy-3'], cooling: ['released-3'],
  wavefronts: ['wavelength-0'], mirror: ['incident-0','reflected-1'],
  dispersion: ['refraction-1','speed-2'], spectrum: ['frequency-1'],
  sound: ['echo-2','wavelength-1'], waves: ['frequency'],
  refraction: ['angle','critical'], dc: ['current-1','resistance-0'],
  filament: ['current-2'], magnetism: ['current-1'],
  transformer: ['vs-0','loss-3'], atom: ['massNumber-0','daughterZ-2'],
  solarsystem: ['lightTime-2'], universe: ['speed-0'],
  collisions: ['momentum'], vectors: ['resultant-2'],
  induction: ['loadCurrent-4'], 'magnet-coil': ['loadCurrent-0'],
};
const GRAPHS = {
  measurement: ['period'], motion: ['position','velocity','acceleration'],
  vectors: ['reading-2'], moments: ['rotation','reading-0','reading-1'],
  buoyancy: ['reading-0'], energy: ['height'], hooke: ['loadcurve'],
  hydraulics: ['travel'], gases: ['reading-0','reading-1'],
  expansion: ['reading-0'], calorimetry: ['heating'], heat: [],
  cooling: ['temperature'], wavefronts: [], mirror: [], lenses: [],
  dispersion: [], spectrum: [], sound: ['pressure'], waves: ['profile','probe'],
  refraction: ['angles'], dc: ['reading-1'], sensors: ['reading-1'],
  devices: ['reading-0'], rectifier: ['waveforms'], filament: ['current'],
  magnetism: [], charged: ['trajectory'], radiation: ['alpha','beta','gamma'],
  induction: ['emf','load-current'], motor: ['rpm'], transformer: ['reading-0'], atom: [],
  'magnet-coil': ['load-current','emf','lamp-power'],
  radioactivity: ['decay'], earthmoon: [], solarsystem: [], stars: [],
  universe: ['reading-0'], pendulum: ['angle'], collisions: ['momentum'], fields: [],
};
const CONTROLS = {
  measurement: ['count','period'], motion: ['mode','mass','force','drag'],
  expansion: ['temperature','alpha'], cooling: ['initial','ambient','conductance'],
  calorimetry: ['mass','power','initial'], induction: ['frequency','field','circuit'], motor: ['field','current','load'],
  universe: ['distance'], atom: ['protons','neutrons','decay'],
  collisions: ['m1','m2','u1','restitution'],
};
const SETUP = {
  motion: { drag: 0 }, calorimetry: { mode: 0 },
  pendulum: { angle: 10, g: 9.81, damping: 0, mass: 1 },
  collisions: { restitution: 1, u2: 0 }, gases: { amount: 1 },
};
const SUPPLEMENT = new Set([
  'motion','vectors','buoyancy','energy','hooke','hydraulics','calorimetry',
  'cooling','dispersion','refraction','dc','sensors','transformer','universe','collisions',
  'gases','lenses','stars','solarsystem','charged','radiation','induction','motor','magnet-coil',
]);
export const IGCSE_AREAS = [
  'Motion, forces and energy','Thermal physics','Waves',
  'Electricity and magnetism','Nuclear physics','Space physics',
];
/** Full-model names can mention options deliberately absent from IGCSE. */
export function studyTitle(id, mode, fallback) {
  if (mode !== 'igcse') return fallback;
  return ({
    hooke:'Springs: load & extension', measurement:'Timing repeated oscillations',
    gases:'Particles & gas pressure', dc:'Series & parallel circuits',
    charged:'Magnetic deflection', radiation:'Alpha, beta & gamma',
    atom:'Atoms & nuclear equations', stars:'How stars change',
    universe:'Redshift & the Universe', pendulum:'Pendulum timing',
    waves:'Speed, frequency & wavelength', fields:'Electric field patterns',
  })[id] || fallback;
}
export function igcseArea(id) {
  const first = getProfile(id,'igcse')?.refs[0];
  return IGCSE_AREAS[Number(first?.split('.')[0]) - 1] || '';
}
export function syllabusDepth(id) {
  return SUPPLEMENT.has(id) ? 'Includes Supplement' : 'Core focus';
}
export function visibleControlKeys(id, mode) {
  const p = getProfile(id, mode);
  return mode === 'igcse' ? CONTROLS[id] || p.controls : null;
}
export function studyGraphs(id, mode, definition) {
  return mode === 'igcse'
    ? definition.graphs.filter(g => (GRAPHS[id] || []).includes(g.id))
    : definition.graphs;
}
/** Parameters outside the current teaching scope have fixed, documented
 * starting values. A shared URL cannot turn those options back on. */
export function studyParams(id, mode, definition, requested = {}) {
  const base = { ...definition.defaults, ...getProfile(id,mode).setup,
    ...(mode === 'igcse' ? SETUP[id] : {}) };
  if (mode !== 'igcse') return { ...base, ...requested };
  for (const key of visibleControlKeys(id,mode)) {
    if (!(key in requested)) continue;
    const d = studyControl(id,mode,definition.controls.find(c => c.key === key));
    const value = requested[key];
    if (!Number.isFinite(value)) throw new Error('Enter a finite number.');
    if (d.options && !d.options.some(([v]) => Number(v) === value))
      throw new Error('Choose one of the available IGCSE settings.');
    const display = value / (d.factor || 1);
    if (!d.options && !d.log && (display < d.min || display > d.max))
      throw new Error(`${d.label} must be between ${d.min} and ${d.max} ${d.unit || ''}.`);
    const bounds = definition.limits?.[key];
    // Display-unit conversion can land one machine epsilon outside an SI
    // endpoint. Correct round-off only; genuinely invalid input still fails.
    base[key] = bounds && value < bounds[0] && bounds[0]-value <= Math.abs(bounds[0])*1e-12
      ? bounds[0] : bounds && value > bounds[1] && value-bounds[1] <= Math.abs(bounds[1])*1e-12
        ? bounds[1] : value;
  }
  return base;
}
/** Friendly names use the same internal SI parameter values as the full lab. */
export function studyControl(id, mode, control) {
  if (mode !== 'igcse') return control;
  const key = `${id}.${control.key}`;
  const overrides = {
    'waves.amplitude': {label:'Amplitude',hint:'Maximum displacement from the equilibrium line. The vertical scale is enlarged to make the motion clear.'},
    'dc.mode': {options:[[0,'Series resistors'],[1,'Parallel resistors'],[2,'Unloaded potential divider']],hint:'Compare one current path with two branches. The divider output is measured without a load.'},
    'motion.drag': { label: 'Air resistance', options: [[0,'Negligible'],[0.5,'Some resistance'],[2,'Greater resistance']], hint: 'Resistance grows with speed in this model. Compare the velocity–time graphs.' },
    'collisions.restitution': { label: 'Collision type', options: [[1,'Bounce elastically'],[0,'Stick together']], hint: 'Both conserve total momentum when external forces are negligible. Only the elastic case conserves kinetic energy.' },
    'expansion.alpha': { label: 'Bar material', options: [[0.000023,'Aluminium'],[0.000012,'Steel'],[0.000009,'Glass']], hint: 'Compare equal starting lengths and the same temperature rise. Expansion is exaggerated visually.' },
    'spectrum.exponent': { label: 'Electromagnetic band', options: [[2,'Radio'],[-2,'Microwaves'],[-4,'Infrared'],[-6.3,'Visible light'],[-8,'Ultraviolet'],[-10,'X-rays'],[-12,'Gamma rays']], hint: 'Representative wavelengths. Moving along the spectrum changes wavelength and frequency, not the vacuum speed.' },
    'fields.q1': { label: 'Charge A', options: [[-0.000002,'Negative'],[0,'Uncharged'],[0.000002,'Positive']], hint: 'Field arrows show the force direction on a positive test charge.' },
    'fields.q2': { label: 'Charge B', options: [[-0.000002,'Negative'],[0,'Uncharged'],[0.000002,'Positive']], hint: 'Compare like and unlike charges. Line spacing is qualitative.' },
    'transformer.vp': { label: 'Primary a.c. voltage', hint: 'Use the turns ratio to compare primary and secondary voltage.' },
    'hooke.k1': { label: 'Spring stiffness', hint: 'A stiffer spring extends less under the same load.' },
    'pendulum.angle': { label: 'Small release angle', min: 5, max: 20,
      hint: 'Start with a small swing. Count each complete return to the same side.' },
    'vectors.angle': { label: 'Vector directions', options: [[0,'Same direction'],[90,'At right angles'],[180,'Opposite directions']], hint: 'For perpendicular vectors use a scale diagram or Pythagoras. For parallel vectors add or subtract the magnitudes.' },
    'gases.state': { hint: 'Compare particle spacing and movement. Gas readings apply only to the gas state.' },
    'gases.temperature': { hint: 'Keep temperature fixed when comparing pressure and volume. 273 K is about 0 °C.' },
    'cooling.conductance': { label: 'Insulation', options: [[0.5,'Well insulated'],[2,'Moderately insulated'],[5,'Poorly insulated']], hint: 'Compare cooling curves with the same starting temperature.' },
    'charged.field': { label: 'Magnetic field direction', options: [[-0.002,'Into the screen'],[0,'Field off'],[0.002,'Out of the screen']], hint: 'Reverse the field and compare the direction of bending.' },
    'radiation.field': { label: 'Magnetic field direction', options: [[-0.1,'Into the screen'],[0,'Field off'],[0.1,'Out of the screen']], hint: 'Alpha and beta bend in opposite directions. Gamma is undeflected.' },
    'induction.field': { label: 'Magnet strength', options: [[0.1,'Weaker'],[0.2,'Medium'],[0.5,'Stronger']], hint: 'Compare the output at the same rotation speed.' },
    'motor.load': { label: 'Shaft load', options: [[1,'Standard'],[4,'Heavy']], hint: 'Compare speed at the same current and magnetic field.' },
    'universe.distance': { label: 'Galaxy distance', unit: 'million ly', factor: 1 / 3.26156,
      min: 3.26156, max: 978.468, hint: 'A light-year is a distance. More distant galaxies generally recede faster.' },
    'atom.decay': { label: 'Investigation', options: [[0,'Scattering'],[1,'Alpha decay'],[2,'Beta-minus decay'],[3,'Gamma emission']], hint: 'Track changes to proton number and mass number.' },
  };
  return { ...control, ...overrides[key] };
}
export function studySheet(id, state, params, mode, full = calculationSheet(id,state,params)) {
  if (mode !== 'igcse') return full;
  const keys = new Set(visibleControlKeys(id,mode)),
    codes = new Set(['mode','state','alpha','exponent','decay','seed','restitution','field','charge','planet','stage','conductance']),
    extras = {
      moments:['d₁⊥','d₂⊥'], buoyancy:['g'], cooling:['mass','specific'], universe:['hubble'],
      collisions:['m₁','m₂','u₁','u₂','v₁','v₂'],
      waves:['A','λ','c'], refraction:['n₁','n₂','i','c'],
    };
  for (const key of extras[id] || []) keys.add(key);
  const calculations = full.calculations.filter(c => (WORKING[id] || []).includes(c.id)),
    variables = calculations.length ? full.variables.filter(v=>keys.has(v.symbol) && !codes.has(v.symbol)).map(v=>
      id === 'universe' && v.symbol === 'distance'
        ? {...v,label:'Galaxy distance (SI)',value:params.distance * 3.085677581491367e22,unit:'m'}
        : v) : [];
  return { ...full, calculations, variables,
    note: 'Calculated model values. Rounded for display. IGCSE equations are limited to the selected 0625 outcomes.' };
}
export function heatPowerCalculationId(mode) {
  return ["conduction-0", "convection-1", "radiation-2"][mode];
}
export function studyReadings(id, state, params, mode, definition) {
  const sheet = calculationSheet(id,state,params);
  if (id === 'moments') {
    const q=definition.sample(state,params);
    return [{title:'Left moment ↺',value:q.left,unit:'N m'},
      {title:'Right moment ↻',value:q.right,unit:'N m'},
      {title:'Beam angle',value:q.angle,unit:'°'}];
  }
  if (id === 'buoyancy') {
    const q=buoyancySample(state,params);
    return [{title:'Weight ↓',value:q.weight,unit:'N'},
      {title:'Upthrust ↑',value:q.upthrust,unit:'N'},
      {title:'Submerged volume',value:q.immersion,unit:'%'}];
  }
  if (id === 'pendulum' && mode === 'igcse') return [
    { title:'Length', value:params.length, unit:'m' },
    { title:'Angle from vertical', value:state.theta * 180 / Math.PI, unit:'°' },
    { title:'Elapsed time', value:state.t, unit:'s' },
  ];
  const keys = id === 'heat' && mode !== 'igcse'
    ? [heatPowerCalculationId(params.mode), 'energy-3']
    : getProfile(id,mode).calculations;
  const readings = keys.map(k => sheet.calculations.find(c => c.id === k)).filter(Boolean).slice(0,3);
  if(id==='waves' && mode==='igcse')return readings.map(r=>r.id==='resultant'?{...r,title:'Wave displacement'}:r);
  if (mode === 'igcse' && id === 'gases' && params.state !== 2) return [
    {title:'Particle view',value:params.state === 0 ? 'Solid' : 'Liquid',unit:''},
    {title:'Gas readings',value:'Select gas',unit:''},
  ];
  if (readings.length) return readings;
  // Qualitative activities show relevant inputs, not invented measurements.
  return (visibleControlKeys(id,mode) || getProfile(id,mode).controls).slice(0,3).map(key => {
    const d = studyControl(id,mode,definition.controls.find(c => c.key === key));
    return { title:d.label, value: d.options?.find(([v]) => Number(v) === params[key])?.[1]
      ?? params[key] / (d.factor || 1), unit: d.options ? '' : d.unit };
  });
}
/** Remove advanced derivations from scene labels while preserving object
 * labels, axes, rulers, ray geometry and physically computed motion. */
export function sceneLabelAllowed(id, mode, text = '') {
  if (mode !== 'igcse') return true;
  if (text.length > 105) return false;
  const common = /nRT|RMS|rms|mol(?:e|⁻|\b)|Stefan|Boltzmann|Schwarzschild|\bRK4\b|Verlet|\bdt\b|d²|dθ|θ̈|θ˙|ζ|τ|e\^|exp\(|∫|∂|ħ|Lorentz|restitution/i;
  // Angular frequency ω is beyond these activities; the resistance unit Ω
  // remains essential. A case-insensitive omega pattern confuses the two.
  if (common.test(text) || /ω/.test(text)) return false;
  const rules = {
    pendulum: /√|sin|cos|energy|damping|tension|link force|acceleration|potential|kinetic|[−-]?(?:120|90|60)°/i,
    gases: /nitrogen|kinetic energy|mean speed|pressure.*=|pV.*=/i,
    expansion: /α|strain|ΔL\s*=/i, cooling: /conductance|τ|exponential/i,
    heat: /σ|T⁴|T4|kA|hA|emissivity/i,
    charged: /qv|mv|tesla|\bmT\b|\bT\b.*=|radius.*=|relativ/i,
    radiation: /MeV|keV|relativ|magnetic radius|radius.*=/i,
    induction: /NBA|ω|torque|flux.*=|Φ.*=/i,
    stars: /T⁴|T4|M³|M3|Wien|blackbody|luminosity.*=/i,
    earthmoon: /cos|sin|declination|approximation/i,
    solarsystem: /√|GM|Kepler|μ\s*=/i,
    atom: /impact parameter|Coulomb|cot|scattering angle.*=/i,
    fields: /kq|kQ|V\s*=|N\/C|J\/C|Coulomb/i,
    motion: /e\^|exp|bv|drag coefficient/i,
    collisions: /\be\s*=|restitution/i,
  };
  return !rules[id]?.test(text);
}
