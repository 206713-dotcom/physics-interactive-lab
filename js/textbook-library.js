import { textbookGroups } from "./textbook-index.js";
import { textbookPractice } from "./textbook-practice.js";
import { practiceVariants } from "./textbook-variants.js";
import { olympiadPractice } from "./olympiad-practice.js";

const PAGE_SIZE = 15;
export const aLevelQuestions = textbookGroups.flatMap(([topic, stage, syllabus, chapter], group) =>
  textbookPractice[topic].flatMap(([problem, question], index) => {
    const level = index + 1;
    return [question, ...practiceVariants(group, level)].map((prompt, variant) => ({
      topic, stage, syllabus, chapter, problem, level, variant, question: prompt,
    }));
  }),
).sort((a, b) => a.level - b.level || a.variant - b.variant);

export function renderTextbookLibrary(container, olympiad = false, query = new URLSearchParams()) {
  const levels = olympiad ? ["Entry", "Advanced", "Stretch"] : ["Foundation", "Standard", "Challenge"];
  const entries = olympiad
    ? olympiadPractice.map(([topic, level, chapter, question]) => ({ topic, level, chapter, question })).sort((a, b) => a.level - b.level)
    : aLevelQuestions;
  const topics = [...new Set(entries.map((entry) => entry.topic))].map((name) => {
    const questions = entries.filter((entry) => entry.topic === name);
    return {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      stage: questions[0].stage,
      questions,
    };
  });
  const selected = topics.find(({ slug }) => slug === query.get("topic"));
  const route = olympiad ? "#/olympiad" : "#/textbook";
  const title = olympiad ? "Physics Olympiad practice" : "A Level practice";
  container.innerHTML = `
    <div class="page-width question-page teacher-page">
      <div class="breadcrumb"><a href="#/">Experiments</a><span>/</span>${selected ? `<a href="${route}">${title}</a><span>/</span><span>${selected.name}</span>` : `<span>${title}</span>`}</div>
      ${selected ? `
      <section class="practice-topic-heading">
        <a href="${route}">← All topics</a>
        <div class="eyebrow">${olympiad ? "PHYSICS OLYMPIAD" : `${selected.stage} · CAMBRIDGE 9702`}</div>
        <h1>${selected.name}</h1>
        <p>${selected.questions.length} questions across three difficulty levels.</p>
      </section>` : `
      <section class="question-hero teacher-hero">
        <div>
          <div class="eyebrow">${olympiad ? "PHYSICS OLYMPIAD · EXTENSION" : "CAMBRIDGE 9702 · AS AND A LEVEL"}</div>
          <h1>${title} questions.</h1>
          <p>${olympiad ? "Longer problems that combine ideas and ask for derivations. Topics follow Halliday, Resnick &amp; Walker’s Extended 10th edition." : "Practise 45 problem types mapped to Halliday, Resnick &amp; Walker’s <cite>Fundamentals of Physics</cite>, Extended 10th edition. Each type includes numerical variants for repeat practice."}</p>
          <div class="question-hero-actions">
            <a class="button" href="${olympiad ? "#/textbook" : "#/olympiad"}">${olympiad ? "A Level practice" : "Olympiad practice"} ↗</a>
            ${olympiad ? "" : '<a href="https://www.cambridgeinternational.org/Images/664565-2025-2027-syllabus.pdf" target="_blank" rel="noopener">9702 syllabus · 2025–2027 ↗</a>'}
          </div>
        </div>
        <div class="teacher-hero-count"><strong>${entries.length.toLocaleString("en-US")}</strong>questions<span>${topics.length} topics · ${olympiad ? "extension" : "AS and A2"}</span></div>
      </section>
      <div class="practice-topic-catalogue">
        ${(olympiad ? [undefined] : ["AS", "A2"]).map((stage) => `
          <section aria-label="${stage || "Olympiad"} topics">
            <h2>${stage ? `${stage} topics` : "Choose a topic"}</h2>
            <div class="teacher-card-grid">
              ${topics.filter((topic) => topic.stage === stage).map((topic) => `
                <a class="practice-topic-card" href="${route}?topic=${topic.slug}">
                  <span><strong>${topic.name}</strong><small>${topic.questions.length} questions</small></span>
                  <span aria-hidden="true">→</span>
                </a>`).join("")}
            </div>
          </section>`).join("")}
      </div>`}
      ${selected ? `
      <section class="question-filter-panel teacher-tools" aria-label="Filter practice questions">
        <div class="question-filters">
          <label>Difficulty<select id="book-level"><option value="">All three levels</option>${levels.map((level, i) => `<option value="${i + 1}">${level}</option>`).join("")}</select></label>
        </div>
        <div class="question-tools"><button class="button" id="book-copy">Copy filtered questions</button></div>
        <p id="book-count" role="status"></p>
        <p id="book-status" role="status"></p>
        <label id="book-manual" hidden>Question text<textarea readonly rows="6"></textarea></label>
      </section>
      <div id="book-results" tabindex="-1"></div>
      <nav class="question-pagination" id="book-pagination" aria-label="Practice pages">
        <button class="button subtle" id="book-prev">← Previous page</button>
        <span id="book-page" aria-live="polite"></span>
        <button class="button subtle" id="book-next">Next page →</button>
      </nav>` : ""}
    </div>`;

  if (!selected) return;
  const find = (id) => container.querySelector(`#${id}`);
  const level = find("book-level");
  const manual = find("book-manual");
  const status = find("book-status");
  const button = find("book-copy");
  const results = find("book-results");
  const prev = find("book-prev");
  const next = find("book-next");
  let selection = [];
  let page = 0;

  function draw() {
    const start = page * PAGE_SIZE;
    const visible = selection.slice(start, start + PAGE_SIZE);
    const pages = Math.max(1, Math.ceil(selection.length / PAGE_SIZE));
    find("book-count").textContent = `${selection.length.toLocaleString("en-US")} matching ${selection.length === 1 ? "question" : "questions"}${visible.length ? ` · Showing ${start + 1}–${start + visible.length}` : ""}`;
    find("book-page").textContent = `Page ${page + 1} of ${pages}`;
    find("book-pagination").hidden = pages === 1;
    prev.disabled = page === 0;
    next.disabled = page + 1 >= pages;
    button.disabled = !selection.length;
    manual.hidden = true;
    status.textContent = "";
    results.innerHTML = selection.length
      ? levels.map((name, index) => {
          const group = visible.filter((entry) => entry.level === index + 1);
          if (!group.length) return "";
          return `<section class="teacher-level-section">
            <h2><span class="question-level level-${index + 1}">${index + 1}</span> ${name}</h2>
            <div class="teacher-card-grid">${group.map((entry) => `
              <article class="question-card teacher-card">
                <div class="question-topic-label">${olympiad ? `OLYMPIAD · HALLIDAY CH. ${entry.chapter}` : `${entry.stage} · CAMBRIDGE §${entry.syllabus}`}</div>
                <h3>Question ${selected.questions.indexOf(entry) + 1}</h3>
                <p class="teacher-prompt">${entry.question}</p>
                ${olympiad ? "" : `<p class="teacher-chapter">Related reading · Halliday ch. ${entry.chapter}, problem ${entry.problem}</p>`}
                <button class="button subtle" data-copy-row="${selection.indexOf(entry)}">Copy question</button>
              </article>`).join("")}</div>
          </section>`;
        }).join("")
      : '<div class="question-empty"><h3>No questions at this difficulty.</h3><p>Try another difficulty.</p></div>';
  }

  async function copy(text, rows, feedback, trigger) {
    try {
      await navigator.clipboard.writeText(text);
      if (selection !== rows) return;
      manual.hidden = true;
      status.textContent = feedback;
      if (trigger) trigger.textContent = "Copied";
    } catch {
      if (selection !== rows) return;
      manual.hidden = false;
      const field = manual.querySelector("textarea");
      field.value = text;
      field.focus();
      field.select();
      status.textContent = "Use your device’s Copy command to copy the selected text.";
    }
  }

  function filter() {
    selection = selected.questions.filter((entry) =>
      (!level.value || entry.level === Number(level.value)),
    );
    page = 0;
    draw();
  }
  function turnPage(offset) {
    page += offset;
    draw();
    results.focus();
  }
  level.onchange = filter;
  prev.onclick = () => turnPage(-1);
  next.onclick = () => turnPage(1);
  button.onclick = () => {
    const text = selection.map(({ question }, i) => `${i + 1}. ${question}`).join("\n\n");
    return copy(text, selection, `${selection.length} ${selection.length === 1 ? "question" : "questions"} copied.`);
  };
  results.onclick = (event) => {
    const trigger = event.target.closest("[data-copy-row]");
    if (trigger) void copy(selection[Number(trigger.dataset.copyRow)].question, selection, "Question copied.", trigger);
  };
  filter();
}
