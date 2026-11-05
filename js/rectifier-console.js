import { calculationNumber as number } from "./calculations.js";

export function installRectifierConsole(stage, { seekInductionPhase: seekPhase }) {
  const panel = document.createElement("section");
  panel.className = "rectifier-console";
  panel.setAttribute("aria-label", "Inspect an AC cycle");
  panel.innerHTML = `
    <div class="rectifier-live"><strong></strong><span></span></div>
    <div class="rectifier-phase">
      <span>Pause at a point in the cycle</span>
      <div>
        <button type="button" data-rectifier-phase="90">Positive peak</button>
        <button type="button" data-rectifier-phase="180">Zero crossing</button>
        <button type="button" data-rectifier-phase="270">Negative peak</button>
      </div>
    </div>
    <svg class="rectifier-wave" viewBox="0 0 210 76" role="img" aria-label="One cycle of the source and rectified load voltage">
      <path class="rectifier-axis" d="M8 35H202"/>
      <path class="rectifier-input"/><path class="rectifier-output"/>
      <text class="rectifier-legend-input" x="8" y="8">Vin · dashed</text>
      <text class="rectifier-legend-output" x="144" y="8">Vload · solid</text>
      <line class="rectifier-cursor" x1="8" x2="8" y1="5" y2="65"/>
      <circle class="rectifier-now" cx="8" cy="35" r="3"/>
      <text x="8" y="75">0</text><text x="187" y="75">1 cycle</text>
    </svg>`;
  stage.querySelector(".transport").before(panel);
  const title = panel.querySelector("strong"), reading = panel.querySelector(".rectifier-live span"),
    cursor = panel.querySelector("line"), now = panel.querySelector("circle"),
    input = panel.querySelector(".rectifier-input"), output = panel.querySelector(".rectifier-output"),
    buttons = [...panel.querySelectorAll("button")];
  for (const button of buttons) button.onclick = () => seekPhase(Number(button.dataset.rectifierPhase));
  const path = transform => Array.from({ length: 101 }, (_, i) =>
    (i ? "L" : "M") + (8 + i * 1.94).toFixed(2) + " " + (35 - 27 * transform(Math.sin(i * 2 * Math.PI / 100))).toFixed(2)).join(" ");
  input.setAttribute("d", path(value => value));
  let mode;
  return lab => {
    const q = lab.definition.sample(lab.state, lab.params), p = lab.params;
    const phase = (lab.state.t * p.frequency) % 1;
    const sign = Math.abs(q.input) < p.peak * 1e-10 ? 0 : Math.sign(q.input);
    const active = sign > 0 || (p.mode && sign < 0);
    title.textContent = !sign ? "Zero crossing" : active
      ? p.mode ? (sign > 0 ? "D1 + D4 conduct" : "D2 + D3 conduct") : "D1 conducts"
      : "D1 blocks the negative half-cycle";
    reading.textContent = "Load current " + number(active ? q.current * 1000 : 0) + " mA · " +
      (active ? "current flows down the load" : "no load current");
    if (mode !== p.mode) {
      mode = p.mode;
      output.setAttribute("d", path(value => mode ? Math.abs(value) : Math.max(0, value)));
    }
    const x = 8 + 194 * phase;
    cursor.setAttribute("x1", x); cursor.setAttribute("x2", x);
    now.setAttribute("cx", x);
    now.setAttribute("cy", 35 - 27 * (active ? q.output / p.peak : 0));
    for (const button of buttons) {
      const selected = !lab.running && Math.abs(phase * 360 - Number(button.dataset.rectifierPhase)) < 0.01;
      button.setAttribute("aria-pressed", String(selected));
    }
  };
}
