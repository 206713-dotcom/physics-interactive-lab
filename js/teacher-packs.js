import { teacherSets } from "./teacher-questions.js";

const levels = [
  ["Foundation", "Recall a relationship and apply it directly."],
  ["Standard", "Identify the model and interpret the given information."],
  ["Challenge", "Link several steps or justify a prediction."],
];
const syllabusUrl = "https://www.cambridgeinternational.org/Images/664565-2025-2027-syllabus.pdf";
const bookUrl = "https://bcs.wiley.com/he-bcs/Books?action=contents&bcsId=8262&itemId=1118230728";

export function worksheetText(rows, answers) {
  const title = answers ? "9702 Physics · Worked answer key" : "9702 Physics · Practice worksheet";
  return [
    title,
    ...rows.map(({ set, level }, index) =>
      `${index + 1}. ${set.title} · ${set.stage} · ${levels[level][0]} · 9702 §${set.syllabus}\n${set.questions[level][answers ? 1 : 0]}`,
    ),
  ].join("\n\n");
}

export function renderTeacherPacks(container) {
  container.innerHTML = `
    <div class="page-width question-page teacher-page">
      <div class="breadcrumb"><a href="#/questions">A Level practice</a><span>/</span><span>Teacher worksheets</span></div>
      <section class="question-hero teacher-hero">
        <div>
          <div class="eyebrow">TEACHER WORKSHEETS · CAMBRIDGE 9702</div>
          <h1>Build a physics worksheet.</h1>
          <p>Choose a topic and difficulty, then copy the questions and worked answers separately into your lesson.</p>
          <div class="question-hero-actions"><a href="${syllabusUrl}" target="_blank" rel="noopener">Cambridge syllabus · 2025–2027 ↗</a><a href="${bookUrl}" target="_blank" rel="noopener">Wiley chapter guide ↗</a></div>
        </div>
        <div class="teacher-hero-count"><strong>${teacherSets.length * levels.length}</strong>original questions<span>${teacherSets.length} topics · AS and A2</span></div>
      </section>
      <section class="question-filter-panel teacher-tools" aria-label="Build your worksheet">
        <div class="question-filters">
          <label>Course stage<select id="teacher-stage"><option value="">AS and A2</option><option>AS</option><option>A2</option></select></label>
          <label>Topic<select id="teacher-topic"><option value="">All topics</option>${teacherSets.map((set) => `<option value="${set.id}">${set.title}</option>`).join("")}</select></label>
          <label>Difficulty<select id="teacher-level"><option value="">All three levels</option>${levels.map(([name], i) => `<option value="${i}">${name}</option>`).join("")}</select></label>
        </div>
        <div class="question-tools">
          <button class="button" id="teacher-copy">Copy questions</button>
          <button class="button subtle" id="teacher-key">Copy answer key</button>
        </div>
        <p id="teacher-count" role="status"></p>
        <p id="teacher-copy-status" role="status"></p>
        <label id="teacher-manual" hidden>Worksheet text<textarea readonly rows="6"></textarea></label>
      </section>
      <div id="teacher-results"></div>
      <aside class="question-books teacher-source">
        <div class="eyebrow">SOURCE NOTES</div>
        <h2>Read alongside Halliday, Resnick &amp; Walker.</h2>
        <p>Chapter references use Wiley’s <cite>Fundamentals of Physics, Extended</cite>, 10th edition. The practice and worked answers here are original and may be copied and adapted for lessons. Difficulty describes the number and type of reasoning steps. AS and A2 describe syllabus placement.</p>
        <p>The packs sample eight syllabus topics. For the book, focus on the listed concepts within each chapter. Calculus-based rotational dynamics, Gauss’s law and relativity are outside the selected 9702 scope.</p>
      </aside>
    </div>`;

  const find = (id) => container.querySelector(`#${id}`);
  const stage = find("teacher-stage");
  const topic = find("teacher-topic");
  const difficulty = find("teacher-level");
  const manual = find("teacher-manual");
  const status = find("teacher-copy-status");
  let rows = [];

  function draw() {
    const sets = teacherSets.filter((set) =>
      (!stage.value || set.stage === stage.value) && (!topic.value || set.id === topic.value),
    );
    const sections = levels.map(([name, description], level) => {
      if (difficulty.value !== "" && Number(difficulty.value) !== level) return "";
      return `<section class="teacher-level-section">
        <h2><span class="question-level level-${level + 1}">${level + 1}</span> ${name}</h2>
        <p>${description}</p>
        <div class="teacher-card-grid">${sets.map((set) => {
          const [prompt, solution] = set.questions[level];
          rows.push({ set, level });
          return `<article class="question-card teacher-card">
            <div class="question-topic-label">${set.stage} · CAMBRIDGE §${set.syllabus}</div>
            <h3>${set.title}</h3>
            <p class="teacher-prompt">${prompt}</p>
            <details class="question-solution"><summary>Show worked answer</summary><div class="question-solution-content"><p>${solution}</p></div></details>
            <p class="teacher-chapter"><a href="${bookUrl}" target="_blank" rel="noopener">Wiley ch. ${set.chapters} ↗</a> · ${set.scope}</p>
          </article>`;
        }).join("")}</div>
      </section>`;
    });
    find("teacher-results").innerHTML = sets.length ? sections.join("") :
      '<div class="question-empty"><h3>No questions match these filters.</h3><p>Choose another topic or course stage.</p></div>';
    find("teacher-count").textContent = `${rows.length} ${rows.length === 1 ? "question" : "questions"} in this worksheet`;
    find("teacher-copy").disabled = find("teacher-key").disabled = !rows.length;
  }

  for (const select of [stage, topic, difficulty]) {
    select.addEventListener("change", () => {
      rows = [];
      manual.hidden = true;
      status.textContent = "";
      draw();
    });
  }

  async function copy(answers) {
    const selected = rows;
    const value = worksheetText(selected, answers);
    try {
      await navigator.clipboard.writeText(value);
      if (selected !== rows) return;
      manual.hidden = true;
      status.textContent = answers ? "Answer key copied." : "Questions copied.";
    } catch {
      if (selected !== rows) return;
      manual.hidden = false;
      const field = manual.querySelector("textarea");
      field.value = value;
      field.focus();
      field.select();
      status.textContent = "Use your device’s Copy command to copy the selected text.";
    }
  }

  find("teacher-copy").onclick = () => copy(false);
  find("teacher-key").onclick = () => copy(true);
  draw();
}
