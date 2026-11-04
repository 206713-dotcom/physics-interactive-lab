import { calculationNumber } from "./calculations.js";
import { GENERATOR_LOAD_OHMS } from "./curriculum-physics.js";

export function installGeneratorSlipRings(stage, {seekGeneratorPhase, setGeneratorCircuit}) {
  const panel = document.createElement("section");
  panel.className = "commutator-panel slip-rings-panel";
  panel.id = "generator-slip-rings";
  panel.tabIndex = -1;
  panel.setAttribute("aria-labelledby", "slip-rings-title");
  panel.innerHTML = `
    <header class="commutator-heading">
      <div><span class="section-kicker">GENERATOR CLOSE-UP</span>
        <h2 id="slip-rings-title">How slip rings carry alternating current</h2>
        <p>Each brush stays on its own continuous ring. The voltage reverses because the coil moves through the field.</p>
      </div>
      <div class="commutator-modes" role="group" aria-label="Inspect generator output">
        <button type="button" data-slip-angle="90">Positive peak</button>
        <button type="button" data-slip-angle="270">Negative peak</button>
        <button type="button" class="slip-toggle" aria-label="Toggle generator circuit in the close-up" aria-pressed="true">Open circuit</button>
      </div>
    </header>
    <div class="commutator-diagrams">
      <figure>
        <figcaption>1 · Two continuous rings rotate with the shaft</figcaption>
        <svg viewBox="0 0 300 168" role="img" aria-label="Two rotating slip rings on one shaft, each with its own fixed brush.">
          <path d="M136 20v126" class="slip-shaft"/>
          <path d="M63 46h32m-32 58h32" class="commutator-lead"/>
          <text x="47" y="50">A</text><text x="47" y="108">B</text>
          <ellipse cx="136" cy="46" rx="50" ry="19" class="slip-ring-a"/>
          <ellipse cx="136" cy="104" rx="50" ry="19" class="slip-ring-b"/>
          <circle r="4" class="slip-marker"/><circle r="4" class="slip-marker"/>
          <rect x="184" y="36" width="31" height="20" rx="4" class="commutator-brush"/>
          <rect x="184" y="94" width="31" height="20" rx="4" class="commutator-brush"/>
          <path d="M215 46h34m-34 58h34" class="commutator-lead"/>
          <text x="251" y="34">Brush A</text><text x="251" y="92">Brush B</text>
          <text x="150" y="155">The brushes stay still</text>
        </svg>
        <div class="commutator-key"><span class="half-a">A · Ring A to brush A</span><span class="half-b">B · Ring B to brush B</span></div>
      </figure>
      <figure>
        <figcaption>2 · The external circuit determines whether current flows</figcaption>
        <svg viewBox="0 0 300 168" role="img" aria-label="External circuit with an open or closed switch and a ten-ohm load.">
          <path d="M55 50h66m44 0h60v16m0 43v17H55" class="slip-wire"/>
          <circle cx="55" cy="50" r="5" class="slip-terminal-a"/><circle cx="55" cy="126" r="5" class="slip-terminal-b"/>
          <text x="35" y="54">A</text><text x="35" y="130">B</text>
          <line x1="121" y1="50" x2="165" y2="50" class="slip-switch"/>
          <circle cx="121" cy="50" r="4" class="commutator-shaft"/><circle cx="165" cy="50" r="4" class="commutator-shaft"/>
          <rect x="216" y="66" width="18" height="43" rx="2" class="slip-resistor"/>
          <text x="256" y="92">${GENERATOR_LOAD_OHMS} Ω</text>
          <path d="M176 126h-49m7-6-7 6 7 6" class="slip-current"/>
          <text x="150" y="92" class="slip-voltage"></text>
        </svg>
        <div class="commutator-key"><span class="slip-current-label"></span></div>
      </figure>
    </div>
    <p class="commutator-result"></p>
    <p class="commutator-note">The drive holds the coil speed steady. The circuit uses an ideal generator and a resistive load.</p>
    <a href="#/motor">Compare the motor’s split ring →</a>`;
  stage.querySelector(".instrument-hud").after(panel);
  const markers = [...panel.querySelectorAll(".slip-marker")];
  const blade = panel.querySelector(".slip-switch");
  const arrow = panel.querySelector(".slip-current");
  const voltage = panel.querySelector(".slip-voltage");
  const current = panel.querySelector(".slip-current-label");
  const result = panel.querySelector(".commutator-result");
  const toggle = panel.querySelector(".slip-toggle");
  toggle.onclick = () => setGeneratorCircuit(Number(toggle.getAttribute("aria-pressed") !== "true"));
  for (const button of panel.querySelectorAll("[data-slip-angle]"))
    button.onclick = () => seekGeneratorPhase(Number(button.dataset.slipAngle));
  let lastTime, lastParams;
  return {
    render(lab) {
      if (lab.state.t === lastTime && lab.params === lastParams) return;
      lastTime = lab.state.t;
      lastParams = lab.params;
      const {phase, emf, loadCurrent, circuit} = lab.definition.sample(lab.state, lab.params);
      markers.forEach((marker, i) => {
        marker.setAttribute("cx", 136 + 50*Math.cos(phase));
        marker.setAttribute("cy", 46 + i*58 + 19*Math.sin(phase));
      });
      blade.setAttribute("y2", circuit ? 50 : 28);
      toggle.setAttribute("aria-pressed", String(Boolean(circuit)));
      toggle.textContent = circuit ? "Open circuit" : "Close circuit";
      arrow.style.visibility = loadCurrent ? "visible" : "hidden";
      arrow.setAttribute("transform", loadCurrent < 0 ? "translate(303 0) scale(-1 1)" : "");
      voltage.textContent = `A − B: ${calculationNumber(emf)} V`;
      current.textContent = `Output current: ${calculationNumber(loadCurrent)} A`;
      result.textContent = circuit
        ? "Closed circuit. The same brushes carry the alternating current. Watch the arrow reverse when the voltage changes sign."
        : "Open circuit. A voltage can still appear between the brushes, but the gap prevents current from flowing.";
    },
    reveal() {
      panel.scrollIntoView({block: "start"});
      panel.focus({preventScroll: true});
    },
  };
}
