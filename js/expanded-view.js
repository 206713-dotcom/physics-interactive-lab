import { calculationSheet, calculationNumber, calculationOutcome } from "./calculations.js";
import { mathHTML, setMath } from "./math-display.js";
import { studySheet, syllabusDepth } from "./study-policy.js";
import { getProfile, MODE_NAMES } from "./learning-paths.js";

const sheetTimeUnit = (sheet) =>
  sheet.variables.find((value) => value.symbol === "t")?.unit || "s";
const quantity = (value, unit) =>
  `${calculationNumber(value)}${value !== null && unit ? " " + unit : ""}`;
const setText = (node, text) => {
  if (node.textContent !== text) node.textContent = text;
};

/** Move the real controls, canvas and graphs, preserving their running state.
 * Embedded workspaces are regions rather than keyboard-trapping dialogs. */
export class ExpandedView {
  constructor({
    title,
    controls,
    workspace,
    extraGraph,
    getSnapshot,
    onClose,
    onLayout,
    onPlayback,
    embedded = false,
    fullURL = "",
  }) {
    Object.assign(this, { getSnapshot, onClose, onLayout, embedded, fullURL });
    this.previousFocus = document.activeElement;
    this.moves = [];
    const snapshot = getSnapshot(),
      sheet = calculationSheet(snapshot.type, snapshot.state, snapshot.params);
    this.selectedId =
      (sheet.type === "vectors"
        ? sheet.calculations.find((item) => item.id === "resultant-2")
        : null
      )?.id || sheet.calculations[0].id;
    const root = document.createElement("section");
    this.root = root;
    root.className = "expanded-lab";
    root.dataset.model = snapshot.type;
    root.setAttribute("role", embedded ? "region" : "dialog");
    if (!embedded) root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "expanded-title");
    root.innerHTML = `
      <header class="expanded-header">
        <div class="expanded-heading"><a class="workspace-back" href="#/" aria-label="Return to the experiment library">← Laboratory</a><span class="expanded-eyebrow">${embedded ? "INTERACTIVE PHYSICS LAB" : "INTERACTIVE LABORATORY"}</span><h2 id="expanded-title">${mathHTML(title)}</h2></div>
        <nav class="expanded-panel-tabs" aria-label="Expanded inspector"><button type="button" data-inspector="calculations" aria-pressed="true">Calculations</button><button type="button" data-inspector="variables" aria-pressed="false">Parameters</button></nav>
        <div class="expanded-actions"><button type="button" class="expanded-play"></button>${embedded ? '<a class="expanded-full-link" target="_blank" rel="noopener">Open full lab ↗</a>' : ""}<button type="button" class="expanded-close" aria-label="${embedded ? "Show lessons and notes" : "Close expanded view"}"><span aria-hidden="true">↙</span> ${embedded ? "Lessons & notes" : "Lessons & notes"} ${embedded ? "" : "<kbd>Esc</kbd>"}</button></div>
      </header>
      <div class="expanded-layout">
        <aside class="expanded-variables" aria-label="Adjust model variables"></aside>
        <div class="expanded-model"></div>
        <aside class="expanded-calculations" aria-label="Live calculations">
          <div class="calculation-heading"><span class="expanded-eyebrow">LIVE CALCULATIONS</span><h2>Follow the physics.</h2><p>Every value, connected to the model.</p><div class="calculation-time"></div></div>
          <label class="calculation-choice-label" for="calculation-choice">Calculate</label>
          <select id="calculation-choice">${sheet.calculations.map((item) => `<option value="${mathHTML(item.id)}">${mathHTML(item.title)}</option>`).join("")}</select>
          <article class="worked-calculation calculation-primary">
            <h3></h3><span class="working-label">EQUATION</span><p class="calculation-formula"></p>
            <span class="working-label">SUBSTITUTE</span><p class="calculation-substitution"></p>
            <div class="calculation-answer"><span class="working-label">RESULT</span><output class="calculation-result"></output></div>
            <p class="calculation-note"></p>
          </article>
          <button type="button" class="copy-working">Copy this working</button><p class="copy-working-status" role="status"></p><textarea class="calculation-copy" readonly aria-label="Calculation text to copy" hidden></textarea>
          <section class="calculation-variables" aria-label="Values used in the calculations"><h3>Values in use <span>SI unless labelled</span></h3><dl>${sheet.variables.map((value, i) => `<div><dt><var>${mathHTML(value.symbol)}</var><span>${mathHTML(value.label)}</span></dt><dd data-variable="${i}"></dd></div>`).join("")}</dl></section>
          <section class="calculation-overview" aria-label="All calculated results"><h3>Other calculations</h3>${sheet.calculations.map((item) => `<button type="button" data-calculation="${mathHTML(item.id)}"><span>${mathHTML(item.title)}</span><strong></strong><span aria-hidden="true">↗</span></button>`).join("")}</section>
          <p class="calculation-footnote"></p>
        </aside>
      </div>`;
    if (embedded) root.querySelector(".expanded-full-link").href = fullURL();
    this.move(controls, root.querySelector(".expanded-variables"));
    this.move(workspace, root.querySelector(".expanded-model"));
    if (extraGraph) this.move(extraGraph, workspace);
    document.body.append(root);
    this.background = [...document.body.children]
      .filter((node) => node !== root && node.id !== "toast")
      .map((node) => [node, node.inert]);
    this.background.forEach(([node]) => (node.inert = true));
    document.body.classList.add("has-expanded-lab");
    this.variableNodes = [...root.querySelectorAll("[data-variable]")];
    this.time = root.querySelector(".calculation-time");
    this.footnote = root.querySelector(".calculation-footnote");
    this.choice = root.querySelector("#calculation-choice");
    this.brief = document.createElement('section');
    this.brief.className='inspector-study-brief';
    root.querySelector('.calculation-heading').after(this.brief);
    this.modeNote = document.createElement("p");
    this.modeNote.className = "calculation-level-scope";
    this.footnote.before(this.modeNote);
    this.choice.value = this.selectedId;
    this.resultNodes = Object.fromEntries(
      [
        "h3",
        ".calculation-formula",
        ".calculation-substitution",
        ".calculation-result",
        ".calculation-note",
      ].map((selector) => [
        selector,
        root.querySelector(`.worked-calculation ${selector}`),
      ]),
    );
    this.overview = [...root.querySelectorAll("[data-calculation]")];
    this.play = root.querySelector(".expanded-play");
    this.play.onclick = onPlayback;
    const focus = document.createElement("button");
    focus.type = "button";
    focus.className = "scene-focus-toggle";
    focus.textContent = "Scene focus";
    focus.setAttribute("aria-pressed", "false");
    root.querySelector(".stage-views").prepend(focus);
    focus.onclick = () => {
      const active = root.classList.toggle("scene-focused");
      focus.setAttribute("aria-pressed", String(active));
      focus.textContent = active ? "Show inspector" : "Scene focus";
      this.onLayout?.();
    };
    this.focusToggle = focus;
    root.querySelector(".expanded-close").onclick = () => this.close();
    this.choice.onchange = () => this.choose(this.choice.value);
    this.overview.forEach(
      (button) =>
        (button.onclick = () => {
          this.choose(button.dataset.calculation);
          root.querySelector(".expanded-calculations").scrollTo({ top: 0 });
          if (matchMedia("(max-width: 900px)").matches)
            root
              .querySelector(".expanded-calculations")
              .scrollIntoView({ block: "start" });
          this.choice.focus({ preventScroll: true });
        }),
    );
    root.querySelector(".copy-working").onclick = () => this.copy();
    root.querySelectorAll("[data-inspector]").forEach(
      (button) =>
        (button.onclick = () => {
          root.classList.remove("scene-focused");
          focus.setAttribute("aria-pressed", "false");
          focus.textContent = "Scene focus";
          const variables = button.dataset.inspector === "variables";
          root.classList.toggle("inspect-variables", variables);
          root
            .querySelectorAll("[data-inspector]")
            .forEach((tab) =>
              tab.setAttribute("aria-pressed", String(tab === button)),
            );
          if (matchMedia("(max-width: 900px)").matches)
            root
              .querySelector(
                variables ? ".expanded-variables" : ".expanded-calculations",
              )
              .scrollIntoView({ block: "start" });
          this.onLayout?.();
        }),
    );
    this.keydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        this.close();
        return;
      }
      if (event.key !== "Tab" || embedded) return;
      const focusable = [
        ...root.querySelectorAll(
          'button,input,select,textarea,a[href],summary,[tabindex="0"]',
        ),
      ].filter((node) => !node.disabled && node.getClientRects().length);
      const first = focusable[0],
        last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", this.keydown, true);
    this.refresh();
    this.onLayout?.();
    if (!embedded)
      root.querySelector(".expanded-close").focus({ preventScroll: true });
  }
  choose(id) {
    this.selectedId = id;
    this.choice.value = id;
    this.root.querySelector(".copy-working-status").textContent = "";
    this.root.querySelector(".calculation-copy").hidden = true;
    this.refresh();
  }
  move(node, parent) {
    const placeholder = document.createComment(
      "Expanded workspace return position",
    );
    node.before(placeholder);
    this.moves.push({ node, placeholder });
    parent.append(node);
  }
  refresh() {
    const { type, state, params, running, ended, studyMode } =
        this.getSnapshot(),
      full = calculationSheet(type,state,params),
      sheet = studySheet(type,state,params,studyMode);
    if (studyMode !== this.lastStudyMode) {
      const profile = getProfile(type,studyMode),
        preferred = profile?.calculations.find(key => sheet.calculations.some(c => c.id === key));
      this.selectedId = preferred || sheet.calculations[0]?.id;
      this.choice.value = this.selectedId || '';
      const igcse = studyMode === 'igcse';
      this.brief.hidden = !igcse;
      this.root.querySelector('.calculation-heading .expanded-eyebrow').textContent = igcse ? 'YOUR LEARNING FOCUS' : 'LIVE CALCULATIONS';
      this.brief.innerHTML = igcse ? `<span class="section-kicker">0625 · ${syllabusDepth(type)}</span><h3>${mathHTML(profile.focus)}</h3><p class="focus-equation">${mathHTML(profile.equation)}</p><ul>${profile.goals.map(g=>`<li>${mathHTML(g)}</li>`).join('')}</ul><p><strong>Try this.</strong> ${mathHTML(profile.task)}</p><details><summary>${mathHTML(profile.question)}</summary><p>${mathHTML(profile.answer)}</p></details>` : '';
      this.root.querySelector('.calculation-variables').hidden = !sheet.variables.length;
      this.root.querySelector('.calculation-overview h3').textContent = igcse ? 'Related results' : 'Other calculations';
      this.root.querySelector('.calculation-heading h2').textContent = igcse ? 'Understand the idea.' : 'Follow the physics.';
      this.root.querySelector('.calculation-heading p').textContent = igcse ? 'One model. A focused IGCSE explanation.' : 'Every value, connected to the model.';
      this.root.querySelector('[data-inspector="calculations"]').textContent = igcse ? 'Explanation' : 'Calculations';
      this.modeNote.textContent = igcse ? 'Core and Supplement outcomes are identified in the lesson. Advanced derivations are hidden in this mode.' : `${MODE_NAMES[studyMode]} · full model calculations`;
      for (const option of this.choice.options) {
        option.hidden = !sheet.calculations.some(c=>c.id===option.value);
        option.disabled = option.hidden;
      }
      this.root.dataset.studyMode = studyMode || "";
      this.lastStudyMode = studyMode;
    }
    // Text-only updates preserve selection and focus; no integration runs here.
    full.variables.forEach((original,i) => {
      const value = sheet.variables.find(v=>v.symbol===original.symbol), node = this.variableNodes[i];
      node.parentElement.hidden = !value;
      if (value) {
        setMath(node,quantity(value.value,value.unit));
        setText(node.parentElement.querySelector('dt span'),value.label);
      }
    });
    const item = sheet.calculations.find(entry => entry.id === this.selectedId);
    this.root.querySelector('.worked-calculation').hidden = !item;
    this.choice.hidden = sheet.calculations.length < 2;
    this.root.querySelector('.calculation-choice-label').hidden = this.choice.hidden;
    this.root.querySelector('.copy-working').hidden = !item;
    if (item) {
      const nodes = this.resultNodes;
      setText(nodes.h3,item.title);
      setMath(nodes['.calculation-formula'],item.formula);
      setMath(nodes['.calculation-substitution'],item.substitution);
      setMath(nodes['.calculation-result'],calculationOutcome(type,item));
      setText(nodes['.calculation-note'],item.note);
      nodes['.calculation-note'].hidden = !item.note;
    }
    this.overview.forEach(button => {
      const entry = sheet.calculations.find(c=>c.id===button.dataset.calculation);
      button.hidden = !entry || entry.id === this.selectedId;
      if (entry) setMath(button.querySelector('strong'),calculationOutcome(type,entry));
    });
    this.root.querySelector('.calculation-overview').hidden = sheet.calculations.length < 2;
    setText(
      this.time,
      `${running ? "LIVE" : "PAUSED"} · t = ${calculationNumber(sheet.time)} ${sheetTimeUnit(sheet)}`,
    );
    this.time.classList.toggle("is-live", !!running);
    setText(this.play, running ? "Ⅱ Pause" : ended ? "↻ Replay" : "▶ Resume");
    if (type === "vectors") {
      setText(this.time, "STATIC VECTORS · construction demo");
      setText(this.play, running ? "Ⅱ Pause build" : "▶ Animate addition");
    }
    this.play.setAttribute(
      "aria-label",
      running
        ? "Pause simulation"
        : ended
          ? "Replay simulation"
          : "Resume simulation",
    );
    this.play.setAttribute("aria-pressed", String(!!running));
    setText(this.footnote, sheet.note);
    if (this.embedded)
      this.root.querySelector(".expanded-full-link").href = this.fullURL();
  }
  async copy() {
    const { type, state, params, studyMode } = this.getSnapshot(),
      sheet = studySheet(type,state,params,studyMode),
      item = sheet.calculations.find((entry) => entry.id === this.selectedId);
    if (!item) return;
    const text = `${item.title}\n${type === "vectors" ? "Static vector setup" : `t = ${calculationNumber(sheet.time)} ${sheetTimeUnit(sheet)}`}\n${item.formula}\n${item.substitution}\n= ${calculationOutcome(type, item)}\n${item.note}\n\nValues used:\n${sheet.variables.map((value) => `${value.symbol} (${value.label}) = ${quantity(value.value, value.unit)}`).join("\n")}\n\n${sheet.note}`;
    const status = this.root.querySelector(".copy-working-status");
    try {
      await navigator.clipboard.writeText(text);
      setText(
        status,
        type === "vectors"
          ? "Working copied from this static vector setup."
          : `Working copied from t = ${calculationNumber(sheet.time)} ${sheetTimeUnit(sheet)}.`,
      );
    } catch {
      const field = this.root.querySelector(".calculation-copy");
      field.hidden = false;
      field.value = text;
      field.focus();
      field.select();
      setText(status, "Press Ctrl+C or ⌘C to copy the selected working.");
    }
  }
  close() {
    if (this.closed) return;
    this.closed = true;
    this.focusToggle.remove();
    document.removeEventListener("keydown", this.keydown, true);
    [...this.moves]
      .reverse()
      .forEach(({ node, placeholder }) => placeholder.replaceWith(node));
    this.background.forEach(([node, inert]) => (node.inert = inert));
    document.body.classList.remove("has-expanded-lab");
    this.root.remove();
    this.onClose?.();
    this.onLayout?.();
    if (!this.embedded && this.previousFocus?.isConnected)
      this.previousFocus.focus({ preventScroll: true });
  }
}
