import { calculationSheet, calculationNumber } from "./calculations.js";

const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const quantity = (value, unit) =>
  `${calculationNumber(value)}${value !== null && unit ? " " + unit : ""}`;
const setText = (node, text) => {
  if (node.textContent !== text) node.textContent = text;
};

/** An in-page expanded workspace works inside embedded browsers as well as
 * ordinary tabs. The original controls, canvas and graphs are moved, not
 * duplicated, so they keep their exact state and event handlers. */
export class ExpandedView {
  constructor({
    title,
    controls,
    workspace,
    extraGraph,
    getSnapshot,
    onClose,
    onLayout,
  }) {
    Object.assign(this, { getSnapshot, onClose, onLayout });
    this.previousFocus = document.activeElement;
    this.moves = [];
    const snapshot = getSnapshot(),
      sheet = calculationSheet(snapshot.type, snapshot.state, snapshot.params);
    const root = document.createElement("section");
    this.root = root;
    root.className = "expanded-lab";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "expanded-title");
    root.innerHTML = `<header class="expanded-header"><div><span class="expanded-eyebrow">EXPANDED WORKSPACE</span><h2 id="expanded-title">${escapeHTML(title)}</h2></div><nav class="expanded-panel-tabs" aria-label="Expanded inspector"><button type="button" data-inspector="calculations" aria-pressed="true">Calculations</button><button type="button" data-inspector="variables" aria-pressed="false">Variables</button></nav><button type="button" class="expanded-close" aria-label="Close expanded view"><span aria-hidden="true">↙</span> Exit expanded view <kbd>Esc</kbd></button></header><div class="expanded-layout"><aside class="expanded-variables" aria-label="Adjust model variables"></aside><div class="expanded-model"></div><aside class="expanded-calculations" aria-label="Live calculations"><div class="calculation-heading"><span class="expanded-eyebrow">FROM THIS SIMULATION</span><h2>Live calculations</h2><p>Change a variable or pause the model to follow the working.</p><div class="calculation-time"></div></div><section class="calculation-variables" aria-label="Values used in the calculations"><h3>Values in use <span>SI unless labelled</span></h3><dl>${sheet.variables.map((value, i) => `<div><dt><var>${escapeHTML(value.symbol)}</var><span>${escapeHTML(value.label)}</span></dt><dd data-variable="${i}"></dd></div>`).join("")}</dl></section><div class="worked-calculations">${sheet.calculations.map((item, i) => `<article class="worked-calculation" data-calculation="${escapeHTML(item.id)}"><div class="calculation-step">${String(i + 1).padStart(2, "0")}</div><h3></h3><p class="calculation-formula"></p><p class="calculation-substitution"></p><output class="calculation-result"></output><p class="calculation-note"></p></article>`).join("")}</div><p class="calculation-footnote"></p></aside></div>`;
    this.move(controls, root.querySelector(".expanded-variables"));
    this.move(workspace, root.querySelector(".expanded-model"));
    if (extraGraph) this.move(extraGraph, workspace);
    document.body.append(root);
    // Make the covered page unavailable to keyboard and assistive navigation.
    this.background = [...document.body.children]
      .filter((node) => node !== root && node.id !== "toast")
      .map((node) => [node, node.inert]);
    this.background.forEach(([node]) => (node.inert = true));
    document.body.classList.add("has-expanded-lab");
    this.variableNodes = [...root.querySelectorAll("[data-variable]")];
    this.calculationNodes = [
      ...root.querySelectorAll(".worked-calculation"),
    ].map((node) => ({
      title: node.querySelector("h3"),
      formula: node.querySelector(".calculation-formula"),
      substitution: node.querySelector(".calculation-substitution"),
      result: node.querySelector(".calculation-result"),
      note: node.querySelector(".calculation-note"),
    }));
    this.time = root.querySelector(".calculation-time");
    this.footnote = root.querySelector(".calculation-footnote");
    root.querySelector(".expanded-close").onclick = () => this.close();
    root.querySelectorAll("[data-inspector]").forEach(
      (button) =>
        (button.onclick = () => {
          const variables = button.dataset.inspector === "variables";
          root.classList.toggle("inspect-variables", variables);
          root
            .querySelectorAll("[data-inspector]")
            .forEach((tab) =>
              tab.setAttribute("aria-pressed", String(tab === button)),
            );
          if (matchMedia("(max-width: 760px)").matches)
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
      if (event.key !== "Tab") return;
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
    root.querySelector(".expanded-close").focus({ preventScroll: true });
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
    const { type, state, params } = this.getSnapshot(),
      sheet = calculationSheet(type, state, params);
    // Update text in place: scrolling, keyboard focus and text selection remain
    // stable while values change. Never reintegrate or reset the model here.
    sheet.variables.forEach((value, i) =>
      setText(this.variableNodes[i], quantity(value.value, value.unit)),
    );
    sheet.calculations.forEach((item, i) => {
      const nodes = this.calculationNodes[i];
      setText(nodes.title, item.title);
      setText(nodes.formula, item.formula);
      setText(nodes.substitution, item.substitution);
      setText(nodes.result, quantity(item.value, item.unit));
      setText(nodes.note, item.note);
      nodes.note.hidden = !item.note;
    });
    setText(
      this.time,
      `t = ${calculationNumber(sheet.time)} s · current model state`,
    );
    setText(this.footnote, sheet.note);
  }
  close() {
    if (this.closed) return;
    this.closed = true;
    document.removeEventListener("keydown", this.keydown, true);
    // Restore nested moves first (the gravity graph lives outside its workspace
    // in normal view). Existing canvas contexts and charts survive the move.
    [...this.moves]
      .reverse()
      .forEach(({ node, placeholder }) => placeholder.replaceWith(node));
    this.background.forEach(([node, inert]) => (node.inert = inert));
    document.body.classList.remove("has-expanded-lab");
    this.root.remove();
    this.onClose?.();
    this.onLayout?.();
    if (this.previousFocus?.isConnected)
      this.previousFocus.focus({ preventScroll: true });
  }
}
