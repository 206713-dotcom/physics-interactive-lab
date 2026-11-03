import test from "node:test";
import assert from "node:assert/strict";
import { textbookGroups } from "../js/textbook-index.js";
import { textbookPractice } from "../js/textbook-practice.js";
import { aLevelQuestions } from "../js/textbook-library.js";

test("each textbook topic has three distinct questions matched to verified source references", () => {
  assert.equal(Object.keys(textbookPractice).length, textbookGroups.length);
  const prompts = new Set();
  for (const [topic, , , , references] of textbookGroups) {
    const questions = textbookPractice[topic];
    assert.equal(questions.length, 3, topic);
    questions.forEach(([number, prompt], index) => {
      assert.ok(references.some(([level, problem]) => level === index + 1 && problem === number), topic);
      assert.ok(prompt.trim().length && !prompts.has(prompt), topic);
      prompts.add(prompt);
    });
  }
});

test("the A Level bank has 1000 unique prompts with all three levels in every mapped topic", () => {
  assert.equal(aLevelQuestions.length, 1000);
  assert.equal(new Set(aLevelQuestions.map(({ question }) => question)).size, 1000);
  for (const [topic, stage, , , references] of textbookGroups) {
    for (const level of [1, 2, 3]) {
      const set = aLevelQuestions.filter((entry) => entry.topic === topic && entry.level === level);
      assert.ok(set.length >= 22);
      assert.ok(set.every((entry) => entry.stage === stage &&
        references.some(([rank, problem]) => rank === level && problem === entry.problem)));
    }
  }
});

test("all A Level entries have worked answers, including numerically checked representative variants", () => {
  assert.equal(aLevelQuestions.filter(({ answer }) => answer?.trim() && !/NaN|Infinity|undefined/.test(answer)).length, 1000);
  const answer = (topic, level, variant) =>
    aLevelQuestions.find((entry) => entry.topic === topic && entry.level === level && entry.variant === variant).answer;
  assert.match(answer("DC circuits", 3, 1), /6\.825 V.*2\.297 W/);
  assert.match(answer("Air columns", 3, 0), /720\.8 Hz, 961\.1 Hz and 1201\.4 Hz/);
  assert.match(answer("Straight-line motion", 3, 1), /They make contact/);
  assert.match(answer("Straight-line motion", 3, 21), /They stop without touching/);
  assert.match(answer("Magnetic flux and induction", 3, 0), /0\.648 V.*zero.*1\.296 V/);
});
