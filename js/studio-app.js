/** Shared application shell for the simulation catalogue. Rendering never advances physics. */
import { SIMULATIONS, CATEGORIES, spatialRows } from "./simulations.js";
import { LESSONS as ORIGINAL_LESSONS } from "./content.js";
import { EXTRA_LESSONS } from "./content-extra.js";
import { ADVANCED_LESSONS } from "./content-advanced.js";
import { ADVANCED_IDS } from "./physics-advanced.js";
import { CURRICULUM_LESSONS } from "./content-curriculum.js";
import { curriculumThumbnail } from "./render-curriculum.js";
import { renderCourse, relatedLessons } from "./course.js";
import { renderQuestionBank } from "./question-bank.js";
import { QUESTION_GROUPS } from "./question-data.js";
import { draw2D } from "./render2d.js";
import { ExpandedView } from "./expanded-view.js";
import { SCENE_GUIDES } from "./scene-guides.js";
import { visualState } from "./visual-state.js";
import { VectorStudio } from "./vector-studio.js";
import { installBuoyancyStudio } from "./buoyancy-studio.js";
import { LearningStudio, levelBadges } from "./learning-studio.js";
import {
  availableModes,
  resolveMode,
  getProfile,
  stageFor,
} from "./learning-paths.js";
import { renderSyllabus } from "./syllabus.js";
import { experimentLink } from "./integration.js";
import {
  createOrbit,
  stepOrbit,
  ORBIT_DEFAULTS,
  circularSpeed,
  escapeSpeed,
  orbitInfo,
  centralRadius,
} from "./physics.js";
const LESSONS = {
  ...ORIGINAL_LESSONS,
  ...EXTRA_LESSONS,
  ...ADVANCED_LESSONS,
  ...CURRICULUM_LESSONS,
};
const LAB_COUNT = Object.keys(SIMULATIONS).length;
const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const embedded = new URLSearchParams(location.search).get("embed") === "1";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (n, d = 2) =>
  typeof n !== "number"
    ? String(n ?? "—")
    : !Number.isFinite(n)
      ? "—"
      : Math.abs(n) >= 1e6 || (Math.abs(n) > 0 && Math.abs(n) < 0.001)
        ? n.toExponential(2)
        : n.toLocaleString("en", {
            maximumFractionDigits:
              Math.abs(n) > 0 && Math.abs(n) < 0.01 ? Math.max(4, d) : d,
            minimumFractionDigits:
              Math.abs(n) > 0 && Math.abs(n) < 0.01 ? Math.max(4, d) : d,
          });
const icons = {
  play: '<path d="m6 3 9 6-9 6z"/>',
  pause: '<path d="M6 4v10M12 4v10"/>',
  reset: '<path d="M3 8a6 6 0 1 1 1 6M3 3v5h5"/>',
  arrow: '<path d="M3 9h12m-5-5 5 5-5 5"/>',
  download: '<path d="M9 2v10m-4-4 4 4 4-4M3 13v3h12v-3"/>',
  share: '<path d="M6 9h9m-4-4 4 4-4 4M8 3H3v12h5"/>',
  expand: '<path d="M6 2H2v4m10-4h4v4M2 12v4h4m10-4v4h-4"/>',
  step: '<path d="m3 4 8 5-8 5zM14 4v10"/>',
  record: '<circle cx="9" cy="9" r="5"/>',
  cube: '<path d="m9 1 7 4v8l-7 4-7-4V5zM2 5l7 4 7-4M9 9v8"/>',
};
const icon = (n) =>
  `<svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[n]}</svg>`;
let lab = null,
  vectorStudio = null,
  buoyancyUpdate = null,
  learningStudio = null,
  expandedView = null,
  hero = null,
  view = null,
  heroView = null,
  charts = [],
  lastFrame = 0,
  toastTimer,
  routeToken = 0,
  viewToken = 0;
const COLORS = ["#098d90", "#6978da", "#c38227"];
const SERIES_COLORS = {
  incident: COLORS[1],
  reflected: COLORS[2],
  resultant: COLORS[0],
  speedA: "#bd862b",
  speedB: "#1687aa",
  speedC: "#9562cb",
  r12: "#bd862b",
  r13: "#9562cb",
  r23: "#1687aa",
  theta1: "#bd862b",
  theta2: COLORS[0],
  omega2: COLORS[0],
  divergence: "#9562cb",
  v1: COLORS[0],
  v2: COLORS[2],
  intensity: COLORS[0],
  envelope: COLORS[2],
};
const stored = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 4500);
}
function thumbnail(id) {
  if (SIMULATIONS[id]?.curriculum) return curriculumThumbnail(id);
  const drawing = {
    binary:
      '<ellipse cx="140" cy="90" rx="75" ry="44" transform="rotate(-20 140 90)"/><ellipse cx="222" cy="90" rx="115" ry="65" transform="rotate(-20 222 90)" opacity=".3"/><circle cx="109" cy="101" r="24" fill="#ffcc84"/><circle cx="294" cy="50" r="16" fill="#8edfff"/><path d="M181 77v16m-8-8h16" stroke="#fff"/>',
    threebody:
      '<path d="M190 85c-130-145-190 145 0 0s130 145 0 0" stroke-width="2.5"/><circle cx="105" cy="48" r="14" fill="#ffcc84"/><circle cx="269" cy="126" r="12" fill="#86dfff"/><circle cx="190" cy="85" r="13" fill="#d0a3ff"/>',
    doublependulum:
      '<path d="m173 25 60 63-30 50" stroke="#d5e7ef" stroke-width="3"/><path d="m173 25 42 75 48 35" stroke="#b59aff" opacity=".4"/><circle cx="233" cy="88" r="13" fill="#ffcc84"/><circle cx="203" cy="138" r="14" fill="currentColor"/><path d="M84 119q50-90 119 19t95-45" opacity=".4"/><path d="M148 24h50" stroke-width="5"/>',
    spring:
      '<path d="M48 80h35l8-20 14 40 14-40 14 40 14-40 14 40 14-40 14 40 14-40 12 20h28"/><rect x="233" y="54" width="50" height="50" rx="8" fill="currentColor" opacity=".8"/><path d="M40 108h295M48 40v70" opacity=".3"/>',
    gravity:
      '<ellipse cx="191" cy="83" rx="123" ry="48" transform="rotate(-20 191 83)"/><circle cx="181" cy="87" r="27" fill="currentColor" opacity=".23"/><ellipse cx="181" cy="87" rx="27" ry="10" opacity=".3"/><circle cx="303" cy="45" r="7" fill="currentColor"/><path d="m307 47 18 24m-1-10 1 10-10-3" stroke="#ffcd84"/>',
    pendulum:
      '<path d="M187 27v107" opacity=".25" stroke-dasharray="4 5"/><path d="m187 27 66 91" stroke="#c7dce6"/><circle cx="253" cy="118" r="19" fill="currentColor"/><path d="M124 117q63 47 129 1" opacity=".35"/><path d="M156 26h62" stroke-width="4"/>',
    projectile:
      '<path d="M45 133h300" opacity=".3"/><path d="M56 129Q190-40 330 129" stroke-dasharray="4 5" opacity=".35"/><path d="M56 129Q123 27 194 38" stroke-width="3"/><circle cx="194" cy="38" r="9" fill="currentColor"/><path d="m201 40 36 4m-8-7 8 7-10 4" stroke="#ffcd84"/>',
    collisions:
      '<path d="M40 117h310" opacity=".3"/><rect x="82" y="74" width="67" height="37" rx="7" fill="currentColor"/><rect x="239" y="74" width="67" height="37" rx="7" fill="#ffcd84"/><path d="M114 55h58m-8-6 8 6-8 6M271 55h-40m8-6-8 6 8 6"/>',
    waves:
      '<path d="M35 85h320" opacity=".2"/><path d="M35 85q20-68 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0" stroke-width="2.5"/><path d="M35 85q20-30 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0" stroke="#ffcc85" opacity=".5"/>',
    interference:
      '<path d="M105 25v40m0 12v20m0 12v40M298 20v134" stroke="#698eaa" stroke-width="5"/><path d="M108 72q65 0 180-40M108 103q60 0 180 40M108 72q65 0 180 72M108 103q60 0 180-72" opacity=".35"/><path d="M303 35v12m0 13v12m0 9v16m0 9v12m0 9v12" stroke-width="8"/>',
    refraction:
      '<path d="M25 86h330M190 20v132" opacity=".3"/><path d="m91 20 99 66 50 67" stroke-width="3"/><path d="m190 86 99-66" stroke="#ffce87" opacity=".6"/><path d="M26 88h328v67H26z" fill="currentColor" opacity=".08"/>',
    circuits:
      '<path d="M80 75V35h200v39M80 99v39h200V99"/><path d="M60 75h40M68 99h24M255 75h50M255 99h50" stroke-width="4"/><path d="m150 35 7-10 13 20 13-20 13 20 7-10" stroke="#ffcc84" stroke-width="2"/>',
    fields:
      '<path d="M104 82q85-100 170 0M104 82q85 100 170 0M104 82q85-55 170 0M104 82q85 55 170 0M104 82h170" opacity=".65"/><circle cx="103" cy="82" r="18" fill="#ff8aaa"/><circle cx="275" cy="82" r="18" fill="#8dabff"/><path d="M96 82h14m-7-7v14M268 82h14" stroke="#fff"/>',
  }[id];
  return `<svg viewBox="0 0 390 170" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${drawing}</svg>`;
}
function card(id, preferredMode) {
  const d = SIMULATIONS[id];
  return `<a class="simulation-card" href="#/${id}?level=${resolveMode(id, typeof preferredMode === "string" ? (preferredMode === "as" || preferredMode === "a2" ? "alevel" : preferredMode) : null)}" style="--accent:${d.color}"><div class="card-art">${thumbnail(id)}<span class="art-label">${d.category.toUpperCase()}</span><span class="card-dimension">${d.diagramOnly ? "INTERACTIVE DIAGRAM" : icon("cube") + " 3D + 2D"}</span></div><div class="card-body"><div class="card-meta">${levelBadges(id)}${d.isNew ? '<span class="new-lab-badge">NEW</span>' : ""}</div><h3>${d.short}</h3><p>${d.summary}</p><div class="card-bottom"><span class="card-equation">${d.formula}</span><span>Explore ${icon("arrow")}</span></div></div></a>`;
}
function home() {
  $("#main").innerHTML =
    `<section class="hero"><div class="hero-copy"><div class="eyebrow"><span class="status-dot"></span> YOUR PHYSICS PLAYGROUND, IN 3D</div><h1>See the invisible.<br><em>Understand<br>the incredible.</em></h1><p>From the swing of a pendulum to the dance of an orbit. Step inside the physics, change the variables, and find your own answers.</p><div class="hero-actions"><a class="button" href="#simulations">Explore all ${LAB_COUNT} experiments ${icon("arrow")}</a><a class="hero-link" href="#/gravity">Enter the 3D orbit studio ↗</a></div><div class="hero-stats"><div><strong>${LAB_COUNT}</strong><span>interactive experiments</span></div><div><strong>${LAB_COUNT * 5}</strong><span>questions with answers</span></div><div><strong>${LAB_COUNT * 3}</strong><span>guided investigations</span></div></div></div><div class="hero-art"><canvas id="hero-canvas" tabindex="0" aria-label="Interactive 3D orbital preview. Drag to rotate, scroll to zoom, arrow keys to rotate, plus and minus to zoom."></canvas><div id="hero-fallback" hidden>${thumbnail("gravity")}</div><div class="hero-view-tag">${icon("cube")} THE ORBIT STUDIO <span>LIVE MODEL</span></div><div class="hero-art-label">Drag to orbit · Scroll to zoom<br><span>Planet appearance and satellite size illustrative</span></div><div class="hero-formula">F = <span>GMm</span> / r²</div></div></section><div class="page-width"><section id="simulations" class="catalogue"><div class="section-heading"><div><div class="eyebrow">FOLLOW YOUR CURIOSITY</div><h2>What will you discover today?</h2><p>A complete experiment in every card. Make a prediction, then put it to the test.</p></div><label class="library-search"><span aria-hidden="true">⌕</span><input type="search" id="search" aria-label="Search simulations" placeholder="Find an experiment…"></label></div><div class="catalogue-tools"><div class="category-filters" aria-label="Filter simulations">${CATEGORIES.map((c, i) => `<button class="${i === 0 ? "active" : ""}" data-category="${c}" aria-pressed="${i === 0}">${c}</button>`).join("")}</div><span id="result-count">${LAB_COUNT} experiments</span></div><div class="simulation-grid" id="cards">${Object.keys(SIMULATIONS).map(card).join("")}</div><p id="empty-results" hidden>No experiments match that search. Try a topic such as waves, light or motion.</p></section><section class="method-band"><div><div class="eyebrow">MORE THAN AN ANIMATION</div><h3>A little curiosity.<br>A deeper understanding.</h3></div>${[
      [
        "01",
        "Predict it.",
        "Use a guided experiment to ask a better “what if?”",
      ],
      [
        "02",
        "Test it.",
        "Change one parameter. Read live graphs. Save a measurement.",
      ],
      [
        "03",
        "Explain it.",
        "Connect what you see to equations and worked answers.",
      ],
    ]
      .map(
        ([n, title, t]) =>
          `<div class="method-item"><span class="number">${n}</span><div><strong>${title}</strong><p>${t}</p></div></div>`,
      )
      .join(
        "",
      )}</section><p class="home-note"><strong>Real models. Clear assumptions.</strong> Every experiment runs locally in your browser. Rotate the 3D camera without changing the physics, switch to a calibrated 2D diagram, and export calculated data. Built for IGCSE and A Level exploration.</p></div>`;
  $(".catalogue").insertAdjacentHTML(
    "beforebegin",
    '<section class="curriculum-banner"><div><div class="eyebrow">NEW · THE COMPLETE IGCSE COURSE MAP</div><h2>Find your lesson. Open its experiment.</h2><p>78 FocusPhysics lesson pages · all six syllabus areas · original resources linked.</p></div><a class="button" href="#/course">Explore the IGCSE course ↗</a></section>',
  );
  $(".catalogue").insertAdjacentHTML(
    "beforebegin",
    '<section class="curriculum-banner question-banner"><div><div class="eyebrow">NEW · 312 ORIGINAL QUESTIONS · 26 TOPIC GROUPS</div><h2>Turn your experiments into understanding.</h2><p>A Level calculations, explanations, hints and worked solutions. Save your progress and print a practice set.</p></div><a class="button" href="#/questions">Enter the practice room ↗</a></section>',
  );
  let category = "All experiments";
  $(".catalogue-tools").insertAdjacentHTML(
    "afterbegin",
    '<label class="catalogue-level">Learning level <select id="library-level" aria-label="Filter simulations by learning level"><option value="all">All levels</option><option value="igcse">IGCSE · 0625</option><option value="as">AS · 9702</option><option value="a2">A2 · 9702</option><option value="enrichment">Enrichment</option></select></label>',
  );
  const filter = () => {
    const q = $("#search").value.toLowerCase().trim(),
      entries = Object.entries(SIMULATIONS).filter(
        ([id, d]) =>
          (category === "All experiments" || d.category === category) &&
          ($("#library-level").value === "all" ||
            (availableModes(id).includes(
              ["as", "a2"].includes($("#library-level").value)
                ? "alevel"
                : $("#library-level").value,
            ) &&
              (!["as", "a2"].includes($("#library-level").value) ||
                stageFor(getProfile(id, "alevel")).includes(
                  $("#library-level").value.toUpperCase(),
                )))) &&
          `${d.title} ${d.category} ${d.summary}`.toLowerCase().includes(q),
      );
    $("#cards").innerHTML = entries
      .map(([id]) => card(id, $("#library-level").value))
      .join("");
    $("#result-count").textContent =
      `${entries.length} experiment${entries.length === 1 ? "" : "s"}`;
    $("#empty-results").hidden = entries.length > 0;
  };
  $("#search").oninput = filter;
  $("#library-level").onchange = filter;
  $$("[data-category]").forEach(
    (b) =>
      (b.onclick = () => {
        category = b.dataset.category;
        $$("[data-category]").forEach((btn) => {
          btn.classList.toggle("active", btn === b);
          btn.setAttribute("aria-pressed", String(btn === b));
        });
        filter();
      }),
  );
  const params = { ...ORBIT_DEFAULTS, velocity: circularSpeed(ORBIT_DEFAULTS) };
  hero = {
    type: "gravity",
    ...createOrbit(params),
    trail: [],
    showTrail: true,
    vectors: true,
    showLabels: true,
    guideStep: 0,
  };
  const token = routeToken;
  import("./scene3d.js")
    .then(({ SceneView }) => {
      if (token !== routeToken || !$("#hero-canvas")) return;
      try {
        heroView = new SceneView($("#hero-canvas"));
        heroView.azimuth = -0.5;
        heroView.polar = 0.9;
        heroView.radius = 14;
      } catch {
        $("#hero-canvas").hidden = true;
        $("#hero-fallback").hidden = false;
      }
    })
    .catch(() => {
      if (token === routeToken) {
        $("#hero-canvas").hidden = true;
        $("#hero-fallback").hidden = false;
      }
    });
}
function controlMarkup(d, p) {
  if (d.options)
    return `<div class="control"><label class="control-label" for="${d.key}-select">${d.label}</label><select class="parameter-select" id="${d.key}-select" aria-label="${d.label}">${d.options.map(([v, label]) => `<option value="${v}" ${Number(v) === p[d.key] ? "selected" : ""}>${label}</option>`).join("")}</select><p class="control-hint">${d.hint}</p></div>`;
  const value = p[d.key] / (d.factor || 1),
    slider = d.log ? Math.log10(value) : value;
  return `<div class="control"><div class="control-label"><label for="${d.key}-slider">${d.label}</label><span class="value-input"><input id="${d.key}-number" type="number" aria-label="${d.label} in ${d.unit || "dimensionless units"}" value="${d.log ? value.toExponential(2) : Number(value.toFixed(5))}" min="${d.log ? 100 : d.min}" max="${d.log ? 1e23 : d.max}" step="any"><span>${d.unit}</span></span></div><input type="range" id="${d.key}-slider" aria-label="${d.label}" min="${d.min}" max="${d.max}" step="${d.step}" value="${slider}"><div class="slider-ends"><span>${d.log ? "10²" : d.min}</span><span>${d.log ? "10²³" : d.max}</span></div><p class="control-hint">${d.hint}</p></div>`;
}
function labPage(type, query) {
  const d = SIMULATIONS[type];
  const studyMode = resolveMode(
      type,
      query.get("level") || stored("physics-study-mode", null),
    ),
    syllabusCycle = query.get("cycle") === "next" ? "next" : "current";
  let params = { ...d.defaults, ...getProfile(type, studyMode).setup },
    invalid = false;
  for (const key of Object.keys(params))
    if (query.has(key))
      params[key] = query.get(key) === "" ? NaN : Number(query.get(key));
  try {
    d.create(params);
  } catch {
    params = { ...d.defaults };
    invalid = true;
  }
  lab = {
    type,
    studyMode,
    syllabusCycle,
    definition: d,
    ...d.create(params),
    running: type !== "vectors" && !embedded && !reduced(),
    speed: 1,
    accumulator: 0,
    previousState: null,
    history: [],
    trail: [],
    showTrail: true,
    vectors: true,
    showLabels: true,
    vectorMethod: ["triangle", "parallelogram", "components"].includes(
      query.get("method"),
    )
      ? query.get("method")
      : "triangle",
    vectorProgress: 1,
    vectorGrid: query.get("grid") !== "0",
    vectorAngle: query.get("angleMarker") !== "0",
    vectorComponents: query.get("components") === "1",
    graph: d.graphs.some((g) => g.id === query.get("graph"))
      ? query.get("graph")
      : (type === "vectors"
          ? d.graphs.find((g) => g.keys.includes("resultant"))?.id
          : null) || d.graphs[0].id,
    nextSample: 0,
    lastUI: -1,
    ended: null,
    graphDirty: true,
    view: ["2d", "3d"].includes(query.get("view"))
      ? query.get("view")
      : d.curriculum
        ? "3d"
        : stored("physics-view", "3d"),
    notebook: stored(`physics-notebook-${type}`, []),
  };
  if (!Array.isArray(lab.notebook)) lab.notebook = [];
  $("#main").innerHTML =
    `<div class="page-width lab-page"><div class="breadcrumb"><a href="#/">The laboratory</a><span>/</span><span>${d.category}</span><span>/</span><span>${d.short}</span></div><div class="lab-title-row"><div><div class="eyebrow"><span class="subject-dot" style="background:${d.color}"></span>${d.category.toUpperCase()} <span class="pill">${levelBadges(type)}</span></div><h1>${d.title}</h1><p>${d.summary}</p></div><div class="toolbar-buttons"><button class="small-button" id="share">${icon("share")} Share setup</button><button class="small-button" id="export">${icon("download")} Export data</button></div></div><div class="lab-grid"><aside class="panel controls" aria-label="Simulation parameters"><div class="controls-heading"><h2>Your experiment</h2><span>01 / SET UP</span></div>${d.controls.map((c) => controlMarkup(c, params)).join("")}<p id="control-error" class="control-error" role="alert"></p><div class="preset-block"><h3 class="panel-label">Start with a scenario</h3><div class="preset-row">${d.presets.map(([name], i) => `<button class="preset-button" data-preset="${i}" aria-pressed="false">${name}</button>`).join("")}</div></div><p class="control-footnote">A parameter change starts a fresh run.<br>All graphs use the calculated state.</p><button class="model-shortcut" id="model-shortcut">See the physics behind it ↓</button></aside><div class="workspace"><section class="stage" id="stage" aria-label="Interactive simulation studio"><div class="stage-top"><span class="running-status"><span class="status-dot"></span><span id="run-status">RUNNING</span></span><div class="stage-views" aria-label="View mode"><button data-view="3d" aria-pressed="true">${icon("cube")} 3D</button><button data-view="2d" aria-pressed="false">2D diagram</button><button id="fullscreen" aria-label="Fullscreen simulation">${icon("expand")}</button></div></div><div class="camera-toolbar" id="camera-toolbar" aria-label="3D camera presets"><div><button data-camera="perspective" aria-pressed="true">Perspective</button><button data-camera="front" aria-pressed="false">Front</button><button data-camera="above" aria-pressed="false">Above</button></div><label><input type="checkbox" id="scene-labels" checked> Labels</label></div><div class="scene-container"><canvas id="scene-3d" tabindex="0" role="img" aria-label="Interactive 3D ${d.short}. Drag to rotate, scroll to zoom. Arrow keys rotate, plus and minus zoom, zero resets the camera."></canvas><canvas id="simulation" role="img" aria-label="Calibrated 2D ${d.short} diagram" hidden></canvas><div class="scene-camera-hint" id="camera-hint">DRAG TO ROTATE <span>·</span> SCROLL TO ZOOM</div><div class="scene-equation">${d.formula}</div><button class="camera-reset" id="camera-reset" aria-label="Reset 3D camera">${icon("reset")}</button></div><div class="transport"><button id="play" class="play-button">${icon("pause")} Pause</button><button id="step" class="reset-button" aria-label="Advance one frame">${icon("step")} Step</button><button id="reset" class="reset-button">${icon("reset")} Reset</button><span id="time-readout" class="time-readout"></span><label class="speed-select">Speed <select id="speed" aria-label="Simulation speed"><option value=".25">0.25×</option><option value=".5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select></label></div></section><p class="stage-caption" id="stage-caption">${d.caption}</p><div class="live-metrics" id="metrics"></div><section class="panel graph-panel" aria-label="Live graphs"><div class="graph-header"><div><span class="section-kicker">02 / OBSERVE</span><h2>Follow the evidence.</h2></div><div class="segmented" aria-label="Graph selection">${d.graphs.map((g) => `<button data-graph="${g.id}" aria-pressed="${g.id === lab.graph}" class="${g.id === lab.graph ? "active" : ""}">${g.label}</button>`).join("")}</div></div><div class="stage-options"><label><input id="vectors" type="checkbox" checked> Vectors / indicators</label>${["gravity", "pendulum", "projectile", ...ADVANCED_IDS].includes(type) ? '<label><input id="trail" type="checkbox" checked> Motion trail</label>' : ""}<span id="graph-mode-label"></span></div><div id="plots"></div><div class="energy-summary" id="energy-summary"></div><p class="graph-note" id="graph-note"></p></section><div class="insight-strip"><span>TRY THIS</span><p>${d.insight}</p><button id="record" class="small-button">${icon("record")} Record reading</button></div><details class="notebook panel"><summary>Your lab notebook <span id="notebook-count">0 readings</span></summary><div id="notebook-content"></div></details></div></div><section class="lesson-area" id="lesson-area"><div class="lesson-intro"><span class="section-kicker">03 / UNDERSTAND</span><h2>Make the connection.</h2></div><div class="lesson-tabs" role="tablist" aria-label="Learning resources">${[
      ["learn", "Understand the physics"],
      ["experiments", "Guided experiments"],
      ["questions", "Test your understanding"],
      ["model", "Equations & model"],
    ]
      .map(
        ([key, label], i) =>
          `<button role="tab" id="tab-${key}" data-lesson="${key}" aria-controls="lesson-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${label}</button>`,
      )
      .join(
        "",
      )}</div><div class="lesson-content" id="lesson-panel" role="tabpanel" aria-labelledby="tab-learn" tabindex="0"></div></section><div class="next-experiments"><span>KEEP EXPLORING</span>${Object.entries(
      SIMULATIONS,
    )
      .filter(([id, v]) => id !== type && v.category === d.category)
      .slice(0, 2)
      .map(([id, v]) => `<a href="#/${id}">${v.short} ${icon("arrow")}</a>`)
      .join("")}<a href="#/">All experiments ${icon("arrow")}</a></div></div>`;
  if (
    !d.curriculum &&
    ![
      "spring",
      "gravity",
      "projectile",
      "collisions",
      "fields",
      ...ADVANCED_IDS,
    ].includes(type)
  )
    $("#vectors").closest("label").hidden = true;
  bindControls();
  $(".lab-page").dataset.model = type;
  const mappedLessons = relatedLessons(type);
  const practiceGroup = QUESTION_GROUPS.find((group) => group.model === type);
  if (practiceGroup)
    $(".lab-title-row").insertAdjacentHTML(
      "afterend",
      `<aside class="lesson-course-links"><a href="#/questions?topic=${practiceGroup.id}">Practise ${esc(practiceGroup.title.toLowerCase())} · 12 A Level questions with worked answers ↗</a></aside>`,
    );
  if (mappedLessons.length)
    $(".lab-title-row").insertAdjacentHTML(
      "afterend",
      `<aside class="lesson-course-links"><p>Explore the model, then return to the original FocusPhysics lesson.</p><div>${mappedLessons
        .slice(0, 8)
        .map(
          (l) =>
            `<a href="${l.url}" target="_blank" rel="noopener">${esc(l.title)} ↗</a>`,
        )
        .join(
          "",
        )}</div><a href="#/course">View the full IGCSE course map →</a></aside>`,
    );
  if (d.curriculum) {
    $(".lab-page").classList.add("curriculum-lab");
    $(".controls-heading").after($(".preset-block"));
    $("#simulation").setAttribute(
      "aria-label",
      `${d.short}: calculated scientific diagram. Numeric results appear below and in the expanded calculation inspector.`,
    );
  }
  if (type === "gravity") {
    $("#stage-caption").insertAdjacentHTML(
      "afterend",
      '<div class="orbit-legend"><span><i style="background:#6bdccf"></i>Calculated trail</span><span><i style="background:#80b4c7"></i>Dashed Kepler reference</span><span><i style="background:#ffcc84"></i>v · relative velocity</span><span><i style="background:#ff9d91"></i>a · relative acceleration</span><span>r · centre-to-centre separation</span></div><section class="orbit-context" aria-label="Orbital interpretation" id="orbit-context"></section>',
    );
    $("#vectors").closest("label").lastChild.textContent =
      " Velocity & acceleration";
    arrangeOrbitWorkbench();
  }
  if (d.featured) {
    $(".lab-page").classList.add("frontier-lab");
    $("#stage-caption").insertAdjacentHTML(
      "afterend",
      `<div class="frontier-story"><div class="frontier-legend">${type === "doublependulum" ? '<span><i style="--key:#ffcc84"></i>Upper bob</span><span><i style="--key:#72e2ce"></i>Lower bob</span><span><i style="--key:#be9aff"></i>Comparison twin</span>' : ["A", "B", ...(type === "threebody" ? ["C"] : [])].map((name, i) => `<span><i style="--key:${["#ffcc84", "#8edfff", "#d0a3ff"][i]}"></i>Star ${name}</span>`).join("") + "<span>⊕ Barycentre</span>"}</div><p>${d.narrative}</p></div>`,
    );
    $("#vectors").closest("label").lastChild.textContent =
      type === "doublependulum" ? " Comparison twin" : " Velocity vectors";
    $(".controls-heading h2").textContent = "Initial conditions";
    $(".controls-heading span").textContent = "CHANGE ONE VARIABLE AT A TIME";
    $(".controls-heading").after($(".preset-block"));
    const toggles = document.createElement("div");
    toggles.className = "frontier-toggles";
    toggles.append(
      $("#vectors").closest("label"),
      $("#trail").closest("label"),
    );
    $(".frontier-legend").append(toggles);
    const notes = document.createElement("details");
    notes.className = "frontier-model-notes";
    notes.innerHTML = "<summary>View scale & model notes</summary>";
    $("#metrics").after(notes);
    notes.append($("#stage-caption"));
  }
  installVisualGuide();
  if (type === "buoyancy") {
    $("#stage").classList.add("buoyancy-stage");
    buoyancyUpdate = installBuoyancyStudio($("#stage"));
  }
  if (type === "solarsystem")
    $("#stage").insertAdjacentHTML(
      "beforebegin",
      '<a class="solar-atlas-link" href="./solar-atlas.html"><small>FROM YOUR MUON ATLAS PROJECT</small><strong>Explore the full 3D Solar System ↗</strong><span>20 worlds · textured planets · moons · selectable interiors · orbital calculations · date controls</span></a>',
    );
  if (type === "solarsystem")
    $(".solar-atlas-link").href =
      "./solar-atlas.html?level=" + studyMode + "&cycle=" + syllabusCycle;
  learningStudio = new LearningStudio({
    id: type,
    mode: studyMode,
    cycle: syllabusCycle,
    stage: $("#stage"),
    controls: $(".controls"),
    getSnapshot: () => lab,
    onMode: setStudyMode,
    onSetup: loadLearningSetup,
  });
  if (type === "vectors") {
    vectorStudio = new VectorStudio({
      root: $(".lab-page"),
      getLab: () => lab,
      onChange: editVector,
      onEditStart: beginVectorEdit,
      onEditEnd: finishVectorEdit,
      onSeek: seekVector,
    });
    $("#camera-hint").textContent =
      "Drag A / B rings to edit · drag background to rotate";
    $('[data-camera="above"]').textContent = "Isometric";
    $(".controls-heading h2").textContent = "Your vectors";
  }
  sample();
  createCharts();
  updateReadouts();
  renderNotebook();
  showLesson(
    ["learn", "experiments", "questions", "model"].includes(query.get("tab"))
      ? query.get("tab")
      : "learn",
  );
  syncPlay();
  setView(lab.view === "2d" ? "2d" : "3d");
  if (invalid)
    toast("That shared setup was invalid. Safe defaults have been restored.");
  if (embedded) $("#fullscreen").click();
}
/** Keep the existing controls and calculations; regroup their DOM for reading.
 * The scene and live measurements form the experiment, with interpretation and
 * graphs together below it. Moving nodes preserves their bound event handlers. */
function arrangeOrbitWorkbench() {
  $(".lab-title-row h1").textContent = "Orbital mechanics";
  $(".lab-title-row p").textContent =
    "Explore how gravity shapes a journey. Change the launch. Follow the evidence.";
  $(".controls-heading h2").textContent = "Set up your orbit";
  $(".controls-heading span").textContent = "CHANGE ONE VARIABLE AT A TIME";
  $(".graph-header h2").textContent = "Measurements over time";
  $("#camera-hint").innerHTML = "Drag to rotate <span>·</span> Scroll to zoom";
  $("#camera-reset").innerHTML = `${icon("reset")}<span>Reset view</span>`;
  $(".controls-heading").after($(".preset-block"));
  const workspace = $(".workspace");
  const display = document.createElement("div");
  display.className = "orbit-display-bar";
  const toggles = document.createElement("div");
  toggles.className = "orbit-display-toggles";
  $("#vectors").closest("label").lastChild.textContent = "Vectors";
  $("#trail").closest("label").lastChild.textContent = "Trail";
  toggles.append($("#vectors").closest("label"), $("#trail").closest("label"));
  // The meaning of r is explained with the view scale notes instead of a fourth
  // competing legend item. Each vector keeps its own colour and label.
  $(".orbit-legend span:last-child").remove();
  display.append($(".orbit-legend"), toggles);
  $("#stage").after(display);
  display.after($("#metrics"));
  const notes = document.createElement("details");
  notes.className = "view-notes";
  notes.innerHTML =
    "<summary>View scale & model notes</summary><p>The planet surface and clouds are illustrative; atmospheric drag is not included. The orbit stays in one plane as you rotate the camera. r is the centre-to-centre separation, not the altitude above the surface.</p>";
  notes.append($("#stage-caption"));
  workspace.append(notes);
  const analysis = document.createElement("section");
  analysis.className = "orbit-analysis";
  analysis.setAttribute(
    "aria-label",
    "Interpret the orbit and inspect its graphs",
  );
  analysis.append($(".graph-panel"), $("#orbit-context"));
  $(".lab-grid").after(analysis);
  const notebookRow = document.createElement("div");
  notebookRow.className = "orbit-notebook-row";
  notebookRow.append($(".insight-strip"), $(".notebook"));
  analysis.after(notebookRow);
}
function syncInputs() {
  for (const d of lab.definition.controls) {
    if (d.options) {
      $(`#${d.key}-select`).value = String(lab.params[d.key]);
      continue;
    }
    const v = lab.params[d.key] / (d.factor || 1);
    $(`#${d.key}-number`).value = d.log
      ? v.toExponential(2)
      : Number(v.toFixed(5));
    $(`#${d.key}-slider`).value = d.log ? Math.log10(v) : v;
  }
}
function setStudyMode(mode) {
  lab.studyMode = resolveMode(lab.type, mode);
  $(".lab-page").dataset.learningMode = lab.studyMode;
  save("physics-study-mode", lab.studyMode);
  learningStudio.setMode(lab.studyMode);
  if (lab.type === "solarsystem")
    $(".solar-atlas-link").href =
      "./solar-atlas.html?level=" +
      lab.studyMode +
      "&cycle=" +
      lab.syllabusCycle;
  const hash = location.hash.split("?"),
    args = new URLSearchParams(hash[1] || "");
  args.set("level", lab.studyMode);
  args.set("cycle", lab.syllabusCycle);
  history.replaceState(null, "", hash[0] + "?" + args);
  showLesson(
    $('[data-lesson][aria-selected="true"]')?.dataset.lesson || "learn",
  );
  expandedView?.refresh();
}
function loadLearningSetup() {
  reset({
    ...lab.definition.defaults,
    ...getProfile(lab.type, lab.studyMode).setup,
  });
  syncInputs();
  lab.running = false;
  syncPlay();
  toast("Recommended setup loaded and paused. Make a prediction, then resume.");
}
function reset(params = lab.params, { deferUI = false } = {}) {
  const model = lab.definition.create(params);
  Object.assign(lab, model, {
    accumulator: 0,
    previousState: null,
    history: [],
    trail: [],
    nextSample: 0,
    lastUI: deferUI ? lab.lastUI : -1,
    ended: null,
    graphDirty: true,
    initialEnergy: undefined,
    fieldKey: null,
    vectorProgress: 1,
  });
  $$("[data-preset]").forEach((b) => b.setAttribute("aria-pressed", "false"));
  sample();
  if (!deferUI) {
    updateCharts();
    updateReadouts();
    syncPlay();
  }
}
function beginVectorEdit() {
  if (!lab || lab.type !== "vectors") return;
  lab.running = false;
  lab.vectorProgress = 1;
  syncPlay();
}
function editVector(patch) {
  if (
    !lab ||
    lab.type !== "vectors" ||
    Object.entries(patch).every(([k, v]) => lab.params[k] === v)
  )
    return;
  reset({ ...lab.params, ...patch }, { deferUI: true });
  syncInputs();
}
function finishVectorEdit() {
  if (!lab) return;
  lab.lastUI = -1;
  updateReadouts();
  updateCharts();
  syncPlay();
}
function seekVector(progress) {
  if (!lab || lab.type !== "vectors") return;
  lab.running = false;
  lab.vectorProgress = progress;
  lab.lastUI = -1;
  syncPlay();
}
function loadPreset(index) {
  reset(
    lab.definition.presetFor?.(index, lab.params) ?? {
      ...lab.definition.presets[index][1],
    },
  );
  syncInputs();
  lab.running = lab.type !== "vectors" && !reduced();
  $$("[data-preset]").forEach((b) =>
    b.setAttribute("aria-pressed", String(Number(b.dataset.preset) === index)),
  );
  $("#control-error").textContent = "";
  syncPlay();
}
function bindControls() {
  for (const d of lab.definition.controls) {
    const commit = (raw, slider = false) => {
      const value = d.log ? (slider ? 10 ** raw : raw) : raw * (d.factor || 1);
      try {
        reset({ ...lab.params, [d.key]: value });
        $("#control-error").textContent = "";
      } catch (error) {
        $("#control-error").textContent = error.message;
      }
      syncInputs();
    };
    if (d.options) {
      $(`#${d.key}-select`).onchange = (e) => commit(Number(e.target.value));
      continue;
    }
    const range = $(`#${d.key}-slider`),
      number = $(`#${d.key}-number`);
    range.oninput = () => commit(Number(range.value), true);
    const numeric = () => {
      const raw = number.value === "" ? NaN : Number(number.value);
      if (raw * (d.factor || 1) !== lab.params[d.key]) commit(raw);
    };
    number.onchange = numeric;
    number.onblur = numeric;
    number.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        numeric();
      }
    };
  }
  $("#play").onclick = () => {
    if (lab.type === "vectors") {
      if (!lab.running && lab.vectorProgress >= 1) lab.vectorProgress = 0;
      lab.running = !lab.running;
      syncPlay();
      return;
    }
    if (lab.ended) reset();
    lab.running = !lab.running;
    syncPlay();
  };
  $("#reset").onclick = () => {
    reset();
    toast("Run reset to its initial conditions.");
  };
  $("#step").onclick = () => {
    if (lab.type === "vectors") {
      seekVector(
        Math.min(1, (lab.vectorProgress >= 1 ? 0 : lab.vectorProgress) + 0.1),
      );
      return;
    }
    if (lab.ended) reset();
    lab.running = false;
    const rate = lab.definition.rateFor?.(lab.params) ?? lab.definition.rate;
    advance(Math.max(1, Math.round(rate / 60 / integrationStep())));
    sample();
    updateReadouts();
    updateCharts();
    syncPlay();
  };
  $("#speed").onchange = (e) => (lab.speed = Number(e.target.value));
  $("#vectors").onchange = (e) => (lab.vectors = e.target.checked);
  if ($("#trail"))
    $("#trail").onchange = (e) => (lab.showTrail = e.target.checked);
  $$("[data-preset]").forEach(
    (b) => (b.onclick = () => loadPreset(Number(b.dataset.preset))),
  );
  $$("[data-view]").forEach((b) => (b.onclick = () => setView(b.dataset.view)));
  $("#camera-reset").onclick = () => {
    view?.home();
    $$("[data-camera]").forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.camera === "perspective"),
      ),
    );
  };
  $$("[data-camera]").forEach(
    (b) =>
      (b.onclick = () => {
        view?.cameraView(b.dataset.camera);
        $$("[data-camera]").forEach((o) =>
          o.setAttribute("aria-pressed", String(o === b)),
        );
      }),
  );
  $("#scene-labels").onchange = (e) => (lab.showLabels = e.target.checked);
  const expandButton = $("#fullscreen");
  expandButton.innerHTML = `${icon("expand")}<span class="expand-label">Expand</span>`;
  expandButton.setAttribute("aria-label", "Expand simulation and calculations");
  expandButton.setAttribute("aria-expanded", "false");
  expandButton.title = "Expand the model, variables and live calculations";
  expandButton.onclick = () => {
    if (expandedView) {
      expandedView.close();
      return;
    }
    expandButton.setAttribute("aria-expanded", "true");
    expandButton.title = "Return to normal view";
    expandButton.setAttribute("aria-label", "Close expanded view");
    expandedView = new ExpandedView({
      title: lab.definition.short,
      controls: $(".controls"),
      workspace: $(".workspace"),
      extraGraph: lab.type === "gravity" ? $(".graph-panel") : null,
      getSnapshot: () => ({
        type: lab.type,
        studyMode: lab.studyMode,
        syllabusCycle: lab.syllabusCycle,
        state: lab.state,
        params: lab.params,
        running: lab.running,
        ended: lab.ended,
      }),
      onPlayback: () => $("#play").click(),
      embedded,
      fullURL: () => setupLink(),
      onClose: () => {
        expandedView = null;
        expandButton.title =
          "Expand the model, variables and live calculations";
        expandButton.setAttribute("aria-expanded", "false");
        expandButton.setAttribute(
          "aria-label",
          "Expand simulation and calculations",
        );
      },
      onLayout: () =>
        requestAnimationFrame(() =>
          charts.forEach(({ chart }) => chart.resize()),
        ),
    });
  };
  const calculationLaunch = document.createElement("button");
  calculationLaunch.className = "small-button calculation-launch";
  calculationLaunch.innerHTML = `${icon("expand")} Live calculations`;
  calculationLaunch.title =
    "Open the model, variables and worked calculations together";
  calculationLaunch.onclick = () => expandButton.click();
  $(".toolbar-buttons").prepend(calculationLaunch);
  const embedLink = document.createElement("a");
  embedLink.className = "small-button";
  embedLink.textContent = "</> Embed";
  embedLink.href = "./integration.html";
  embedLink.onclick = () => {
    const target = new URL("./integration.html", location.href);
    target.hash = new URL(setupLink()).hash;
    embedLink.href = target.href;
  };
  $(".toolbar-buttons").append(embedLink);
  $("#model-shortcut").onclick = () => {
    showLesson("model");
    $("#lesson-area").scrollIntoView({
      behavior: reduced() ? "instant" : "smooth",
    });
  };
  $$("[data-graph]").forEach(
    (b) =>
      (b.onclick = () => {
        lab.graph = b.dataset.graph;
        lab.graphDirty = true;
        $$("[data-graph]").forEach((btn) => {
          btn.classList.toggle("active", btn === b);
          btn.setAttribute("aria-pressed", String(btn === b));
        });
        createCharts();
      }),
  );
  $$("[data-lesson]").forEach((b, i, buttons) => {
    b.onclick = () => showLesson(b.dataset.lesson);
    b.onkeydown = (e) => {
      let target;
      if (e.key === "ArrowRight") target = buttons[(i + 1) % buttons.length];
      if (e.key === "ArrowLeft")
        target = buttons[(i - 1 + buttons.length) % buttons.length];
      if (e.key === "Home") target = buttons[0];
      if (e.key === "End") target = buttons.at(-1);
      if (target) {
        e.preventDefault();
        target.focus();
        target.click();
      }
    };
  });
  $("#share").onclick = async () => {
    const url = setupLink();
    try {
      await navigator.clipboard.writeText(url);
      toast(
        "Setup copied. The link opens a fresh run with this view and these parameters.",
      );
    } catch {
      window.prompt("Copy this experiment setup:", url);
    }
  };
  $("#export").onclick = exportData;
  $("#record").onclick = recordReading;
  $("#simulation").onclick = (e) => {
    if (lab.type !== "fields") return;
    const r = e.currentTarget.getBoundingClientRect(),
      sc = Math.min((r.width - 65) / 10, (r.height - 75) / 7);
    const probeX = Math.max(
        -4,
        Math.min(4, (e.clientX - r.left - r.width / 2) / sc),
      ),
      probeY = Math.max(
        -3,
        Math.min(3, -(e.clientY - r.top - r.height / 2) / sc),
      );
    reset({
      ...lab.params,
      probeX: Math.round(probeX * 10) / 10,
      probeY: Math.round(probeY * 10) / 10,
    });
    syncInputs();
  };
}
function setupLink(embed = false) {
  const link = experimentLink({
    baseURL: location.href,
    model: lab.type,
    params: lab.params,
    view: lab.view,
    graph: lab.graph,
    embed,
    studyMode: lab.studyMode,
    syllabusCycle: lab.syllabusCycle,
  });
  if (lab.type !== "vectors") return link;
  const [path, query = ""] = link.split("#"),
    [route, search = ""] = query.split("?"),
    args = new URLSearchParams(search);
  args.set("method", lab.vectorMethod);
  args.set("components", lab.vectorComponents ? "1" : "0");
  args.set("grid", lab.vectorGrid ? "1" : "0");
  args.set("angleMarker", lab.vectorAngle ? "1" : "0");
  return `${path}#${route}?${args}`;
}
async function setView(mode) {
  if (!lab) return;
  if (lab.definition.diagramOnly) mode = "2d";
  if (mode === "3d" && lab.view === mode && view) return;
  view?.dispose();
  view = null;
  lab.view = mode;
  save("physics-view", mode);
  const token = routeToken,
    localToken = ++viewToken;
  $("#scene-3d").hidden = mode !== "3d";
  $("#simulation").hidden = mode === "3d";
  $("#camera-hint").hidden = mode !== "3d";
  $("#camera-reset").hidden = mode !== "3d";
  $("#camera-toolbar").hidden = mode !== "3d";
  $(".scene-equation").hidden = mode !== "3d";
  $$("[data-view]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.view === mode)),
  );
  if (mode === "3d") {
    try {
      const { SceneView } = await import("./scene3d.js");
      if (
        token !== routeToken ||
        localToken !== viewToken ||
        !lab ||
        lab.view !== "3d"
      )
        return;
      // A disposed renderer explicitly releases its WebGL context. Replacing
      // the canvas avoids reusing that lost context after a 2D → 3D switch.
      const previousCanvas = $("#scene-3d");
      const nextCanvas = previousCanvas.cloneNode(false);
      previousCanvas.replaceWith(nextCanvas);
      view = new SceneView(nextCanvas);
      view.onParameterEdit = editVector;
      view.onEditStart = beginVectorEdit;
      view.onEditEnd = finishVectorEdit;
      view.homeRadius =
        lab.type === "gravity"
          ? 10.8
          : ["pendulum", "circuits", "refraction"].includes(lab.type)
            ? 11.5
            : 14;
      if (lab.type === "gravity") view.homePolar = 0.82;
      if (lab.definition.curriculum) {
        view.homeRadius = 10.3;
        view.homePolar = 1.15;
        view.homeAzimuth = -0.22;
        view.target.y = 2.2;
      }
      if (lab.type === "vectors") {
        view.homeRadius = 10;
        view.homePolar = 1.45;
        view.homeAzimuth = -0.06;
        view.target.y = 2.65;
      }
      view.home();
      view.update(lab);
    } catch (error) {
      if (token !== routeToken) return;
      console.info("3D unavailable; diagram mode:", error.message);
      toast(
        "3D graphics are unavailable here. The complete experiment is available in 2D diagram mode.",
      );
      setView("2d");
    }
  }
}
function syncPlay() {
  if (!lab) return;
  $("#play").innerHTML =
    icon(lab.running ? "pause" : "play") +
    (lab.running ? " Pause" : lab.ended ? " Replay" : " Resume");
  $("#run-status").textContent = lab.ended
    ? `${lab.ended.toUpperCase()} · PAUSED`
    : lab.running
      ? "RUNNING"
      : "PAUSED";
  if (lab.type === "vectors") {
    $("#play").innerHTML =
      icon(lab.running ? "pause" : "play") +
      (lab.running
        ? " Pause build"
        : lab.vectorProgress >= 1
          ? " Animate addition"
          : " Continue build");
    $("#run-status").textContent = lab.running
      ? "CONSTRUCTION DEMO"
      : "READY TO EXPLORE";
  }
  expandedView?.refresh();
}
function sample() {
  const row = lab.definition.sample(lab.state, lab.params);
  if (lab.history.at(-1)?.t === row.t)
    lab.history[lab.history.length - 1] = row;
  else lab.history.push(row);
  if (lab.history.length > 1200) lab.history.shift();
  const point =
    lab.definition.trailPoint?.(lab.state, lab.params) ??
    (Number.isFinite(row.x) && Number.isFinite(row.y)
      ? { x: row.x, y: row.y }
      : null);
  if (point) {
    lab.trail.push(point);
    if (lab.trail.length > 1200) lab.trail.shift();
  }
  if (lab.initialEnergy === undefined && Number.isFinite(row.total)) {
    lab.initialEnergy = row.total;
    if (lab.type === "gravity") lab.energyScale = Math.abs(row.potential);
  }
  lab.graphDirty = true;
}
function selectedGraph() {
  return lab.definition.graphs.find((g) => g.id === lab.graph);
}
function createCharts() {
  charts.forEach((c) => c.chart.destroy());
  charts = [];
  if (!window.Chart) {
    $("#plots").innerHTML =
      "<p>Reload this page to restore the graph library.</p>";
    return;
  }
  const g = selectedGraph(),
    parts = g.stacked
      ? g.keys.map((key, i) => ({
          ...g,
          keys: [key],
          title: g.labels[i],
          colorIndex: i,
        }))
      : [{ ...g, title: g.unit ? `${g.label} / ${g.unit}` : g.label }];
  $("#plots").innerHTML = parts
    .map(
      (g, i) =>
        `<p class="plot-label">${g.title}</p><div class="plot-wrap ${parts.length === 1 ? "tall" : ""}"><canvas id="plot-${i}" role="img" aria-label="Calculated ${g.title}"></canvas></div>`,
    )
    .join("");
  $("#graph-mode-label").textContent = g.phaseX
    ? "PHASE / STATE VIEW"
    : g.spatial
      ? "SPATIAL / PARAMETER VIEW"
      : "LIVE TIME HISTORY";
  for (const [i, part] of parts.entries()) {
    const xTitle =
      part.xTitleFor?.(lab.params) ||
      part.xTitle ||
      (part.phaseX
        ? "Lower rod angle / rad (unwrapped)"
        : part.spatial === "trajectory"
          ? "Horizontal distance / m"
          : part.spatial === "wave"
            ? "Position / m"
            : part.spatial === "interference"
              ? "Screen position / mm"
              : part.spatial === "refraction"
                ? "Incident angle / °"
                : part.spatial === "field"
                  ? "Position x / m"
                  : `Time / ${lab.definition.timeUnit}`);
    const chart = new Chart($(`#plot-${i}`), {
      type: "line",
      data: {
        datasets: part.keys.map((key, j) => ({
          label:
            {
              v1: "Cart A",
              v2: "Cart B",
              vx: "Horizontal",
              vy: "Vertical",
              incident: "Incident",
              reflected: "Counter-wave",
              resultant: "Resultant",
              kinetic: "Kinetic",
              potential: "Potential",
              total: "Total",
              intensity: "Intensity",
              envelope: "Diffraction envelope",
              speedA: "Star A",
              speedB: "Star B",
              speedC: "Star C",
              r12: "A–B",
              r13: "A–C",
              r23: "B–C",
              theta1: "Upper rod",
              theta2: "Lower rod",
              divergence: "Twin tip separation",
            }[key] || key,
          data: [],
          borderColor: SERIES_COLORS[key] || COLORS[part.colorIndex ?? j % 3],
          borderWidth: 2.5,
          pointRadius: 0,
          pointHitRadius: 7,
          parsing: false,
          tension: 0,
          spanGaps: false,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        normalized: !part.phaseX,
        interaction: { mode: "nearest", axis: "x", intersect: false },
        plugins: {
          legend: {
            display: part.keys.length > 1,
            labels: {
              boxWidth: 10,
              boxHeight: 3,
              color: "#5a7487",
              font: { size: 14 },
            },
          },
        },
        scales: {
          x: {
            type: "linear",
            title: {
              display: true,
              text: xTitle,
              color: "#6c8392",
              font: { size: 14 },
            },
            ticks: { maxTicksLimit: 6, color: "#526b7c", font: { size: 13 } },
            grid: { display: false },
            border: { color: "#e0e9ef" },
          },
          y: {
            type: part.yLog ? "logarithmic" : "linear",
            beginAtZero: !part.yLog,
            ticks: {
              maxTicksLimit: 4,
              color: "#6c8392",
              font: { size: 13 },
              callback: (v) =>
                Math.abs(v) >= 1e5 ? Number(v).toExponential(1) : v,
            },
            grid: { color: "#edf2f6" },
            border: { display: false },
          },
        },
      },
    });
    charts.push({ chart, ...part });
  }
  lab.graphDirty = true;
  updateCharts();
}
function updateCharts() {
  if (!lab?.graphDirty) return;
  const d = lab.definition,
    g = selectedGraph(),
    s = lab.state,
    p = lab.params,
    tf = d.timeFactor || 1,
    span = typeof d.window === "function" ? d.window(p) : d.window;
  let rows =
    g.spatial && g.spatial !== "trajectory"
      ? spatialRows(g.spatial, s, p)
      : lab.history;
  for (const c of charts) {
    c.keys.forEach((key, j) => {
      c.chart.data.datasets[j].data = rows
        .filter(
          (row) => g.spatial || row.t / tf >= Math.max(0, s.t / tf - span),
        )
        .map((row) => ({
          x: g.phaseX
            ? row[g.phaseX]
            : g.spatial
              ? row.x * (g.spatial === "interference" ? 1000 : 1)
              : row.t / tf,
          y:
            row[key] === null
              ? null
              : (row[key] * (c.factor || 1)) / (c.scale || 1),
        }));
    });
    if (!g.spatial && !g.phaseX) {
      c.chart.options.scales.x.min = Math.max(0, s.t / tf - span);
      c.chart.options.scales.x.max = Math.max(Math.min(span, 2), s.t / tf);
    }
    if (g.xTitleFor) c.chart.options.scales.x.title.text = g.xTitleFor(p);
    c.chart.update("none");
  }
  lab.graphDirty = false;
}
function installVisualGuide() {
  const guide = SCENE_GUIDES[lab.type];
  if (!guide) return;
  const section = document.createElement("section");
  section.className = "visual-guide";
  section.setAttribute("aria-label", "Understand this animation");
  section.innerHTML = `<div class="visual-guide-heading"><div><span class="section-kicker">READ THE MODEL</span><h2>See it. Understand it.</h2></div><span id="guide-reading"></span></div><div class="guide-steps" role="group" aria-label="Animation walkthrough">${["What to watch", "Why it happens", "Try a change"].map((text, i) => `<button data-guide="${i}" aria-pressed="${i === 0}"><span>0${i + 1}</span>${text}</button>`).join("")}</div><p id="guide-copy">${esc(guide[0])}</p><details class="visual-scale"><summary>How to read the visual scale</summary><p>${esc(guide[3])}</p></details>`;
  $("#stage-caption").before(section);
  section.querySelectorAll("[data-guide]").forEach(
    (b) =>
      (b.onclick = () => {
        lab.guideStep = Number(b.dataset.guide);
        $("#guide-copy").textContent = guide[lab.guideStep];
        section
          .querySelectorAll("[data-guide]")
          .forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
      }),
  );
}
function metricMarkup(m) {
  return `<div class="metric"><div class="metric-label">${esc(m.label)}</div><div class="metric-value">${esc(fmt(m.value, m.decimals ?? 2))}<span>${esc(m.unit)}</span></div><div class="metric-note">${esc(m.note || "")}</div></div>`;
}
function updateReadouts() {
  const d = lab.definition,
    p = lab.params,
    s = lab.state;
  const metrics = d.metrics(s, p);
  vectorStudio?.update();
  learningStudio?.update();
  buoyancyUpdate?.(s, p);
  $("#metrics").innerHTML = metrics.map(metricMarkup).join("");
  const focus = metrics[0];
  if (focus && $("#guide-reading") && lab.type !== "vectors")
    $("#guide-reading").textContent =
      `${focus.label}: ${fmt(focus.value, focus.decimals ?? 2)} ${focus.unit}`;
  if (lab.type === "gravity") {
    // Interpret the initial osculating conic, independent of integration drift.
    const q = orbitInfo({ x: p.distance, y: 0, vx: 0, vy: p.velocity }, p);
    const surface = centralRadius(p),
      crossing = q.intersectsSurface;
    const title = s.collided ? "Surface impact" : q.kind;
    const explanation = s.collided
      ? "The point satellite reached the absorbing surface. Reset or choose a new launch speed."
      : crossing
        ? `This path reaches the surface before completing an orbit. The ideal closest approach is ${fmt(q.periapsis / 1000, 0)} km from the centre; the surface radius is ${fmt(surface / 1000, 0)} km.`
        : q.eccentricity < 1e-5
          ? "Velocity is tangential. Acceleration points inward. Gravity changes the direction of motion while speed stays constant."
          : q.specificEnergy >= 0
            ? "The launch has enough energy to escape. Gravity still pulls inward and the satellite slows as it recedes."
            : `Speed increases on approach and decreases on retreat. Closest approach: ${fmt((q.periapsis - surface) / 1000, 0)} km above the surface.`;
    $("#orbit-context").classList.toggle(
      "surface-warning",
      crossing || s.collided,
    );
    $("#orbit-context").innerHTML =
      `<div class="orbit-interpretation"><span class="section-kicker">YOUR TRAJECTORY</span><h3>${esc(title)}</h3><p>${esc(explanation)}</p></div><div class="orbit-thresholds"><div><span>Circular launch</span><strong>${fmt(circularSpeed(p) / 1000, 3)} <small>km/s</small></strong></div><div><span>Escape threshold</span><strong>${fmt(escapeSpeed(p) / 1000, 3)} <small>km/s</small></strong></div><div><span>${crossing ? "Central-body radius" : "Ideal orbital period"}</span><strong>${crossing ? fmt(surface / 1000, 0) : Number.isFinite(q.period) ? fmt(q.period / 3600) : "Unbound"} <small>${crossing ? "km" : Number.isFinite(q.period) ? "h" : ""}</small></strong></div></div>`;
  }
  $("#time-readout").textContent =
    `t = ${fmt(s.t / d.timeFactor)} ${d.timeUnit}`;
  if (lab.type === "vectors")
    $("#time-readout").textContent =
      `Build ${Math.round(lab.vectorProgress * 100)}%`;
  $("#energy-summary").innerHTML = d
    .supplementary(s, p)
    .map(
      (m, i) =>
        `<div><small><span class="color-dot" style="background:${COLORS[i]}"></span>${esc(m.label)}</small>${esc(fmt(m.value))} <span>${esc(m.unit)}</span></div>`,
    )
    .join("");
  const g = selectedGraph(),
    drift =
      Number.isFinite(lab.initialEnergy) &&
      Math.abs(lab.initialEnergy) > 1e-15 &&
      Number.isFinite(lab.history.at(-1)?.total)
        ? (100 * (lab.history.at(-1).total - lab.initialEnergy)) /
          Math.abs(lab.initialEnergy)
        : null;
  $("#graph-note").textContent =
    (g.spatial
      ? "Calculated spatial / parameter curve. "
      : "Calculated samples only. ") +
    (drift !== null
      ? `Energy change from launch: ${drift.toExponential(2)}%. `
      : "") +
    "Export includes labelled units and initial parameters.";
  if (lab.type === "gravity") {
    // Normalise by launch |U|, since total launch energy vanishes at escape.
    const current = d.sample(s, p).total;
    const error = (100 * (current - lab.initialEnergy)) / lab.energyScale;
    $("#graph-note").textContent = s.collided
      ? "Surface contact ends the gravitational model; impact and deformation are not simulated. Export includes calculated samples, units and initial parameters."
      : `Numerical energy error: ${error.toExponential(2)}% of launch |U|. This scale remains meaningful at zero-energy escape. Export includes calculated samples, units and initial parameters.`;
  }
  const rate = lab.definition.rateFor?.(p) ?? d.rate;
  if (d.featured) {
    const error = (100 * (d.sample(s, p).total - s.energy0)) / s.energyScale;
    $("#graph-note").textContent =
      `Numerical energy error: ${error.toExponential(2)}% of the documented initial energy scale. All curves use integrated states. ${s.halted ? s.halted + ": the point-mass calculation pauses before an unresolved encounter. " : ""}CSV retains unscaled SI values.`;
  }
  $("#stage-caption").textContent =
    d.caption +
    (d.rateFor ? ` · 1× = ${fmt(rate, 3)} simulated s / real s` : "");
  expandedView?.refresh();
  if (embedded) $("#embed-open").href = setupLink();
}
function showLesson(tab) {
  const l = LESSONS[lab.type],
    panel = $("#lesson-panel");
  $$("[data-lesson]").forEach((b) => {
    const selected = b.dataset.lesson === tab;
    b.setAttribute("aria-selected", String(selected));
    b.tabIndex = selected ? 0 : -1;
  });
  panel.setAttribute("aria-labelledby", `tab-${tab}`);
  if (tab === "learn")
    panel.innerHTML = `<div class="learn-grid"><aside class="objectives"><h3>Your learning objectives</h3><ul>${l.objectives.map((o) => `<li>${o}</li>`).join("")}</ul></aside><div><h2>${l.description}</h2><p>${l.intro}</p><div class="principles">${l.principles.map(([title, text]) => `<div><h3>${title}</h3><p>${text}</p></div>`).join("")}</div></div></div><div class="application"><h3>Physics beyond the screen</h3><p>${l.applications}</p></div>`;
  if (tab === "experiments") {
    panel.innerHTML = `<h2>Predict. Experiment. Explain.</h2><p>Change one variable at a time. Pause, record a reading, and use the graphs to test your prediction.</p><div class="experiment-grid">${l.experiments.map((e, i) => `<article class="experiment"><div class="eyebrow">INVESTIGATION 0${i + 1}</div><h3>${e.title}</h3><p>${e.text}</p><p class="prediction">${e.predict}</p><details><summary>What should I observe?</summary><p>${e.result}</p></details><button class="small-button" data-experiment="${i}">Load this setup ${icon("arrow")}</button></article>`).join("")}</div>`;
    $$("[data-experiment]").forEach(
      (b) =>
        (b.onclick = () => {
          const e = l.experiments[Number(b.dataset.experiment)];
          if (typeof e.preset === "object") {
            reset(e.preset);
            syncInputs();
          } else {
            const index = lab.definition.presets.findIndex(
              ([name]) => name.toLowerCase() === e.preset.toLowerCase(),
            );
            if (index >= 0) loadPreset(index);
          }
          lab.running = false;
          syncPlay();
          toast("Investigation loaded and paused. Resume when you are ready.");
          $("#stage").scrollIntoView({
            behavior: reduced() ? "instant" : "smooth",
            block: "center",
          });
        }),
    );
  }
  if (tab === "questions")
    panel.innerHTML = `<h2>Test your understanding.</h2><p>Try each question before revealing the worked explanation.</p>${l.questions.map(([q, a], i) => `<details class="question"><summary><span>${String(i + 1).padStart(2, "0")}</span>${q}</summary><p>${a}</p></details>`).join("")}`;
  if (tab === "model")
    panel.innerHTML = `<h2>The mathematics behind the motion.</h2><div class="equation-grid">${l.equations.map(([title, formula, note]) => `<article class="equation"><h3>${title}</h3><p class="formula">${formula}</p><p>${note}</p></article>`).join("")}</div><aside class="model-note"><h3>Assumptions, numerical method & 3D view</h3><p>${l.model}</p><p>3D is a camera around the same model used by the graphs. Planar systems remain planar. Grid, object sizes, glow and optical wavefronts may be illustrative; numeric readouts use the documented physical units. Drag / touch to rotate, scroll to zoom, arrow keys to rotate, + / − to zoom, and 0 to reset the camera. Use 2D diagram mode for calibrated diagrams or if WebGL is unavailable.</p><a href="${l.source[1]}" target="_blank" rel="noopener">${l.source[0]} ↗</a> · <a href="https://github.com/206713-dotcom/physics-interactive-lab#physics-and-numerical-methods" target="_blank" rel="noopener">Tested models & source ↗</a></aside>`;
  if (tab === "model" && lab.definition.diagramOnly) {
    $(".model-note h3", panel).textContent =
      "Assumptions, method & visual scaling";
    $(".model-note p:nth-of-type(2)", panel).textContent =
      "This laboratory uses a scientific 2D diagram. Numeric results use the documented physical units. Visual sizes, dot counts and animation timing may be illustrative as stated above; no 3D camera is implied.";
  }
  learningStudio?.enhanceLesson(panel, tab);
}
function renderNotebook() {
  const readings = lab.notebook
    .filter((r) => r && typeof r.time === "number" && Array.isArray(r.summary))
    .slice(-12);
  lab.notebook = readings;
  $("#notebook-count").textContent =
    `${readings.length} reading${readings.length === 1 ? "" : "s"}`;
  $("#notebook-content").innerHTML = readings.length
    ? `<p>Saved on this device. Readings store the actual state and launch parameters.</p><div class="notebook-table"><table><thead><tr><th>Time</th><th>Recorded measurements</th></tr></thead><tbody>${readings.map((r) => `<tr><td>${esc(fmt(r.time / lab.definition.timeFactor))} ${lab.definition.timeUnit}</td><td>${r.summary.map((m) => `${esc(m.label)}: <strong>${esc(fmt(m.value))} ${esc(m.unit)}</strong>`).join(" · ")}</td></tr>`).join("")}</tbody></table></div><button id="clear-notebook" class="small-button">Clear readings</button>`
    : "<p>No readings yet. Pause at a useful moment and select “Record reading” to compare different setups.</p>";
  if ($("#clear-notebook"))
    $("#clear-notebook").onclick = () => {
      lab.notebook = [];
      save(`physics-notebook-${lab.type}`, []);
      renderNotebook();
    };
}
function recordReading() {
  lab.notebook.push({
    time: lab.state.t,
    params: { ...lab.params },
    state: lab.definition.sample(lab.state, lab.params),
    summary: lab.definition.metrics(lab.state, lab.params),
  });
  lab.notebook = lab.notebook.slice(-12);
  const ok = save(`physics-notebook-${lab.type}`, lab.notebook);
  renderNotebook();
  toast(
    ok
      ? "Calculated reading saved to your notebook on this device."
      : "Reading saved for this session; device storage is unavailable.",
  );
}
function exportData() {
  const g = selectedGraph();
  let rows = lab.history,
    axis = "time_s";
  if (g.spatial && g.spatial !== "trajectory") {
    rows = spatialRows(g.spatial, lab.state, lab.params);
    axis =
      g.spatial === "interference"
        ? "screen_position_m"
        : g.spatial === "refraction"
          ? "incident_angle_deg"
          : "position_m";
  }
  const units = {
    t: "s",
    x: "m",
    y: "m",
    x1: "m",
    x2: "m",
    v: "m_per_s",
    v1: "m_per_s",
    v2: "m_per_s",
    vx: "m_per_s",
    vy: "m_per_s",
    a: "m_per_s2",
    theta: "rad",
    omega: "rad_per_s",
    speed: "m_per_s",
    distance: "m",
    force: "N",
    kinetic: lab.type === "projectile" ? "J_per_kg" : "J",
    potential:
      lab.type === "fields"
        ? "V"
        : lab.type === "projectile"
          ? "J_per_kg"
          : "J",
    total: lab.type === "projectile" ? "J_per_kg" : "J",
    momentum: "kg_m_per_s",
    incident: "m",
    reflected: "m",
    resultant: "m",
    voltage: "V",
    current: "A",
    charge: "C",
    energy: "J",
    tau: "s",
    ex: "N_per_C",
    ey: "N_per_C",
    magnitude: "N_per_C",
    critical: "deg",
    refracted: "deg",
    reflectance: "fraction",
    intensity: "relative",
    envelope: "relative",
    spacing: "m",
    r12: "m",
    r13: "m",
    r23: "m",
    minDistance: "m",
    cx: "m",
    cy: "m",
    px: "kg_m_per_s",
    py: "kg_m_per_s",
    angular: "kg_m2_per_s",
    speedA: "m_per_s",
    speedB: "m_per_s",
    speedC: "m_per_s",
    theta1: "rad",
    theta2: "rad",
    omega1: "rad_per_s",
    omega2: "rad_per_s",
    divergence: "m",
    energyError: "percent",
    y1: "m",
    y2: "m",
    x3: "m",
    y3: "m",
    vx1: "m_per_s",
    vy1: "m_per_s",
    vx2: "m_per_s",
    vy2: "m_per_s",
    vx3: "m_per_s",
    vy3: "m_per_s",
  };
  Object.assign(units, lab.definition.csvUnits || {});
  if (g.spatial?.startsWith("curriculum:"))
    axis = (g.xTitleFor?.(lab.params) || g.xTitle).replace(
      /[^a-zA-Z0-9]+/g,
      "_",
    );
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))].filter((k) =>
    rows.some((r) => typeof r[k] === "number" || r[k] === null),
  );
  const csv = [
    `# ${lab.type}; calculated model data; params=${JSON.stringify(lab.params)}; view=${lab.view}`,
    keys
      .map((k) =>
        k === "x" && g.spatial && g.spatial !== "trajectory"
          ? axis
          : k === "t"
            ? `time_${lab.definition.csvUnits?.t || "s"}`
            : `${k}${units[k] ? "_" + units[k] : ""}`,
      )
      .join(","),
    ...rows.map((r) => keys.map((k) => r[k] ?? "").join(",")),
  ].join("\n");
  const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = `physics-lab-${lab.type}-${lab.graph}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Calculated data exported with units and initial parameters.");
}
function integrationStep() {
  return lab.definition.hFor?.(lab.params) ?? lab.definition.h;
}
function advance(count) {
  const h = integrationStep();
  for (let i = 0; i < count; i++) {
    lab.previousState = lab.state;
    lab.state = lab.definition.step(lab.state, lab.params, h);
    const interval =
      typeof lab.definition.sampleEvery === "function"
        ? lab.definition.sampleEvery(lab.params)
        : lab.definition.sampleEvery;
    if (lab.state.t >= lab.nextSample) {
      sample();
      lab.nextSample = lab.state.t + interval;
    }
    const end = lab.definition.ended?.(lab.state, lab.params);
    if (end) {
      lab.ended = end;
      lab.running = false;
      sample();
      syncPlay();
      break;
    }
  }
}
function route() {
  $("#main").onclick = null;
  $("#main").oninput = null;
  expandedView?.close();
  vectorStudio?.dispose();
  vectorStudio = null;
  buoyancyUpdate = null;
  learningStudio = null;
  routeToken++;
  viewToken++;
  view?.dispose();
  heroView?.dispose();
  view = null;
  heroView = null;
  hero = null;
  charts.forEach((c) => c.chart.destroy());
  charts = [];
  lab = null;
  const [path, query = ""] = location.hash.slice(1).split("?"),
    id = path?.replace(/^\//, ""),
    type = Object.hasOwn(SIMULATIONS, id) ? id : embedded ? "gravity" : null;
  document.title = type
    ? `${SIMULATIONS[type].title} · Physics Interactive Lab`
    : "Physics Interactive Lab · Explore in 3D";
  $("#lab-select").value = type || "";
  $$("[data-nav]").forEach((a) => {
    const active =
      a.dataset.nav ===
      (id === "course" || id === "syllabus"
        ? "course"
        : id === "questions"
          ? "questions"
          : !type
            ? "home"
            : "");
    a.classList.toggle("active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  if (type) labPage(type, new URLSearchParams(query));
  else if (id === "syllabus") {
    document.title = "Cambridge learning paths · Physics Interactive Lab";
    renderSyllabus($("#main"), new URLSearchParams(query));
  } else if (id === "course") {
    document.title = "IGCSE course map · Physics Interactive Lab";
    renderCourse($("#main"));
  } else if (id === "questions") {
    document.title = "A Level practice · Physics Interactive Lab";
    renderQuestionBank($("#main"), new URLSearchParams(query));
  } else home();
  window.scrollTo(0, 0);
  lastFrame = 0;
  if (location.hash === "#simulations")
    requestAnimationFrame(() =>
      $("#simulations")?.scrollIntoView({
        behavior: reduced() ? "instant" : "smooth",
      }),
    );
}
function frame(now) {
  const dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0;
  lastFrame = now;
  if (hero) {
    if (!reduced() && !document.hidden) {
      for (let i = 0; i < Math.round(dt * 1800); i++)
        hero.state = stepOrbit(hero.state, hero.params, 2);
      hero.trail.push({ x: hero.state.x, y: hero.state.y });
      if (hero.trail.length > 600) hero.trail.shift();
    }
    heroView?.update(hero);
  }
  if (lab) {
    if (lab.type === "vectors" && lab.running && !document.hidden) {
      lab.vectorProgress = Math.min(
        1,
        lab.vectorProgress + (dt * lab.speed) / 5,
      );
      if (lab.vectorProgress >= 1) {
        lab.running = false;
        syncPlay();
      }
    } else if (lab.running && !document.hidden) {
      const rate = lab.definition.rateFor?.(lab.params) ?? lab.definition.rate;
      lab.accumulator += dt * lab.speed * rate;
      const h = integrationStep();
      const count = Math.min(1000, Math.floor(lab.accumulator / h));
      if (count > 0) {
        advance(count);
        lab.accumulator -= count * h;
      }
    }
    const displayLab =
      lab.type !== "fields" && lab.running && !lab.ended && lab.previousState
        ? {
            ...lab,
            state: visualState(
              lab.previousState,
              lab.state,
              lab.accumulator / integrationStep(),
            ),
          }
        : lab;
    if (lab.view === "3d" && view) view.update(displayLab);
    else if (lab.view === "2d") draw2D($("#simulation"), displayLab);
    if (now - lab.lastUI > 125) {
      updateReadouts();
      if (selectedGraph().spatial === "wave") lab.graphDirty = true;
      updateCharts();
      lab.lastUI = now;
    }
  }
  requestAnimationFrame(frame);
}
$("#lab-select").innerHTML =
  '<option value="">Jump to an experiment</option>' +
  CATEGORIES.slice(1)
    .map(
      (category) =>
        `<optgroup label="${category}">${Object.entries(SIMULATIONS)
          .filter(([id, d]) => d.category === category)
          .map(([id, d]) => `<option value="${id}">${d.short}</option>`)
          .join("")}</optgroup>`,
    )
    .join("");
$("#lab-select").onchange = (e) => {
  location.hash = e.target.value ? `/${e.target.value}` : "/";
};
$(".skip-link").onclick = (e) => {
  e.preventDefault();
  $("#main").focus();
  $("#main").scrollIntoView();
};
document.addEventListener("keydown", (e) => {
  if (
    e.code === "Space" &&
    lab &&
    !e.target.closest("input,select,textarea,button,a,summary")
  ) {
    e.preventDefault();
    $("#play").click();
  }
});
document.addEventListener("visibilitychange", () => {
  lastFrame = 0;
});
window.addEventListener("hashchange", route);
if (embedded) {
  document.body.classList.add("is-embedded");
  const bar = document.createElement("div");
  bar.id = "embed-bar";
  bar.innerHTML =
    '<span>PHYSICS INTERACTIVE LAB</span><button type="button" id="embed-expand">Model & calculations</button><a id="embed-open" target="_blank" rel="noopener">Open full lab ↗</a>';
  $("#main").before(bar);
  $("#embed-expand").onclick = () => $("#fullscreen")?.click();
}
route();
requestAnimationFrame(frame);
