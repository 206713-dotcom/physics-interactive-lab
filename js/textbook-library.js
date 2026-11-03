import { textbookGroups } from "./textbook-index.js";

const levels = ["Foundation", "Standard", "Challenge"];
const pdfBuild = "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/legacy/build/";
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
      <div class="breadcrumb"><a href="#/">Experiments</a><span>/</span><span>A Level practice</span></div>
      <section class="question-hero teacher-hero">
        <div>
          <div class="eyebrow">TEACHER RESOURCES · CAMBRIDGE 9702</div>
          <h1>Textbook exercise index.</h1>
          <p>${source}. Find the actual problems by chapter and number, then copy your selection into a lesson plan.</p>
          <div class="question-hero-actions"><a href="https://www.cambridgeinternational.org/Images/664565-2025-2027-syllabus.pdf" target="_blank" rel="noopener">9702 syllabus · 2025–2027 ↗</a></div>
        </div>
        <div class="teacher-hero-count"><strong>${entries.length}</strong>textbook exercises<span>${textbookGroups.length} topics · AS and A2</span></div>
      </section>
      <section class="question-filter-panel teacher-tools" aria-label="Filter textbook references">
        <div class="book-local">
          <label for="book-file"><strong>Read the original questions from your PDF</strong></label>
          <p>Select the 1,450-page Extended 10th-edition PDF. The file stays in this browser.</p>
          <input type="file" id="book-file" accept=".pdf,application/pdf" aria-describedby="book-file-status">
          <p id="book-file-status" role="status">After choosing the file, use “View question page” on any card.</p>
        </div>
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
      <dialog id="book-reader" class="book-reader" aria-labelledby="book-reader-title">
        <header>
          <h2 id="book-reader-title"></h2>
          <form method="dialog"><button class="button subtle">Close</button></form>
        </header>
        <p><a id="book-reader-link" target="_blank" rel="noopener">Open PDF in a new tab to select text ↗</a></p>
        <p id="book-reader-status" role="status"></p>
        <div id="book-reader-page"></div>
      </dialog>
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
  const file = find("book-file");
  const reader = find("book-reader");
  const pageView = find("book-reader-page");
  const readerStatus = find("book-reader-status");
  const results = find("book-results");
  let selection = [];
  let pdfUrl = "";
  let loadingTask;
  let revision = 0;

  function releasePdf() {
    revision++;
    if (loadingTask) void loadingTask.destroy().catch(() => {});
    loadingTask = undefined;
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  }

  file.onchange = () => {
    const selected = file.files[0];
    if (!selected) return;
    if (selected.type !== "application/pdf" && !/\.pdf$/i.test(selected.name)) {
      file.value = "";
      find("book-file-status").textContent = "Choose a PDF file.";
      return;
    }
    releasePdf();
    pdfUrl = URL.createObjectURL(selected);
    find("book-file-status").textContent = "PDF ready. Open a question page below.";
  };

  results.onclick = async (event) => {
    const trigger = event.target.closest("[data-book-row]");
    if (!trigger) return;
    if (!pdfUrl) {
      file.focus();
      file.click();
      return;
    }
    const entry = selection[Number(trigger.dataset.bookRow)];
    const url = `${pdfUrl}#page=${entry.page}`;
    find("book-reader-title").textContent = locationText(entry);
    find("book-reader-link").href = url;
    pageView.replaceChildren();
    readerStatus.textContent = "Opening question page…";
    reader.showModal();
    const current = ++revision;
    try {
      if (!loadingTask) {
        const pdf = await import(pdfBuild + "pdf.min.mjs");
        if (current !== revision) return;
        pdf.GlobalWorkerOptions.workerSrc = pdfBuild + "pdf.worker.min.mjs";
        loadingTask = pdf.getDocument({ url: pdfUrl });
      }
      const document = await loadingTask.promise;
      if (current !== revision) return;
      if (document.numPages !== 1450) {
        readerStatus.textContent = "This PDF has a different page count. Use the printed page number to find the question.";
        return;
      }
      const page = await document.getPage(entry.page);
      if (current !== revision) return;
      const viewport = page.getViewport({ scale: 2 });
      const canvas = window.document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", `Original textbook page ${entry.page - 26}`);
      await page.render({ canvas, viewport }).promise;
      if (current !== revision) return;
      pageView.replaceChildren(canvas);
      pageView.scrollTop = 0;
      readerStatus.textContent = "";
    } catch {
      if (current !== revision) return;
      if (loadingTask) void loadingTask.destroy().catch(() => {});
      loadingTask = undefined;
      readerStatus.textContent = "The preview could not load. Open the PDF in a new tab and go to the page listed above.";
    }
  };
  reader.onclose = () => {
    revision++;
    pageView.replaceChildren();
  };

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
    results.innerHTML = selection.length
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
                <button class="button subtle" data-book-row="${selection.indexOf(entry)}">View question page</button>
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
  return () => {
    reader.close();
    releasePdf();
  };
}
