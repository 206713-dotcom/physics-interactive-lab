import {
  availableModes,
  resolveMode,
  getProfile,
  MODE_NAMES,
  stageFor,
  syllabusLink,
} from "./learning-paths.js";
import { mathHTML } from "./math-display.js";
import { visibleControlKeys, syllabusDepth } from './study-policy.js';
const esc = mathHTML;
export function levelBadges(id) {
  return availableModes(id)
    .map((m) =>
      m === "alevel"
        ? stageFor(getProfile(id, m)).join(" + ") + " · 9702"
        : m === "igcse"
          ? "IGCSE · 0625"
          : "Enrichment",
    )
    .join(" / ");
}
export class LearningStudio {
  constructor({
    id,
    mode,
    cycle,
    stage,
    controls,
    onMode,
    onSetup,
    getSnapshot,
  }) {
    Object.assign(this, { id, mode, cycle, onMode, onSetup, getSnapshot });
    this.picker = document.createElement("section");
    this.picker.className = "learning-mode-controls";
    this.picker.innerHTML = `<span class="section-kicker">LEARNING LEVEL</span><div class="learning-mode-options" role="group" aria-label="Learning level">${availableModes(
      id,
    )
      .map(
        (m) =>
          `<button data-study-mode="${m}" aria-pressed="${m === mode}">${MODE_NAMES[m]}${m === "igcse" ? "<small>0625 · Core + Supplement</small>" : m === "alevel" ? "<small>" + stageFor(getProfile(id, m)).join(" + ") + " · 9702</small>" : "<small>Beyond the syllabus</small>"}</button>`,
      )
      .join("")}</div>`;
    controls.querySelector(".controls-heading").after(this.picker);
    this.panel = document.createElement("section");
    this.panel.className = "learning-focus";
    this.panel.setAttribute("aria-label", "Syllabus learning focus");
    stage.after(this.panel);
    this.picker
      .querySelectorAll("[data-study-mode]")
      .forEach((b) => (b.onclick = () => onMode(b.dataset.studyMode)));
    this.render();
  }
  render() {
    this.panel
      .closest(".lab-page")
      ?.setAttribute("data-learning-mode", this.mode);
    const p = getProfile(this.id, this.mode);
    this.picker
      .querySelectorAll("[data-study-mode]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.studyMode === this.mode),
        ),
      );
    this.panel.innerHTML = `<div class="learning-focus-heading"><div><span class="section-kicker">${this.mode === "igcse" ? "CAMBRIDGE IGCSE 0625 · " + syllabusDepth(this.id).toUpperCase() : this.mode === "alevel" ? stageFor(p).join(" + ") + " · 9702" : "ENRICHMENT"}</span><h2>${esc(p.focus)}</h2></div><div class="syllabus-refs">${p.refs.map(ref => `<a href="${syllabusLink(this.mode,ref,this.cycle)}" target="_blank" rel="noopener">§${ref} ↗</a>`).join("")}</div></div><p class="focus-equation">${esc(p.equation)}</p><p class="study-task"><strong>Try this.</strong> ${esc(p.task)}</p>`;
    const keys = visibleControlKeys(this.id,this.mode);
    for (const control of this.picker.parentElement.querySelectorAll('.control')) {
      const input = control.querySelector('input[id],select[id]'),
        key = input?.id.replace(/-(?:number|slider|select)$/,'');
      control.hidden = !!keys && !keys.includes(key);
      control.querySelector('.study-control-marker')?.remove();
    }
    const presets = this.picker.parentElement.querySelector('.preset-block');
    if (presets) presets.hidden = this.mode === 'igcse';
    this.picker.parentElement.querySelector('.control-footnote').textContent =
      this.mode === 'igcse' ? 'Change one variable at a time. Other model settings are held fixed.' : 'A parameter change starts a fresh calculated run.';
  }
  setMode(mode) {
    this.mode = resolveMode(this.id, mode);
    this.render();
  }
  update() { /* Live values are shown once, in the shared instrument panel. */ }
  /** Preserve original resource nodes and their handlers inside an explicitly
   * labelled full-model section; focused teaching changes with the selected mode. */
  enhanceLesson(panel, tab) {
    const p = getProfile(this.id, this.mode),
      full = document.createElement("details");
    full.className = "full-model-resources";
    const summary = document.createElement("summary");
    summary.textContent =
      "Full model resources · may go beyond this learning level";
    full.append(summary);
    while (panel.firstChild) full.append(panel.firstChild);
    const focus = document.createElement("section");
    focus.className = "level-lesson";
    if (tab === "learn")
      focus.innerHTML = `<span class="section-kicker">${MODE_NAMES[this.mode].toUpperCase()} LEARNING FOCUS</span><h2>${esc(p.focus)}</h2><ul>${p.goals.map((g) => `<li>${esc(g)}</li>`).join("")}</ul><p class="focus-equation">${esc(p.equation)}</p><p>${esc(p.answer)}</p><p class="learning-scope">${esc(p.scope || "Use the cited sections as a guide to the selected learning outcomes, alongside your course notes and practical work.")}</p>`;
    if (tab === "experiments")
      focus.innerHTML = `<h2>Your ${MODE_NAMES[this.mode]} investigation</h2><p>${esc(p.task)}</p><p>Write a prediction first. Keep the other parameters fixed, compare calculated readings, then explain the trend using ${esc(p.equation)}.</p><button class="button" data-level-setup>Load recommended setup</button><p>These are model predictions. A simulation does not supply measured experimental uncertainty or replace supervised practical work.</p>`;
    if (tab === "questions")
      focus.innerHTML = `<h2>A question at your chosen level</h2><details class="question"><summary>${esc(p.question)}</summary><p>${esc(p.answer)}</p></details><p>Explain the physical reason as well as the numerical result. Use the equation above and explain your reasoning in words.</p>`;
    if (tab === "model")
      focus.innerHTML = `<h2>The equation to focus on</h2><p class="focus-equation">${esc(p.equation)}</p><p>${esc(p.scope || "Use this relationship with the labelled units. The animation is a calculated model, not a set of measured experimental results.")}</p>`;
    focus
      .querySelector("[data-level-setup]")
      ?.addEventListener("click", this.onSetup);
    if (this.mode === 'igcse') {
      // Full-model resources stay available in the corresponding higher-level
      // mode, without leaking unsupported mathematics into the IGCSE lesson.
      const application = full.querySelector('.application');
      if (application && tab === 'learn') focus.append(application);
      panel.append(focus);
    } else panel.append(focus, full);
  }
}
