import { buoyancySample, BUOYANCY_STATUS } from "./buoyancy-physics.js";
/** DOM references survive the expanded workspace moving the stage. */
export function installBuoyancyStudio(stage) {
  const panel = document.createElement("section");
  panel.className = "buoyancy-reading";
  panel.setAttribute("aria-label", "Live buoyancy explanation");
  panel.innerHTML = `<div class="buoyancy-heading"><div><span class="section-kicker">FOLLOW THE FORCES</span><h2 data-buoy-status></h2></div><span data-buoy-density></span></div><div class="buoyancy-forces">${[
    ["weight", "Weight ↓", "gold"],
    ["upthrust", "Upthrust ↑", "cyan"],
    ["drag", "Drag · up +", "blue"],
    ["normal", "Support ↑", "purple"],
  ]
    .map(
      ([key, label, color]) =>
        `<div class="force-card ${color}"><span>${label}</span><strong data-force="${key}"></strong><i><b data-bar="${key}"></b></i></div>`,
    )
    .join(
      "",
    )}</div><p class="buoyancy-result" data-buoy-reason></p><div class="buoyancy-detail"><span data-buoy-position></span><span data-buoy-velocity></span><span data-buoy-net></span></div><details><summary>Release conditions & model assumptions</summary><p>The cube starts at rest, with its top 2 cm below the surface. The liquid is 0.50 m deep, with a fixed surface representing a large reservoir. The cube stays upright. Liquid reaches underneath the 5 mm permeable support. Contact is inelastic.</p><p>Upthrust uses the actual submerged volume. Drag uses a fixed coefficient C<sub>d</sub> = 1.05 and an effective viscosity μ = 0.10 Pa·s (a viscous teaching liquid, not water). The linear term is an equivalent-sphere approximation. Surface tension, added mass, waves and turbulent wakes are omitted. The pressure probe is a separate column of the same liquid; it does not change the tank depth.</p><a href="https://openstax.org/books/university-physics-volume-1/pages/14-4-archimedes-principle-and-buoyancy" target="_blank" rel="noopener">Read Archimedes’ principle · OpenStax ↗</a></details>`;
  stage.after(panel);
  const status = panel.querySelector("[data-buoy-status]"),
    density = panel.querySelector("[data-buoy-density]"),
    reason = panel.querySelector("[data-buoy-reason]"),
    position = panel.querySelector("[data-buoy-position]"),
    velocity = panel.querySelector("[data-buoy-velocity]"),
    net = panel.querySelector("[data-buoy-net]"),
    cards = [...panel.querySelectorAll("[data-force]")],
    bars = [...panel.querySelectorAll("[data-bar]")];
  return (s, p) => {
    const q = buoyancySample(s, p),
      max = Math.max(q.weight, q.capacity, 1e-9);
    status.textContent = BUOYANCY_STATUS[q.status];
    density.textContent = `ρobject / ρliquid = ${(p.density / p.fluid).toFixed(3)}`;
    for (const card of cards)
      card.textContent = q[card.dataset.force].toFixed(2) + " N";
    for (const bar of bars)
      bar.style.width =
        Math.min(100, (Math.abs(q[bar.dataset.bar]) / max) * 100) + "%";
    reason.textContent =
      q.normal > 0
        ? `The cube sank. Upthrust (${q.upthrust.toFixed(2)} N) is less than weight (${q.weight.toFixed(2)} N). The support now provides ${q.normal.toFixed(2)} N, so the resultant force is zero.`
        : p.density > p.fluid
          ? "This cube is denser than the liquid. Even fully submerged, upthrust cannot balance its weight: it sinks. Drag opposes the motion."
          : p.density === p.fluid
            ? "Equal densities: a fully submerged cube at rest displaces its own weight of liquid. Upthrust balances weight, so it remains suspended."
            : `This cube is less dense than the liquid. It rises from the release point, then settles with ${((100 * p.density) / p.fluid).toFixed(1)}% of its volume submerged. Compare this prediction with the current immersion.`;
    position.textContent = `Immersed: ${q.immersion.toFixed(1)}% · centre depth: ${q.depth.toFixed(3)} m`;
    velocity.textContent = `v = ${q.v.toFixed(3)} m/s · a = ${q.a.toFixed(3)} m/s²`;
    net.textContent = `U + D + N − W = ${q.net.toFixed(3)} N (up +)`;
  };
}
