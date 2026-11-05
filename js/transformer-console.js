import { transformerVisual } from "./transformer-visual.js";
import { calculationNumber as number } from "./calculations.js";

export function installTransformerConsole(stage, { seekTransformerPhase }) {
  const panel = document.createElement("section");
  panel.className = "rectifier-console transformer-console";
  panel.setAttribute("aria-label", "Inspect transformer AC phase");
  panel.innerHTML = `
    <div class="rectifier-live"><strong></strong><span></span>
      <small>RMS readouts · illustrative AC phase, slowed for display</small>
    </div>
    <div class="rectifier-phase">
      <span>Compare the voltage with the changing core flux</span>
      <div>
        <button type="button" data-transformer-phase="90">Positive voltage peak</button>
        <button type="button" data-transformer-phase="180">Maximum flux</button>
        <button type="button" data-transformer-phase="270">Negative voltage peak</button>
      </div>
    </div>
    <svg class="rectifier-wave" viewBox="0 0 210 76" role="img" aria-label="Primary and secondary voltage phases on the same relative scale">
      <path class="rectifier-axis" d="M8 35H202"/>
      <path class="rectifier-input"/><path class="rectifier-output"/>
      <text class="rectifier-legend-input" x="8" y="8">Primary · dashed</text>
      <text class="rectifier-legend-output" x="130" y="8">Secondary · solid</text>
      <line class="rectifier-cursor" x1="8" x2="8" y1="5" y2="65"/>
      <circle class="rectifier-now" cx="8" cy="35" r="3"/>
      <text x="8" y="75">0</text><text x="187" y="75">1 cycle</text>
    </svg>`;
  stage.querySelector(".transport").before(panel);
  const status = panel.querySelector("strong"), reading = panel.querySelector(".rectifier-live span"),
    cursor = panel.querySelector("line"), now = panel.querySelector("circle"),
    primary = panel.querySelector(".rectifier-input"), secondary = panel.querySelector(".rectifier-output"),
    buttons = [...panel.querySelectorAll("button")];
  for (const button of buttons) button.onclick = () => seekTransformerPhase(Number(button.dataset.transformerPhase));
  let signature;
  return lab => {
    const q = lab.definition.sample(lab.state, lab.params), p = lab.params;
    const { phase, voltage, flux } = transformerVisual(lab.state.t);
    status.textContent = !voltage ? "Maximum flux · voltage is zero"
      : !flux ? "Flux passes through zero · voltage is at a peak" : "Changing core flux induces the secondary voltage";
    reading.textContent = "Mean input " + number(q.input) + " W = mean output " + number(q.output) + " W";
    const next = p.vp + "|" + q.vs;
    if (next !== signature) {
      const path = amplitude => Array.from({ length: 101 }, (_, i) => (i ? "L" : "M") +
        (8 + i * 1.94).toFixed(2) + " " + (35 - 27 * amplitude * Math.sin(i * 2 * Math.PI / 100)).toFixed(2)).join(" ");
      const scale = Math.max(p.vp, q.vs);
      primary.setAttribute("d", path(p.vp / scale));
      secondary.setAttribute("d", path(q.vs / scale));
      signature = next;
    }
    const cycle = ((phase / (2 * Math.PI)) % 1 + 1) % 1, x = 8 + 194 * cycle;
    cursor.setAttribute("x1", x); cursor.setAttribute("x2", x);
    now.setAttribute("cx", x);
    now.setAttribute("cy", 35 - 27 * q.vs / Math.max(p.vp, q.vs) * voltage);
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(!lab.running &&
        Math.abs(cycle * 360 - Number(button.dataset.transformerPhase)) < 0.01));
    }
  };
}
