import { calculationNumber } from "./calculations.js";

const CENTRE = [100, 100];
const SWEEP = 60;
const TICKS = [-60,-45,-30,-15,0,15,30,45,60];

function dialPoint(radius, angle) {
  const radians = angle * Math.PI / 180;
  return [CENTRE[0] + radius*Math.sin(radians), CENTRE[1] - radius*Math.cos(radians)];
}

export function installGalvanometer(scene) {
  const panel = document.createElement("section");
  panel.className = "galvanometer";
  panel.setAttribute("aria-label", "Galvanometer measuring induced current");
  const start = dialPoint(71,-SWEEP), end = dialPoint(71,SWEEP);
  panel.innerHTML = `
    <div class="galvanometer-heading"><strong>Galvanometer</strong><span>mA</span></div>
    <svg viewBox="0 0 200 111" aria-hidden="true">
      <path class="galvanometer-arc" d="M${start.join(" ")} A71 71 0 0 1 ${end.join(" ")}"/>
      ${TICKS.map(angle => {
        const from = dialPoint(angle%30 === 0 ? 59 : 64, angle);
        const to = dialPoint(71, angle);
        return `<line class="${angle === 0 ? "galvanometer-zero" : "galvanometer-tick"}"
          x1="${from[0]}" y1="${from[1]}" x2="${to[0]}" y2="${to[1]}"/>`;
      }).join("")}
      <text class="galvanometer-min" x="25" y="61">−2</text>
      <text x="100" y="22">0</text>
      <text class="galvanometer-max" x="175" y="61">+2</text>
      <line class="galvanometer-needle" x1="100" y1="103" x2="100" y2="32" transform="rotate(0 100 100)"/>
      <circle class="galvanometer-pivot" cx="100" cy="100" r="5"/>
    </svg>
    <div class="galvanometer-footer">
      <output class="galvanometer-reading" aria-label="Induced current" aria-live="off">0 mA</output>
      <label>Range <select aria-label="Galvanometer current range">
        <option value="2">±2 mA</option><option value="10">±10 mA</option><option value="100">±100 mA</option>
      </select></label>
    </div>
    <small class="galvanometer-limit" hidden>Out of range</small>`;
  scene.append(panel);
  const needle = panel.querySelector(".galvanometer-needle");
  const reading = panel.querySelector(".galvanometer-reading");
  const select = panel.querySelector("select");
  const min = panel.querySelector(".galvanometer-min");
  const max = panel.querySelector(".galvanometer-max");
  const limit = panel.querySelector(".galvanometer-limit");
  let current = 0, lastCurrent, lastRange;
  function draw() {
    const range = Number(select.value);
    if (range === lastRange && current === lastCurrent) return;
    if (range !== lastRange) {
      min.textContent = `−${range}`;
      max.textContent = `+${range}`;
    }
    const fraction = Math.max(-1,Math.min(1,current/range));
    needle.setAttribute("transform",`rotate(${SWEEP*fraction} 100 100)`);
    reading.textContent = `${current > 0 ? "+" : ""}${calculationNumber(current)} mA`;
    limit.hidden = Math.abs(current) <= range;
    lastCurrent = current;
    lastRange = range;
  }
  select.onchange = draw;
  return lab => {
    current = lab.definition.sample(lab.state,lab.params).loadCurrent * 1000;
    draw();
  };
}
