import { textbookGroups } from "./textbook-index.js";

const levels = ["Foundation", "Standard", "Challenge"];
const source = "Halliday, Resnick & Walker · Fundamentals of Physics, Extended · 10th edition";
const entries = textbookGroups.flatMap(([topic, stage, syllabus, chapter, problems]) =>
  problems.map(([level, problem, page, skill, figure]) => ({
    topic, stage, syllabus, chapter, level, problem, page, skill, figure,
  })),
);

function locationText(entry) {
  const { chapter, problem, page, figure } = entry;
  return `Ch. ${chapter}, problem ${problem} · printed p. ${page - 26} · PDF page ${page}${figure ? ` · Fig. ${figure}` : ""}`;
}

export function renderTextbookLibrary(container) {
  container.innerHTML = `
    <div class="page-width question-page teacher-page">
      <div class="breadcrumb"><a href="#/teacher">Teacher worksheets</a><span>/</span><span>Textbook exercise index</span></div>
      <section class="question-hero teacher-hero">
        <div>
          <div class="eyebrow">TEACHER RESOURCES · CAMBRIDGE 9702</div>
          <h1>Textbook exercise index.</h1>
          <p>${source}. Find the actual problems by chapter and number, then copy your selection into a lesson plan.</p>
          <div class="question-hero-actions"><a href="https://www.cambridgeinternational.org/Images/664565-2025-2027-syllabus.pdf" target="_blank" rel="noopener">9702 syllabus · 2025–2027 ↗</a><a href="#/teacher">Original worksheets ↗</a></div>
        </div>
        <div class="teacher-hero-count"><strong>${entries.length}</strong>textbook exercises<span>${textbookGroups.length} topics · AS and A2</span></div>
      </section>
      <section class="question-filter-panel teacher-tools" aria-label="Filter textbook references">
        <div class="question-filters">
          <label>Course stage<select id="book-stage"><option value="">AS and A2</option><option>AS</option><option>A2</option></select></label>
          <label>Topic<select id="book-topic"><option value="">All topics</option>${textbookGroups.map(([topic]) => `<option>${topic}</option>`).join("")}</select></label>
          <label>Difficulty<select id="book-level"><option value="">All three levels</option>${levels.map((level, i) => `<option value="${i + 1}">${level}</option>`).join("")}</select></label>
        </div>
        <div class="question-tools">
          <label class="question-print-option"><input type="checkbox" id="book-figures"> With figures only</label>
          <button class="button" id="book-copy">Copy assignment</button>
        </div>
        <p id="book-count" role="status"></p>
        <p id="book-status" role="status"></p>
        <label id="book-manual" hidden>Assignment references<textarea readonly rows="6"></textarea></label>
      </section>
      <div id="book-results"></div>
      <aside class="question-books teacher-source">
        <h2>Finding the problems</h2>
        <p>Use the numbered <strong>Problems</strong> at the end of each chapter. Printed pages refer to the numbers on the book pages. PDF pages refer to the supplied 1,450-page file and may differ in another copy. Figure labels point to the diagrams in the book.</p>
        <p>Foundation covers direct applications, Standard requires choosing or interpreting a model, and Challenge combines several steps. These are classroom difficulty ratings. Cambridge section numbers identify the related skills.</p>
      </aside>
    </div>`;

  const find = (id) => container.querySelector(`#${id}`);
  const stage = find("book-stage");
  const topic = find("book-topic");
  const level = find("book-level");
  const figures = find("book-figures");
  const manual = find("book-manual");
  const status = find("book-status");
  const button = find("book-copy");
  let selection = [];

  function draw() {
    selection = entries.filter((entry) =>
      (!stage.value || entry.stage === stage.value) &&
      (!topic.value || entry.topic === topic.value) &&
      (!level.value || entry.level === Number(level.value)) &&
      (!figures.checked || entry.figure),
    ).sort((a, b) => a.level - b.level);
    find("book-count").textContent = `${selection.length} matching ${selection.length === 1 ? "exercise" : "exercises"}`;
    button.disabled = !selection.length;
    manual.hidden = true;
    status.textContent = "";
    find("book-results").innerHTML = selection.length
      ? levels.map((name, i) => {
          const group = selection.filter((entry) => entry.level === i + 1);
          if (!group.length) return "";
          return `<section class="teacher-level-section">
            <h2><span class="question-level level-${i + 1}">${i + 1}</span> ${name}</h2>
            <div class="teacher-card-grid">${group.map((entry) => `
              <article class="question-card teacher-card">
                <div class="question-topic-label">${entry.stage} · CAMBRIDGE §${entry.syllabus}</div>
                <h3>${entry.topic}</h3>
                <p class="teacher-prompt">${entry.skill}</p>
                <p class="teacher-chapter">${locationText(entry)}</p>
              </article>`).join("")}</div>
          </section>`;
        }).join("")
      : '<div class="question-empty"><h3>No exercises match these filters.</h3><p>Try another topic or difficulty.</p></div>';
  }

  for (const control of [stage, topic, level, figures]) control.onchange = draw;
  button.onclick = async () => {
    const rows = selection;
    const assignment = [
      source,
      ...rows.map((entry, i) =>
        `${i + 1}. ${levels[entry.level - 1]} · ${entry.topic} · ${entry.stage} §${entry.syllabus}\n${locationText(entry)}\n${entry.skill}`,
      ),
    ].join("\n\n");
    try {
      await navigator.clipboard.writeText(assignment);
      if (selection !== rows) return;
      manual.hidden = true;
      status.textContent = `${rows.length} exercise references copied.`;
    } catch {
      if (selection !== rows) return;
      manual.hidden = false;
      const field = manual.querySelector("textarea");
      field.value = assignment;
      field.focus();
      field.select();
      status.textContent = "Use your device’s Copy command to copy the selected references.";
    }
  };
  draw();
}
