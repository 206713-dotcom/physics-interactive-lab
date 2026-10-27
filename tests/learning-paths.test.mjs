import test from "node:test";
import assert from "node:assert/strict";
import { SIMULATIONS } from "../js/simulations.js";
import {
  LEARNING_PATHS,
  availableModes,
  resolveMode,
  getProfile,
  stageFor,
  SYLLABUS_SECTIONS,
  syllabusLink,
} from "../js/learning-paths.js";
import { calculationSheet } from "../js/calculations.js";
import { experimentLink } from "../js/integration.js";
test("every existing model has an explicit learning classification; enrichment does not pretend to be examined content", () => {
  assert.deepEqual(
    Object.keys(LEARNING_PATHS).sort(),
    Object.keys(SIMULATIONS).sort(),
  );
  for (const id of ["binary", "threebody", "doublependulum"])
    assert.deepEqual(availableModes(id), ["enrichment"]);
  assert.deepEqual(availableModes("spring"), ["alevel"]);
  assert.deepEqual(stageFor(getProfile("spring", "alevel")), ["A2"]);
  assert.deepEqual(availableModes("lenses"), ["igcse"]);
  assert.deepEqual(availableModes("buoyancy"), ["igcse", "alevel"]);
  assert.deepEqual(stageFor(getProfile("interference", "alevel")), ["AS"]);
});
test("all cited section identifiers exist in the checked syllabus editions and links target real PDF pages", () => {
  for (const profiles of Object.values(LEARNING_PATHS))
    for (const [mode, p] of Object.entries(profiles))
      for (const ref of p.refs) {
        assert.ok(SYLLABUS_SECTIONS[mode][ref] > 0, mode + ":" + ref);
        if (mode === "alevel") assert.ok(SYLLABUS_SECTIONS.alevelNext[ref] > 0);
        for (const cycle of ["current", "next"])
          assert.match(
            syllabusLink(mode, ref, cycle),
            /^https:\/\/www\.cambridgeinternational\.org\/Images\/.*\.pdf#page=\d+$/,
          );
      }
});
test("all 91 teaching profiles provide usable investigations and supported physical starting conditions", () => {
  let count = 0;
  for (const [id, profiles] of Object.entries(LEARNING_PATHS))
    for (const p of Object.values(profiles)) {
      count++;
      assert.equal(p.goals.length, 3);
      assert.ok(p.goals.every((g) => g.trim()));
      assert.ok(p.task.trim() && p.question.trim() && p.answer.trim());
      const d = SIMULATIONS[id],
        setup = { ...d.defaults, ...p.setup };
      assert.doesNotThrow(() => d.create(setup), id);
      for (const key of p.controls)
        assert.ok(
          d.controls.some((c) => c.key === key),
          id + ":" + key,
        );
    }
  assert.equal(count, 91);
});
test("mode-focused calculations use existing authoritative results, with no invented readings", () => {
  for (const [id, profiles] of Object.entries(LEARNING_PATHS)) {
    const d = SIMULATIONS[id],
      r = d.create(d.defaults),
      before = JSON.stringify(r),
      sheet = calculationSheet(id, r.state, r.params);
    for (const p of Object.values(profiles))
      for (const key of p.calculations) {
        const result = sheet.calculations.find((c) => c.id === key);
        assert.ok(result, id + ":" + key);
        assert.ok(result.value === null || Number.isFinite(result.value));
      }
    assert.equal(JSON.stringify(r), before);
  }
});
test("shared and embedded URLs preserve learning mode, edition and exact physical parameters", () => {
  for (const [id, profiles] of Object.entries(LEARNING_PATHS))
    for (const mode of Object.keys(profiles)) {
      const d = SIMULATIONS[id],
        url = new URL(
          experimentLink({
            baseURL: "https://example.com/physics-interactive-lab/",
            model: id,
            params: d.defaults,
            studyMode: mode,
            syllabusCycle: "next",
            embed: true,
          }),
        ),
        q = new URLSearchParams(url.hash.split("?")[1]);
      assert.equal(q.get("level"), mode);
      assert.equal(q.get("cycle"), "next");
      assert.equal(url.search, "?embed=1");
      for (const [k, v] of Object.entries(d.defaults))
        assert.equal(Number(q.get(k)), v);
    }
  assert.equal(resolveMode("spring", "igcse"), "alevel");
  assert.equal(resolveMode("binary", "alevel"), "enrichment");
});
test("recommended starters expose the intended physical regime rather than silently changing the solver", () => {
  assert.equal(getProfile("pendulum", "igcse").setup.angle, 10);
  assert.equal(getProfile("waves", "igcse").setup.reflection, 0);
  assert.equal(getProfile("circuits", "alevel").setup.discharge, 1);
  const d = SIMULATIONS.polarisation,
    p = {
      ...d.defaults,
      ...getProfile("polarisation", "alevel").setup,
      angle: 45,
    },
    r = d.create(p),
    q = d.sample(r.state, p);
  assert.equal(p.mode, 0);
  assert.ok(
    Math.abs(q.second / q.first - 0.5) < 1e-12,
    "Malus-law reference is the light after the first filter",
  );
  assert.match(getProfile("bragg", "alevel").scope, /Bragg.*extensions/);
  assert.match(getProfile("buoyancy", "igcse").scope, /Archimedes.*AS/);
});
