import { sampleCurriculum } from "./curriculum-physics.js";
import { VECTOR_PHASES, parametersFromVectorPoint } from "./vector-geometry.js";
import { vectorCanvasFrame } from "./render-vectors.js";
const METHODS = {
  triangle: [
    "Head to tail",
    "Slide B so its tail meets the head of A. The purple resultant joins the first and final endpoints.",
  ],
  parallelogram: [
    "Parallelogram",
    "Place both tails at the origin. Complete the parallel sides; the diagonal is the same resultant.",
  ],
  components: [
    "Components",
    "Resolve B into horizontal and vertical parts. Add each direction separately, then use Pythagoras and atan2.",
  ],
};
const num = (n) =>
  Number(n.toFixed(2)).toLocaleString("en", { maximumFractionDigits: 2 });
export class VectorStudio {
  constructor({ root, getLab, onChange, onEditStart, onEditEnd, onSeek }) {
    Object.assign(this, {
      root,
      getLab,
      onChange,
      onEditStart,
      onEditEnd,
      onSeek,
    });
    const stage = root.querySelector("#stage");
    const toolbar = document.createElement("div");
    toolbar.className = "vector-methods";
    toolbar.setAttribute("role", "group");
    toolbar.setAttribute("aria-label", "Vector addition method");
    toolbar.innerHTML = Object.entries(METHODS)
      .map(
        ([key, [name]], i) =>
          `<button data-vector-method="${key}" aria-pressed="${i === 0}"><span>0${i + 1}</span>${name}</button>`,
      )
      .join("");
    stage.querySelector(".stage-top").after(toolbar);
    const headline = document.createElement("div");
    headline.className = "vector-headline";
    headline.innerHTML =
      '<span>RESULTANT</span><output id="vector-result"></output><small id="vector-direction"></small>';
    stage.querySelector(".running-status").hidden = true;
    stage.querySelector(".running-status").after(headline);
    const results = document.createElement("section");
    results.className = "vector-evidence";
    results.setAttribute("aria-label", "Vector components and construction");
    results.innerHTML = `<div class="vector-equation-cards"><article><span>HORIZONTAL</span><h3>Rₓ = A + B cos θ</h3><p id="vector-x-working"></p><output id="vector-x"></output></article><article><span>VERTICAL</span><h3>Rᵧ = B sin θ</h3><p id="vector-y-working"></p><output id="vector-y"></output></article></div><div class="vector-construction"><div><span class="section-kicker">BUILD THE DIAGRAM</span><strong id="vector-phase-title"></strong><span class="construction-label">Geometric construction · forces stay fixed</span></div><div class="vector-phase-buttons" role="group" aria-label="Construction steps">${VECTOR_PHASES.map(([name], i) => `<button data-vector-phase="${i}" aria-pressed="${i === 3}"><span>0${i + 1}</span>${name}</button>`).join("")}</div><p id="vector-phase-copy"></p><label class="vector-seek-label">Construction progress<input type="range" min="0" max="100" value="100" step="1" id="vector-progress" aria-label="Construction progress"></label><p class="vector-method-description" id="vector-method-description"></p></div>`;
    stage.after(results);
    root.querySelector("#metrics").hidden = true;
    root.querySelector("#vectors").closest("label").hidden = true;
    const options = document.createElement("div");
    options.className = "vector-display-options";
    options.innerHTML =
      '<h3>Diagram details</h3><label><input type="checkbox" data-vector-option="vectorComponents" checked> Component guides</label><label><input type="checkbox" data-vector-option="vectorAngle" checked> Angle marker</label><label><input type="checkbox" data-vector-option="vectorGrid" checked> Coordinate grid</label><p>Drag the ring at A or B to edit. Use the numeric inputs for exact values.</p>';
    root.querySelector(".control-footnote").before(options);
    toolbar.querySelectorAll("[data-vector-method]").forEach(
      (b) =>
        (b.onclick = () => {
          const lab = getLab();
          lab.vectorMethod = b.dataset.vectorMethod;
          lab.vectorProgress = 1;
          lab.running = false;
          onEditEnd();
          this.update();
        }),
    );
    options.querySelectorAll("input").forEach(
      (input) =>
        (input.onchange = () => {
          getLab()[input.dataset.vectorOption] = input.checked;
        }),
    );
    results.querySelectorAll("[data-vector-phase]").forEach(
      (b) =>
        (b.onclick = () => {
          onSeek([0.2, 0.55, 0.8, 1][Number(b.dataset.vectorPhase)]);
          this.update();
        }),
    );
    results.querySelector("#vector-progress").oninput = (e) => {
      onSeek(Number(e.target.value) / 100);
      this.update();
    };
    this.canvas = root.querySelector("#simulation");
    this.canvas.tabIndex = 0;
    this.drag = null;
    this.handlers = {
      pointerdown: (e) => {
        if (e.button !== 0) return;
        const frame = vectorCanvasFrame(this.canvas, getLab()),
          rect = this.canvas.getBoundingClientRect(),
          mouse = [e.clientX - rect.left, e.clientY - rect.top],
          a = frame.pixel(frame.layout.a),
          b = frame.pixel(getLab().vectorMethod === "parallelogram" ? frame.layout.b : frame.layout.result);
        const key =
          Math.hypot(mouse[0] - a[0], mouse[1] - a[1]) < 19
            ? "a"
            : Math.hypot(mouse[0] - b[0], mouse[1] - b[1]) < 19
              ? "b"
              : null;
        if (!key) return;
        e.preventDefault();
        this.drag = {
          key,
          frame,
          params: { ...getLab().params },
          method: getLab().vectorMethod,
        };
        getLab().vectorDragLayout = frame.layout;
        this.canvas.setPointerCapture(e.pointerId);
        onEditStart();
      },
      pointermove: (e) => {
        if (!this.drag) return;
        const rect = this.canvas.getBoundingClientRect(),
          d = this.drag,
          point = d.frame.world(e.clientX - rect.left, e.clientY - rect.top),
          patch = parametersFromVectorPoint(
            d.key,
            point,
            d.frame.layout,
            d.params,
            d.method,
          );
        if (patch) onChange(patch);
      },
      pointerup: () => {
        if (!this.drag) return;
        this.drag = null;
        getLab().vectorDragLayout = null;
        onEditEnd();
      },
      pointercancel: () => {
        this.drag = null;
        getLab().vectorDragLayout = null;
        onEditEnd();
      },
    };
    for (const [name, handler] of Object.entries(this.handlers))
      this.canvas.addEventListener(name, handler);
    this.nodes = Object.fromEntries(
      [
        "vector-result",
        "vector-direction",
        "vector-x-working",
        "vector-y-working",
        "vector-x",
        "vector-y",
        "vector-phase-title",
        "vector-phase-copy",
        "vector-method-description",
        "vector-progress",
        "guide-reading",
      ].map((id) => [id, root.querySelector("#" + id)]),
    );
    this.optionInputs = [...options.querySelectorAll("input")];
    this.methodButtons = [...toolbar.querySelectorAll("[data-vector-method]")];
    this.phaseButtons = [...results.querySelectorAll("[data-vector-phase]")];
    this.update();
  }
  update() {
    const lab = this.getLab();
    if (!lab) return;
    const q = sampleCurriculum("vectors", lab.state, lab.params),
      p = lab.params,
      progress = lab.vectorProgress ?? 1,
      phase =
        progress <= 0.2 ? 0 : progress <= 0.55 ? 1 : progress <= 0.8 ? 2 : 3,
      method = lab.vectorMethod || "triangle";
    const set = (id, value) => {
      if (this.nodes[id].textContent !== value)
        this.nodes[id].textContent = value;
    };
    const phases = VECTOR_PHASES.map((row) => [...row]);
    if (method === "parallelogram") {
      phases[1] = [
        "Place B at the origin",
        "Both vectors begin at the same point. Their directions and magnitudes are unchanged.",
      ];
      phases[2] = [
        "Draw the diagonal",
        "The parallel guide lines meet at the final corner. The diagonal from the origin is R = A + B.",
      ];
    }
    set("vector-result", num(q.resultant) + " N");
    set("guide-reading", "R = " + num(q.resultant) + " N");
    set(
      "vector-direction",
      q.direction === null
        ? "Balanced · direction undefined"
        : num(q.direction) + "° from +x",
    );
    set(
      "vector-x-working",
      num(p.a) + " + " + num(p.b) + " cos(" + num(p.angle) + "°)",
    );
    set("vector-y-working", num(p.b) + " sin(" + num(p.angle) + "°)");
    set("vector-x", num(q.x) + " N");
    set("vector-y", num(q.y) + " N");
    set("vector-phase-title", phases[phase][0]);
    set("vector-phase-copy", phases[phase][1]);
    set("vector-method-description", METHODS[method][1]);
    this.optionInputs.forEach((input) => {
      input.checked =
        input.dataset.vectorOption === "vectorComponents" &&
        method === "components"
          ? true
          : lab[input.dataset.vectorOption] !== false;
      input.disabled =
        input.dataset.vectorOption === "vectorComponents" &&
        method === "components";
    });
    this.methodButtons.forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.vectorMethod === method)),
    );
    this.phaseButtons.forEach((b, i) => {
      b.setAttribute("aria-pressed", String(i === phase));
      if (b.lastChild.textContent !== phases[i][0])
        b.lastChild.textContent = phases[i][0];
    });
    if (document.activeElement !== this.nodes["vector-progress"])
      this.nodes["vector-progress"].value = Math.round(progress * 100);
  }
  dispose() {
    for (const [name, handler] of Object.entries(this.handlers))
      this.canvas.removeEventListener(name, handler);
  }
}
