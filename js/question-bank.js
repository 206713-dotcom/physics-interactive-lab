import {
  QUESTION_GROUPS,
  QUESTIONS,
  DIFFICULTIES,
  CONSTANTS,
  formatAnswer,
  checkNumericAnswer,
} from "./question-data.js";
const KEY = "physics-lab-question-progress-v1",
  PAGE_SIZE = 12;
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function readProgress(storage) {
  try {
    const raw = JSON.parse(storage.getItem(KEY) || "{}"),
      out = {};
    for (const q of QUESTIONS) {
      const v = raw?.[q.id];
      if (v && typeof v === "object")
        out[q.id] = {
          answer: typeof v.answer === "string" ? v.answer.slice(0, 10000) : "",
          status: ["confident", "review"].includes(v.status) ? v.status : "",
          saved: v.saved === true,
        };
    }
    return out;
  } catch {
    return {};
  }
}
export function filterQuestions(
  {
    topic = "",
    stage = "",
    difficulty = "",
    kind = "",
    status = "",
    search = "",
  },
  progress = {},
) {
  const words = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return QUESTIONS.filter(
    (q) =>
      (!topic || q.group === topic) &&
      (!stage || q.stage === stage) &&
      (!difficulty || q.difficulty === Number(difficulty)) &&
      (!kind || q.kind === kind) &&
      (!status ||
        (status === "saved"
          ? progress[q.id]?.saved
          : status === "unseen"
            ? !progress[q.id]?.status
            : progress[q.id]?.status === status)) &&
      words.every((w) =>
        (
          q.prompt +
          " " +
          QUESTION_GROUPS.find((g) => g.id === q.group).title +
          " " +
          (q.formula || "")
        )
          .toLowerCase()
          .includes(w),
      ),
  );
}
export function renderQuestionBank(container, query = new URLSearchParams()) {
  let storage;
  try {
    storage = localStorage;
  } catch {
    storage = null;
  }
  const progress = readProgress(storage),
    filters = {
      topic: QUESTION_GROUPS.some((g) => g.id === query.get("topic"))
        ? query.get("topic")
        : "",
      stage: "",
      difficulty: "",
      kind: "",
      status: "",
      search: "",
    };
  let page = 1,
    mixedOrder = null;
  container.innerHTML = `<div class="page-width question-page"><div class="breadcrumb"><a href="#/">The laboratory</a><span>/</span><span>A Level practice</span></div><section class="question-hero"><div><div class="eyebrow">THE PHYSICS PRACTICE ROOM</div><h1>See it. Solve it.<br><em>Make it yours.</em></h1><p>Original A Level practice, grouped into manageable sets. Work through a topic, use a hint when you need one, then follow every step of the solution.</p><div class="question-hero-actions"><a class="button" href="#question-workspace">Start practising ↓</a><a href="#question-books">Explore the textbooks ↗</a></div></div><div class="question-orbit" aria-hidden="true"><span class="q-ring q-ring-one"></span><span class="q-ring q-ring-two"></span><span class="q-orbit-dot"></span><strong>${QUESTIONS.length}<small>questions to explore</small></strong><div>26 topics · AS → A2 → extension</div></div></section><div class="question-overview"><div><strong>${QUESTIONS.filter((q) => q.kind === "calculation").length}</strong><span>calculation questions</span></div><div><strong>${QUESTIONS.filter((q) => q.kind === "explanation").length}</strong><span>explanation questions</span></div><div><strong id="question-confidence-count">0</strong><span>marked confident by you</span></div><div><strong id="question-saved-count">0</strong><span>saved for later</span></div></div><div class="question-workspace" id="question-workspace"><aside class="question-sidebar"><div class="eyebrow">YOUR TOPIC GROUPS</div><button class="question-topic" data-topic="">All topics <span>312</span></button>${QUESTION_GROUPS.map((g, i) => `<button class="question-topic" data-topic="${g.id}"><span class="q-topic-num">${String(i + 1).padStart(2, "0")}</span><span>${escape(g.title)}<small>${g.stage} · 12 questions</small></span><span data-topic-progress="${g.id}">0/12</span></button>`).join("")}</aside><section class="question-main"><div class="question-filter-panel"><label class="question-search">Search the question bank<input type="search" id="question-search" placeholder="Try momentum, threshold, energy…"></label><div class="question-filters"><label>Course stage<select data-filter="stage"><option value="">All stages</option><option>AS</option><option>A2</option><option>Extension</option></select></label><label>Difficulty<select data-filter="difficulty"><option value="">All levels</option>${Object.entries(
    DIFFICULTIES,
  )
    .map(([v, n]) => `<option value="${v}">${n}</option>`)
    .join(
      "",
    )}</select></label><label>Question type<select data-filter="kind"><option value="">All types</option><option value="calculation">Calculate</option><option value="explanation">Explain</option></select></label><label>My progress<select data-filter="status"><option value="">Everything</option><option value="saved">Saved</option><option value="review">Needs review</option><option value="confident">Confident</option><option value="unseen">Not rated yet</option></select></label></div><div class="question-tools"><button class="button subtle" data-action="mix">Mix this selection</button><button class="button subtle" data-action="clear">Clear filters</button><button class="button subtle" data-action="print">Print this set</button><label class="question-print-option"><input type="checkbox" id="question-print-answers">Include answers in print</label></div></div><div class="question-set-heading" id="question-set-heading"></div><p id="question-result-count" role="status"></p><div id="question-list"></div><nav class="question-pagination" aria-label="Question pages"></nav><p class="question-storage-note" id="question-storage-note">${storage ? "Your answers, saved questions and confidence ratings stay in this browser. No account is needed." : "Browser storage is unavailable. You can practise, but progress will last only for this visit."}</p><div class="question-progress-tools"><button class="button subtle" data-action="export">Export my progress</button><label class="button subtle">Import progress<input type="file" id="question-import" accept="application/json,.json" class="sr-only"></label><button class="button subtle" data-action="reset-progress">Clear my progress</button></div><p id="question-feedback" role="status"></p></section></div><section class="question-books" id="question-books"><div class="eyebrow">THE READING SHELF</div><h2>Read the physics behind the questions.</h2><p>These are original practice questions with original worked explanations. OpenStax chapters provide further reading and equation references; textbook exercise text has not been copied. Topic labels are broad study guidance, not an exam-board specification or an official mark scheme. The particle and astrophysics groups include extension material.</p><div class="question-book-grid">${[1, 2, 3].map((n) => `<a href="https://openstax.org/details/books/university-physics-volume-${n}" target="_blank" rel="noopener"><span>OPENSTAX · VOLUME 0${n}</span><h3>${["Mechanics, oscillations & waves", "Thermal physics & electromagnetism", "Optics, quantum & nuclear physics"][n - 1]}</h3><p>University Physics by Moebs, Ling & Sanny</p><strong>Read the free textbook ↗</strong></a>`).join("")}</div><details class="question-constants"><summary>Constants and answer-checking conventions</summary><p>Unless a question supplies its own approximation: g=${CONSTANTS.g} m/s², G=${CONSTANTS.G} N m²/kg², c=${CONSTANTS.c} m/s, h=${CONSTANTS.h} J s, e=${CONSTANTS.e} C, k=${CONSTANTS.k} J/K, R=${CONSTANTS.R} J/(mol K). The full reference constants are in the source.</p><p>Numerical checks accept ±2% of the reference result in the requested unit. A zero result uses an absolute tolerance of 10⁻¹². Enter a plain number or notation such as 3.2e-5. This checks the final number only: use the solution points to assess method, units and explanations. Mark allocations are suggested practice guidance.</p></details></section></div>`;
  const $ = (s) => container.querySelector(s);
  for (const anchor of container.querySelectorAll(
    'a[href="#question-workspace"],a[href="#question-books"]',
  ))
    anchor.onclick = (event) => {
      event.preventDefault();
      $(anchor.getAttribute("href")).scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    };
  function persist() {
    try {
      if (!storage) return;
      storage.setItem(KEY, JSON.stringify(progress));
    } catch {
      $("#question-storage-note").textContent =
        "This browser could not save progress. Export it to keep a copy.";
    }
  }
  function entry(id) {
    return (progress[id] ??= { answer: "", status: "", saved: false });
  }
  function updateProgress() {
    $("#question-confidence-count").textContent = QUESTIONS.filter(
      (q) => progress[q.id]?.status === "confident",
    ).length;
    $("#question-saved-count").textContent = QUESTIONS.filter(
      (q) => progress[q.id]?.saved,
    ).length;
    for (const el of container.querySelectorAll("[data-topic-progress]"))
      el.textContent = `${QUESTION_GROUPS.find((g) => g.id === el.dataset.topicProgress).questions.filter((q) => progress[q.id]?.status === "confident").length}/12`;
  }
  function draw() {
    let filtered = filterQuestions(filters, progress);
    if (mixedOrder)
      filtered.sort(
        (a, b) => mixedOrder.indexOf(a.id) - mixedOrder.indexOf(b.id),
      );
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    page = Math.min(page, pages);
    const list = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      group = QUESTION_GROUPS.find((g) => g.id === filters.topic);
    for (const b of container.querySelectorAll("[data-topic]")) {
      const selected = b.dataset.topic === filters.topic;
      b.classList.toggle("selected", selected);
      b.setAttribute("aria-pressed", String(selected));
    }
    $("#question-set-heading").innerHTML = group
      ? `<div class="eyebrow">${escape(group.stage)} · TOPIC PRACTICE</div><h2>${escape(group.title)}</h2><p>${escape(group.focus)}</p><div class="question-group-links"><a href="#/${group.model}">Explore the matching simulation ↗</a><a href="${group.source[0]}" target="_blank" rel="noopener">${escape(group.source[1])} ↗</a><a href="#/questions?topic=${group.id}">Link to this topic ↗</a></div>`
      : '<div class="eyebrow">BUILD YOUR PRACTICE SET</div><h2>A little progress, every question.</h2><p>Choose a topic or combine filters. Each page is a printable set of up to twelve questions.</p>';
    $("#question-result-count").textContent =
      `${filtered.length} matching questions · ${list.length ? `showing ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + list.length}` : "no results"} · page ${page} of ${pages}`;
    $("#question-list").innerHTML = list.length
      ? list
          .map((q) => {
            const state = progress[q.id] || {},
              g = QUESTION_GROUPS.find((g) => g.id === q.group),
              answer =
                q.kind === "calculation"
                  ? `${formatAnswer(q.answer)} ${q.unit}`
                  : q.answer;
            return `<article class="question-card" data-question="${q.id}"><div class="question-card-top"><div><span class="question-id">${q.id.toUpperCase()}</span><span class="question-level level-${q.difficulty}">${DIFFICULTIES[q.difficulty]}</span><span class="question-mark">${q.marks} practice marks</span></div><button class="question-save" data-action="save" aria-label="${state.saved ? "Unsave" : "Save"} question ${q.id}" aria-pressed="${!!state.saved}">${state.saved ? "★ Saved" : "☆ Save"}</button></div><div class="question-topic-label">${escape(g.title)} · ${q.kind === "calculation" ? "CALCULATE" : "EXPLAIN"}</div><h3>${escape(q.prompt)}</h3><div class="question-response"><label for="answer-${q.id}">${q.kind === "calculation" ? `Your numerical answer in ${escape(q.unit)}` : "Your explanation"}</label>${q.kind === "calculation" ? `<div class="question-numeric-row"><input type="text" inputmode="text" id="answer-${q.id}" data-answer="${q.id}" value="${escape(state.answer || "")}" placeholder="e.g. 3.2e-5" autocomplete="off"><span>${escape(q.unit)}</span><button class="button" data-action="check">Check number</button></div>` : `<textarea id="answer-${q.id}" data-answer="${q.id}" rows="3" placeholder="Build your explanation one physical idea at a time…">${escape(state.answer || "")}</textarea>`}<p class="question-answer-feedback" role="status"></p></div><details class="question-hint"><summary>Give me a hint</summary><p>${escape(q.hint)}</p></details><details class="question-solution"><summary>Show worked solution</summary><div class="question-solution-content">${q.kind === "calculation" ? `<ol>${q.steps.map((x) => `<li>${escape(x)}</li>`).join("")}<li><strong>${escape(answer)}</strong></li></ol>` : `<p>${escape(answer)}</p>`}<div class="question-method"><strong>Check your reasoning</strong><ul>${q.points.map((p) => `<li>${escape(p)}</li>`).join("")}</ul></div><a href="${g.source[0]}" target="_blank" rel="noopener">Read the related textbook chapter ↗</a></div></details><div class="question-rating"><span>After checking, how do you feel?</span><button data-action="rate" data-rating="review" aria-pressed="${state.status === "review"}">↺ Needs review</button><button data-action="rate" data-rating="confident" aria-pressed="${state.status === "confident"}">✓ Confident</button></div></article>`;
          })
          .join("")
      : '<div class="question-empty"><h3>No questions match this selection.</h3><p>Try fewer filters, another topic, or clear the search.</p></div>';
    $(".question-pagination").innerHTML =
      `<button class="button subtle" data-action="previous" ${page === 1 ? "disabled" : ""}>← Previous set</button><span>Set ${page} / ${pages}</span><button class="button subtle" data-action="next" ${page === pages ? "disabled" : ""}>Next set →</button>`;
    updateProgress();
  }
  function refresh() {
    page = 1;
    mixedOrder = null;
    draw();
  }
  $("#question-search").oninput = (e) => {
    filters.search = e.target.value;
    refresh();
  };
  for (const select of container.querySelectorAll("[data-filter]"))
    select.onchange = (e) => {
      filters[e.target.dataset.filter] = e.target.value;
      refresh();
    };
  container.oninput = (e) => {
    if (e.target.dataset.answer) {
      entry(e.target.dataset.answer).answer = e.target.value.slice(0, 10000);
      persist();
    }
  };
  container.onclick = (e) => {
    const topic = e.target.closest("[data-topic]");
    if (topic) {
      filters.topic = topic.dataset.topic;
      history.replaceState(
        null,
        "",
        `#/questions${filters.topic ? "?topic=" + filters.topic : ""}`,
      );
      refresh();
      $("#question-set-heading").scrollIntoView({
        block: "start",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
      return;
    }
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const card = b.closest("[data-question]"),
      id = card?.dataset.question;
    switch (b.dataset.action) {
      case "check": {
        const q = QUESTIONS.find((q) => q.id === id),
          result = checkNumericAnswer(
            q,
            card.querySelector("[data-answer]").value,
          ),
          f = card.querySelector(".question-answer-feedback");
        f.textContent = !result.valid
          ? "Enter a finite number in the requested unit, such as 3.2e-5."
          : result.correct
            ? "✓ Your numerical result agrees within 2%. Open the working to check your method and units."
            : "Check your unit conversion and equation. Try a hint, then compare the worked solution.";
        f.dataset.correct = String(result.correct);
        break;
      }
      case "save": {
        const v = entry(id);
        v.saved = !v.saved;
        b.textContent = v.saved ? "★ Saved" : "☆ Save";
        b.setAttribute("aria-pressed", String(v.saved));
        b.setAttribute(
          "aria-label",
          `${v.saved ? "Unsave" : "Save"} question ${id}`,
        );
        persist();
        if (filters.status === "saved") draw();
        else updateProgress();
        break;
      }
      case "rate": {
        entry(id).status =
          entry(id).status === b.dataset.rating ? "" : b.dataset.rating;
        for (const r of card.querySelectorAll("[data-rating]"))
          r.setAttribute(
            "aria-pressed",
            String(r.dataset.rating === entry(id).status),
          );
        persist();
        if (filters.status) draw();
        else updateProgress();
        break;
      }
      case "previous":
        page--;
        draw();
        $("#question-set-heading").scrollIntoView();
        break;
      case "next":
        page++;
        draw();
        $("#question-set-heading").scrollIntoView();
        break;
      case "mix": {
        mixedOrder = filterQuestions(filters, progress).map((q) => q.id);
        for (let i = mixedOrder.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [mixedOrder[i], mixedOrder[j]] = [mixedOrder[j], mixedOrder[i]];
        }
        page = 1;
        draw();
        break;
      }
      case "clear": {
        for (const key of Object.keys(filters)) filters[key] = "";
        for (const select of container.querySelectorAll("[data-filter]"))
          select.value = "";
        $("#question-search").value = "";
        history.replaceState(null, "", "#/questions");
        refresh();
        break;
      }
      case "print": {
        const show = $("#question-print-answers").checked,
          solutions = [...container.querySelectorAll(".question-solution")],
          open = solutions.map((x) => x.open);
        container.classList.toggle("print-answers", show);
        if (show) solutions.forEach((x) => (x.open = true));
        window.print();
        solutions.forEach((x, i) => (x.open = open[i]));
        container.classList.remove("print-answers");
        break;
      }
      case "export": {
        const blob = new Blob(
            [
              JSON.stringify(
                { format: "physics-lab-question-progress-v1", progress },
                null,
                2,
              ),
            ],
            { type: "application/json" },
          ),
          url = URL.createObjectURL(blob),
          a = document.createElement("a");
        a.href = url;
        a.download = "physics-practice-progress.json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        $("#question-feedback").textContent =
          "Progress exported. Keep this file to restore it in another browser.";
        break;
      }
      case "reset-progress": {
        if (b.dataset.confirm !== "yes") {
          b.dataset.confirm = "yes";
          b.textContent = "Click again to clear saved progress";
          break;
        }
        for (const key of Object.keys(progress)) delete progress[key];
        persist();
        b.dataset.confirm = "";
        b.textContent = "Clear my progress";
        draw();
        $("#question-feedback").textContent =
          "Practice progress cleared in this browser.";
        break;
      }
    }
  };
  $("#question-import").onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 5000000) throw new Error("File is too large.");
      const data = JSON.parse(await file.text());
      if (
        data.format !== "physics-lab-question-progress-v1" ||
        !data.progress ||
        typeof data.progress !== "object"
      )
        throw new Error("Choose a Physics Lab progress export.");
      const imported = readProgress({
        getItem: () => JSON.stringify(data.progress),
      });
      Object.assign(progress, imported);
      persist();
      draw();
      $("#question-feedback").textContent =
        "Progress imported. Existing records are preserved unless the imported file supplies the same question.";
    } catch (error) {
      $("#question-feedback").textContent = `Import failed: ${error.message}`;
    }
    e.target.value = "";
  };
  draw();
}
