import test from "node:test";
import assert from "node:assert/strict";
import {
  QUESTION_GROUPS,
  QUESTIONS,
  parseNumericAnswer,
  checkNumericAnswer,
  formatAnswer,
  CONSTANTS,
} from "../js/question-data.js";
import { readProgress, filterQuestions } from "../js/question-bank.js";
import { SIMULATIONS } from "../js/simulations.js";
test("312 original questions form 26 complete, uniquely identified topic groups with working lab links and book references", () => {
  assert.equal(QUESTION_GROUPS.length, 26);
  assert.equal(QUESTIONS.length, 312);
  assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, 312);
  assert.equal(new Set(QUESTIONS.map((q) => q.prompt)).size, 312);
  for (const group of QUESTION_GROUPS) {
    assert.equal(group.questions.length, 12);
    assert.ok(SIMULATIONS[group.model]);
    assert.ok(group.source[0].startsWith("https://openstax.org/books/"));
    assert.equal(
      group.questions.filter((q) => q.kind === "calculation").length,
      8,
    );
    assert.equal(
      group.questions.filter((q) => q.kind === "explanation").length,
      4,
    );
    for (const q of group.questions) {
      assert.ok(q.hint.length > 15);
      assert.ok(q.points.length >= 2);
      assert.ok([1, 2, 3].includes(q.difficulty));
      assert.equal(q.group, group.id);
      if (q.kind === "calculation") {
        assert.ok(Number.isFinite(q.answer));
        assert.ok(q.formula && q.substitution && q.unit);
        assert.ok(checkNumericAnswer(q, String(q.answer)).correct);
        assert.ok(checkNumericAnswer(q, formatAnswer(q.answer)).correct);
      } else assert.ok(q.answer.length > 80);
    }
  }
});
test("independent numerical reference fixtures check every topic, including signs and requested unit conversions", () => {
  const fixtures = {
    "measurement-07": 6.5,
    "kinematics-02": 39,
    "forces-07": 1.962,
    "equilibrium-03": 175,
    "energy-04": 72.5,
    "momentum-08": 3,
    "materials-04": 0.6,
    "circular-03": 12.5,
    "oscillations-07": 0.64,
    "waves-07": 637.5,
    "superposition-07": 850,
    "optics-07": 20,
    "electricity-08": 16,
    "circuits-07": 4,
    "gravitation-08": 4,
    "thermal-05": 360,
    "fields-08": 40,
    "capacitors-08": 25,
    "magnetism-03": 300000,
    "induction-07": 8,
    "alternating-07": 0.6,
    "quantum-07": 50,
    "matterwaves-05": 4,
    "nuclear-05": 18.63,
    "particles-02": 0,
    "astrophysics-02": 16,
  };
  for (const [id, answer] of Object.entries(fixtures))
    assert.ok(
      Math.abs(QUESTIONS.find((q) => q.id === id).answer - answer) < 1e-8,
      id,
    );
  assert.equal(QUESTIONS.find((q) => q.id === "momentum-03").answer, -3.6);
  assert.equal(
    QUESTIONS.find((q) => q.id === "fields-05").answer,
    200 * CONSTANTS.e,
  );
});
test("numerical checker accepts safe scientific notation and rejects expressions, units, infinities and empty input", () => {
  for (const raw of ["3.2e-5", "3.2 × 10^-5", "3.2x10-5"])
    assert.equal(parseNumericAnswer(raw), 3.2e-5);
  assert.equal(parseNumericAnswer("−4.0"), -4);
  for (const raw of [
    "",
    " ",
    "1/2",
    "alert(1)",
    "Infinity",
    "NaN",
    "4 V",
    "1e999",
    "0xFF",
  ])
    assert.equal(parseNumericAnswer(raw), null, raw);
  const q = { answer: 100 };
  assert.ok(checkNumericAnswer(q, "101.9").correct);
  assert.ok(!checkNumericAnswer(q, "102.1").correct);
  assert.ok(!checkNumericAnswer({ answer: -4 }, "4").correct);
  assert.ok(!checkNumericAnswer({ answer: 1e-20 }, "0").correct);
  assert.ok(checkNumericAnswer({ answer: 0 }, "0").correct);
});
test("filters combine stage, topic, question type, difficulty, search and progress without mutating the source", () => {
  assert.equal(filterQuestions({ topic: "quantum" }).length, 12);
  assert.equal(
    filterQuestions({ topic: "quantum", kind: "calculation" }).length,
    8,
  );
  assert.equal(filterQuestions({ stage: "Extension" }).length, 24);
  assert.equal(filterQuestions({ topic: "quantum", stage: "A2" }).length, 0);
  assert.ok(filterQuestions({ search: "threshold" }).length > 3);
  assert.ok(
    filterQuestions({ difficulty: 3 }).every((q) => q.difficulty === 3),
  );
  const p = { "quantum-01": { saved: true, status: "review" } };
  assert.equal(filterQuestions({ status: "saved" }, p)[0].id, "quantum-01");
  assert.equal(filterQuestions({ status: "unseen" }, p).length, 311);
  assert.equal(QUESTIONS.length, 312);
});
test("progress import handles missing storage, invalid JSON, unknown IDs and untrusted record fields", () => {
  assert.deepEqual(readProgress(null), {});
  assert.deepEqual(readProgress({ getItem: () => "{bad" }), {});
  const p = readProgress({
    getItem: () =>
      JSON.stringify({
        "quantum-01": { answer: "test", saved: true, status: "review" },
        unknown: { answer: "evil" },
        "quantum-02": { answer: 123, saved: "yes", status: "administrator" },
      }),
  });
  assert.deepEqual(p["quantum-01"], {
    answer: "test",
    saved: true,
    status: "review",
  });
  assert.equal(p.unknown, undefined);
  assert.deepEqual(p["quantum-02"], { answer: "", saved: false, status: "" });
});
