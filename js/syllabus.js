import { SIMULATIONS } from "./simulations.js";
import {
  LEARNING_PATHS,
  SYLLABUS_SOURCES,
  SYLLABUS_SECTIONS,
  CHECKED_DATE,
  stageFor,
  syllabusLink,
} from "./learning-paths.js";
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const AREAS = [
  "Motion, forces & energy",
  "Thermal physics",
  "Waves & light",
  "Electricity & magnetism",
  "Nuclear physics",
  "Space physics",
];
const TOPICS = [
  "Quantities & measurement",
  "Kinematics",
  "Dynamics",
  "Forces, density & pressure",
  "Work, energy & power",
  "Materials",
  "Waves",
  "Superposition",
  "Electrical quantities",
  "DC circuits",
  "Particles & nuclei",
  "Circular motion",
  "Gravitation",
  "Temperature & thermal properties",
  "Ideal gases",
  "Thermodynamics",
  "Oscillations",
  "Electric fields",
  "Capacitors",
  "Magnetic fields",
  "Alternating current",
  "Quantum physics",
  "Nuclear physics",
  "Medical imaging",
  "Astronomy & cosmology",
];
export function renderSyllabus(container, query = new URLSearchParams()) {
  let track = ["igcse", "alevel", "as", "a2", "enrichment"].includes(
      query.get("track"),
    )
      ? query.get("track")
      : "igcse",
    cycle = query.get("cycle") === "next" ? "next" : "current",
    search = query.get("search") || "";
  function render() {
    const mode =
        track === "igcse"
          ? "igcse"
          : track === "enrichment"
            ? "enrichment"
            : "alevel",
      source =
        mode === "igcse"
          ? SYLLABUS_SOURCES.igcse
          : cycle === "next"
            ? SYLLABUS_SOURCES.alevelNext
            : SYLLABUS_SOURCES.alevel,
      entries = Object.entries(LEARNING_PATHS).filter(
        ([id, profiles]) =>
          profiles[mode] &&
          ((track !== "as" && track !== "a2") ||
            stageFor(profiles[mode]).includes(track.toUpperCase())),
      ),
      sections =
        mode === "igcse"
          ? SYLLABUS_SECTIONS.igcse
          : mode === "enrichment"
            ? {}
            : SYLLABUS_SECTIONS[cycle === "next" ? "alevelNext" : "alevel"],
      refs = Object.keys(sections).filter(
        (ref) =>
          mode !== "alevel" ||
          track === "alevel" ||
          (Number(ref.split(".")[0]) <= 11 ? track === "as" : track === "a2"),
      ),
      missing = refs.filter(
        (ref) =>
          !entries.some(([, p]) =>
            p[mode].refs.some((r) => r === ref || r.startsWith(ref + ".")),
          ),
      ),
      title =
        mode === "igcse"
          ? "IGCSE Extended"
          : track === "as"
            ? "AS Level"
            : track === "a2"
              ? "A2 Level"
              : track === "alevel"
                ? "AS & A Level"
                : "Enrichment";
    container.innerHTML = `<div class="page-width syllabus-page"><div class="breadcrumb"><a href="#/">The laboratory</a><span>/</span><span>Cambridge learning paths</span></div><section class="syllabus-hero"><div class="eyebrow">ONE MODEL · THE RIGHT DEPTH</div><h1>Choose your level.<br><em>Learn the physics that matters.</em></h1><p>Shared topics use the same accurate simulation with different objectives, investigations, worked questions and calculation focus. A model only gets a second mode when it supports that course.</p></section><nav class="syllabus-track" aria-label="Physics learning path">${[
      ["igcse", "IGCSE · 0625"],
      ["as", "AS · 9702"],
      ["a2", "A2 · 9702"],
      ["alevel", "All AS / A Level"],
      ["enrichment", "Enrichment"],
    ]
      .map(
        ([key, text]) =>
          `<button data-track="${key}" aria-pressed="${key === track}">${text}</button>`,
      )
      .join(
        "",
      )}</nav><section class="syllabus-selection"><div><span class="section-kicker">YOUR LEARNING PATH</span><h2>${title}</h2><p>${entries.length} related laboratories ${mode === "enrichment" ? "· beyond required syllabus outcomes" : `· ${source.name} · ${source.years}`}</p></div>${mode === "alevel" ? `<label>Syllabus edition<select id="syllabus-cycle"><option value="current" ${cycle === "current" ? "selected" : ""}>Exams 2025–2027</option><option value="next" ${cycle === "next" ? "selected" : ""}>Exams 2028–2030</option></select></label>` : ""}<label class="library-search"><input type="search" id="path-search" aria-label="Search learning paths" placeholder="Try forces, energy, waves…" value="${esc(search)}"></label></section><p class="syllabus-boundary">${mode === "igcse" ? "<strong>Extended means Core + Supplement.</strong> The modes do not claim that every displayed equation is IGCSE content." : mode === "enrichment" ? "<strong>Extra exploration.</strong> These are not additional compulsory Cambridge topics." : "<strong>AS and A2 are separate stages.</strong> AS content supplies prerequisites for the full A Level."} References identify selected sections supported by a model; they are not a claim that every outcome or practical skill in that section is covered.</p><div id="path-results">${entries
      .map(([id, profiles]) => {
        const p = profiles[mode],
          d = SIMULATIONS[id];
        return `<article class="path-card" data-path-search="${esc([d.title, p.focus, ...p.goals, ...p.refs].join(" ").toLowerCase())}"><div><span class="path-stage">${mode === "alevel" ? stageFor(p).join(" + ") : title}</span><h3>${esc(d.short)}</h3><p>${esc(p.focus)}</p><ul>${p.goals.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></div><div class="path-card-bottom"><span>${p.refs.map((r) => "§" + r).join(" · ") || "Beyond the syllabus"}</span><a class="button" href="#/${id}?level=${mode}&cycle=${cycle}">Open ${mode === "igcse" ? "IGCSE" : mode === "alevel" ? stageFor(p).join(" / ") : "enrichment"} mode ↗</a></div></article>`;
      })
      .join(
        "",
      )}</div><p id="path-empty" hidden>No matching model in this path. Try a different level or search term.</p>${mode === "igcse" ? '<a class="focusphysics-course-link" href="#/course">Open the original FocusPhysics lesson map · 78 linked lesson pages ↗</a>' : ""}${
      mode !== "enrichment"
        ? `<details class="syllabus-gaps"><summary>Section map & current gaps · ${missing.length} section references have no linked model</summary><p>A linked model supports selected outcomes only. An unlinked section needs other learning resources; even linked sections can contain outcomes this lab does not demonstrate.</p><div>${refs
            .map((ref) => {
              const models = entries.filter(([, ps]) =>
                ps[mode].refs.some((r) => r === ref || r.startsWith(ref + ".")),
              );
              return `<article><a href="${syllabusLink(mode, ref, cycle)}" target="_blank" rel="noopener">§${ref} · ${mode === "igcse" ? AREAS[Number(ref.split(".")[0]) - 1] : TOPICS[Number(ref.split(".")[0]) - 1]} ↗</a><span>${models.length ? models.map(([id]) => esc(SIMULATIONS[id].short)).join(" · ") : "No dedicated model linked"}</span></article>`;
            })
            .join("")}</div></details>`
        : ""
    }<aside class="syllabus-sources"><h2>Checked against Cambridge’s published syllabuses</h2><p>References checked ${CHECKED_DATE}. The 9702 section identifiers were checked in both editions. Teaching text and questions here are original. Cambridge has not endorsed this project.</p>${Object.values(
      SYLLABUS_SOURCES,
    )
      .map(
        (s) =>
          `<a href="${s.url}" target="_blank" rel="noopener">${s.name} · ${s.years} · version ${s.version} ↗</a>`,
      )
      .join(
        "",
      )}<p>Practical and data-handling work matters at both levels. Use the laboratory notebook to record model predictions, identify controls and analyse graphs. Supervised practical work is still needed; simulations do not create experimental measurements.</p></aside></div>`;
    const apply = () => {
      const q = search.trim().toLowerCase();
      let count = 0;
      for (const card of container.querySelectorAll("[data-path-search]")) {
        card.hidden = !card.dataset.pathSearch.includes(q);
        if (!card.hidden) count++;
      }
      container.querySelector("#path-empty").hidden = count > 0;
    };
    container.querySelector("#path-search").oninput = (e) => {
      search = e.target.value;
      apply();
    };
    apply();
    const sync = () =>
      history.replaceState(
        null,
        "",
        `#/syllabus?track=${track}&cycle=${cycle}`,
      );
    container.querySelectorAll("[data-track]").forEach(
      (b) =>
        (b.onclick = () => {
          track = b.dataset.track;
          sync();
          render();
        }),
    );
    container
      .querySelector("#syllabus-cycle")
      ?.addEventListener("change", (e) => {
        cycle = e.target.value;
        sync();
        render();
      });
  }
  render();
}
