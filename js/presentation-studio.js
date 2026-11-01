/** HTML instrument panels keep scientific values readable at any camera angle.
 * This module never integrates, changes parameters or synthesises measurements. */
import {
  springReadings,
  pendulumReadings,
  smallAngleReference,
} from "./oscillation-physics.js";
const numeric = (v) =>
    !Number.isFinite(v)
      ? "—"
      : v !== 0 && Math.abs(v) < 0.001
        ? v.toExponential(2)
        : Math.abs(v) >= 100
          ? Number(v.toPrecision(4)).toString()
          : v.toFixed(2),
  field = (label, unit, key) =>
    `<div class="instrument-value"><span>${label}</span><strong data-reading="${key}">—</strong><small>${unit}</small></div>`;
export function installPresentationStudio(stage, id) {
  if (!["spring", "pendulum"].includes(id)) return null;
  stage.classList.add("presentation-stage");
  const hud = document.createElement("div");
  hud.className = "instrument-hud";
  hud.setAttribute("aria-label", "Live instrument readings");
  hud.setAttribute("aria-live", "off");
  hud.innerHTML = `<div class="instrument-values">${id === "spring" ? field("Displacement", "m", "position") + field("Velocity", "m/s", "velocity") + field("Acceleration", "m/s²", "acceleration") : field("Angle", "°", "position") + field("Bob speed", "m/s", "velocity") + field("Mechanical energy", "J", "energy")}</div><span class="instrument-context" data-context></span>`;
  stage.querySelector(".scene-container").append(hud);
  const footer = document.createElement("div");
  footer.className = "instrument-footer";
  footer.innerHTML =
    '<div class="instrument-key" aria-label="Vector colour key"></div><div class="energy-ledger" aria-label="Energy budget"><div class="energy-ledger-values"><span><i class="energy-kinetic"></i>Kinetic <strong data-energy="kinetic">—</strong></span><span><i class="energy-potential"></i>Potential <strong data-energy="potential">—</strong></span><span><i class="energy-damping"></i>Damping transfer <strong data-energy="dissipated">—</strong></span></div><div class="energy-ledger-rail"><span class="energy-kinetic" data-segment="kinetic"></span><span class="energy-potential" data-segment="potential"></span><span class="energy-damping" data-segment="dissipated"></span></div></div>';
  stage.querySelector(".transport").before(footer);
  const outputs = Object.fromEntries(
      [...hud.querySelectorAll("[data-reading]")].map((n) => [
        n.dataset.reading,
        n,
      ]),
    ),
    energies = Object.fromEntries(
      [...footer.querySelectorAll("[data-energy]")].map((n) => [
        n.dataset.energy,
        n,
      ]),
    ),
    segments = Object.fromEntries(
      [...footer.querySelectorAll("[data-segment]")].map((n) => [
        n.dataset.segment,
        n,
      ]),
    ),
    context = hud.querySelector("[data-context]"),
    key = footer.querySelector(".instrument-key");
  let lastMode;
  return {
    update(lab) {
      const { state: s, params: p } = lab,
        q = id === "spring" ? springReadings(s, p) : pendulumReadings(s, p),
        motion =
          id === "spring"
            ? lab.oscillationVectors === "motion"
            : lab.oscillationVectors !== "forces";
      outputs.position.textContent = numeric(
        id === "spring" ? s.x : (s.theta * 180) / Math.PI,
      );
      outputs.velocity.textContent = numeric(id === "spring" ? s.v : q.speed);
      if (outputs.acceleration) outputs.acceleration.textContent = numeric(q.a);
      if (outputs.energy) outputs.energy.textContent = numeric(q.total);
      for (const name of ["kinetic", "potential", "dissipated"]) {
        energies[name].textContent = `${numeric(q[name])} J`;
        segments[name].style.width =
          `${q.initial > 0 ? Math.max(0, (q[name] / q.initial) * 100) : 0}%`;
      }
      context.textContent =
        id === "spring"
          ? `${q.regime} · ζ ${q.zeta.toFixed(2)} · T₀ ${q.period.toFixed(2)} s`
          : lab.smallAngleReference
            ? `Dashed purple: small-angle prediction ${numeric((smallAngleReference(p, s.t).theta * 180) / Math.PI)}°`
            : `L ${p.length.toFixed(2)} m · angle measured from downward vertical`;
      const mode = String(motion) + String(lab.vectors);
      if (mode !== lastMode) {
        const items = motion
          ? [
              ["gold", "Velocity"],
              ["purple", "Acceleration"],
            ]
          : id === "spring"
            ? [
                ["cyan", "Spring force"],
                ["red", "Damping force"],
                ["purple", "Net force"],
              ]
            : [
                ["blue", "Weight"],
                ["cyan", "Link force"],
                ["red", "Damping force"],
              ];
        key.innerHTML =
          items
            .map(
              ([color, label]) =>
                `<span><i class="key-${color}"></i>${label}</span>`,
            )
            .join("") +
          `<small>${lab.vectors === false ? "Vectors hidden" : motion ? "Separate vector scales" : "One common force scale"}</small>`;
        lastMode = mode;
      }
    },
  };
}
