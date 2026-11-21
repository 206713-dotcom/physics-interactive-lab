/** The lesson board under each experiment: one place for the idea, what to
 * watch, something to try and a question to check yourself. It replaces four
 * blocks that used to repeat the same focus, equation and task. Everything it
 * shows comes from the learning profile of the level being studied. */
import { getProfile, syllabusLink } from "./learning-paths.js";
import { mathHTML } from "./math-display.js";
import { levelText } from "./level-wording.js";

const esc = mathHTML;
/** Accent per card, so the board is not one colour from top to bottom. */
const ACCENTS = ["#ff8a3d", "#4fc3f7", "#a3e05c", "#c79bff", "#ffd34d"];

/** Only lines that survive the level's wording rules are shown. */
const shown = (text) => levelText(String(text ?? "").trim());

export function lessonBoardMarkup({ id, mode, cycle = "current", topic = null, application = "" }) {
  const p = getProfile(id, mode),
    goals = p.goals.map(shown).filter(Boolean).slice(0, 3),
    world = shown(application),
    where = [
      topic ? `<span>${esc(topic)}</span>` : "",
      ...p.refs.slice(0, 3).map((ref) => `<a href="${syllabusLink(mode, ref, cycle)}" target="_blank" rel="noopener" title="Open syllabus section ${esc(ref)}">§${esc(ref)}</a>`),
    ].join("");
  return `<section class="lesson-board" aria-labelledby="lesson-board-title">
    <div class="lesson-idea">
      <div class="lesson-idea-copy">
        <p class="lesson-where">${where}</p>
        <h2 id="lesson-board-title">${esc(shown(p.focus))}</h2>
      </div>
      <div class="lesson-rule" style="--accent:${ACCENTS[0]}">
        <span class="lesson-label">The key idea</span>
        <p class="lesson-rule-text">${esc(shown(p.equation))}</p>
      </div>
    </div>
    ${goals.length ? `<div class="lesson-watch-block"><h3 class="lesson-label">Watch for</h3><ol class="lesson-watch">${goals
      .map((goal, i) => `<li style="--accent:${ACCENTS[(i + 1) % ACCENTS.length]}"><span class="lesson-step" aria-hidden="true">${i + 1}</span><p>${esc(goal)}</p></li>`)
      .join("")}</ol></div>` : ""}
    <div class="lesson-act">
      <article class="lesson-card lesson-try" style="--accent:${ACCENTS[1]}">
        <h3 class="lesson-label">Try this</h3>
        <p>${esc(shown(p.task))}</p>
        <button type="button" class="lesson-button" data-lesson-setup>Load this setup</button>
      </article>
      <article class="lesson-card lesson-check" style="--accent:${ACCENTS[3]}">
        <h3 class="lesson-label">Check yourself</h3>
        <p class="lesson-question">${esc(shown(p.question))}</p>
        <button type="button" class="lesson-button" data-lesson-answer aria-expanded="false" aria-controls="lesson-answer">Show the answer</button>
        <p class="lesson-answer" id="lesson-answer" hidden>${esc(shown(p.answer))}</p>
      </article>
    </div>
    ${world ? `<aside class="lesson-world" style="--accent:${ACCENTS[2]}"><span class="lesson-label">In the real world</span><p>${esc(world)}</p></aside>` : ""}
  </section>`;
}

/** Insert the board after `anchor` and wire its two buttons. */
export function installLessonBoard(anchor, options, { onSetup }) {
  anchor.insertAdjacentHTML("afterend", lessonBoardMarkup(options));
  const board = anchor.nextElementSibling;
  board.querySelector("[data-lesson-setup]").onclick = () => {
    onSetup?.();
    anchor.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
  };
  const toggle = board.querySelector("[data-lesson-answer]"), answer = board.querySelector("#lesson-answer");
  toggle.onclick = () => {
    answer.hidden = !answer.hidden;
    toggle.setAttribute("aria-expanded", String(!answer.hidden));
    toggle.textContent = answer.hidden ? "Show the answer" : "Hide the answer";
  };
  return board;
}
