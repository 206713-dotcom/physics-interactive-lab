import { SCENE_GUIDES } from './scene-guides.js';
import { buoyancySample } from './buoyancy-physics.js';
/** One readable instrument panel for every lab. Values come from the actual
 * solver state; this presentation component never advances the simulation. */
import { studyReadings } from './study-policy.js';
import { calculationNumber } from './calculations.js';
import { getProfile } from './learning-paths.js';
export function installPresentationStudio(stage, id) {
  stage.classList.add('presentation-stage');
  const panel = document.createElement('section');
  panel.className = 'instrument-hud';
  panel.setAttribute('aria-label','Live model readings');
  panel.setAttribute('aria-live','off');
  panel.innerHTML = '<div class="instrument-values"></div><span class="instrument-context"></span>';
  stage.querySelector('.transport').before(panel);
  const values = panel.querySelector('.instrument-values'), context = panel.querySelector('.instrument-context');
  let signature = '', nodes = [];
  return {
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
      readings.forEach((item,i) => nodes[i].textContent = calculationNumber(item.value));
      const watch = SCENE_GUIDES[id]?.[0]?.match(/^.*?[.!?](?=\s|$)/)?.[0] || getProfile(id,lab.studyMode).focus;
      context.textContent = watch;
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
      stage.dataset.studyMode = lab.studyMode;
    },
  };
}
