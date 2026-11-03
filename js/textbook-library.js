import { textbookGroups } from "./textbook-index.js";
import { textbookPractice } from "./textbook-practice.js";

const levels = ["Foundation", "Standard", "Challenge"];
const entries = textbookGroups.flatMap(([topic, stage, syllabus]) =>
  textbookPractice[topic].map(([, question], index) => ({
    topic, stage, syllabus, question, level: index + 1,
  })),
);

export function renderTextbookLibrary(container) {
  container.innerHTML = `
    <div class="page-width question-page teacher-page">
      <div class="breadcrumb"><a href="#/">Experiments</a><span>/</span><span>A Level practice</span></div>
      <section class="question-hero teacher-hero">
        <div>
          <div class="eyebrow">CAMBRIDGE 9702 · AS AND A LEVEL</div>
          <h1>A Level practice questions.</h1>
          <p>Work through three levels of practice drawn from the physics skills in Halliday, Resnick &amp; Walker’s <cite>Fundamentals of Physics</cite>, Extended 10th edition. The questions use newly written setups and data.</p>
          <div class="question-hero-actions"><a href="https://www.cambridgeinternational.org/Images/664565-2025-2027-syllabus.pdf" target="_blank" rel="noopener">9702 syllabus · 2025–2027 ↗</a></div>
        </div>
        <div class="teacher-hero-count"><strong>${entries.length}</strong>questions<span>${textbookGroups.length} topics · AS and A2</span></div>
      </section>
      <section class="question-filter-panel teacher-tools" aria-label="Filter practice questions">
        <div class="question-filters">
          <label>Course stage<select id="book-stage"><option value="">AS and A2</option><option>AS</option><option>A2</option></select></label>
          <label>Topic<select id="book-topic"><option value="">All topics</option>${textbookGroups.map(([topic]) => `<option>${topic}</option>`).join("")}</select></label>
          <label>Difficulty<select id="book-level"><option value="">All three levels</option>${levels.map((level, i) => `<option value="${i + 1}">${level}</option>`).join("")}</select></label>
        </div>
        <div class="question-tools"><button class="button" id="book-copy">Copy filtered questions</button></div>
        <p id="book-count" role="status"></p>
        <p id="book-status" role="status"></p>
        <label id="book-manual" hidden>Question text<textarea readonly rows="6"></textarea></label>
      </section>
      <div id="book-results"></div>
    </div>`;

  const find = (id) => container.querySelector(`#${id}`);
  const stage = find("book-stage");
  const topic = find("book-topic");
  const level = find("book-level");
  const manual = find("book-manual");
  const status = find("book-status");
  const button = find("book-copy");
  const results = find("book-results");
  let selection = [];

  function draw() {
    selection = entries.filter((entry) =>
      (!stage.value || entry.stage === stage.value) &&
      (!topic.value || entry.topic === topic.value) &&
      (!level.value || entry.level === Number(level.value)),
    ).sort((a, b) => a.level - b.level);
    find("book-count").textContent = `${selection.length} matching ${selection.length === 1 ? "question" : "questions"}`;
    button.disabled = !selection.length;
    manual.hidden = true;
    status.textContent = "";
    results.innerHTML = selection.length
      ? levels.map((name, index) => {
          const group = selection.filter((entry) => entry.level === index + 1);
          if (!group.length) return "";
          return `<section class="teacher-level-section">
            <h2><span class="question-level level-${index + 1}">${index + 1}</span> ${name}</h2>
            <div class="teacher-card-grid">${group.map((entry) => `
              <article class="question-card teacher-card">
                <div class="question-topic-label">${entry.stage} · CAMBRIDGE §${entry.syllabus}</div>
                <h3>${entry.topic}</h3>
                <p class="teacher-prompt">${entry.question}</p>
                <button class="button subtle" data-copy-row="${selection.indexOf(entry)}">Copy question</button>
              </article>`).join("")}</div>
          </section>`;
        }).join("")
      : '<div class="question-empty"><h3>No questions match these filters.</h3><p>Try another topic or course stage.</p></div>';
  }

  async function copy(text, rows, feedback) {
    try {
      await navigator.clipboard.writeText(text);
      if (selection !== rows) return;
      manual.hidden = true;
      status.textContent = feedback;
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

  for (const control of [stage, topic, level]) control.onchange = draw;
  button.onclick = () => {
    const text = selection.map(({ question }, i) => `${i + 1}. ${question}`).join("\n\n");
    return copy(text, selection, `${selection.length} ${selection.length === 1 ? "question" : "questions"} copied.`);
  };
  results.onclick = (event) => {
    const trigger = event.target.closest("[data-copy-row]");
    if (trigger) void copy(selection[Number(trigger.dataset.copyRow)].question, selection, "Question copied.");
  };
  draw();
}
