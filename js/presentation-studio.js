import { SCENE_GUIDES } from './scene-guides.js';
import { buoyancySample } from './buoyancy-physics.js';
/** One readable instrument panel for every lab. Values come from the actual
 * solver state; this presentation component never advances the simulation. */
import { studyReadings } from './study-policy.js';
import { calculationNumber } from './calculations.js';
import { getProfile, sceneRelationship } from './learning-paths.js';
import { installMotorCommutator } from './motor-commutator.js';
import { installGeneratorSlipRings } from './generator-slip-rings.js';
import { installGalvanometer } from './galvanometer.js';
import { installReadingComparison } from './reading-comparison.js';
import { installRectifierConsole } from './rectifier-console.js';
import { installTransformerConsole } from './transformer-console.js';
import { GENERATOR_LOAD_OHMS, MAGNET_STROKE_METRES, magnetLampLevel } from './curriculum-physics.js';

function addHandRule(stage, motor) {
  const guide = document.createElement('section');
  guide.className = 'machine-rule';
  const hand = motor ? 'Left' : 'Right';
  const thumb = motor ? 'Force on the wire' : 'Motion of the wire';
  const middle = motor ? 'Conventional current' : 'Induced conventional current';
  guide.innerHTML = `
    <svg viewBox="0 0 240 180" role="img" aria-label="${hand} hand schematic. Index points right, middle points towards you, thumb points ${motor ? 'up' : 'down'}.">
      <g transform="${motor ? '' : 'translate(0 180) scale(1 -1)'}">
        <path d="M28 105H58L72 76 82 35Q85 21 96 24Q106 26 105 40L102 69H194Q207 69 207 80Q207 91 193 91H141Q157 97 149 109Q157 117 146 128Q144 143 124 147H77L55 137H28Z" fill="#fff4e6" stroke="#d1a47d" stroke-width="2.5"/>
        <path d="M93 69V12m-6 8 6-8 6 8" fill="none" stroke="#a65f14" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <path d="M127 80h93m-8-6 8 6-8 6" transform="${motor ? '' : 'translate(0 180) scale(1 -1)'}" fill="none" stroke="#087d76" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="119" cy="90" r="12" fill="#f7f0ff" stroke="#734f99" stroke-width="2.5"/>
      <circle cx="119" cy="90" r="3.5" fill="#734f99"/>
    </svg>
    <div>
      <span class="section-kicker">${motor ? 'MOTOR EFFECT' : 'ELECTROMAGNETIC INDUCTION'}</span>
      <h2>Fleming’s ${hand.toLowerCase()}-hand rule</h2>
      <dl>
        <div><dt class="rule-thumb">Thumb</dt><dd>${thumb}</dd></div>
        <div><dt class="rule-field">Index finger</dt><dd>Magnetic field from N to S</dd></div>
        <div><dt class="rule-current">Middle finger</dt><dd>${middle}</dd></div>
      </dl>
      <p>Hold the three fingers at right angles. The dot means the middle finger points towards you. ${motor ? 'Use the field and current to predict the force.' : 'Use the field and motion to predict the current in a closed circuit.'}</p>
      <a href="#/${motor ? 'generator' : 'motor'}">${motor ? 'Open the AC generator' : 'Open the DC motor'} →</a>
    </div>`;
  stage.append(guide);
}

function addMachineConsole(stage, motor, {runMotorSetup, seekInductionPhase, setInductionCircuit}, cutaway) {
  const consolePanel = document.createElement('section');
  consolePanel.className = 'machine-console';
  consolePanel.setAttribute('aria-label', motor ? 'Compare motor speeds' : 'Inspect the generator phase');
  consolePanel.innerHTML = motor ? `
    <div class="machine-console-reading">
      <span class="machine-caption">LIVE SHAFT SPEED</span>
      <output class="machine-value" aria-live="off">0.0 rpm</output>
      <meter min="0" max="100" value="0" aria-label="Shaft speed up to 100 rpm"></meter>
      <span class="machine-meter-scale"><span>0</span><span>100+ rpm</span></span>
    </div>
    <div class="machine-actions">
      <span class="machine-caption">COMPARE FIELD STRENGTH OR LOAD AT THE SAME CURRENT</span>
      <div><button type="button" data-field=".2">Run at 0.20 T</button>
      <button type="button" data-field=".5">Run at 0.50 T</button>
      <button type="button" data-load="1">Standard load</button>
      <button type="button" data-load="4">Heavy load</button>
      <button type="button" class="commutator-jump" aria-controls="motor-commutator">Split-ring close-up ↓</button></div>
      <p class="machine-phase-note"></p>
    </div>` : `
    <div class="machine-console-reading">
      <span class="machine-caption">INDUCED CURRENT</span>
      <output class="machine-value" aria-live="off">0° · 0 A</output>
      <small class="machine-voltage">Generated voltage 0 V</small>
      <svg viewBox="0 0 220 48" aria-hidden="true" class="machine-wave">
        <path d="M6 24H214" class="wave-axis"/>
        <path class="wave-curve"/>
        <circle cx="6" cy="24" r="4"/>
      </svg>
    </div>
    <div class="machine-actions">
      <label class="machine-caption" for="generator-angle">PAUSE AND INSPECT COIL ANGLE</label>
      <input type="range" id="generator-angle" min="0" max="360" step="1" value="0">
      <div><button type="button" data-angle="0">0°</button>
      <button type="button" data-angle="90">90°</button>
      <button type="button" data-angle="180">180°</button>
      <button type="button" data-angle="270">270°</button>
      <button type="button" class="generator-switch" aria-label="Connect the ${GENERATOR_LOAD_OHMS} ohm load" aria-pressed="true">Circuit closed</button>
      <button type="button" class="commutator-jump" aria-controls="generator-slip-rings">Slip-ring close-up ↓</button>
      <a href="#/magnet-coil">Try a moving bar magnet →</a></div>
      <p class="machine-phase-note"></p>
    </div>`;
  stage.querySelector('.transport').before(consolePanel);
  const value = consolePanel.querySelector('.machine-value');
  const note = consolePanel.querySelector('.machine-phase-note');
  consolePanel.querySelector('.commutator-jump').onclick = cutaway.reveal;
  const buttons = [...consolePanel.querySelectorAll(motor ? '[data-field],[data-load]' : '[data-angle]')];
  if (motor) {
    const meter = consolePanel.querySelector('meter');
    for (const button of buttons) {
      const key = button.hasAttribute('data-field') ? 'field' : 'load';
      button.onclick = () => runMotorSetup({ [key]: Number(button.dataset[key]) });
    }
    return lab => {
      const {rpm} = lab.definition.sample(lab.state, lab.params);
      value.textContent = `${rpm.toFixed(1)} rpm`;
      meter.value = rpm;
      for (const button of buttons) {
        const key = button.hasAttribute('data-field') ? 'field' : 'load';
        button.setAttribute('aria-pressed', String(Number(button.dataset[key]) === lab.params[key]));
      }
      note.textContent = `Field ${lab.params.field.toFixed(2)} T · Current ${lab.params.current.toFixed(2)} A · Load ${lab.params.load}× · Each run starts from rest.`;
    };
  }
  const slider = consolePanel.querySelector('input');
  const curve = consolePanel.querySelector('.wave-curve');
  const marker = consolePanel.querySelector('circle');
  const circuitSwitch = consolePanel.querySelector('.generator-switch');
  circuitSwitch.onclick = () => setInductionCircuit(Number(circuitSwitch.getAttribute('aria-pressed') !== 'true'));
  const voltageReading = consolePanel.querySelector('.machine-voltage');
  let waveCircuit;
  buttons.forEach(button => button.onclick = () => seekInductionPhase(Number(button.dataset.angle)));
  slider.oninput = () => seekInductionPhase(slider.valueAsNumber);
  return lab => {
    const {emf, peak, circuit, loadCurrent} = lab.definition.sample(lab.state, lab.params);
    if (waveCircuit !== circuit) {
      const points = Array.from({length:65}, (_,i) => {
        const fraction = i / 64;
        const row = lab.definition.sample({t:fraction/lab.params.frequency}, lab.params);
        return `${i ? 'L' : 'M'}${6+208*fraction},${24-18*row.loadCurrent*GENERATOR_LOAD_OHMS/peak}`;
      });
      curve.setAttribute('d',points.join(' '));
      waveCircuit = circuit;
    }
    const turns = lab.state.t * lab.params.frequency;
    const degrees = Math.round(360*(turns < 1.00000001 ? Math.min(turns,1) : turns % 1));
    const voltage = Math.abs(emf) < 1e-10 ? 0 : emf;
    slider.value = degrees;
    marker.setAttribute('cx',6+208*degrees/360);
    marker.setAttribute('cy',24-18*loadCurrent*GENERATOR_LOAD_OHMS/peak);
    value.textContent = `${degrees}° · ${calculationNumber(loadCurrent)} A`;
    voltageReading.textContent = `Generated voltage ${calculationNumber(voltage)} V`;
    circuitSwitch.textContent = circuit ? 'Circuit closed' : 'Circuit open';
    circuitSwitch.setAttribute('aria-pressed', String(Boolean(circuit)));
    buttons.forEach(button => button.setAttribute('aria-pressed', String(!lab.running && degrees === Number(button.dataset.angle))));
    note.textContent = !circuit
      ? 'Open circuit · 0 A. Voltage can still appear across the terminals.'
      : voltage === 0
      ? 'Zero output. The long coil sides move along the field.'
      : `Closed through ${GENERATOR_LOAD_OHMS} Ω · ${calculationNumber(loadCurrent)} A. Compare the purple current arrows across half-turns.`;
  };
}

function addMagnetConsole(stage, {seekInductionPhase, setInductionCircuit, flipMagnet,
  setMagnetManual, beginManualMagnet, moveManualMagnet, stopManualMagnet}) {
  const panel = document.createElement('section');
  panel.className = 'machine-console';
  panel.setAttribute('aria-label','Inspect magnet movement and induced current');
  panel.innerHTML = `
    <div class="machine-console-reading">
      <span class="machine-caption">INDUCED CURRENT · VIEWED FROM THE RIGHT END</span>
      <output class="machine-value" aria-live="off"></output>
      <small class="machine-voltage"></small>
      <small class="machine-voltage magnet-speed"></small>
      <div class="magnet-bulb-reading">
        <span class="magnet-bulb-icon" aria-hidden="true">✦</span>
        <small class="magnet-bulb-power"></small>
      </div>
    </div>
    <div class="machine-actions">
      <div class="magnet-mode" role="group" aria-label="Magnet motion">
        <button type="button" data-magnet-mode="auto" aria-pressed="true">Automatic</button>
        <button type="button" data-magnet-mode="manual" aria-pressed="false">Move it yourself</button>
      </div>
      <div class="magnet-manual-control" hidden>
        <label for="magnet-position">Magnet position · <span></span></label>
        <input type="range" id="magnet-position" min="${-MAGNET_STROKE_METRES*1000}" max="${MAGNET_STROKE_METRES*1000}" step="1" value="${MAGNET_STROKE_METRES*1000}">
        <small>Compare slow and fast passes through the same position. Hold still to turn the bulb off.</small>
      </div>
      <div>
        <button type="button" data-magnet-angle="77">Push in</button>
        <button type="button" data-magnet-angle="90" data-hold>Hold at centre</button>
        <button type="button" data-magnet-angle="103">Exit on left</button>
        <button type="button" class="magnet-flip">Flip magnet</button>
        <button type="button" class="magnet-circuit" aria-label="Connect the magnet-coil load" aria-pressed="true">Circuit closed</button>
        <a href="#/generator">Try the rotating generator →</a>
      </div>
      <p class="machine-phase-note"></p>
    </div>`;
  stage.querySelector('.transport').before(panel);
  const buttons = [...panel.querySelectorAll('[data-magnet-angle]')];
  const toggle = panel.querySelector('.magnet-circuit');
  const value = panel.querySelector('.machine-value');
  const voltage = panel.querySelector('.machine-voltage');
  const speed = panel.querySelector('.magnet-speed');
  const note = panel.querySelector('.machine-phase-note');
  const modes = [...panel.querySelectorAll('[data-magnet-mode]')];
  const positionControl = panel.querySelector('.magnet-manual-control');
  const position = panel.querySelector('#magnet-position');
  const positionLabel = positionControl.querySelector('span');
  const bulb = panel.querySelector('.magnet-bulb-icon');
  const power = panel.querySelector('.magnet-bulb-power');
  for (const button of modes)
    button.onclick = () => setMagnetManual(button.dataset.magnetMode === 'manual');
  position.onpointerdown = beginManualMagnet;
  position.onpointerup = stopManualMagnet;
  position.onpointercancel = stopManualMagnet;
  position.onblur = stopManualMagnet;
  position.onkeydown = event => { if (!event.repeat) beginManualMagnet(); };
  position.oninput = () => moveManualMagnet(position.valueAsNumber/1000);
  for (const button of buttons)
    button.onclick = () => seekInductionPhase(Number(button.dataset.magnetAngle), button.hasAttribute('data-hold'));
  panel.querySelector('.magnet-flip').onclick = flipMagnet;
  toggle.onclick = () => setInductionCircuit(Number(toggle.getAttribute('aria-pressed') !== 'true'));
  return lab => {
    const q = lab.definition.sample(lab.state, lab.params);
    const direction = Math.sign(q.loadCurrent);
    const motion = !q.speed ? 'Momentarily stationary'
      : q.distance === 0 ? 'Crossing the centre'
      : q.distance*q.speed < 0 ? 'Approaching' : 'Leaving the coil';
    const degrees = q.phase * 180/Math.PI % 360;
    const manual = Boolean(lab.magnetManual);
    for (const button of modes)
      button.setAttribute('aria-pressed',String((button.dataset.magnetMode === 'manual') === manual));
    positionControl.hidden = !manual;
    if (manual) {
      position.value = Math.round(q.distance*1000);
      const side = q.distance < 0 ? 'left' : 'right';
      const distance = Math.abs(q.distance*100).toFixed(1);
      positionLabel.textContent = distance === '0.0' ? 'at the centre' : `${distance} cm ${side} of centre`;
      position.setAttribute('aria-valuetext', positionLabel.textContent);
    }
    const glow = magnetLampLevel(q.loadPower,manual);
    bulb.style.setProperty('--bulb-glow',glow);
    power.textContent = `Demo bulb · ${calculationNumber(q.loadPower*1e6)} µW · amplified glow`;
    speed.textContent = `Magnet speed ${calculationNumber(Math.abs(q.speed))} m/s`;
    value.textContent = direction
      ? `${calculationNumber(Math.abs(q.loadCurrent)*1000)} mA · ${direction > 0 ? 'clockwise' : 'anticlockwise'}`
      : '0 mA · no current';
    voltage.textContent = `Induced voltage ${calculationNumber(q.emf)} V`;
    toggle.textContent = q.circuit ? 'Circuit closed' : 'Circuit open';
    toggle.setAttribute('aria-pressed',String(Boolean(q.circuit)));
    for (const button of buttons) {
      button.hidden = manual;
      button.setAttribute('aria-pressed',String(!lab.running && Math.abs(degrees-Number(button.dataset.magnetAngle))<1e-8));
    }
    note.textContent = `${lab.params.pole > 0 ? 'North' : 'South'} at the magnet’s left end · ${motion}. ${!q.circuit
      ? 'The open circuit stops current.' : !q.speed
      ? 'Steady magnetic flux means no induced current.' : direction
      ? `The coil’s right face becomes ${direction > 0 ? 'south' : 'north'}.`
      : 'The linked flux is momentarily steady.'}`;
  };
}

export function installPresentationStudio(stage, controls, id, title, machineActions) {
  stage.classList.add('presentation-stage');
  const panel = document.createElement('section');
  panel.className = 'instrument-hud';
  panel.setAttribute('aria-label','Live model readings');
  panel.setAttribute('aria-live','off');
  panel.innerHTML = '<div class="instrument-values"></div><div class="instrument-observe"><strong>What to watch</strong><span class="instrument-context"></span></div>';
  stage.querySelector('.transport').after(panel);
  const compareReadings = installReadingComparison(panel);
  const updateRectifier = id === 'rectifier' ? installRectifierConsole(stage, machineActions) : null;
  const updateTransformer = id === 'transformer' ? installTransformerConsole(stage, machineActions) : null;
  if (id === 'motor' || id === 'induction') addHandRule(stage, id === 'motor');
  const commutator = id === 'motor' ? installMotorCommutator(stage) : null;
  const slipRings = id === 'induction' ? installGeneratorSlipRings(stage, machineActions) : null;
  const updateMachine = id === 'motor' || id === 'induction'
    ? addMachineConsole(stage, id === 'motor', machineActions, commutator || slipRings)
    : id === 'magnet-coil' ? addMagnetConsole(stage, machineActions) : null;
  const values = panel.querySelector('.instrument-values'), context = panel.querySelector('.instrument-context');
  const toolbar = stage.querySelector('.stage-views');
  const scene = stage.querySelector('.scene-container');
  const renderGalvanometer = id === 'magnet-coil' ? installGalvanometer(scene) : null;
  const drawer = document.createElement('div');
  drawer.className = 'model-variables';
  const diagramTools = document.createElement('div');
  diagramTools.className = 'diagram-tools';
  diagramTools.hidden = true;
  scene.before(diagramTools);
  const equation = scene.querySelector('.scene-equation');
  const drawerToggle = document.createElement('button');
  drawerToggle.type = 'button';
  drawerToggle.textContent = 'Change variables';
  controls.id = 'model-variable-panel';
  controls.hidden = true;
  drawerToggle.setAttribute('aria-expanded', 'false');
  drawerToggle.setAttribute('aria-controls', controls.id);
  drawerToggle.onclick = () => {
    const open = controls.hidden;
    controls.hidden = !open;
    drawer.classList.toggle('is-open', open);
    drawerToggle.setAttribute('aria-expanded', String(open));
    drawerToggle.textContent = open ? 'Hide variables' : 'Change variables';
  };
  drawer.append(drawerToggle, controls);
  scene.append(drawer);
  const dialog = document.createElement('dialog');
  dialog.className = 'model-screen';
  dialog.setAttribute('aria-label', title + ' full screen');
  const titleLabel = document.createElement('strong');
  titleLabel.className = 'model-screen-title';
  titleLabel.textContent = title;
  stage.querySelector('.stage-top').prepend(titleLabel);
  const launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'model-screen-launch';
  launch.setAttribute('aria-haspopup', 'dialog');
  launch.textContent = 'Full screen';
  toolbar.prepend(launch);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'model-screen-close';
  close.textContent = 'Exit full screen';
  toolbar.append(close);
  const returnPoint = document.createComment('Full screen model return position');
  function restore(focus = true) {
    if (stage.parentNode !== dialog) return;
    returnPoint.replaceWith(stage);
    dialog.remove();
    if (focus && launch.isConnected) launch.focus({ preventScroll: true });
  }
  launch.onclick = () => {
    stage.before(returnPoint);
    document.body.append(dialog);
    dialog.append(stage);
    dialog.showModal();
    close.focus();
  };
  close.onclick = () => { dialog.close(); restore(); };
  dialog.onclose = () => { if (!dialog.open) restore(); };
  let signature = '', nodes = [];
  return {
    setView(mode) {
      const diagram = mode === '2d';
      diagramTools.hidden = !diagram;
      if (diagram) diagramTools.append(drawerToggle, equation);
      else {
        drawer.prepend(drawerToggle);
        scene.append(equation);
      }
    },
    render: commutator ? lab => commutator.render(lab.state.phase) : (slipRings?.render || renderGalvanometer),
    dispose() {
      if (dialog.open) dialog.close();
      restore(false);
    },
    update(lab) {
      if (id === 'gases') {
        const gas = lab.params.state === 2;
        const relationship = gas ? sceneRelationship(id, lab.studyMode)
          : lab.params.state === 0 ? 'Solid particles vibrate around fixed positions'
          : 'Liquid particles move past their neighbours';
        const content = equation.querySelector('.scene-equation-content');
        if (content.textContent !== relationship) content.textContent = relationship;
        equation.querySelector('.scene-equation-label').textContent = gas ? 'Key formula' : 'Key idea';
      }
      if (id === 'heat' && lab.studyMode === 'igcse') {
        controls.querySelector('#thickness-number').closest('.control').hidden = lab.params.mode !== 0;
        controls.querySelector('#conductivity-select').closest('.control').hidden = lab.params.mode !== 0;
      }
      updateMachine?.(lab);
      updateRectifier?.(lab);
      updateTransformer?.(lab);
      if (lab.magnetManual) renderGalvanometer?.(lab);
      const readings = studyReadings(id,lab.state,lab.params,lab.studyMode,lab.definition),
        next = readings.map(x => x.title + x.unit).join('|');
      compareReadings(readings);
      if (signature !== next) {
        values.replaceChildren();
        values.style.setProperty('--reading-count',readings.length);
        nodes = readings.map(item => {
          const cell = document.createElement('div');cell.className='instrument-value';
          const label = document.createElement('span'), output = document.createElement('strong'), unit = document.createElement('small');
          label.textContent = item.title;unit.textContent = item.unit || '';
          cell.append(label,output,unit);values.append(cell);return output;
        });
        signature = next;
      }
      readings.forEach((item,i) => {
        // Round sub-nanodegree floating-point residue in the beam's display.
        // Keep the integrated angle and every other scientific reading intact.
        const value=id==='moments' && item.title==='Beam angle' && Math.abs(item.value)<1e-8 ? 0 : item.value;
        nodes[i].textContent = id==='waves' && lab.studyMode==='igcse' && item.unit==='m'
          ? Number(value.toFixed(3)).toString() : calculationNumber(value);
        // A missing angle or an undefined result has no numerical unit to append.
        nodes[i].nextElementSibling.textContent=typeof value==='number' && Number.isFinite(value)?item.unit || '':'';
      });
      const watch = SCENE_GUIDES[id]?.[0]?.match(/^.*?[.!?](?=\s|$)/)?.[0] || getProfile(id,lab.studyMode).focus;
      context.textContent = watch;
      if (id === 'motor')
        context.textContent = 'Cyan shows the field, purple shows conventional current, and gold shows force. Follow one coil side through a half-turn.';
      if (id === 'induction')
        context.textContent = 'Cyan shows the field and gold shows conductor motion. Purple shows induced conventional current for a closed resistive circuit.';
      if (id === 'magnet-coil')
        context.textContent = 'Watch the galvanometer needle reverse as the magnet passes through the coil. The bulb shows power and the needle shows the direction and size of the current.';
      if(id==='waves' && lab.studyMode==='igcse')
        context.textContent='The marked particle moves up and down. The wave pattern travels to the right.';
      if(id==='refraction' && lab.studyMode==='igcse')
        context.textContent='Measure angles from the dashed normal. Compare the direction of each ray.';
      if(id==='dc')context.textContent=lab.params.mode===1
        ? 'Current splits between the branches, then recombines. Both branches have the same potential difference.'
        : 'One path · the current is the same through both components.';
      if (id === 'moments') {
        const q=lab.definition.sample(lab.state,lab.params);
        context.textContent = q.contact ? 'At the angular stop · The stop supplies a balancing reaction moment.'
          : Math.abs(q.net)<1e-9 ? 'Equal moments · A beam released from rest stays level.'
          : q.net>0 ? 'Left moment is greater · The left side turns down.' : 'Right moment is greater · The right side turns down.';
      }
      if (id === 'buoyancy') {
        const q=buoyancySample(lab.state,lab.params);
        context.textContent = q.normal>0 ? 'On the bottom · The floor supplies the remaining support force.'
          : lab.params.density < lab.params.fluid
            ? q.status===4 ? 'Floating · Upthrust balances weight.' : 'Rising and settling · The cube floats when upthrust balances weight.'
            : lab.params.density > lab.params.fluid
              ? 'Sinking · Weight exceeds the greatest possible upthrust.'
              : 'Suspended · Equal densities give balanced forces.';
      }
      if (id === 'collisions') {
        const {state:s,params:p}=lab;
        context.textContent = s.hit
          ? p.restitution===0 ? 'After contact: both carts have the same velocity. Follow them past the fixed ruler.'
            : 'After contact: compare the two new velocities with their launch values. The ruler stays fixed.'
          : p.u1>p.u2 ? 'Before contact: the gap closes. Use the fixed metre marks to compare how far each cart travels.'
            : 'The carts are not closing the gap, so no collision impulse is applied.';
      }
      if (id === 'gravity') {
        const {state:s,params:p}=lab, r=Math.hypot(s.x,s.y), ratio=r/p.distance;
        context.textContent = s.collided ? 'Surface impact: the model stops at the central body.'
          : `Distance is ${ratio.toFixed(2)}× the launch separation. Gravity is ${(1/ratio**2).toPrecision(3)}× its launch strength. Gold shows velocity; coral points inward.`;
      }
      stage.dataset.studyMode = lab.studyMode;
    },
  };
}
