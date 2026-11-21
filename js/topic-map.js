/** Topic-first navigation: level → topic → experiment, the same way for
 * IGCSE (split into Year 10 and Year 11), AS Level and A Level.
 * Ordering comes from the syllabus references already stored in each learning
 * profile, so no syllabus heading text is reproduced here. */
import { SIMULATIONS } from "./simulations.js";
import { availableModes, getProfile } from "./learning-paths.js";
import { IGCSE_AREAS, igcseArea, studyTitle } from "./study-policy.js";
import { TOPICS as ALEVEL_NAMES } from "./syllabus.js";

/** One "world" colour per backdrop scene: motion, thermal, waves, electricity, nuclear, space. */
const ACCENTS = ["#ff8a3c", "#ff4d7e", "#2ee6ff", "#ffe04a", "#86ff6b", "#a98bff"];
export const DEFAULT_ACCENT = ACCENTS[0];
const SCENES = [
  "A pendulum keeps time",
  "Particles in a box",
  "Two sources, one pattern",
  "Field lines between charges",
  "Alpha, beta and gamma tracks",
  "Planets in orbit",
];
/** Which backdrop scene (0–5) suits each 9702 topic, 1 to 25. */
const ALEVEL_SCENE = [0, 0, 0, 0, 0, 0, 2, 2, 3, 3, 4, 5, 5, 1, 1, 1, 0, 3, 3, 3, 3, 4, 4, 2, 5];
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** The one place that decides which IGCSE topics belong to which school year.
 * Schools differ; change the two lists here and every page follows. */
export const IGCSE_YEARS = [
  { label: "Year 10", topics: [1, 2, 3] },
  { label: "Year 11", topics: [4, 5, 6] },
];

export const LEVELS = [
  { key: "igcse", name: "IGCSE", course: "Cambridge IGCSE Physics 0625", mode: "igcse", groups: IGCSE_YEARS },
  { key: "as", name: "AS Level", course: "Cambridge AS Level Physics 9702", mode: "alevel", groups: [{ label: "", topics: range(1, 11) }] },
  { key: "a2", name: "A Level", course: "Cambridge A Level Physics 9702", mode: "alevel", groups: [{ label: "", topics: range(12, 25) }] },
];
export const levelByKey = (key) => LEVELS.find((l) => l.key === key) ?? null;

function makeTopic(level, group, number) {
  const igcse = level.key === "igcse", scene = igcse ? number - 1 : ALEVEL_SCENE[number - 1];
  return {
    level: level.key,
    mode: level.mode,
    group: group.label,
    number,
    name: igcse ? IGCSE_AREAS[number - 1] : ALEVEL_NAMES[number - 1].replace(/&/g, "and"),
    slug: igcse ? `topic-${number}` : `${level.key}-topic-${number}`,
    short: igcse ? ["Motion", "Thermal", "Waves", "Electricity", "Nuclear", "Space"][number - 1] : "",
    accent: ACCENTS[scene],
    sceneIndex: scene,
    scene: SCENES[scene],
  };
}
/** Every topic of every level, in level then syllabus order. */
export const ALL_TOPICS = LEVELS.flatMap((level) =>
  level.groups.flatMap((group) => group.topics.map((n) => makeTopic(level, group, n))));
/** The six IGCSE areas. The backdrop has one scene for each. */
export const TOPICS = ALL_TOPICS.filter((t) => t.level === "igcse");

export const levelTopics = (key) => ALL_TOPICS.filter((t) => t.level === key);
export const topicBySlug = (slug) => ALL_TOPICS.find((t) => t.slug === slug) ?? null;
const asTopic = (topic) => (typeof topic === "number" ? TOPICS[topic - 1] : topic);

/** Full-model categories that sit closest to each IGCSE area. */
const CATEGORY_TOPIC = {
  Mechanics: 1, Oscillations: 1, "Thermal physics": 2, Waves: 3, Optics: 3,
  Electricity: 4, Magnetism: 4, "Nuclear physics": 5, "Quantum physics": 5,
  "Space physics": 6, Astrophysics: 6,
};

/** "1.5.2" → [1, 5, 2] so that 1.10 would sort after 1.9. */
export const refKey = (ref) => String(ref).split(".").map(Number);
export function compareRefs(a, b) {
  const x = refKey(a), y = refKey(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

const has = (id, mode) => availableModes(id).includes(mode);
const isIGCSE = (id) => has(id, "igcse");

/** IGCSE area number (1–6) for any experiment, IGCSE or not. */
export function topicOf(id) {
  if (!Object.hasOwn(SIMULATIONS, id)) return null;
  if (isIGCSE(id)) return IGCSE_AREAS.indexOf(igcseArea(id)) + 1 || null;
  return CATEGORY_TOPIC[SIMULATIONS[id].category] ?? null;
}

/** Experiments of one topic in syllabus order. A bare number means an IGCSE
 * topic. An IGCSE experiment sits in the topic of its first reference; an
 * AS / A Level model appears under every topic it has a reference in. */
export function topicExperiments(topicOrNumber) {
  const topic = asTopic(topicOrNumber);
  if (!topic) return [];
  return Object.keys(SIMULATIONS)
    .filter((id) => has(id, topic.mode))
    .map((id) => {
      const profile = getProfile(id, topic.mode),
        refs = topic.mode === "igcse"
          ? (topicOf(id) === topic.number ? profile.refs : [])
          : profile.refs.filter((ref) => refKey(ref)[0] === topic.number).sort(compareRefs);
      return refs.length && {
        id,
        refs,
        title: studyTitle(id, topic.mode, SIMULATIONS[id].short),
        goals: profile.goals,
      };
    })
    .filter(Boolean)
    .sort((a, b) => compareRefs(a.refs[0], b.refs[0]) || a.title.localeCompare(b.title));
}

/** A Level and enrichment models related to an IGCSE area: the "go further" shelf. */
export function topicExtensions(topicOrNumber) {
  const topic = asTopic(topicOrNumber);
  if (!topic || topic.level !== "igcse") return [];
  return Object.keys(SIMULATIONS)
    .filter((id) => !isIGCSE(id) && topicOf(id) === topic.number)
    .map((id) => ({
      id,
      title: SIMULATIONS[id].short,
      level: has(id, "alevel") ? "A Level" : "Enrichment",
    }));
}

/** Models with no syllabus level at all. */
export function enrichmentExperiments() {
  return Object.keys(SIMULATIONS)
    .filter((id) => !isIGCSE(id) && !has(id, "alevel"))
    .map((id) => ({ id, title: SIMULATIONS[id].short }));
}

/** The topic a lab page belongs to in a study mode: for AS / A Level, the
 * topic of its first reference. */
export function labTopic(id, mode = "igcse") {
  if (!Object.hasOwn(SIMULATIONS, id) || !has(id, mode)) return null;
  if (mode === "igcse") return TOPICS[topicOf(id) - 1] ?? null;
  if (mode !== "alevel") return null;
  const number = refKey(getProfile(id, "alevel").refs[0] ?? "")[0];
  return ALL_TOPICS.find((t) => t.mode === "alevel" && t.number === number) ?? null;
}

/** Previous and next experiment inside the same topic, for lab-page stepping. */
export function topicNeighbours(id, mode = "igcse") {
  const topic = labTopic(id, mode);
  if (!topic) return { topic: null, number: topicOf(id), previous: null, next: null, index: -1, total: 0 };
  const list = topicExperiments(topic), index = list.findIndex((e) => e.id === id);
  return {
    topic,
    number: topic.number,
    index,
    total: list.length,
    previous: list[index - 1] ?? null,
    next: list[index + 1] ?? null,
  };
}

/** Previous and next topic inside the same level. */
export function adjacentTopics(topic) {
  const list = levelTopics(topic.level), index = list.indexOf(topic);
  return { previous: list[index - 1] ?? null, next: list[index + 1] ?? null };
}

/** Search used by the home page: every experiment, IGCSE titles first. */
export function searchExperiments(query, limit = 7) {
  const q = String(query).toLowerCase().trim();
  if (!q) return [];
  return Object.entries(SIMULATIONS)
    .map(([id, d]) => {
      const igcse = isIGCSE(id),
        title = igcse ? studyTitle(id, "igcse", d.short) : d.short,
        haystack = `${title} ${d.short} ${d.title} ${d.category} ${d.summary}`.toLowerCase(),
        lower = title.toLowerCase(), at = lower.indexOf(q),
        wordStart = lower.split(/[^a-z0-9]+/).some((word) => word.startsWith(q));
      if (!haystack.includes(q)) return null;
      // Start of the title, then start of a word in it ("len" finds lenses before
      // wavelength), then anywhere in the title, then the description.
      return { id, title, igcse, topic: topicOf(id), rank: at === 0 ? 0 : wordStart ? 1 : at > 0 ? 2 : 3 };
    })
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank || Number(b.igcse) - Number(a.igcse) || a.title.localeCompare(b.title))
    .slice(0, limit);
}
