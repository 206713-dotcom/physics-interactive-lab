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
        nodes = readings.map(item => {
          const cell = document.createElement('div');cell.className='instrument-value';
          const label = document.createElement('span'), output = document.createElement('strong'), unit = document.createElement('small');
          label.textContent = item.title;unit.textContent = item.unit || '';
          cell.append(label,output,unit);values.append(cell);return output;
        });
        signature = next;
      }
      readings.forEach((item,i) => nodes[i].textContent = calculationNumber(item.value));
      context.textContent = lab.studyMode === 'igcse'
        ? 'Model values · change one variable at a time'
        : getProfile(id,lab.studyMode).focus;
      stage.dataset.studyMode = lab.studyMode;
    },
  };
}
