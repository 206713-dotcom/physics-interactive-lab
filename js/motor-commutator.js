import { machineSide } from "./curriculum-physics.js";

const INSPECTION_ANGLES = [
  ["Before swap", 145],
  ["At the gap", 180],
  ["After swap", 215],
];

/** The cutaway and end-on coil use the same phase and direction model as
 * the apparatus. Inspection buttons pause only the close-up illustration. */
export function installMotorCommutator(stage) {
  const panel = document.createElement("section");
  panel.className = "commutator-panel";
  panel.id = "motor-commutator";
  panel.tabIndex = -1;
  panel.setAttribute("aria-labelledby", "commutator-title");
  panel.innerHTML = `
    <header class="commutator-heading">
      <div><span class="section-kicker">MOTOR CLOSE-UP</span>
        <h2 id="commutator-title">How the split ring switches current</h2>
        <p>The brushes stay still. The two copper halves turn with the coil. Use the inspection buttons to freeze this close-up at the switch.</p>
      </div>
      <div class="commutator-modes" role="group" aria-label="Commutator view">
        <button type="button" data-commutator="live" aria-pressed="true">Follow live</button>
        ${INSPECTION_ANGLES.map(([label, degrees]) =>
          `<button type="button" data-commutator="${degrees}" aria-pressed="false">${label}</button>`).join("")}
      </div>
    </header>
    <div class="commutator-diagrams">
      <figure>
        <figcaption>1 · Stationary brushes and rotating contacts</figcaption>
        <svg viewBox="0 0 300 168" role="img" aria-label="End-on split ring between a negative brush on the left and a positive brush on the right.">
          <path d="M16 78h38m192 0h38" class="commutator-lead"/>
          <rect x="54" y="66" width="36" height="24" rx="4" class="commutator-brush"/>
          <rect x="210" y="66" width="36" height="24" rx="4" class="commutator-brush"/>
          <text x="72" y="54" class="brush-minus">− brush</text>
          <text x="228" y="54" class="brush-plus">+ brush</text>
          <g class="commutator-ring">
            <circle cx="150" cy="78" r="59" class="commutator-insulation"/>
            <path d="M200.7 83.6A51 51 0 0 1 99.3 83.6" class="commutator-half-a"/>
            <path d="M99.3 72.4A51 51 0 0 1 200.7 72.4" class="commutator-half-b"/>
          </g>
          <text class="commutator-ring-end" data-ring-end="a">A</text>
          <text class="commutator-ring-end" data-ring-end="b">B</text>
          <circle cx="150" cy="78" r="10" class="commutator-shaft"/>
          <text x="150" y="155" class="commutator-angle"></text>
        </svg>
        <div class="commutator-key"><span class="half-a">A · Coil end A</span><span class="half-b">B · Coil end B</span></div>
      </figure>
      <figure>
        <figcaption>2 · What changes on the coil</figcaption>
        <svg viewBox="0 0 300 168" role="img" aria-label="End-on coil showing conventional current into or out of the page and opposite magnetic forces.">
          <path d="M40 78h220m-9-6 9 6-9 6" class="commutator-field"/>
          <text x="42" y="68" class="commutator-field-label">N → S</text>
          <circle cx="150" cy="78" r="55" class="commutator-orbit"/>
          <line class="commutator-coil"/>
          <circle cx="150" cy="78" r="6" class="commutator-shaft"/>
          ${["a", "b"].map(end => `
            <g data-coil-end="${end}">
              <circle r="12" class="commutator-wire"/>
              <text class="commutator-current" y="5"></text>
              <text class="commutator-end-label" x="22" y="5">${end.toUpperCase()}</text>
              <path class="commutator-force" d="M0-14v-27m-5 6 5-6 5 6"/>
            </g>`).join("")}
          <text x="150" y="155" class="commutator-torque"></text>
        </svg>
        <div class="commutator-key"><span>⊙ current towards you</span><span>⊗ current away</span><span class="half-b">Gold · force</span></div>
      </figure>
    </div>
    <p class="commutator-result"></p>
    <p class="commutator-note">The insulating gaps are enlarged here. The motor model switches at the instant the brushes cross the gaps.</p>`;
  stage.querySelector(".instrument-hud").after(panel);

  const ring = panel.querySelector(".commutator-ring");
  const angle = panel.querySelector(".commutator-angle");
  const coil = panel.querySelector(".commutator-coil");
  const torque = panel.querySelector(".commutator-torque");
  const result = panel.querySelector(".commutator-result");
  const brushes = [...panel.querySelectorAll(".commutator-brush")];
  const ringEnds = [...panel.querySelectorAll("[data-ring-end]")];
  const sides = [...panel.querySelectorAll("[data-coil-end]")].map(group => ({
    group,
    current: group.querySelector(".commutator-current"),
    force: group.querySelector(".commutator-force"),
  }));
  let livePhase = 0, preview = null, lastPhase, lastPolarity;

  function draw() {
    const phase = preview === null ? livePhase : preview * Math.PI / 180;
    if (phase === lastPhase) return;
    lastPhase = phase;
    const degrees = phase * 180 / Math.PI % 360;
    ring.setAttribute("transform", `rotate(${-degrees} 150 78)`);
    angle.textContent = `${preview === null ? "Live angle" : "Preview angle"} ${Math.round(degrees) % 360}°`;
    const sideA = machineSide(phase, 1, true);
    ringEnds.forEach((end, index) => {
      const sign = index === 0 ? 1 : -1;
      end.setAttribute("x", 150 + sign * 51 * sideA.x);
      end.setAttribute("y", 82 + sign * 51 * sideA.z);
    });
    const x = sideA.x * 55, y = sideA.z * 55;
    coil.setAttribute("x1", 150 + x);
    coil.setAttribute("y1", 78 + y);
    coil.setAttribute("x2", 150 - x);
    coil.setAttribute("y2", 78 - y);
    sides[0].group.setAttribute("transform", `translate(${150+x} ${78+y})`);
    sides[1].group.setAttribute("transform", `translate(${150-x} ${78-y})`);

    const polarity = sideA.current;
    if (polarity === lastPolarity) return;
    lastPolarity = polarity;
    brushes[0].dataset.contact = polarity > 0 ? "b" : polarity < 0 ? "a" : "";
    brushes[1].dataset.contact = polarity > 0 ? "a" : polarity < 0 ? "b" : "";
    for (const [index, side] of sides.entries()) {
      const direction = index === 0 ? polarity : -polarity;
      side.current.textContent = direction > 0 ? "⊙" : direction < 0 ? "⊗" : "";
      side.force.style.visibility = direction ? "visible" : "hidden";
      side.force.setAttribute("transform", direction < 0 ? "rotate(180)" : "");
    }
    torque.textContent = polarity ? "↺ Same turning direction" : "Zero drive torque at the gap";
    result.textContent = polarity
      ? `The + brush feeds end ${polarity > 0 ? "A" : "B"} and the − brush contacts end ${polarity > 0 ? "B" : "A"}. After the contacts swap, each force reverses on a coil side that has moved across the shaft. The turning direction stays the same.`
      : "At the insulating gaps, current and drive torque are momentarily zero. A moving rotor carries through the gap.";
  }

  const buttons = [...panel.querySelectorAll("[data-commutator]")];
  buttons.forEach(button => button.onclick = () => {
    const mode = button.dataset.commutator;
    preview = mode === "live" ? null : Number(mode);
    lastPhase = undefined;
    for (const option of buttons)
      option.setAttribute("aria-pressed", String(option === button));
    draw();
  });
  draw();
  return {
    render(phase) {
      livePhase = phase;
      if (preview === null) draw();
    },
    reveal() {
      panel.scrollIntoView({block: "start"});
      panel.focus({preventScroll: true});
    },
  };
}
