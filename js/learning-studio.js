import {
  availableModes,
  resolveMode,
  getProfile,
  MODE_NAMES,
  stageFor,
  syllabusLink,
  SYLLABUS_SOURCES,
} from "./learning-paths.js";
import { calculationSheet, calculationNumber } from "./calculations.js";
import { mathHTML } from "./math-display.js";
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
    this.picker.innerHTML = `<span class="section-kicker">CHOOSE YOUR LEARNING LEVEL</span><div class="learning-mode-options" role="group" aria-label="Learning level">${availableModes(
      id,
    )
      .map(
        (m) =>
          `<button data-study-mode="${m}" aria-pressed="${m === mode}">${MODE_NAMES[m]}${m === "igcse" ? "<small>0625 · Extended</small>" : m === "alevel" ? "<small>" + stageFor(getProfile(id, m)).join(" + ") + " · 9702</small>" : "<small>Beyond the syllabus</small>"}</button>`,
      )
      .join("")}</div><p>One physical model. A different learning focus.</p>`;
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
    const p = getProfile(this.id, this.mode),
      source =
        this.mode === "igcse"
          ? SYLLABUS_SOURCES.igcse
          : this.cycle === "next"
            ? SYLLABUS_SOURCES.alevelNext
            : SYLLABUS_SOURCES.alevel;
    this.picker
      .querySelectorAll("[data-study-mode]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.studyMode === this.mode),
        ),
      );
    this.panel.innerHTML = `<div class="learning-focus-heading"><div><span class="section-kicker">${this.mode === "alevel" ? stageFor(p).join(" + ") + " · 9702" : this.mode === "igcse" ? "IGCSE EXTENDED · 0625" : "ENRICHMENT · EXTRA PHYSICS"}</span><h2>${esc(p.focus)}</h2></div><a href="./#/syllabus?track=${this.mode === "alevel" ? "alevel" : this.mode}&cycle=${this.cycle}">Browse learning paths ↗</a></div><div class="syllabus-refs">${p.refs.map((ref) => `<a href="${syllabusLink(this.mode, ref, this.cycle)}" target="_blank" rel="noopener">§${ref} ↗</a>`).join("")}${p.refs.length ? `<span>${source.years} · selected outcomes</span>` : "<span>Not a required 0625 or 9702 model</span>"}</div><div class="learning-focus-calculations"></div><details class="learning-brief"><summary>What to learn & try at this level</summary><ul>${p.goals.map((g) => `<li>${esc(g)}</li>`).join("")}</ul><p><strong>Try this:</strong> ${esc(p.task)}</p><p class="focus-equation">${esc(p.equation)}</p><button class="small-button" data-level-setup>Load recommended setup</button><p class="learning-scope">${esc(p.scope || "This lab demonstrates selected ideas in the cited sections. The full model may contain additional calculations; the learning focus above identifies the intended depth.")}</p></details>`;
    for (const control of this.picker.parentElement.querySelectorAll(
      ".control",
    )) {
      const input = control.querySelector("input[id],select[id]"),
        key = input?.id.replace(/-(?:number|slider|select)$/, "");
      let marker = control.querySelector(".study-control-marker");
      if (!marker) {
        marker = document.createElement("span");
        marker.className = "study-control-marker";
        control.prepend(marker);
      }
      const focused = p.controls.includes(key);
      marker.textContent = focused ? "FOCUS AT THIS LEVEL" : "EXPLORE FURTHER";
      marker.classList.toggle("is-focus", focused);
    }
    this.panel.querySelector("[data-level-setup]").onclick = this.onSetup;
    this.readings = this.panel.querySelector(".learning-focus-calculations");
    this.cards = [];
    const snap = this.getSnapshot(),
      sheet = calculationSheet(this.id, snap.state, snap.params);
    for (const key of p.calculations.slice(0, 3)) {
      const item = sheet.calculations.find((x) => x.id === key);
      if (!item) continue;
      const card = document.createElement("article");
      card.innerHTML = `<span>${esc(item.title)}</span><strong></strong><p>${esc(item.formula)}</p>`;
      this.readings.append(card);
      this.cards.push({ key, node: card.querySelector("strong") });
    }
    if (p.scope) {
      const scope = document.createElement("p");
      scope.className = "learning-scope";
      scope.textContent = p.scope;
      this.panel.append(scope);
    }
    this.update();
  }
  setMode(mode) {
    this.mode = resolveMode(this.id, mode);
    this.render();
  }
  update() {
    const s = this.getSnapshot(),
      sheet = calculationSheet(this.id, s.state, s.params);
    for (const c of this.cards) {
      const item = sheet.calculations.find((x) => x.id === c.key);
      c.node.textContent =
        calculationNumber(item.value) +
        (item.value !== null ? " " + item.unit : "");
    }
  }
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
      focus.innerHTML = `<h2>A question at your chosen level</h2><details class="question"><summary>${esc(p.question)}</summary><p>${esc(p.answer)}</p></details><p>Explain the physical reason as well as the numerical result. More model questions are available below; some require extra mathematics.</p>`;
    if (tab === "model")
      focus.innerHTML = `<h2>The equation to focus on</h2><p class="focus-equation">${esc(p.equation)}</p><p>${esc(p.scope || "The equation above is the focus for this mode. Additional model assumptions and numerical methods are documented below.")}</p>`;
    focus
      .querySelector("[data-level-setup]")
      ?.addEventListener("click", this.onSetup);
    panel.append(focus, full);
  }
}
