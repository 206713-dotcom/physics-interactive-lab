import { SCENE_GUIDES } from './scene-guides.js';
import { buoyancySample } from './buoyancy-physics.js';
/** One readable instrument panel for every lab. Values come from the actual
 * solver state; this presentation component never advances the simulation. */
import { studyReadings } from './study-policy.js';
import { calculationNumber } from './calculations.js';
import { getProfile } from './learning-paths.js';
export function installPresentationStudio(stage, controls, id, title, show3D) {
  stage.classList.add('presentation-stage');
  const panel = document.createElement('section');
  panel.className = 'instrument-hud';
  panel.setAttribute('aria-label','Live model readings');
  panel.setAttribute('aria-live','off');
  panel.innerHTML = '<div class="instrument-values"></div><div class="instrument-observe"><strong>What to watch</strong><span class="instrument-context"></span></div>';
  stage.querySelector('.transport').after(panel);
  const values = panel.querySelector('.instrument-values'), context = panel.querySelector('.instrument-context');
  const toolbar = stage.querySelector('.stage-views');
  const scene = stage.querySelector('.scene-container');
  const drawer = document.createElement('div');
  drawer.className = 'model-variables';
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
    show3D();
  };
  close.onclick = () => { dialog.close(); restore(); };
  dialog.onclose = () => { if (!dialog.open) restore(); };
  let signature = '', nodes = [];
  return {
    dispose() {
      if (dialog.open) dialog.close();
      restore(false);
    },
    update(lab) {
      const readings = studyReadings(id,lab.state,lab.params,lab.studyMode,lab.definition),
        next = readings.map(x => x.title + x.unit).join('|');
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
