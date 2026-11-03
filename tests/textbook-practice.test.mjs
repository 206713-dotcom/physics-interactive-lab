import test from "node:test";
import assert from "node:assert/strict";
import { textbookGroups } from "../js/textbook-index.js";
import { textbookPractice } from "../js/textbook-practice.js";

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
