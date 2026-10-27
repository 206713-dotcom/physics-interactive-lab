import { COURSE, COURSE_SCAN } from "./course-map.js";
import { SIMULATIONS } from "./simulations.js";
import { availableModes, resolveMode } from "./learning-paths.js";
export const COURSE_AREAS = [
  "Motion, forces & energy",
  "Thermal physics",
  "Waves & light",
  "Electricity & magnetism",
  "Nuclear physics",
  "Space physics",
];
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const relatedLessons = (id) =>
  COURSE.filter((l) => l.models.includes(id) && !l.review);
export function renderCourse(container) {
  container.innerHTML = `<div class="page-width course-page"><div class="breadcrumb"><a href="#/">The laboratory</a><span>/</span><span>IGCSE course map</span></div><section class="course-hero"><div class="eyebrow">FOCUSPHYSICS · CAMBRIDGE 0625</div><h1>Your entire IGCSE course.<br><em>One interactive laboratory.</em></h1><p>Find your lesson, open an experiment, and connect what you see to the equations. Every original FocusPhysics lesson stays one click away.</p><div class="course-stats"><div><strong>6</strong><span>syllabus areas</span></div><div><strong>78</strong><span>linked lesson pages</span></div><div><strong>${Object.keys(SIMULATIONS).length}</strong><span>working labs in the library</span></div></div></section><div class="course-search-row"><label class="library-search"><span aria-hidden="true">⌕</span><input type="search" id="course-search" aria-label="Search IGCSE lessons" placeholder="Find a lesson, topic or experiment…"></label><span id="course-result-count">78 lesson pages</span></div><nav class="course-area-links" aria-label="IGCSE syllabus areas">${COURSE_AREAS.map((a, i) => `<a href="#course-area-${i + 1}" data-course-jump="${i + 1}"><span>0${i + 1}</span>${a}<small>${COURSE.filter((x) => x.area === i + 1).length} lesson pages ↗</small></a>`).join("")}</nav><p class="course-scope"><strong>Exploration + teaching notes.</strong> A mapped lab demonstrates selected ideas in each lesson; it does not independently simulate every one of the checklist’s 324 statements. Qualitative models, approximations and visual scaling are labelled. Keep using Mr Rowland’s notes, practice and practical work.</p><div class="course-groups">${COURSE_AREAS.map(
    (area, i) =>
      `<section class="course-area" id="course-area-${i + 1}"><div class="course-area-heading"><span>0${i + 1}</span><div><h2>${area}</h2><p>Choose a model, make a prediction, then follow the working.</p></div></div><div class="course-lessons">${COURSE.filter(
        (l) => l.area === i + 1,
      )
        .map(
          (l) =>
            `<article class="course-lesson" data-course-search="${escape((l.title + " " + l.topic + " " + l.models.map((m) => SIMULATIONS[m].title).join(" ")).toLowerCase())}"><div><span class="course-lesson-meta">YEAR ${l.year} · ${l.review ? "REVISION & REVIEW" : "LESSON EXPLORATION"}</span><h3>${escape(l.title)}</h3><a class="course-source" href="${l.url}" target="_blank" rel="noopener">Open original FocusPhysics lesson ↗</a></div><div class="course-model-links">${l.models.map((id) => `<a href="#/${id}?level=${resolveMode(id, "igcse")}" style="--model-accent:${SIMULATIONS[id].color}"><span aria-hidden="true">◉</span>${SIMULATIONS[id].short}${availableModes(id).includes("igcse") ? "" : " · progression"}<span aria-hidden="true">↗</span></a>`).join("")}</div></article>`,
        )
        .join("")}</div></section>`,
  ).join(
    "",
  )}</div><p id="course-empty" hidden>No lesson matches. Try “thermal”, “circuits” or “Moon”.</p><aside class="course-provenance">Course map checked ${COURSE_SCAN.date}: both year hubs, ten topic hubs and 78 lesson pages, including 13 revision/review pages. The <a href="${COURSE_SCAN.checklist}" target="_blank" rel="noopener">0625 checklist ↗</a> links 324 statements to 62 lessons; topic hubs add three practical/extension lessons. Independent student project; no endorsement is implied. <a href="https://github.com/206713-dotcom/physics-interactive-lab/blob/main/IGCSE-COVERAGE.md" target="_blank" rel="noopener">Detailed coverage and limitations ↗</a></aside></div>`;
  container.querySelector(".course-search-row").insertAdjacentHTML(
    "beforebegin",
    `<section class="new-lab-strip"><div class="eyebrow">NEW PRACTICAL LABORATORIES</div><h2>More ways to test the physics.</h2><div>${Object.entries(
      SIMULATIONS,
    )
      .filter(([id, d]) => d.isNew && availableModes(id).includes("igcse"))
      .map(
        ([id, d]) => `<a href="#/${id}?level=igcse">${escape(d.short)} ↗</a>`,
      )
      .join(
        "",
      )}</div><p><a href="#/questions">Also new: 312 original A Level questions, in 26 topic groups ↗</a></p></section>`,
  );
  container
    .querySelector(".course-hero")
    .insertAdjacentHTML(
      "beforebegin",
      '<nav class="course-level-gateway" aria-label="Choose a Cambridge course"><strong>Studying a different level?</strong><a href="#/syllabus?track=igcse">IGCSE learning paths</a><a href="#/syllabus?track=as">AS Level</a><a href="#/syllabus?track=a2">A2 Level</a><a href="#/syllabus?track=enrichment">Enrichment</a></nav>',
    );
  container.querySelector("#course-search").oninput = (e) => {
    const query = e.target.value.trim().toLowerCase();
    let count = 0;
    for (const row of container.querySelectorAll("[data-course-search]")) {
      row.hidden = !row.dataset.courseSearch.includes(query);
      if (!row.hidden) count++;
    }
    for (const group of container.querySelectorAll(".course-area"))
      group.hidden = ![...group.querySelectorAll("[data-course-search]")].some(
        (x) => !x.hidden,
      );
    container.querySelector("#course-result-count").textContent =
      `${count} lesson pages`;
    container.querySelector("#course-empty").hidden = count > 0;
  };
  for (const jump of container.querySelectorAll("[data-course-jump]"))
    jump.onclick = (e) => {
      e.preventDefault();
      container
        .querySelector(`#course-area-${jump.dataset.courseJump}`)
        .scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
          block: "start",
        });
    };
}
