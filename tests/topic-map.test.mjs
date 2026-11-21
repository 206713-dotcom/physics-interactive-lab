import test from "node:test";
import assert from "node:assert/strict";
import { SIMULATIONS } from "../js/simulations.js";
import { availableModes } from "../js/learning-paths.js";
import {
  TOPICS, ALL_TOPICS, LEVELS, IGCSE_YEARS, levelTopics, adjacentTopics, labTopic,
  enrichmentExperiments, compareRefs, topicOf, topicExperiments, topicExtensions,
  topicNeighbours, searchExperiments, topicBySlug,
} from "../js/topic-map.js";
import { getProfile } from "../js/learning-paths.js";
import { bounce, seeded, sceneFrame, dipoleLine } from "../js/field-backdrop.js";

test("there are six IGCSE topics with routable slugs and six-digit accents", () => {
  assert.equal(TOPICS.length, 6);
  TOPICS.forEach((t, i) => {
    assert.equal(t.number, i + 1);
    assert.equal(topicBySlug(t.slug), t);
    assert.match(t.accent, /^#[0-9a-f]{6}$/);
    assert.ok(!Object.hasOwn(SIMULATIONS, t.slug), "A topic route must not shadow an experiment.");
  });
  assert.equal(topicBySlug("pendulum"), null);
});

test("every IGCSE experiment appears in exactly one topic", () => {
  const listed = TOPICS.flatMap((t) => topicExperiments(t.number).map((e) => e.id)),
    igcse = Object.keys(SIMULATIONS).filter((id) => availableModes(id).includes("igcse"));
  assert.equal(new Set(listed).size, listed.length);
  assert.deepEqual([...listed].sort(), [...igcse].sort());
});

test("experiments inside a topic follow syllabus order and belong to it", () => {
  for (const t of TOPICS) {
    const list = topicExperiments(t.number);
    assert.ok(list.length > 0);
    list.forEach((e, i) => {
      assert.equal(Number(e.refs[0].split(".")[0]), t.number);
      if (i) assert.ok(compareRefs(list[i - 1].refs[0], e.refs[0]) <= 0);
    });
  }
});

test("section references compare numerically, not as text", () => {
  assert.ok(compareRefs("1.9", "1.10") < 0);
  assert.ok(compareRefs("1.5", "1.5.1") < 0);
  assert.equal(compareRefs("4.2.4", "4.2.4"), 0);
});

test("every experiment has a topic, and extensions never repeat IGCSE ones", () => {
  for (const id of Object.keys(SIMULATIONS)) assert.ok(topicOf(id) >= 1 && topicOf(id) <= 6, id);
  const extra = TOPICS.flatMap((t) => topicExtensions(t.number).map((e) => e.id));
  assert.ok(extra.every((id) => !availableModes(id).includes("igcse")));
  const igcseCount = TOPICS.reduce((n, t) => n + topicExperiments(t.number).length, 0);
  assert.equal(igcseCount + extra.length, Object.keys(SIMULATIONS).length);
});

test("previous and next walk a topic from end to end", () => {
  for (const t of TOPICS) {
    const list = topicExperiments(t.number);
    assert.equal(topicNeighbours(list[0].id).previous, null);
    assert.equal(topicNeighbours(list.at(-1).id).next, null);
    let id = list[0].id, seen = 1;
    while (topicNeighbours(id).next) {
      id = topicNeighbours(id).next.id;
      seen++;
    }
    assert.equal(seen, list.length);
  }
  assert.equal(topicNeighbours("gravity").index, -1);
});

test("search prefers word starts and returns nothing for an empty query", () => {
  assert.deepEqual(searchExperiments("  "), []);
  assert.equal(searchExperiments("len")[0].id, "lenses");
  assert.equal(searchExperiments("pendulum")[0].id, "pendulum");
  assert.ok(searchExperiments("zzzz").length === 0);
  assert.ok(searchExperiments("a", 4).length <= 4);
});

test("backdrop helpers stay inside their bounds", () => {
  for (let x = -50; x < 50; x += 0.37) {
    const b = bounce(x, 7);
    assert.ok(b >= 0 && b <= 7);
  }
  assert.equal(bounce(3, 7), 3);
  assert.equal(bounce(10, 7), 4);
  for (let i = 0; i < 200; i++) assert.ok(seeded(i, 3) >= 0 && seeded(i, 3) < 1);
  assert.equal(seeded(5, 2), seeded(5, 2));
  const wide = sceneFrame(1440, 900), phone = sceneFrame(390, 844);
  assert.ok(wide.cx > 1440 / 2 && phone.cx === 195);
});

test("a dipole field line leaves the positive charge and ends at the negative one", () => {
  const line = dipoleLine(0.4), [x0, y0] = line[0], [x1, y1] = line.at(-1);
  assert.ok(Math.hypot(x0 + 1, y0) < 0.1);
  assert.ok(Math.hypot(x1 - 1, y1) < 0.1);
  // A line that starts by heading away from the negative charge runs out of reach instead.
  const away = dipoleLine(Math.PI).at(-1);
  assert.ok(Math.hypot(away[0], away[1]) > 3.5);
});

test("IGCSE splits into Year 10 and Year 11 with every topic in exactly one year", () => {
  assert.deepEqual(IGCSE_YEARS.map((y) => y.label), ["Year 10", "Year 11"]);
  assert.deepEqual(IGCSE_YEARS.flatMap((y) => y.topics).sort(), [1, 2, 3, 4, 5, 6]);
  TOPICS.forEach((t) => assert.ok(IGCSE_YEARS.find((y) => y.label === t.group).topics.includes(t.number)));
});

test("AS Level is topics 1 to 11 and A Level is topics 12 to 25, with unique routes", () => {
  assert.deepEqual(LEVELS.map((l) => l.key), ["igcse", "as", "a2"]);
  assert.deepEqual(levelTopics("as").map((t) => t.number), Array.from({ length: 11 }, (_, i) => i + 1));
  assert.deepEqual(levelTopics("a2").map((t) => t.number), Array.from({ length: 14 }, (_, i) => i + 12));
  assert.equal(new Set(ALL_TOPICS.map((t) => t.slug)).size, ALL_TOPICS.length);
  for (const t of ALL_TOPICS) {
    assert.ok(t.name && !t.name.includes("&"));
    assert.ok(t.sceneIndex >= 0 && t.sceneIndex < 6);
    assert.ok(!Object.hasOwn(SIMULATIONS, t.slug));
  }
});

test("every AS / A Level model is listed under each topic it references, in order", () => {
  const alevel = Object.keys(SIMULATIONS).filter((id) => availableModes(id).includes("alevel"));
  for (const id of alevel)
    for (const ref of getProfile(id, "alevel").refs) {
      const topic = ALL_TOPICS.find((t) => t.mode === "alevel" && t.number === Number(ref.split(".")[0]));
      assert.ok(topicExperiments(topic).some((e) => e.id === id), `${id} missing from topic ${topic.number}`);
    }
  for (const t of [...levelTopics("as"), ...levelTopics("a2")]) {
    const list = topicExperiments(t);
    list.forEach((e, i) => i && assert.ok(compareRefs(list[i - 1].refs[0], e.refs[0]) <= 0));
  }
});

test("lab trails resolve per study mode and topics step inside their level", () => {
  assert.equal(labTopic("pendulum", "igcse").slug, "topic-1");
  assert.equal(labTopic("pendulum", "alevel").slug, "a2-topic-17");
  assert.equal(labTopic("binary", "enrichment"), null);
  assert.ok(topicNeighbours("gravity", "alevel").index >= 0);
  assert.equal(adjacentTopics(levelTopics("as")[0]).previous, null);
  assert.equal(adjacentTopics(levelTopics("as").at(-1)).next, null);
  assert.equal(adjacentTopics(TOPICS[2]).next, TOPICS[3]);
  assert.deepEqual(enrichmentExperiments().map((e) => e.id).sort(), ["binary", "doublependulum", "threebody"]);
});
